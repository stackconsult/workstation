# Phase 1 Workflow Examples

This directory contains example workflow definitions for common automation tasks using Phase 1 browser automation capabilities.

## Quick Start

```bash
# Get token
TOKEN=$(curl http://localhost:3000/auth/demo-token | jq -r '.token')

# Create workflow from example
curl -X POST http://localhost:3000/api/v2/workflows \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @examples/workflows/google-search.json

# Execute workflow (replace WORKFLOW_ID)
curl -X POST http://localhost:3000/api/v2/workflows/WORKFLOW_ID/execute \
  -H "Authorization: Bearer $TOKEN" \
  -d '{}'
```

## Available Examples

1. **google-search.json** - Basic search automation
2. **web-scraper.json** - Content extraction

See [PHASE1_COMPLETE.md](../../PHASE1_COMPLETE.md) for full documentation.
