# Integration Hub MCP (Agent 12)

## Overview

Connect to external APIs and services

**Port:** 3012  
**Status:** ✅ COMPLETE  
**Browser Required:** No

## Architecture

This MCP server implements the Model Context Protocol (MCP) and provides 2 tools for integration hub operations.

## Tools

### `call_api`

Make HTTP API request

**Parameters:**
  - `method` (string): HTTP method
  - `url` (string): API endpoint
  - `headers` (object): Request headers
  - `body` (object): Request body

**Required:** method, url

**Example:**
```json
{
  "name": "call_api",
  "arguments": {
    "method": "example_value",
    "url": "example_value"
  }
}
```


### `send_webhook`

Send webhook event

**Parameters:**
  - `webhookUrl` (string): Webhook URL
  - `payload` (object): Event payload

**Required:** webhookUrl, payload

**Example:**
```json
{
  "name": "send_webhook",
  "arguments": {
    "webhookUrl": "example_value",
    "payload": "example_value"
  }
}
```


## Installation

```bash
npm install
```

## Usage

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm run build
npm start
```

### Docker

```bash
docker build -t integration-mcp .
docker run -p 3012:3000 integration-mcp
```

## Health Check

The server exposes a health check endpoint at:

```
GET http://localhost:3000/health
```

Response:
```json
{
  "status": "healthy",
  "agent": "agent-12-integration-mcp",
  "uptime": 12345.67,
  "timestamp": "2025-11-17T10:00:00.000Z"
}
```

## Dependencies

- @modelcontextprotocol/sdk
- axios

## Testing

```bash
npm test
```

## Configuration

Environment variables:
- `NODE_ENV`: Environment (development/production)
- `MCP_SERVER_NAME`: Server name identifier


## Error Handling

All tools implement:
- Input validation via JSON schema
- Structured error responses
- Graceful degradation
- Retry logic with exponential backoff

## Monitoring

Metrics exposed via health endpoint:
- Server uptime
- Request count (coming soon)
- Error rate (coming soon)
- Average response time (coming soon)

## Contributing

See main project CONTRIBUTING.md

## License

ISC
