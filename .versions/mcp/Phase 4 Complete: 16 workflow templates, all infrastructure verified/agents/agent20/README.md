# Agent #20: Master Orchestrator

## Purpose
Coordinate all 20 agents in a cohesive system, manage workflows, handle inter-agent communication, and provide unified monitoring and control plane for the entire platform.

## Architecture
- **Type**: Distributed orchestration system
- **Runtime**: Node.js 20+
- **Framework**: Express.js with custom workflow engine
- **Messaging**: Redis Pub/Sub, Bull queues
- **Database**: PostgreSQL (state), Redis (cache)
- **Monitoring**: Prometheus + Grafana
- **Real-time**: WebSocket for live updates

## What This Agent Does

Agent #20 is the command center that:

1. **Orchestrates Workflows**: Coordinate multi-agent workflows
2. **Manages State**: Distributed state across all agents
3. **Monitors System**: Real-time health and performance monitoring
4. **Handles Communication**: Inter-agent messaging and events
5. **Provides Control**: Unified API and dashboard

### Key Features

#### Workflow Orchestration
- Sequential and parallel execution
- Conditional branching and loops
- Error handling and retries
- Dependency management
- Workflow versioning

#### Agent Coordination
- 20 agent registry and discovery
- Health monitoring
- Load balancing
- Resource allocation
- Lifecycle management

#### State Management
- Distributed state synchronization
- Workflow state persistence
- Snapshots and recovery
- ACID transactions

#### Monitoring & Analytics
- Real-time metrics from all agents
- Performance tracking
- Error aggregation
- Resource monitoring
- Custom dashboards

## Agent Ecosystem

### Tier 1: Foundation (Agents 1-6)
- **Agent 1**: API Gateway (TypeScript)
- **Agent 2**: Navigation Helper
- **Agent 3**: Data Extraction
- **Agent 4**: Error Handling
- **Agent 5**: DevOps & Containerization
- **Agent 6**: Project Builder

### Tier 2: Quality (Agents 7-13)
- **Agent 7**: Code Quality
- **Agent 8**: Performance Monitor
- **Agent 9**: Error Tracker
- **Agent 10**: Security Scanner
- **Agent 11**: Accessibility Checker
- **Agent 12**: Integration Hub
- **Agent 13**: Docs Auditor

### Tier 3: Platform (Agents 14-19)
- **Agent 14**: Advanced Automation
- **Agent 15**: API Integrator
- **Agent 16**: Data Processor
- **Agent 17**: Learning Platform
- **Agent 18**: Community Hub
- **Agent 19**: Deployment Manager

## Inputs

### Workflow Definition
```yaml
# workflow.yml
name: Complete Project Build
version: 1.0.0
description: Build, test, and deploy a complete project

steps:
  - id: scaffold
    agent: agent6
    action: scaffold_project
    params:
      template: typescript-api
      name: my-project
  
  - id: build_api
    agent: agent1
    action: create_api
    depends_on: [scaffold]
  
  - id: quality_check
    agent: agent7
    action: code_quality_check
    parallel:
      - agent: agent10
        action: security_scan
      - agent: agent8
        action: performance_test
  
  - id: deploy
    agent: agent19
    action: deploy
    depends_on: [quality_check]
    condition: "quality_check.success && security_scan.passed"
    
error_handling:
  retry:
    max_attempts: 3
    backoff: exponential
  on_failure:
    - agent: agent9
      action: log_error
    - notify: slack
```

### Environment Variables
```bash
# Master Orchestrator
NODE_ENV=production
PORT=3020

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/orchestrator
REDIS_URL=redis://localhost:6379

# Monitoring
PROMETHEUS_PORT=9090
GRAFANA_URL=http://localhost:3000

# Notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx

# Agent Registry
AGENT_REGISTRY_URL=http://localhost:3021
```

## Outputs

### Workflow Execution Results
```typescript
interface WorkflowResult {
  workflowId: string;
  status: 'success' | 'failure' | 'running';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  steps: Array<{
    stepId: string;
    agent: string;
    status: 'success' | 'failure' | 'skipped';
    output: any;
    error?: string;
  }>;
  metrics: {
    totalSteps: number;
    successfulSteps: number;
    failedSteps: number;
    skippedSteps: number;
  };
}
```

### Dashboard
Real-time monitoring dashboard at `http://localhost:3020/dashboard`:
- Workflow execution status
- Agent health status
- Performance metrics
- Error logs
- Resource utilization

## Usage

### Starting the Orchestrator
```bash
cd agents/agent20

# Install dependencies
npm install

# Start orchestrator
npm start

# Dashboard available at http://localhost:3020
```

### Executing a Workflow
```typescript
import { WorkflowOrchestrator } from './src/orchestrator';

const orchestrator = new WorkflowOrchestrator();

// Execute workflow
const result = await orchestrator.execute({
  workflowFile: './workflows/build-project.yml',
  params: {
    projectName: 'my-app',
    environment: 'production'
  }
});

console.log(`Workflow ${result.workflowId}: ${result.status}`);
```

### Using the CLI
```bash
# List all workflows
./cli.ts workflows list

# Execute workflow
./cli.ts workflows execute build-project.yml

# Get workflow status
./cli.ts workflows status <workflow-id>

# List agents
./cli.ts agents list

# Check agent health
./cli.ts agents health agent1

# View metrics
./cli.ts metrics --agent agent8 --range 1h
```

### Using the API
```bash
# Execute workflow
curl -X POST http://localhost:3020/api/workflows/execute \
  -H "Content-Type: application/json" \
  -d '{
    "workflow": "build-project",
    "params": {"projectName": "my-app"}
  }'

# Get workflow status
curl http://localhost:3020/api/workflows/<workflow-id>

# List all agents
curl http://localhost:3020/api/agents

# Get agent metrics
curl http://localhost:3020/api/agents/agent8/metrics
```

## Workflow Examples

### 1. Complete Project Build
```yaml
name: Complete Project Build
steps:
  - agent: agent6
    action: scaffold_project
  - agent: agent1
    action: create_api
  - agent: agent7
    action: quality_check
    parallel:
      - agent: agent10
        action: security_scan
  - agent: agent19
    action: deploy
```

### 2. Continuous Monitoring
```yaml
name: Continuous Monitoring
schedule: "*/5 * * * *"  # Every 5 minutes
steps:
  - agent: agent8
    action: collect_metrics
  - agent: agent9
    action: track_errors
  - condition: "error_rate > 0.05"
    then:
      - agent: agent19
        action: rollback
```

### 3. Data Processing Pipeline
```yaml
name: Data Processing Pipeline
steps:
  - agent: agent16
    action: ingest_data
    params:
      source: "s3://bucket/data.csv"
  - agent: agent16
    action: transform_data
  - agent: agent16
    action: validate_data
  - agent: agent11
    action: analyze_data
  - agent: agent16
    action: export_data
```

## Architecture

### Workflow Engine
```typescript
class WorkflowEngine {
  async execute(workflow: Workflow): Promise<WorkflowResult> {
    // Initialize state
    const state = await this.stateManager.create(workflow.id);
    
    // Execute steps
    for (const step of workflow.steps) {
      try {
        if (this.shouldExecute(step, state)) {
          const result = await this.executeStep(step);
          await state.updateStep(step.id, result);
        }
      } catch (error) {
        await this.handleError(step, error, state);
      }
    }
    
    return state.getResult();
  }
}
```

### Agent Registry
```typescript
class AgentRegistry {
  private agents: Map<string, AgentInfo>;
  
  register(agent: AgentInfo): void {
    this.agents.set(agent.id, agent);
  }
  
  async getAgent(id: string): Promise<AgentInfo> {
    const agent = this.agents.get(id);
    if (!agent) throw new Error(`Agent ${id} not found`);
    
    // Health check
    const healthy = await this.healthCheck(agent);
    if (!healthy) throw new Error(`Agent ${id} unhealthy`);
    
    return agent;
  }
}
```

### State Manager
```typescript
class StateManager {
  async create(workflowId: string): Promise<WorkflowState> {
    const state = new WorkflowState(workflowId);
    await this.persist(state);
    return state;
  }
  
  async snapshot(workflowId: string): Promise<void> {
    const state = await this.load(workflowId);
    await this.saveSnapshot(state);
  }
  
  async recover(workflowId: string): Promise<WorkflowState> {
    return await this.loadSnapshot(workflowId);
  }
}
```

## Monitoring & Metrics

### System-Level Metrics
- Total workflows executed: `orchestrator_workflows_total`
- Active workflows: `orchestrator_workflows_active`
- Workflow duration: `orchestrator_workflow_duration_seconds`
- Success rate: `orchestrator_success_rate`

### Agent-Level Metrics
- Agent execution count: `orchestrator_agent_executions_total{agent="agentN"}`
- Agent latency: `orchestrator_agent_latency_seconds{agent="agentN"}`
- Agent errors: `orchestrator_agent_errors_total{agent="agentN"}`

### Grafana Dashboard
View metrics at `http://localhost:3000/d/orchestrator`:
- Workflow execution timeline
- Agent health status
- Error rate trends
- Resource utilization

## Error Handling

### Retry Strategy
```typescript
interface RetryConfig {
  maxAttempts: number;
  backoff: 'linear' | 'exponential';
  delay: number;
}

async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig
): Promise<T> {
  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === config.maxAttempts) throw error;
      
      const delay = config.backoff === 'exponential'
        ? config.delay * Math.pow(2, attempt - 1)
        : config.delay * attempt;
      
      await sleep(delay);
    }
  }
}
```

### Circuit Breaker
```typescript
class CircuitBreaker {
  private failures = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      throw new Error('Circuit breaker open');
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
}
```

## Development

### Testing
```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Load tests
npm run test:load
```

### Building
```bash
npm run build
npm run lint
```

## Performance

- **Orchestration Overhead**: < 100ms per workflow
- **Throughput**: 1000+ concurrent workflows
- **Agent Communication**: < 50ms latency
- **State Persistence**: < 10ms
- **Availability**: 99.99%

## Security

- JWT authentication for API
- Workflow execution isolation
- Secrets management integration
- Audit logging
- Rate limiting
- Resource quotas

## License
MIT - See root LICENSE file
