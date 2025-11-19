# External Agent Integration: Third-Party API Patterns

## Table of Contents
- [Introduction](#introduction)
- [Integration Architecture](#integration-architecture)
- [Adapter Pattern Implementation](#adapter-pattern-implementation)
- [Webhook Handlers](#webhook-handlers)
- [API Client Patterns](#api-client-patterns)
- [Authentication Strategies](#authentication-strategies)
- [Error Handling and Retries](#error-handling-and-retries)
- [Real-World Integration Examples](#real-world-integration-examples)
- [Business Value](#business-value)

## Introduction

External Agent Integration enables the Workstation system to communicate with third-party services like Slack, CRMs, webhooks, and custom APIs. This transforms browser automation from isolated tasks into complete business workflows that span multiple systems.

**Integration Capabilities:**
- **Webhooks**: POST results to external endpoints
- **Slack**: Send notifications, alerts, and reports
- **GitHub API**: Automate repository operations
- **CRM Integration**: Salesforce, HubSpot, Pipedrive
- **Custom APIs**: Any REST/GraphQL endpoint

**Business Context**: For agencies, integrations are upsell opportunities. Base automation: $500/month. With Slack integration: $750/month. With CRM integration: $1,200/month. Same backend, different connectors.

## Integration Architecture

### Layered Integration Design

```
┌─────────────────────────────────────────────────────────┐
│              Workstation Orchestrator                   │
│         (Workflow Execution & State Management)         │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ Agent API
                     │
┌────────────────────▼────────────────────────────────────┐
│              Integration Agent Layer                     │
│  ┌─────────────┬──────────────┬──────────────────────┐ │
│  │ Webhook     │ Slack        │ API Client           │ │
│  │ Agent       │ Agent        │ Agent (Generic)      │ │
│  └──────┬──────┴──────┬───────┴──────┬───────────────┘ │
└─────────┼─────────────┼──────────────┼─────────────────┘
          │             │              │
┌─────────▼─────────────▼──────────────▼─────────────────┐
│              Adapter Layer                              │
│  ┌──────────────┬───────────────┬───────────────────┐  │
│  │ HTTP Adapter │ Slack SDK     │ Auth Adapter      │  │
│  │ (axios)      │ (@slack/...)  │ (OAuth, API Key)  │  │
│  └──────────────┴───────────────┴───────────────────┘  │
└─────────────────────────────────────────────────────────┘
          │             │              │
          │             │              │ HTTPS
          │             │              │
┌─────────▼─────────────▼──────────────▼─────────────────┐
│              External Services                           │
│  • Slack Workspace                                      │
│  • Custom Webhooks                                      │
│  • Salesforce CRM                                       │
│  • GitHub API                                           │
│  • Any REST/GraphQL API                                 │
└─────────────────────────────────────────────────────────┘
```

### Integration Agent Interface

```typescript
/**
 * Base Integration Agent Interface
 * 
 * All external integration agents implement this interface.
 */
export interface IntegrationAgent {
  /** Agent identifier */
  id: number;
  
  /** Agent name */
  name: string;
  
  /** Integration type */
  type: 'webhook' | 'slack' | 'api' | 'custom';
  
  /**
   * Execute integration action
   * 
   * @param action - Action to perform (e.g., 'send_message', 'post_data')
   * @param payload - Data to send
   * @param config - Integration-specific configuration
   * @returns Result of the integration
   */
  execute(
    action: string,
    payload: Record<string, unknown>,
    config?: Record<string, unknown>
  ): Promise<IntegrationResult>;
  
  /**
   * Validate configuration
   * 
   * @param config - Configuration to validate
   * @returns True if valid, throws error otherwise
   */
  validateConfig(config: Record<string, unknown>): boolean;
  
  /**
   * Test connection
   * 
   * @returns True if connection successful
   */
  testConnection(): Promise<boolean>;
}

export interface IntegrationResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
  metadata?: {
    requestId?: string;
    timestamp: Date;
    duration: number;
    retryCount?: number;
  };
}
```

## Adapter Pattern Implementation

### Generic HTTP Adapter

```typescript
// src/automation/adapters/HttpAdapter.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { logger } from '../../utils/logger';

export interface HttpAdapterConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
  auth?: {
    type: 'bearer' | 'basic' | 'apikey';
    credentials: Record<string, string>;
  };
  retries?: number;
  retryDelay?: number;
}

export class HttpAdapter {
  private client: AxiosInstance;
  private config: HttpAdapterConfig;
  
  constructor(config: HttpAdapterConfig) {
    this.config = config;
    
    // Create axios instance with default config
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers
      }
    });
    
    // Add authentication interceptor
    this.client.interceptors.request.use(
      (request) => this.addAuthentication(request)
    );
    
    // Add response interceptor for logging
    this.client.interceptors.response.use(
      (response) => this.logResponse(response),
      (error) => this.handleError(error)
    );
  }
  
  /**
   * Add authentication to request
   */
  private addAuthentication(config: AxiosRequestConfig): AxiosRequestConfig {
    const { auth } = this.config;
    if (!auth) return config;
    
    switch (auth.type) {
      case 'bearer':
        config.headers!.Authorization = `Bearer ${auth.credentials.token}`;
        break;
        
      case 'basic':
        const basicAuth = Buffer.from(
          `${auth.credentials.username}:${auth.credentials.password}`
        ).toString('base64');
        config.headers!.Authorization = `Basic ${basicAuth}`;
        break;
        
      case 'apikey':
        const { header, key } = auth.credentials;
        config.headers![header || 'X-API-Key'] = key;
        break;
    }
    
    return config;
  }
  
  /**
   * Log successful response
   */
  private logResponse(response: AxiosResponse): AxiosResponse {
    logger.info('HTTP request successful', {
      method: response.config.method,
      url: response.config.url,
      status: response.status,
      duration: response.config.headers?.['X-Request-Duration']
    });
    return response;
  }
  
  /**
   * Handle HTTP errors with retry logic
   */
  private async handleError(error: any): Promise<never> {
    if (error.response) {
      // Server responded with error status
      logger.error('HTTP request failed', {
        method: error.config.method,
        url: error.config.url,
        status: error.response.status,
        data: error.response.data
      });
    } else if (error.request) {
      // No response received
      logger.error('HTTP request timeout', {
        method: error.config.method,
        url: error.config.url
      });
    } else {
      // Request setup error
      logger.error('HTTP request error', {
        message: error.message
      });
    }
    
    throw error;
  }
  
  /**
   * Execute HTTP GET request
   */
  async get<T = any>(path: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.executeWithRetry(() => 
      this.client.get<T>(path, config)
    );
    return response.data;
  }
  
  /**
   * Execute HTTP POST request
   */
  async post<T = any>(
    path: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.executeWithRetry(() =>
      this.client.post<T>(path, data, config)
    );
    return response.data;
  }
  
  /**
   * Execute HTTP PUT request
   */
  async put<T = any>(
    path: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.executeWithRetry(() =>
      this.client.put<T>(path, data, config)
    );
    return response.data;
  }
  
  /**
   * Execute HTTP DELETE request
   */
  async delete<T = any>(path: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.executeWithRetry(() =>
      this.client.delete<T>(path, config)
    );
    return response.data;
  }
  
  /**
   * Execute request with automatic retry
   */
  private async executeWithRetry<T>(
    requestFn: () => Promise<AxiosResponse<T>>
  ): Promise<AxiosResponse<T>> {
    const maxRetries = this.config.retries || 3;
    const retryDelay = this.config.retryDelay || 1000;
    let attempt = 0;
    
    while (attempt < maxRetries) {
      try {
        return await requestFn();
      } catch (error: any) {
        attempt++;
        
        // Don't retry on 4xx errors (client errors)
        if (error.response && error.response.status >= 400 && error.response.status < 500) {
          throw error;
        }
        
        // Retry on 5xx errors (server errors) and network errors
        if (attempt < maxRetries) {
          const delay = retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
          logger.warn(`Retrying request (attempt ${attempt}/${maxRetries}) in ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          throw error;
        }
      }
    }
    
    throw new Error('Max retries exceeded');
  }
  
  /**
   * Test connection to API
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.get('/');
      return true;
    } catch (error) {
      logger.error('Connection test failed', { error });
      return false;
    }
  }
}
```

**Business Context**: Generic HTTP adapter means you can integrate any REST API in minutes. Client asks "Can you send data to our custom CRM?" → Yes, 30 minutes to configure.

## Webhook Handlers

### Webhook Agent Implementation

```typescript
// src/automation/agents/WebhookAgent.ts
import { HttpAdapter, HttpAdapterConfig } from '../adapters/HttpAdapter';
import type { IntegrationAgent, IntegrationResult } from '../../types';

export interface WebhookConfig extends HttpAdapterConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH';
  transformPayload?: (data: Record<string, unknown>) => Record<string, unknown>;
}

export class WebhookAgent implements IntegrationAgent {
  readonly id: number;
  readonly name: string;
  readonly type = 'webhook' as const;
  
  private adapter: HttpAdapter;
  private config: WebhookConfig;
  
  constructor(id: number, name: string, config: WebhookConfig) {
    this.id = id;
    this.name = name;
    this.config = config;
    this.adapter = new HttpAdapter(config);
  }
  
  async execute(
    action: string,
    payload: Record<string, unknown>,
    config?: Record<string, unknown>
  ): Promise<IntegrationResult> {
    const startTime = Date.now();
    
    try {
      // Transform payload if transformer provided
      const transformedPayload = this.config.transformPayload
        ? this.config.transformPayload(payload)
        : payload;
      
      // Determine HTTP method
      const method = this.config.method || 'POST';
      
      // Execute webhook request
      let response;
      switch (method) {
        case 'GET':
          response = await this.adapter.get('/', { params: transformedPayload });
          break;
        case 'POST':
          response = await this.adapter.post('/', transformedPayload);
          break;
        case 'PUT':
          response = await this.adapter.put('/', transformedPayload);
          break;
        case 'PATCH':
          response = await this.adapter.post('/', transformedPayload);
          break;
        default:
          throw new Error(`Unsupported HTTP method: ${method}`);
      }
      
      return {
        success: true,
        data: response,
        metadata: {
          timestamp: new Date(),
          duration: Date.now() - startTime
        }
      };
      
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        metadata: {
          timestamp: new Date(),
          duration: Date.now() - startTime
        }
      };
    }
  }
  
  validateConfig(config: Record<string, unknown>): boolean {
    if (!config.baseURL || typeof config.baseURL !== 'string') {
      throw new Error('baseURL is required for webhook configuration');
    }
    return true;
  }
  
  async testConnection(): Promise<boolean> {
    return this.adapter.testConnection();
  }
}

// Register webhook agent
import { registry } from './AgentRegistry';

export function registerWebhookAgent(config: WebhookConfig): number {
  const agent = new WebhookAgent(
    registry.listAll().length + 1,
    'Webhook Agent',
    config
  );
  
  // Register with agent registry
  const registered = registry.register({
    name: agent.name,
    tier: 2,
    capabilities: ['webhook:post', 'webhook:get', 'api:call'],
    requiredAccuracy: 90
  });
  
  return registered.id;
}
```

### Webhook Usage Example

```typescript
// Example: Send workflow results to custom webhook
const webhookConfig: WebhookConfig = {
  baseURL: 'https://your-api.com/webhook',
  auth: {
    type: 'apikey',
    credentials: {
      header: 'X-API-Key',
      key: process.env.WEBHOOK_API_KEY!
    }
  },
  transformPayload: (data) => ({
    // Transform workstation data to your API format
    timestamp: new Date().toISOString(),
    source: 'workstation-automation',
    results: data
  })
};

// Register webhook agent
const webhookAgentId = registerWebhookAgent(webhookConfig);

// Use in workflow
const workflow: WorkflowDefinition = {
  id: 'workflow_with_webhook',
  name: 'Data Extraction with Webhook',
  agents: [
    1, // Navigate agent
    2, // Extract data agent
    webhookAgentId // Webhook agent (send extracted data)
  ],
  initialData: {
    targetUrl: 'https://example.com/data'
  }
};
```

**Business Context**: Webhook integration enables "automation as a service" model. Client provides webhook URL, your automation sends them data. No complex integration needed on their end.

## API Client Patterns

### Slack Integration Agent

```typescript
// src/automation/agents/SlackAgent.ts
import { WebClient } from '@slack/web-api';
import type { IntegrationAgent, IntegrationResult } from '../../types';

export interface SlackConfig {
  token: string;
  defaultChannel?: string;
}

export class SlackAgent implements IntegrationAgent {
  readonly id: number;
  readonly name: string;
  readonly type = 'slack' as const;
  
  private client: WebClient;
  private config: SlackConfig;
  
  constructor(id: number, name: string, config: SlackConfig) {
    this.id = id;
    this.name = name;
    this.config = config;
    this.client = new WebClient(config.token);
  }
  
  async execute(
    action: string,
    payload: Record<string, unknown>,
    config?: Record<string, unknown>
  ): Promise<IntegrationResult> {
    const startTime = Date.now();
    
    try {
      let result;
      
      switch (action) {
        case 'send_message':
          result = await this.sendMessage(payload, config);
          break;
          
        case 'upload_file':
          result = await this.uploadFile(payload, config);
          break;
          
        case 'send_alert':
          result = await this.sendAlert(payload, config);
          break;
          
        default:
          throw new Error(`Unknown Slack action: ${action}`);
      }
      
      return {
        success: true,
        data: result,
        metadata: {
          timestamp: new Date(),
          duration: Date.now() - startTime
        }
      };
      
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        metadata: {
          timestamp: new Date(),
          duration: Date.now() - startTime
        }
      };
    }
  }
  
  private async sendMessage(
    payload: Record<string, unknown>,
    config?: Record<string, unknown>
  ) {
    const channel = (config?.channel as string) || this.config.defaultChannel || '#general';
    const text = payload.message as string;
    const blocks = payload.blocks as any[];
    
    return await this.client.chat.postMessage({
      channel,
      text,
      blocks
    });
  }
  
  private async uploadFile(
    payload: Record<string, unknown>,
    config?: Record<string, unknown>
  ) {
    const channel = (config?.channel as string) || this.config.defaultChannel || '#general';
    const file = payload.file as Buffer | string;
    const filename = payload.filename as string;
    const title = payload.title as string;
    
    return await this.client.files.upload({
      channels: channel,
      file,
      filename,
      title
    });
  }
  
  private async sendAlert(
    payload: Record<string, unknown>,
    config?: Record<string, unknown>
  ) {
    const channel = (config?.channel as string) || this.config.defaultChannel || '#alerts';
    const alertType = payload.type as string;
    const message = payload.message as string;
    const data = payload.data as Record<string, unknown>;
    
    // Format alert message with blocks for better visibility
    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `🚨 ${alertType.toUpperCase()} ALERT`
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: message
        }
      },
      {
        type: 'section',
        fields: Object.entries(data).map(([key, value]) => ({
          type: 'mrkdwn',
          text: `*${key}:*\n${value}`
        }))
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `Triggered at ${new Date().toISOString()}`
          }
        ]
      }
    ];
    
    return await this.client.chat.postMessage({
      channel,
      text: message,
      blocks
    });
  }
  
  validateConfig(config: Record<string, unknown>): boolean {
    if (!config.token || typeof config.token !== 'string') {
      throw new Error('Slack token is required');
    }
    return true;
  }
  
  async testConnection(): Promise<boolean> {
    try {
      await this.client.auth.test();
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Register Slack agent
export function registerSlackAgent(config: SlackConfig): number {
  const agent = new SlackAgent(
    registry.listAll().length + 1,
    'Slack Integration',
    config
  );
  
  const registered = registry.register({
    name: agent.name,
    tier: 2,
    capabilities: ['slack:notify', 'slack:message', 'slack:alert', 'slack:file'],
    requiredAccuracy: 95
  });
  
  return registered.id;
}
```

### Slack Usage Example

```typescript
// Example: Workflow completion notification to Slack
const slackConfig: SlackConfig = {
  token: process.env.SLACK_BOT_TOKEN!,
  defaultChannel: '#automation-alerts'
};

const slackAgentId = registerSlackAgent(slackConfig);

// Create workflow with Slack notification
const workflow: WorkflowDefinition = {
  id: 'workflow_with_slack',
  name: 'Price Monitoring with Slack Alert',
  agents: [
    1, // Navigate to competitor site
    2, // Extract price
    slackAgentId // Send Slack alert if price changed
  ],
  initialData: {
    targetUrl: 'https://competitor.com/pricing',
    lastKnownPrice: 99.99
  }
};

// Execute workflow
orchestrator.on('workflow:completed', async (execution) => {
  const currentPrice = execution.workflowData.currentPrice as number;
  const lastPrice = execution.initialData.lastKnownPrice as number;
  
  if (currentPrice !== lastPrice) {
    // Send Slack alert
    await slackAgent.execute('send_alert', {
      type: 'price_change',
      message: `Competitor price changed!`,
      data: {
        'Previous Price': `$${lastPrice}`,
        'Current Price': `$${currentPrice}`,
        'Change': `${currentPrice > lastPrice ? '+' : ''}${((currentPrice - lastPrice) / lastPrice * 100).toFixed(2)}%`
      }
    }, {
      channel: '#competitor-monitoring'
    });
  }
});
```

**Business Context**: Slack integration is a premium feature. Base automation: $500/month. With Slack alerts: $750/month. Installation takes 10 minutes, generates $250/month recurring revenue.

## Authentication Strategies

### OAuth 2.0 Adapter

```typescript
// src/automation/adapters/OAuth2Adapter.ts
import { HttpAdapter } from './HttpAdapter';

export interface OAuth2Config {
  clientId: string;
  clientSecret: string;
  authorizationUrl: string;
  tokenUrl: string;
  redirectUri: string;
  scope?: string[];
}

export class OAuth2Adapter {
  private config: OAuth2Config;
  private accessToken?: string;
  private refreshToken?: string;
  private expiresAt?: Date;
  
  constructor(config: OAuth2Config) {
    this.config = config;
  }
  
  /**
   * Generate authorization URL for user consent
   */
  getAuthorizationUrl(): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: (this.config.scope || []).join(' ')
    });
    
    return `${this.config.authorizationUrl}?${params.toString()}`;
  }
  
  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<void> {
    const adapter = new HttpAdapter({
      baseURL: this.config.tokenUrl,
      timeout: 10000
    });
    
    const response = await adapter.post<{
      access_token: string;
      refresh_token?: string;
      expires_in: number;
    }>('/', {
      grant_type: 'authorization_code',
      code,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      redirect_uri: this.config.redirectUri
    });
    
    this.accessToken = response.access_token;
    this.refreshToken = response.refresh_token;
    this.expiresAt = new Date(Date.now() + response.expires_in * 1000);
  }
  
  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const adapter = new HttpAdapter({
      baseURL: this.config.tokenUrl,
      timeout: 10000
    });
    
    const response = await adapter.post<{
      access_token: string;
      refresh_token?: string;
      expires_in: number;
    }>('/', {
      grant_type: 'refresh_token',
      refresh_token: this.refreshToken,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret
    });
    
    this.accessToken = response.access_token;
    if (response.refresh_token) {
      this.refreshToken = response.refresh_token;
    }
    this.expiresAt = new Date(Date.now() + response.expires_in * 1000);
  }
  
  /**
   * Get valid access token (refresh if expired)
   */
  async getValidAccessToken(): Promise<string> {
    if (!this.accessToken) {
      throw new Error('Not authenticated - call exchangeCodeForToken first');
    }
    
    // Check if token is expired or will expire in next 5 minutes
    if (this.expiresAt && this.expiresAt.getTime() - Date.now() < 5 * 60 * 1000) {
      await this.refreshAccessToken();
    }
    
    return this.accessToken!;
  }
}
```

**Business Context**: OAuth support enables integration with enterprise SaaS (Salesforce, HubSpot, Google Workspace). These integrations command $1,500-$3,000/month because they connect to high-value systems.

## Error Handling and Retries

### Circuit Breaker Pattern

```typescript
// src/automation/adapters/CircuitBreaker.ts
export enum CircuitState {
  CLOSED = 'CLOSED',   // Normal operation
  OPEN = 'OPEN',       // Too many failures, block requests
  HALF_OPEN = 'HALF_OPEN' // Testing if service recovered
}

export interface CircuitBreakerConfig {
  failureThreshold: number;  // Number of failures before opening circuit
  successThreshold: number;  // Number of successes to close circuit
  timeout: number;           // Time to wait before trying HALF_OPEN (ms)
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private nextAttemptTime?: Date;
  private config: CircuitBreakerConfig;
  
  constructor(config: CircuitBreakerConfig) {
    this.config = config;
  }
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit is open
    if (this.state === CircuitState.OPEN) {
      if (!this.nextAttemptTime || Date.now() < this.nextAttemptTime.getTime()) {
        throw new Error('Circuit breaker is OPEN - service unavailable');
      }
      
      // Transition to HALF_OPEN
      this.state = CircuitState.HALF_OPEN;
      this.successCount = 0;
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
  
  private onSuccess(): void {
    this.failureCount = 0;
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      
      if (this.successCount >= this.config.successThreshold) {
        this.state = CircuitState.CLOSED;
        console.log('Circuit breaker: HALF_OPEN → CLOSED');
      }
    }
  }
  
  private onFailure(): void {
    this.failureCount++;
    this.successCount = 0;
    
    if (this.failureCount >= this.config.failureThreshold) {
      this.state = CircuitState.OPEN;
      this.nextAttemptTime = new Date(Date.now() + this.config.timeout);
      console.log(`Circuit breaker: OPEN until ${this.nextAttemptTime.toISOString()}`);
    }
  }
  
  getState(): CircuitState {
    return this.state;
  }
  
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.nextAttemptTime = undefined;
  }
}

// Usage with external API
const circuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 60000 // 1 minute
});

async function callExternalAPI(data: any) {
  return await circuitBreaker.execute(async () => {
    return await httpAdapter.post('/api/endpoint', data);
  });
}
```

**Business Context**: Circuit breaker prevents cascading failures. If client's webhook is down, you don't waste resources retrying. System auto-recovers when service is back up.

## Real-World Integration Examples

### Example 1: Salesforce CRM Integration

```typescript
// src/automation/agents/SalesforceAgent.ts
import { OAuth2Adapter } from '../adapters/OAuth2Adapter';
import { HttpAdapter } from '../adapters/HttpAdapter';

export class SalesforceAgent implements IntegrationAgent {
  private oauth: OAuth2Adapter;
  private httpAdapter?: HttpAdapter;
  private instanceUrl?: string;
  
  constructor(config: OAuth2Config) {
    this.oauth = new OAuth2Adapter(config);
  }
  
  async execute(
    action: string,
    payload: Record<string, unknown>
  ): Promise<IntegrationResult> {
    // Ensure authenticated
    if (!this.httpAdapter) {
      await this.authenticate();
    }
    
    switch (action) {
      case 'create_lead':
        return await this.createLead(payload);
      case 'update_opportunity':
        return await this.updateOpportunity(payload);
      case 'query_accounts':
        return await this.queryAccounts(payload);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }
  
  private async authenticate(): Promise<void> {
    const token = await this.oauth.getValidAccessToken();
    
    this.httpAdapter = new HttpAdapter({
      baseURL: `${this.instanceUrl}/services/data/v57.0`,
      auth: {
        type: 'bearer',
        credentials: { token }
      }
    });
  }
  
  private async createLead(data: Record<string, unknown>): Promise<IntegrationResult> {
    const response = await this.httpAdapter!.post('/sobjects/Lead', {
      FirstName: data.firstName,
      LastName: data.lastName,
      Company: data.company,
      Email: data.email,
      Phone: data.phone,
      LeadSource: 'Workstation Automation'
    });
    
    return {
      success: true,
      data: response,
      metadata: { timestamp: new Date(), duration: 0 }
    };
  }
  
  // Additional methods...
}
```

### Example 2: GitHub API Integration

```typescript
// src/automation/agents/GitHubAgent.ts
export class GitHubAgent implements IntegrationAgent {
  private httpAdapter: HttpAdapter;
  
  constructor(token: string) {
    this.httpAdapter = new HttpAdapter({
      baseURL: 'https://api.github.com',
      auth: {
        type: 'bearer',
        credentials: { token }
      },
      headers: {
        'Accept': 'application/vnd.github.v3+json'
      }
    });
  }
  
  async execute(
    action: string,
    payload: Record<string, unknown>
  ): Promise<IntegrationResult> {
    switch (action) {
      case 'create_issue':
        return await this.createIssue(payload);
      case 'create_pr':
        return await this.createPullRequest(payload);
      case 'add_comment':
        return await this.addComment(payload);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }
  
  private async createIssue(data: Record<string, unknown>): Promise<IntegrationResult> {
    const { owner, repo, title, body, labels } = data;
    
    const response = await this.httpAdapter.post(
      `/repos/${owner}/${repo}/issues`,
      { title, body, labels }
    );
    
    return {
      success: true,
      data: response,
      metadata: { timestamp: new Date(), duration: 0 }
    };
  }
  
  // Additional methods...
}
```

## Business Value

### For Agencies

**1. Integration Upsells**
- Base automation: $500/month
- + Slack integration: $250/month
- + CRM integration: $700/month
- + Custom webhooks: $300/month
- Total: $1,750/month (250% increase)

**2. Client Stickiness**
- Integrated automations are hard to replace
- Client's workflows depend on your integrations
- Example: 90% retention rate vs 60% without integrations

**3. Faster Delivery**
- Reusable adapters: Build once, use many times
- Example: Salesforce integration took 8 hours initially, now 30 minutes per client

### For Founders

**1. Connect Your Stack**
- Automation → Slack → Email → CRM
- Complete workflows without manual steps
- Example: "Lead captured → CRM → Slack notification → Follow-up email"

**2. Custom Integrations**
- Integrate with your proprietary systems
- Example: "Scrape data → Transform → Load to internal database"

### For Platform Engineers

**1. Standardized Integration Patterns**
- HTTP adapter works for any REST API
- OAuth2 adapter handles complex auth
- Circuit breaker prevents cascading failures

**2. Observability**
- Log all integration attempts
- Track success/failure rates
- Monitor API rate limits

### For Senior Developers

**1. Clean Abstraction**
- Integration agents implement common interface
- Adapters handle protocol details
- Easy to test and mock

**2. Production-Ready**
- Automatic retry with exponential backoff
- Circuit breaker for fault tolerance
- OAuth token refresh handling

## Next Steps

1. **Implement integrations**: [Implementation Checklist](./implementation-checklist.md)
2. **Build workflows**: [Module 3: Browser Agents](../module-3-browser-agents/README.md)
3. **Deploy to production**: [Module 5: Automation](../module-5-automation/production-deployment.md)

## Additional Resources

- **Source Code**: `src/automation/adapters/`, `src/automation/agents/`
- **Examples**: `examples/integrations/`
- **API Documentation**: Individual service API docs (Slack, Salesforce, GitHub)
