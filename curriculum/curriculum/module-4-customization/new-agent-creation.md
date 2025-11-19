# Building Custom Agents from Scratch

## Overview

When duplication isn't enough, build agents from scratch. This guide walks through creating production-ready custom agents with TypeScript, proper error handling, testing, and integration with the Workstation orchestrator.

**Time Investment**: 3-4 hours for first agent, 1-2 hours for subsequent agents

## When to Build from Scratch

### Build New Agent When:

- **Unique Capability**: WebSocket server, ML model inference, blockchain interaction
- **Complex State**: Multi-step protocols requiring persistent state management
- **Performance Critical**: Specialized optimizations needed
- **Third-Party Integration**: Wrapping external SDK with specific patterns

### Duplicate Instead When:

- Similar to existing agent (80%+ overlap)
- Minor configuration changes
- Same execution pattern, different endpoints

## Agent Architecture

### Core Interface

All agents must implement this contract:

```typescript
// src/automation/agents/types.ts
export interface Agent {
  // Identity
  type: string;              // Unique identifier (e.g., 'email', 'crm', 'slack')
  name: string;              // Human-readable name
  version: string;           // Semantic version
  
  // Capabilities
  actions: AgentAction[];    // Available actions
  
  // Lifecycle
  initialize?(): Promise<void>;     // Setup resources
  cleanup?(): Promise<void>;        // Teardown resources
  
  // Execution
  execute(action: string, params: Record<string, unknown>): Promise<AgentResponse>;
}

export interface AgentAction {
  name: string;                    // Action identifier
  description: string;             // What it does
  parameters: ParameterDef[];      // Expected inputs
  returns: ReturnTypeDef;          // Output structure
}

export interface AgentResponse {
  success: boolean;
  data?: unknown;
  error?: string;
  retryable?: boolean;
  metadata?: Record<string, unknown>;
}

export interface ParameterDef {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  description: string;
  default?: unknown;
}
```

## Example 1: Email Agent (Complete Implementation)

### File Structure

```
src/automation/agents/custom/
├── email/
│   ├── index.ts          # Main agent class
│   ├── types.ts          # Type definitions
│   ├── providers/
│   │   ├── sendgrid.ts   # SendGrid implementation
│   │   └── mailgun.ts    # Mailgun implementation
│   └── templates/
│       └── default.html  # Email templates
```

### Step 1: Define Types

```typescript
// src/automation/agents/custom/email/types.ts

export interface EmailAgentConfig {
  provider: 'sendgrid' | 'mailgun';
  apiKey: string;
  defaultFrom: string;
  defaultReplyTo?: string;
  testMode?: boolean;
}

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  body: string;
  html?: string;
  from?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: Attachment[];
  templateId?: string;
  templateData?: Record<string, unknown>;
}

export interface Attachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
}

export interface EmailResult {
  messageId: string;
  status: 'sent' | 'queued' | 'failed';
  timestamp: Date;
  provider: string;
}

export interface TrackingData {
  opens: number;
  clicks: number;
  lastOpened?: Date;
  lastClicked?: Date;
  clickedLinks?: string[];
}
```

### Step 2: Implement Main Agent Class

```typescript
// src/automation/agents/custom/email/index.ts

import { Agent, AgentAction, AgentResponse } from '../../types';
import { SendGridProvider } from './providers/sendgrid';
import { MailgunProvider } from './providers/mailgun';
import { EmailAgentConfig, SendEmailParams, EmailResult } from './types';
import { logger } from '../../../utils/logger';
import Joi from 'joi';

export class EmailAgent implements Agent {
  type = 'email';
  name = 'Email Agent';
  version = '1.0.0';
  
  actions: AgentAction[] = [
    {
      name: 'sendEmail',
      description: 'Send an email via configured provider',
      parameters: [
        { name: 'to', type: 'string', required: true, description: 'Recipient email(s)' },
        { name: 'subject', type: 'string', required: true, description: 'Email subject' },
        { name: 'body', type: 'string', required: true, description: 'Email body (text)' },
        { name: 'html', type: 'string', required: false, description: 'HTML body' },
        { name: 'from', type: 'string', required: false, description: 'Sender email' },
        { name: 'attachments', type: 'array', required: false, description: 'File attachments' }
      ],
      returns: {
        type: 'object',
        description: 'Email send result with message ID and status'
      }
    },
    {
      name: 'sendBulk',
      description: 'Send emails to multiple recipients',
      parameters: [
        { name: 'recipients', type: 'array', required: true, description: 'Array of email params' }
      ],
      returns: {
        type: 'object',
        description: 'Bulk send results'
      }
    },
    {
      name: 'getTracking',
      description: 'Get tracking data for sent email',
      parameters: [
        { name: 'messageId', type: 'string', required: true, description: 'Message ID from send' }
      ],
      returns: {
        type: 'object',
        description: 'Opens, clicks, and engagement data'
      }
    }
  ];
  
  private provider: SendGridProvider | MailgunProvider;
  private config: EmailAgentConfig;
  
  constructor(config: EmailAgentConfig) {
    this.config = config;
    
    // Validate configuration
    const schema = Joi.object({
      provider: Joi.string().valid('sendgrid', 'mailgun').required(),
      apiKey: Joi.string().required(),
      defaultFrom: Joi.string().email().required(),
      defaultReplyTo: Joi.string().email(),
      testMode: Joi.boolean()
    });
    
    const { error } = schema.validate(config);
    if (error) {
      throw new Error(`Invalid email agent configuration: ${error.message}`);
    }
    
    // Initialize provider
    this.provider = this.createProvider();
    
    logger.info('Email agent created', { provider: config.provider });
  }
  
  async initialize(): Promise<void> {
    // Verify API credentials
    try {
      await this.provider.verify();
      logger.info('Email agent initialized successfully');
    } catch (error) {
      logger.error('Email agent initialization failed', { error });
      throw new Error('Failed to verify email provider credentials');
    }
  }
  
  async cleanup(): Promise<void> {
    // No persistent connections to close
    logger.info('Email agent cleaned up');
  }
  
  async execute(action: string, params: Record<string, unknown>): Promise<AgentResponse> {
    try {
      switch (action) {
        case 'sendEmail':
          return await this.sendEmail(params as SendEmailParams);
          
        case 'sendBulk':
          return await this.sendBulk(params.recipients as SendEmailParams[]);
          
        case 'getTracking':
          return await this.getTracking(params.messageId as string);
          
        default:
          return {
            success: false,
            error: `Unknown action: ${action}`,
            retryable: false
          };
      }
    } catch (error) {
      logger.error('Email agent action failed', { action, error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        retryable: this.isRetryable(error),
        metadata: { action, timestamp: new Date() }
      };
    }
  }
  
  /**
   * Send single email
   */
  private async sendEmail(params: SendEmailParams): Promise<AgentResponse> {
    // Validate parameters
    const schema = Joi.object({
      to: Joi.alternatives().try(
        Joi.string().email(),
        Joi.array().items(Joi.string().email())
      ).required(),
      subject: Joi.string().min(1).required(),
      body: Joi.string().min(1).required(),
      html: Joi.string(),
      from: Joi.string().email(),
      replyTo: Joi.string().email(),
      cc: Joi.array().items(Joi.string().email()),
      bcc: Joi.array().items(Joi.string().email()),
      attachments: Joi.array().items(Joi.object())
    });
    
    const { error, value } = schema.validate(params);
    if (error) {
      return {
        success: false,
        error: `Invalid parameters: ${error.message}`,
        retryable: false
      };
    }
    
    // Use defaults if not provided
    const emailParams: SendEmailParams = {
      ...value,
      from: value.from || this.config.defaultFrom,
      replyTo: value.replyTo || this.config.defaultReplyTo
    };
    
    // Send via provider
    const result = await this.provider.send(emailParams);
    
    logger.info('Email sent', {
      to: emailParams.to,
      subject: emailParams.subject,
      messageId: result.messageId
    });
    
    return {
      success: true,
      data: result,
      metadata: {
        provider: this.config.provider,
        testMode: this.config.testMode
      }
    };
  }
  
  /**
   * Send bulk emails
   */
  private async sendBulk(recipients: SendEmailParams[]): Promise<AgentResponse> {
    const results: EmailResult[] = [];
    const errors: Array<{ index: number; error: string }> = [];
    
    for (let i = 0; i < recipients.length; i++) {
      try {
        const response = await this.sendEmail(recipients[i]);
        if (response.success) {
          results.push(response.data as EmailResult);
        } else {
          errors.push({ index: i, error: response.error! });
        }
        
        // Rate limiting: wait 100ms between sends
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        errors.push({
          index: i,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    logger.info('Bulk emails sent', {
      total: recipients.length,
      successful: results.length,
      failed: errors.length
    });
    
    return {
      success: errors.length === 0,
      data: {
        results,
        errors,
        summary: {
          total: recipients.length,
          sent: results.length,
          failed: errors.length
        }
      }
    };
  }
  
  /**
   * Get tracking data for sent email
   */
  private async getTracking(messageId: string): Promise<AgentResponse> {
    const tracking = await this.provider.getTracking(messageId);
    
    return {
      success: true,
      data: tracking
    };
  }
  
  /**
   * Create provider instance based on configuration
   */
  private createProvider(): SendGridProvider | MailgunProvider {
    switch (this.config.provider) {
      case 'sendgrid':
        return new SendGridProvider({
          apiKey: this.config.apiKey,
          testMode: this.config.testMode
        });
        
      case 'mailgun':
        return new MailgunProvider({
          apiKey: this.config.apiKey,
          testMode: this.config.testMode
        });
        
      default:
        throw new Error(`Unknown provider: ${this.config.provider}`);
    }
  }
  
  /**
   * Determine if error is retryable
   */
  private isRetryable(error: unknown): boolean {
    if (error instanceof Error) {
      // Rate limit errors are retryable
      if (error.message.includes('rate limit') || error.message.includes('429')) {
        return true;
      }
      
      // Network errors are retryable
      if (error.message.includes('ECONNRESET') || error.message.includes('ETIMEDOUT')) {
        return true;
      }
      
      // Invalid email addresses are not retryable
      if (error.message.includes('invalid email')) {
        return false;
      }
    }
    
    // Default: not retryable
    return false;
  }
}
```

### Step 3: Implement Provider

```typescript
// src/automation/agents/custom/email/providers/sendgrid.ts

import sendgrid from '@sendgrid/mail';
import { SendEmailParams, EmailResult, TrackingData } from '../types';

export interface SendGridConfig {
  apiKey: string;
  testMode?: boolean;
}

export class SendGridProvider {
  private config: SendGridConfig;
  
  constructor(config: SendGridConfig) {
    this.config = config;
    sendgrid.setApiKey(config.apiKey);
  }
  
  async verify(): Promise<void> {
    // Test API key by sending test request
    try {
      await sendgrid.send({
        to: 'test@example.com',
        from: 'test@example.com',
        subject: 'Test',
        text: 'Test',
        mailSettings: {
          sandboxMode: { enable: true }
        }
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Unauthorized')) {
        throw new Error('Invalid SendGrid API key');
      }
      // Other errors during verification are acceptable
    }
  }
  
  async send(params: SendEmailParams): Promise<EmailResult> {
    const msg: sendgrid.MailDataRequired = {
      to: params.to,
      from: params.from!,
      subject: params.subject,
      text: params.body,
      html: params.html,
      replyTo: params.replyTo,
      cc: params.cc,
      bcc: params.bcc
    };
    
    // Add sandbox mode if test mode
    if (this.config.testMode) {
      msg.mailSettings = {
        sandboxMode: { enable: true }
      };
    }
    
    // Add attachments if present
    if (params.attachments) {
      msg.attachments = params.attachments.map(att => ({
        filename: att.filename,
        content: Buffer.isBuffer(att.content) 
          ? att.content.toString('base64')
          : att.content,
        type: att.contentType,
        disposition: 'attachment'
      }));
    }
    
    const response = await sendgrid.send(msg);
    const messageId = response[0].headers['x-message-id'] as string;
    
    return {
      messageId,
      status: 'sent',
      timestamp: new Date(),
      provider: 'sendgrid'
    };
  }
  
  async getTracking(messageId: string): Promise<TrackingData> {
    // Use SendGrid API to get email stats
    // This is a simplified example
    return {
      opens: 0,
      clicks: 0,
      lastOpened: undefined,
      lastClicked: undefined
    };
  }
}
```

### Step 4: Register with Agent Registry

```typescript
// src/automation/agents/core/registry.ts

import { EmailAgent } from '../custom/email';

export class AgentRegistry {
  private registerDefaultAgents(): void {
    // ... existing agents
    
    // Email agent
    this.registerCapability({
      agent_type: 'email',
      actions: ['sendEmail', 'sendBulk', 'getTracking'],
      description: 'Email sending and tracking via SendGrid/Mailgun'
    });
  }
  
  async getAgent(agentType: string, action: string): Promise<AgentAction | null> {
    // ... existing agent handling
    
    if (agentType === 'email') {
      const emailAgent = new EmailAgent({
        provider: (process.env.EMAIL_PROVIDER as 'sendgrid' | 'mailgun') || 'sendgrid',
        apiKey: process.env.EMAIL_API_KEY!,
        defaultFrom: process.env.EMAIL_FROM!,
        defaultReplyTo: process.env.EMAIL_REPLY_TO,
        testMode: process.env.NODE_ENV !== 'production'
      });
      
      await emailAgent.initialize();
      
      const actionWrapper: AgentAction = {
        execute: async (params: Record<string, unknown>) => {
          return await emailAgent.execute(action, params);
        }
      };
      
      this.agents.set(`${agentType}:${action}`, actionWrapper);
      return actionWrapper;
    }
    
    return null;
  }
}
```

### Step 5: Add Environment Configuration

```bash
# .env
EMAIL_PROVIDER=sendgrid
EMAIL_API_KEY=SG.your_sendgrid_api_key
EMAIL_FROM=noreply@yourdomain.com
EMAIL_REPLY_TO=support@yourdomain.com
```

### Step 6: Create Tests

```typescript
// tests/agents/custom/email.test.ts

import { EmailAgent } from '../../../src/automation/agents/custom/email';

describe('EmailAgent', () => {
  let agent: EmailAgent;
  
  beforeEach(async () => {
    agent = new EmailAgent({
      provider: 'sendgrid',
      apiKey: process.env.EMAIL_API_KEY!,
      defaultFrom: 'test@example.com',
      testMode: true
    });
    await agent.initialize();
  });
  
  afterEach(async () => {
    await agent.cleanup();
  });
  
  describe('sendEmail', () => {
    it('should send email with valid parameters', async () => {
      const result = await agent.execute('sendEmail', {
        to: 'recipient@example.com',
        subject: 'Test Email',
        body: 'This is a test email'
      });
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('messageId');
      expect(result.data).toHaveProperty('status', 'sent');
    });
    
    it('should reject invalid email address', async () => {
      const result = await agent.execute('sendEmail', {
        to: 'invalid-email',
        subject: 'Test',
        body: 'Test'
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid parameters');
      expect(result.retryable).toBe(false);
    });
    
    it('should use default from address', async () => {
      const result = await agent.execute('sendEmail', {
        to: 'recipient@example.com',
        subject: 'Test',
        body: 'Test'
      });
      
      expect(result.success).toBe(true);
      expect(result.metadata).toHaveProperty('provider', 'sendgrid');
    });
  });
  
  describe('sendBulk', () => {
    it('should send multiple emails', async () => {
      const recipients = [
        { to: 'user1@example.com', subject: 'Test 1', body: 'Body 1' },
        { to: 'user2@example.com', subject: 'Test 2', body: 'Body 2' },
        { to: 'user3@example.com', subject: 'Test 3', body: 'Body 3' }
      ];
      
      const result = await agent.execute('sendBulk', { recipients });
      
      expect(result.success).toBe(true);
      expect(result.data.summary.total).toBe(3);
      expect(result.data.summary.sent).toBe(3);
      expect(result.data.summary.failed).toBe(0);
    });
    
    it('should handle partial failures', async () => {
      const recipients = [
        { to: 'valid@example.com', subject: 'Test', body: 'Test' },
        { to: 'invalid-email', subject: 'Test', body: 'Test' }
      ];
      
      const result = await agent.execute('sendBulk', { recipients });
      
      expect(result.success).toBe(false);
      expect(result.data.summary.sent).toBe(1);
      expect(result.data.summary.failed).toBe(1);
      expect(result.data.errors).toHaveLength(1);
    });
  });
});
```

## Example 2: WebSocket Agent (Stateful)

```typescript
// src/automation/agents/custom/websocket/index.ts

import { Agent, AgentAction, AgentResponse } from '../../types';
import { WebSocket, WebSocketServer } from 'ws';
import { logger } from '../../../utils/logger';

export interface WebSocketAgentConfig {
  port?: number;
  path?: string;
  heartbeatInterval?: number;
}

export class WebSocketAgent implements Agent {
  type = 'websocket';
  name = 'WebSocket Agent';
  version = '1.0.0';
  
  actions: AgentAction[] = [
    {
      name: 'startServer',
      description: 'Start WebSocket server',
      parameters: [],
      returns: { type: 'object', description: 'Server info' }
    },
    {
      name: 'broadcast',
      description: 'Broadcast message to all clients',
      parameters: [
        { name: 'message', type: 'string', required: true, description: 'Message to send' }
      ],
      returns: { type: 'object', description: 'Broadcast result' }
    },
    {
      name: 'sendToClient',
      description: 'Send message to specific client',
      parameters: [
        { name: 'clientId', type: 'string', required: true, description: 'Client ID' },
        { name: 'message', type: 'string', required: true, description: 'Message to send' }
      ],
      returns: { type: 'object', description: 'Send result' }
    }
  ];
  
  private server?: WebSocketServer;
  private clients: Map<string, WebSocket> = new Map();
  private config: WebSocketAgentConfig;
  
  constructor(config: WebSocketAgentConfig = {}) {
    this.config = {
      port: config.port || 8080,
      path: config.path || '/ws',
      heartbeatInterval: config.heartbeatInterval || 30000
    };
  }
  
  async initialize(): Promise<void> {
    // Server started on demand via startServer action
    logger.info('WebSocket agent initialized');
  }
  
  async cleanup(): Promise<void> {
    if (this.server) {
      this.server.close();
      this.clients.clear();
      logger.info('WebSocket server closed');
    }
  }
  
  async execute(action: string, params: Record<string, unknown>): Promise<AgentResponse> {
    try {
      switch (action) {
        case 'startServer':
          return await this.startServer();
          
        case 'broadcast':
          return await this.broadcast(params.message as string);
          
        case 'sendToClient':
          return await this.sendToClient(
            params.clientId as string,
            params.message as string
          );
          
        default:
          return { success: false, error: `Unknown action: ${action}` };
      }
    } catch (error) {
      logger.error('WebSocket agent error', { action, error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  private async startServer(): Promise<AgentResponse> {
    if (this.server) {
      return { success: false, error: 'Server already running' };
    }
    
    this.server = new WebSocketServer({
      port: this.config.port,
      path: this.config.path
    });
    
    this.server.on('connection', (ws: WebSocket, req) => {
      const clientId = this.generateClientId();
      this.clients.set(clientId, ws);
      
      logger.info('Client connected', { clientId, ip: req.socket.remoteAddress });
      
      ws.on('message', (data) => {
        logger.info('Message received', { clientId, data: data.toString() });
      });
      
      ws.on('close', () => {
        this.clients.delete(clientId);
        logger.info('Client disconnected', { clientId });
      });
      
      // Send client their ID
      ws.send(JSON.stringify({ type: 'connected', clientId }));
    });
    
    logger.info('WebSocket server started', {
      port: this.config.port,
      path: this.config.path
    });
    
    return {
      success: true,
      data: {
        port: this.config.port,
        path: this.config.path,
        url: `ws://localhost:${this.config.port}${this.config.path}`
      }
    };
  }
  
  private async broadcast(message: string): Promise<AgentResponse> {
    if (!this.server) {
      return { success: false, error: 'Server not started' };
    }
    
    let sent = 0;
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
        sent++;
      }
    });
    
    logger.info('Message broadcasted', { sent, total: this.clients.size });
    
    return {
      success: true,
      data: { sent, total: this.clients.size }
    };
  }
  
  private async sendToClient(clientId: string, message: string): Promise<AgentResponse> {
    const client = this.clients.get(clientId);
    
    if (!client) {
      return { success: false, error: 'Client not found' };
    }
    
    if (client.readyState !== WebSocket.OPEN) {
      return { success: false, error: 'Client not connected' };
    }
    
    client.send(message);
    
    return { success: true, data: { clientId, sent: true } };
  }
  
  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

## Best Practices Checklist

### Design
- [ ] Define clear interface with strong types
- [ ] Document all actions with JSDoc
- [ ] Handle errors gracefully
- [ ] Support retryable operations
- [ ] Validate all inputs

### Implementation
- [ ] Use TypeScript strict mode
- [ ] Implement proper initialization/cleanup
- [ ] Add comprehensive logging
- [ ] Handle edge cases
- [ ] Follow repository patterns

### Testing
- [ ] Unit tests for all actions
- [ ] Integration tests with workflows
- [ ] Error scenario coverage
- [ ] Performance tests for critical paths

### Documentation
- [ ] README with examples
- [ ] Configuration guide
- [ ] Troubleshooting section
- [ ] API reference

## Next Steps

- [prompt-engineering.md](./prompt-engineering.md) - Design effective prompts
- [external-integration-patterns.md](./external-integration-patterns.md) - Connect external systems
- [playbook-structure.md](./playbook-structure.md) - Create reusable workflows

---

> "Building our CRM agent from scratch took 4 hours. It's been running in production for 6 months without issues." - Platform Engineer
