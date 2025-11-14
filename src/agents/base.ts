import { AgentConfig, AgentStatus, AgentType, Task, LLMMessage } from '@/types';
import { BaseLLMProvider } from '@/llm/providers';

export abstract class BaseAgent {
  protected config: AgentConfig;
  protected status: AgentStatus = AgentStatus.IDLE;
  protected llmProvider?: BaseLLMProvider;

  constructor(config: AgentConfig, llmProvider?: BaseLLMProvider) {
    this.config = config;
    this.llmProvider = llmProvider;
  }

  abstract execute(task: Task): Promise<any>;

  getStatus(): AgentStatus {
    return this.status;
  }

  setStatus(status: AgentStatus): void {
    this.status = status;
  }

  getConfig(): AgentConfig {
    return this.config;
  }

  protected async think(prompt: string, context?: string): Promise<string> {
    if (!this.llmProvider) {
      throw new Error('LLM provider not configured');
    }

    const messages: LLMMessage[] = [];
    
    if (this.config.systemPrompt) {
      messages.push({
        role: 'system',
        content: this.config.systemPrompt,
      });
    }

    if (context) {
      messages.push({
        role: 'user',
        content: `Context: ${context}`,
      });
    }

    messages.push({
      role: 'user',
      content: prompt,
    });

    this.setStatus(AgentStatus.THINKING);
    const response = await this.llmProvider.chat(messages);
    return response.content;
  }
}

export class NavigatorAgent extends BaseAgent {
  constructor(llmProvider?: BaseLLMProvider) {
    super(
      {
        id: 'navigator',
        type: AgentType.NAVIGATOR,
        name: 'Navigator Agent',
        description: 'Navigates web pages and understands page structure',
        capabilities: ['navigate', 'find-elements', 'understand-layout'],
        systemPrompt: `You are a web navigation expert. Your role is to understand web page structures, 
        identify elements, and plan navigation strategies. You can analyze DOM structure and provide 
        guidance on how to interact with web pages.`,
      },
      llmProvider
    );
  }

  async execute(task: Task): Promise<any> {
    this.setStatus(AgentStatus.EXECUTING);
    
    try {
      const pageContext = task.input.pageContext || '';
      const instruction = task.input.instruction || task.description;
      
      const plan = await this.think(
        `Given this instruction: "${instruction}", analyze the page and create a navigation plan.`,
        pageContext
      );

      this.setStatus(AgentStatus.COMPLETED);
      return { plan, type: 'navigation' };
    } catch (error) {
      this.setStatus(AgentStatus.FAILED);
      throw error;
    }
  }
}

export class PlannerAgent extends BaseAgent {
  constructor(llmProvider?: BaseLLMProvider) {
    super(
      {
        id: 'planner',
        type: AgentType.PLANNER,
        name: 'Planner Agent',
        description: 'Creates execution plans for complex tasks',
        capabilities: ['task-decomposition', 'strategy-planning', 'workflow-design'],
        systemPrompt: `You are a strategic planning expert. Your role is to break down complex tasks 
        into actionable steps, coordinate between different agents, and ensure tasks are executed efficiently. 
        Always provide clear, step-by-step plans with contingencies.`,
      },
      llmProvider
    );
  }

  async execute(task: Task): Promise<any> {
    this.setStatus(AgentStatus.EXECUTING);
    
    try {
      const taskDescription = task.description;
      const context = task.input.context || '';
      
      const plan = await this.think(
        `Create a detailed execution plan for: "${taskDescription}". Break it into specific, actionable steps.`,
        context
      );

      this.setStatus(AgentStatus.COMPLETED);
      return { 
        plan, 
        steps: this.parseSteps(plan),
        type: 'execution-plan' 
      };
    } catch (error) {
      this.setStatus(AgentStatus.FAILED);
      throw error;
    }
  }

  private parseSteps(plan: string): string[] {
    // Simple parsing - in production would be more sophisticated
    return plan.split('\n')
      .filter(line => line.trim().match(/^\d+\.|^-|^\*/))
      .map(line => line.replace(/^\d+\.|^-|^\*/, '').trim());
  }
}

export class ValidatorAgent extends BaseAgent {
  constructor(llmProvider?: BaseLLMProvider) {
    super(
      {
        id: 'validator',
        type: AgentType.VALIDATOR,
        name: 'Validator Agent',
        description: 'Validates results and ensures quality',
        capabilities: ['result-validation', 'quality-check', 'error-detection'],
        systemPrompt: `You are a quality assurance expert. Your role is to validate results, 
        check for errors, and ensure that tasks have been completed correctly. Be thorough and 
        identify any issues or inconsistencies.`,
      },
      llmProvider
    );
  }

  async execute(task: Task): Promise<any> {
    this.setStatus(AgentStatus.EXECUTING);
    
    try {
      const result = task.input.result;
      const expectedOutcome = task.input.expectedOutcome || '';
      
      const validation = await this.think(
        `Validate this result: ${JSON.stringify(result)}. Expected outcome: ${expectedOutcome}`,
      );

      const isValid = !validation.toLowerCase().includes('invalid') && 
                      !validation.toLowerCase().includes('error') &&
                      !validation.toLowerCase().includes('failed');

      this.setStatus(AgentStatus.COMPLETED);
      return { 
        isValid,
        validation,
        type: 'validation-result' 
      };
    } catch (error) {
      this.setStatus(AgentStatus.FAILED);
      throw error;
    }
  }
}

export class ExecutorAgent extends BaseAgent {
  constructor(llmProvider?: BaseLLMProvider) {
    super(
      {
        id: 'executor',
        type: AgentType.EXECUTOR,
        name: 'Executor Agent',
        description: 'Executes browser automation tasks',
        capabilities: ['click', 'type', 'extract', 'screenshot'],
        systemPrompt: `You are a browser automation expert. Your role is to execute specific 
        browser actions precisely and report results accurately. Focus on reliable execution.`,
      },
      llmProvider
    );
  }

  async execute(task: Task): Promise<any> {
    this.setStatus(AgentStatus.EXECUTING);
    
    try {
      const action = task.input.action;
      
      // This would integrate with the automation layer
      // For now, return a structured response
      const result = {
        action,
        executed: true,
        timestamp: new Date().toISOString(),
      };

      this.setStatus(AgentStatus.COMPLETED);
      return result;
    } catch (error) {
      this.setStatus(AgentStatus.FAILED);
      throw error;
    }
  }
}

export class ExtractorAgent extends BaseAgent {
  constructor(llmProvider?: BaseLLMProvider) {
    super(
      {
        id: 'extractor',
        type: AgentType.EXTRACTOR,
        name: 'Extractor Agent',
        description: 'Extracts and structures data from web pages',
        capabilities: ['data-extraction', 'content-parsing', 'structured-output'],
        systemPrompt: `You are a data extraction expert. Your role is to extract relevant 
        information from web pages and structure it in a useful format. Be precise and comprehensive.`,
      },
      llmProvider
    );
  }

  async execute(task: Task): Promise<any> {
    this.setStatus(AgentStatus.EXECUTING);
    
    try {
      const content = task.input.content || '';
      const extractionGoal = task.description;
      
      const extracted = await this.think(
        `Extract information according to: "${extractionGoal}". Provide structured data.`,
        content
      );

      this.setStatus(AgentStatus.COMPLETED);
      return {
        extracted,
        type: 'extracted-data',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.setStatus(AgentStatus.FAILED);
      throw error;
    }
  }
}

export class AnalyzerAgent extends BaseAgent {
  constructor(llmProvider?: BaseLLMProvider) {
    super(
      {
        id: 'analyzer',
        type: AgentType.ANALYZER,
        name: 'Analyzer Agent',
        description: 'Analyzes data and provides insights',
        capabilities: ['data-analysis', 'pattern-recognition', 'insights'],
        systemPrompt: `You are a data analysis expert. Your role is to analyze information, 
        identify patterns, and provide meaningful insights. Be analytical and thorough.`,
      },
      llmProvider
    );
  }

  async execute(task: Task): Promise<any> {
    this.setStatus(AgentStatus.EXECUTING);
    
    try {
      const data = task.input.data;
      const analysisGoal = task.description;
      
      const analysis = await this.think(
        `Analyze this data according to: "${analysisGoal}".`,
        JSON.stringify(data)
      );

      this.setStatus(AgentStatus.COMPLETED);
      return {
        analysis,
        type: 'analysis-result',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.setStatus(AgentStatus.FAILED);
      throw error;
    }
  }
}
