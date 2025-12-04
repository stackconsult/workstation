# Gemini AI Integration Guide

This guide explains how to integrate Gemini AI into the Workstation platform.

## Files Added

| File | Purpose |
|------|---------|
| `src/services/gemini-adapter.ts` | Gemini API wrapper with Zod validation |
| `src/routes/gemini.ts` | Express routes for Gemini endpoints |
| `public/gemini-dashboard.html` | Natural language workflow builder UI |
| `public/gemini-dashboard.js` | Client-side dashboard logic |

## Server Integration

Add to your main server file (e.g., `src/server.ts` or `src/app.ts`):

```typescript
// Import the Gemini routes
import geminiRouter from './routes/gemini';

// Register after other API routes
app.use('/api/gemini', geminiRouter);
```

## Environment Variables

Add to `.env`:

```bash
# Gemini Configuration
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-2.5-flash
GEMINI_ENDPOINT=https://generativelanguage.googleapis.com/v1beta
```

Get your API key at: https://makersuite.google.com/app/apikey

## API Endpoints

### POST /api/gemini/natural-workflow
Convert natural language to workflow JSON.

```bash
curl -X POST http://localhost:7042/api/gemini/natural-workflow \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"prompt": "Go to Google and search for AI"}'
```

### POST /api/gemini/generate-display
Generate HTML display for workflow results.

### POST /api/gemini/chat
Chat interface for workflow assistance.

### GET /api/gemini/status
Check Gemini configuration status.

## Usage

1. Start the server: `npm start`
2. Open: `http://localhost:7042/gemini-dashboard.html`
3. Type a natural language command like "Screenshot the homepage of hacker news"
4. Click Execute to run the generated workflow

## Existing Dependencies Used

The integration uses packages already in your `package.json`:
- `axios` - HTTP client for Gemini API
- `zod` - Request/response validation
- `winston` - Logging
- `express` - Route handling

No new dependencies required!
