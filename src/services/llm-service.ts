/**
 * LLM Integration Service
 * Provides AI-powered workflow generation, agent selection, and optimization
 */

import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger';
import {
  LLMConfig,
  LLMCompletionRequest,
  LLMCompletionResponse,
  WorkflowGenerationRequest,
  WorkflowGenerationResponse,
  AgentSelectionRequest,
  AgentSelectionResponse,
  ErrorRecoveryRequest,
  ErrorRecoveryResponse,
  WorkflowOptimizationRequest,
  WorkflowOptimizationResponse,
  LLMHealthStatus
} from '../types/llm';

/**
 * LLM Service for AI-powered workflow automation
 */
export class LLMService {
  private config: LLMConfig;
  private client: AxiosInstance;
  private healthStats: {
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    lastSuccessfulCall?: Date;
    lastError?: string;
    latencies: number[];
  };

  constructor(config?: Partial<LLMConfig>) {
    this.config = {
      enabled: process.env.LLM_ENABLED === 'true',
      provider: (process.env.LLM_PROVIDER as any) || 'openai',
      apiKey: process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY,
      model: process.env.LLM_MODEL || 'gpt-4',
      temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.7'),
      maxTokens: parseInt(process.env.LLM_MAX_TOKENS || '2000'),
      timeout: 30000,
      ...config
    };

    this.healthStats = {
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      latencies: []
    };

    this.client = this.createClient();
    logger.info('LLM Service initialized', { provider: this.config.provider, enabled: this.config.enabled });
  }

  /**
   * Create HTTP client for LLM provider
   */
  private createClient(): AxiosInstance {
    const baseURL = this.getProviderBaseURL();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (this.config.provider === 'openai' && this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    } else if (this.config.provider === 'anthropic' && this.config.apiKey) {
      headers['x-api-key'] = this.config.apiKey;
      headers['anthropic-version'] = '2023-06-01';
    }

    return axios.create({
      baseURL,
      headers,
      timeout: this.config.timeout
    });
  }

  /**
   * Get provider base URL
   */
  private getProviderBaseURL(): string {
    switch (this.config.provider) {
      case 'openai':
        return 'https://api.openai.com/v1';
      case 'anthropic':
        return 'https://api.anthropic.com/v1';
      case 'ollama':
        return process.env.OLLAMA_URL || 'http://localhost:11434/api';
      case 'lmstudio':
        return process.env.LMSTUDIO_URL || 'http://localhost:1234/v1';
      case 'local':
        return process.env.LOCAL_LLM_URL || 'http://localhost:8000';
      default:
        throw new Error(`Unsupported LLM provider: ${this.config.provider}`);
    }
  }

  /**
   * Generic completion request to LLM
   */
  async complete(request: LLMCompletionRequest): Promise<LLMCompletionResponse> {
    if (!this.config.enabled) {
      throw new Error('LLM service is disabled');
    }

    if (!this.config.apiKey && this.config.provider !== 'ollama' && this.config.provider !== 'local') {
      throw new Error(`API key not configured for provider: ${this.config.provider}`);
    }

    const startTime = Date.now();
    this.healthStats.totalCalls++;

    try {
      const response = await this.makeProviderRequest(request);
      
      const latency = Date.now() - startTime;
      this.healthStats.successfulCalls++;
      this.healthStats.lastSuccessfulCall = new Date();
      this.healthStats.latencies.push(latency);
      if (this.healthStats.latencies.length > 100) {
        this.healthStats.latencies.shift();
      }

      logger.info('LLM completion successful', { latency, provider: this.config.provider });
      return response;
    } catch (error: any) {
      this.healthStats.failedCalls++;
      this.healthStats.lastError = error.message;
      logger.error('LLM completion failed', { error: error.message, provider: this.config.provider });
      throw error;
    }
  }

  /**
   * Make provider-specific API request
   */
  private async makeProviderRequest(request: LLMCompletionRequest): Promise<LLMCompletionResponse> {
    switch (this.config.provider) {
      case 'openai':
        return this.openAICompletion(request);
      case 'anthropic':
        return this.anthropicCompletion(request);
      case 'ollama':
      case 'lmstudio':
      case 'local':
        return this.localCompletion(request);
      default:
        throw new Error(`Unsupported provider: ${this.config.provider}`);
    }
  }

  /**
   * OpenAI API completion
   */
  private async openAICompletion(request: LLMCompletionRequest): Promise<LLMCompletionResponse> {
    const response = await this.client.post('/chat/completions', {
      model: this.config.model,
      messages: request.messages,
      temperature: request.temperature ?? this.config.temperature,
      max_tokens: request.maxTokens ?? this.config.maxTokens,
      stop: request.stop
    });

    const choice = response.data.choices[0];
    return {
      content: choice.message.content,
      usage: {
        promptTokens: response.data.usage.prompt_tokens,
        completionTokens: response.data.usage.completion_tokens,
        totalTokens: response.data.usage.total_tokens
      },
      model: response.data.model,
      finishReason: choice.finish_reason
    };
  }

  /**
   * Anthropic API completion
   */
  private async anthropicCompletion(request: LLMCompletionRequest): Promise<LLMCompletionResponse> {
    const response = await this.client.post('/messages', {
      model: this.config.model,
      max_tokens: request.maxTokens ?? this.config.maxTokens,
      messages: request.messages.filter(m => m.role !== 'system'),
      system: request.messages.find(m => m.role === 'system')?.content,
      temperature: request.temperature ?? this.config.temperature,
      stop_sequences: request.stop
    });

    return {
      content: response.data.content[0].text,
      usage: {
        promptTokens: response.data.usage.input_tokens,
        completionTokens: response.data.usage.output_tokens,
        totalTokens: response.data.usage.input_tokens + response.data.usage.output_tokens
      },
      model: response.data.model,
      finishReason: response.data.stop_reason
    };
  }

  /**
   * Local/Ollama API completion
   * Note: Local models often don't provide token usage metrics,
   * so we return zero values. Actual token counting would require
   * implementing a tokenizer for the specific model being used.
   */
  private async localCompletion(request: LLMCompletionRequest): Promise<LLMCompletionResponse> {
    const response = await this.client.post('/chat/completions', {
      model: this.config.model,
      messages: request.messages,
      temperature: request.temperature ?? this.config.temperature,
      max_tokens: request.maxTokens ?? this.config.maxTokens
    });

    return {
      content: response.data.choices[0].message.content,
      usage: {
        // Local models typically don't return token counts
        // TODO: Implement tokenizer for accurate counting if needed
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0
      },
      model: this.config.model,
      finishReason: 'stop'
    };
  }

  /**
   * Generate workflow from natural language description
   */
  async generateWorkflow(request: WorkflowGenerationRequest): Promise<WorkflowGenerationResponse> {
    const systemPrompt = `You are an expert workflow automation architect. Generate JSON workflow definitions from natural language descriptions.

Available agents and their capabilities:
- browser: Navigate, click, type, extract data, screenshot
- csv: Read/write CSV files, parse data
- json: Parse, query, merge JSON data
- excel: Read/write Excel files
- pdf: Extract text, generate PDFs
- email: Send/receive emails
- sheets: Google Sheets integration
- calendar: Google Calendar integration
- database: SQL queries, insert/update
- s3: Upload/download files from S3
- file: Read/write local files

Respond with ONLY valid JSON in this format:
{
  "name": "Workflow Name",
  "description": "What the workflow does",
  "tasks": [
    {
      "name": "unique-task-id",
      "agent_type": "browser",
      "action": "navigate",
      "parameters": { "url": "https://example.com" },
      "depends_on": ["previous-task-id"]
    }
  ],
  "variables": {},
  "on_error": "stop"
}`;

    const userPrompt = `Generate a workflow for: ${request.prompt}

${request.context?.availableAgents ? `Available agents: ${request.context.availableAgents.join(', ')}` : ''}`;

    const completion = await this.complete({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3 // Lower temperature for more deterministic output
    });

    try {
      const parsed = JSON.parse(completion.content);
      return {
        workflow: parsed,
        confidence: 0.85,
        explanation: `Generated workflow with ${parsed.tasks?.length || 0} tasks`,
        alternatives: []
      };
    } catch (error) {
      logger.error('Failed to parse LLM workflow response', { content: completion.content });
      throw new Error('Invalid workflow JSON from LLM');
    }
  }

  /**
   * Select appropriate agent for a task
   */
  async selectAgent(request: AgentSelectionRequest): Promise<AgentSelectionResponse> {
    const systemPrompt = `You are an expert at selecting the right automation agent for tasks.

Available agents:
- browser: Web automation, scraping, interaction
- csv: CSV file operations
- excel: Excel file operations
- pdf: PDF operations
- json: JSON data manipulation
- database: Database operations
- email: Email automation
- file: File system operations
- s3: Cloud storage

Respond with ONLY valid JSON:
{
  "agentType": "browser",
  "action": "navigate",
  "confidence": 0.95,
  "reasoning": "Browser agent is best because..."
}`;

    const completion = await this.complete({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Task: ${request.task}\nParameters: ${JSON.stringify(request.parameters)}` }
      ],
      temperature: 0.2
    });

    return JSON.parse(completion.content);
  }

  /**
   * Suggest error recovery strategies
   */
  async suggestErrorRecovery(request: ErrorRecoveryRequest): Promise<ErrorRecoveryResponse> {
    const systemPrompt = `You are an expert at diagnosing and recovering from automation errors.

Common errors and solutions:
- SELECTOR_NOT_FOUND: Try alternative selectors, wait longer, check page loaded
- TIMEOUT: Increase timeout, check network, verify element exists
- NETWORK_ERROR: Retry with exponential backoff
- AUTHENTICATION_FAILED: Refresh credentials, check permissions

Respond with ONLY valid JSON:
{
  "suggestions": [
    {
      "type": "retry",
      "description": "Try with longer timeout",
      "parameters": { "timeout": 10000 },
      "confidence": 0.8
    }
  ],
  "explanation": "The error likely occurred because...",
  "autoApplicable": true
}`;

    const completion = await this.complete({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Error: ${JSON.stringify(request.error)}` }
      ]
    });

    return JSON.parse(completion.content);
  }

  /**
   * Optimize workflow for better performance
   */
  async optimizeWorkflow(request: WorkflowOptimizationRequest): Promise<WorkflowOptimizationResponse> {
    const systemPrompt = `You are an expert at optimizing automation workflows.

Optimization strategies:
- Parallelization: Run independent tasks in parallel
- Caching: Cache frequently accessed data
- Error handling: Add retry logic, fallback strategies
- Simplification: Remove redundant steps

Respond with ONLY valid JSON with suggestions.`;

    const completion = await this.complete({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Workflow: ${JSON.stringify(request.workflow)}` }
      ]
    });

    return JSON.parse(completion.content);
  }

  /**
   * Get health status
   */
  getHealthStatus(): LLMHealthStatus {
    const errorRate = this.healthStats.totalCalls > 0
      ? this.healthStats.failedCalls / this.healthStats.totalCalls
      : 0;

    const averageLatency = this.healthStats.latencies.length > 0
      ? this.healthStats.latencies.reduce((a, b) => a + b, 0) / this.healthStats.latencies.length
      : 0;

    return {
      status: this.config.enabled && this.config.apiKey ? 'healthy' : 'offline',
      provider: this.config.provider,
      model: this.config.model,
      apiKeyConfigured: !!this.config.apiKey,
      lastSuccessfulCall: this.healthStats.lastSuccessfulCall?.toISOString(),
      lastError: this.healthStats.lastError,
      errorRate,
      averageLatency
    };
  }

  /**
   * Check if service is available
   */
  isAvailable(): boolean {
    const localProviders = ['ollama', 'lmstudio', 'local'];
    return this.config.enabled && (!!this.config.apiKey || localProviders.includes(this.config.provider));
  }
}

// Singleton instance
export const llmService = new LLMService();
