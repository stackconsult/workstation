# Module 4: Customization

## Overview

Transform the Workstation platform into a tailored automation solution for your specific business needs. This module teaches you how to clone existing agents, build custom agents from scratch, integrate with external systems, and create reusable playbooks that become your competitive advantage.

## Learning Objectives

By the end of this module, you will be able to:

- **Clone and Modify Existing Agents** - Duplicate browser agents and customize for specific workflows
- **Build Custom Agents from Scratch** - Create TypeScript agents with custom capabilities
- **Engineer Effective Prompts** - Design prompts that maximize agent performance
- **Integrate External Systems** - Connect Slack, webhooks, CRMs, and third-party APIs
- **Create Reusable Playbooks** - Document and templatize workflows for rapid deployment
- **Extend the Agent Registry** - Add new agent types to the platform dynamically

## Prerequisites

- Completed [Module 3: Core Browser Agents](../module-3-browser-agents/README.md)
- Understanding of TypeScript and async/await patterns
- Familiarity with REST APIs and webhooks
- Running Workstation instance with test workflows

## Files in This Module

- **agent-duplication-pattern.md** - How to clone and modify existing agents
- **new-agent-creation.md** - Build custom agents from scratch with complete examples
- **prompt-engineering.md** - Design effective automation prompts and task definitions
- **external-integration-patterns.md** - Integrate Slack, webhooks, and third-party APIs
- **playbook-structure.md** - Document and templatize workflows for reuse

## Why Customization Matters

### For Agencies

**Problem:** Every client has unique automation needs. Building custom solutions from scratch for each client is time-consuming and expensive.

**Solution:** Create a library of reusable agents and playbooks that can be mixed, matched, and customized in hours instead of weeks.

**Business Impact:**
- Reduce client onboarding time by 70%
- Standardize deliverables while maintaining customization
- Build IP assets that increase agency valuation
- Create upsell opportunities with specialized agents

**Real Example:**
```
Agency X built a "Lead Enrichment Agent" that:
- Scrapes LinkedIn profiles
- Enriches with Apollo.io data
- Scores leads with custom criteria
- Posts to Slack for sales team

Time to build: 2 days
Deployed to 15 clients with minor tweaks
Revenue generated: $45k/year per client
```

### For Technical Founders

**Problem:** Your SaaS needs to support different industries, each with unique automation requirements. Building every feature request increases complexity.

**Solution:** Create a plugin architecture where agents are independent modules. Customers can add/remove agents based on their subscription tier.

**Business Impact:**
- Ship MVPs faster with core agents
- Monetize specialized agents as premium add-ons
- Enable partners to build custom agents
- Scale without proportional engineering headcount

**Real Example:**
```
SaaS Founder built "Agent Marketplace":
- Core platform: $99/month (5 browser agents)
- Premium agents: $29/month each
  - CRM Sync Agent
  - Document Processing Agent
  - Compliance Reporting Agent
- Partner-built agents: 70/30 revenue share

Result: 3x MRR in 6 months
```

### For Platform Engineers

**Problem:** Enterprise has hundreds of legacy systems that need to communicate. Building point-to-point integrations doesn't scale.

**Solution:** Use agents as adapters. Each agent wraps a legacy system and exposes standardized capabilities to the orchestrator.

**Business Impact:**
- Reduce integration time from months to weeks
- Abstract complexity behind agent interfaces
- Enable non-technical teams to build workflows
- Centralize monitoring and error handling

**Real Example:**
```
Enterprise deployed 25 custom agents:
- Mainframe Database Agent (wraps COBOL queries)
- SAP ERP Agent (REST API wrapper)
- PDF Processing Agent (Tabula + custom logic)
- Email Campaign Agent (SendGrid integration)

Before: 6 months to connect 2 systems
After: 1 week to add system to agent network
```

### For Senior Developers

**Problem:** Browser automation scripts become brittle. Selectors break. Workflows fail silently. No reusability between projects.

**Solution:** Architect agents with versioning, error recovery, and clear contracts. Build once, reuse across projects.

**Business Impact:**
- Reduce maintenance burden by 80%
- Ship side projects faster
- Build consulting offerings from battle-tested agents
- Portfolio differentiator for job searches

**Real Example:**
```
Senior Dev built "E-commerce Testing Suite":
- Product Upload Agent (Shopify, WooCommerce)
- Checkout Flow Agent (Stripe, PayPal)
- Inventory Sync Agent (custom integrations)

Deployed to 5 consulting clients
$25k/client implementation fee
$500/month maintenance per client
```

## What You'll Build

By the end of this module, you will have:

1. **Custom Email Agent**
   - Send emails via SendGrid/Mailgun
   - Track opens and clicks
   - Queue and retry failed sends

2. **CRM Integration Agent**
   - Sync contacts to HubSpot/Salesforce
   - Update deal stages based on automation results
   - Log activities from workflow executions

3. **Slack Notification Agent**
   - Post workflow results to channels
   - Interactive buttons for approvals
   - Error alerts with retry options

4. **Data Transformation Agent**
   - Parse CSV/JSON from browser extractions
   - Apply business logic transformations
   - Output to database or API

5. **Reusable Playbooks**
   - Lead enrichment workflow
   - Competitive intelligence gathering
   - Compliance report generation
   - Customer onboarding automation

## Time to Complete

- **Fast Track**: 4-6 hours (follow examples, build 1 custom agent)
- **Deep Dive**: 10-12 hours (build 3-4 custom agents, create playbooks)
- **Production Ready**: 20-25 hours (full custom agent library for your business)

## Module Structure

### Part 1: Agent Patterns (2-3 hours)

Learn to clone and modify existing agents:
- Copy BrowserAgent as template
- Modify capabilities for specific tasks
- Update registry to expose new agent
- Test with minimal workflow

### Part 2: Building from Scratch (3-4 hours)

Create completely new agents:
- Define agent interface and contract
- Implement TypeScript class with actions
- Handle errors and edge cases
- Add comprehensive tests

### Part 3: Integration Patterns (2-3 hours)

Connect to external systems:
- Webhook sender/receiver patterns
- API client wrapper strategies
- Authentication handling
- Rate limiting and retries

### Part 4: Prompt Engineering (1-2 hours)

Design effective automation prompts:
- Task definition best practices
- Parameter extraction patterns
- Context passing between tasks
- Error handling instructions

### Part 5: Playbook Creation (2-3 hours)

Document and templatize workflows:
- JSON workflow schema
- Variable substitution
- Conditional task execution
- Reusable workflow templates

## Getting Started

Start with [agent-duplication-pattern.md](./agent-duplication-pattern.md) to learn the fastest way to create custom agents by cloning existing ones.

## Key Concepts

### 1. Agent Contract

All agents implement a standard interface:

```typescript
interface Agent {
  type: string;              // Unique identifier
  name: string;              // Human-readable name
  version: string;           // Semantic version
  actions: AgentAction[];    // Available actions
  
  // Execute action with parameters
  execute(action: string, params: Record<string, unknown>): Promise<unknown>;
  
  // Initialize resources (DB connections, API clients, etc.)
  initialize?(): Promise<void>;
  
  // Cleanup resources
  cleanup?(): Promise<void>;
}

interface AgentAction {
  name: string;                          // Action identifier
  description: string;                   // What it does
  parameters: ParameterDefinition[];     // Expected inputs
  returns: ReturnTypeDefinition;         // Output structure
}
```

### 2. Registration Pattern

Agents self-register with the registry:

```typescript
// In registry.ts
export class AgentRegistry {
  registerAgent(agent: Agent): void {
    this.agents.set(agent.type, agent);
    logger.info('Agent registered', { 
      type: agent.type, 
      actions: agent.actions.map(a => a.name) 
    });
  }
}

// In custom agent file
import { agentRegistry } from './core/registry';
import { MyCustomAgent } from './custom/my-agent';

const customAgent = new MyCustomAgent();
agentRegistry.registerAgent(customAgent);
```

### 3. Workflow Integration

Custom agents work seamlessly in workflows:

```json
{
  "name": "Custom Workflow",
  "tasks": [
    {
      "name": "scrape_data",
      "agent_type": "browser",
      "action": "navigate",
      "parameters": {"url": "https://example.com"}
    },
    {
      "name": "send_to_crm",
      "agent_type": "crm",
      "action": "createContact",
      "parameters": {
        "email": "{{tasks.scrape_data.email}}",
        "source": "automation"
      }
    },
    {
      "name": "notify_team",
      "agent_type": "slack",
      "action": "postMessage",
      "parameters": {
        "channel": "#leads",
        "text": "New contact added: {{tasks.send_to_crm.id}}"
      }
    }
  ]
}
```

### 4. Error Recovery

Custom agents should handle errors gracefully:

```typescript
async execute(action: string, params: Record<string, unknown>): Promise<unknown> {
  try {
    // Attempt action
    const result = await this.performAction(action, params);
    return { success: true, data: result };
  } catch (error) {
    logger.error('Agent action failed', { action, error });
    
    // Return structured error for orchestrator
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      retryable: this.isRetryable(error),
      context: { action, params }
    };
  }
}
```

## Customization Best Practices

### Design Principles

1. **Single Responsibility**: Each agent does one thing well
2. **Stateless Execution**: Agents don't hold state between calls
3. **Idempotent Actions**: Same input produces same output
4. **Clear Contracts**: Strongly-typed parameters and returns
5. **Graceful Degradation**: Handle failures without crashing

### Code Organization

```
src/automation/agents/
├── core/
│   ├── browser.ts         # Built-in browser agent
│   └── registry.ts        # Agent registry
├── custom/
│   ├── email.ts           # Email agent
│   ├── crm.ts             # CRM integration agent
│   ├── slack.ts           # Slack agent
│   └── data-transform.ts  # Data processing agent
└── index.ts               # Export all agents
```

### Testing Strategy

```typescript
// tests/agents/custom/email.test.ts
describe('EmailAgent', () => {
  let agent: EmailAgent;
  
  beforeEach(async () => {
    agent = new EmailAgent({ apiKey: 'test_key' });
    await agent.initialize();
  });
  
  afterEach(async () => {
    await agent.cleanup();
  });
  
  describe('sendEmail action', () => {
    it('should send email with valid parameters', async () => {
      const result = await agent.execute('sendEmail', {
        to: 'test@example.com',
        subject: 'Test',
        body: 'Hello'
      });
      
      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });
    
    it('should handle invalid email address', async () => {
      const result = await agent.execute('sendEmail', {
        to: 'invalid-email',
        subject: 'Test',
        body: 'Hello'
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid email');
    });
  });
});
```

## Real-World Customization Examples

### Example 1: Lead Enrichment Pipeline

**Business Need:** Automatically enrich leads from website form submissions

**Custom Agents:**
- LeadCaptureAgent (webhook receiver)
- LinkedInScraperAgent (profile data)
- EmailVerificationAgent (ZeroBounce API)
- CRMSyncAgent (HubSpot integration)
- SlackNotificationAgent (sales alerts)

**Workflow:**
1. Receive webhook from website form
2. Scrape LinkedIn profile
3. Verify email address
4. Sync enriched lead to CRM
5. Notify sales team on Slack

**Results:**
- 85% of leads enriched automatically
- 12 minutes average enrichment time
- $150/month in API costs
- 15 hours/week saved for sales team

### Example 2: Compliance Report Generator

**Business Need:** Generate weekly SOC 2 compliance reports

**Custom Agents:**
- AuditLogAgent (query internal logs)
- SecurityScanAgent (run vulnerability scans)
- DocumentGeneratorAgent (PDF creation)
- S3StorageAgent (secure storage)
- EmailReportAgent (send to auditors)

**Workflow:**
1. Pull audit logs for past 7 days
2. Run security scans on infrastructure
3. Generate PDF report with findings
4. Upload to S3 with encryption
5. Email secure link to auditors

**Results:**
- 8 hours/week saved
- 100% on-time compliance reporting
- Audit preparation time reduced by 60%

### Example 3: Competitive Intelligence

**Business Need:** Track competitor pricing and product changes

**Custom Agents:**
- CompetitorScraperAgent (multi-site scraping)
- DiffDetectionAgent (change detection)
- PriceAnalysisAgent (pricing strategy)
- DataWarehouseAgent (historical storage)
- ExecutiveDashboardAgent (Looker integration)

**Workflow:**
1. Scrape competitor websites daily
2. Detect changes from previous day
3. Analyze pricing trends
4. Store in data warehouse
5. Update executive dashboard

**Results:**
- 47 competitors monitored
- Changes detected within 24 hours
- Strategic decisions based on real-time data
- $12k/year saved vs. market research firms

## Troubleshooting

### Common Issues

**Agent Not Registered**
```bash
Error: Agent type 'custom' not found in registry
```
**Solution:** Ensure agent is imported and registered in `src/automation/agents/index.ts`

**TypeScript Compilation Errors**
```bash
Error: Type 'CustomAgent' is not assignable to type 'Agent'
```
**Solution:** Verify agent implements all required interface methods

**Runtime Initialization Failures**
```bash
Error: Failed to initialize agent: API key missing
```
**Solution:** Add required environment variables to `.env` file

**Workflow Execution Hangs**
```bash
Task 'custom_action' timeout after 30000ms
```
**Solution:** Implement proper timeout handling in agent actions

## Security Considerations

### API Key Management

```typescript
// ❌ DON'T: Hardcode secrets
class BadAgent {
  private apiKey = 'sk_live_abc123';
}

// ✅ DO: Use environment variables
class GoodAgent {
  private apiKey: string;
  
  constructor() {
    this.apiKey = process.env.CUSTOM_AGENT_API_KEY!;
    if (!this.apiKey) {
      throw new Error('CUSTOM_AGENT_API_KEY required');
    }
  }
}
```

### Input Validation

```typescript
// Validate parameters before execution
async execute(action: string, params: Record<string, unknown>): Promise<unknown> {
  const schema = this.getActionSchema(action);
  const { error, value } = schema.validate(params);
  
  if (error) {
    throw new Error(`Invalid parameters: ${error.message}`);
  }
  
  return this.performAction(action, value);
}
```

### Rate Limiting

```typescript
// Implement rate limiting for external APIs
class RateLimitedAgent {
  private rateLimiter = new RateLimiter({
    requests: 100,
    per: 'minute'
  });
  
  async execute(action: string, params: Record<string, unknown>): Promise<unknown> {
    await this.rateLimiter.wait();
    return this.performAction(action, params);
  }
}
```

## Next Steps

After completing this module:

1. **Build Your First Custom Agent** - Start with email or Slack integration
2. **Create 3-5 Reusable Playbooks** - Document common workflows in your business
3. **Set Up Integration Tests** - Validate agents work in realistic scenarios
4. **Deploy to Production** - Move to [Module 5: Automation](../module-5-automation/README.md)

## Resources

- [TypeScript Agent Examples](../../src/automation/agents/)
- [Workflow Schema Reference](../../docs/workflow-schema.md)
- [Agent Registry Implementation](../../src/automation/agents/core/registry.ts)
- [Browser Agent Source](../../src/automation/agents/core/browser.ts)

## Success Metrics

Track these metrics to measure customization success:

- **Agent Reusability**: Number of workflows using each custom agent
- **Time to Deploy**: Hours from concept to production agent
- **Error Rate**: Percentage of agent executions that fail
- **Coverage**: Percentage of business processes automated
- **ROI**: Cost saved vs. manual process time

---

> "Building custom agents transformed our agency. We went from 3-week client onboarding to 2-day deployments." - Agency Founder

> "The agent library is now our most valuable IP asset. We've closed 5-figure deals based on specialized agents alone." - Technical Founder
