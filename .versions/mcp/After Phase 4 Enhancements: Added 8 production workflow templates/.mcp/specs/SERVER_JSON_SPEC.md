# server.json Specification

## 📋 Complete Reference for MCP Server Metadata

The `server.json` file is the canonical source of truth for MCP server metadata. It describes your server's capabilities, configuration, and integration requirements.

## Schema

```json
{
  "$schema": "https://modelcontextprotocol.io/schemas/server.json"
}
```

## Required Fields

### name (string, required)

Unique identifier for your server. Should be lowercase, hyphen-separated.

```json
{
  "name": "workstation-mcp-server"
}
```

**Rules:**
- Lowercase only
- Use hyphens, not underscores or spaces
- Prefix with organization: `org-server-type`
- Maximum 64 characters

### version (string, required)

Semantic version number following [SemVer](https://semver.org/).

```json
{
  "version": "1.0.0"
}
```

**Format:** `MAJOR.MINOR.PATCH`
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes

### description (string, required)

Clear, concise description of your server's purpose.

```json
{
  "description": "Browser automation MCP server with JWT authentication"
}
```

**Best Practices:**
- Keep under 200 characters
- Focus on primary capability
- Mention key features
- Avoid marketing language

### capabilities (object, required)

Defines tools, resources, and prompts your server provides.

```json
{
  "capabilities": {
    "tools": [...],
    "resources": [...],
    "prompts": [...]
  }
}
```

## Capabilities Schema

### capabilities.tools (array)

Executable actions clients can invoke.

```json
{
  "tools": [
    {
      "name": "browser_navigate",
      "description": "Navigate browser to a URL",
      "inputSchema": {
        "type": "object",
        "properties": {
          "url": {
            "type": "string",
            "description": "URL to navigate to"
          }
        },
        "required": ["url"]
      }
    }
  ]
}
```

**Tool Object:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✅ | Unique tool identifier |
| `description` | string | ✅ | What the tool does |
| `inputSchema` | object | ✅ | JSON Schema for parameters |
| `outputSchema` | object | ❌ | JSON Schema for results |

**inputSchema** must be valid [JSON Schema](https://json-schema.org/):

```json
{
  "type": "object",
  "properties": {
    "param1": {
      "type": "string",
      "description": "Parameter description",
      "enum": ["option1", "option2"],
      "default": "option1"
    },
    "param2": {
      "type": "number",
      "minimum": 0,
      "maximum": 100
    }
  },
  "required": ["param1"]
}
```

### capabilities.resources (array)

Data sources clients can access.

```json
{
  "resources": [
    {
      "name": "workflows",
      "description": "Access to saved workflows",
      "mimeType": "application/json",
      "uri": "mcp://workstation/resources/workflows"
    }
  ]
}
```

**Resource Object:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✅ | Resource identifier |
| `description` | string | ✅ | What data is available |
| `mimeType` | string | ✅ | Content type |
| `uri` | string | ❌ | Resource URI pattern |

**Common MIME Types:**
- `application/json` - JSON data
- `text/html` - HTML content
- `text/plain` - Plain text
- `image/png` - PNG images
- `image/jpeg` - JPEG images

### capabilities.prompts (array)

Pre-configured automation templates.

```json
{
  "prompts": [
    {
      "name": "scrape_website",
      "description": "Extract data from a website",
      "arguments": [
        {
          "name": "url",
          "description": "Website URL",
          "required": true
        },
        {
          "name": "selectors",
          "description": "CSS selectors for extraction",
          "required": true
        }
      ]
    }
  ]
}
```

**Prompt Object:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✅ | Prompt identifier |
| `description` | string | ✅ | What the prompt does |
| `arguments` | array | ✅ | Required/optional parameters |

## Optional Fields

### author (object)

Server author information.

```json
{
  "author": {
    "name": "creditXcredit",
    "email": "support@example.com",
    "url": "https://github.com/creditXcredit"
  }
}
```

### license (string)

Software license identifier.

```json
{
  "license": "MIT"
}
```

Common licenses: `MIT`, `Apache-2.0`, `ISC`, `GPL-3.0`, `BSD-3-Clause`

### homepage (string)

Project homepage URL.

```json
{
  "homepage": "https://github.com/creditXcredit/workstation"
}
```

### repository (object)

Source code repository.

```json
{
  "repository": {
    "type": "git",
    "url": "git+https://github.com/creditXcredit/workstation.git"
  }
}
```

### bugs (object)

Issue tracking information.

```json
{
  "bugs": {
    "url": "https://github.com/creditXcredit/workstation/issues",
    "email": "bugs@example.com"
  }
}
```

### keywords (array)

Searchable tags.

```json
{
  "keywords": [
    "mcp",
    "browser-automation",
    "playwright",
    "jwt-auth"
  ]
}
```

### categories (array)

Classification categories.

```json
{
  "categories": [
    "browser-automation",
    "workflow-orchestration",
    "testing"
  ]
}
```

**Standard Categories:**
- `browser-automation`
- `data-processing`
- `workflow-orchestration`
- `ai-agents`
- `web-scraping`
- `testing`
- `monitoring`
- `integration`

## Configuration Object

### config.transport

How clients connect to your server.

```json
{
  "config": {
    "transport": {
      "type": "http",
      "baseUrl": "http://localhost:3000",
      "endpoints": {
        "tools": "/api/v2/mcp/tools",
        "resources": "/api/v2/mcp/resources",
        "prompts": "/api/v2/mcp/prompts"
      }
    }
  }
}
```

**Transport Types:**
- `http` - HTTP/HTTPS REST API
- `websocket` - WebSocket connection
- `stdio` - Standard input/output
- `ipc` - Inter-process communication

### config.authentication

Authentication requirements.

```json
{
  "config": {
    "authentication": {
      "type": "bearer",
      "tokenEndpoint": "/auth/demo-token",
      "refreshEndpoint": "/auth/refresh"
    }
  }
}
```

**Authentication Types:**
- `none` - No authentication
- `bearer` - Bearer token (JWT)
- `basic` - HTTP Basic Auth
- `api-key` - API key header
- `oauth2` - OAuth 2.0

### config.rateLimit

Rate limiting configuration.

```json
{
  "config": {
    "rateLimit": {
      "maxRequests": 100,
      "windowMs": 900000,
      "message": "Rate limit exceeded"
    }
  }
}
```

## Runtime Information

### runtime

Language and dependencies.

```json
{
  "runtime": {
    "language": "typescript",
    "node": ">=18.0.0",
    "dependencies": {
      "express": "^4.18.2",
      "playwright": "^1.56.1"
    }
  }
}
```

## Deployment Information

### deployment

Deployment options and configurations.

```json
{
  "deployment": {
    "docker": {
      "image": "ghcr.io/creditxcredit/workstation",
      "ports": [3000]
    },
    "railway": {
      "template": "https://railway.app/template/stackbrowseragent"
    },
    "kubernetes": {
      "chart": "https://charts.example.com/workstation"
    }
  }
}
```

## Documentation Links

### documentation

Links to documentation resources.

```json
{
  "documentation": {
    "quickstart": "https://github.com/.../START_HERE.md",
    "api": "https://github.com/.../API.md",
    "architecture": "https://github.com/.../ARCHITECTURE.md",
    "examples": "https://github.com/.../examples"
  }
}
```

## Validation

### Required Validation

Your `server.json` must pass these checks:

1. **Valid JSON**: No syntax errors
2. **Required fields present**: name, version, description, capabilities
3. **Valid SemVer**: Version follows semantic versioning
4. **Valid JSON Schemas**: All inputSchema objects are valid
5. **Unique names**: Tool, resource, and prompt names are unique
6. **Valid URLs**: All URL fields are properly formatted

### Validation Commands

```bash
# Validate JSON syntax
node -e "JSON.parse(require('fs').readFileSync('server.json', 'utf8'))"

# Validate against schema
npx ajv-cli validate -s schema.json -d server.json

# MCP CLI validation
mcp-cli validate server.json
```

## Best Practices

### 1. Tool Design

**Good tool design:**
- Single responsibility
- Clear input/output
- Descriptive names
- Comprehensive schemas

**Example:**

```json
{
  "name": "browser_screenshot",
  "description": "Capture a screenshot of the current page or specific element",
  "inputSchema": {
    "type": "object",
    "properties": {
      "fullPage": {
        "type": "boolean",
        "description": "Capture full scrollable page",
        "default": false
      },
      "selector": {
        "type": "string",
        "description": "CSS selector for specific element"
      },
      "quality": {
        "type": "number",
        "minimum": 0,
        "maximum": 100,
        "description": "JPEG quality (0-100)",
        "default": 80
      }
    }
  }
}
```

### 2. Schema Completeness

Always include:
- Property descriptions
- Type constraints
- Default values
- Validation rules
- Examples in descriptions

### 3. Versioning Strategy

- **Patch (1.0.X)**: Bug fixes, no API changes
- **Minor (1.X.0)**: New tools/features, backward compatible
- **Major (X.0.0)**: Breaking changes, renamed tools, removed capabilities

### 4. Documentation

Link to:
- Getting started guide
- API reference
- Usage examples
- Architecture overview
- Support channels

## Examples

### Minimal server.json

```json
{
  "name": "my-mcp-server",
  "version": "1.0.0",
  "description": "Simple MCP server",
  "capabilities": {
    "tools": [
      {
        "name": "hello",
        "description": "Say hello",
        "inputSchema": {
          "type": "object",
          "properties": {
            "name": { "type": "string" }
          },
          "required": ["name"]
        }
      }
    ]
  },
  "config": {
    "transport": {
      "type": "http",
      "baseUrl": "http://localhost:3000"
    }
  }
}
```

### Complete server.json

See [root server.json](../../server.json) for a full-featured example.

## Schema Reference

Full JSON Schema for `server.json`:

```
https://modelcontextprotocol.io/schemas/server.json
```

## Support

- [MCP Protocol Documentation](https://modelcontextprotocol.io)
- [Publishing Guide](../guides/PUBLISHING.md)
- [API Specification](./API_SPEC.md)
- [GitHub Issues](https://github.com/creditXcredit/workstation/issues)
