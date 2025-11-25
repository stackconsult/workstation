# Error Tracker MCP (Agent 09)

## Overview

Aggregate and analyze errors across system

**Port:** 3009  
**Status:** ✅ COMPLETE  
**Browser Required:** No

## Architecture

This MCP server implements the Model Context Protocol (MCP) and provides 3 tools for error tracker operations.

## Tools

### `log_error`

Log a structured error

**Parameters:**
  - `level` (string): Error level
  - `message` (string): Error message
  - `context` (object): Error context

**Required:** level, message

**Example:**
```json
{
  "name": "log_error",
  "arguments": {
    "level": "example_value",
    "message": "example_value"
  }
}
```


### `query_errors`

Query error logs

**Parameters:**
  - `startDate` (string): Start date
  - `endDate` (string): End date
  - `level` (string): Filter by level

**Required:** none

**Example:**
```json
{
  "name": "query_errors",
  "arguments": {
    
  }
}
```


### `get_error_stats`

Get error statistics

**Parameters:**
  - `period` (string): Time period (day, week, month)

**Required:** period

**Example:**
```json
{
  "name": "get_error_stats",
  "arguments": {
    "period": "example_value"
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
docker build -t error-tracker-mcp .
docker run -p 3009:3000 error-tracker-mcp
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
  "agent": "agent-09-error-tracker-mcp",
  "uptime": 12345.67,
  "timestamp": "2025-11-17T10:00:00.000Z"
}
```

## Dependencies

- @modelcontextprotocol/sdk
- winston
- sqlite3

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
