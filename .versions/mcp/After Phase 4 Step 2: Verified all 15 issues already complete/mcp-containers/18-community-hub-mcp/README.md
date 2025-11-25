# Community Hub MCP (Agent 18)

## Overview

Share workflows and collaborate

**Port:** 3018  
**Status:** ✅ COMPLETE  
**Browser Required:** No

## Architecture

This MCP server implements the Model Context Protocol (MCP) and provides 2 tools for community hub operations.

## Tools

### `share_workflow`

Share workflow configuration

**Parameters:**
  - `workflowId` (string): Workflow ID
  - `visibility` (string): Public or private

**Required:** workflowId

**Example:**
```json
{
  "name": "share_workflow",
  "arguments": {
    "workflowId": "example_value"
  }
}
```


### `search_workflows`

Search community workflows

**Parameters:**
  - `query` (string): Search query

**Required:** query

**Example:**
```json
{
  "name": "search_workflows",
  "arguments": {
    "query": "example_value"
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
docker build -t community-hub-mcp .
docker run -p 3018:3000 community-hub-mcp
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
  "agent": "agent-18-community-hub-mcp",
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
