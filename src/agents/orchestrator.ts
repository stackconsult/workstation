import { 
  Task, 
  AgentStatus, 
  TaskPriority,
  LLMConfig 
} from '@/types';
import { 
  BaseAgent, 
  NavigatorAgent, 
  PlannerAgent, 
  ValidatorAgent, 
  ExecutorAgent,
  ExtractorAgent,
  AnalyzerAgent 
} from './base';
import { LLMProviderFactory } from '@/llm/providers';

export class AgentOrchestrator {
  private agents: Map<string, BaseAgent> = new Map();
  private taskQueue: Task[] = [];
  private activeTasks: Map<string, Task> = new Map();
  private completedTasks: Map<string, Task> = new Map();
  private llmConfig?: LLMConfig;

  constructor(llmConfig?: LLMConfig) {
    this.llmConfig = llmConfig;
    this.initializeAgents();
  }

  private initializeAgents(): void {
    const llmProvider = this.llmConfig 
      ? LLMProviderFactory.create(this.llmConfig)
      : undefined;

    this.agents.set('navigator', new NavigatorAgent(llmProvider));
    this.agents.set('planner', new PlannerAgent(llmProvider));
    this.agents.set('validator', new ValidatorAgent(llmProvider));
    this.agents.set('executor', new ExecutorAgent(llmProvider));
    this.agents.set('extractor', new ExtractorAgent(llmProvider));
    this.agents.set('analyzer', new AnalyzerAgent(llmProvider));
  }

  updateLLMConfig(config: LLMConfig): void {
    this.llmConfig = config;
    this.initializeAgents(); // Reinitialize with new config
  }

  async submitTask(task: Omit<Task, 'id' | 'status' | 'createdAt'>): Promise<string> {
    const fullTask: Task = {
      ...task,
      id: this.generateTaskId(),
      status: AgentStatus.IDLE,
      createdAt: new Date(),
    };

    this.taskQueue.push(fullTask);
    this.sortTaskQueue();
    
    // Start processing if not already running
    this.processNextTask();
    
    return fullTask.id;
  }

  private async processNextTask(): Promise<void> {
    if (this.taskQueue.length === 0) {
      return;
    }

    const task = this.taskQueue.shift()!;
    this.activeTasks.set(task.id, task);

    try {
      const agent = this.selectAgent(task);
      if (!agent) {
        throw new Error(`No suitable agent found for task type: ${task.type}`);
      }

      task.status = AgentStatus.EXECUTING;
      task.startedAt = new Date();
      task.assignedAgentId = agent.getConfig().id;

      const result = await agent.execute(task);

      task.status = AgentStatus.COMPLETED;
      task.completedAt = new Date();
      task.output = result;

      this.activeTasks.delete(task.id);
      this.completedTasks.set(task.id, task);

      // Notify listeners
      this.notifyTaskComplete(task);

    } catch (error) {
      task.status = AgentStatus.FAILED;
      task.error = error instanceof Error ? error.message : String(error);
      task.completedAt = new Date();
      
      this.activeTasks.delete(task.id);
      this.completedTasks.set(task.id, task);

      this.notifyTaskFailed(task);
    }

    // Process next task
    this.processNextTask();
  }

  private selectAgent(task: Task): BaseAgent | null {
    // Simple selection based on task type
    // In production, this would be more sophisticated
    const agentMap: Record<string, string> = {
      'navigate': 'navigator',
      'plan': 'planner',
      'validate': 'validator',
      'execute': 'executor',
      'extract': 'extractor',
      'analyze': 'analyzer',
    };

    const agentId = agentMap[task.type];
    return agentId ? this.agents.get(agentId) || null : null;
  }

  private sortTaskQueue(): void {
    const priorityOrder = {
      [TaskPriority.URGENT]: 0,
      [TaskPriority.HIGH]: 1,
      [TaskPriority.MEDIUM]: 2,
      [TaskPriority.LOW]: 3,
    };

    this.taskQueue.sort((a, b) => {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getTask(taskId: string): Task | null {
    return this.activeTasks.get(taskId) || 
           this.completedTasks.get(taskId) || 
           this.taskQueue.find(t => t.id === taskId) || 
           null;
  }

  getActiveTasks(): Task[] {
    return Array.from(this.activeTasks.values());
  }

  getCompletedTasks(): Task[] {
    return Array.from(this.completedTasks.values());
  }

  getPendingTasks(): Task[] {
    return [...this.taskQueue];
  }

  getAgents(): BaseAgent[] {
    return Array.from(this.agents.values());
  }

  getAgent(agentId: string): BaseAgent | null {
    return this.agents.get(agentId) || null;
  }

  private notifyTaskComplete(task: Task): void {
    // Send message to extension components
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({
        type: 'TASK_COMPLETE',
        payload: task,
      }).catch(() => {
        // Ignore errors if no listeners
      });
    }
  }

  private notifyTaskFailed(task: Task): void {
    // Send message to extension components
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({
        type: 'TASK_FAILED',
        payload: task,
      }).catch(() => {
        // Ignore errors if no listeners
      });
    }
  }

  async processCommand(command: string, context?: any): Promise<any> {
    // Natural language command processing
    // First, use planner to understand the command
    const planTask = await this.submitTask({
      type: 'plan',
      description: command,
      priority: TaskPriority.HIGH,
      input: { context },
    });

    // Wait for plan to complete
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        const task = this.getTask(planTask);
        if (task?.status === AgentStatus.COMPLETED) {
          clearInterval(checkInterval);
          resolve(task.output);
        } else if (task?.status === AgentStatus.FAILED) {
          clearInterval(checkInterval);
          reject(new Error(task.error || 'Task failed'));
        }
      }, 100);

      // Timeout after 30 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error('Task timeout'));
      }, 30000);
    });
  }
}

// Singleton instance
let orchestratorInstance: AgentOrchestrator | null = null;

export function getOrchestrator(): AgentOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new AgentOrchestrator();
  }
  return orchestratorInstance;
}

export function initializeOrchestrator(llmConfig: LLMConfig): AgentOrchestrator {
  orchestratorInstance = new AgentOrchestrator(llmConfig);
  return orchestratorInstance;
}
