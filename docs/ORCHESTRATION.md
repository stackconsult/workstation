# Agent Orchestration System

**Version**: 1.0  
**Last Updated**: November 24, 2024  
**Status**: ✅ Production Ready

---

## Overview

The Workstation Agent Orchestration System is a database-backed task management and coordination platform that manages 21+ agents and 20+ MCP containers. It provides:

- ✅ **Persistent Task Queue** - PostgreSQL-backed task persistence
- ✅ **Agent Registry** - Centralized agent metadata and health tracking  
- ✅ **Lifecycle Management** - Start/stop/restart agent containers
- ✅ **Health Monitoring** - Real-time agent health status
- ✅ **Task Distribution** - Intelligent task routing to agents
- ✅ **Statistics Tracking** - Performance metrics and analytics

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                   Express API Server                     │
│                   (src/index.ts)                         │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Agent Routes (/api/agents)                  │
│              (src/routes/agents.ts)                      │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│           Agent Orchestrator Service                     │
│        (src/services/agent-orchestrator.ts)              │
│                                                           │
│  • getAllAgents()                                        │
│  • createTask(agentId, type, payload)                   │
│  • getTaskStatus(taskId)                                │
│  • startAgent(agentId) / stopAgent(agentId)             │
│  • updateAgentHealth(agentId, status)                   │
│  • getAgentStatistics(agentId)                          │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              PostgreSQL Database                         │
│                                                           │
│  Tables:                                                 │
│  • agent_registry - Agent metadata                      │
│  • agent_tasks - Task queue and history                 │
└─────────────────────────────────────────────────────────┘
```

### Database Schema

#### agent_registry Table

Stores metadata for all registered agents and MCP containers.

```sql
CREATE TABLE agent_registry (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    container_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'stopped',
    health_status VARCHAR(50) DEFAULT 'unknown',
    capabilities TEXT[],
    metadata JSONB,
    last_health_check TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Fields**:
- `id` - Unique agent identifier
- `name` - Human-readable agent name
- `type` - Agent type (e.g., 'browser', 'code', 'mcp')
- `container_name` - Docker container name (if containerized)
- `status` - Current status ('running', 'stopped', 'error')
- `health_status` - Health check result ('healthy', 'unhealthy', 'degraded')
- `capabilities` - Array of agent capabilities
- `metadata` - Additional agent-specific data
- `last_health_check` - Timestamp of last health check
- `created_at` - Agent registration timestamp

#### agent_tasks Table

Stores task queue and execution history.

```sql
CREATE TABLE agent_tasks (
    id SERIAL PRIMARY KEY,
    agent_id INTEGER REFERENCES agent_registry(id),
    type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    priority INTEGER DEFAULT 5,
    status VARCHAR(50) DEFAULT 'pending',
    created_by VARCHAR(255),
    result JSONB,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP
);
```

**Fields**:
- `id` - Unique task identifier
- `agent_id` - Target agent for task execution
- `type` - Task type (e.g., 'scrape', 'analyze', 'deploy')
- `payload` - Task input data
- `priority` - Task priority (1-10, higher = more important)
- `status` - Task status ('pending', 'running', 'completed', 'failed')
- `created_by` - User ID that created the task
- `result` - Task output data
- `retry_count` - Number of retry attempts
- `max_retries` - Maximum allowed retries

---

## API Endpoints

All endpoints require JWT authentication via `Authorization: Bearer <token>` header.

### Agent Management

#### GET /api/agents
Get all registered agents.

**Response**:
```json
{
  "success": true,
  "data": {
    "agents": [
      {
        "id": "1",
        "name": "browser-automation-agent",
        "type": "browser",
        "containerName": "agent-browser-1",
        "status": "running",
        "healthStatus": "healthy",
        "capabilities": ["navigate", "click", "scrape"],
        "lastHealthCheck": "2024-11-24T18:00:00Z"
      }
    ],
    "total": 21
  }
}
```

#### GET /api/agents/:id
Get specific agent details with statistics.

**Response**:
```json
{
  "success": true,
  "data": {
    "agent": {
      "id": "1",
      "name": "browser-automation-agent",
      "status": "running"
    },
    "stats": {
      "total_tasks": "150",
      "completed_tasks": "142",
      "failed_tasks": "5",
      "active_tasks": "3",
      "avg_execution_time_ms": 2500
    }
  }
}
```

#### POST /api/agents/:id/start
Start an agent container.

**Response**:
```json
{
  "success": true,
  "message": "Agent 1 started successfully"
}
```

#### POST /api/agents/:id/stop
Stop an agent container.

**Response**:
```json
{
  "success": true,
  "message": "Agent 1 stopped successfully"
}
```

#### POST /api/agents/:id/health
Update agent health status.

**Request Body**:
```json
{
  "healthStatus": "healthy",
  "metadata": {
    "cpu": "25%",
    "memory": "512MB",
    "uptime": 3600
  }
}
```

### Task Management

#### POST /api/agents/tasks
Create a new agent task.

**Request Body**:
```json
{
  "agentId": "1",
  "type": "scrape",
  "payload": {
    "url": "https://example.com",
    "selectors": ["h1", ".content"]
  },
  "priority": 8
}
```

**Response**:
```json
{
  "success": true,
  "taskId": "42",
  "message": "Task created successfully"
}
```

#### GET /api/agents/tasks/:id
Get task status and result.

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "42",
    "agent_id": "1",
    "agent_name": "browser-automation-agent",
    "type": "scrape",
    "status": "completed",
    "result": {
      "success": true,
      "data": {
        "title": "Example Domain",
        "content": "..."
      }
    },
    "created_at": "2024-11-24T17:00:00Z",
    "completed_at": "2024-11-24T17:00:03Z"
  }
}
```

#### GET /api/agents/:id/tasks
Get all tasks for a specific agent.

**Query Parameters**:
- `limit` (optional, default: 50) - Maximum number of tasks to return

**Response**:
```json
{
  "success": true,
  "data": {
    "tasks": [...],
    "total": 150
  }
}
```

### Statistics

#### GET /api/agents/:id/statistics
Get agent performance statistics.

**Response**:
```json
{
  "success": true,
  "data": {
    "total_tasks": "150",
    "completed_tasks": "142",
    "failed_tasks": "5",
    "active_tasks": "3",
    "avg_execution_time_ms": 2500
  }
}
```

#### GET /api/agents/system/overview
Get system-wide overview of all agents.

**Response**:
```json
{
  "success": true,
  "data": {
    "totalAgents": 21,
    "runningAgents": 18,
    "stoppedAgents": 3,
    "healthyAgents": 17,
    "degradedAgents": 1,
    "unhealthyAgents": 0,
    "pendingTasks": 12,
    "mcpContainers": 20,
    "agentsByType": {
      "browser": 5,
      "code": 3,
      "mcp": 20
    }
  }
}
```

---

## Integration Examples

### Registering a New Agent

Agents are registered during system initialization via database seeding. To add a new agent:

1. Add entry to `agent_registry` table:
```sql
INSERT INTO agent_registry 
  (name, type, container_name, status, capabilities)
VALUES 
  ('my-custom-agent', 'custom', 'agent-custom-1', 'stopped', 
   ARRAY['capability1', 'capability2']);
```

2. Start the agent:
```bash
curl -X POST http://localhost:3000/api/agents/22/start \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Creating and Monitoring Tasks

```typescript
// Create task
const response = await fetch('http://localhost:3000/api/agents/tasks', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    agentId: '1',
    type: 'custom-task',
    payload: { /* task data */ },
    priority: 7
  })
});

const { taskId } = await response.json();

// Poll for completion
const checkStatus = async () => {
  const statusRes = await fetch(
    `http://localhost:3000/api/agents/tasks/${taskId}`,
    {
      headers: { 'Authorization': 'Bearer YOUR_JWT_TOKEN' }
    }
  );
  const { data } = await statusRes.json();
  
  if (data.status === 'completed') {
    console.log('Task result:', data.result);
  } else if (data.status === 'failed') {
    console.error('Task failed:', data.result);
  } else {
    setTimeout(checkStatus, 1000); // Check again in 1 second
  }
};

checkStatus();
```

### Agent Health Monitoring

Agents should report health status periodically:

```typescript
setInterval(async () => {
  const healthData = {
    healthStatus: 'healthy',
    metadata: {
      cpu: getCpuUsage(),
      memory: getMemoryUsage(),
      uptime: getUptime(),
      tasksProcessed: getTaskCount()
    }
  };
  
  await fetch(`http://localhost:3000/api/agents/${agentId}/health`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_JWT_TOKEN',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(healthData)
  });
}, 60000); // Every minute
```

---

## Task Processing Flow

1. **Task Creation**
   - Client calls `POST /api/agents/tasks`
   - Orchestrator validates agent exists
   - Task saved to database with status 'pending'
   - Task ID returned to client

2. **Task Execution**
   - Orchestrator processes task asynchronously
   - Task status updated to 'running'
   - Agent executes task logic
   - Result stored in database

3. **Task Completion**
   - Status updated to 'completed' or 'failed'
   - Result JSON stored in `result` field
   - Completion timestamp recorded

4. **Retry Logic**
   - On failure, `retry_count` incremented
   - If `retry_count < max_retries`, task re-queued
   - Otherwise, task marked as permanently failed

---

## Best Practices

### Task Design

1. **Idempotent Tasks**: Design tasks to be safely retried
2. **Small Payloads**: Keep task payloads under 1MB
3. **Clear Types**: Use descriptive task type names
4. **Priority Levels**: Reserve high priorities (8-10) for urgent tasks

### Health Checks

1. **Regular Updates**: Report health every 1-5 minutes
2. **Meaningful Metadata**: Include actionable metrics
3. **Degradation Detection**: Report 'degraded' before 'unhealthy'
4. **Auto-Recovery**: Implement self-healing where possible

### Monitoring

1. **Track Metrics**: Monitor task completion rates
2. **Alert on Failures**: Set up alerts for high failure rates
3. **Capacity Planning**: Monitor pending task queue depth
4. **Performance Trends**: Track average execution times

---

## Troubleshooting

### Agent Not Showing in Registry

**Problem**: Agent not visible in `GET /api/agents`

**Solutions**:
1. Check database connection
2. Verify agent entry exists in `agent_registry` table
3. Run `SELECT * FROM agent_registry WHERE name = 'agent-name'`

### Tasks Stuck in Pending

**Problem**: Tasks remain in 'pending' status indefinitely

**Solutions**:
1. Check agent status - must be 'running'
2. Verify orchestrator is processing tasks
3. Check database logs for errors
4. Restart orchestrator service

### High Task Failure Rate

**Problem**: Many tasks failing

**Solutions**:
1. Check agent logs for errors
2. Verify agent health status
3. Review task payloads for issues
4. Check retry count - may indicate systemic problem

---

## Performance Considerations

- **Max Concurrent Tasks**: Configurable via `MAX_CONCURRENT_TASKS` (default: 10)
- **Database Connection Pool**: Tuned for high throughput
- **Task Timeout**: Implement timeouts in agent logic
- **Queue Depth**: Monitor pending task count for bottlenecks

---

## Security

- **JWT Authentication**: Required for all endpoints
- **Task Isolation**: Tasks cannot access other task data
- **Input Validation**: All task payloads validated
- **SQL Injection Protection**: Parameterized queries used throughout

---

## Future Enhancements

- [ ] WebSocket support for real-time task updates
- [ ] Task dependencies and workflows
- [ ] Scheduled/recurring tasks
- [ ] Task result caching
- [ ] Multi-region agent deployment
- [ ] Auto-scaling based on queue depth

---

## Related Documentation

- [API Reference](../API.md) - Complete API documentation
- [Architecture Overview](../ARCHITECTURE.md) - System architecture
- [Agent Integration Guide](./AGENT_INTEGRATION.md) - Agent communication patterns
- [Subsystem Integration](./SUBSYSTEM_INTEGRATION.md) - MCP and message broker

---

## Support

For questions or issues with the orchestration system:
- **GitHub Issues**: https://github.com/creditXcredit/workstation/issues
- **Documentation**: See `/docs` directory
- **Source Code**: `src/services/agent-orchestrator.ts`
