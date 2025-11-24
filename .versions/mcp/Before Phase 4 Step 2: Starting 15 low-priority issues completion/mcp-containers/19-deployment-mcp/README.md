# Deployment Manager MCP (Agent 19)

## Overview

Manage deployments and releases

**Port:** 3019  
**Status:** ✅ COMPLETE  
**Browser Required:** No

## Architecture

This MCP server implements the Model Context Protocol (MCP) and provides 2 tools for deployment manager operations.

## Tools

### `deploy_container`

Deploy Docker container

**Parameters:**
  - `imageName` (string): Docker image name
  - `tag` (string): Image tag

**Required:** imageName, tag

**Example:**
```json
{
  "name": "deploy_container",
  "arguments": {
    "imageName": "example_value",
    "tag": "example_value"
  }
}
```


### `rollback_deployment`

Rollback to previous version

**Parameters:**
  - `deploymentId` (string): Deployment ID

**Required:** deploymentId

**Example:**
```json
{
  "name": "rollback_deployment",
  "arguments": {
    "deploymentId": "example_value"
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
docker build -t deployment-mcp .
docker run -p 3019:3000 deployment-mcp
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
  "agent": "agent-19-deployment-mcp",
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
