# Data Processor MCP (Agent 16)

## Overview

Process, transform, and analyze data

**Port:** 3016  
**Status:** ✅ COMPLETE  
**Browser Required:** No

## Architecture

This MCP server implements the Model Context Protocol (MCP) and provides 2 tools for data processor operations.

## Tools

### `transform_data`

Transform data structure

**Parameters:**
  - `data` (object): Input data
  - `transformation` (string): Transformation type

**Required:** data, transformation

**Example:**
```json
{
  "name": "transform_data",
  "arguments": {
    "data": "example_value",
    "transformation": "example_value"
  }
}
```


### `export_csv`

Export data to CSV

**Parameters:**
  - `data` (array): Data array
  - `filename` (string): Output filename

**Required:** data, filename

**Example:**
```json
{
  "name": "export_csv",
  "arguments": {
    "data": "example_value",
    "filename": "example_value"
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
docker build -t data-processing-mcp .
docker run -p 3016:3000 data-processing-mcp
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
  "agent": "agent-16-data-processing-mcp",
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
