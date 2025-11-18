# MCP API Specification

## Overview

REST API specification for the Workstation MCP server endpoints.

**Base URL**: `http://localhost:3000` (development) | `https://your-domain.com` (production)  
**Protocol**: HTTP/1.1  
**Content-Type**: `application/json`  
**Authentication**: Bearer JWT token

## Authentication

### POST /auth/demo-token

Get a demonstration JWT token for testing.

**Request:**
```http
POST /auth/demo-token HTTP/1.1
Content-Type: application/json

{
  "userId": "test-user",
  "role": "user"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "24h"
}
```

**Status Codes:**
- `200 OK` - Token generated successfully
- `400 Bad Request` - Invalid request body
- `429 Too Many Requests` - Rate limit exceeded

## MCP Endpoints

### GET /api/v2/mcp/tools

List all available tools.

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "tools": [
    {
      "name": "browser_navigate",
      "description": "Navigate browser to a URL",
      "inputSchema": {
        "type": "object",
        "properties": {
          "url": { "type": "string", "description": "URL to navigate to" },
          "waitUntil": { "type": "string", "enum": ["load", "domcontentloaded", "networkidle"] }
        },
        "required": ["url"]
      }
    }
  ]
}
```

### POST /api/v2/mcp/tools/:toolName

Execute a specific tool.

**Path Parameters:**
- `toolName` - Name of the tool to execute

**Request:**
```http
POST /api/v2/mcp/tools/browser_navigate HTTP/1.1
Authorization: Bearer {token}
Content-Type: application/json

{
  "url": "https://example.com",
  "waitUntil": "networkidle"
}
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

**Status Codes:**
- `200 OK` - Tool executed successfully
- `400 Bad Request` - Invalid parameters
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Tool not found
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Execution error

### GET /api/v2/mcp/resources

List available resources.

**Response:**
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

### GET /api/v2/mcp/resources/:resourceName

Access resource data.

**Response varies by resource type.**

### GET /api/v2/mcp/prompts

List available prompts.

**Response:**
```json
{
  "prompts": [
    {
      "name": "scrape_website",
      "description": "Navigate to a website and extract structured data",
      "arguments": [
        { "name": "url", "description": "Website URL to scrape", "required": true },
        { "name": "selectors", "description": "CSS selectors for data extraction", "required": true }
      ]
    }
  ]
}
```

### POST /api/v2/mcp/prompts/:promptName

Execute a prompt.

**Request:**
```json
{
  "url": "https://example.com",
  "selectors": {
    "title": "h1",
    "description": "p.description"
  }
}
```

## Tool-Specific Endpoints

### Browser Tools

#### POST /api/v2/mcp/tools/browser_navigate
Navigate to a URL.

**Parameters:**
- `url` (string, required): URL to navigate to
- `waitUntil` (string, optional): "load" | "domcontentloaded" | "networkidle"

#### POST /api/v2/mcp/tools/browser_click
Click an element.

**Parameters:**
- `selector` (string, required): CSS selector
- `waitForSelector` (boolean, optional): Wait for element to be visible

#### POST /api/v2/mcp/tools/browser_type
Type text into an input.

**Parameters:**
- `selector` (string, required): CSS selector of input
- `text` (string, required): Text to type
- `delay` (number, optional): Milliseconds between keystrokes

#### POST /api/v2/mcp/tools/browser_screenshot
Take a screenshot.

**Parameters:**
- `fullPage` (boolean, optional): Capture full scrollable page
- `selector` (string, optional): Element to screenshot

**Response:**
```json
{
  "success": true,
  "result": {
    "screenshot": "base64-encoded-image-data",
    "width": 1280,
    "height": 720
  }
}
```

#### POST /api/v2/mcp/tools/browser_get_text
Extract text from element.

**Parameters:**
- `selector` (string, required): CSS selector

#### POST /api/v2/mcp/tools/browser_get_content
Get full page HTML.

**Parameters:** None

#### POST /api/v2/mcp/tools/browser_evaluate
Execute JavaScript.

**Parameters:**
- `script` (string, required): JavaScript code to execute

### Workflow Tools

#### POST /api/v2/mcp/tools/workflow_create
Create a new workflow.

**Parameters:**
- `name` (string, required): Workflow name
- `description` (string, optional): Workflow description
- `tasks` (array, required): Array of task objects

#### POST /api/v2/mcp/tools/workflow_execute
Execute a workflow.

**Parameters:**
- `workflowId` (string, required): Workflow ID
- `parameters` (object, optional): Runtime parameters

## Rate Limiting

All endpoints are rate-limited:

- **General endpoints**: 100 requests per 15 minutes
- **Auth endpoints**: 10 requests per 15 minutes

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Error Responses

All errors follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Additional context"
    }
  }
}
```

**Common Error Codes:**
- `AUTHENTICATION_REQUIRED` - Missing or invalid token
- `AUTHORIZATION_FAILED` - Insufficient permissions
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INVALID_PARAMETERS` - Invalid request parameters
- `TOOL_NOT_FOUND` - Requested tool doesn't exist
- `EXECUTION_ERROR` - Tool execution failed
- `INTERNAL_ERROR` - Server error

## Health Check

### GET /health

Check server health.

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime": 86400,
  "timestamp": "2024-01-01T12:00:00Z"
}
```

## Metrics

### GET /metrics

Get server metrics (requires authentication).

**Response:**
```json
{
  "requests": {
    "total": 10000,
    "success": 9500,
    "errors": 500
  },
  "tools": {
    "browser_navigate": 3000,
    "browser_screenshot": 2500
  },
  "performance": {
    "avgResponseTime": 450,
    "p95ResponseTime": 1200
  }
}
```

## WebSocket Support (Future)

WebSocket endpoint for real-time communication:

```
ws://localhost:8082/mcp
```

## CORS

Allowed origins configured via environment:

```
ALLOWED_ORIGINS=http://localhost:3000,https://your-domain.com
```

## Complete API Reference

For implementation details, see:
- [Publishing Guide](../guides/PUBLISHING.md)
- [API Usage Guide](../guides/API_USAGE.md)
- [Tool Examples](../examples/BASIC_USAGE.md)
