# Code Quality MCP (Agent 07)

## Overview

Analyze code quality and enforce standards

**Port:** 3007  
**Status:** ✅ COMPLETE  
**Browser Required:** No

## Architecture

This MCP server implements the Model Context Protocol (MCP) and provides 3 tools for code quality operations.

## Tools

### `lint_code`

Run linter on code

**Parameters:**
  - `filePath` (string): Path to file or directory
  - `fix` (boolean): Auto-fix issues

**Required:** filePath

**Example:**
```json
{
  "name": "lint_code",
  "arguments": {
    "filePath": "example_value"
  }
}
```


### `check_types`

Run TypeScript type checking

**Parameters:**
  - `projectPath` (string): Project root path

**Required:** projectPath

**Example:**
```json
{
  "name": "check_types",
  "arguments": {
    "projectPath": "example_value"
  }
}
```


### `analyze_complexity`

Analyze code complexity

**Parameters:**
  - `filePath` (string): Path to file

**Required:** filePath

**Example:**
```json
{
  "name": "analyze_complexity",
  "arguments": {
    "filePath": "example_value"
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
docker build -t code-quality-mcp .
docker run -p 3007:3000 code-quality-mcp
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
  "agent": "agent-07-code-quality-mcp",
  "uptime": 12345.67,
  "timestamp": "2025-11-17T10:00:00.000Z"
}
```

## Dependencies

- @modelcontextprotocol/sdk
- eslint
- typescript

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
