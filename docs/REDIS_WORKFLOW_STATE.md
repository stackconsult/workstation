# Phase 4 Redis and Workflow State Management Documentation

## Overview

Phase 4 introduces Redis-based caching and distributed state management to improve scalability, performance, and reliability of the Workstation system.

## Table of Contents

- [Redis Service](#redis-service)
- [Session Caching](#session-caching)
- [Workflow State Management](#workflow-state-management)
- [Distributed Locks](#distributed-locks)
- [API Endpoints](#api-endpoints)
- [Configuration](#configuration)
- [Monitoring](#monitoring)

## Redis Service

### Features

- **Graceful Degradation**: Automatically falls back to in-memory storage if Redis is unavailable
- **Session Caching**: Fast user session storage and retrieval
- **Workflow State Tracking**: Real-time workflow execution monitoring
- **Distributed Locks**: Prevent concurrent workflow executions
- **API Response Caching**: Improve API performance

### Architecture

```
┌─────────────────────────────────────┐
│   Application Layer                 │
│   (Express.js routes & services)    │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│   Redis Service                     │
│   (src/services/redis.ts)           │
│   - Connection management           │
│   - Graceful degradation            │
│   - Memory fallback                 │
└────────────┬────────────────────────┘
             │
      ┌──────┴──────┐
      ▼             ▼
┌──────────┐  ┌──────────────┐
│  Redis   │  │  In-Memory   │
│  Server  │  │  Store       │
│(if avail)│  │  (fallback)  │
└──────────┘  └──────────────┘
```

### Connection Management

The Redis service automatically manages connections with:

- **Retry Strategy**: 3 retries with exponential backoff
- **Health Checks**: Continuous monitoring of connection status
- **Fallback**: Seamless transition to in-memory storage on failure

### Configuration

Set via environment variables:

```bash
# Enable Redis (default: true in production, false otherwise)
REDIS_ENABLED=true

# Redis connection details
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-secure-password
REDIS_DB=0
```

## Session Caching

### Overview

User sessions are cached in Redis with automatic TTL management:

- **Default TTL**: 24 hours
- **Key Format**: `wks:session:{userId}`
- **Fallback**: In-memory map if Redis unavailable

### API Usage

```typescript
import { setSession, getSession, deleteSession } from './services/redis';

// Store session
await setSession('user123', {
  token: 'abc...',
  role: 'admin',
  lastActivity: Date.now()
}, 86400); // 24 hours TTL

// Retrieve session
const session = await getSession('user123');

// Delete session (logout)
await deleteSession('user123');
```

### Benefits

- **Fast Access**: Sub-millisecond session lookups
- **Scalability**: Supports multiple application instances
- **Automatic Expiration**: Sessions expire without manual cleanup
- **High Availability**: Falls back to memory if Redis fails

## Workflow State Management

### Overview

Real-time tracking of workflow executions with distributed state:

- **Execution Tracking**: Monitor progress of all running workflows
- **State Persistence**: Workflow state survives application restarts (if Redis available)
- **Progress Monitoring**: Track percentage completion and current steps
- **Estimated Completion**: Calculate ETA based on progress

### Workflow State Schema

```typescript
interface WorkflowState {
  executionId: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number; // 0-100
  currentStep: string;
  totalSteps: number;
  completedSteps: number;
  data: Record<string, any>;
  startedAt: number;
  updatedAt: number;
  estimatedCompletion?: number;
  error?: string;
}
```

### Usage Example

```typescript
import {
  startWorkflowTracking,
  updateWorkflowProgress,
  completeWorkflowTracking,
  fetchWorkflowState
} from './services/workflow-state-manager';

// Start tracking
await startWorkflowTracking(
  'exec-123',
  'workflow-456',
  5, // totalSteps
  { userId: 'user123' }
);

// Update progress
await updateWorkflowProgress(
  'exec-123',
  2, // completedSteps
  'Processing data',
  { recordsProcessed: 100 }
);

// Complete
await completeWorkflowTracking(
  'exec-123',
  'completed',
  undefined,
  { totalRecords: 500 }
);

// Fetch state
const state = await fetchWorkflowState('exec-123');
```

### API Endpoints

#### Get Workflow State

```bash
GET /api/workflow-state/:executionId
Authorization: Bearer {token}
```

**Response:**

```json
{
  "success": true,
  "state": {
    "executionId": "exec-123",
    "workflowId": "workflow-456",
    "status": "running",
    "progress": 40,
    "currentStep": "Processing data",
    "totalSteps": 5,
    "completedSteps": 2,
    "startedAt": 1700000000000,
    "updatedAt": 1700000030000,
    "estimatedCompletion": 1700000075000
  }
}
```

#### List Active Workflows

```bash
GET /api/workflow-state/active/list
Authorization: Bearer {token}
```

**Response:**

```json
{
  "success": true,
  "activeExecutions": [
    "exec-123",
    "exec-456",
    "exec-789"
  ],
  "count": 3
}
```

#### Get Detailed Active Workflows

```bash
GET /api/workflow-state/active/detailed
Authorization: Bearer {token}
```

**Response:**

```json
{
  "success": true,
  "workflows": [
    {
      "executionId": "exec-123",
      "status": "running",
      "progress": 40,
      "currentStep": "Processing data"
    }
  ],
  "count": 1
}
```

#### Get Workflow Statistics

```bash
GET /api/workflow-state/stats/overview
Authorization: Bearer {token}
```

**Response:**

```json
{
  "success": true,
  "statistics": {
    "activeExecutions": 3,
    "executionsByStatus": {
      "pending": 0,
      "running": 3,
      "completed": 0,
      "failed": 0,
      "cancelled": 0
    },
    "averageProgress": 35
  }
}
```

#### Clean Up Stale Workflows

```bash
POST /api/workflow-state/cleanup
Authorization: Bearer {token}
```

**Response:**

```json
{
  "success": true,
  "message": "Cleanup completed",
  "cleaned": 2,
  "errors": 0
}
```

## Distributed Locks

### Overview

Prevent concurrent execution of the same workflow using distributed locks:

- **Lock Key Format**: `wks:lock:execution:{executionId}`
- **Default TTL**: 5 minutes
- **Automatic Release**: Locks expire automatically
- **Failsafe**: Works with in-memory fallback

### Usage

```typescript
import {
  lockWorkflowExecution,
  unlockWorkflowExecution,
  isWorkflowLocked,
  executeWithLock
} from './services/workflow-state-manager';

// Manual lock/unlock
const locked = await lockWorkflowExecution('exec-123', 'worker-1');
if (!locked) {
  console.error('Workflow already locked');
}
// ... do work ...
await unlockWorkflowExecution('exec-123');

// Automatic lock management
try {
  const result = await executeWithLock(
    'exec-123',
    'worker-1',
    async () => {
      // This code runs with the lock held
      return await doWork();
    }
  );
} catch (error) {
  // Lock already held by another worker
}
```

### Lock Behavior

- **Acquisition**: Returns `true` if lock acquired, `false` if already locked
- **TTL**: Locks expire after 5 minutes to prevent deadlocks
- **Worker ID**: Identifies which worker holds the lock
- **Automatic Release**: `executeWithLock` releases lock even on error

## API Response Caching

### Overview

Cache expensive API responses to improve performance:

- **Key Format**: `wks:cache:api:{hash}`
- **Default TTL**: 1 hour
- **Hash**: MD5 of request parameters

### Usage

```typescript
import { cacheAPIResponse, getCachedAPIResponse } from './services/redis';

// Generate cache key from request
const cacheKey = crypto.createHash('md5')
  .update(JSON.stringify(req.query))
  .digest('hex');

// Check cache
let response = await getCachedAPIResponse(cacheKey);

if (!response) {
  // Compute response
  response = await expensiveOperation();
  
  // Cache for 1 hour
  await cacheAPIResponse(cacheKey, response, 3600);
}

res.json(response);
```

## Monitoring

### Health Check Integration

Redis status is included in the health check endpoint:

```bash
GET /health
```

**Response:**

```json
{
  "status": "healthy",
  "checks": {
    "database": { "status": "up", "latency": 5 },
    "redis": { "status": "up", "latency": 2 },
    "diskSpace": { "status": "up", "available": "50.5GB" }
  }
}
```

### Redis Health States

| Status | Description |
|--------|-------------|
| `up` | Redis connected and responding |
| `down` | Redis enabled but not connected |
| `disabled` | Redis not enabled (using memory fallback) |
| `error` | Error checking Redis status |

### Metrics

Redis operations are tracked via Prometheus metrics:

```bash
GET /metrics
```

Relevant metrics:

- `redis_commands_total` - Total Redis commands executed
- `redis_commands_failed_total` - Failed Redis commands
- `redis_connection_status` - Connection status (1=up, 0=down)

## Performance Optimization

### Connection Pooling

Redis uses a single connection with pipelining for optimal performance.

### Batch Operations

For bulk operations, use pipeline mode:

```typescript
// Future enhancement - not implemented yet
const pipeline = redisClient.pipeline();
pipeline.set('key1', 'value1');
pipeline.set('key2', 'value2');
await pipeline.exec();
```

### Memory Management

In-memory fallback automatically cleans up expired items every 60 seconds.

## Best Practices

### DO

✅ Enable Redis in production for better scalability  
✅ Monitor Redis memory usage  
✅ Use appropriate TTLs for different data types  
✅ Handle Redis unavailability gracefully  
✅ Set up Redis persistence (RDB/AOF)  
✅ Use Redis Sentinel/Cluster for high availability  

### DON'T

❌ Store large objects in Redis (>1MB)  
❌ Use Redis as primary data store  
❌ Disable Redis without testing in-memory mode  
❌ Set TTLs too short (causes cache thrashing)  
❌ Ignore Redis connection errors  
❌ Store sensitive data without encryption  

## Troubleshooting

### Redis Connection Failed

**Symptom:** Application logs show Redis connection errors

**Solution:**

1. Check Redis is running: `redis-cli ping`
2. Verify connection details in `.env`
3. Check firewall rules
4. Application will fall back to memory automatically

### High Memory Usage

**Symptom:** Redis using excessive memory

**Solution:**

1. Check memory usage: `redis-cli info memory`
2. Review TTL settings (increase if too short)
3. Implement eviction policy: `maxmemory-policy allkeys-lru`
4. Clear cache: `redis-cli FLUSHDB`

### Stale Workflow States

**Symptom:** Old workflow executions shown as active

**Solution:**

```bash
# Run cleanup endpoint
curl -X POST http://localhost:3000/api/workflow-state/cleanup \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Future Enhancements

- [ ] Redis Cluster support for horizontal scaling
- [ ] Pub/Sub for real-time workflow updates
- [ ] Advanced caching strategies (cache warming, cache aside)
- [ ] Redis Streams for workflow event logging
- [ ] Encryption at rest for sensitive cached data

## References

- [Redis Documentation](https://redis.io/documentation)
- [ioredis Client](https://github.com/redis/ioredis)
- [Workflow State Manager Source](../src/services/workflow-state-manager.ts)
- [Redis Service Source](../src/services/redis.ts)

---

**Document Owner**: Backend Team  
**Last Updated**: 2025-11-24  
**Review Frequency**: Quarterly
