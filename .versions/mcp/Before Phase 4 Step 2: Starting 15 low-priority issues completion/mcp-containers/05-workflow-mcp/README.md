# Workflow Orchestrator MCP (Agent 05)

## Overview

Coordinate multi-step automation workflows

**Port:** 3005  
**Status:** ✅ COMPLETE  
**Browser Required:** No

## Architecture

This MCP server implements the Model Context Protocol (MCP) and provides 3 tools for workflow orchestrator operations.

## Tools

### `create_workflow`

Define a new workflow with multiple steps

**Parameters:**
  - `name` (string): Workflow name
  - `steps` (array): Array of workflow steps
  - `schedule` (string): Cron schedule (optional)

**Required:** name, steps

**Example:**
```json
{
  "name": "create_workflow",
  "arguments": {
    "name": "example_value",
    "steps": "example_value"
  }
}
```


### `execute_workflow`

Execute a workflow by name or ID

**Parameters:**
  - `workflowId` (string): Workflow identifier

**Required:** workflowId

**Example:**
```json
{
  "name": "execute_workflow",
  "arguments": {
    "workflowId": "example_value"
  }
}
```


### `get_workflow_status`

Get the current status of a workflow

**Parameters:**
  - `workflowId` (string): Workflow identifier

**Required:** workflowId

**Example:**
```json
{
  "name": "get_workflow_status",
  "arguments": {
    "workflowId": "example_value"
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
docker build -t workflow-mcp .
docker run -p 3005:3000 workflow-mcp
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
  "agent": "agent-05-workflow-mcp",
  "uptime": 12345.67,
  "timestamp": "2025-11-17T10:00:00.000Z"
}
```

## Dependencies

- @modelcontextprotocol/sdk
- node-cron

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
