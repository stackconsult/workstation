# Agent Registry: Dynamic Agent Discovery and Management

## Table of Contents
- [Introduction](#introduction)
- [Agent Registry Concepts](#agent-registry-concepts)
- [TypeScript Interfaces](#typescript-interfaces)
- [Registration Patterns](#registration-patterns)
- [Discovery Mechanisms](#discovery-mechanisms)
- [Agent Lifecycle Management](#agent-lifecycle-management)
- [Code Examples](#code-examples)
- [Business Value](#business-value)

## Introduction

The Agent Registry is the central directory for all automation agents in the Workstation system. It provides dynamic agent discovery, registration, and lifecycle management capabilities that enable extensible, plugin-based automation architectures.

**Key Features:**
- **Dynamic Registration**: Agents can register themselves at runtime
- **Capability Discovery**: Query agents by their capabilities
- **Health Monitoring**: Track agent status (idle, active, error, building)
- **Tier-Based Organization**: Categorize agents by complexity (Tier 1-3)
- **Accuracy Tracking**: Monitor agent performance and reliability

**Business Context**: For agencies, this registry enables a "marketplace" model where you can offer different automation capabilities as add-on services. For enterprises, it provides governance over which automations are approved for use.

## Agent Registry Concepts

### What is an Agent?

An **agent** is a self-contained unit of automation with:
- **Unique ID**: Numeric identifier (1-∞)
- **Name**: Human-readable label ("Web Scraper", "Data Extractor")
- **Tier**: Complexity level (1=simple, 2=moderate, 3=complex)
- **Status**: Current state (idle/active/error/building)
- **Capabilities**: Array of actions it can perform
- **Accuracy**: Performance metric (0-100%)
- **Required Accuracy**: Minimum acceptable performance threshold

### Agent Tiers

**Tier 1: Simple Agents** (90%+ accuracy required)
- Single-action agents (navigate, click, type)
- Predictable execution (< 1 second)
- Minimal dependencies
- Examples: "Navigate to URL", "Click Button", "Extract Text"

**Tier 2: Moderate Agents** (85%+ accuracy required)
- Multi-action sequences (3-5 steps)
- Conditional logic
- Basic error handling
- Examples: "Login Flow", "Form Submission", "Data Extraction"

**Tier 3: Complex Agents** (80%+ accuracy required)
- Advanced workflows (10+ steps)
- Dynamic decision-making
- External API integration
- Examples: "E-commerce Checkout", "Content Publishing", "Multi-site Scraping"

### Capability System

Capabilities define **what an agent can do**. They follow a verb-object pattern:

```typescript
// Standard capabilities
const capabilities = [
  // Navigation
  'navigate:url',
  'navigate:back',
  'navigate:forward',
  
  // Interaction
  'click:element',
  'type:text',
  'select:option',
  'upload:file',
  
  // Data extraction
  'extract:text',
  'extract:html',
  'extract:attributes',
  'extract:screenshot',
  
  // Validation
  'validate:element',
  'validate:text',
  'validate:url',
  
  // External integration
  'webhook:post',
  'api:call',
  'slack:notify'
];
```

**Business Context**: When a client asks "Can you automate X?", you query the registry for agents with the required capabilities. This turns sales conversations into "Yes, we have agents for that" instead of "Let me check if it's possible."

## TypeScript Interfaces

### Core Agent Interface

```typescript
/**
 * Agent Definition
 * 
 * Represents a registered automation agent in the system.
 * 
 * @example
 * const agent: Agent = {
 *   id: 1,
 *   name: 'Web Navigator',
 *   tier: 1,
 *   status: 'idle',
 *   accuracy: 98.5,
 *   requiredAccuracy: 90,
 *   capabilities: ['navigate:url', 'navigate:back', 'navigate:forward']
 * };
 */
export interface Agent {
  /** Unique numeric identifier */
  id: number;
  
  /** Human-readable agent name */
  name: string;
  
  /** Complexity tier (1=simple, 2=moderate, 3=complex) */
  tier: 1 | 2 | 3;
  
  /** Current execution status */
  status: 'idle' | 'active' | 'error' | 'building';
  
  /** Current performance accuracy (0-100) */
  accuracy: number;
  
  /** Minimum acceptable accuracy threshold */
  requiredAccuracy: number;
  
  /** Array of capabilities (verb:object format) */
  capabilities: string[];
  
  /** Optional: Agent metadata */
  metadata?: {
    version?: string;
    author?: string;
    description?: string;
    createdAt?: Date;
    lastExecuted?: Date;
    executionCount?: number;
  };
}
```

### Agent Registration Request

```typescript
/**
 * Agent Registration Request
 * 
 * Submitted by agents when registering with the system.
 */
export interface AgentRegistrationRequest {
  /** Desired agent name (must be unique) */
  name: string;
  
  /** Complexity tier */
  tier: 1 | 2 | 3;
  
  /** List of capabilities */
  capabilities: string[];
  
  /** Required accuracy (default: tier-based) */
  requiredAccuracy?: number;
  
  /** Optional metadata */
  metadata?: Record<string, unknown>;
}
```

### Agent Query Interface

```typescript
/**
 * Agent Query Filters
 * 
 * Used to search the agent registry.
 */
export interface AgentQuery {
  /** Filter by agent ID */
  id?: number;
  
  /** Filter by agent name (exact or partial match) */
  name?: string;
  
  /** Filter by tier */
  tier?: 1 | 2 | 3;
  
  /** Filter by status */
  status?: 'idle' | 'active' | 'error' | 'building';
  
  /** Filter by capabilities (AND logic - must have ALL) */
  capabilities?: string[];
  
  /** Filter by minimum accuracy */
  minAccuracy?: number;
}
```

### Agent Registry Interface

```typescript
/**
 * Agent Registry
 * 
 * Central repository for all registered agents.
 */
export interface IAgentRegistry {
  /**
   * Register a new agent
   * 
   * @throws Error if agent name already exists
   * @returns Agent instance with assigned ID
   */
  register(request: AgentRegistrationRequest): Agent;
  
  /**
   * Unregister an agent
   * 
   * @param agentId - Agent to remove
   * @throws Error if agent is currently active
   */
  unregister(agentId: number): void;
  
  /**
   * Get agent by ID
   * 
   * @returns Agent or undefined if not found
   */
  getAgent(agentId: number): Agent | undefined;
  
  /**
   * Query agents by filters
   * 
   * @returns Array of matching agents
   */
  queryAgents(query: AgentQuery): Agent[];
  
  /**
   * Update agent status
   * 
   * @param agentId - Agent to update
   * @param status - New status
   */
  updateStatus(agentId: number, status: Agent['status']): void;
  
  /**
   * Update agent accuracy
   * 
   * @param agentId - Agent to update
   * @param accuracy - New accuracy value (0-100)
   */
  updateAccuracy(agentId: number, accuracy: number): void;
  
  /**
   * List all registered agents
   * 
   * @returns Array of all agents
   */
  listAll(): Agent[];
}
```

## Registration Patterns

### Pattern 1: Static Registration (Startup)

**Use Case**: Core agents that should always be available.

```typescript
// src/automation/agents/registry.ts
import { AgentRegistry } from './AgentRegistry';

const registry = new AgentRegistry();

// Register core agents on server startup
function registerCoreAgents() {
  // Tier 1: Navigation agents
  registry.register({
    name: 'Web Navigator',
    tier: 1,
    capabilities: ['navigate:url', 'navigate:back', 'navigate:forward'],
    requiredAccuracy: 95,
    metadata: {
      version: '1.0.0',
      description: 'Basic web navigation'
    }
  });
  
  // Tier 1: Click agent
  registry.register({
    name: 'Element Clicker',
    tier: 1,
    capabilities: ['click:element', 'click:button', 'click:link'],
    requiredAccuracy: 95
  });
  
  // Tier 1: Text input agent
  registry.register({
    name: 'Text Typer',
    tier: 1,
    capabilities: ['type:text', 'type:password', 'type:email'],
    requiredAccuracy: 95
  });
  
  // Tier 2: Form submission agent
  registry.register({
    name: 'Form Submitter',
    tier: 2,
    capabilities: [
      'type:text',
      'type:email',
      'select:option',
      'click:button',
      'validate:form'
    ],
    requiredAccuracy: 90
  });
  
  // Tier 2: Data extraction agent
  registry.register({
    name: 'Data Extractor',
    tier: 2,
    capabilities: [
      'extract:text',
      'extract:html',
      'extract:attributes',
      'validate:element'
    ],
    requiredAccuracy: 90
  });
  
  // Tier 3: E-commerce scraper
  registry.register({
    name: 'E-commerce Scraper',
    tier: 3,
    capabilities: [
      'navigate:url',
      'extract:text',
      'extract:html',
      'click:element',
      'validate:element',
      'webhook:post'
    ],
    requiredAccuracy: 85
  });
  
  console.log(`✅ Registered ${registry.listAll().length} core agents`);
}

// Call on server initialization
registerCoreAgents();

export { registry };
```

**Business Context**: These core agents are your "base package" that every client gets. They're battle-tested and reliable.

### Pattern 2: Dynamic Registration (Runtime)

**Use Case**: Custom agents loaded from plugins or external modules.

```typescript
// src/automation/agents/plugin-loader.ts
import { registry } from './registry';
import { readdir } from 'fs/promises';
import { join } from 'path';

/**
 * Load custom agents from plugins directory
 * 
 * Directory structure:
 * plugins/
 * ├── slack-notifier/
 * │   ├── agent.json
 * │   └── handler.ts
 * └── crm-updater/
 *     ├── agent.json
 *     └── handler.ts
 */
async function loadPluginAgents(pluginsDir: string) {
  const plugins = await readdir(pluginsDir, { withFileTypes: true });
  
  for (const plugin of plugins) {
    if (!plugin.isDirectory()) continue;
    
    const pluginPath = join(pluginsDir, plugin.name);
    const configPath = join(pluginPath, 'agent.json');
    
    try {
      // Load plugin configuration
      const config = require(configPath);
      
      // Register agent
      const agent = registry.register({
        name: config.name,
        tier: config.tier,
        capabilities: config.capabilities,
        requiredAccuracy: config.requiredAccuracy || 80,
        metadata: {
          version: config.version,
          author: config.author,
          description: config.description,
          pluginPath
        }
      });
      
      console.log(`✅ Loaded plugin agent: ${agent.name} (ID: ${agent.id})`);
    } catch (error) {
      console.error(`❌ Failed to load plugin: ${plugin.name}`, error);
    }
  }
}

// Load plugins on server start
loadPluginAgents('./plugins').catch(console.error);
```

**Plugin Configuration Example** (`plugins/slack-notifier/agent.json`):
```json
{
  "name": "Slack Notifier",
  "tier": 2,
  "version": "1.0.0",
  "author": "Your Agency",
  "description": "Send notifications to Slack channels",
  "capabilities": [
    "slack:notify",
    "slack:message",
    "slack:channel"
  ],
  "requiredAccuracy": 90
}
```

**Business Context**: This plugin system lets you build custom agents for specific clients without modifying core code. Charge $500/month for "Custom Slack Integration Agent" that took you 2 hours to build.

### Pattern 3: API-Based Registration

**Use Case**: External systems registering agents via REST API.

```typescript
// POST /api/agents/register
app.post('/api/agents/register', 
  authenticateToken,
  validateRequest(schemas.agentRegistration),
  (req: AuthenticatedRequest, res: Response) => {
    try {
      const { name, tier, capabilities, requiredAccuracy, metadata } = req.body;
      
      // Register agent
      const agent = registry.register({
        name,
        tier,
        capabilities,
        requiredAccuracy,
        metadata: {
          ...metadata,
          registeredBy: req.user.userId,
          registeredAt: new Date()
        }
      });
      
      res.json({
        message: 'Agent registered successfully',
        data: agent
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

// DELETE /api/agents/:id
app.delete('/api/agents/:id',
  authenticateToken,
  (req: AuthenticatedRequest, res: Response) => {
    try {
      const agentId = parseInt(req.params.id);
      registry.unregister(agentId);
      
      res.json({
        message: 'Agent unregistered successfully'
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);
```

**Business Context**: API-based registration enables "bring your own agents" models where clients can develop and register their own automation agents.

## Discovery Mechanisms

### Query by Capability

```typescript
// Find all agents that can extract text
const extractors = registry.queryAgents({
  capabilities: ['extract:text']
});

console.log(`Found ${extractors.length} agents with text extraction capability`);

// Find agents that can perform a complete login flow
const loginAgents = registry.queryAgents({
  capabilities: ['navigate:url', 'type:text', 'click:button']
});
```

### Query by Tier and Accuracy

```typescript
// Find high-reliability Tier 1 agents
const simpleAgents = registry.queryAgents({
  tier: 1,
  minAccuracy: 95
});

// Find available (non-busy) Tier 2+ agents
const availableAgents = registry.queryAgents({
  status: 'idle'
}).filter(agent => agent.tier >= 2);
```

### Smart Agent Selection

```typescript
/**
 * Select best agent for a task based on capabilities and accuracy
 * 
 * @param requiredCapabilities - Capabilities needed for the task
 * @returns Best matching agent or null
 */
function selectBestAgent(requiredCapabilities: string[]): Agent | null {
  const candidates = registry.queryAgents({
    capabilities: requiredCapabilities,
    status: 'idle'
  });
  
  if (candidates.length === 0) return null;
  
  // Sort by accuracy (highest first), then tier (lowest first for simplicity)
  candidates.sort((a, b) => {
    if (b.accuracy !== a.accuracy) {
      return b.accuracy - a.accuracy; // Higher accuracy first
    }
    return a.tier - b.tier; // Lower tier first (simpler)
  });
  
  return candidates[0];
}

// Usage
const agent = selectBestAgent(['navigate:url', 'extract:text']);
if (agent) {
  console.log(`Selected agent: ${agent.name} (Accuracy: ${agent.accuracy}%)`);
} else {
  console.log('No suitable agent found');
}
```

**Business Context**: Smart selection means your workflows automatically use the most reliable agents, improving client satisfaction without manual configuration.

## Agent Lifecycle Management

### Status Transitions

```typescript
/**
 * Agent Status State Machine
 * 
 * idle → active → idle (success)
 *              → error (failure, manual reset required)
 *              
 * building → idle (registration complete)
 *         → error (registration failed)
 */

// Update agent status during workflow execution
async function executeAgent(agentId: number, task: Task) {
  const agent = registry.getAgent(agentId);
  if (!agent) throw new Error(`Agent ${agentId} not found`);
  
  // Check if agent is available
  if (agent.status !== 'idle') {
    throw new Error(`Agent ${agent.name} is ${agent.status}, cannot execute`);
  }
  
  try {
    // Mark as active
    registry.updateStatus(agentId, 'active');
    
    // Execute task
    const result = await performTask(agent, task);
    
    // Update accuracy based on result
    const newAccuracy = calculateAccuracy(result);
    registry.updateAccuracy(agentId, newAccuracy);
    
    // Mark as idle (ready for next task)
    registry.updateStatus(agentId, 'idle');
    
    return result;
  } catch (error) {
    // Mark as error
    registry.updateStatus(agentId, 'error');
    throw error;
  }
}
```

### Accuracy Tracking

```typescript
/**
 * Update agent accuracy using exponential moving average
 * 
 * This smooths out temporary fluctuations while being responsive
 * to sustained performance changes.
 */
function updateAgentAccuracy(agentId: number, executionAccuracy: number) {
  const agent = registry.getAgent(agentId);
  if (!agent) return;
  
  const alpha = 0.2; // Smoothing factor (0-1)
  const newAccuracy = (alpha * executionAccuracy) + ((1 - alpha) * agent.accuracy);
  
  registry.updateAccuracy(agentId, newAccuracy);
  
  // Log if accuracy falls below threshold
  if (newAccuracy < agent.requiredAccuracy) {
    console.warn(
      `⚠️ Agent ${agent.name} accuracy (${newAccuracy.toFixed(1)}%) ` +
      `below threshold (${agent.requiredAccuracy}%)`
    );
  }
}
```

### Health Monitoring

```typescript
/**
 * Periodic health check for all agents
 * 
 * Runs every 5 minutes to:
 * - Reset stuck agents (active for > 10 minutes)
 * - Archive low-performing agents (accuracy < threshold for > 24 hours)
 * - Report agent statistics
 */
setInterval(() => {
  const agents = registry.listAll();
  const now = Date.now();
  
  for (const agent of agents) {
    // Reset stuck agents
    if (agent.status === 'active' && agent.metadata?.lastExecuted) {
      const executionTime = now - agent.metadata.lastExecuted.getTime();
      if (executionTime > 10 * 60 * 1000) { // 10 minutes
        console.warn(`⚠️ Resetting stuck agent: ${agent.name}`);
        registry.updateStatus(agent.id, 'error');
      }
    }
    
    // Report low accuracy
    if (agent.accuracy < agent.requiredAccuracy) {
      console.warn(
        `⚠️ Low accuracy agent: ${agent.name} ` +
        `(${agent.accuracy.toFixed(1)}% < ${agent.requiredAccuracy}%)`
      );
    }
  }
  
  // Report statistics
  const stats = {
    total: agents.length,
    idle: agents.filter(a => a.status === 'idle').length,
    active: agents.filter(a => a.status === 'active').length,
    error: agents.filter(a => a.status === 'error').length,
    avgAccuracy: agents.reduce((sum, a) => sum + a.accuracy, 0) / agents.length
  };
  
  console.log('📊 Agent Registry Stats:', stats);
}, 5 * 60 * 1000);
```

**Business Context**: Automated health monitoring means you know about agent issues before clients do. Proactive alerting reduces support tickets.

## Code Examples

### Example 1: Complete Agent Registry Implementation

```typescript
// src/automation/agents/AgentRegistry.ts
import { EventEmitter } from 'events';
import type { Agent, AgentRegistrationRequest, AgentQuery, IAgentRegistry } from '../types';

export class AgentRegistry extends EventEmitter implements IAgentRegistry {
  private agents: Map<number, Agent> = new Map();
  private nextId: number = 1;
  
  register(request: AgentRegistrationRequest): Agent {
    // Validate request
    if (!request.name || request.name.trim().length === 0) {
      throw new Error('Agent name is required');
    }
    
    // Check for duplicate name
    const existing = Array.from(this.agents.values())
      .find(a => a.name === request.name);
    if (existing) {
      throw new Error(`Agent with name "${request.name}" already exists`);
    }
    
    // Determine required accuracy based on tier if not specified
    const requiredAccuracy = request.requiredAccuracy || (
      request.tier === 1 ? 95 :
      request.tier === 2 ? 90 :
      85 // tier 3
    );
    
    // Create agent
    const agent: Agent = {
      id: this.nextId++,
      name: request.name,
      tier: request.tier,
      status: 'idle',
      accuracy: requiredAccuracy, // Start with required accuracy
      requiredAccuracy,
      capabilities: request.capabilities,
      metadata: {
        ...request.metadata,
        createdAt: new Date(),
        executionCount: 0
      }
    };
    
    // Store agent
    this.agents.set(agent.id, agent);
    
    // Emit event
    this.emit('agent:registered', agent);
    
    return agent;
  }
  
  unregister(agentId: number): void {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }
    
    // Prevent unregistering active agents
    if (agent.status === 'active') {
      throw new Error(`Cannot unregister active agent: ${agent.name}`);
    }
    
    // Remove agent
    this.agents.delete(agentId);
    
    // Emit event
    this.emit('agent:unregistered', agent);
  }
  
  getAgent(agentId: number): Agent | undefined {
    return this.agents.get(agentId);
  }
  
  queryAgents(query: AgentQuery): Agent[] {
    let results = Array.from(this.agents.values());
    
    // Apply filters
    if (query.id !== undefined) {
      results = results.filter(a => a.id === query.id);
    }
    
    if (query.name) {
      const lowerName = query.name.toLowerCase();
      results = results.filter(a => 
        a.name.toLowerCase().includes(lowerName)
      );
    }
    
    if (query.tier) {
      results = results.filter(a => a.tier === query.tier);
    }
    
    if (query.status) {
      results = results.filter(a => a.status === query.status);
    }
    
    if (query.capabilities && query.capabilities.length > 0) {
      results = results.filter(a =>
        query.capabilities!.every(cap => a.capabilities.includes(cap))
      );
    }
    
    if (query.minAccuracy !== undefined) {
      results = results.filter(a => a.accuracy >= query.minAccuracy!);
    }
    
    return results;
  }
  
  updateStatus(agentId: number, status: Agent['status']): void {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }
    
    const oldStatus = agent.status;
    agent.status = status;
    
    // Update metadata
    if (status === 'active') {
      agent.metadata = agent.metadata || {};
      agent.metadata.lastExecuted = new Date();
    }
    
    // Emit event
    this.emit('agent:status-changed', { agent, oldStatus, newStatus: status });
  }
  
  updateAccuracy(agentId: number, accuracy: number): void {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }
    
    // Validate accuracy range
    if (accuracy < 0 || accuracy > 100) {
      throw new Error('Accuracy must be between 0 and 100');
    }
    
    const oldAccuracy = agent.accuracy;
    agent.accuracy = accuracy;
    
    // Increment execution count
    agent.metadata = agent.metadata || {};
    agent.metadata.executionCount = (agent.metadata.executionCount || 0) + 1;
    
    // Emit event
    this.emit('agent:accuracy-updated', { agent, oldAccuracy, newAccuracy: accuracy });
  }
  
  listAll(): Agent[] {
    return Array.from(this.agents.values());
  }
}

// Export singleton instance
export const registry = new AgentRegistry();
```

### Example 2: Agent Discovery API Endpoints

```typescript
// src/routes/agents.ts
import { Router } from 'express';
import { registry } from '../automation/agents/AgentRegistry';
import { authenticateToken } from '../auth/jwt';

const router = Router();

// GET /api/agents - List all agents
router.get('/', authenticateToken, (req, res) => {
  const agents = registry.listAll();
  res.json({
    message: 'Agents retrieved',
    data: agents,
    count: agents.length
  });
});

// GET /api/agents/:id - Get specific agent
router.get('/:id', authenticateToken, (req, res) => {
  const agentId = parseInt(req.params.id);
  const agent = registry.getAgent(agentId);
  
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }
  
  res.json({ data: agent });
});

// POST /api/agents/query - Query agents by filters
router.post('/query', authenticateToken, (req, res) => {
  const query = req.body;
  const agents = registry.queryAgents(query);
  
  res.json({
    message: 'Query executed',
    data: agents,
    count: agents.length
  });
});

export default router;
```

## Business Value

### For Agencies

**1. Rapid Client Onboarding**
- Pre-built agent library reduces custom development
- Example: Client wants "LinkedIn automation"
  - Query registry: `capabilities: ['navigate:url', 'extract:text', 'click:button']`
  - Found 3 matching agents → Demo ready in 30 minutes

**2. Upsell Opportunities**
- Base package: 10 core agents ($500/month)
- Premium package: 25 agents including Tier 3 ($1,500/month)
- Custom agents: $200/agent one-time fee

**3. Quality Assurance**
- Accuracy tracking shows which agents need improvement
- Client reports: "Your automation has 96% success rate" (backed by data)

### For Founders

**1. Build Your Own Automation Toolkit**
- Register custom agents for your specific needs
- Example: "Daily competitor price check" agent
- Example: "Social media scheduler" agent

**2. Experiment Quickly**
- Try different agent combinations
- A/B test workflows (Agent 1+2 vs Agent 3+4)
- Measure which approach works best

### For Platform Engineers

**1. Governance & Control**
- Whitelist approved agents for production
- Block experimental agents in production
- Audit trail of agent registration

**2. Performance Monitoring**
- Track agent accuracy over time
- Identify and fix underperforming agents
- Capacity planning (how many concurrent agents needed?)

### For Senior Developers

**1. Extensibility**
- Plugin system for custom agents
- Clean API for agent registration
- Event-driven architecture (agent:registered, agent:status-changed)

**2. Type Safety**
- Full TypeScript interfaces
- Compile-time checks for agent compatibility
- IDE autocomplete for agent properties

## Next Steps

1. **Implement a custom agent**: Follow [New Agent Creation](../module-4-customization/new-agent-creation.md)
2. **Explore orchestration**: See [Orchestrator Patterns](./orchestrator-patterns.md)
3. **Build workflows**: Continue to [Module 3: Browser Agents](../module-3-browser-agents/README.md)

## Additional Resources

- **Source Code**: `src/automation/agents/`, `src/orchestration/agent-orchestrator.ts`
- **API Reference**: `API.md` - `/api/agents` endpoints
- **TypeScript Types**: `src/types/` - Agent-related interfaces
