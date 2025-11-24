# Project Builder MCP (Agent 06)

## Overview

Generate project structures and boilerplate code

**Port:** 3006  
**Status:** ✅ COMPLETE  
**Browser Required:** No

## Architecture

This MCP server implements the Model Context Protocol (MCP) and provides 3 tools for project builder operations.

## Tools

### `scaffold_project`

Create a new project structure

**Parameters:**
  - `projectType` (string): Type of project (node, react, etc)
  - `projectName` (string): Project name
  - `outputDir` (string): Output directory

**Required:** projectType, projectName, outputDir

**Example:**
```json
{
  "name": "scaffold_project",
  "arguments": {
    "projectType": "example_value",
    "projectName": "example_value",
    "outputDir": "example_value"
  }
}
```


### `generate_component`

Generate a code component

**Parameters:**
  - `componentType` (string): Component type
  - `componentName` (string): Component name

**Required:** componentType, componentName

**Example:**
```json
{
  "name": "generate_component",
  "arguments": {
    "componentType": "example_value",
    "componentName": "example_value"
  }
}
```


### `add_dependency`

Add npm dependency to project

**Parameters:**
  - `packageName` (string): Package name
  - `version` (string): Package version (optional)

**Required:** packageName

**Example:**
```json
{
  "name": "add_dependency",
  "arguments": {
    "packageName": "example_value"
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
docker build -t project-builder-mcp .
docker run -p 3006:3000 project-builder-mcp
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
  "agent": "agent-06-project-builder-mcp",
  "uptime": 12345.67,
  "timestamp": "2025-11-17T10:00:00.000Z"
}
```

## Dependencies

- @modelcontextprotocol/sdk
- fs-extra

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
