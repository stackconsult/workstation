# External Integration Patterns - Module 4

## Overview

Learn how to integrate external services and APIs with your browser automation workflows, including Slack notifications, webhooks, third-party APIs, and enterprise SaaS platforms.

## Integration Architecture

```
Browser Automation Workflow
         ↓
    Task Results
         ↓
    ┌────┴────┐
    │         │
Slack API   Webhook    Third-Party APIs
    │         │              │
Notifications Events    Data Storage
```

## Slack Integration

### Setup Slack Webhook

```bash
# 1. Go to https://api.slack.com/apps
# 2. Create New App → From Scratch
# 3. Enable Incoming Webhooks
# 4. Add New Webhook to Workspace
# 5. Copy webhook URL

# Add to .env
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXX
```

### Send Notifications from Workflow

```json
{
  "name": "Workflow with Slack Notification",
  "definition": {
    "tasks": [
      {
        "name": "scrape_data",
        "agent_type": "browser",
        "action": "getText",
        "parameters": {"selector": ".data"}
      },
      {
        "name": "notify_slack",
        "agent_type": "integration",
        "action": "slack_notify",
        "parameters": {
          "webhook_url": "${env.SLACK_WEBHOOK_URL}",
          "message": "Data scraped: ${scrape_data.result}",
          "channel": "#automation"
        }
      }
    ]
  }
}
```

### Custom Slack Agent

```typescript
// src/automation/agents/integrations/slack.ts
import axios from 'axios';

export class SlackAgent {
  type = 'slack';
  name = 'Slack Integration Agent';
  
  async execute(action: string, params: any): Promise<any> {
    switch (action) {
      case 'send_message':
        return this.sendMessage(params);
      case 'send_rich_message':
        return this.sendRichMessage(params);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }
  
  private async sendMessage(params: {
    webhook_url: string;
    text: string;
    channel?: string;
  }): Promise<any> {
    const payload = {
      text: params.text,
      channel: params.channel
    };
    
    const response = await axios.post(params.webhook_url, payload);
    
    return {
      success: response.status === 200,
      timestamp: new Date().toISOString()
    };
  }
  
  private async sendRichMessage(params: {
    webhook_url: string;
    blocks: any[];
    attachments?: any[];
  }): Promise<any> {
    const response = await axios.post(params.webhook_url, {
      blocks: params.blocks,
      attachments: params.attachments
    });
    
    return {
      success: response.status === 200,
      timestamp: new Date().toISOString()
    };
  }
}
```

### Rich Slack Messages

```json
{
  "name": "notify_with_details",
  "agent_type": "slack",
  "action": "send_rich_message",
  "parameters": {
    "webhook_url": "${env.SLACK_WEBHOOK_URL}",
    "blocks": [
      {
        "type": "header",
        "text": {
          "type": "plain_text",
          "text": "🎉 Workflow Completed"
        }
      },
      {
        "type": "section",
        "fields": [
          {
            "type": "mrkdwn",
            "text": "*Workflow:*\n${workflow.name}"
          },
          {
            "type": "mrkdwn",
            "text": "*Status:*\n✅ Success"
          },
          {
            "type": "mrkdwn",
            "text": "*Duration:*\n${workflow.duration}s"
          },
          {
            "type": "mrkdwn",
            "text": "*Tasks:*\n${workflow.tasks_completed}/${workflow.tasks_total}"
          }
        ]
      },
      {
        "type": "actions",
        "elements": [
          {
            "type": "button",
            "text": {
              "type": "plain_text",
              "text": "View Details"
            },
            "url": "https://app.workstation.io/workflows/${workflow.id}"
          }
        ]
      }
    ]
  }
}
```

## Webhook Integration

### Receive Webhook Events

```typescript
// src/routes/webhooks.ts
import express from 'express';
import { WorkflowOrchestrator } from '../automation/orchestrator/engine';

const router = express.Router();
const orchestrator = new WorkflowOrchestrator();

// Generic webhook receiver
router.post('/webhooks/:workflowId', async (req, res) => {
  const { workflowId } = req.params;
  const payload = req.body;
  
  try {
    // Execute workflow with webhook data
    const result = await orchestrator.executeWorkflow(workflowId, {
      trigger: 'webhook',
      payload: payload,
      timestamp: new Date().toISOString()
    });
    
    res.json({
      success: true,
      workflow_id: workflowId,
      execution_id: result.id
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GitHub webhook handler
router.post('/webhooks/github', async (req, res) => {
  const event = req.headers['x-github-event'];
  const payload = req.body;
  
  if (event === 'push') {
    // Trigger build workflow
    await orchestrator.executeWorkflow('github-ci-build', {
      repository: payload.repository.full_name,
      branch: payload.ref,
      commits: payload.commits
    });
  }
  
  if (event === 'pull_request') {
    // Trigger PR review workflow
    await orchestrator.executeWorkflow('github-pr-review', {
      pr_number: payload.pull_request.number,
      action: payload.action
    });
  }
  
  res.json({ success: true });
});

export default router;
```

### Send Webhook Events

```typescript
// src/automation/agents/integrations/webhook.ts
import axios from 'axios';

export class WebhookAgent {
  type = 'webhook';
  name = 'Webhook Agent';
  
  async execute(action: string, params: any): Promise<any> {
    if (action === 'send') {
      return this.sendWebhook(params);
    }
    throw new Error(`Unknown action: ${action}`);
  }
  
  private async sendWebhook(params: {
    url: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers?: Record<string, string>;
    body?: any;
    retry?: {
      max_attempts: number;
      backoff: 'exponential' | 'linear';
    };
  }): Promise<any> {
    const method = params.method || 'POST';
    const headers = params.headers || { 'Content-Type': 'application/json' };
    
    let attempt = 0;
    const maxAttempts = params.retry?.max_attempts || 3;
    
    while (attempt < maxAttempts) {
      try {
        const response = await axios({
          method,
          url: params.url,
          headers,
          data: params.body
        });
        
        return {
          success: true,
          status: response.status,
          data: response.data
        };
      } catch (error) {
        attempt++;
        if (attempt >= maxAttempts) {
          throw error;
        }
        
        // Exponential backoff
        const delay = params.retry?.backoff === 'exponential'
          ? Math.pow(2, attempt) * 1000
          : 1000;
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
}
```

## Third-Party API Integration

### REST API Agent

```typescript
// src/automation/agents/integrations/rest-api.ts
import axios, { AxiosRequestConfig } from 'axios';

export class RestAPIAgent {
  type = 'rest_api';
  name = 'REST API Agent';
  
  async execute(action: string, params: any): Promise<any> {
    switch (action) {
      case 'get':
        return this.get(params);
      case 'post':
        return this.post(params);
      case 'put':
        return this.put(params);
      case 'delete':
        return this.delete(params);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }
  
  private async get(params: {
    url: string;
    headers?: Record<string, string>;
    params?: Record<string, any>;
  }): Promise<any> {
    const response = await axios.get(params.url, {
      headers: params.headers,
      params: params.params
    });
    
    return response.data;
  }
  
  private async post(params: {
    url: string;
    body: any;
    headers?: Record<string, string>;
  }): Promise<any> {
    const response = await axios.post(params.url, params.body, {
      headers: params.headers
    });
    
    return response.data;
  }
  
  private async put(params: {
    url: string;
    body: any;
    headers?: Record<string, string>;
  }): Promise<any> {
    const response = await axios.put(params.url, params.body, {
      headers: params.headers
    });
    
    return response.data;
  }
  
  private async delete(params: {
    url: string;
    headers?: Record<string, string>;
  }): Promise<any> {
    const response = await axios.delete(params.url, {
      headers: params.headers
    });
    
    return response.data;
  }
}
```

### API Integration Workflow Example

```json
{
  "name": "Salesforce Lead Creation",
  "description": "Create lead in Salesforce from scraped data",
  "definition": {
    "tasks": [
      {
        "name": "scrape_contact_info",
        "agent_type": "browser",
        "action": "getText",
        "parameters": {
          "url": "https://example.com/contact",
          "selectors": {
            "name": ".contact-name",
            "email": ".contact-email",
            "company": ".company-name"
          }
        }
      },
      {
        "name": "create_salesforce_lead",
        "agent_type": "rest_api",
        "action": "post",
        "parameters": {
          "url": "https://instance.salesforce.com/services/data/v58.0/sobjects/Lead",
          "headers": {
            "Authorization": "******{env.SALESFORCE_TOKEN}",
            "Content-Type": "application/json"
          },
          "body": {
            "FirstName": "${scrape_contact_info.result.name}",
            "Email": "${scrape_contact_info.result.email}",
            "Company": "${scrape_contact_info.result.company}",
            "LeadSource": "Web Scraping"
          }
        }
      },
      {
        "name": "notify_sales_team",
        "agent_type": "slack",
        "action": "send_message",
        "parameters": {
          "webhook_url": "${env.SLACK_WEBHOOK_URL}",
          "text": "New lead created: ${scrape_contact_info.result.name} at ${scrape_contact_info.result.company}"
        }
      }
    ]
  }
}
```

## Database Integration

### PostgreSQL Agent

```typescript
// src/automation/agents/integrations/postgres.ts
import { Pool } from 'pg';

export class PostgresAgent {
  type = 'postgres';
  name = 'PostgreSQL Agent';
  private pool: Pool;
  
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false
    });
  }
  
  async execute(action: string, params: any): Promise<any> {
    switch (action) {
      case 'query':
        return this.query(params);
      case 'insert':
        return this.insert(params);
      case 'update':
        return this.update(params);
      case 'delete':
        return this.deleteRecord(params);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }
  
  private async query(params: {
    sql: string;
    values?: any[];
  }): Promise<any> {
    const result = await this.pool.query(params.sql, params.values);
    return result.rows;
  }
  
  private async insert(params: {
    table: string;
    data: Record<string, any>;
  }): Promise<any> {
    const keys = Object.keys(params.data);
    const values = Object.values(params.data);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    
    const sql = `INSERT INTO ${params.table} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`;
    const result = await this.pool.query(sql, values);
    
    return result.rows[0];
  }
  
  private async update(params: {
    table: string;
    data: Record<string, any>;
    where: Record<string, any>;
  }): Promise<any> {
    const setClause = Object.keys(params.data)
      .map((key, i) => `${key} = $${i + 1}`)
      .join(', ');
    
    const whereClause = Object.keys(params.where)
      .map((key, i) => `${key} = $${i + 1 + Object.keys(params.data).length}`)
      .join(' AND ');
    
    const values = [...Object.values(params.data), ...Object.values(params.where)];
    
    const sql = `UPDATE ${params.table} SET ${setClause} WHERE ${whereClause} RETURNING *`;
    const result = await this.pool.query(sql, values);
    
    return result.rows[0];
  }
  
  private async deleteRecord(params: {
    table: string;
    where: Record<string, any>;
  }): Promise<any> {
    const whereClause = Object.keys(params.where)
      .map((key, i) => `${key} = $${i + 1}`)
      .join(' AND ');
    
    const sql = `DELETE FROM ${params.table} WHERE ${whereClause} RETURNING *`;
    const result = await this.pool.query(sql, Object.values(params.where));
    
    return result.rows[0];
  }
}
```

## Email Integration

### SendGrid Agent

```typescript
// src/automation/agents/integrations/sendgrid.ts
import sgMail from '@sendgrid/mail';

export class SendGridAgent {
  type = 'email';
  name = 'SendGrid Email Agent';
  
  constructor() {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');
  }
  
  async execute(action: string, params: any): Promise<any> {
    if (action === 'send') {
      return this.sendEmail(params);
    }
    throw new Error(`Unknown action: ${action}`);
  }
  
  private async sendEmail(params: {
    to: string | string[];
    from: string;
    subject: string;
    text?: string;
    html?: string;
    attachments?: Array<{
      content: string;
      filename: string;
      type: string;
    }>;
  }): Promise<any> {
    const msg = {
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text,
      html: params.html,
      attachments: params.attachments
    };
    
    await sgMail.send(msg);
    
    return {
      success: true,
      timestamp: new Date().toISOString()
    };
  }
}
```

## Google Sheets Integration

### Google Sheets Agent

```typescript
// src/automation/agents/integrations/google-sheets.ts
import { google } from 'googleapis';

export class GoogleSheetsAgent {
  type = 'google_sheets';
  name = 'Google Sheets Agent';
  private sheets: any;
  
  constructor() {
    const auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_CREDENTIALS_PATH,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    
    this.sheets = google.sheets({ version: 'v4', auth });
  }
  
  async execute(action: string, params: any): Promise<any> {
    switch (action) {
      case 'append':
        return this.appendRow(params);
      case 'read':
        return this.readRange(params);
      case 'update':
        return this.updateRange(params);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }
  
  private async appendRow(params: {
    spreadsheetId: string;
    range: string;
    values: any[][];
  }): Promise<any> {
    const response = await this.sheets.spreadsheets.values.append({
      spreadsheetId: params.spreadsheetId,
      range: params.range,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: params.values
      }
    });
    
    return response.data;
  }
  
  private async readRange(params: {
    spreadsheetId: string;
    range: string;
  }): Promise<any> {
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: params.spreadsheetId,
      range: params.range
    });
    
    return response.data.values;
  }
  
  private async updateRange(params: {
    spreadsheetId: string;
    range: string;
    values: any[][];
  }): Promise<any> {
    const response = await this.sheets.spreadsheets.values.update({
      spreadsheetId: params.spreadsheetId,
      range: params.range,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: params.values
      }
    });
    
    return response.data;
  }
}
```

## Authentication Patterns

### OAuth 2.0 Integration

```typescript
// src/automation/agents/integrations/oauth.ts
import axios from 'axios';

export class OAuthAgent {
  async getAccessToken(params: {
    client_id: string;
    client_secret: string;
    refresh_token: string;
    token_url: string;
  }): Promise<string> {
    const response = await axios.post(params.token_url, {
      grant_type: 'refresh_token',
      client_id: params.client_id,
      client_secret: params.client_secret,
      refresh_token: params.refresh_token
    });
    
    return response.data.access_token;
  }
}
```

### API Key Management

```typescript
// Store API keys securely
const apiKeys = {
  salesforce: process.env.SALESFORCE_API_KEY,
  sendgrid: process.env.SENDGRID_API_KEY,
  google: process.env.GOOGLE_API_KEY,
  slack: process.env.SLACK_API_TOKEN
};

// Rotate API keys periodically
async function rotateApiKey(service: string) {
  // Implementation for key rotation
}
```

## Integration Registry

```typescript
// src/automation/agents/integrations/registry.ts
import { SlackAgent } from './slack';
import { WebhookAgent } from './webhook';
import { RestAPIAgent } from './rest-api';
import { PostgresAgent } from './postgres';
import { SendGridAgent } from './sendgrid';
import { GoogleSheetsAgent } from './google-sheets';

export class IntegrationRegistry {
  private agents: Map<string, any> = new Map();
  
  constructor() {
    this.registerAgent(new SlackAgent());
    this.registerAgent(new WebhookAgent());
    this.registerAgent(new RestAPIAgent());
    this.registerAgent(new PostgresAgent());
    this.registerAgent(new SendGridAgent());
    this.registerAgent(new GoogleSheetsAgent());
  }
  
  registerAgent(agent: any) {
    this.agents.set(agent.type, agent);
  }
  
  getAgent(type: string): any {
    const agent = this.agents.get(type);
    if (!agent) {
      throw new Error(`Agent type not found: ${type}`);
    }
    return agent;
  }
  
  listAgents(): string[] {
    return Array.from(this.agents.keys());
  }
}
```

## Real-World Integration Examples

### Example 1: CRM Lead Pipeline

Scrape website → Enrich data → Create CRM lead → Notify sales

```json
{
  "name": "Automated Lead Pipeline",
  "definition": {
    "tasks": [
      {"name": "scrape_company", "agent_type": "browser", "action": "navigate"},
      {"name": "enrich_clearbit", "agent_type": "rest_api", "action": "post"},
      {"name": "create_hubspot_lead", "agent_type": "rest_api", "action": "post"},
      {"name": "notify_sales", "agent_type": "slack", "action": "send_message"}
    ]
  }
}
```

### Example 2: E-Commerce Price Monitoring

Monitor prices → Store in database → Alert on changes

```json
{
  "name": "Price Monitor with Database",
  "trigger": {"type": "cron", "schedule": "0 */6 * * *"},
  "definition": {
    "tasks": [
      {"name": "scrape_price", "agent_type": "browser", "action": "getText"},
      {"name": "store_price", "agent_type": "postgres", "action": "insert"},
      {"name": "check_change", "agent_type": "postgres", "action": "query"},
      {"name": "alert_if_changed", "agent_type": "slack", "action": "send_message"}
    ]
  }
}
```

## Security Best Practices

1. **Never hardcode credentials**
2. **Use environment variables**
3. **Rotate API keys regularly**
4. **Implement rate limiting**
5. **Validate webhook signatures**
6. **Use HTTPS only**
7. **Encrypt sensitive data at rest**
8. **Log access attempts**

## Next Steps

✅ **External integrations mastered**

→ Continue to [playbook-structure.md](./playbook-structure.md)

## Business Impact

**For Agencies:**
- Connect client systems seamlessly
- Automate end-to-end workflows
- Reduce integration development time by 80%

**For Founders:**
- Build product integrations faster
- Support more third-party services
- Scale integration capabilities

**For Platform Engineers:**
- Standardized integration patterns
- Secure credential management
- Observable integration flows

**For Senior Developers:**
- Reusable integration components
- Type-safe API clients
- Testable integration logic
