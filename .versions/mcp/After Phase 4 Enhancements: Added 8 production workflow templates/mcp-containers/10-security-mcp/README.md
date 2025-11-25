# Security Scanner MCP (Agent 10)

## Overview

Scan for security vulnerabilities

**Port:** 3010  
**Status:** ✅ COMPLETE  
**Browser Required:** No

## Architecture

This MCP server implements the Model Context Protocol (MCP) and provides 3 tools for security scanner operations.

## Tools

### `scan_dependencies`

Scan npm dependencies for vulnerabilities

**Parameters:**
  - `projectPath` (string): Project root path

**Required:** projectPath

**Example:**
```json
{
  "name": "scan_dependencies",
  "arguments": {
    "projectPath": "example_value"
  }
}
```


### `check_secrets`

Check for exposed secrets

**Parameters:**
  - `path` (string): Path to scan

**Required:** path

**Example:**
```json
{
  "name": "check_secrets",
  "arguments": {
    "path": "example_value"
  }
}
```


### `analyze_headers`

Analyze security headers

**Parameters:**
  - `url` (string): URL to analyze

**Required:** url

**Example:**
```json
{
  "name": "analyze_headers",
  "arguments": {
    "url": "example_value"
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
docker build -t security-mcp .
docker run -p 3010:3000 security-mcp
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
  "agent": "agent-10-security-mcp",
  "uptime": 12345.67,
  "timestamp": "2025-11-17T10:00:00.000Z"
}
```

## Dependencies

- @modelcontextprotocol/sdk

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
