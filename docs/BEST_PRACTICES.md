# Workstation Best Practices Guide

**Version**: 1.0  
**Last Updated**: November 24, 2024  
**Audience**: Agent Developers, System Architects, DevOps Engineers

---

## Table of Contents

1. [Agent Development](#agent-development)
2. [Task Design](#task-design)
3. [Error Handling](#error-handling)
4. [Performance Optimization](#performance-optimization)
5. [Security](#security)
6. [Testing](#testing)
7. [Deployment](#deployment)
8. [Monitoring](#monitoring)
9. [Documentation](#documentation)
10. [Code Style](#code-style)

---

## Agent Development

### Use Shared Libraries

**❌ Don't:** Duplicate utility code across agents

```typescript
// agents/agent1/utils/logger.ts
export function log(message: string) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

// agents/agent2/utils/logger.ts
export function log(message: string) {  // Duplicate!
  console.log(`[${new Date().toISOString()}] ${message}`);
}
```

**✅ Do:** Use shared libraries

```typescript
// All agents
import { logger } from '../../../src/shared';

logger.info('Agent started', { agentId: 'agent1' });
```

### Agent Structure

**✅ Recommended Directory Structure:**

```
agents/agent-name/
├── src/
│   ├── index.ts           # Main entry point
│   ├── handlers/          # Task handlers
│   │   ├── scrape.ts
│   │   └── analyze.ts
│   ├── utils/             # Agent-specific utils only
│   │   └── specific.ts
│   └── types/             # Agent-specific types
│       └── custom.ts
├── tests/
│   ├── unit/
│   └── integration/
├── package.json
├── tsconfig.json
└── README.md
```

### Agent Registration

**✅ Auto-register on startup:**

```typescript
import { agentOrchestrator } from '@workstation/orchestrator';

async function register() {
  await agentOrchestrator.registerAgent({
    id: process.env.AGENT_ID,
    type: 'browser',
    capabilities: ['navigate', 'scrape', 'screenshot'],
    healthCheck: {
      enabled: true,
      interval: 60000,
    }
  });
}

register().catch(console.error);
```

### Health Checks

**✅ Implement comprehensive health checks:**

```typescript
import { HealthCheckResult } from '@workstation/shared';

export async function healthCheck(): Promise<HealthCheckResult> {
  const checks = [];

  // Check database connection
  checks.push(await checkDatabase());

  // Check browser instance
  checks.push(await checkBrowser());

  // Check memory usage
  checks.push(checkMemory());

  const healthy = checks.every(c => c.status === 'pass');

  return {
    healthy,
    status: healthy ? 'healthy' : 'degraded',
    checks,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };
}
```

---

## Task Design

### Idempotency

**✅ Design tasks to be safely retried:**

```typescript
async function processTask(payload: TaskPayload): Promise<TaskResult> {
  const { itemId, operation } = payload;

  // Check if already processed
  const existing = await db.query(
    'SELECT * FROM processed_items WHERE id = $1',
    [itemId]
  );

  if (existing.rows.length > 0) {
    logger.info('Task already processed', { itemId });
    return { success: true, data: existing.rows[0] };
  }

  // Process item
  const result = await performOperation(operation, itemId);

  // Record processing
  await db.query(
    'INSERT INTO processed_items (id, result) VALUES ($1, $2)',
    [itemId, result]
  );

  return { success: true, data: result };
}
```

### Payload Size

**❌ Don't:** Send large payloads

```typescript
// Payload size: 10MB
await createTask(agentId, 'process', {
  images: [huge_base64_image1, huge_base64_image2, ...],  // Bad!
});
```

**✅ Do:** Use references

```typescript
// Payload size: <1KB
await createTask(agentId, 'process', {
  imageUrls: ['s3://bucket/img1.jpg', 's3://bucket/img2.jpg'],
});

// Or use database
await createTask(agentId, 'process', {
  batchId: '12345',  // Fetch images from DB using batch ID
});
```

### Task Granularity

**✅ Break large tasks into smaller units:**

```typescript
// ❌ One large task (risky)
await createTask('agent1', 'process-entire-website', {
  url: 'https://large-site.com',
  depth: 10,  // Will take hours!
});

// ✅ Many small tasks (resilient)
const pages = await discoverPages('https://large-site.com');

for (const page of pages) {
  await createTask('agent1', 'process-page', {
    url: page.url,
    timeout: 30000,
  });
}
```

### Priority Guidelines

**✅ Use priorities appropriately:**

```typescript
enum TaskPriority {
  CRITICAL = 10,    // System health, security
  HIGH = 8-9,       // User-facing, time-sensitive
  NORMAL = 5-7,     // Standard operations
  LOW = 1-4,        // Background, cleanup
}

// Examples
await createTask(agentId, 'security-scan', payload, 'system', 10);  // Critical
await createTask(agentId, 'user-request', payload, userId, 8);      // High
await createTask(agentId, 'background-sync', payload, 'cron', 3);   // Low
```

---

## Error Handling

### Use Structured Errors

**✅ Create domain-specific errors:**

```typescript
import { TaskError } from '@workstation/shared';

async function processTask(taskId: string) {
  try {
    const data = await fetchData();
    return processData(data);
  } catch (error) {
    if (error.code === 'NETWORK_ERROR') {
      throw new TaskError(
        'Failed to fetch data',
        'FETCH_ERROR',
        taskId,
        { originalError: error.message }
      );
    }
    throw error;
  }
}
```

### Retry Logic

**✅ Use shared retry utilities:**

```typescript
import { withRetry } from '@workstation/shared';

async function fetchWithRetry(url: string) {
  return withRetry(
    () => fetch(url).then(r => r.json()),
    {
      maxRetries: 3,
      baseDelay: 1000,
      shouldRetry: (error) => {
        // Don't retry 4xx errors
        return !error.message.includes('4');
      },
      onRetry: (attempt, error) => {
        logger.warn('Retrying fetch', { attempt, url, error: error.message });
      },
    }
  );
}
```

### Circuit Breaker

**✅ Prevent cascading failures:**

```typescript
import { CircuitBreaker } from '@workstation/shared';

const breaker = new CircuitBreaker(5, 60000, 30000);

async function callExternalAPI(data: any) {
  return breaker.execute(async () => {
    const response = await fetch('https://external-api.com', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    return response.json();
  });
}
```

### Graceful Degradation

**✅ Continue with partial results:**

```typescript
async function gatherData(sources: string[]): Promise<DataResult> {
  const results = await Promise.allSettled(
    sources.map(source => fetchFromSource(source))
  );

  const successful = results
    .filter(r => r.status === 'fulfilled')
    .map(r => (r as PromiseFulfilledResult<any>).value);

  const failed = results
    .filter(r => r.status === 'rejected')
    .map(r => (r as PromiseRejectedResult).reason);

  if (successful.length === 0) {
    throw new Error('All sources failed');
  }

  logger.warn('Some sources failed', {
    total: sources.length,
    successful: successful.length,
    failed: failed.length,
  });

  return {
    data: successful,
    partial: failed.length > 0,
    errors: failed,
  };
}
```

---

## Performance Optimization

### Connection Pooling

**✅ Reuse connections:**

```typescript
import { Pool } from 'pg';

// ✅ Create pool once
const pool = new Pool({
  host: 'localhost',
  database: 'workstation',
  max: 20,
  idleTimeoutMillis: 30000,
});

// ❌ Don't create new connection per query
async function badQuery() {
  const client = new Pool({ ... });  // Bad!
  await client.query('SELECT 1');
  await client.end();
}

// ✅ Use pool
async function goodQuery() {
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
  } finally {
    client.release();
  }
}
```

### Caching

**✅ Cache expensive operations:**

```typescript
import { LRUCache } from 'lru-cache';

const cache = new LRUCache<string, any>({
  max: 500,
  ttl: 1000 * 60 * 5, // 5 minutes
});

async function getAgentStatus(agentId: string) {
  const cached = cache.get(`agent:${agentId}`);
  if (cached) return cached;

  const status = await db.query(
    'SELECT * FROM agent_registry WHERE id = $1',
    [agentId]
  );

  cache.set(`agent:${agentId}`, status.rows[0]);
  return status.rows[0];
}
```

### Batch Operations

**✅ Process in batches:**

```typescript
// ❌ One at a time
for (const item of items) {
  await processItem(item);  // Slow!
}

// ✅ Batch processing
const BATCH_SIZE = 10;

for (let i = 0; i < items.length; i += BATCH_SIZE) {
  const batch = items.slice(i, i + BATCH_SIZE);
  await Promise.all(batch.map(item => processItem(item)));
}
```

### Rate Limiting

**✅ Limit concurrent operations:**

```typescript
import { RateLimiter } from '@workstation/shared';

const limiter = new RateLimiter(5, 1000); // 5 concurrent, 1s interval

async function processMany(items: any[]) {
  const results = await Promise.all(
    items.map(item => limiter.execute(() => processItem(item)))
  );
  return results;
}
```

---

## Security

### Input Validation

**✅ Validate all inputs:**

```typescript
import Joi from 'joi';

const taskSchema = Joi.object({
  url: Joi.string().uri().required(),
  depth: Joi.number().integer().min(1).max(5).default(2),
  timeout: Joi.number().integer().min(1000).max(60000).default(30000),
});

async function validateAndProcess(payload: any) {
  const { error, value } = taskSchema.validate(payload);

  if (error) {
    throw new TaskError('Invalid payload', 'VALIDATION_ERROR', undefined, {
      details: error.details,
    });
  }

  return processTask(value);
}
```

### Sanitization

**✅ Sanitize user inputs:**

```typescript
import DOMPurify from 'isomorphic-dompurify';
import validator from 'validator';

function sanitizeInput(input: any) {
  if (typeof input === 'string') {
    // Remove HTML
    const clean = DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
    
    // Escape special characters
    return validator.escape(clean);
  }
  
  if (typeof input === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[validator.escape(key)] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return input;
}
```

### Secrets Management

**✅ Never commit secrets:**

```typescript
// ❌ Don't
const API_KEY = 'sk-1234567890abcdef';  // Bad!

// ✅ Do
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error('API_KEY environment variable not set');
}
```

**✅ Use secret management:**

```typescript
import { SecretsManager } from '@aws-sdk/client-secrets-manager';

const secretsManager = new SecretsManager({ region: 'us-east-1' });

async function getSecret(secretName: string) {
  const response = await secretsManager.getSecretValue({
    SecretId: secretName,
  });

  return JSON.parse(response.SecretString!);
}
```

### Authentication

**✅ Always validate JWT tokens:**

```typescript
import jwt from 'jsonwebtoken';

function authenticateToken(token: string) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    return decoded;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

app.use((req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    req.user = authenticateToken(token);
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid token' });
  }
});
```

---

## Testing

### Unit Tests

**✅ Test individual functions:**

```typescript
import { describe, it, expect, beforeEach } from '@jest/globals';
import { processTask } from '../src/handlers/process';

describe('processTask', () => {
  beforeEach(() => {
    // Setup
  });

  it('should process valid payload', async () => {
    const payload = { url: 'https://example.com' };
    const result = await processTask(payload);
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  it('should reject invalid payload', async () => {
    const payload = { url: 'not-a-url' };
    
    await expect(processTask(payload)).rejects.toThrow('VALIDATION_ERROR');
  });

  it('should retry on failure', async () => {
    // Mock to fail twice, then succeed
    let attempts = 0;
    jest.spyOn(global, 'fetch').mockImplementation(() => {
      attempts++;
      if (attempts < 3) throw new Error('Network error');
      return Promise.resolve(new Response('OK'));
    });

    const result = await processTask({ url: 'https://example.com' });
    
    expect(attempts).toBe(3);
    expect(result.success).toBe(true);
  });
});
```

### Integration Tests

**✅ Test agent integration:**

```typescript
import { agentOrchestrator } from '@workstation/orchestrator';

describe('Agent Integration', () => {
  it('should complete full workflow', async () => {
    // Create task
    const taskId = await agentOrchestrator.createTask(
      'agent1',
      'scrape',
      { url: 'https://example.com' }
    );

    // Wait for completion
    let status;
    for (let i = 0; i < 30; i++) {
      status = await agentOrchestrator.getTaskStatus(taskId);
      if (status.status === 'completed') break;
      await new Promise(r => setTimeout(r, 1000));
    }

    expect(status.status).toBe('completed');
    expect(status.result.success).toBe(true);
  });
});
```

### Coverage Goals

**✅ Maintain high coverage:**

```json
{
  "jest": {
    "coverageThreshold": {
      "global": {
        "branches": 90,
        "functions": 95,
        "lines": 95,
        "statements": 95
      }
    }
  }
}
```

---

## Deployment

### Environment-Specific Configuration

**✅ Use environment variables:**

```typescript
const config = {
  development: {
    logLevel: 'debug',
    dbPool: 10,
    cacheEnabled: false,
  },
  production: {
    logLevel: 'info',
    dbPool: 50,
    cacheEnabled: true,
  },
};

export default config[process.env.NODE_ENV || 'development'];
```

### Health Checks

**✅ Implement readiness and liveness:**

```typescript
// Liveness - is the service running?
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', uptime: process.uptime() });
});

// Readiness - is the service ready to handle requests?
app.get('/ready', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ ready: true });
  } catch (error) {
    res.status(503).json({ ready: false, error: error.message });
  }
});
```

### Graceful Shutdown

**✅ Handle shutdown signals:**

```typescript
let server: any;

async function shutdown(signal: string) {
  logger.info(`Received ${signal}, shutting down gracefully`);

  // Stop accepting new requests
  server.close(async () => {
    logger.info('HTTP server closed');

    // Finish current tasks
    await finishPendingTasks();

    // Close database connections
    await db.end();

    logger.info('Shutdown complete');
    process.exit(0);
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

server = app.listen(3000);
```

---

## Monitoring

### Metrics

**✅ Track key metrics:**

```typescript
import promClient from 'prom-client';

const taskCounter = new promClient.Counter({
  name: 'workstation_tasks_total',
  help: 'Total number of tasks',
  labelNames: ['agent', 'type', 'status'],
});

const taskDuration = new promClient.Histogram({
  name: 'workstation_task_duration_seconds',
  help: 'Task execution duration',
  labelNames: ['agent', 'type'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
});

async function executeTask(agent: string, type: string, task: any) {
  const end = taskDuration.startTimer({ agent, type });

  try {
    const result = await task();
    taskCounter.inc({ agent, type, status: 'success' });
    return result;
  } catch (error) {
    taskCounter.inc({ agent, type, status: 'failure' });
    throw error;
  } finally {
    end();
  }
}
```

### Logging

**✅ Use structured logging:**

```typescript
import { logger } from '@workstation/shared';

// ❌ Don't
console.log('Task failed: ' + taskId);

// ✅ Do
logger.error('Task failed', {
  taskId,
  agentId: 'agent1',
  error: error.message,
  stack: error.stack,
});
```

### Alerts

**✅ Set up alerts:**

```yaml
# prometheus-alerts.yml
groups:
  - name: workstation
    rules:
      - alert: HighTaskFailureRate
        expr: rate(workstation_tasks_total{status="failure"}[5m]) > 0.1
        for: 5m
        annotations:
          summary: "High task failure rate"

      - alert: AgentUnhealthy
        expr: workstation_agent_health{status="unhealthy"} == 1
        for: 2m
        annotations:
          summary: "Agent {{ $labels.agent }} is unhealthy"
```

---

## Documentation

### Code Comments

**✅ Document complex logic:**

```typescript
/**
 * Processes a batch of items with priority-based scheduling.
 * 
 * Algorithm:
 * 1. Sort items by priority (high to low)
 * 2. Group into batches of BATCH_SIZE
 * 3. Process batches sequentially with rate limiting
 * 4. Retry failed items up to MAX_RETRIES times
 * 
 * @param items - Array of items to process
 * @param options - Processing options
 * @returns Array of results with success/failure status
 * @throws {TaskError} If all retries are exhausted
 */
async function processBatch(items: Item[], options: Options): Promise<Result[]> {
  // Implementation
}
```

### API Documentation

**✅ Document all endpoints:**

```typescript
/**
 * @api {post} /api/agents/tasks Create Task
 * @apiName CreateTask
 * @apiGroup Tasks
 * 
 * @apiParam {String} agentId Agent ID
 * @apiParam {String} type Task type
 * @apiParam {Object} payload Task payload
 * @apiParam {Number{1-10}} [priority=5] Task priority
 * 
 * @apiSuccess {String} taskId Created task ID
 * 
 * @apiError {String} error Error message
 * 
 * @apiExample {curl} Example:
 *   curl -X POST http://localhost:3000/api/agents/tasks \
 *     -H "Authorization: Bearer TOKEN" \
 *     -d '{"agentId":"1","type":"scrape","payload":{...}}'
 */
app.post('/api/agents/tasks', async (req, res) => {
  // Implementation
});
```

### README Files

**✅ Comprehensive README:**

```markdown
# Agent Name

Brief description of agent functionality.

## Features
- Feature 1
- Feature 2

## Prerequisites
- Node.js 18+
- PostgreSQL 15+

## Installation
\`\`\`bash
npm install
\`\`\`

## Configuration
See .env.example

## Usage
\`\`\`bash
npm start
\`\`\`

## API
See docs/API.md

## Testing
\`\`\`bash
npm test
\`\`\`

## License
MIT
```

---

## Code Style

### TypeScript Best Practices

**✅ Use strict mode:**

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

**✅ Explicit types:**

```typescript
// ❌ Don't
function processData(data) {  // Implicit any
  return data.map(item => item.value);
}

// ✅ Do
function processData(data: DataItem[]): number[] {
  return data.map(item => item.value);
}
```

### Naming Conventions

**✅ Follow conventions:**

```typescript
// Classes: PascalCase
class AgentManager {}

// Interfaces: PascalCase with 'I' prefix (optional)
interface IAgentConfig {}

// Functions/variables: camelCase
const agentCount = 5;
function getAgentStatus() {}

// Constants: UPPER_SNAKE_CASE
const MAX_RETRIES = 3;
const API_BASE_URL = 'http://localhost:3000';

// Files: kebab-case
// agent-orchestrator.ts
// task-processor.ts
```

### Async/Await

**✅ Prefer async/await over promises:**

```typescript
// ❌ Don't
function getData() {
  return fetch(url)
    .then(r => r.json())
    .then(data => processData(data))
    .catch(error => handleError(error));
}

// ✅ Do
async function getData() {
  try {
    const response = await fetch(url);
    const data = await response.json();
    return processData(data);
  } catch (error) {
    handleError(error);
  }
}
```

---

## Checklist for New Agents

- [ ] Uses shared libraries (logger, retry, types)
- [ ] Implements health checks
- [ ] Auto-registers with orchestrator
- [ ] Has comprehensive error handling
- [ ] Validates all inputs
- [ ] Includes unit tests (95%+ coverage)
- [ ] Includes integration tests
- [ ] Has README.md documentation
- [ ] Uses environment variables for config
- [ ] Implements graceful shutdown
- [ ] Has Docker configuration
- [ ] Exposes Prometheus metrics
- [ ] Uses structured logging
- [ ] Follows TypeScript strict mode
- [ ] No secrets in code

---

## Additional Resources

- [Orchestration Documentation](./ORCHESTRATION.md)
- [Agent Integration Guide](./AGENT_INTEGRATION.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)
- [API Reference](../API.md)
- [Architecture Overview](../ARCHITECTURE.md)

---

*Last updated: November 24, 2024*  
*Review frequency: Monthly*  
*Maintained by: Workstation Architecture Team*
