# Agent Integration Guide

**Version**: 1.0  
**Last Updated**: November 24, 2024  
**Status**: ✅ Production Ready

---

## Overview

This guide explains how agents communicate, coordinate, and hand off work in the Workstation platform. It covers:

- ✅ **Agent-to-Agent Communication** - Direct messaging patterns
- ✅ **Data Handoff Procedures** - Passing work between agents
- ✅ **Event-Driven Messaging** - Publish/subscribe patterns
- ✅ **Error Recovery** - Handling failures gracefully
- ✅ **Coordination Patterns** - Multi-agent workflows

---

## Architecture

### Agent Communication Layers

```
┌────────────────────────────────────────────────────┐
│              Application Layer                      │
│         (Workflows, Business Logic)                 │
└───────────────────┬────────────────────────────────┘
                    │
                    ▼
┌────────────────────────────────────────────────────┐
│           Orchestration Layer                       │
│        (Task Distribution, Routing)                 │
│       src/services/agent-orchestrator.ts            │
└───────────────────┬────────────────────────────────┘
                    │
                    ▼
┌────────────────────────────────────────────────────┐
│           Messaging Layer                           │
│        (Event Bus, Message Broker)                  │
│       src/services/message-broker.ts                │
└───────────────────┬────────────────────────────────┘
                    │
                    ▼
┌────────────────────────────────────────────────────┐
│           Agent Layer                               │
│    (Individual Agents, MCP Containers)              │
└────────────────────────────────────────────────────┘
```

---

## Shared Libraries and Patterns

### Using Shared Utilities

The Workstation platform provides shared libraries in `src/shared/` to promote code reuse and consistency across all agents.

**Available Modules:**
- `@workstation/shared` - Logger, retry utilities, types
- Logging: Structured logging with levels and metadata
- Retry: Exponential backoff, circuit breaker, rate limiting
- Types: Common interfaces and type definitions

**Example: Using Shared Logger**

```typescript
import { createLogger } from '../../../src/shared';

const logger = createLogger('agent-browser-1');

logger.info('Agent started', { port: 3000 });
logger.warn('High memory usage', { usage: '85%' });
logger.error('Task failed', { taskId: '123', error: 'Timeout' });
```

**Example: Using Retry Utilities**

```typescript
import { withRetry, CircuitBreaker } from '../../../src/shared';

// Retry with exponential backoff
const result = await withRetry(
  () => fetch('https://api.example.com/data'),
  {
    maxRetries: 3,
    baseDelay: 1000,
    onRetry: (attempt, error) => {
      logger.warn('Retrying API call', { attempt, error: error.message });
    }
  }
);

// Circuit breaker for external services
const breaker = new CircuitBreaker(5, 60000);

async function callExternalAPI() {
  return breaker.execute(async () => {
    const response = await fetch('https://external.com');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  });
}
```

**Example: Using Shared Types**

```typescript
import type { AgentHandoff, TaskPayload, TaskResult } from '../../../src/shared';

async function processHandoff(handoff: AgentHandoff) {
  logger.info('Processing handoff', {
    from: handoff.fromAgent,
    to: handoff.toAgent,
    type: handoff.handoffType
  });
  
  const result: TaskResult = {
    success: true,
    data: handoff.data,
    executionTime: Date.now() - new Date(handoff.timestamp).getTime()
  };
  
  return result;
}
```

---

## Common Integration Patterns

### 1. Direct Task Assignment

The simplest pattern - orchestrator assigns task directly to agent.

**Use Case**: Single agent can complete task independently

**Flow**:
```
Client → Orchestrator → Agent → Result → Client
```

**Example**:
```typescript
// Client creates task
const taskId = await agentOrchestrator.createTask(
  '1', // agentId
  'scrape',
  { url: 'https://example.com' },
  'user-123',
  8 // priority
);

// Agent processes task
// Orchestrator returns result to client
const result = await agentOrchestrator.getTaskStatus(taskId);
```

---

### 2. Sequential Agent Handoff

Multiple agents process task in sequence.

**Use Case**: Multi-step workflow requiring different agent capabilities

**Flow**:
```
Client → Agent A → Agent B → Agent C → Result → Client
```

**Example - Web Scraping → Analysis → Storage**:
```typescript
// Step 1: Scrape data
const scrapeTaskId = await agentOrchestrator.createTask(
  'browser-agent',
  'scrape',
  { url: 'https://example.com' }
);

const scrapeResult = await waitForCompletion(scrapeTaskId);

// Step 2: Analyze data
const analyzeTaskId = await agentOrchestrator.createTask(
  'analysis-agent',
  'analyze',
  { data: scrapeResult.data }
);

const analysisResult = await waitForCompletion(analyzeTaskId);

// Step 3: Store results
const storeTaskId = await agentOrchestrator.createTask(
  'storage-agent',
  'store',
  { analysis: analysisResult.data }
);
```

---

### 3. Parallel Agent Execution

Multiple agents work on task simultaneously.

**Use Case**: Independent subtasks that can run concurrently

**Flow**:
```
              ┌─→ Agent A ─┐
Client → Orchestrator      ├→ Aggregator → Result
              └─→ Agent B ─┘
```

**Example - Multi-Source Data Collection**:
```typescript
// Create parallel tasks
const tasks = await Promise.all([
  agentOrchestrator.createTask('agent-1', 'fetch', { source: 'A' }),
  agentOrchestrator.createTask('agent-2', 'fetch', { source: 'B' }),
  agentOrchestrator.createTask('agent-3', 'fetch', { source: 'C' })
]);

// Wait for all to complete
const results = await Promise.all(
  tasks.map(taskId => waitForCompletion(taskId))
);

// Aggregate results
const combined = aggregateResults(results);
```

---

### 4. Event-Driven Messaging

Agents communicate via publish/subscribe events.

**Use Case**: Loosely coupled agents reacting to system events

**Flow**:
```
Agent A → Event Bus → [Agent B, Agent C, Agent D]
```

**Example - File Upload Event**:
```typescript
// In src/services/message-broker.ts
import { EventEmitter } from 'events';

class MessageBroker extends EventEmitter {
  publishEvent(eventType: string, payload: any) {
    this.emit(eventType, payload);
  }

  subscribeToEvent(eventType: string, handler: (payload: any) => void) {
    this.on(eventType, handler);
  }
}

// Agent A publishes event
messageBroker.publishEvent('file.uploaded', {
  fileId: '123',
  filename: 'data.csv',
  size: 1024000
});

// Agent B subscribes and reacts
messageBroker.subscribeToEvent('file.uploaded', async (event) => {
  await agentOrchestrator.createTask(
    'processing-agent',
    'process-file',
    { fileId: event.fileId }
  );
});
```

---

## Data Handoff Procedures

### Standard Handoff Format

When passing data between agents, use this standardized format:

```typescript
interface AgentHandoff {
  fromAgent: string;           // Source agent ID
  toAgent: string;             // Destination agent ID
  handoffType: string;         // Type of handoff
  timestamp: string;           // ISO 8601 timestamp
  data: any;                   // Actual data payload
  metadata: {
    correlationId: string;     // Track across agents
    priority: number;          // Task priority
    retryCount: number;        // Number of retries
    timeout: number;           // Timeout in milliseconds
  };
}
```

**Example**:
```typescript
const handoff: AgentHandoff = {
  fromAgent: 'browser-agent-1',
  toAgent: 'analysis-agent-2',
  handoffType: 'scraped-data',
  timestamp: new Date().toISOString(),
  data: {
    html: '<html>...</html>',
    url: 'https://example.com',
    screenshots: ['base64...']
  },
  metadata: {
    correlationId: 'workflow-abc-123',
    priority: 7,
    retryCount: 0,
    timeout: 30000
  }
};

await agentOrchestrator.createTask(
  handoff.toAgent,
  handoff.handoffType,
  handoff.data,
  handoff.fromAgent,
  handoff.metadata.priority
);
```

---

## Error Recovery Strategies

### 1. Retry with Exponential Backoff

Automatically retry failed tasks with increasing delays.

```typescript
async function executeWithRetry(
  agentId: string,
  taskType: string,
  payload: any,
  maxRetries: number = 3
): Promise<any> {
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      const taskId = await agentOrchestrator.createTask(
        agentId,
        taskType,
        payload,
        'retry-handler',
        5
      );
      
      const result = await waitForCompletion(taskId);
      
      if (result.status === 'completed') {
        return result.data;
      }
      
      throw new Error('Task failed');
    } catch (error) {
      attempt++;
      
      if (attempt >= maxRetries) {
        throw error;
      }
      
      // Exponential backoff: 1s, 2s, 4s, 8s...
      const delay = Math.pow(2, attempt) * 1000;
      await sleep(delay);
    }
  }
}
```

### 2. Circuit Breaker Pattern

Prevent cascading failures by stopping requests to failing agents.

```typescript
class CircuitBreaker {
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  async execute(agentId: string, task: any): Promise<any> {
    if (this.state === 'open') {
      // Check if we should try half-open
      if (Date.now() - this.lastFailureTime > 60000) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }
    
    try {
      const result = await agentOrchestrator.createTask(
        agentId,
        task.type,
        task.payload
      );
      
      // Success - reset circuit
      this.failureCount = 0;
      this.state = 'closed';
      
      return result;
    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = Date.now();
      
      // Open circuit after 5 failures
      if (this.failureCount >= 5) {
        this.state = 'open';
      }
      
      throw error;
    }
  }
}
```

### 3. Dead Letter Queue

Store failed tasks for manual inspection.

```typescript
async function handleFailedTask(taskId: string, error: any) {
  // Store in dead letter queue
  await db.query(
    `INSERT INTO dead_letter_queue 
      (task_id, error, created_at)
     VALUES ($1, $2, CURRENT_TIMESTAMP)`,
    [taskId, JSON.stringify(error)]
  );
  
  // Alert administrators
  await sendAlert({
    type: 'task_failure',
    taskId,
    error: error.message
  });
}
```

### 4. Fallback Agent

Use backup agent if primary agent fails.

```typescript
async function executeWithFallback(
  primaryAgentId: string,
  fallbackAgentId: string,
  taskType: string,
  payload: any
): Promise<any> {
  try {
    return await executeWithRetry(primaryAgentId, taskType, payload, 2);
  } catch (primaryError) {
    console.warn(`Primary agent ${primaryAgentId} failed, trying fallback`);
    
    try {
      return await executeWithRetry(fallbackAgentId, taskType, payload, 2);
    } catch (fallbackError) {
      throw new Error(
        `Both primary and fallback agents failed: ${fallbackError.message}`
      );
    }
  }
}
```

---

## Multi-Agent Coordination Patterns

### 1. Leader-Worker Pattern

One agent coordinates multiple worker agents.

```typescript
// Leader agent orchestrates workers
async function leaderAgent(job: any) {
  const workers = ['worker-1', 'worker-2', 'worker-3'];
  const chunks = splitIntoChunks(job.data, workers.length);
  
  const tasks = await Promise.all(
    chunks.map((chunk, i) => 
      agentOrchestrator.createTask(
        workers[i],
        'process-chunk',
        { chunk, jobId: job.id }
      )
    )
  );
  
  const results = await Promise.all(
    tasks.map(taskId => waitForCompletion(taskId))
  );
  
  return combineResults(results);
}
```

### 2. Pipeline Pattern

Agents form a processing pipeline.

```typescript
async function pipeline(data: any, agents: string[]) {
  let result = data;
  
  for (const agentId of agents) {
    const taskId = await agentOrchestrator.createTask(
      agentId,
      'transform',
      { input: result }
    );
    
    const taskResult = await waitForCompletion(taskId);
    result = taskResult.data.output;
  }
  
  return result;
}

// Usage
const finalResult = await pipeline(
  rawData,
  ['agent-fetch', 'agent-parse', 'agent-validate', 'agent-store']
);
```

### 3. Voting Pattern

Multiple agents vote on best result.

```typescript
async function voteOnBestResult(
  agentIds: string[],
  taskType: string,
  payload: any
): Promise<any> {
  // All agents process same task
  const tasks = await Promise.all(
    agentIds.map(agentId => 
      agentOrchestrator.createTask(agentId, taskType, payload)
    )
  );
  
  const results = await Promise.all(
    tasks.map(taskId => waitForCompletion(taskId))
  );
  
  // Vote on best result (e.g., by confidence score)
  const winner = results.reduce((best, current) => 
    current.data.confidence > best.data.confidence ? current : best
  );
  
  return winner.data;
}
```

---

## Best Practices

### Communication

1. **Use Standard Formats**: Always use `AgentHandoff` format
2. **Include Correlation IDs**: Track requests across agents
3. **Set Timeouts**: Prevent hung tasks
4. **Validate Payloads**: Verify data before processing

### Error Handling

1. **Graceful Degradation**: Continue with partial results
2. **Explicit Failures**: Don't silently fail
3. **Error Context**: Include relevant debugging info
4. **Retry Limits**: Prevent infinite retry loops

### Performance

1. **Async by Default**: Don't block on agent responses
2. **Batch Operations**: Combine multiple small tasks
3. **Cache Results**: Avoid redundant processing
4. **Monitor Latency**: Track agent response times

### Security

1. **Validate Inputs**: Sanitize all handoff data
2. **Authorize Agents**: Verify agent permissions
3. **Encrypt Sensitive Data**: Protect data in transit
4. **Audit Handoffs**: Log all agent communication

---

## Testing Agent Integration

### Unit Testing

Test individual agent logic:

```typescript
describe('Agent Integration', () => {
  it('should handle data handoff correctly', async () => {
    const handoff = {
      fromAgent: 'test-agent-1',
      toAgent: 'test-agent-2',
      data: { test: 'data' }
    };
    
    const taskId = await agentOrchestrator.createTask(
      handoff.toAgent,
      'test-task',
      handoff.data
    );
    
    expect(taskId).toBeDefined();
  });
});
```

### Integration Testing

Test multi-agent workflows:

```typescript
describe('Multi-Agent Workflow', () => {
  it('should complete sequential handoff', async () => {
    // Agent A → Agent B → Agent C
    const result = await pipeline(
      { data: 'test' },
      ['agent-a', 'agent-b', 'agent-c']
    );
    
    expect(result).toBeDefined();
    expect(result.processed).toBe(true);
  });
});
```

---

## Monitoring and Debugging

### Correlation ID Tracking

Track requests across agents:

```typescript
// Generate correlation ID at entry point
const correlationId = generateUUID();

// Pass through all handoffs
const handoff = {
  metadata: { correlationId },
  // ...
};

// Query all tasks for correlation ID
const relatedTasks = await db.query(
  `SELECT * FROM agent_tasks 
   WHERE payload->>'correlationId' = $1`,
  [correlationId]
);
```

### Performance Monitoring

Track agent communication latency:

```typescript
async function monitoredHandoff(
  fromAgent: string,
  toAgent: string,
  data: any
) {
  const start = Date.now();
  
  const taskId = await agentOrchestrator.createTask(
    toAgent,
    'handoff',
    data,
    fromAgent
  );
  
  const result = await waitForCompletion(taskId);
  
  const duration = Date.now() - start;
  
  // Log metrics
  await metrics.record('agent.handoff.duration', duration, {
    fromAgent,
    toAgent
  });
  
  return result;
}
```

---

## Troubleshooting

### Handoff Failures

**Symptom**: Data not reaching destination agent

**Solutions**:
1. Verify destination agent is running
2. Check task status in database
3. Review agent logs for errors
4. Validate payload format

### Circular Dependencies

**Symptom**: Agents waiting on each other infinitely

**Solutions**:
1. Use timeout mechanisms
2. Implement deadlock detection
3. Design acyclic workflows
4. Add circuit breakers

### Message Loss

**Symptom**: Events not received by subscribers

**Solutions**:
1. Ensure message broker is running
2. Verify event names match
3. Check subscriber registration
4. Use persistent message queue

---

## Related Documentation

- [Orchestration System](./ORCHESTRATION.md) - Core orchestrator documentation
- [Subsystem Integration](./SUBSYSTEM_INTEGRATION.md) - MCP and message broker
- [API Reference](../API.md) - Complete API documentation
- [Architecture Overview](../ARCHITECTURE.md) - System architecture

---

## Support

For questions or issues with agent integration:
- **GitHub Issues**: https://github.com/creditXcredit/workstation/issues
- **Documentation**: See `/docs` directory
- **Source Code**: `src/services/agent-orchestrator.ts`, `src/services/message-broker.ts`
