# Learning Platform MCP (Agent 17)

## Overview

Machine learning model training

**Port:** 3017  
**Status:** ✅ COMPLETE  
**Browser Required:** No

## Architecture

This MCP server implements the Model Context Protocol (MCP) and provides 2 tools for learning platform operations.

## Tools

### `train_model`

Train ML model

**Parameters:**
  - `modelType` (string): Model type
  - `trainingData` (array): Training dataset

**Required:** modelType, trainingData

**Example:**
```json
{
  "name": "train_model",
  "arguments": {
    "modelType": "example_value",
    "trainingData": "example_value"
  }
}
```


### `predict`

Make prediction

**Parameters:**
  - `modelId` (string): Model ID
  - `input` (object): Input data

**Required:** modelId, input

**Example:**
```json
{
  "name": "predict",
  "arguments": {
    "modelId": "example_value",
    "input": "example_value"
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
docker build -t learning-platform-mcp .
docker run -p 3017:3000 learning-platform-mcp
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
  "agent": "agent-17-learning-platform-mcp",
  "uptime": 12345.67,
  "timestamp": "2025-11-17T10:00:00.000Z"
}
```

## Dependencies

- @modelcontextprotocol/sdk
- natural

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
