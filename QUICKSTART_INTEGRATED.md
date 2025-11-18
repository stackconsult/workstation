# 🚀 Quick Start - Integrated Workstation

This document provides a quick overview of the fully integrated workstation platform.

## What's Included

The workstation platform now includes:

1. **JWT Authentication API** (Port 3000)
   - Express.js REST API
   - Token generation and verification
   - Rate limiting and security headers

2. **Agent Server** (Ports 8080, 8082)
   - WebSocket server for browser automation
   - HTTP API for task submission
   - Chrome DevTools Protocol (CDP) integration

3. **MCP Server** (Model Context Protocol)
   - Browser automation via CDP
   - Peelback recovery mechanism
   - Automatic rollback on failures

## Quick Start

### 1. Prerequisites

- Docker 20.10+
- Docker Compose v2.0+
- 4GB RAM (minimum)

### 2. Setup

```bash
# Clone repository
git clone https://github.com/creditXcredit/workstation.git
cd workstation

# Create environment file
cp .env.example .env

# Edit .env and set JWT_SECRET
nano .env
```

### 3. Run

**Option A: Quick Start Script (Recommended)**

```bash
./quick-start.sh
```

**Option B: Docker Compose**

```bash
docker-compose -f docker-compose.integrated.yml up -d
```

**Option C: Docker**

```bash
docker build -f Dockerfile.integrated -t workstation:latest .
docker run -d -p 3000:3000 -p 8080:8080 -p 8082:8082 \
  -e JWT_SECRET=your-secret-key \
  workstation:latest
```

### 4. Verify

```bash
# Check JWT Auth API
curl http://localhost:3000/health

# Get demo token
curl http://localhost:3000/auth/demo-token

# Test with token
TOKEN=$(curl -s http://localhost:3000/auth/demo-token | jq -r .token)
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/protected
```

## Service URLs

| Service | URL | Description |
|---------|-----|-------------|
| JWT Auth API | http://localhost:3000 | Authentication and protected routes |
| Agent Server HTTP | http://localhost:8080 | HTTP API for browser tasks |
| Agent Server WS | ws://localhost:8082 | WebSocket for real-time communication |

## Key Features

### JWT Authentication
- ✅ Token generation with custom claims
- ✅ Token verification middleware
- ✅ Rate limiting (100 req/15min)
- ✅ Security headers (Helmet, CORS)

### Browser Automation (Agent Server)
- ✅ WebSocket communication (JSON-RPC 2.0)
- ✅ Chrome DevTools Protocol integration
- ✅ Task submission and response handling
- ✅ Screenshot and content extraction

### MCP Integration
- ✅ Model Context Protocol server
- ✅ Peelback recovery (snapshots every 5 min)
- ✅ Automatic rollback on failures
- ✅ Configurable via mcp-config.yml

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Workstation Platform                    │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────┐  ┌───────────┐  ┌────────────┐           │
│  │ JWT Auth │  │   Agent   │  │    MCP     │           │
│  │   :3000  │  │ Server    │  │   Server   │           │
│  │          │  │ :8080/:82 │  │   :9222    │           │
│  └──────────┘  └───────────┘  └────────────┘           │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

## API Examples

### Get JWT Token

```bash
curl http://localhost:3000/auth/demo-token
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "24h"
}
```

### Access Protected Route

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/protected
```

### Submit Browser Task (Agent Server)

```bash
curl -X POST http://localhost:8080/v1/responses \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Navigate to google.com",
    "url": "about:blank",
    "wait_timeout": 5000,
    "model": {
      "main_model": {
        "provider": "openai",
        "model": "gpt-4",
        "api_key": "sk-..."
      }
    }
  }'
```

## Configuration

### Environment Variables

```env
# JWT Auth
JWT_SECRET=your-super-secret-key-minimum-32-chars
JWT_EXPIRATION=24h
PORT=3000

# Agent Server
AGENT_SERVER_WS_PORT=8082
AGENT_SERVER_HTTP_PORT=8080

# MCP / CDP
CDP_HOST=localhost
CDP_PORT=9222

# Security
ALLOWED_ORIGINS=http://localhost:3000
LOG_LEVEL=info
NODE_ENV=production
```

### MCP Configuration

Edit `mcp-config.yml` for advanced settings:

```yaml
mcp:
  recovery:
    peelback:
      enabled: true
      interval: 300000  # 5 minutes
    rollback:
      enabled: true
      strategy: "automatic"
```

## Rollback & Recovery

### Docker Image Rollback

```bash
# List available versions
docker images workstation

# Stop current
docker stop workstation

# Run previous version
docker run -d workstation:main-previous-sha
```

### MCP Snapshot Rollback

```bash
# List snapshots
docker exec workstation ls /app/data/snapshots

# Restore snapshot
docker exec workstation node /app/scripts/restore-snapshot.js snapshot-id
```

## Monitoring

### Health Checks

```bash
# JWT Auth
curl http://localhost:3000/health

# Check all services via Docker
docker ps --filter "name=workstation"

# View logs
docker logs -f workstation
```

### Metrics

MCP metrics available at:
```bash
curl http://localhost:8080/metrics
```

## Troubleshooting

### Port Already in Use

```bash
# Find process
lsof -i :3000

# Use different port
docker run -p 4000:3000 ...
```

### Agent Server Not Connecting

```bash
# Check logs
docker logs workstation | grep "Agent Server"

# Verify port
docker port workstation 8082
```

### MCP/CDP Connection Failed

Ensure Chrome is running with remote debugging:

```bash
# macOS
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --remote-debugging-port=9222 \
  --remote-allow-origins="*"
```

## Documentation

- 📖 [Full Deployment Guide](DEPLOYMENT_INTEGRATED.md)
- 🏗️ [Architecture](ARCHITECTURE.md)
- 🔒 [Security](SECURITY.md)
- 📚 [API Documentation](API.md)
- 🐛 [Troubleshooting](DEPLOYMENT_INTEGRATED.md#troubleshooting)

## Next Steps

1. **Set up Chrome for MCP**: See [DEPLOYMENT_INTEGRATED.md](DEPLOYMENT_INTEGRATED.md#mcp-setup)
2. **Configure security**: Review [SECURITY.md](SECURITY.md)
3. **Customize MCP**: Edit [mcp-config.yml](mcp-config.yml)
4. **Monitor services**: Check health endpoints and logs

## Support

- **Issues**: https://github.com/creditXcredit/workstation/issues
- **Discussions**: https://github.com/creditXcredit/workstation/discussions
- **Documentation**: https://github.com/creditXcredit/workstation

---

**Version**: 1.0.0  
**Last Updated**: 2025-11-17
