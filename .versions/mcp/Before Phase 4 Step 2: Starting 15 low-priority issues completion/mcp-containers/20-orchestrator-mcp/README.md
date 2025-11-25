# Master Orchestrator MCP (Agent 20)

## Overview

Coordinate all agents and MCPs

**Port:** 3020  
**Status:** ✅ COMPLETE  
**Browser Required:** No

## Architecture

This MCP server implements the Model Context Protocol (MCP) and provides 3 tools for master orchestrator operations.

## Tools

### `route_request`

Route request to appropriate MCP

**Parameters:**
  - `targetMcp` (string): Target MCP name
  - `tool` (string): Tool to execute
  - `args` (object): Tool arguments

**Required:** targetMcp, tool, args

**Example:**
```json
{
  "name": "route_request",
  "arguments": {
    "targetMcp": "example_value",
    "tool": "example_value",
    "args": "example_value"
  }
}
```


### `health_check_all`

Check health of all MCPs

**Parameters:**
  

**Required:** none

**Example:**
```json
{
  "name": "health_check_all",
  "arguments": {
    
  }
}
```


### `coordinate_workflow`

Execute multi-MCP workflow

**Parameters:**
  - `workflow` (object): Workflow definition

**Required:** workflow

**Example:**
```json
{
  "name": "coordinate_workflow",
  "arguments": {
    "workflow": "example_value"
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
docker build -t orchestrator-mcp .
docker run -p 3020:3000 orchestrator-mcp
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
  "agent": "agent-20-orchestrator-mcp",
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
