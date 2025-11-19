# Module 2: Architecture Deep Dive

## Overview

Understand the complete system architecture, agent registry patterns, and orchestration mechanisms that power the Workstation browser-agent platform.

## Learning Objectives

- Understand the multi-layer architecture (Express → Orchestrator → Agents)
- Learn the agent registry pattern for dynamic capability discovery
- Master orchestration patterns for workflow execution
- Integrate external agents and custom capabilities
- Design scalable, production-ready agent systems

## Prerequisites

- Completed [Module 1: Clone & Configure](../module-1-clone-configure/README.md)
- Running local Workstation instance
- Basic understanding of TypeScript and Express.js
- Familiarity with REST APIs and microservices

## Files in This Module

- **system-overview.md** - Complete architectural overview with diagrams
- **agent-registry.md** - Dynamic agent registration and discovery
- **orchestrator-patterns.md** - Workflow orchestration and task execution
- **external-agent-integration.md** - Integrating third-party agents and APIs
- **implementation-checklist.md** - Hands-on implementation tasks

## Architecture Layers

```
┌─────────────────────────────────────────────┐
│         Client (Web, API, MCP)              │
└─────────────────┬───────────────────────────┘
                  │ HTTP/REST
┌─────────────────▼───────────────────────────┐
│         Express.js API Layer                │
│  - JWT Authentication                       │
│  - Rate Limiting                            │
│  - Request Validation                       │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│        Workflow Orchestrator                │
│  - Task Scheduling                          │
│  - State Management                         │
│  - Retry Logic                              │
│  - Error Handling                           │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│           Agent Registry                    │
│  - Dynamic Discovery                        │
│  - Capability Exposure                      │
│  - Agent Lifecycle                          │
└─────────────────┬───────────────────────────┘
                  │
      ┌───────────┼───────────┐
      │           │           │
┌─────▼────┐ ┌───▼────┐ ┌───▼────┐
│ Browser  │ │  Data  │ │ Custom │
│  Agent   │ │ Agent  │ │ Agents │
└──────────┘ └────────┘ └────────┘
```

## Key Concepts

### 1. Agent Registry Pattern

The registry provides:
- **Dynamic Discovery**: Agents register themselves at startup
- **Capability Exposure**: Each agent declares its actions
- **Type Safety**: TypeScript interfaces for all agent contracts
- **Extensibility**: Add new agents without modifying core code

### 2. Orchestrator Pattern

The orchestrator handles:
- **Task Sequencing**: Execute workflow tasks in order
- **Parallel Execution**: Run independent tasks simultaneously (future)
- **State Management**: Track workflow progress in database
- **Error Recovery**: Retry failed tasks with exponential backoff
- **Result Aggregation**: Collect and pass results between tasks

### 3. Workflow Definition

Workflows are JSON-based task definitions:

```json
{
  "name": "Web Scraping Workflow",
  "description": "Navigate and extract data",
  "definition": {
    "tasks": [
      {
        "name": "navigate",
        "agent_type": "browser",
        "action": "navigate",
        "parameters": {"url": "https://example.com"}
      },
      {
        "name": "extract",
        "agent_type": "browser",
        "action": "getText",
        "parameters": {"selector": ".content"}
      }
    ]
  }
}
```

### 4. Agent Contract

All agents implement a standard interface:

```typescript
interface Agent {
  type: string;                    // Unique agent identifier
  name: string;                    // Human-readable name
  actions: AgentAction[];          // Available actions
  execute(action: string, params: any): Promise<any>;
}

interface AgentAction {
  name: string;                    // Action identifier
  description: string;             // What the action does
  parameters: ParameterSchema[];   // Expected parameters
}
```

## What You'll Build

By the end of this module, you will:

1. **Understand the Architecture**
   - Multi-layer design rationale
   - Data flow and communication patterns
   - Security boundaries and trust zones

2. **Implement Agent Registry**
   - Create custom agent types
   - Register agents dynamically
   - Query agent capabilities

3. **Build Orchestration Logic**
   - Create complex workflows
   - Handle task dependencies
   - Implement error recovery

4. **Integrate External Systems**
   - Connect to third-party APIs
   - Wrap external tools as agents
   - Build adapter patterns

## Time to Complete

- **Quick Overview**: 1-2 hours (read documentation)
- **Hands-On Implementation**: 3-4 hours (build examples)
- **Production Deployment**: 6-8 hours (customize for your use case)

## Real-World Applications

### For Agencies

**Use Case: Multi-Client Automation Platform**

Build a single platform that serves multiple clients:
- Isolated workflows per client (JWT sub-claims)
- Shared agent infrastructure
- Custom agents per client needs
- White-label UI per client brand

**Architecture Benefits:**
- Centralized management, distributed execution
- Pay-as-you-grow infrastructure
- Standardized deployment process

### For Founders

**Use Case: SaaS Browser Automation Product**

Launch a production SaaS offering:
- Multi-tenant architecture built-in
- Agent marketplace for extensions
- Usage-based billing per workflow
- Enterprise-grade security

**Architecture Benefits:**
- Horizontal scaling ready
- Plugin architecture for growth
- Clear separation of concerns

### For Platform Engineers

**Use Case: Enterprise Automation Hub**

Deploy across organization:
- Integration with existing tools (Slack, Jira, Salesforce)
- Custom agents per department
- Audit logging and compliance
- High availability setup

**Architecture Benefits:**
- Service mesh compatible
- Observable and debuggable
- Disaster recovery ready

### For Senior Developers

**Use Case: Microservices Orchestration**

Coordinate multiple services:
- Workflow as code pattern
- Event-driven architecture
- Saga pattern for distributed transactions
- Circuit breakers and retries

**Architecture Benefits:**
- Testable in isolation
- Clear interfaces and contracts
- Evolutionary architecture

## Getting Started

Start with [system-overview.md](./system-overview.md) for a comprehensive architectural walkthrough.

## Resources

- [ARCHITECTURE.md](../../ARCHITECTURE.md) - Main architecture documentation
- [src/automation/orchestrator/engine.ts](../../src/automation/orchestrator/engine.ts) - Orchestrator implementation
- [src/automation/agents/core/registry.ts](../../src/automation/agents/core/registry.ts) - Agent registry
- [src/automation/agents/core/browser.ts](../../src/automation/agents/core/browser.ts) - Browser agent example

## Next Module

After completing this module, proceed to:

→ [Module 3: Core Browser Agents](../module-3-browser-agents/README.md)

Learn the 7 core browser actions and build advanced automation workflows.

---

> "Understanding the architecture was key to customizing the platform for our needs." – Senior Engineer

> "The agent registry pattern saved us months of development time." – CTO
