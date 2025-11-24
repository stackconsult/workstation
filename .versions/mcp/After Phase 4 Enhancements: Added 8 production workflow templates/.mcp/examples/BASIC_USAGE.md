# MCP Basic Usage Examples

## Simple Examples to Get Started

This guide provides basic examples for using the Workstation MCP server.

## Prerequisites

```bash
# Start the server
npm run dev

# Get authentication token
TOKEN=$(curl -s http://localhost:3000/auth/demo-token | jq -r '.token')
```

## Example 1: Navigate to a Website

```bash
curl -X POST http://localhost:3000/api/v2/mcp/tools/browser_navigate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "waitUntil": "networkidle"
  }'
```

**Response:**
```json
{
  "success": true,
  "result": {
    "url": "https://example.com",
    "title": "Example Domain",
    "loadTime": 1234
  }
}
```

## Example 2: Take a Screenshot

```bash
curl -X POST http://localhost:3000/api/v2/mcp/tools/browser_screenshot \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullPage": true
  }' | jq -r '.result.screenshot' | base64 -d > screenshot.png
```

## Example 3: Extract Text

```bash
# First navigate
curl -X POST http://localhost:3000/api/v2/mcp/tools/browser_navigate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'

# Then extract text
curl -X POST http://localhost:3000/api/v2/mcp/tools/browser_get_text \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "selector": "h1"
  }'
```

## Example 4: Click and Type

```bash
# Navigate to search page
curl -X POST http://localhost:3000/api/v2/mcp/tools/browser_navigate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://google.com"}'

# Type in search box
curl -X POST http://localhost:3000/api/v2/mcp/tools/browser_type \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "selector": "input[name=\"q\"]",
    "text": "model context protocol"
  }'

# Click search button
curl -X POST http://localhost:3000/api/v2/mcp/tools/browser_click \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "selector": "input[type=\"submit\"]"
  }'
```

## Example 5: Execute JavaScript

```bash
curl -X POST http://localhost:3000/api/v2/mcp/tools/browser_evaluate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "script": "return {title: document.title, links: document.querySelectorAll(\"a\").length}"
  }'
```

## Example 6: Create a Workflow

```bash
curl -X POST http://localhost:3000/api/v2/workflows \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Google Search and Screenshot",
    "description": "Search Google and capture results",
    "definition": {
      "tasks": [
        {
          "name": "navigate",
          "agent_type": "browser",
          "action": "navigate",
          "parameters": {"url": "https://google.com"}
        },
        {
          "name": "search",
          "agent_type": "browser",
          "action": "type",
          "parameters": {
            "selector": "input[name=\"q\"]",
            "text": "{{searchQuery}}"
          }
        },
        {
          "name": "submit",
          "agent_type": "browser",
          "action": "click",
          "parameters": {"selector": "input[type=\"submit\"]"}
        },
        {
          "name": "screenshot",
          "agent_type": "browser",
          "action": "screenshot",
          "parameters": {"fullPage": true}
        }
      ]
    }
  }'
```

Save the workflow ID from the response.

## Example 7: Execute a Workflow

```bash
# Replace {workflowId} with the ID from Example 6
curl -X POST http://localhost:3000/api/v2/workflows/{workflowId}/execute \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "parameters": {
      "searchQuery": "model context protocol"
    }
  }'
```

## TypeScript Examples

### Example 1: Using MCP Client Library

```typescript
import { MCPClient } from '@modelcontextprotocol/client';

const client = new MCPClient({
  server: {
    transport: {
      type: 'http',
      baseUrl: 'http://localhost:3000'
    },
    authentication: {
      type: 'bearer',
      tokenEndpoint: '/auth/demo-token'
    }
  }
});

async function main() {
  // Connect and authenticate
  await client.connect();
  await client.authenticate({ userId: 'demo-user' });

  // Navigate to website
  const navResult = await client.callTool('browser_navigate', {
    url: 'https://example.com'
  });
  console.log('Navigation:', navResult);

  // Take screenshot
  const screenshot = await client.callTool('browser_screenshot', {
    fullPage: true
  });
  console.log('Screenshot captured:', screenshot.result.width, 'x', screenshot.result.height);

  // Disconnect
  await client.disconnect();
}

main().catch(console.error);
```

### Example 2: Web Scraping

```typescript
async function scrapeWebsite(url: string, selectors: Record<string, string>) {
  const client = new MCPClient({ /* config */ });
  await client.connect();
  await client.authenticate({ userId: 'scraper' });

  // Navigate
  await client.callTool('browser_navigate', { url });

  // Extract data
  const data: Record<string, string> = {};
  for (const [key, selector] of Object.entries(selectors)) {
    const result = await client.callTool('browser_get_text', { selector });
    data[key] = result.text;
  }

  await client.disconnect();
  return data;
}

// Usage
const data = await scrapeWebsite('https://example.com', {
  title: 'h1',
  description: 'p.description',
  author: '.author-name'
});

console.log(data);
```

### Example 3: Form Automation

```typescript
async function fillForm(url: string, fields: Record<string, string>) {
  const client = new MCPClient({ /* config */ });
  await client.connect();
  await client.authenticate({ userId: 'form-filler' });

  // Navigate to form
  await client.callTool('browser_navigate', { url });

  // Fill each field
  for (const [selector, value] of Object.entries(fields)) {
    await client.callTool('browser_type', {
      selector,
      text: value
    });
  }

  // Submit form
  await client.callTool('browser_click', {
    selector: 'button[type="submit"]'
  });

  // Take confirmation screenshot
  const screenshot = await client.callTool('browser_screenshot', {
    fullPage: true
  });

  await client.disconnect();
  return screenshot;
}

// Usage
await fillForm('https://example.com/contact', {
  '#name': 'John Doe',
  '#email': 'john@example.com',
  '#message': 'Hello from MCP!'
});
```

## Python Examples

### Example 1: Basic Usage

```python
from mcp_client import MCPClient

client = MCPClient(
    base_url='http://localhost:3000',
    auth_endpoint='/auth/demo-token'
)

# Authenticate
client.authenticate(user_id='demo-user')

# Navigate
result = client.call_tool('browser_navigate', {
    'url': 'https://example.com'
})
print(f"Navigated to: {result['result']['url']}")

# Screenshot
screenshot = client.call_tool('browser_screenshot', {
    'fullPage': True
})

# Save screenshot
import base64
image_data = base64.b64decode(screenshot['result']['screenshot'])
with open('screenshot.png', 'wb') as f:
    f.write(image_data)
```

### Example 2: Data Collection

```python
def collect_data(url, selectors):
    client = MCPClient(base_url='http://localhost:3000')
    client.authenticate(user_id='collector')
    
    # Navigate
    client.call_tool('browser_navigate', {'url': url})
    
    # Extract data
    data = {}
    for key, selector in selectors.items():
        result = client.call_tool('browser_get_text', {
            'selector': selector
        })
        data[key] = result['text']
    
    return data

# Usage
data = collect_data('https://example.com', {
    'title': 'h1',
    'description': 'p.description'
})
print(data)
```

## Common Patterns

### Pattern 1: Retry Logic

```typescript
async function callToolWithRetry(
  client: MCPClient,
  tool: string,
  params: any,
  maxRetries = 3
) {
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

### Pattern 2: Batch Processing

```typescript
async function processUrls(urls: string[]) {
  const client = new MCPClient({ /* config */ });
  await client.connect();
  await client.authenticate({ userId: 'batch-processor' });

  const results = [];
  for (const url of urls) {
    try {
      await client.callTool('browser_navigate', { url });
      const screenshot = await client.callTool('browser_screenshot', {});
      results.push({ url, success: true, screenshot });
    } catch (error) {
      results.push({ url, success: false, error: error.message });
    }
  }

  await client.disconnect();
  return results;
}
```

### Pattern 3: Wait and Check

```typescript
async function waitForElement(selector: string, timeout = 30000) {
  const client = new MCPClient({ /* config */ });
  await client.connect();
  await client.authenticate({ userId: 'waiter' });

  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    try {
      const result = await client.callTool('browser_get_text', { selector });
      if (result.text) {
        await client.disconnect();
        return result.text;
      }
    } catch (error) {
      // Element not found yet, wait and retry
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  await client.disconnect();
  throw new Error(`Element ${selector} not found within ${timeout}ms`);
}
```

## Next Steps

- [Advanced Workflows](./ADVANCED_WORKFLOWS.md)
- [Custom Tools](./CUSTOM_TOOLS.md)
- [API Reference](../specs/API_SPEC.md)
- [Publishing Guide](../guides/PUBLISHING.md)
