# Accessibility Checker MCP (Agent 11)

## Overview

Check accessibility standards (WCAG)

**Port:** 3011  
**Status:** ✅ COMPLETE  
**Browser Required:** Yes

## Architecture

This MCP server implements the Model Context Protocol (MCP) and provides 3 tools for accessibility checker operations.

## Tools

### `check_wcag`

Run WCAG compliance test

**Parameters:**
  - `url` (string): URL to test
  - `level` (string): WCAG level (A, AA, AAA)

**Required:** url

**Example:**
```json
{
  "name": "check_wcag",
  "arguments": {
    "url": "example_value"
  }
}
```


### `analyze_contrast`

Check color contrast ratios

**Parameters:**
  - `url` (string): URL to analyze

**Required:** url

**Example:**
```json
{
  "name": "analyze_contrast",
  "arguments": {
    "url": "example_value"
  }
}
```


### `check_aria`

Validate ARIA labels

**Parameters:**
  - `url` (string): URL to check

**Required:** url

**Example:**
```json
{
  "name": "check_aria",
  "arguments": {
    "url": "example_value"
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
docker build -t accessibility-mcp .
docker run -p 3011:3000 accessibility-mcp
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
  "agent": "agent-11-accessibility-mcp",
  "uptime": 12345.67,
  "timestamp": "2025-11-17T10:00:00.000Z"
}
```

## Dependencies

- @modelcontextprotocol/sdk
- playwright
- axe-core

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
