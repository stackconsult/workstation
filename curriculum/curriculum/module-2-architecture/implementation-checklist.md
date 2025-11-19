# Implementation Checklist: Build Your First Architectural Components

## Overview

This hands-on checklist guides you through implementing the core architectural components covered in Module 2. By completing these tasks, you'll build a working multi-agent automation system with external integrations.

**Time to Complete**: 4-6 hours  
**Prerequisites**: Module 1 complete, development environment running  
**Outcome**: Fully functional 3-agent workflow with Slack notification

## Section 1: Agent Registry Setup (60 minutes)

### Task 1.1: Implement Agent Registry Class

**File**: Create `src/automation/agents/AgentRegistry.ts`

```typescript
import { EventEmitter } from 'events';

export class AgentRegistry extends EventEmitter {
  private agents: Map<number, Agent> = new Map();
  private nextId: number = 1;
  
  register(request: AgentRegistrationRequest): Agent {
    // TODO: Implement agent registration
    // 1. Validate request (name required, tier 1-3)
    // 2. Check for duplicate names
    // 3. Assign ID and create agent object
    // 4. Store in map
    // 5. Emit 'agent:registered' event
    // 6. Return agent
  }
  
  // TODO: Implement other methods
}
```

**Verification**:
```bash
npm run build
npm test -- agents/AgentRegistry.test.ts
```

**Expected Output**: All 8 tests passing

### Task 1.2: Register Core Agents

**File**: Create `src/automation/agents/core-agents.ts`

Register these 5 core agents:
- [ ] Web Navigator (Tier 1, capabilities: navigate:url)
- [ ] Element Clicker (Tier 1, capabilities: click:element)
- [ ] Text Typer (Tier 1, capabilities: type:text)
- [ ] Data Extractor (Tier 2, capabilities: extract:text, extract:html)
- [ ] Screenshot Capturer (Tier 1, capabilities: extract:screenshot)

**Verification**:
```typescript
import { registry } from './AgentRegistry';

const agents = registry.listAll();
console.log(`Registered ${agents.length} agents`);
// Expected: "Registered 5 agents"

const tier1 = registry.queryAgents({ tier: 1 });
console.log(`Tier 1 agents: ${tier1.length}`);
// Expected: "Tier 1 agents: 4"
```

### Task 1.3: Create Agent Discovery API

**File**: `src/routes/agents.ts`

Implement these endpoints:
- [ ] GET /api/agents - List all agents
- [ ] GET /api/agents/:id - Get specific agent
- [ ] POST /api/agents/query - Query with filters
- [ ] POST /api/agents/register - Register new agent
- [ ] PUT /api/agents/:id/status - Update agent status

**Verification**:
```bash
# Start server
npm run dev

# Test API
curl http://localhost:3000/api/agents \
  -H "Authorization: Bearer YOUR_TOKEN"
  
# Expected: JSON array with 5 agents
```

## Section 2: Orchestrator Implementation (90 minutes)

### Task 2.1: Create AgentOrchestrator Class

**File**: `src/orchestration/agent-orchestrator.ts`

Implement core methods:
- [ ] `createWorkflow()` - Create workflow execution
- [ ] `executeWorkflow()` - Execute sequential workflow
- [ ] `executeAgent()` - Execute single agent
- [ ] `calculateMetrics()` - Calculate execution metrics

**Code Template**:
```typescript
export class AgentOrchestrator extends EventEmitter {
  private executions: Map<string, WorkflowExecution> = new Map();
  
  createWorkflow(definition: WorkflowDefinition): WorkflowExecution {
    // TODO: Generate execution ID
    // TODO: Initialize execution state
    // TODO: Store in map
    // TODO: Emit 'workflow:created' event
    // TODO: Return execution
  }
  
  async executeWorkflow(executionId: string): Promise<void> {
    // TODO: Load execution
    // TODO: Set status to 'running'
    // TODO: Loop through agents
    // TODO: Execute each agent sequentially
    // TODO: Handle errors
    // TODO: Update status to 'completed' or 'failed'
  }
  
  // TODO: Implement other methods
}
```

**Verification**:
```typescript
const orchestrator = new AgentOrchestrator();

const workflow = orchestrator.createWorkflow({
  id: 'test_workflow',
  name: 'Test Workflow',
  agents: [1, 2, 3],
  initialData: { test: true }
});

console.log(workflow.status); // Expected: 'pending'

await orchestrator.executeWorkflow(workflow.executionId);

console.log(workflow.status); // Expected: 'completed'
```

### Task 2.2: Implement Retry Logic

**File**: `src/orchestration/retry.ts`

Implement exponential backoff retry:
- [ ] Max 3 retries per agent
- [ ] Delay: 2^attempt * 1000ms
- [ ] Log each retry attempt
- [ ] Reset agent status before retry

**Verification**:
```typescript
// Simulate failing agent
const failingAgent = {
  id: 999,
  name: 'Failing Test Agent',
  execute: async () => { throw new Error('Test failure'); }
};

try {
  await executeAgentWithRetry(execution, failingAgent.id, 3);
} catch (error) {
  console.log('Failed after 3 retries'); // Expected
}

// Verify logs show 3 retry attempts
```

### Task 2.3: Add Workflow State Persistence

**File**: `src/automation/db/workflows.ts`

Implement database operations:
- [ ] `saveWorkflowState()` - Save to SQLite
- [ ] `loadWorkflowState()` - Load from SQLite
- [ ] `resumeWorkflow()` - Resume from checkpoint

**Database Schema**:
```sql
CREATE TABLE workflow_executions (
  id TEXT PRIMARY KEY,
  definition TEXT NOT NULL,
  status TEXT NOT NULL,
  current_agent_index INTEGER NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT,
  workflow_data TEXT NOT NULL,
  handoffs TEXT NOT NULL,
  error TEXT,
  metrics TEXT
);
```

**Verification**:
```bash
# Execute workflow that saves state
node -e "
const { orchestrator } = require('./dist/orchestration/agent-orchestrator');
const workflow = orchestrator.createWorkflow({ /* ... */ });
await orchestrator.executeWorkflow(workflow.executionId);
"

# Check database
sqlite3 workstation.db "SELECT * FROM workflow_executions;"
# Expected: 1 row with workflow data
```

## Section 3: External Integration Setup (120 minutes)

### Task 3.1: Implement HTTP Adapter

**File**: `src/automation/adapters/HttpAdapter.ts`

Implement HTTP client with:
- [ ] Bearer token authentication
- [ ] Automatic retry (3 attempts)
- [ ] Exponential backoff
- [ ] Request/response logging
- [ ] Error handling

**Verification**:
```typescript
const adapter = new HttpAdapter({
  baseURL: 'https://httpbin.org',
  auth: { type: 'bearer', credentials: { token: 'test123' } },
  retries: 3
});

const response = await adapter.get('/get');
console.log(response); // Expected: JSON response from httpbin

// Test retry logic (should fail after 3 attempts)
try {
  await adapter.get('/status/500'); // Returns 500 error
} catch (error) {
  console.log('Failed after retries'); // Expected
}
```

### Task 3.2: Create Webhook Agent

**File**: `src/automation/agents/WebhookAgent.ts`

Implement webhook integration:
- [ ] POST data to webhook URL
- [ ] Transform payload (optional)
- [ ] Handle authentication
- [ ] Return integration result

**Verification**:
```typescript
const webhookAgent = new WebhookAgent(100, 'Test Webhook', {
  baseURL: 'https://webhook.site/YOUR-UNIQUE-URL',
  method: 'POST'
});

const result = await webhookAgent.execute('send', {
  message: 'Test from Workstation',
  timestamp: new Date().toISOString()
});

console.log(result.success); // Expected: true

// Check https://webhook.site to see the request
```

### Task 3.3: Implement Slack Integration

**File**: `src/automation/agents/SlackAgent.ts`

**Prerequisites**:
1. Create Slack app: https://api.slack.com/apps
2. Add Bot Token Scopes: `chat:write`, `files:write`
3. Install to workspace
4. Copy Bot User OAuth Token

**Implementation**:
- [ ] Initialize Slack WebClient
- [ ] Implement `send_message` action
- [ ] Implement `send_alert` action
- [ ] Format messages with blocks

**Verification**:
```bash
# Set Slack token in .env
echo "SLACK_BOT_TOKEN=xoxb-your-token-here" >> .env

# Test Slack integration
node -e "
const { SlackAgent } = require('./dist/automation/agents/SlackAgent');

const slack = new SlackAgent(200, 'Slack', {
  token: process.env.SLACK_BOT_TOKEN,
  defaultChannel: '#test'
});

await slack.execute('send_message', {
  message: '✅ Workstation integration test successful!'
});
"

# Expected: Message appears in Slack #test channel
```

## Section 4: End-to-End Workflow (90 minutes)

### Task 4.1: Build Complete Workflow

Create a workflow that:
1. Navigates to a website
2. Extracts data from the page
3. Sends results to Slack

**File**: `examples/workflows/data-extraction-workflow.ts`

```typescript
import { orchestrator } from '../src/orchestration/agent-orchestrator';
import { registerSlackAgent } from '../src/automation/agents/SlackAgent';

// Register Slack agent
const slackAgentId = registerSlackAgent({
  token: process.env.SLACK_BOT_TOKEN!,
  defaultChannel: '#automation-results'
});

// Create workflow
const workflow = orchestrator.createWorkflow({
  id: 'data_extraction_001',
  name: 'Website Data Extraction',
  agents: [
    1, // Web Navigator
    4, // Data Extractor
    slackAgentId // Slack Notifier
  ],
  initialData: {
    targetUrl: 'https://example.com',
    extractSelectors: {
      title: 'h1',
      description: 'p.intro'
    }
  }
});

// Execute workflow
await orchestrator.executeWorkflow(workflow.executionId);

console.log(`Workflow completed in ${workflow.metrics?.totalExecutionTime}ms`);
```

**Verification**:
```bash
npm run build
node dist/examples/workflows/data-extraction-workflow.js

# Expected output:
# ✅ Workflow created: data_extraction_001
# 🔄 Executing agent: Web Navigator
# ✅ Agent completed: Web Navigator
# 🔄 Executing agent: Data Extractor
# ✅ Agent completed: Data Extractor
# 🔄 Executing agent: Slack Integration
# ✅ Agent completed: Slack Integration
# ✅ Workflow completed in 3500ms

# Expected Slack message:
# "📊 Data Extraction Complete
#  Title: Example Domain
#  Description: This domain is for use in illustrative examples..."
```

### Task 4.2: Add Error Handling

Enhance workflow with:
- [ ] Try-catch blocks around agent execution
- [ ] Fallback strategies (skip failed agents)
- [ ] Error notification to Slack
- [ ] Workflow retry logic

**Implementation**:
```typescript
orchestrator.on('agent:failed', async ({ execution, agent, error }) => {
  console.error(`❌ Agent ${agent.name} failed: ${error.message}`);
  
  // Send error notification to Slack
  await slackAgent.execute('send_alert', {
    type: 'error',
    message: `Agent ${agent.name} failed in workflow ${execution.workflowId}`,
    data: {
      'Error': error.message,
      'Agent': agent.name,
      'Workflow': execution.workflowId
    }
  });
});
```

**Verification**:
Modify workflow to use non-existent URL:
```typescript
initialData: {
  targetUrl: 'https://this-domain-does-not-exist-12345.com'
}
```

Expected: Error alert in Slack with details

### Task 4.3: Schedule Workflow Execution

Implement scheduled execution:
- [ ] Create cron expression parser
- [ ] Calculate next run time
- [ ] Store scheduled tasks in database
- [ ] Background scheduler (runs every minute)

**File**: `src/automation/scheduler.ts`

```typescript
export class WorkflowScheduler {
  async schedule(
    workflow: WorkflowDefinition,
    cronExpression: string
  ): Promise<string> {
    // TODO: Parse cron expression
    // TODO: Calculate next run time
    // TODO: Store in scheduled_tasks table
    // TODO: Return schedule ID
  }
  
  async runScheduledTasks(): Promise<void> {
    // TODO: Query due tasks
    // TODO: Execute each task
    // TODO: Update next run time
  }
}

// Start scheduler
const scheduler = new WorkflowScheduler();
setInterval(() => scheduler.runScheduledTasks(), 60000); // Every minute
```

**Verification**:
```typescript
// Schedule workflow to run every hour
const scheduleId = await scheduler.schedule(workflow, '0 * * * *');

console.log(`Scheduled workflow: ${scheduleId}`);
// Expected: "Scheduled workflow: sched_1234567890"

// Check database
const tasks = await db.all('SELECT * FROM scheduled_tasks');
console.log(tasks);
// Expected: 1 row with cron expression '0 * * * *'
```

## Section 5: Testing & Validation (60 minutes)

### Task 5.1: Unit Tests

**File**: `tests/unit/agent-registry.test.ts`

Write tests for:
- [ ] Agent registration (success case)
- [ ] Duplicate name detection
- [ ] Agent query by tier
- [ ] Agent query by capabilities
- [ ] Status update
- [ ] Accuracy update

**Verification**:
```bash
npm test -- tests/unit/agent-registry.test.ts

# Expected:
# ✓ should register agent successfully (10ms)
# ✓ should reject duplicate agent name (5ms)
# ✓ should query agents by tier (3ms)
# ✓ should query agents by capabilities (4ms)
# ✓ should update agent status (2ms)
# ✓ should update agent accuracy (2ms)
# 
# Test Suites: 1 passed, 1 total
# Tests: 6 passed, 6 total
```

### Task 5.2: Integration Tests

**File**: `tests/integration/workflow-execution.test.ts`

Test complete workflow:
- [ ] Create workflow
- [ ] Execute successfully
- [ ] Verify state persistence
- [ ] Resume from failure
- [ ] Calculate metrics

**Verification**:
```bash
npm test -- tests/integration/workflow-execution.test.ts

# Expected: 5 tests passing
```

### Task 5.3: Manual Testing Checklist

- [ ] Register agent via API (POST /api/agents/register)
- [ ] List all agents (GET /api/agents)
- [ ] Create workflow via UI/script
- [ ] Execute workflow and verify Slack notification
- [ ] Intentionally fail an agent and verify retry logic
- [ ] Check database for persisted state
- [ ] Resume failed workflow from checkpoint
- [ ] Schedule workflow with cron expression
- [ ] Verify scheduled execution occurs

## Section 6: Performance Optimization (30 minutes)

### Task 6.1: Add Execution Caching

**File**: `src/automation/cache/ExecutionCache.ts`

Implement result caching:
- [ ] Hash input data (SHA256)
- [ ] Cache results with TTL (1 hour default)
- [ ] Check cache before execution
- [ ] Store results after execution

**Verification**:
```typescript
// First execution (cache miss)
const start1 = Date.now();
await executeAgent(execution, agentId);
const duration1 = Date.now() - start1;

// Second execution (cache hit)
const start2 = Date.now();
await executeAgentWithCache(execution, agentId);
const duration2 = Date.now() - start2;

console.log(`Without cache: ${duration1}ms`);
console.log(`With cache: ${duration2}ms`);
console.log(`Speedup: ${(duration1 / duration2).toFixed(2)}x`);

// Expected:
// Without cache: 1500ms
// With cache: 5ms
// Speedup: 300x
```

### Task 6.2: Implement Agent Pooling

**File**: `src/automation/pool/AgentPool.ts`

Create agent pool for high concurrency:
- [ ] Pre-warm agents on startup
- [ ] Track available/busy agents
- [ ] Return idle agent from pool
- [ ] Scale pool size dynamically

**Verification**:
```typescript
const pool = new AgentPool();
await pool.warmPool(1, 10); // 10 instances of agent 1

// Execute 50 workflows concurrently
const workflows = Array.from({ length: 50 }, (_, i) => 
  orchestrator.createWorkflow({ /* ... */ })
);

const start = Date.now();
await Promise.all(
  workflows.map(w => orchestrator.executeWorkflow(w.executionId))
);
const duration = Date.now() - start;

console.log(`50 workflows completed in ${duration}ms`);
// Expected: < 10 seconds (with pooling)
// Without pooling: > 60 seconds
```

## Section 7: Production Readiness (45 minutes)

### Task 7.1: Add Comprehensive Logging

Implement structured logging:
- [ ] Log all workflow events (created, started, completed, failed)
- [ ] Log all agent executions (started, completed, failed, retried)
- [ ] Log all external API calls (request, response, error)
- [ ] Include correlation IDs for tracing

**File**: Update `src/utils/logger.ts`

**Verification**:
```bash
# Check logs
tail -f logs/workstation.log

# Expected format:
# {"level":"info","message":"Workflow created","workflowId":"workflow_001","timestamp":"2025-11-19T18:00:00.000Z"}
# {"level":"info","message":"Agent started","agentId":1,"agentName":"Web Navigator","workflowId":"workflow_001","timestamp":"2025-11-19T18:00:01.000Z"}
```

### Task 7.2: Health Check Endpoint

Enhance `/health` endpoint:
- [ ] Database connectivity check
- [ ] Agent registry status
- [ ] Scheduled tasks status
- [ ] External integrations status (Slack, webhooks)

**Verification**:
```bash
curl http://localhost:3000/health

# Expected:
# {
#   "status": "healthy",
#   "uptime": 3600,
#   "database": "connected",
#   "agents": {
#     "total": 5,
#     "idle": 5,
#     "active": 0,
#     "error": 0
#   },
#   "scheduler": {
#     "status": "running",
#     "scheduled_tasks": 2
#   },
#   "integrations": {
#     "slack": "connected",
#     "webhooks": "healthy"
#   }
# }
```

### Task 7.3: Environment Configuration Validation

Validate all required environment variables on startup:
- [ ] JWT_SECRET (must be secure)
- [ ] SLACK_BOT_TOKEN (if Slack integration enabled)
- [ ] DATABASE_PATH (default: ./workstation.db)
- [ ] PORT (default: 3000)

**File**: Update `src/utils/env.ts`

**Verification**:
```bash
# Start with missing JWT_SECRET
unset JWT_SECRET
npm start

# Expected:
# ❌ FATAL: Unsafe JWT_SECRET configured. Server will not start.
#    Set a secure JWT_SECRET in your .env file
# Process exits with code 1
```

## Completion Checklist

Before moving to Module 3, verify:

- [ ] All 5 core agents registered
- [ ] Agent registry API functional (all endpoints working)
- [ ] AgentOrchestrator can execute 3-agent workflow
- [ ] Workflow state persisted to database
- [ ] Retry logic works (3 attempts with exponential backoff)
- [ ] HTTP adapter implemented with authentication
- [ ] Webhook agent can POST to external endpoint
- [ ] Slack integration sends messages successfully
- [ ] End-to-end workflow completes with Slack notification
- [ ] Error handling triggers Slack alerts
- [ ] Workflow scheduling implemented
- [ ] Unit tests passing (6+ tests)
- [ ] Integration tests passing (5+ tests)
- [ ] Execution caching reduces execution time by 100x+
- [ ] Agent pooling enables 50+ concurrent workflows
- [ ] Structured logging active
- [ ] Health check endpoint returns all systems
- [ ] Environment validation prevents insecure startup

## Troubleshooting

### Issue: Agent registration fails with "duplicate name"

**Solution**: Check existing agents with `registry.listAll()`, use unique names

### Issue: Workflow execution hangs

**Solution**: Check agent status with `registry.getAgent(agentId).status`, reset stuck agents

### Issue: Slack integration fails with "invalid_auth"

**Solution**: Verify `SLACK_BOT_TOKEN` in `.env`, ensure bot has required scopes

### Issue: Database locked error

**Solution**: Close other database connections, use WAL mode: `PRAGMA journal_mode=WAL;`

### Issue: Retry logic not working

**Solution**: Verify agent status is reset to 'idle' before retry attempt

## Next Steps

Congratulations! You've built a complete multi-agent automation system with external integrations. 

**Continue to [Module 3: Browser Agents](../module-3-browser-agents/README.md)** to learn the 7 core browser automation actions and build sophisticated web scraping workflows.

## Additional Resources

- **Architecture Overview**: [System Overview](./system-overview.md)
- **Agent Registry Deep Dive**: [Agent Registry](./agent-registry.md)
- **Orchestrator Patterns**: [Orchestrator Patterns](./orchestrator-patterns.md)
- **External Integrations**: [External Agent Integration](./external-agent-integration.md)
- **API Documentation**: `API.md` in repository root
