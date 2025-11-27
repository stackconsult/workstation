# Creating Custom Agents Guide

## Overview

This guide will walk you through creating custom agents for the Workstation automation system. Agents are modular components that perform specific actions within workflows. By creating custom agents, you can extend the platform's capabilities to meet your specific automation needs.

## Agent Architecture

### What is an Agent?

An agent is a TypeScript class that implements specific actions and integrates with the agent registry. Each agent:

- Implements a standard interface with action methods
- Registers itself with the agent registry
- Handles errors gracefully
- Returns standardized results
- Supports parameterized actions

### Agent Types

The system supports several agent categories:

1. **Browser Agents** - Web automation (navigate, click, extract)
2. **Data Agents** - Data processing (CSV, JSON, Excel, PDF)
3. **Integration Agents** - External service integration (Google Sheets, Calendar, Email)
4. **Storage Agents** - Data persistence (Database, S3, File system)
5. **Custom Agents** - Your domain-specific automation

## Creating Your First Custom Agent

### Step 1: Agent File Structure

Create a new file in the appropriate directory:

```
src/automation/agents/
├── browser/         # Browser automation agents
├── data/           # Data processing agents
├── integration/    # External service agents
├── storage/        # Storage and persistence agents
└── custom/         # Your custom agents (create this folder)
```

Example: `src/automation/agents/custom/slack.ts`

### Step 2: Define the Agent Class

```typescript
import { ErrorHandler, ErrorCategory } from '../../../utils/error-handler';

interface SlackMessage {
  channel: string;
  text: string;
  username?: string;
  icon_emoji?: string;
}

interface SlackResponse {
  ok: boolean;
  channel?: string;
  ts?: string;
  error?: string;
}

export class SlackAgent {
  private webhookUrl: string;
  private defaultChannel: string;

  constructor(config?: { webhookUrl?: string; defaultChannel?: string }) {
    this.webhookUrl = config?.webhookUrl || process.env.SLACK_WEBHOOK_URL || '';
    this.defaultChannel = config?.defaultChannel || '#general';
  }

  /**
   * Send a message to a Slack channel
   */
  async sendMessage(params: {
    channel?: string;
    text: string;
    username?: string;
    icon_emoji?: string;
  }): Promise<SlackResponse> {
    // Validate webhook URL
    if (!this.webhookUrl) {
      throw ErrorHandler.validationError(
        'Slack webhook URL not configured',
        'webhookUrl'
      );
    }

    // Validate message text
    if (!params.text || params.text.trim() === '') {
      throw ErrorHandler.validationError(
        'Message text is required',
        'text',
        params.text
      );
    }

    const message: SlackMessage = {
      channel: params.channel || this.defaultChannel,
      text: params.text,
      username: params.username,
      icon_emoji: params.icon_emoji,
    };

    // Send message with retry and timeout
    return await ErrorHandler.withRetry(
      () => ErrorHandler.withTimeout(
        async () => {
          const response = await fetch(this.webhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(message),
          });

          if (!response.ok) {
            throw ErrorHandler.networkError(
              `Slack API error: ${response.status}`,
              this.webhookUrl
            );
          }

          const data = await response.json();
          return data;
        },
        10000 // 10 second timeout
      ),
      {
        maxRetries: 3,
        delayMs: 1000,
        backoffMultiplier: 2,
        retryableErrors: [ErrorCategory.NETWORK, ErrorCategory.TIMEOUT],
      }
    );
  }

  /**
   * Send a notification with formatting
   */
  async sendNotification(params: {
    title: string;
    message: string;
    level?: 'info' | 'warning' | 'error' | 'success';
    channel?: string;
  }): Promise<SlackResponse> {
    const icons = {
      info: ':information_source:',
      warning: ':warning:',
      error: ':x:',
      success: ':white_check_mark:',
    };

    const level = params.level || 'info';
    const text = `${icons[level]} *${params.title}*\n${params.message}`;

    return this.sendMessage({
      channel: params.channel,
      text,
    });
  }

  /**
   * Get agent information
   */
  getInfo(): { name: string; version: string; capabilities: string[] } {
    return {
      name: 'Slack Agent',
      version: '1.0.0',
      capabilities: ['sendMessage', 'sendNotification'],
    };
  }
}

// Export agent instance
export const slackAgent = new SlackAgent();
```

### Step 3: Register the Agent

Create or update `src/automation/agents/custom/index.ts`:

```typescript
import { slackAgent } from './slack';

export const customAgents = {
  slack: slackAgent,
};

export * from './slack';
```

### Step 4: Wire to Agent Registry

Update `src/automation/agents/index.ts`:

```typescript
import { customAgents } from './custom';

export const agentRegistry = {
  browser: browserAgent,
  storage: storageAgent,
  email: emailAgent,
  rss: rssAgent,
  csv: csvAgent,
  json: jsonAgent,
  excel: excelAgent,
  pdf: pdfAgent,
  sheets: sheetsAgent,
  calendar: calendarAgent,
  database: databaseAgent,
  s3: s3Agent,
  file: fileAgent,
  // Add custom agents
  ...customAgents,
};
```

### Step 5: Create Unit Tests

Create `tests/agents/custom/slack.test.ts`:

```typescript
import { SlackAgent } from '../../../src/automation/agents/custom/slack';

describe('SlackAgent', () => {
  let agent: SlackAgent;

  beforeEach(() => {
    agent = new SlackAgent({
      webhookUrl: 'https://hooks.slack.com/services/TEST/TEST/TEST',
      defaultChannel: '#test',
    });
  });

  describe('sendMessage', () => {
    it('should send a message successfully', async () => {
      // Mock fetch
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ ok: true, channel: '#test', ts: '1234567890.123456' }),
      });

      const result = await agent.sendMessage({
        text: 'Test message',
      });

      expect(result.ok).toBe(true);
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('should throw validation error for empty text', async () => {
      await expect(
        agent.sendMessage({ text: '' })
      ).rejects.toThrow('Message text is required');
    });

    it('should throw error if webhook URL not configured', async () => {
      const agentWithoutUrl = new SlackAgent({ webhookUrl: '' });
      await expect(
        agentWithoutUrl.sendMessage({ text: 'Test' })
      ).rejects.toThrow('Slack webhook URL not configured');
    });
  });

  describe('sendNotification', () => {
    it('should send formatted notification', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ ok: true }),
      });

      const result = await agent.sendNotification({
        title: 'Test Alert',
        message: 'This is a test',
        level: 'info',
      });

      expect(result.ok).toBe(true);
    });
  });

  describe('getInfo', () => {
    it('should return agent information', () => {
      const info = agent.getInfo();
      expect(info.name).toBe('Slack Agent');
      expect(info.capabilities).toContain('sendMessage');
    });
  });
});
```

## Best Practices

### 1. Error Handling

Always use the ErrorHandler utility for consistent error handling:

```typescript
import { ErrorHandler, ErrorCategory } from '../../../utils/error-handler';

// Validation errors
if (!param) {
  throw ErrorHandler.validationError('Parameter required', 'param');
}

// Network errors with retry
await ErrorHandler.withRetry(
  () => ErrorHandler.withTimeout(
    async () => {
      // API call here
    },
    5000 // timeout
  ),
  {
    maxRetries: 3,
    retryableErrors: [ErrorCategory.NETWORK],
  }
);
```

### 2. Input Validation

Use the Validator utility for input validation:

```typescript
import { Validator } from '../../../utils/validation';
import Joi from 'joi';

const schema = Joi.object({
  message: Joi.string().required().min(1).max(1000),
  channel: Joi.string().optional(),
});

const validated = Validator.validateOrThrow(params, schema);
```

### 3. Configuration Management

Support both constructor config and environment variables:

```typescript
constructor(config?: Config) {
  this.apiKey = config?.apiKey || process.env.SERVICE_API_KEY || '';
  this.baseUrl = config?.baseUrl || process.env.SERVICE_URL || 'https://api.service.com';
}
```

### 4. TypeScript Types

Define clear interfaces for parameters and responses:

```typescript
interface ActionParams {
  required: string;
  optional?: number;
}

interface ActionResponse {
  success: boolean;
  data?: any;
  error?: string;
}
```

### 5. Health Checks

Register health checks for external dependencies:

```typescript
import { healthCheckManager } from '../../../utils/health-check';

healthCheckManager.register({
  name: 'slack-api',
  check: async () => {
    try {
      // Test API connectivity
      const response = await fetch(this.webhookUrl, { method: 'HEAD' });
      return {
        healthy: response.ok,
        message: response.ok ? 'Slack API accessible' : 'Slack API unreachable',
      };
    } catch (error) {
      return {
        healthy: false,
        message: `Slack API error: ${error.message}`,
      };
    }
  },
  critical: false,
  timeout: 5000,
});
```

### 6. Documentation

Document each method with JSDoc comments:

```typescript
/**
 * Send a message to a Slack channel
 * 
 * @param params - Message parameters
 * @param params.channel - Target channel (default: #general)
 * @param params.text - Message text (required)
 * @param params.username - Override username (optional)
 * @param params.icon_emoji - Override icon (optional)
 * @returns Promise<SlackResponse>
 * 
 * @example
 * ```typescript
 * const result = await slackAgent.sendMessage({
 *   channel: '#alerts',
 *   text: 'Deployment completed successfully',
 * });
 * ```
 */
async sendMessage(params: MessageParams): Promise<SlackResponse> {
  // Implementation
}
```

## Advanced Patterns

### 1. OAuth Authentication

For agents that require OAuth:

```typescript
import { google } from 'googleapis';

export class GoogleDriveAgent {
  private oauth2Client: any;

  async authenticate(credentials: {
    clientId: string;
    clientSecret: string;
    refreshToken: string;
  }): Promise<void> {
    this.oauth2Client = new google.auth.OAuth2(
      credentials.clientId,
      credentials.clientSecret,
      'http://localhost:3000/oauth/callback'
    );

    this.oauth2Client.setCredentials({
      refresh_token: credentials.refreshToken,
    });
  }

  async listFiles(): Promise<any> {
    if (!this.oauth2Client) {
      throw ErrorHandler.authenticationError('Not authenticated');
    }

    const drive = google.drive({ version: 'v3', auth: this.oauth2Client });
    const response = await drive.files.list({ pageSize: 10 });
    return response.data.files;
  }
}
```

### 2. Streaming Data

For agents that process streams:

```typescript
import { Readable } from 'stream';

export class StreamProcessorAgent {
  async processStream(
    input: Readable,
    processor: (chunk: Buffer) => Buffer
  ): Promise<Buffer[]> {
    const chunks: Buffer[] = [];

    return new Promise((resolve, reject) => {
      input.on('data', (chunk) => {
        try {
          const processed = processor(chunk);
          chunks.push(processed);
        } catch (error) {
          reject(error);
        }
      });

      input.on('end', () => resolve(chunks));
      input.on('error', (error) => reject(error));
    });
  }
}
```

### 3. Rate Limiting

For agents calling rate-limited APIs:

```typescript
export class RateLimitedAgent {
  private lastCallTime = 0;
  private minInterval = 1000; // 1 second between calls

  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCallTime;

    if (timeSinceLastCall < this.minInterval) {
      await new Promise((resolve) =>
        setTimeout(resolve, this.minInterval - timeSinceLastCall)
      );
    }

    this.lastCallTime = Date.now();
  }

  async callApi(endpoint: string): Promise<any> {
    await this.rateLimit();
    // Make API call
  }
}
```

### 4. Batch Operations

For agents that support batch processing:

```typescript
export class BatchAgent {
  async processBatch<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    options?: {
      batchSize?: number;
      concurrency?: number;
    }
  ): Promise<R[]> {
    const batchSize = options?.batchSize || 10;
    const concurrency = options?.concurrency || 5;
    const results: R[] = [];

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map((item) => processor(item))
      );
      results.push(...batchResults);
    }

    return results;
  }
}
```

## Integration with Workflow Builder

### 1. Add Node Type

Update `public/workflow-builder.html` to add your agent as a node type:

```javascript
const nodeTypes = {
  // ... existing types
  slack: {
    name: 'Slack',
    category: 'integration',
    color: '#4A154B',
    icon: '💬',
    params: {
      action: {
        type: 'select',
        options: ['sendMessage', 'sendNotification'],
        default: 'sendMessage',
      },
      channel: {
        type: 'text',
        default: '#general',
      },
      text: {
        type: 'textarea',
        required: true,
      },
    },
  },
};
```

### 2. Add Node Type Converter

Update the node type converter:

```javascript
function convertNodeToTask(node) {
  const converters = {
    // ... existing converters
    slack: (node) => ({
      name: node.id,
      agent_type: 'slack',
      action: node.params.action || 'sendMessage',
      parameters: {
        channel: node.params.channel,
        text: node.params.text,
        title: node.params.title,
        level: node.params.level,
      },
    }),
  };

  return converters[node.type]?.(node) || null;
}
```

## Testing Your Agent

### 1. Unit Tests

Run unit tests:

```bash
npm test -- slack.test.ts
```

### 2. Integration Tests

Create integration tests that test the agent within a workflow:

```typescript
describe('Slack Agent Integration', () => {
  it('should execute in a workflow', async () => {
    const workflow = {
      name: 'Test Workflow',
      definition: {
        tasks: [
          {
            name: 'send-slack',
            agent_type: 'slack',
            action: 'sendMessage',
            parameters: {
              text: 'Test from workflow',
            },
          },
        ],
      },
    };

    const execution = await orchestrationEngine.executeWorkflow(workflow);
    expect(execution.status).toBe('completed');
  });
});
```

### 3. Manual Testing

Test your agent manually:

```typescript
import { slackAgent } from './src/automation/agents/custom/slack';

async function test() {
  const result = await slackAgent.sendMessage({
    channel: '#test',
    text: 'Hello from custom agent!',
  });
  console.log('Result:', result);
}

test().catch(console.error);
```

## Deployment Considerations

### 1. Environment Variables

Add required environment variables to `.env.example`:

```bash
# Slack Integration
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
SLACK_DEFAULT_CHANNEL=#general
```

### 2. Dependencies

Add required npm packages:

```bash
npm install @slack/web-api
```

Update `package.json` if needed.

### 3. Documentation

Update documentation files:
- `docs/AGENT_DOCUMENTATION.md` - Add agent capabilities
- `docs/WORKFLOW_EXAMPLES.md` - Add usage examples
- `IMPLEMENTATION_ROADMAP.md` - Update progress

## Common Pitfalls

### 1. ❌ Not Using Error Handlers

```typescript
// Bad
async function apiCall() {
  const response = await fetch(url);
  return response.json();
}

// Good
async function apiCall() {
  return await ErrorHandler.withRetry(
    () => ErrorHandler.withTimeout(
      async () => {
        const response = await fetch(url);
        if (!response.ok) throw ErrorHandler.networkError('API error');
        return response.json();
      },
      5000
    ),
    { maxRetries: 3 }
  );
}
```

### 2. ❌ Missing Input Validation

```typescript
// Bad
async function process(data: any) {
  return data.map(item => item.value);
}

// Good
import { Validator } from '../../../utils/validation';
import Joi from 'joi';

async function process(data: any) {
  const schema = Joi.array().items(
    Joi.object({
      value: Joi.string().required(),
    })
  );
  const validated = Validator.validateOrThrow(data, schema);
  return validated.map(item => item.value);
}
```

### 3. ❌ Hardcoded Configuration

```typescript
// Bad
const API_KEY = 'hardcoded-key';

// Good
const API_KEY = process.env.SERVICE_API_KEY || '';
if (!API_KEY) {
  throw ErrorHandler.configurationError('API key not configured');
}
```

## Resources

- [Agent Registry Documentation](../AGENT_DOCUMENTATION.md)
- [Error Handling Utilities](../ERROR_HANDLING_README.md)
- [Workflow Examples](../WORKFLOW_EXAMPLES.md)
- [Orchestration Guide](../ORCHESTRATION.md)

## Next Steps

1. Review existing agents in `src/automation/agents/` for patterns
2. Create your custom agent following this guide
3. Write comprehensive unit tests
4. Add integration tests
5. Update documentation
6. Submit a pull request

## Support

For questions or issues:
- Review existing agents for examples
- Check the troubleshooting guide: `docs/TROUBLESHOOTING.md`
- Open an issue on GitHub
