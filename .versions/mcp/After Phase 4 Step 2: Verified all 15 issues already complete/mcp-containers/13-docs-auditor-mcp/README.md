# Docs Auditor MCP (Agent 13)

## Overview

Audit and improve documentation

**Port:** 3013  
**Status:** ✅ COMPLETE  
**Browser Required:** No

## Architecture

This MCP server implements the Model Context Protocol (MCP) and provides 2 tools for docs auditor operations.

## Tools

### `check_completeness`

Check documentation coverage

**Parameters:**
  - `projectPath` (string): Project path

**Required:** projectPath

**Example:**
```json
{
  "name": "check_completeness",
  "arguments": {
    "projectPath": "example_value"
  }
}
```


### `validate_links`

Validate documentation links

**Parameters:**
  - `docsPath` (string): Path to docs

**Required:** docsPath

**Example:**
```json
{
  "name": "validate_links",
  "arguments": {
    "docsPath": "example_value"
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
docker build -t docs-auditor-mcp .
docker run -p 3013:3000 docs-auditor-mcp
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
  "agent": "agent-13-docs-auditor-mcp",
  "uptime": 12345.67,
  "timestamp": "2025-11-17T10:00:00.000Z"
}
```

## Dependencies

- @modelcontextprotocol/sdk
- markdown-it

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
