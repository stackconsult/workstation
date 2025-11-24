# Performance Monitor MCP (Agent 08)

## Overview

Monitor and optimize performance metrics

**Port:** 3008  
**Status:** ✅ COMPLETE  
**Browser Required:** Yes

## Architecture

This MCP server implements the Model Context Protocol (MCP) and provides 3 tools for performance monitor operations.

## Tools

### `measure_load_time`

Measure page load performance

**Parameters:**
  - `url` (string): URL to measure

**Required:** url

**Example:**
```json
{
  "name": "measure_load_time",
  "arguments": {
    "url": "example_value"
  }
}
```


### `run_lighthouse`

Run Lighthouse audit

**Parameters:**
  - `url` (string): URL to audit
  - `categories` (array): Categories to test

**Required:** url

**Example:**
```json
{
  "name": "run_lighthouse",
  "arguments": {
    "url": "example_value"
  }
}
```


### `monitor_memory`

Monitor memory usage

**Parameters:**
  - `url` (string): URL to monitor
  - `duration` (number): Duration in seconds

**Required:** url, duration

**Example:**
```json
{
  "name": "monitor_memory",
  "arguments": {
    "url": "example_value",
    "duration": "example_value"
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
docker build -t performance-mcp .
docker run -p 3008:3000 performance-mcp
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
  "agent": "agent-08-performance-mcp",
  "uptime": 12345.67,
  "timestamp": "2025-11-17T10:00:00.000Z"
}
```

## Dependencies

- @modelcontextprotocol/sdk
- playwright
- lighthouse

## Testing

```bash
npm test
```

## Configuration

Environment variables:
- `NODE_ENV`: Environment (development/production)
- `MCP_SERVER_NAME`: Server name identifier
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`: Custom Chromium path (optional)

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
