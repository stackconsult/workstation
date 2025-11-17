# Agent 1: CSS Selector Builder

Complete web automation selector generation, validation, and optimization system.

## Overview

Agent 1 provides a complete solution for creating, testing, and optimizing CSS selectors for web automation. It consists of three components:

1. **MCP Container** - MCP server with 5 specialized tools
2. **UI Dashboard** - React-based web interface
3. **Backend API** - Express REST API with Playwright

## Components

### MCP Container (`mcp-containers/01-selector-mcp/`)

MCP server exposing 5 tools:
- `generate_selector` - Generate CSS selectors from text or attributes
- `validate_selector` - Test selectors and get match counts
- `optimize_selector` - Create shorter, more robust selectors
- `extract_with_selector` - Extract data using selectors
- `monitor_selector_changes` - Track selector validity

**Start MCP Server:**
```bash
cd mcp-containers/01-selector-mcp
npm install
npm run build
npm start
```

**Health Check:** http://localhost:3001/health

### Backend API (`modules/01-selectors/backend/`)

REST API with Playwright browser automation:

**Endpoints:**
- `POST /api/selectors/generate` - Generate selector
- `POST /api/selectors/validate` - Validate selector
- `POST /api/selectors/optimize` - Optimize selector
- `POST /api/selectors/extract` - Extract data

**Start API:**
```bash
cd modules/01-selectors/backend
npm install
npm run build
npm start
```

**Health Check:** http://localhost:3000/health

### UI Dashboard (`modules/01-selectors/ui/`)

React TypeScript interface:
- URL input
- Target text specification
- Real-time selector generation
- One-click validation
- Copy to clipboard

**Start UI:**
```bash
cd modules/01-selectors/ui
npm install
npm run dev
```

**Access:** http://localhost:3001

## Usage Examples

### Generate Selector via API

```bash
curl -X POST http://localhost:3000/api/selectors/generate \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "targetText": "Click Here"
  }'
```

**Response:**
```json
{
  "selector": "#submit-button",
  "confidence": 0.9,
  "method": "text-match"
}
```

### Validate Selector

```bash
curl -X POST http://localhost:3000/api/selectors/validate \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "selector": "#submit-button"
  }'
```

**Response:**
```json
{
  "valid": true,
  "matchCount": 1,
  "sampleText": "Click Here",
  "selector": "#submit-button"
}
```

### Optimize Selector

```bash
curl -X POST http://localhost:3000/api/selectors/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "selector": "html > body > div > div > button.btn"
  }'
```

**Response:**
```json
{
  "original": "html > body > div > div > button.btn",
  "optimized": "button.btn",
  "improvement": 28
}
```

### Extract Data

```bash
curl -X POST http://localhost:3000/api/selectors/extract \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "selector": "h1",
    "extractType": "text"
  }'
```

**Response:**
```json
{
  "selector": "h1",
  "extractType": "text",
  "matchCount": 3,
  "results": ["Main Title", "Subtitle", "Section Header"]
}
```

## Architecture

### Technology Stack

**MCP Container:**
- TypeScript 5.3+
- @modelcontextprotocol/sdk 0.5+
- Playwright 1.40+
- Express 4.18+ (health check)

**Backend API:**
- TypeScript 5.3+
- Express 4.18+
- Playwright 1.40+
- Helmet (security)
- CORS
- Rate limiting

**UI Dashboard:**
- React 18.2+
- TypeScript 5.3+
- Vite 5.0+
- Axios 1.6+

### Selector Generation Algorithm

1. **ID Priority**: Check for element ID (most specific)
2. **Class Path**: Build path using classes
3. **nth-of-type**: Add position for uniqueness
4. **Parent Traversal**: Walk up DOM to root
5. **Path Assembly**: Join selectors with ` > `

### Optimization Strategy

1. **ID Check**: Use if available (`#id`)
2. **Test ID**: Check for `data-testid` attribute
3. **Class Simplification**: Use 1-2 most specific classes
4. **Position Fallback**: Use `nth-of-type` only when necessary

## Docker Deployment

**Build:**
```bash
docker build -f .docker/agent-base.Dockerfile -t agent-01-selector .
```

**Run:**
```bash
docker run -d -p 3000:3000 --name agent-01 agent-01-selector
```

**Health Check:**
```bash
docker exec agent-01 curl http://localhost:3000/health
```

## Testing

Tests TBD - Will include:
- Unit tests for selector generation logic
- Integration tests for API endpoints
- E2E tests for UI workflow
- Target: >90% coverage

## Security

- Rate limiting: 100 requests per 15 minutes
- Helmet security headers
- CORS configured
- Input validation on all endpoints
- Browser timeout: 30 seconds
- Browser isolation per request

## Performance

- Lazy browser initialization
- Browser reuse across requests
- Request timeout: 30 seconds
- Concurrent request handling
- Health check caching

## Monitoring

**Health Endpoints:**
- MCP: http://localhost:3001/health
- API: http://localhost:3000/health
- UI: http://localhost:3001 (Vite dev server)

**Metrics:**
- Request count
- Error rate
- Response time
- Browser pool status
- Memory usage

## Troubleshooting

**Browser Launch Fails:**
```bash
# Install Playwright browsers
npx playwright install chromium
```

**Port Already in Use:**
```bash
# Change port in .env
PORT=3010 npm start
```

**Timeout Errors:**
```bash
# Increase timeout in code
{ timeout: 60000 }
```

## Development

**Local Setup:**
```bash
# MCP Container
cd mcp-containers/01-selector-mcp
npm install && npm run dev

# Backend API
cd modules/01-selectors/backend
npm install && npm run dev

# UI Dashboard
cd modules/01-selectors/ui
npm install && npm run dev
```

**Build All:**
```bash
npm run build  # In each directory
```

## Contributing

1. Follow TypeScript strict mode
2. Add tests for new features
3. Update documentation
4. Test with real websites
5. Validate selectors before committing

## License

Part of Workstation Agent System - See root LICENSE

## Status

- ✅ MCP Container - Complete
- ✅ Backend API - Complete
- ✅ UI Dashboard - Complete
- ⏳ Tests - Pending
- ⏳ Docker - Pending
- ⏳ CI/CD - Pending
