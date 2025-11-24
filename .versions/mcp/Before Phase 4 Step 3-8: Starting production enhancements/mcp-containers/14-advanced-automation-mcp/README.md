# Advanced Automation MCP (Agent 14)

## Overview

Handle complex multi-page automation

**Port:** 3014  
**Status:** ✅ COMPLETE  
**Browser Required:** Yes

## Architecture

This MCP server implements the Model Context Protocol (MCP) and provides 2 tools for advanced automation operations.

## Tools

### `create_bot`

Define automation bot

**Parameters:**
  - `name` (string): Bot name
  - `actions` (array): Bot actions

**Required:** name, actions

**Example:**
```json
{
  "name": "create_bot",
  "arguments": {
    "name": "example_value",
    "actions": "example_value"
  }
}
```


### `schedule_task`

Schedule recurring task

**Parameters:**
  - `taskId` (string): Task ID
  - `schedule` (string): Cron expression

**Required:** taskId, schedule

**Example:**
```json
{
  "name": "schedule_task",
  "arguments": {
    "taskId": "example_value",
    "schedule": "example_value"
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
docker build -t advanced-automation-mcp .
docker run -p 3014:3000 advanced-automation-mcp
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
  "agent": "agent-14-advanced-automation-mcp",
  "uptime": 12345.67,
  "timestamp": "2025-11-17T10:00:00.000Z"
}
```

## Dependencies

- @modelcontextprotocol/sdk
- playwright
- node-cron

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
