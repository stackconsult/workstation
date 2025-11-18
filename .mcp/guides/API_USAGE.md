# MCP API Usage Guide

## 📥 How to Consume Registry Data

This guide explains how to consume and interact with the Workstation MCP server as a client, whether you're building a GitHub Copilot integration, a custom automation tool, or any other MCP client.

## Overview

The Workstation MCP server exposes three main categories of capabilities:

1. **Tools**: Executable actions (browser automation, workflows)
2. **Resources**: Access to data (workflows, screenshots, page content)
3. **Prompts**: Pre-configured automation templates

## Client Setup

### 1. Install MCP Client Library

```bash
# For Node.js/TypeScript
npm install @modelcontextprotocol/client

# For Python
pip install mcp-client
```

### 2. Configure Client Connection

```typescript
// TypeScript example
import { MCPClient } from '@modelcontextprotocol/client';

const client = new MCPClient({
  server: {
    name: 'workstation-mcp-server',
    transport: {
      type: 'http',
      baseUrl: 'http://localhost:3000',
      endpoints: {
        tools: '/api/v2/mcp/tools',
        resources: '/api/v2/mcp/resources',
        prompts: '/api/v2/mcp/prompts'
      }
    },
    authentication: {
      type: 'bearer',
      tokenEndpoint: '/auth/demo-token'
    }
  }
});

await client.connect();
```

### 3. Authenticate

```typescript
// Get authentication token
const auth = await client.authenticate({
  userId: 'your-user-id',
  role: 'user'
});

// Token is automatically used for subsequent requests
console.log('Authenticated:', auth.token);
```

## Using Tools

Tools are executable actions provided by the MCP server.

### List Available Tools

```typescript
// Get all available tools
const tools = await client.listTools();

tools.forEach(tool => {
  console.log(`${tool.name}: ${tool.description}`);
  console.log('Input Schema:', JSON.stringify(tool.inputSchema, null, 2));
});
```

**REST API equivalent:**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v2/mcp/tools
```

### Execute a Tool

#### Browser Navigation

```typescript
const result = await client.callTool('browser_navigate', {
  url: 'https://example.com',
  waitUntil: 'networkidle'
});

console.log('Navigation result:', result);
```

**REST API equivalent:**
```bash
curl -X POST http://localhost:3000/api/v2/mcp/tools/browser_navigate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "waitUntil": "networkidle"
  }'
```

#### Browser Interaction

```typescript
// Click an element
await client.callTool('browser_click', {
  selector: '#submit-button',
  waitForSelector: true
});

// Type text
await client.callTool('browser_type', {
  selector: '#search-input',
  text: 'automation testing',
  delay: 100
});

// Take screenshot
const screenshot = await client.callTool('browser_screenshot', {
  fullPage: true
});

console.log('Screenshot data:', screenshot.data);
```

#### Data Extraction

```typescript
// Get text content
const text = await client.callTool('browser_get_text', {
  selector: '.article-content'
});

console.log('Extracted text:', text.content);

// Get full page HTML
const html = await client.callTool('browser_get_content', {});
console.log('Page HTML:', html.content);
```

#### Execute JavaScript

```typescript
// Run custom JavaScript in browser
const result = await client.callTool('browser_evaluate', {
  script: `
    return {
      title: document.title,
      links: Array.from(document.querySelectorAll('a')).map(a => a.href),
      images: Array.from(document.querySelectorAll('img')).map(img => img.src)
    };
  `
});

console.log('Evaluation result:', result.data);
```

## Using Workflows

Workflows allow you to chain multiple actions together.

### Create a Workflow

```typescript
const workflow = await client.callTool('workflow_create', {
  name: 'Google Search Screenshot',
  description: 'Search Google and capture results',
  tasks: [
    {
      name: 'navigate',
      agent_type: 'browser',
      action: 'navigate',
      parameters: { url: 'https://google.com' }
    },
    {
      name: 'search',
      agent_type: 'browser',
      action: 'type',
      parameters: { 
        selector: 'input[name="q"]',
        text: '{{searchQuery}}'
      }
    },
    {
      name: 'submit',
      agent_type: 'browser',
      action: 'click',
      parameters: { selector: 'input[type="submit"]' }
    },
    {
      name: 'screenshot',
      agent_type: 'browser',
      action: 'screenshot',
      parameters: { fullPage: true }
    }
  ]
});

console.log('Workflow created:', workflow.id);
```

### Execute a Workflow

```typescript
const execution = await client.callTool('workflow_execute', {
  workflowId: workflow.id,
  parameters: {
    searchQuery: 'model context protocol'
  }
});

console.log('Workflow execution:', execution);
```

**REST API equivalent:**
```bash
# Create workflow
curl -X POST http://localhost:3000/api/v2/workflows \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @workflow.json

# Execute workflow
curl -X POST http://localhost:3000/api/v2/workflows/{workflowId}/execute \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"parameters": {"searchQuery": "test"}}'
```

## Using Resources

Resources provide access to stored data.

### List Available Resources

```typescript
const resources = await client.listResources();

resources.forEach(resource => {
  console.log(`${resource.name}: ${resource.description}`);
  console.log('MIME Type:', resource.mimeType);
});
```

### Access Resource Data

```typescript
// Get saved workflows
const workflows = await client.getResource('workflows');
console.log('Available workflows:', workflows);

// Get screenshots
const screenshots = await client.getResource('screenshots');
console.log('Captured screenshots:', screenshots);

// Get page content
const pageContent = await client.getResource('page_content');
console.log('Saved page content:', pageContent);
```

**REST API equivalent:**
```bash
# Get workflows
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v2/workflows

# Get screenshots
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v2/screenshots
```

## Using Prompts

Prompts are pre-configured automation templates.

### List Available Prompts

```typescript
const prompts = await client.listPrompts();

prompts.forEach(prompt => {
  console.log(`${prompt.name}: ${prompt.description}`);
  console.log('Arguments:', prompt.arguments);
});
```

### Execute a Prompt

```typescript
// Use the scrape_website prompt
const result = await client.executePrompt('scrape_website', {
  url: 'https://example.com',
  selectors: {
    title: 'h1',
    description: 'p.description',
    links: 'a.external-link'
  }
});

console.log('Scraped data:', result);
```

```typescript
// Use the fill_form prompt
await client.executePrompt('fill_form', {
  url: 'https://example.com/contact',
  fields: {
    name: 'John Doe',
    email: 'john@example.com',
    message: 'Hello from MCP!'
  }
});
```

## GitHub Copilot Integration

### Configure Copilot to Use MCP Server

1. **Add server to Copilot configuration:**

```json
// .github/copilot/mcp-servers.json
{
  "mcpServers": {
    "workstation": {
      "command": "node",
      "args": ["dist/index.js"],
      "env": {
        "JWT_SECRET": "${JWT_SECRET}",
        "PORT": "3000"
      }
    }
  }
}
```

2. **Or use remote server:**

```json
{
  "mcpServers": {
    "workstation": {
      "url": "https://your-workstation-instance.railway.app",
      "auth": {
        "type": "bearer",
        "token": "${WORKSTATION_TOKEN}"
      }
    }
  }
}
```

### Using in Copilot Chat

Once configured, you can use the MCP server in Copilot Chat:

```
@workspace /mcp workstation browser_navigate url=https://example.com

@workspace /mcp workstation workflow_create name="Login Test" tasks=[...]

@workspace /mcp workstation browser_screenshot fullPage=true
```

## Error Handling

```typescript
try {
  const result = await client.callTool('browser_navigate', {
    url: 'https://example.com'
  });
} catch (error) {
  if (error.code === 'AUTHENTICATION_REQUIRED') {
    // Re-authenticate
    await client.authenticate({ userId: 'user' });
  } else if (error.code === 'RATE_LIMIT_EXCEEDED') {
    // Wait and retry
    await new Promise(resolve => setTimeout(resolve, 60000));
  } else if (error.code === 'TOOL_ERROR') {
    // Handle tool-specific error
    console.error('Tool execution failed:', error.message);
  } else {
    // Unknown error
    console.error('Unexpected error:', error);
  }
}
```

## Rate Limiting

The server implements rate limiting:

- **General endpoints**: 100 requests per 15 minutes
- **Auth endpoints**: 10 requests per 15 minutes

Check rate limit headers in responses:

```typescript
const response = await client.callTool('browser_navigate', { url: '...' });

console.log('Rate limit remaining:', response.headers['x-ratelimit-remaining']);
console.log('Rate limit reset:', response.headers['x-ratelimit-reset']);
```

## Best Practices

### 1. Connection Management

```typescript
// Reuse client instance
const client = new MCPClient({ ... });
await client.connect();

// Don't create new client for each request
// ❌ Bad
for (const url of urls) {
  const client = new MCPClient({ ... });
  await client.callTool('browser_navigate', { url });
}

// ✅ Good
const client = new MCPClient({ ... });
await client.connect();
for (const url of urls) {
  await client.callTool('browser_navigate', { url });
}
```

### 2. Error Retry Logic

```typescript
async function callToolWithRetry(tool, params, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await client.callTool(tool, params);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
}
```

### 3. Batch Operations

```typescript
// Use workflows for multiple operations
const workflow = await client.callTool('workflow_create', {
  name: 'Batch Scraping',
  tasks: urls.map(url => ({
    name: `scrape_${url}`,
    agent_type: 'browser',
    action: 'navigate',
    parameters: { url }
  }))
});

await client.callTool('workflow_execute', { workflowId: workflow.id });
```

### 4. Resource Cleanup

```typescript
// Always disconnect when done
try {
  // Use client
  await client.callTool('browser_navigate', { url: '...' });
} finally {
  await client.disconnect();
}
```

## Examples

See the [examples directory](../examples/) for complete working examples:

- [Basic Usage](../examples/BASIC_USAGE.md) - Simple tool calls
- [Advanced Workflows](../examples/ADVANCED_WORKFLOWS.md) - Complex automations
- [Custom Integration](../examples/CUSTOM_INTEGRATION.md) - Building custom clients

## REST API Reference

For complete API reference, see [API Specification](../specs/API_SPEC.md).

### Quick Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v2/mcp/tools` | GET | List available tools |
| `/api/v2/mcp/tools/{name}` | POST | Execute a tool |
| `/api/v2/mcp/resources` | GET | List available resources |
| `/api/v2/mcp/resources/{name}` | GET | Get resource data |
| `/api/v2/mcp/prompts` | GET | List available prompts |
| `/api/v2/mcp/prompts/{name}` | POST | Execute a prompt |
| `/auth/demo-token` | POST | Get authentication token |

## Support

Need help using the MCP API?

- **Documentation**: [API Specification](../specs/API_SPEC.md)
- **Examples**: [Examples Directory](../examples/)
- **Issues**: https://github.com/creditXcredit/workstation/issues
- **Discussions**: https://github.com/creditXcredit/workstation/discussions
