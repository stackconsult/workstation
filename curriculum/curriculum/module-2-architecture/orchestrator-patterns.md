# Orchestrator Patterns: Workflow Execution and State Management

## Table of Contents
- [Introduction](#introduction)
- [Workflow Execution Fundamentals](#workflow-execution-fundamentals)
- [Task Scheduling Strategies](#task-scheduling-strategies)
- [State Management Patterns](#state-management-patterns)
- [Retry Logic and Error Recovery](#retry-logic-and-error-recovery)
- [Advanced Orchestration Patterns](#advanced-orchestration-patterns)
- [Performance Optimization](#performance-optimization)
- [Business Value](#business-value)

## Introduction

The Agent Orchestrator is the "conductor" of the Workstation automation system, coordinating multi-agent workflows with precision, reliability, and intelligence. It transforms individual agents into cohesive automation pipelines with built-in error recovery, accuracy validation, and state management.

**Core Responsibilities:**
- **Workflow Execution**: Sequential and parallel agent coordination
- **Handoff Management**: Agent-to-agent data passing with validation
- **Error Recovery**: Automatic retry with exponential backoff
- **State Persistence**: Workflow state tracking and resumption
- **Accuracy Validation**: Guardrails to ensure quality thresholds

**Business Context**: For agencies, the orchestrator is what makes your automation "enterprise-grade" instead of "scripts that sometimes work." It's the difference between charging $500/month and $5,000/month.

## Workflow Execution Fundamentals

### Workflow Definition Structure

```typescript
/**
 * Workflow Definition
 * 
 * Defines a multi-agent automation workflow.
 */
export interface WorkflowDefinition {
  /** Unique workflow identifier */
  id: string;
  
  /** Human-readable workflow name */
  name: string;
  
  /** Ordered array of agent IDs to execute */
  agents: number[];
  
  /** Initial data payload */
  initialData: Record<string, unknown>;
  
  /** Workflow configuration */
  config?: {
    /** Max execution time in milliseconds (default: 300000 = 5 min) */
    timeout?: number;
    
    /** Max retry attempts per agent (default: 3) */
    maxRetries?: number;
    
    /** Enable automatic error recovery (default: true) */
    autoRecovery?: boolean;
    
    /** Parallel execution groups (advanced) */
    parallelGroups?: number[][];
  };
  
  /** Optional metadata */
  metadata?: {
    createdBy?: string;
    createdAt?: Date;
    description?: string;
    tags?: string[];
  };
}
```

### Workflow Execution Lifecycle

```typescript
/**
 * Workflow Execution States
 * 
 * pending   → Workflow created, not started
 * running   → Currently executing agents
 * paused    → Temporarily paused (manual or error)
 * completed → All agents executed successfully
 * failed    → Execution failed after retries
 * cancelled → Manually cancelled by user
 */
export type WorkflowStatus = 
  | 'pending' 
  | 'running' 
  | 'paused' 
  | 'completed' 
  | 'failed' 
  | 'cancelled';

/**
 * Workflow Execution State
 * 
 * Tracks the current state of an executing workflow.
 */
export interface WorkflowExecution {
  /** Workflow definition reference */
  workflowId: string;
  
  /** Execution instance ID */
  executionId: string;
  
  /** Current status */
  status: WorkflowStatus;
  
  /** Agent execution order */
  agents: number[];
  
  /** Current agent being executed */
  currentAgentIndex: number;
  
  /** Start timestamp */
  startTime: Date;
  
  /** End timestamp (when completed/failed) */
  endTime?: Date;
  
  /** Agent-to-agent handoffs */
  handoffs: HandoffData[];
  
  /** Accumulated workflow data */
  workflowData: Record<string, unknown>;
  
  /** Error information (if failed) */
  error?: {
    message: string;
    agentId: number;
    agentName: string;
    timestamp: Date;
    retryCount: number;
  };
  
  /** Execution metrics */
  metrics?: {
    totalExecutionTime: number;
    averageAgentTime: number;
    successfulHandoffs: number;
    failedHandoffs: number;
  };
}
```

### Basic Workflow Execution

```typescript
// src/orchestration/agent-orchestrator.ts
import { EventEmitter } from 'events';
import { registry } from '../automation/agents/AgentRegistry';

export class AgentOrchestrator extends EventEmitter {
  private executions: Map<string, WorkflowExecution> = new Map();
  
  /**
   * Create a new workflow execution
   * 
   * @param definition - Workflow definition
   * @returns Workflow execution instance
   */
  createWorkflow(definition: WorkflowDefinition): WorkflowExecution {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const execution: WorkflowExecution = {
      workflowId: definition.id,
      executionId,
      status: 'pending',
      agents: definition.agents,
      currentAgentIndex: 0,
      startTime: new Date(),
      handoffs: [],
      workflowData: definition.initialData
    };
    
    this.executions.set(executionId, execution);
    this.emit('workflow:created', execution);
    
    return execution;
  }
  
  /**
   * Execute a workflow
   * 
   * @param executionId - Workflow execution ID
   */
  async executeWorkflow(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error(`Workflow execution ${executionId} not found`);
    }
    
    // Update status
    execution.status = 'running';
    this.emit('workflow:started', execution);
    
    try {
      // Execute agents sequentially
      for (let i = execution.currentAgentIndex; i < execution.agents.length; i++) {
        const agentId = execution.agents[i];
        execution.currentAgentIndex = i;
        
        // Execute agent
        await this.executeAgent(execution, agentId);
        
        // Check if workflow was cancelled
        if (execution.status === 'cancelled') {
          return;
        }
      }
      
      // Workflow completed
      execution.status = 'completed';
      execution.endTime = new Date();
      this.calculateMetrics(execution);
      this.emit('workflow:completed', execution);
      
    } catch (error) {
      // Workflow failed
      execution.status = 'failed';
      execution.endTime = new Date();
      execution.error = {
        message: error.message,
        agentId: execution.agents[execution.currentAgentIndex],
        agentName: registry.getAgent(execution.agents[execution.currentAgentIndex])?.name || 'Unknown',
        timestamp: new Date(),
        retryCount: 0 // TODO: Track actual retry count
      };
      this.emit('workflow:failed', execution);
      throw error;
    }
  }
  
  /**
   * Execute a single agent within a workflow
   * 
   * @param execution - Workflow execution
   * @param agentId - Agent ID to execute
   */
  private async executeAgent(
    execution: WorkflowExecution, 
    agentId: number
  ): Promise<void> {
    const agent = registry.getAgent(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found in registry`);
    }
    
    // Check agent availability
    if (agent.status !== 'idle') {
      throw new Error(`Agent ${agent.name} is ${agent.status}, cannot execute`);
    }
    
    // Update agent status
    registry.updateStatus(agentId, 'active');
    this.emit('agent:started', { execution, agent });
    
    const startTime = Date.now();
    
    try {
      // Execute agent logic (placeholder - actual implementation in agents/)
      const result = await this.performAgentTask(agent, execution.workflowData);
      
      // Calculate execution time and accuracy
      const executionTime = Date.now() - startTime;
      const accuracy = result.accuracy || 100;
      
      // Update agent accuracy
      registry.updateAccuracy(agentId, accuracy);
      
      // Validate accuracy threshold
      if (accuracy < agent.requiredAccuracy) {
        throw new Error(
          `Agent ${agent.name} accuracy (${accuracy}%) ` +
          `below threshold (${agent.requiredAccuracy}%)`
        );
      }
      
      // Record handoff
      const handoff: HandoffData = {
        fromAgent: agentId,
        toAgent: execution.agents[execution.currentAgentIndex + 1] || -1,
        timestamp: new Date().toISOString(),
        data: result.data,
        metadata: {
          accuracy,
          validatedBy: ['accuracy-check'],
          executionTime
        }
      };
      execution.handoffs.push(handoff);
      
      // Update workflow data for next agent
      execution.workflowData = {
        ...execution.workflowData,
        ...result.data
      };
      
      // Update agent status
      registry.updateStatus(agentId, 'idle');
      this.emit('agent:completed', { execution, agent, result });
      
    } catch (error) {
      // Update agent status
      registry.updateStatus(agentId, 'error');
      this.emit('agent:failed', { execution, agent, error });
      throw error;
    }
  }
  
  /**
   * Placeholder for actual agent task execution
   * (Implemented in specific agent handlers)
   */
  private async performAgentTask(
    agent: Agent, 
    data: Record<string, unknown>
  ): Promise<{ data: Record<string, unknown>; accuracy: number }> {
    // In real implementation, this would:
    // 1. Load agent-specific handler
    // 2. Execute agent logic with browser automation
    // 3. Validate results
    // 4. Return structured output
    
    return {
      data: { 
        ...data, 
        [`agent_${agent.id}_result`]: 'success' 
      },
      accuracy: 95
    };
  }
  
  /**
   * Calculate workflow execution metrics
   */
  private calculateMetrics(execution: WorkflowExecution): void {
    const totalTime = execution.endTime!.getTime() - execution.startTime.getTime();
    const avgAgentTime = execution.handoffs.length > 0
      ? execution.handoffs.reduce((sum, h) => sum + (h.metadata.executionTime || 0), 0) / execution.handoffs.length
      : 0;
    
    execution.metrics = {
      totalExecutionTime: totalTime,
      averageAgentTime: avgAgentTime,
      successfulHandoffs: execution.handoffs.length,
      failedHandoffs: 0 // TODO: Track failed handoff attempts
    };
  }
}

// Export singleton instance
export const orchestrator = new AgentOrchestrator();
```

**Business Context**: This basic execution pattern handles 90% of automation needs. For agencies, this means you can build and sell simple workflows (e.g., "scrape website → extract data → send email") with minimal code.

## Task Scheduling Strategies

### Strategy 1: Sequential Execution (Default)

**Use Case**: When agent outputs depend on previous agent results.

```typescript
/**
 * Sequential Execution Example
 * 
 * Workflow: Login → Navigate → Extract Data → Send to Webhook
 * 
 * Each agent waits for the previous to complete.
 */
const sequentialWorkflow: WorkflowDefinition = {
  id: 'workflow_sequential_001',
  name: 'Sequential Data Extraction',
  agents: [1, 2, 3, 4], // Login, Navigate, Extract, Webhook
  initialData: {
    loginUrl: 'https://example.com/login',
    username: 'user@example.com',
    password: 'encrypted_password',
    targetUrl: 'https://example.com/data',
    webhookUrl: 'https://your-api.com/webhook'
  }
};

// Execute
const execution = orchestrator.createWorkflow(sequentialWorkflow);
await orchestrator.executeWorkflow(execution.executionId);

// Timeline:
// 0s    - Agent 1 (Login) starts
// 2s    - Agent 1 completes, Agent 2 (Navigate) starts
// 4s    - Agent 2 completes, Agent 3 (Extract) starts
// 7s    - Agent 3 completes, Agent 4 (Webhook) starts
// 8s    - Agent 4 completes, workflow done
// Total: 8 seconds
```

**Business Context**: Most client workflows are sequential. This is your bread-and-butter pattern.

### Strategy 2: Parallel Execution

**Use Case**: When multiple independent tasks can run simultaneously.

```typescript
/**
 * Parallel Execution Example
 * 
 * Workflow: Extract from 3 different websites simultaneously
 * 
 * Reduces total execution time by parallelizing independent tasks.
 */
const parallelWorkflow: WorkflowDefinition = {
  id: 'workflow_parallel_001',
  name: 'Parallel Multi-Site Scraping',
  agents: [5, 6, 7, 8], // Scraper1, Scraper2, Scraper3, Aggregator
  initialData: {
    sites: [
      'https://competitor1.com',
      'https://competitor2.com',
      'https://competitor3.com'
    ]
  },
  config: {
    parallelGroups: [
      [5, 6, 7], // Execute agents 5, 6, 7 in parallel
      [8]        // Execute agent 8 after parallel group completes
    ]
  }
};

// Enhanced orchestrator method for parallel execution
async function executeParallelWorkflow(executionId: string): Promise<void> {
  const execution = orchestrator.executions.get(executionId);
  const parallelGroups = execution.config?.parallelGroups || [];
  
  for (const group of parallelGroups) {
    if (group.length === 1) {
      // Sequential execution for single-agent groups
      await orchestrator.executeAgent(execution, group[0]);
    } else {
      // Parallel execution for multi-agent groups
      await Promise.all(
        group.map(agentId => orchestrator.executeAgent(execution, agentId))
      );
    }
  }
}

// Timeline:
// 0s    - Agents 5, 6, 7 start simultaneously
// 3s    - All parallel agents complete, Agent 8 starts
// 4s    - Agent 8 completes, workflow done
// Total: 4 seconds (vs 12s sequential)
```

**Business Context**: Parallel execution enables "competitive monitoring" packages where you scrape 10 competitors simultaneously. Clients love the speed.

### Strategy 3: Conditional Execution

**Use Case**: When workflow path depends on runtime data.

```typescript
/**
 * Conditional Execution Example
 * 
 * Workflow: Check price → If changed, send notification → Otherwise, skip
 */
interface ConditionalWorkflowDefinition extends WorkflowDefinition {
  conditions?: {
    agentId: number;
    condition: (data: Record<string, unknown>) => boolean;
    thenAgents: number[];
    elseAgents: number[];
  }[];
}

const conditionalWorkflow: ConditionalWorkflowDefinition = {
  id: 'workflow_conditional_001',
  name: 'Price Change Alert',
  agents: [10, 11, 12], // CheckPrice, SendSlack, LogNoChange
  initialData: {
    targetUrl: 'https://competitor.com/product',
    lastKnownPrice: 99.99
  },
  conditions: [{
    agentId: 10, // After CheckPrice agent
    condition: (data) => data.currentPrice !== data.lastKnownPrice,
    thenAgents: [11], // Price changed: send Slack notification
    elseAgents: [12]  // No change: just log
  }]
};

// Enhanced orchestrator method
async function executeConditionalAgent(
  execution: WorkflowExecution,
  agentId: number
): Promise<void> {
  // Execute agent
  await orchestrator.executeAgent(execution, agentId);
  
  // Check for conditions
  const workflow = execution as ConditionalWorkflowDefinition;
  const condition = workflow.conditions?.find(c => c.agentId === agentId);
  
  if (condition) {
    const conditionMet = condition.condition(execution.workflowData);
    const nextAgents = conditionMet ? condition.thenAgents : condition.elseAgents;
    
    // Update execution plan
    execution.agents = [
      ...execution.agents.slice(0, execution.currentAgentIndex + 1),
      ...nextAgents,
      ...execution.agents.slice(execution.currentAgentIndex + 1)
    ];
    
    console.log(`Condition ${conditionMet ? 'met' : 'not met'}, executing:`, nextAgents);
  }
}
```

**Business Context**: Conditional workflows reduce costs (don't send Slack notifications for unchanged data) and noise (clients only get alerted when it matters).

## State Management Patterns

### Pattern 1: Workflow State Persistence

```typescript
/**
 * Persist workflow state to database
 * 
 * Enables workflow resumption after server restart.
 */
import { getDatabase } from '../automation/db/database';

async function saveWorkflowState(execution: WorkflowExecution): Promise<void> {
  const db = getDatabase();
  
  await db.run(
    `INSERT OR REPLACE INTO workflow_executions 
     (id, definition, status, current_agent_index, start_time, end_time, 
      workflow_data, handoffs, error, metrics)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      execution.executionId,
      JSON.stringify({
        workflowId: execution.workflowId,
        agents: execution.agents
      }),
      execution.status,
      execution.currentAgentIndex,
      execution.startTime.toISOString(),
      execution.endTime?.toISOString(),
      JSON.stringify(execution.workflowData),
      JSON.stringify(execution.handoffs),
      JSON.stringify(execution.error),
      JSON.stringify(execution.metrics)
    ]
  );
}

async function loadWorkflowState(executionId: string): Promise<WorkflowExecution | null> {
  const db = getDatabase();
  
  const row = await db.get(
    'SELECT * FROM workflow_executions WHERE id = ?',
    [executionId]
  );
  
  if (!row) return null;
  
  const definition = JSON.parse(row.definition);
  return {
    executionId: row.id,
    workflowId: definition.workflowId,
    status: row.status,
    agents: definition.agents,
    currentAgentIndex: row.current_agent_index,
    startTime: new Date(row.start_time),
    endTime: row.end_time ? new Date(row.end_time) : undefined,
    handoffs: JSON.parse(row.handoffs),
    workflowData: JSON.parse(row.workflow_data),
    error: row.error ? JSON.parse(row.error) : undefined,
    metrics: row.metrics ? JSON.parse(row.metrics) : undefined
  };
}

// Integrate with orchestrator
orchestrator.on('agent:completed', async (event) => {
  await saveWorkflowState(event.execution);
});
```

**Business Context**: State persistence means your automation survives server crashes. For clients running critical workflows (daily reports, financial data), this is non-negotiable.

### Pattern 2: Resume Workflow After Failure

```typescript
/**
 * Resume a failed or paused workflow
 * 
 * @param executionId - Workflow execution ID
 * @param fromCheckpoint - Whether to resume from last successful agent
 */
async function resumeWorkflow(
  executionId: string,
  fromCheckpoint: boolean = true
): Promise<void> {
  // Load workflow state from database
  const execution = await loadWorkflowState(executionId);
  if (!execution) {
    throw new Error(`Workflow ${executionId} not found`);
  }
  
  // Validate workflow can be resumed
  if (execution.status === 'completed') {
    throw new Error('Cannot resume completed workflow');
  }
  
  if (execution.status === 'running') {
    throw new Error('Workflow is already running');
  }
  
  // Reset status
  execution.status = 'running';
  
  // Optionally reset to last successful agent
  if (fromCheckpoint && execution.handoffs.length > 0) {
    execution.currentAgentIndex = execution.handoffs.length;
    console.log(`Resuming from checkpoint: Agent ${execution.currentAgentIndex + 1}`);
  }
  
  // Re-add to orchestrator
  orchestrator.executions.set(executionId, execution);
  
  // Continue execution
  await orchestrator.executeWorkflow(executionId);
}
```

**Business Context**: Resume capability means clients don't lose progress on long-running workflows. If a 30-minute workflow fails at step 28, you resume from step 28, not start over.

## Retry Logic and Error Recovery

### Exponential Backoff Retry

```typescript
/**
 * Execute agent with automatic retry and exponential backoff
 * 
 * Retry delay: 2^attempt * 1000ms
 * - Attempt 1: 2 seconds
 * - Attempt 2: 4 seconds
 * - Attempt 3: 8 seconds
 */
async function executeAgentWithRetry(
  execution: WorkflowExecution,
  agentId: number,
  maxRetries: number = 3
): Promise<void> {
  let attempt = 0;
  let lastError: Error | null = null;
  
  while (attempt < maxRetries) {
    try {
      // Attempt execution
      await orchestrator.executeAgent(execution, agentId);
      
      // Success - exit retry loop
      return;
      
    } catch (error) {
      attempt++;
      lastError = error as Error;
      
      const agent = registry.getAgent(agentId);
      console.warn(
        `⚠️ Agent ${agent?.name} failed (attempt ${attempt}/${maxRetries}): ${error.message}`
      );
      
      // Check if we should retry
      if (attempt < maxRetries) {
        // Calculate backoff delay
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`Retrying in ${delay}ms...`);
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Reset agent status for retry
        if (agent) {
          registry.updateStatus(agentId, 'idle');
        }
      }
    }
  }
  
  // All retries exhausted
  throw new Error(
    `Agent ${agentId} failed after ${maxRetries} attempts: ${lastError?.message}`
  );
}

// Integrate with workflow execution
async function executeWorkflowWithRetry(executionId: string): Promise<void> {
  const execution = orchestrator.executions.get(executionId);
  if (!execution) {
    throw new Error(`Workflow ${executionId} not found`);
  }
  
  execution.status = 'running';
  
  try {
    for (let i = execution.currentAgentIndex; i < execution.agents.length; i++) {
      const agentId = execution.agents[i];
      execution.currentAgentIndex = i;
      
      // Execute with retry
      await executeAgentWithRetry(execution, agentId, 3);
    }
    
    execution.status = 'completed';
    execution.endTime = new Date();
    
  } catch (error) {
    execution.status = 'failed';
    execution.endTime = new Date();
    throw error;
  }
}
```

**Business Context**: Automatic retry handles transient failures (network hiccups, rate limits, slow page loads). This increases workflow success rate from 85% to 95%+ without any code changes.

### Graceful Degradation

```typescript
/**
 * Fallback strategies when agent fails
 */
enum FallbackStrategy {
  RETRY = 'retry',           // Retry same agent
  ALTERNATIVE = 'alternative', // Try different agent with same capabilities
  SKIP = 'skip',             // Skip failed agent, continue workflow
  ABORT = 'abort'            // Stop workflow immediately
}

interface AgentFallbackConfig {
  strategy: FallbackStrategy;
  alternativeAgentId?: number;
  maxRetries?: number;
}

async function executeAgentWithFallback(
  execution: WorkflowExecution,
  agentId: number,
  fallback: AgentFallbackConfig
): Promise<void> {
  try {
    // Try primary agent
    await executeAgentWithRetry(execution, agentId, fallback.maxRetries || 3);
    
  } catch (error) {
    console.warn(`Primary agent ${agentId} failed, applying fallback: ${fallback.strategy}`);
    
    switch (fallback.strategy) {
      case FallbackStrategy.ALTERNATIVE:
        if (!fallback.alternativeAgentId) {
          throw new Error('Alternative agent not specified');
        }
        console.log(`Trying alternative agent ${fallback.alternativeAgentId}`);
        await executeAgentWithRetry(execution, fallback.alternativeAgentId, 1);
        break;
        
      case FallbackStrategy.SKIP:
        console.log('Skipping failed agent, continuing workflow');
        // Add placeholder handoff data
        execution.handoffs.push({
          fromAgent: agentId,
          toAgent: execution.agents[execution.currentAgentIndex + 1] || -1,
          timestamp: new Date().toISOString(),
          data: { skipped: true, reason: error.message },
          metadata: { accuracy: 0, validatedBy: ['fallback-skip'] }
        });
        break;
        
      case FallbackStrategy.ABORT:
        throw error;
        
      case FallbackStrategy.RETRY:
      default:
        throw error;
    }
  }
}
```

**Business Context**: Fallback strategies enable "best-effort" workflows. Example: If primary data source is down, fall back to secondary source. Client still gets their report, just from a different source.

## Advanced Orchestration Patterns

### Pattern 1: Multi-Tenant Workflows

```typescript
/**
 * Execute workflows for multiple clients with isolation
 */
interface TenantWorkflowExecution extends WorkflowExecution {
  tenantId: string;
  tenantName: string;
}

async function executeTenantWorkflow(
  tenantId: string,
  definition: WorkflowDefinition
): Promise<TenantWorkflowExecution> {
  // Create tenant-scoped execution
  const execution = orchestrator.createWorkflow(definition) as TenantWorkflowExecution;
  execution.tenantId = tenantId;
  execution.tenantName = `Tenant_${tenantId}`;
  
  // Add tenant context to workflow data
  execution.workflowData = {
    ...execution.workflowData,
    __tenant: {
      id: tenantId,
      name: execution.tenantName
    }
  };
  
  // Execute with tenant-specific rate limiting
  await orchestrator.executeWorkflow(execution.executionId);
  
  return execution;
}

// Usage: Execute workflows for 3 different clients
const clients = ['client_001', 'client_002', 'client_003'];
await Promise.all(
  clients.map(clientId => 
    executeTenantWorkflow(clientId, priceMonitoringWorkflow)
  )
);
```

**Business Context**: Multi-tenant support means one server instance serves 50+ clients. Your hosting cost stays fixed while revenue scales linearly.

### Pattern 2: Event-Driven Orchestration

```typescript
/**
 * Workflow triggered by external events
 */
orchestrator.on('workflow:completed', async (execution) => {
  console.log(`✅ Workflow ${execution.workflowId} completed in ${execution.metrics?.totalExecutionTime}ms`);
  
  // Trigger downstream actions
  if (execution.workflowData.sendNotification) {
    await sendSlackNotification({
      channel: '#automation-alerts',
      message: `Workflow ${execution.workflowId} completed successfully`,
      data: execution.workflowData
    });
  }
  
  // Archive results
  await archiveWorkflowResults(execution);
  
  // Trigger dependent workflows
  const dependentWorkflows = await findDependentWorkflows(execution.workflowId);
  for (const workflow of dependentWorkflows) {
    await orchestrator.executeWorkflow(workflow.executionId);
  }
});

orchestrator.on('workflow:failed', async (execution) => {
  console.error(`❌ Workflow ${execution.workflowId} failed: ${execution.error?.message}`);
  
  // Send alert
  await sendSlackNotification({
    channel: '#automation-errors',
    message: `🚨 Workflow ${execution.workflowId} failed`,
    error: execution.error
  });
  
  // Attempt auto-recovery
  if (execution.config?.autoRecovery) {
    console.log('Attempting auto-recovery...');
    await resumeWorkflow(execution.executionId, true);
  }
});
```

**Business Context**: Event-driven patterns enable "workflow chains" (e.g., "scrape data → transform → load to CRM → send report"). Each step triggers the next automatically.

## Performance Optimization

### Optimization 1: Agent Pooling

```typescript
/**
 * Pre-warm agent pool for faster execution
 */
class AgentPool {
  private pool: Map<number, Agent[]> = new Map();
  
  async warmPool(agentId: number, poolSize: number = 5): Promise<void> {
    const agents: Agent[] = [];
    
    for (let i = 0; i < poolSize; i++) {
      // Clone agent configuration
      const template = registry.getAgent(agentId);
      if (!template) continue;
      
      const pooledAgent = registry.register({
        name: `${template.name}_pool_${i}`,
        tier: template.tier,
        capabilities: template.capabilities,
        requiredAccuracy: template.requiredAccuracy
      });
      
      agents.push(pooledAgent);
    }
    
    this.pool.set(agentId, agents);
    console.log(`✅ Warmed pool for agent ${agentId}: ${poolSize} instances`);
  }
  
  async getAvailableAgent(agentId: number): Promise<Agent | null> {
    const agents = this.pool.get(agentId) || [];
    return agents.find(a => a.status === 'idle') || null;
  }
}

// Usage
const agentPool = new AgentPool();
await agentPool.warmPool(1, 10); // 10 instances of agent 1

// When executing workflow, use pooled agents
const agent = await agentPool.getAvailableAgent(1);
if (agent) {
  await orchestrator.executeAgent(execution, agent.id);
}
```

**Business Context**: Agent pooling enables high-concurrency workflows (100+ executions per minute). Critical for agencies with high-volume clients.

### Optimization 2: Execution Caching

```typescript
/**
 * Cache agent results to avoid redundant work
 */
interface CacheEntry {
  agentId: number;
  inputHash: string;
  result: Record<string, unknown>;
  accuracy: number;
  timestamp: Date;
  ttl: number; // Time-to-live in milliseconds
}

class ExecutionCache {
  private cache: Map<string, CacheEntry> = new Map();
  
  private hashInput(agentId: number, data: Record<string, unknown>): string {
    const str = JSON.stringify({ agentId, data });
    return createHash('sha256').update(str).digest('hex');
  }
  
  async get(agentId: number, data: Record<string, unknown>): Promise<CacheEntry | null> {
    const key = this.hashInput(agentId, data);
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Check TTL
    const age = Date.now() - entry.timestamp.getTime();
    if (age > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry;
  }
  
  async set(
    agentId: number, 
    data: Record<string, unknown>,
    result: Record<string, unknown>,
    accuracy: number,
    ttl: number = 3600000 // 1 hour default
  ): Promise<void> {
    const key = this.hashInput(agentId, data);
    this.cache.set(key, {
      agentId,
      inputHash: key,
      result,
      accuracy,
      timestamp: new Date(),
      ttl
    });
  }
}

// Integrate with agent execution
const executionCache = new ExecutionCache();

async function executeAgentWithCache(
  execution: WorkflowExecution,
  agentId: number
): Promise<void> {
  // Check cache
  const cached = await executionCache.get(agentId, execution.workflowData);
  if (cached) {
    console.log(`✅ Cache hit for agent ${agentId}`);
    
    // Use cached result
    execution.workflowData = {
      ...execution.workflowData,
      ...cached.result
    };
    
    // Record handoff
    execution.handoffs.push({
      fromAgent: agentId,
      toAgent: execution.agents[execution.currentAgentIndex + 1] || -1,
      timestamp: new Date().toISOString(),
      data: cached.result,
      metadata: {
        accuracy: cached.accuracy,
        validatedBy: ['cache'],
        cached: true
      }
    });
    
    return;
  }
  
  // Cache miss - execute normally
  await orchestrator.executeAgent(execution, agentId);
  
  // Store result in cache
  const lastHandoff = execution.handoffs[execution.handoffs.length - 1];
  await executionCache.set(
    agentId,
    execution.workflowData,
    lastHandoff.data,
    lastHandoff.metadata.accuracy,
    3600000 // 1 hour TTL
  );
}
```

**Business Context**: Caching reduces costs (fewer browser instances) and improves speed (instant results for repeated queries). Example: "Check competitor price every hour" → only actually checks once per hour, serves cached results the rest of the time.

## Business Value

### For Agencies

**1. Reliability = Higher Prices**
- Automatic retry: 85% → 95% success rate
- Error recovery: Clients see "always working" automation
- Example: Charge $2,000/month for 95% reliable automation vs $500/month for 85% reliable

**2. Reduced Support Burden**
- State persistence: "Why didn't my workflow run?" → Check execution logs
- Event-driven alerts: Know about failures before clients do
- Example: 10 hours/week support time → 2 hours/week = 80% reduction

**3. Scalability**
- Multi-tenant: 1 server serves 50 clients
- Agent pooling: 100+ concurrent workflows
- Example: $50/month hosting costs for $50,000 MRR business

### For Founders

**1. Build Complex Automation Without Complexity**
- Sequential workflows: 90% of use cases
- Conditional logic: Smart automation without AI
- Example: "Monitor 10 competitors, alert only on price drops >10%" → 20 lines of config

**2. Reliable Infrastructure**
- Resume failed workflows: Don't lose progress
- Automatic retry: Handle internet hiccups
- Example: Scrape 100 pages/day with 95%+ reliability

### For Platform Engineers

**1. Production-Grade Orchestration**
- State management: Survive crashes
- Error handling: Graceful degradation
- Observability: Full execution traces

**2. Performance at Scale**
- Parallel execution: 3x faster workflows
- Caching: 10x higher throughput
- Agent pooling: 100+ concurrent executions

### For Senior Developers

**1. Clean Architecture**
- Event-driven: Loose coupling
- State machine: Clear lifecycle
- Type-safe: Full TypeScript interfaces

**2. Extensible Patterns**
- Custom fallback strategies
- Pluggable caching
- Middleware hooks

## Next Steps

1. **Build your first workflow**: [Module 3: Browser Agents](../module-3-browser-agents/README.md)
2. **Add external integrations**: [External Agent Integration](./external-agent-integration.md)
3. **Implement orchestration**: [Implementation Checklist](./implementation-checklist.md)

## Additional Resources

- **Source Code**: `src/orchestration/agent-orchestrator.ts`
- **Database Schema**: `src/automation/db/database.ts`
- **Workflow Examples**: `examples/workflows/`
