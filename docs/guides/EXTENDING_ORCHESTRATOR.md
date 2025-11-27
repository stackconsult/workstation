# Extending the Orchestrator Guide

## Overview

This guide explains how to extend the Workstation orchestration engine to add custom workflow execution patterns, scheduling algorithms, and advanced automation capabilities.

## Orchestrator Architecture

### Core Components

The orchestration system consists of several key components:

```
┌──────────────────────────────────────────────────────────────┐
│                    Orchestration Engine                      │
│                                                              │
│  ┌────────────────┐  ┌────────────────┐  ┌───────────────┐ │
│  │ Workflow       │  │  Task          │  │  Execution    │ │
│  │ Manager        │  │  Scheduler     │  │  Monitor      │ │
│  └────────────────┘  └────────────────┘  └───────────────┘ │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│                    Parallel Engine                           │
│                                                              │
│  ┌────────────────┐  ┌────────────────┐  ┌───────────────┐ │
│  │ DAG Builder    │  │  Dependency    │  │  Task Pool    │ │
│  │                │  │  Resolver      │  │  Manager      │ │
│  └────────────────┘  └────────────────┘  └───────────────┘ │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│                 Workflow Dependencies                        │
│                                                              │
│  ┌────────────────┐  ┌────────────────┐  ┌───────────────┐ │
│  │ Workflow       │  │  Version       │  │  Conditional  │ │
│  │ Chaining       │  │  Manager       │  │  Triggers     │ │
│  └────────────────┘  └────────────────┘  └───────────────┘ │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│                      Agent Registry                          │
└──────────────────────────────────────────────────────────────┘
```

### Key Files

- `src/automation/orchestrator/engine.ts` - Main orchestration engine
- `src/automation/orchestrator/parallel-engine.ts` - Parallel execution engine
- `src/automation/orchestrator/workflow-dependencies.ts` - Workflow chaining
- `src/services/workflow.ts` - Workflow service layer
- `src/services/orchestration.ts` - Orchestration service

## Adding Custom Execution Strategies

### 1. Create a Custom Execution Strategy

Create `src/automation/orchestrator/strategies/priority-scheduler.ts`:

```typescript
import { ErrorHandler } from '../../../utils/error-handler';

export interface Task {
  id: string;
  name: string;
  priority?: number;
  dependencies?: string[];
  agent_type: string;
  action: string;
  parameters: any;
}

export interface ExecutionContext {
  workflowId: string;
  variables: Record<string, any>;
  executionId: string;
}

export class PriorityScheduler {
  /**
   * Execute tasks based on priority
   * Higher priority tasks execute first within their dependency level
   */
  async executeTasks(
    tasks: Task[],
    context: ExecutionContext,
    executor: (task: Task) => Promise<any>
  ): Promise<Map<string, any>> {
    const results = new Map<string, any>();
    const completed = new Set<string>();
    const failed = new Set<string>();

    // Sort tasks by priority (higher first)
    const sortedTasks = [...tasks].sort((a, b) => {
      const priorityA = a.priority || 0;
      const priorityB = b.priority || 0;
      return priorityB - priorityA;
    });

    // Execute tasks respecting dependencies and priority
    while (completed.size + failed.size < tasks.length) {
      const readyTasks = sortedTasks.filter((task) => {
        // Skip if already completed or failed
        if (completed.has(task.id) || failed.has(task.id)) {
          return false;
        }

        // Check if all dependencies are met
        const deps = task.dependencies || [];
        return deps.every((depId) => completed.has(depId));
      });

      if (readyTasks.length === 0) {
        // No more tasks can run - check if we're stuck
        if (completed.size + failed.size < tasks.length) {
          throw ErrorHandler.internalError(
            'Circular dependency or missing task detected'
          );
        }
        break;
      }

      // Execute ready tasks (highest priority first)
      for (const task of readyTasks) {
        try {
          const result = await executor(task);
          results.set(task.id, result);
          completed.add(task.id);
        } catch (error) {
          console.error(`Task ${task.id} failed:`, error);
          failed.add(task.id);
          
          // Optionally fail fast
          if (task.priority && task.priority >= 10) {
            throw error;
          }
        }
      }
    }

    return results;
  }

  /**
   * Estimate execution time based on task priorities and dependencies
   */
  estimateExecutionTime(tasks: Task[]): number {
    // Group tasks by dependency level
    const levels = this.groupByDependencyLevel(tasks);
    
    // Estimate time per level (high priority = faster)
    let totalTime = 0;
    for (const level of levels) {
      const avgPriority = level.reduce((sum, t) => sum + (t.priority || 1), 0) / level.length;
      const levelTime = 1000 / avgPriority; // Inverse relationship
      totalTime += levelTime;
    }
    
    return totalTime;
  }

  private groupByDependencyLevel(tasks: Task[]): Task[][] {
    const levels: Task[][] = [];
    const completed = new Set<string>();

    while (completed.size < tasks.length) {
      const currentLevel = tasks.filter((task) => {
        if (completed.has(task.id)) return false;
        const deps = task.dependencies || [];
        return deps.every((depId) => completed.has(depId));
      });

      if (currentLevel.length === 0) break;
      
      currentLevel.forEach((task) => completed.add(task.id));
      levels.push(currentLevel);
    }

    return levels;
  }
}

export const priorityScheduler = new PriorityScheduler();
```

### 2. Integrate with Orchestration Engine

Update `src/automation/orchestrator/engine.ts`:

```typescript
import { priorityScheduler } from './strategies/priority-scheduler';

export class OrchestrationEngine {
  // ... existing code

  async executeWithPriority(
    workflow: Workflow,
    options?: {
      strategy?: 'priority' | 'sequential' | 'parallel';
    }
  ): Promise<ExecutionResult> {
    const strategy = options?.strategy || 'sequential';

    if (strategy === 'priority') {
      // Use priority scheduler
      const results = await priorityScheduler.executeTasks(
        workflow.definition.tasks,
        {
          workflowId: workflow.id,
          variables: workflow.definition.variables || {},
          executionId: this.generateExecutionId(),
        },
        async (task) => {
          // Execute task using agent registry
          return await this.executeTask(task);
        }
      );

      return {
        status: 'completed',
        results: Array.from(results.values()),
        execution_time: Date.now() - startTime,
      };
    }

    // Fall back to existing strategies
    return this.executeWorkflow(workflow);
  }
}
```

## Adding Custom Workflow Patterns

### 1. Create a Conditional Execution Pattern

Create `src/automation/orchestrator/patterns/conditional-execution.ts`:

```typescript
import { ErrorHandler } from '../../../utils/error-handler';

export interface ConditionalTask {
  id: string;
  condition: string; // JavaScript expression
  thenTasks: string[]; // Task IDs to execute if true
  elseTasks?: string[]; // Task IDs to execute if false
}

export class ConditionalExecutionPattern {
  /**
   * Execute tasks based on conditions
   */
  async execute(
    conditionalTask: ConditionalTask,
    context: {
      variables: Record<string, any>;
      taskResults: Map<string, any>;
    },
    executor: (taskId: string) => Promise<any>
  ): Promise<any> {
    // Evaluate condition safely
    const conditionResult = this.evaluateCondition(
      conditionalTask.condition,
      context
    );

    // Execute appropriate branch
    const tasksToExecute = conditionResult
      ? conditionalTask.thenTasks
      : conditionalTask.elseTasks || [];

    const results: any[] = [];
    for (const taskId of tasksToExecute) {
      try {
        const result = await executor(taskId);
        results.push(result);
      } catch (error) {
        console.error(`Conditional task ${taskId} failed:`, error);
        throw error;
      }
    }

    return {
      condition: conditionalTask.condition,
      conditionResult,
      branch: conditionResult ? 'then' : 'else',
      results,
    };
  }

  /**
   * Safely evaluate a condition expression
   * 
   * WARNING: This is a simplified example for demonstration.
   * In production, use a safer expression evaluator like:
   * - expr-eval library
   * - mathjs for mathematical expressions
   * - jsonpath for data queries
   * - A custom parser with limited operations
   */
  private evaluateCondition(
    condition: string,
    context: {
      variables: Record<string, any>;
      taskResults: Map<string, any>;
    }
  ): boolean {
    try {
      // SECURITY WARNING: Function constructor and 'with' can be dangerous
      // This is for demonstration only. Use a safer library in production:
      // 
      // Example with expr-eval:
      // import { Parser } from 'expr-eval';
      // const parser = new Parser();
      // return Boolean(parser.evaluate(condition, context));
      
      // Create a safe evaluation context
      const safeContext = {
        vars: context.variables,
        results: Object.fromEntries(context.taskResults),
      };

      // Use Function constructor for safer evaluation than eval
      // Note: Still not recommended for untrusted input
      const func = new Function(
        'ctx',
        `with(ctx) { return ${condition}; }`
      );

      return Boolean(func(safeContext));
    } catch (error) {
      throw ErrorHandler.validationError(
        `Invalid condition: ${error.message}`,
        'condition',
        condition
      );
    }
  }
}

export const conditionalPattern = new ConditionalExecutionPattern();
```

### 2. Create a Retry Pattern

Create `src/automation/orchestrator/patterns/retry-pattern.ts`:

```typescript
import { ErrorHandler, ErrorCategory } from '../../../utils/error-handler';

export interface RetryConfig {
  maxRetries: number;
  delayMs: number;
  backoffMultiplier?: number;
  retryableErrors?: ErrorCategory[];
}

export class RetryPattern {
  /**
   * Execute a task with automatic retry on failure
   */
  async executeWithRetry<T>(
    taskId: string,
    executor: () => Promise<T>,
    config: RetryConfig
  ): Promise<T> {
    let lastError: Error | null = null;
    const backoff = config.backoffMultiplier || 2;
    let delay = config.delayMs;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          console.log(
            `Retry attempt ${attempt}/${config.maxRetries} for task ${taskId}`
          );
          await this.sleep(delay);
          delay *= backoff;
        }

        const result = await executor();
        
        if (attempt > 0) {
          console.log(`Task ${taskId} succeeded on retry attempt ${attempt}`);
        }
        
        return result;
      } catch (error) {
        lastError = error as Error;

        // Check if error is retryable
        const isRetryable = this.isRetryableError(error, config);

        if (!isRetryable || attempt === config.maxRetries) {
          throw error;
        }

        console.error(
          `Task ${taskId} failed (attempt ${attempt + 1}):`,
          error.message
        );
      }
    }

    throw lastError || new Error(`Task ${taskId} failed after retries`);
  }

  private isRetryableError(error: any, config: RetryConfig): boolean {
    if (!config.retryableErrors || config.retryableErrors.length === 0) {
      return true; // Retry all errors if not specified
    }

    return config.retryableErrors.includes(error.category);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const retryPattern = new RetryPattern();
```

### 3. Create a Fan-Out/Fan-In Pattern

Create `src/automation/orchestrator/patterns/fan-out-fan-in.ts`:

```typescript
export interface FanOutConfig {
  inputData: any[];
  taskTemplate: {
    agent_type: string;
    action: string;
    parameters: Record<string, any>;
  };
  aggregator?: (results: any[]) => any;
  concurrency?: number;
}

export class FanOutFanInPattern {
  /**
   * Execute the same task for multiple inputs in parallel
   * Then aggregate the results
   */
  async execute(
    config: FanOutConfig,
    executor: (task: any) => Promise<any>
  ): Promise<any> {
    const concurrency = config.concurrency || 5;
    const results: any[] = [];

    // Process in batches for concurrency control
    for (let i = 0; i < config.inputData.length; i += concurrency) {
      const batch = config.inputData.slice(i, i + concurrency);
      
      const batchPromises = batch.map((input, index) => {
        const task = {
          id: `fan-out-${i + index}`,
          name: `fan-out-${i + index}`,
          ...config.taskTemplate,
          parameters: {
            ...config.taskTemplate.parameters,
            input,
          },
        };

        return executor(task);
      });

      const batchResults = await Promise.allSettled(batchPromises);
      
      // Collect successful results
      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error('Fan-out task failed:', result.reason);
        }
      }
    }

    // Aggregate results if aggregator provided
    if (config.aggregator) {
      return config.aggregator(results);
    }

    return results;
  }
}

export const fanOutFanInPattern = new FanOutFanInPattern();
```

## Adding Workflow Middleware

### 1. Create Middleware System

Create `src/automation/orchestrator/middleware/index.ts`:

```typescript
export interface WorkflowContext {
  workflow: any;
  execution: any;
  variables: Record<string, any>;
  metadata: Record<string, any>;
}

export type MiddlewareFunction = (
  context: WorkflowContext,
  next: () => Promise<void>
) => Promise<void>;

export class MiddlewareManager {
  private middleware: MiddlewareFunction[] = [];

  use(fn: MiddlewareFunction): void {
    this.middleware.push(fn);
  }

  async execute(context: WorkflowContext, executor: () => Promise<any>): Promise<any> {
    let index = 0;

    const next = async (): Promise<void> => {
      if (index >= this.middleware.length) {
        await executor();
        return;
      }

      const fn = this.middleware[index++];
      await fn(context, next);
    };

    await next();
  }
}

export const middlewareManager = new MiddlewareManager();
```

### 2. Create Logging Middleware

```typescript
import { middlewareManager } from './index';

// Logging middleware
middlewareManager.use(async (context, next) => {
  const startTime = Date.now();
  
  console.log(`[Workflow] Starting: ${context.workflow.name}`);
  console.log(`[Workflow] Tasks: ${context.workflow.definition.tasks.length}`);

  await next();

  const duration = Date.now() - startTime;
  console.log(`[Workflow] Completed in ${duration}ms`);
});
```

### 3. Create Validation Middleware

```typescript
import { Validator } from '../../../utils/validation';
import Joi from 'joi';

middlewareManager.use(async (context, next) => {
  // Validate workflow structure
  const workflowSchema = Joi.object({
    name: Joi.string().required(),
    definition: Joi.object({
      tasks: Joi.array().items(Joi.object()).min(1).required(),
    }).required(),
  });

  Validator.validateOrThrow(context.workflow, workflowSchema);

  await next();
});
```

### 4. Create Metrics Middleware

```typescript
middlewareManager.use(async (context, next) => {
  // Track metrics
  context.metadata.startTime = Date.now();
  context.metadata.taskCount = context.workflow.definition.tasks.length;

  try {
    await next();
    
    context.metadata.status = 'success';
  } catch (error) {
    context.metadata.status = 'failed';
    context.metadata.error = error.message;
    throw error;
  } finally {
    context.metadata.duration = Date.now() - context.metadata.startTime;
    
    // Send metrics to monitoring system
    console.log('[Metrics]', context.metadata);
  }
});
```

## Adding Custom Scheduling Algorithms

### 1. Create a Round-Robin Scheduler

Create `src/automation/orchestrator/schedulers/round-robin.ts`:

```typescript
export class RoundRobinScheduler {
  private currentIndex = 0;

  /**
   * Distribute tasks across multiple workers in round-robin fashion
   */
  async scheduleTasks(
    tasks: any[],
    workers: Array<(task: any) => Promise<any>>
  ): Promise<any[]> {
    const results: any[] = [];

    for (const task of tasks) {
      const worker = workers[this.currentIndex];
      const result = await worker(task);
      results.push(result);

      // Move to next worker
      this.currentIndex = (this.currentIndex + 1) % workers.length;
    }

    return results;
  }
}
```

### 2. Create a Load-Based Scheduler

```typescript
export class LoadBasedScheduler {
  private workerLoads: Map<number, number> = new Map();

  /**
   * Distribute tasks based on current worker load
   */
  async scheduleTasks(
    tasks: any[],
    workers: Array<(task: any) => Promise<any>>
  ): Promise<any[]> {
    // Initialize worker loads
    workers.forEach((_, index) => {
      this.workerLoads.set(index, 0);
    });

    const results: any[] = [];

    for (const task of tasks) {
      // Find worker with lowest load
      const workerIndex = this.findLightestWorker();
      const worker = workers[workerIndex];

      // Increment load
      this.workerLoads.set(workerIndex, this.workerLoads.get(workerIndex)! + 1);

      // Execute task
      const result = await worker(task);
      results.push(result);

      // Decrement load
      this.workerLoads.set(workerIndex, this.workerLoads.get(workerIndex)! - 1);
    }

    return results;
  }

  private findLightestWorker(): number {
    let minLoad = Infinity;
    let minIndex = 0;

    this.workerLoads.forEach((load, index) => {
      if (load < minLoad) {
        minLoad = load;
        minIndex = index;
      }
    });

    return minIndex;
  }
}
```

## Adding Workflow State Management

### 1. Create State Manager

Create `src/automation/orchestrator/state/manager.ts`:

```typescript
export interface WorkflowState {
  workflowId: string;
  executionId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  currentTask?: string;
  completedTasks: string[];
  failedTasks: string[];
  variables: Record<string, any>;
  metadata: Record<string, any>;
}

export class WorkflowStateManager {
  private states: Map<string, WorkflowState> = new Map();

  /**
   * Initialize workflow state
   */
  async initState(workflowId: string, executionId: string): Promise<WorkflowState> {
    const state: WorkflowState = {
      workflowId,
      executionId,
      status: 'pending',
      completedTasks: [],
      failedTasks: [],
      variables: {},
      metadata: {},
    };

    this.states.set(executionId, state);
    return state;
  }

  /**
   * Update workflow state
   */
  async updateState(
    executionId: string,
    updates: Partial<WorkflowState>
  ): Promise<WorkflowState> {
    const state = this.states.get(executionId);
    if (!state) {
      throw new Error(`State not found for execution: ${executionId}`);
    }

    Object.assign(state, updates);
    return state;
  }

  /**
   * Get workflow state
   */
  async getState(executionId: string): Promise<WorkflowState | null> {
    return this.states.get(executionId) || null;
  }

  /**
   * Mark task as completed
   */
  async completeTask(executionId: string, taskId: string): Promise<void> {
    const state = this.states.get(executionId);
    if (state) {
      state.completedTasks.push(taskId);
      state.currentTask = undefined;
    }
  }

  /**
   * Mark task as failed
   */
  async failTask(executionId: string, taskId: string): Promise<void> {
    const state = this.states.get(executionId);
    if (state) {
      state.failedTasks.push(taskId);
      state.currentTask = undefined;
    }
  }
}

export const stateManager = new WorkflowStateManager();
```

## Best Practices

### 1. Error Handling

Always use proper error handling in orchestration code:

```typescript
try {
  const result = await executeTask(task);
  await stateManager.completeTask(executionId, task.id);
} catch (error) {
  await stateManager.failTask(executionId, task.id);
  
  // Decide whether to continue or stop
  if (workflow.definition.on_error === 'continue') {
    console.error(`Task ${task.id} failed, continuing:`, error);
  } else {
    throw error;
  }
}
```

### 2. State Persistence

For production systems, persist workflow state:

```typescript
export class PersistentStateManager extends WorkflowStateManager {
  async updateState(executionId: string, updates: Partial<WorkflowState>): Promise<WorkflowState> {
    const state = await super.updateState(executionId, updates);
    
    // Persist to database
    await database.query(
      'UPDATE workflow_executions SET state = $1 WHERE id = $2',
      [JSON.stringify(state), executionId]
    );
    
    return state;
  }
}
```

### 3. Monitoring and Metrics

Add monitoring to all orchestration operations:

```typescript
import { healthCheckManager } from '../../../utils/health-check';

healthCheckManager.register({
  name: 'orchestration-engine',
  check: async () => {
    const activeExecutions = await this.getActiveExecutions();
    return {
      healthy: activeExecutions.length < 100,
      message: `${activeExecutions.length} active executions`,
    };
  },
  critical: true,
});
```

### 4. Testing

Write comprehensive tests for orchestration logic:

```typescript
describe('PriorityScheduler', () => {
  it('should execute high priority tasks first', async () => {
    const executed: string[] = [];
    
    const tasks = [
      { id: 't1', priority: 1 },
      { id: 't2', priority: 10 },
      { id: 't3', priority: 5 },
    ];

    await priorityScheduler.executeTasks(
      tasks,
      context,
      async (task) => {
        executed.push(task.id);
      }
    );

    expect(executed).toEqual(['t2', 't3', 't1']);
  });
});
```

## Advanced Topics

### 1. Distributed Orchestration

For distributed systems, use message queues:

```typescript
import { Queue } from 'bull';

export class DistributedOrchestrator {
  private taskQueue: Queue;

  constructor() {
    this.taskQueue = new Queue('workflow-tasks', {
      redis: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    });
  }

  async submitTask(task: any): Promise<void> {
    await this.taskQueue.add(task, {
      priority: task.priority || 1,
      attempts: 3,
    });
  }
}
```

### 2. Workflow Versioning

Implement version control for workflows:

```typescript
export class WorkflowVersionManager {
  async createVersion(workflow: any): Promise<string> {
    const version = {
      workflow_id: workflow.id,
      version: await this.getNextVersion(workflow.id),
      definition: workflow.definition,
      created_at: new Date(),
    };

    await database.query(
      'INSERT INTO workflow_versions (workflow_id, version, definition) VALUES ($1, $2, $3)',
      [version.workflow_id, version.version, JSON.stringify(version.definition)]
    );

    return version.version;
  }

  async getVersion(workflowId: string, version: string): Promise<any> {
    const result = await database.query(
      'SELECT definition FROM workflow_versions WHERE workflow_id = $1 AND version = $2',
      [workflowId, version]
    );

    return result.rows[0]?.definition;
  }
}
```

### 3. Real-time Workflow Monitoring

Implement WebSocket-based monitoring:

```typescript
import WebSocket from 'ws';

export class WorkflowMonitor {
  private wss: WebSocket.Server;
  private subscribers: Map<string, Set<WebSocket>> = new Map();

  constructor(port: number) {
    this.wss = new WebSocket.Server({ port });
  }

  subscribe(executionId: string, ws: WebSocket): void {
    if (!this.subscribers.has(executionId)) {
      this.subscribers.set(executionId, new Set());
    }
    this.subscribers.get(executionId)!.add(ws);
  }

  broadcast(executionId: string, event: any): void {
    const subscribers = this.subscribers.get(executionId);
    if (subscribers) {
      subscribers.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(event));
        }
      });
    }
  }
}
```

## Resources

- [Orchestration Documentation](../ORCHESTRATION.md)
- [Parallel Engine Documentation](../../src/automation/orchestrator/parallel-engine.ts)
- [Workflow Dependencies](../../src/automation/orchestrator/workflow-dependencies.ts)
- [Workflow Examples](../WORKFLOW_EXAMPLES.md)

## Next Steps

1. Review existing orchestration code
2. Identify patterns needed for your use case
3. Implement custom strategies/patterns
4. Write comprehensive tests
5. Update documentation
6. Submit pull request

## Support

For questions or issues:
- Review orchestration examples
- Check troubleshooting guide
- Open an issue on GitHub
