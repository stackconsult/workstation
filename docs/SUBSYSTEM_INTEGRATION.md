# Subsystem Integration Guide

**Version**: 1.0  
**Last Updated**: November 24, 2024  
**Status**: ✅ Production Ready

---

## Overview

This guide documents the integration between major subsystems in the Workstation platform:

- ✅ **MCP Container Ecosystem** - 20+ Model Context Protocol containers
- ✅ **Context-Memory Intelligence Layer** - AI-powered context management
- ✅ **Message Broker System** - Event-driven communication
- ✅ **Docker Orchestration** - Container lifecycle management
- ✅ **Database Layer** - PostgreSQL persistence
- ✅ **Click-Deploy System** - One-click deployment automation

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Express API Server                        │
│                    (Port 3000)                               │
└──────┬──────────────────────────────────────────────────────┘
       │
       ├─────────────────────────────────────────────────────┐
       │                                                      │
       ▼                                                      ▼
┌──────────────────┐                              ┌──────────────────┐
│  Agent Routes    │                              │   MCP Routes     │
│  /api/agents     │                              │   /api/v2/mcp    │
└────────┬─────────┘                              └────────┬─────────┘
         │                                                 │
         ▼                                                 ▼
┌──────────────────────────────────────────┐    ┌──────────────────┐
│     Agent Orchestrator Service           │    │   MCP Protocol   │
│  (Database-backed task management)       │◄───┤   Service        │
└────────┬─────────────────────────────────┘    └──────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Message Broker                            │
│           (Event-driven communication)                       │
└──────┬──────────────────────────────────────────────────────┘
       │
       ├─────────────┬─────────────┬─────────────┬────────────┐
       │             │             │             │            │
       ▼             ▼             ▼             ▼            ▼
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐
│ MCP      │  │ Context  │  │ Database │  │ Docker   │  │ Agents  │
│ Container│  │ Memory   │  │ Layer    │  │ Runtime  │  │ (21)    │
│ (20)     │  │ Layer    │  │          │  │          │  │         │
└──────────┘  └──────────┘  └──────────┘  └──────────┘  └─────────┘
```

---

## MCP Container Ecosystem

### What is MCP?

**MCP (Model Context Protocol)** is a standardized protocol for connecting AI agents with external tools and data sources. Each MCP container provides a specific capability.

### Container Architecture

Each MCP container runs as a separate Docker container with:
- **Isolated Runtime** - Own process, dependencies, resources
- **Standard API** - Consistent interface via MCP protocol
- **Health Checks** - Monitored by orchestrator
- **Auto-Restart** - Recovers from crashes automatically

### Container Locations

MCP containers are organized in `/mcp-containers/` directory:

```
mcp-containers/
├── agent1-mcp-server/           # Agent-specific MCP servers
├── agent2-navigation-mcp/
├── agent3-storage-mcp/
├── agent4-api-builder-mcp/
├── agent5-monitoring-mcp/
├── agent6-security-scanner-mcp/
├── agent7-ci-builder-mcp/
├── agent8-analytics-mcp/
├── agent9-optimizer-mcp/
├── agent10-guardrails-mcp/
├── agent11-advanced-analytics-mcp/
├── agent12-qa-tester-mcp/
├── agent13-doc-generator-mcp/
├── agent14-integration-mcp/
├── agent15-deployment-mcp/
├── agent16-troubleshooter-mcp/
├── agent17-project-builder-mcp/
├── agent18-feedback-collector-mcp/
├── agent19-maintenance-mcp/
├── agent20-rollback-mcp/
└── agent21-final-integration-mcp/
```

### Container Communication

#### 1. MCP Protocol Handler

Located in `src/services/mcp-protocol.ts`:

```typescript
export class MCPProtocol {
  // Handles MCP request/response cycle
  async handleRequest(request: MCPRequest): Promise<MCPResponse> {
    const handler = this.requestHandlers.get(request.method);
    
    if (!handler) {
      return {
        id: request.id,
        error: {
          code: -32601,
          message: `Method not found: ${request.method}`
        }
      };
    }
    
    try {
      const result = await handler(request.params, request.context);
      return { id: request.id, result };
    } catch (error) {
      return {
        id: request.id,
        error: {
          code: -32603,
          message: error.message
        }
      };
    }
  }
}
```

#### 2. Container Registration

Containers register with orchestrator on startup:

```typescript
// In MCP container
await fetch('http://api-server:3000/api/agents', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer SERVICE_TOKEN' },
  body: JSON.stringify({
    name: 'mcp-container-1',
    type: 'mcp',
    containerName: 'agent1-mcp-server',
    capabilities: ['capability1', 'capability2']
  })
});
```

#### 3. Health Monitoring

Containers report health every minute:

```typescript
setInterval(async () => {
  await fetch(`http://api-server:3000/api/agents/${containerId}/health`, {
    method: 'POST',
    body: JSON.stringify({
      healthStatus: 'healthy',
      metadata: {
        requests: metricsCollector.getRequestCount(),
        errors: metricsCollector.getErrorCount(),
        uptime: process.uptime()
      }
    })
  });
}, 60000);
```

### Docker Compose Integration

MCP containers are deployed via `docker-compose.mcp.yml`:

```yaml
version: '3.8'

services:
  api-server:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/workstation
    depends_on:
      - db
      - redis

  agent1-mcp:
    build: ./mcp-containers/agent1-mcp-server
    environment:
      - API_SERVER_URL=http://api-server:3000
      - CONTAINER_ID=1
    depends_on:
      - api-server

  # ... 19 more MCP containers ...

  db:
    image: postgres:15
    environment:
      POSTGRES_DB: workstation
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
```

---

## Context-Memory Intelligence Layer

### Purpose

The Context-Memory system provides AI-powered context management:
- Remembers user preferences and patterns
- Learns from past interactions
- Suggests optimal agent assignments
- Improves workflow efficiency over time

### Architecture

```typescript
// src/intelligence/context-memory.ts
export class ContextMemorySystem {
  async storeContext(userId: string, context: any): Promise<void> {
    await db.query(
      `INSERT INTO context_memory 
        (user_id, context_data, created_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP)`,
      [userId, JSON.stringify(context)]
    );
  }

  async retrieveContext(userId: string): Promise<any[]> {
    const result = await db.query(
      `SELECT context_data FROM context_memory
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [userId]
    );
    
    return result.rows.map(row => row.context_data);
  }

  async suggestAgent(task: any, userId: string): Promise<string> {
    const history = await this.retrieveContext(userId);
    
    // AI-powered agent selection based on:
    // - Task type
    // - User history
    // - Agent performance
    // - Current load
    
    return bestAgentId;
  }
}
```

### Integration Points

#### 1. Workflow Builder

```typescript
// Auto-suggest agents when creating workflows
app.post('/api/workflows/suggest-agent', async (req, res) => {
  const { taskType, userId } = req.body;
  
  const suggestedAgent = await contextMemory.suggestAgent(
    { type: taskType },
    userId
  );
  
  res.json({ agentId: suggestedAgent });
});
```

#### 2. Task Creation

```typescript
// Enhance task creation with context
app.post('/api/agents/tasks', async (req, res) => {
  const { agentId, type, payload } = req.body;
  const userId = req.user.userId;
  
  // Store task context
  await contextMemory.storeContext(userId, {
    action: 'task_created',
    agentId,
    taskType: type,
    timestamp: new Date()
  });
  
  const taskId = await agentOrchestrator.createTask(
    agentId,
    type,
    payload,
    userId
  );
  
  res.json({ taskId });
});
```

#### 3. Learning from Results

```typescript
// Learn from successful/failed tasks
async function recordTaskOutcome(taskId: string, success: boolean) {
  const task = await agentOrchestrator.getTaskStatus(taskId);
  
  await contextMemory.storeContext(task.created_by, {
    action: 'task_completed',
    success,
    agentId: task.agent_id,
    taskType: task.type,
    duration: task.completed_at - task.started_at
  });
}
```

---

## Message Broker System

### Purpose

Enables event-driven communication between subsystems without tight coupling.

### Implementation

```typescript
// src/services/message-broker.ts
import { EventEmitter } from 'events';
import IORedis from 'ioredis';

export interface MCPMessage {
  id: string;
  type: 'request' | 'response' | 'notification';
  source: string;
  target: string;
  payload: any;
  timestamp: string;
}

class MessageBroker extends EventEmitter {
  private redis?: IORedis;
  private subscribers: Map<string, Set<Function>> = new Map();

  constructor() {
    super();
    this.initializeRedis();
  }

  private async initializeRedis() {
    try {
      this.redis = new IORedis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        retryStrategy: (times) => Math.min(times * 50, 2000)
      });
      
      // Subscribe to Redis pub/sub
      this.redis.subscribe('mcp-events', 'agent-events');
      
      this.redis.on('message', (channel, message) => {
        const event = JSON.parse(message);
        this.emit(event.type, event);
      });
    } catch (error) {
      console.warn('Redis not available, using in-memory broker');
    }
  }

  async publish(message: MCPMessage): Promise<void> {
    if (this.redis) {
      await this.redis.publish('mcp-events', JSON.stringify(message));
    }
    
    // Always emit locally
    this.emit(message.type, message);
  }

  subscribe(eventType: string, handler: (message: MCPMessage) => void): void {
    this.on(eventType, handler);
    
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }
    this.subscribers.get(eventType)!.add(handler);
  }
}

export const messageBroker = new MessageBroker();
```

### Common Event Types

```typescript
// Agent lifecycle events
messageBroker.publish({
  id: generateId(),
  type: 'agent.started',
  source: 'orchestrator',
  target: 'all',
  payload: { agentId: '1', name: 'browser-agent' },
  timestamp: new Date().toISOString()
});

// Task events
messageBroker.publish({
  id: generateId(),
  type: 'task.completed',
  source: 'agent-1',
  target: 'orchestrator',
  payload: { taskId: '42', result: {...} },
  timestamp: new Date().toISOString()
});

// System events
messageBroker.publish({
  id: generateId(),
  type: 'system.alert',
  source: 'monitoring',
  target: 'all',
  payload: { level: 'warning', message: 'High CPU usage' },
  timestamp: new Date().toISOString()
});
```

### Event Subscribers

```typescript
// Monitor task completions
messageBroker.subscribe('task.completed', async (message) => {
  await contextMemory.storeContext(message.payload.userId, {
    action: 'task_completed',
    taskId: message.payload.taskId
  });
});

// Alert on errors
messageBroker.subscribe('task.failed', async (message) => {
  await alerting.send({
    type: 'task_failure',
    taskId: message.payload.taskId,
    error: message.payload.error
  });
});
```

---

## Database Layer Integration

### Schema Overview

```sql
-- Agent Registry
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

-- Agent Tasks
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

-- Context Memory
CREATE TABLE context_memory (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    context_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Workflows
CREATE TABLE workflows (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    definition JSONB NOT NULL,
    created_by VARCHAR(255),
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Connection Management

```typescript
// src/db/connection.ts
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'workstation',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: 20, // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
});

export default {
  query: (text: string, params?: any[]) => pool.query(text, params),
  getClient: () => pool.connect()
};
```

---

## Click-Deploy System

### Purpose

One-click deployment automation that:
- Sets up environment
- Installs dependencies
- Builds TypeScript
- Starts server
- Launches Chrome with extension
- Opens workflow builder

### Architecture

```
one-click-deploy.sh
    │
    ├─── Environment Setup (.env creation, JWT secret)
    ├─── Dependency Installation (npm install)
    ├─── TypeScript Build (npm run build)
    ├─── Chrome Extension Build (npm run build:chrome)
    ├─── Server Startup (npm start in background)
    ├─── Chrome Launch (with extension loaded)
    └─── Browser Open (workflow-builder.html)
```

### Integration Points

#### 1. Build System

```json
// package.json scripts
{
  "scripts": {
    "build": "tsc && npm run copy-assets",
    "build:chrome": "node scripts/build/zip-chrome-extension.js",
    "start": "node dist/index.js",
    "dev": "ts-node src/index.ts"
  }
}
```

#### 2. Environment Configuration

```bash
# Generated .env file
JWT_SECRET=<random-32-byte-hex>
JWT_EXPIRATION=24h
PORT=3000
NODE_ENV=production
DATABASE_URL=postgresql://localhost:5432/workstation
REDIS_URL=redis://localhost:6379
```

#### 3. Server Routes

All routes required by click-deploy system:

```typescript
// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Demo token for testing
app.get('/auth/demo-token', (req, res) => {
  const token = generateDemoToken();
  res.json({ token });
});

// Workflow builder
app.get('/workflow-builder.html', express.static('public'));

// Chrome extension download
app.get('/downloads/chrome-extension.zip', downloadsRoutes);
```

#### 4. Verification

```bash
# Test all endpoints
curl http://localhost:3000/health
curl http://localhost:3000/auth/demo-token
curl -I http://localhost:3000/workflow-builder.html
curl -I http://localhost:3000/downloads/chrome-extension.zip
```

---

## Monitoring and Observability

### Health Checks

Each subsystem exposes health endpoint:

```typescript
// API Server
app.get('/health', async (req, res) => {
  const dbHealthy = await checkDatabase();
  const redisHealthy = await checkRedis();
  const agentsHealthy = await checkAgents();
  
  res.json({
    status: 'healthy',
    subsystems: {
      database: dbHealthy ? 'up' : 'down',
      redis: redisHealthy ? 'up' : 'down',
      agents: agentsHealthy ? 'up' : 'degraded'
    }
  });
});
```

### Metrics Collection

```typescript
// src/services/monitoring.ts
export function initializeMonitoring(app: Express) {
  // Expose Prometheus metrics
  app.get('/metrics', async (req, res) => {
    res.set('Content-Type', 'text/plain');
    res.end(await prometheusClient.register.metrics());
  });
  
  // Middleware to track request metrics
  app.use((req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      
      requestDuration.labels(req.method, req.path, res.statusCode)
        .observe(duration);
      
      requestCounter.labels(req.method, req.path, res.statusCode)
        .inc();
    });
    
    next();
  });
}
```

---

## Troubleshooting

### MCP Container Issues

**Problem**: Container not registering with orchestrator

**Solutions**:
1. Check container logs: `docker logs agent1-mcp`
2. Verify API_SERVER_URL environment variable
3. Check network connectivity between containers
4. Verify JWT authentication token

### Message Broker Issues

**Problem**: Events not being received

**Solutions**:
1. Check Redis connection
2. Verify event type names match
3. Review subscriber registration
4. Check Redis pub/sub status: `redis-cli PUBSUB CHANNELS`

### Database Connection Issues

**Problem**: Database queries failing

**Solutions**:
1. Verify DATABASE_URL is correct
2. Check PostgreSQL is running
3. Review connection pool settings
4. Check database logs for errors

---

## Related Documentation

- [Orchestration System](./ORCHESTRATION.md) - Agent orchestrator
- [Agent Integration](./AGENT_INTEGRATION.md) - Agent communication
- [API Reference](../API.md) - Complete API documentation
- [Click-Deploy Implementation](../CLICK_DEPLOY_IMPLEMENTATION.md) - Deployment details

---

## Support

For questions or issues:
- **GitHub Issues**: https://github.com/creditXcredit/workstation/issues
- **Documentation**: See `/docs` directory
