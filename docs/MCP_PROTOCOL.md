# Model Context Protocol (MCP) - Protocol Documentation

## Overview

The Model Context Protocol (MCP) is a standard communication protocol that enables AI agents (like GitHub Copilot) to interact with external tools and services. The Workstation project implements MCP to expose browser automation, workflow orchestration, and data processing capabilities to AI assistants.

## What is MCP?

MCP provides a standardized way for AI agents to:
- Discover available tools and capabilities
- Invoke tools with type-safe parameters
- Receive structured responses
- Access resources (files, APIs, databases)
- Maintain context across operations

### Key Concepts

1. **MCP Server** - Exposes tools and resources (Workstation is an MCP server)
2. **MCP Client** - Consumes tools (GitHub Copilot, Claude, etc.)
3. **Tools** - Discrete functions that can be invoked
4. **Resources** - Data sources that can be accessed
5. **Prompts** - Predefined interaction patterns

## Workstation MCP Implementation

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AI Assistant (MCP Client)                 │
│                  (GitHub Copilot, Claude)                    │
└─────────────────────────────────────────────────────────────┘
                            ↓ MCP Protocol
                     (JSON-RPC over stdio/HTTP)
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  Workstation MCP Server                      │
│                     (server.json)                            │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Tool Registry                            │  │
│  │  • Browser automation tools                          │  │
│  │  • Workflow execution tools                          │  │
│  │  • Data processing tools                             │  │
│  │  • Integration tools                                 │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            Resource Providers                         │  │
│  │  • Workflow templates                                │  │
│  │  • Execution history                                 │  │
│  │  • Agent capabilities                                │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│               Workstation Core Services                      │
│                                                              │
│  ┌────────────┬────────────┬────────────┬────────────┐     │
│  │  Browser   │  Workflow  │    Data    │ Integration│     │
│  │   Agent    │  Engine    │   Agents   │   Agents   │     │
│  └────────────┴────────────┴────────────┴────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### server.json Configuration

The `server.json` file at the repository root defines the MCP server:

```json
{
  "$schema": "https://modelcontextprotocol.io/schema/server.json",
  "name": "workstation-mcp-server",
  "version": "1.0.0",
  "description": "Browser automation and workflow orchestration with enterprise-grade security",
  "category": "automation",
  "runtime": {
    "type": "node",
    "command": "node",
    "args": ["dist/index.js"],
    "env": {
      "NODE_ENV": "production",
      "PORT": "3000"
    }
  },
  "capabilities": {
    "tools": true,
    "resources": true,
    "prompts": true
  }
}
```

## MCP Protocol Specification

### Communication Layer

MCP uses JSON-RPC 2.0 for communication:

```json
{
  "jsonrpc": "2.0",
  "id": "request-1",
  "method": "tools/call",
  "params": {
    "name": "browser_navigate",
    "arguments": {
      "url": "https://example.com"
    }
  }
}
```

Response:

```json
{
  "jsonrpc": "2.0",
  "id": "request-1",
  "result": {
    "success": true,
    "data": {
      "url": "https://example.com",
      "title": "Example Domain",
      "status": 200
    }
  }
}
```

### Transport Options

Workstation supports multiple transport mechanisms:

#### 1. Standard I/O (stdio)

Used by GitHub Copilot and Claude Desktop:

```typescript
// MCP Server runs as subprocess
// Communication via stdin/stdout
process.stdin.on('data', (data) => {
  const request = JSON.parse(data.toString());
  handleMCPRequest(request);
});

function sendResponse(response: any) {
  process.stdout.write(JSON.stringify(response) + '\n');
}
```

#### 2. HTTP/WebSocket

Used for web-based integrations:

```typescript
// HTTP endpoint
app.post('/mcp/invoke', async (req, res) => {
  const result = await handleMCPRequest(req.body);
  res.json(result);
});

// WebSocket for streaming
wss.on('connection', (ws) => {
  ws.on('message', async (data) => {
    const request = JSON.parse(data.toString());
    const result = await handleMCPRequest(request);
    ws.send(JSON.stringify(result));
  });
});
```

## Tool Definition Schema

### Tool Structure

Each tool exposed via MCP has:

1. **Name** - Unique identifier
2. **Description** - Human-readable description
3. **Input Schema** - JSON Schema for parameters
4. **Output Schema** - JSON Schema for results

Example:

```json
{
  "name": "browser_navigate",
  "description": "Navigate browser to a URL",
  "inputSchema": {
    "type": "object",
    "properties": {
      "url": {
        "type": "string",
        "format": "uri",
        "description": "The URL to navigate to"
      },
      "waitUntil": {
        "type": "string",
        "enum": ["load", "domcontentloaded", "networkidle"],
        "default": "load",
        "description": "When to consider navigation complete"
      }
    },
    "required": ["url"]
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean"
      },
      "url": {
        "type": "string"
      },
      "title": {
        "type": "string"
      },
      "status": {
        "type": "number"
      }
    }
  }
}
```

### Implementing MCP Tools in Workstation

#### Step 1: Define Tool Handler

Create `src/routes/mcp.ts`:

```typescript
import { Router } from 'express';
import { browserAgent } from '../automation/agents/browser';
import { Validator } from '../utils/validation';
import Joi from 'joi';

const router = Router();

interface MCPRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: any;
}

interface MCPResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

// Tool registry
const tools = {
  browser_navigate: {
    schema: Joi.object({
      url: Joi.string().uri().required(),
      waitUntil: Joi.string().valid('load', 'domcontentloaded', 'networkidle').default('load'),
    }),
    handler: async (params: any) => {
      const page = await browserAgent.launchBrowser();
      await page.goto(params.url, { waitUntil: params.waitUntil });
      return {
        success: true,
        url: page.url(),
        title: await page.title(),
      };
    },
  },
  workflow_execute: {
    schema: Joi.object({
      workflow_id: Joi.string().required(),
      variables: Joi.object().default({}),
    }),
    handler: async (params: any) => {
      // Execute workflow
      const result = await orchestrationEngine.executeWorkflow(params.workflow_id, params.variables);
      return result;
    },
  },
};

// MCP endpoint
router.post('/invoke', async (req, res) => {
  const request: MCPRequest = req.body;

  try {
    // Validate JSON-RPC request
    if (request.jsonrpc !== '2.0' || !request.method) {
      throw new Error('Invalid JSON-RPC request');
    }

    // Parse method
    if (request.method === 'tools/call') {
      const toolName = request.params?.name;
      const toolArgs = request.params?.arguments || {};

      const tool = tools[toolName];
      if (!tool) {
        throw new Error(`Unknown tool: ${toolName}`);
      }

      // Validate arguments
      const validated = Validator.validateOrThrow(toolArgs, tool.schema);

      // Execute tool
      const result = await tool.handler(validated);

      const response: MCPResponse = {
        jsonrpc: '2.0',
        id: request.id,
        result,
      };

      res.json(response);
    } else if (request.method === 'tools/list') {
      // Return available tools
      const toolList = Object.entries(tools).map(([name, tool]) => ({
        name,
        description: tool.schema.describe(),
      }));

      const response: MCPResponse = {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          tools: toolList,
        },
      };

      res.json(response);
    } else {
      throw new Error(`Unknown method: ${request.method}`);
    }
  } catch (error) {
    const response: MCPResponse = {
      jsonrpc: '2.0',
      id: request.id,
      error: {
        code: -32603,
        message: error.message,
      },
    };

    res.status(500).json(response);
  }
});

export default router;
```

#### Step 2: Register MCP Routes

Update `src/index.ts`:

```typescript
import mcpRoutes from './routes/mcp';

app.use('/mcp', mcpRoutes);
```

#### Step 3: Add Tool Metadata

Create `src/mcp/tools.ts`:

```typescript
export const toolDefinitions = [
  {
    name: 'browser_navigate',
    description: 'Navigate browser to a URL',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          format: 'uri',
          description: 'The URL to navigate to',
        },
        waitUntil: {
          type: 'string',
          enum: ['load', 'domcontentloaded', 'networkidle'],
          default: 'load',
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'browser_click',
    description: 'Click an element on the page',
    inputSchema: {
      type: 'object',
      properties: {
        selector: {
          type: 'string',
          description: 'CSS selector for the element',
        },
        timeout: {
          type: 'number',
          default: 30000,
          description: 'Timeout in milliseconds',
        },
      },
      required: ['selector'],
    },
  },
  {
    name: 'data_extract',
    description: 'Extract data from the current page',
    inputSchema: {
      type: 'object',
      properties: {
        selectors: {
          type: 'object',
          description: 'Map of field names to CSS selectors',
        },
      },
      required: ['selectors'],
    },
  },
  {
    name: 'workflow_execute',
    description: 'Execute a workflow by ID',
    inputSchema: {
      type: 'object',
      properties: {
        workflow_id: {
          type: 'string',
          description: 'The workflow ID to execute',
        },
        variables: {
          type: 'object',
          description: 'Workflow variables',
          default: {},
        },
      },
      required: ['workflow_id'],
    },
  },
];
```

## Resource Providers

Resources in MCP allow AI assistants to access data:

### Resource Schema

```typescript
interface Resource {
  uri: string; // Unique identifier (e.g., "workflow://template/web-scraping")
  name: string;
  description?: string;
  mimeType?: string;
}
```

### Implementing Resources

```typescript
// Resource provider for workflow templates
router.get('/resources/workflows', async (req, res) => {
  const templates = await workflowService.listTemplates();

  const resources = templates.map((template) => ({
    uri: `workflow://template/${template.id}`,
    name: template.name,
    description: template.description,
    mimeType: 'application/json',
  }));

  res.json({
    resources,
  });
});

// Resource content endpoint
router.get('/resources/content', async (req, res) => {
  const uri = req.query.uri as string;

  if (uri.startsWith('workflow://template/')) {
    const templateId = uri.replace('workflow://template/', '');
    const template = await workflowService.getTemplate(templateId);
    res.json(template);
  } else {
    res.status(404).json({ error: 'Resource not found' });
  }
});
```

## Prompts

Prompts provide predefined interaction patterns:

```typescript
export const prompts = [
  {
    name: 'web_scraping_workflow',
    description: 'Create a workflow to scrape data from a website',
    arguments: [
      {
        name: 'url',
        description: 'The URL to scrape',
        required: true,
      },
      {
        name: 'selectors',
        description: 'CSS selectors for data to extract',
        required: true,
      },
    ],
  },
  {
    name: 'automate_form_submission',
    description: 'Automate filling and submitting a web form',
    arguments: [
      {
        name: 'url',
        description: 'The form URL',
        required: true,
      },
      {
        name: 'formData',
        description: 'Data to fill in the form',
        required: true,
      },
    ],
  },
];
```

## Error Handling

MCP defines standard error codes:

```typescript
enum MCPErrorCode {
  ParseError = -32700,
  InvalidRequest = -32600,
  MethodNotFound = -32601,
  InvalidParams = -32602,
  InternalError = -32603,
}

function createMCPError(code: MCPErrorCode, message: string, data?: any): MCPResponse {
  return {
    jsonrpc: '2.0',
    id: null,
    error: {
      code,
      message,
      data,
    },
  };
}
```

## Security Considerations

### 1. Authentication

```typescript
import { authenticateToken } from '../auth/jwt';

router.post('/invoke', authenticateToken, async (req, res) => {
  // Request is authenticated
  // User info available in req.user
});
```

### 2. Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

const mcpLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many MCP requests',
});

router.post('/invoke', mcpLimiter, async (req, res) => {
  // Rate limited
});
```

### 3. Input Validation

```typescript
import { Validator } from '../utils/validation';

const validated = Validator.validateOrThrow(params, schema);
```

### 4. Sandboxing

**WARNING**: The example below uses vm2, which is deprecated and has known security vulnerabilities. 
For production use, consider these safer alternatives:

1. **isolated-vm** - Secure V8 isolate sandboxing
2. **quickjs** - Lightweight JavaScript engine
3. **Restricted API design** - Don't execute user code at all

```typescript
// DEPRECATED APPROACH (vm2 - do not use in production)
// Execute tools in isolated context
import { VM } from 'vm2';

const vm = new VM({
  timeout: 5000,
  sandbox: {
    result: null,
  },
});

const result = vm.run(userCode);

// RECOMMENDED APPROACH: Use isolated-vm
import ivm from 'isolated-vm';

async function executeSandboxed(code: string, timeout: number = 5000): Promise<any> {
  const isolate = new ivm.Isolate({ memoryLimit: 128 });
  const context = await isolate.createContext();
  
  const jail = context.global;
  await jail.set('global', jail.derefInto());
  
  try {
    const script = await isolate.compileScript(code);
    const result = await script.run(context, { timeout });
    return result;
  } finally {
    isolate.dispose();
  }
}

// BEST APPROACH: Avoid executing user code
// Instead, use a declarative configuration or limited DSL
interface ToolConfig {
  name: string;
  parameters: Record<string, unknown>;
  validations: Array<{
    field: string;
    rule: 'required' | 'email' | 'url' | 'number';
  }>;
}

function executeConfiguredTool(config: ToolConfig): any {
  // Execute predefined tools based on configuration
  // No arbitrary code execution
}
```

## Testing MCP Integration

### Unit Tests

```typescript
describe('MCP Tools', () => {
  it('should invoke browser_navigate tool', async () => {
    const request = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'browser_navigate',
        arguments: {
          url: 'https://example.com',
        },
      },
    };

    const response = await request(app).post('/mcp/invoke').send(request);

    expect(response.status).toBe(200);
    expect(response.body.result.success).toBe(true);
  });
});
```

### Integration Tests

```typescript
describe('MCP Integration', () => {
  it('should execute workflow via MCP', async () => {
    // Create workflow
    const workflow = await workflowService.createWorkflow({
      name: 'Test Workflow',
      definition: {
        tasks: [
          {
            name: 'navigate',
            agent_type: 'browser',
            action: 'navigate',
            parameters: { url: 'https://example.com' },
          },
        ],
      },
    });

    // Execute via MCP
    const request = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'workflow_execute',
        arguments: {
          workflow_id: workflow.id,
        },
      },
    };

    const response = await request(app).post('/mcp/invoke').send(request);

    expect(response.status).toBe(200);
    expect(response.body.result.status).toBe('completed');
  });
});
```

## Client Integration Examples

### GitHub Copilot

GitHub Copilot automatically discovers MCP servers via `server.json`:

```json
// .github/copilot-servers.json
{
  "workstation": {
    "command": "node",
    "args": ["dist/index.js"],
    "env": {
      "NODE_ENV": "production"
    }
  }
}
```

### Claude Desktop

Add to Claude config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "workstation": {
      "command": "node",
      "args": ["/path/to/workstation/dist/index.js"]
    }
  }
}
```

### Custom Client

```typescript
import { spawn } from 'child_process';

class MCPClient {
  private process: any;

  async connect() {
    this.process = spawn('node', ['dist/index.js']);

    this.process.stdout.on('data', (data) => {
      const response = JSON.parse(data.toString());
      this.handleResponse(response);
    });
  }

  async callTool(name: string, args: any): Promise<any> {
    const request = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name,
        arguments: args,
      },
    };

    this.process.stdin.write(JSON.stringify(request) + '\n');

    return new Promise((resolve) => {
      this.once('response', resolve);
    });
  }
}

// Usage
const client = new MCPClient();
await client.connect();

const result = await client.callTool('browser_navigate', {
  url: 'https://example.com',
});
```

## Best Practices

### 1. Tool Design

- **Atomic operations**: Each tool should do one thing well
- **Idempotent**: Tools should be safe to retry
- **Descriptive names**: Use clear, verb-based names
- **Comprehensive schemas**: Include all validation rules

### 2. Error Reporting

```typescript
try {
  const result = await executeTask(params);
  return { success: true, data: result };
} catch (error) {
  return {
    success: false,
    error: {
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message,
      details: error.details,
    },
  };
}
```

### 3. Performance

- Implement caching for frequently accessed resources
- Use streaming for large responses
- Set appropriate timeouts
- Monitor tool execution times

### 4. Documentation

- Provide detailed descriptions for tools
- Include examples in schemas
- Document expected behavior
- List common error scenarios

## Monitoring and Debugging

### Logging

```typescript
import { logger } from '../utils/logger';

router.post('/invoke', async (req, res) => {
  logger.info('MCP request received', {
    method: req.body.method,
    toolName: req.body.params?.name,
  });

  try {
    const result = await handleRequest(req.body);
    logger.info('MCP request completed', { result });
    res.json(result);
  } catch (error) {
    logger.error('MCP request failed', { error });
    res.status(500).json(createMCPError(-32603, error.message));
  }
});
```

### Health Checks

```typescript
import { healthCheckManager } from '../utils/health-check';

healthCheckManager.register({
  name: 'mcp-server',
  check: async () => {
    const toolCount = Object.keys(tools).length;
    return {
      healthy: toolCount > 0,
      message: `${toolCount} tools available`,
    };
  },
  critical: true,
});
```

## Resources

- [MCP Official Specification](https://modelcontextprotocol.io)
- [GitHub Copilot MCP Integration](https://docs.github.com/en/copilot/using-github-copilot/using-mcp-servers-with-github-copilot)
- [Workstation MCP Documentation](./.mcp/README.md)
- [Tool Definitions](../src/mcp/tools.ts)

## Next Steps

1. Review existing MCP implementation
2. Add custom tools for your use case
3. Test with MCP clients (GitHub Copilot, Claude)
4. Monitor usage and performance
5. Update documentation

## Support

For questions or issues:
- Review MCP specification
- Check troubleshooting guide
- Open an issue on GitHub
