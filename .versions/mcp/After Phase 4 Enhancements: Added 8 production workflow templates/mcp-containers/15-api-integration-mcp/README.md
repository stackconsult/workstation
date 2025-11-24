# API Integrator MCP (Agent 15)

## Overview

Build and test API integrations

**Port:** 3015  
**Status:** ✅ COMPLETE  
**Browser Required:** No

## Architecture

This MCP server implements the Model Context Protocol (MCP) and provides 2 tools for api integrator operations.

## Tools

### `test_endpoint`

Test API endpoint

**Parameters:**
  - `endpoint` (string): API endpoint
  - `method` (string): HTTP method

**Required:** endpoint, method

**Example:**
```json
{
  "name": "test_endpoint",
  "arguments": {
    "endpoint": "example_value",
    "method": "example_value"
  }
}
```


### `generate_client`

Generate API client code

**Parameters:**
  - `spec` (object): OpenAPI/Swagger spec

**Required:** spec

**Example:**
```json
{
  "name": "generate_client",
  "arguments": {
    "spec": "example_value"
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
docker build -t api-integration-mcp .
docker run -p 3015:3000 api-integration-mcp
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
  "agent": "agent-15-api-integration-mcp",
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
