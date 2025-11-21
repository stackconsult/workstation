/**
 * LLM Service Type Definitions
 * Types for LLM integration with workflow generation and agent selection
 */

export interface LLMConfig {
  enabled: boolean;
  provider: 'openai' | 'anthropic' | 'local' | 'ollama' | 'lmstudio';
  apiKey?: string;
  model: string;
  temperature: number;
  maxTokens: number;
  timeout: number;
}

export interface WorkflowGenerationRequest {
  prompt: string;
  context?: {
    availableAgents?: string[];
    userPreferences?: Record<string, any>;
    examples?: any[];
  };
}

export interface WorkflowGenerationResponse {
  workflow: {
    name: string;
    description: string;
    tasks: Array<{
      name: string;
      agent_type: string;
      action: string;
      parameters: Record<string, any>;
      depends_on?: string[];
    }>;
    variables?: Record<string, any>;
    on_error?: 'stop' | 'continue' | 'retry';
  };
  confidence: number;
  explanation: string;
  alternatives?: any[];
}

export interface AgentSelectionRequest {
  task: string;
  parameters?: Record<string, any>;
  context?: {
    availableAgents?: Array<{
      type: string;
      capabilities: string[];
    }>;
    workflowContext?: Record<string, any>;
  };
}

export interface AgentSelectionResponse {
  agentType: string;
  action: string;
  confidence: number;
  reasoning: string;
  alternatives?: Array<{
    agentType: string;
    action: string;
    confidence: number;
  }>;
}

export interface ErrorRecoveryRequest {
  error: {
    code: string;
    message: string;
    context?: Record<string, any>;
  };
  workflow?: any;
  taskHistory?: any[];
}

export interface ErrorRecoveryResponse {
  suggestions: Array<{
    type: 'retry' | 'modify' | 'skip' | 'alternative';
    description: string;
    parameters?: Record<string, any>;
    confidence: number;
  }>;
  explanation: string;
  autoApplicable: boolean;
}

export interface WorkflowOptimizationRequest {
  workflow: any;
  metrics?: {
    executionTime?: number;
    resourceUsage?: Record<string, any>;
    errorRate?: number;
  };
}

export interface WorkflowOptimizationResponse {
  optimizedWorkflow?: any;
  suggestions: Array<{
    type: 'parallelization' | 'caching' | 'simplification' | 'error-handling';
    description: string;
    impact: 'high' | 'medium' | 'low';
    confidence: number;
  }>;
  expectedImprovement: {
    executionTime?: string;
    resourceUsage?: string;
    reliability?: string;
  };
}

export interface LLMHealthStatus {
  status: 'healthy' | 'degraded' | 'offline';
  provider: string;
  model: string;
  apiKeyConfigured: boolean;
  lastSuccessfulCall?: string;
  lastError?: string;
  errorRate: number;
  averageLatency: number;
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMCompletionRequest {
  messages: LLMMessage[];
  temperature?: number;
  maxTokens?: number;
  stop?: string[];
}

export interface LLMCompletionResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  finishReason: 'stop' | 'length' | 'content_filter' | 'error';
}
