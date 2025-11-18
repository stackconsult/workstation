# Workstation Deployment Guide
## Browser Automation Platform with JWT Authentication, Agent Server, and MCP

This guide covers deployment of the fully integrated workstation platform with all components.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Quick Start](#quick-start)
4. [Configuration](#configuration)
5. [Docker Deployment](#docker-deployment)
6. [MCP Setup](#mcp-setup)
7. [Health Checks & Monitoring](#health-checks--monitoring)
8. [Rollback & Recovery](#rollback--recovery)
9. [Build Documentation](#build-documentation)
10. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

The workstation platform consists of three main components:

```
┌─────────────────────────────────────────────────────────────┐
│                    Workstation Platform                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  JWT Auth    │  │ Agent Server │  │  MCP Server  │      │
│  │   API        │  │  (WebSocket) │  │   (CDP)      │      │
│  │  Port 3000   │  │  Port 8082   │  │  Port 9222   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                           │                                  │
│                    HTTP API (8080)                           │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Components

1. **JWT Auth API (Port 3000)**
   - Express.js REST API
   - JWT token generation and verification
   - Rate limiting and security headers
   - Health check endpoints

2. **Agent Server (Ports 8080, 8082)**
   - WebSocket server for browser agent communication
   - HTTP API for task submission
   - Chrome DevTools Protocol (CDP) integration
   - JSON-RPC 2.0 support

3. **MCP Server (Port 9222)**
   - Model Context Protocol server
   - Browser automation via CDP
   - Peelback recovery mechanism
   - Automatic rollback on failures

---

## Prerequisites

### System Requirements

- **CPU**: 2+ cores recommended
- **RAM**: 4GB minimum, 8GB recommended
- **Disk**: 5GB free space
- **OS**: Linux, macOS, or Windows with Docker

### Software Requirements

- **Docker**: 20.10+ and Docker Compose v2.0+
- **Node.js**: 18+ (for local development)
- **Git**: For cloning repository
- **Chrome/Chromium**: For MCP browser automation (can run in Docker)

---

## Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/creditXcredit/workstation.git
cd workstation
```

### 2. Environment Setup

Create `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Main Application
NODE_ENV=production
PORT=3000
JWT_SECRET=your-super-secret-key-minimum-32-characters
JWT_EXPIRATION=24h
LOG_LEVEL=info

# Agent Server
AGENT_SERVER_WS_PORT=8082
AGENT_SERVER_HTTP_PORT=8080
AGENT_SERVER_HOST=0.0.0.0

# Chrome DevTools Protocol (MCP)
CDP_HOST=host.docker.internal
CDP_PORT=9222

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080
```

### 3. Build Docker Image

```bash
docker build -f Dockerfile.integrated -t workstation:latest .
```

### 4. Start Services

Using Docker Compose (recommended):

```bash
docker-compose -f docker-compose.integrated.yml up -d
```

Or using Docker directly:

```bash
docker run -d \
  --name workstation \
  -p 3000:3000 \
  -p 8080:8080 \
  -p 8082:8082 \
  -e JWT_SECRET=your-secret-key \
  workstation:latest
```

### 5. Verify Deployment

Check all services are running:

```bash
# JWT Auth API
curl http://localhost:3000/health

# Get demo token
curl http://localhost:3000/auth/demo-token

# Agent Server (if status endpoint exists)
curl http://localhost:8080/status
```

---

## Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment mode | `development` | No |
| `PORT` | JWT Auth API port | `3000` | No |
| `JWT_SECRET` | JWT signing secret | - | **Yes** |
| `JWT_EXPIRATION` | Token expiration | `24h` | No |
| `AGENT_SERVER_WS_PORT` | Agent WebSocket port | `8082` | No |
| `AGENT_SERVER_HTTP_PORT` | Agent HTTP API port | `8080` | No |
| `CDP_HOST` | Chrome DevTools host | `localhost` | No |
| `CDP_PORT` | Chrome DevTools port | `9222` | No |
| `LOG_LEVEL` | Logging level | `info` | No |
| `ALLOWED_ORIGINS` | CORS origins | `*` | No |

### MCP Configuration

Edit `mcp-config.yml` for advanced MCP settings:

```yaml
mcp:
  cdp:
    host: "localhost"
    port: 9222
    timeout: 30000
  recovery:
    peelback:
      enabled: true
      interval: 300000  # 5 minutes
    rollback:
      enabled: true
      strategy: "automatic"
```

---

## Docker Deployment

### Multi-Stage Build Process

The integrated Dockerfile uses a 3-stage build:

1. **Builder Stage**: Compiles TypeScript application
2. **Agent-Server Stage**: Prepares agent server dependencies
3. **Production Stage**: Combines all components with Alpine Linux base

### Image Tags

Images are automatically tagged with:

```bash
# Latest version
workstation:latest

# Git commit
workstation:main-<commit-sha>

# Semantic version (for releases)
workstation:1.0.0
```

### Rollback to Previous Version

```bash
# List available images
docker images workstation

# Stop current container
docker stop workstation

# Start previous version
docker run -d --name workstation workstation:main-abc1234
```

---

## MCP Setup

### Running Chrome with Remote Debugging

For MCP to work, Chrome must be running with remote debugging enabled:

#### macOS

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --remote-debugging-port=9222 \
  --remote-allow-origins="*" \
  --user-data-dir=/tmp/chrome-debug
```

#### Linux

```bash
google-chrome \
  --remote-debugging-port=9222 \
  --remote-allow-origins="*" \
  --user-data-dir=/tmp/chrome-debug
```

#### Windows

```bash
"C:\Program Files\Google\Chrome\Application\chrome.exe" \
  --remote-debugging-port=9222 \
  --remote-allow-origins="*" \
  --user-data-dir=C:\temp\chrome-debug
```

#### Docker (Headless)

Uncomment the `chrome` service in `docker-compose.integrated.yml`:

```yaml
chrome:
  image: browserless/chrome:latest
  ports:
    - "9222:9222"
```

Then restart:

```bash
docker-compose -f docker-compose.integrated.yml up -d
```

---

## Health Checks & Monitoring

### Health Check Endpoints

```bash
# JWT Auth API Health
curl http://localhost:3000/health

# Response:
{
  "status": "healthy",
  "timestamp": "2025-11-17T12:00:00.000Z",
  "uptime": 3600,
  "version": "1.0.0"
}
```

### Service Status

Check all services are running:

```bash
docker ps --filter "name=workstation"
```

### Logs

View combined logs:

```bash
docker logs -f workstation
```

View specific service logs:

```bash
# JWT Auth logs
docker exec workstation tail -f /app/logs/application.log

# Agent Server logs
docker exec workstation tail -f /app/agent-server/logs/agent-server.log
```

---

## Rollback & Recovery

### Automatic Recovery (Peelback)

The MCP server includes automatic peelback recovery:

- **Snapshots**: Created every 5 minutes (configurable)
- **Automatic Rollback**: Triggered on critical errors
- **Max Snapshots**: 10 (configurable)

### Manual Rollback

#### 1. Via Docker Image

```bash
# Stop current version
docker stop workstation
docker rm workstation

# Start previous version
docker run -d \
  --name workstation \
  -p 3000:3000 -p 8080:8080 -p 8082:8082 \
  -e JWT_SECRET=your-secret \
  workstation:main-previous-commit-sha
```

#### 2. Via Snapshot

```bash
# List available snapshots
docker exec workstation ls -la /app/data/snapshots

# Restore from snapshot
docker exec workstation node /app/scripts/restore-snapshot.js snapshot-id
```

### Rollback Verification

After rollback, verify all services:

```bash
# Check health
curl http://localhost:3000/health

# Test token generation
curl http://localhost:3000/auth/demo-token

# Test agent server
curl http://localhost:8080/status
```

---

## Troubleshooting

### Common Issues

#### 1. Port Already in Use

**Error**: `Error starting userland proxy: listen tcp4 0.0.0.0:3000: bind: address already in use`

**Solution**:
```bash
# Find process using port
lsof -i :3000
# Kill process or use different port
docker run -p 4000:3000 ...
```

#### 2. JWT Auth Fails

**Error**: `jwt malformed` or `invalid signature`

**Solution**:
- Verify `JWT_SECRET` is set and matches
- Regenerate token: `curl http://localhost:3000/auth/demo-token`

#### 3. Agent Server Not Connecting

**Error**: WebSocket connection refused

**Solution**:
```bash
# Check agent server is running
docker exec workstation ps aux | grep node

# Check logs
docker logs workstation | grep "Agent Server"

# Verify port is exposed
docker port workstation 8082
```

#### 4. MCP/CDP Connection Failed

**Error**: `Unable to connect to CDP at localhost:9222`

**Solution**:
- Ensure Chrome is running with `--remote-debugging-port=9222`
- Check firewall allows port 9222
- If using Docker, verify `CDP_HOST=host.docker.internal`

#### 5. Container Exits Immediately

**Solution**:
```bash
# Check logs for error
docker logs workstation

# Common causes:
# - Missing JWT_SECRET in production
# - Permission issues
# - Port conflicts
```

### Debug Mode

Enable debug logging:

```bash
docker run -d \
  -e LOG_LEVEL=debug \
  -e NODE_ENV=development \
  workstation:latest
```

### Support

- **Issues**: https://github.com/creditXcredit/workstation/issues
- **Discussions**: https://github.com/creditXcredit/workstation/discussions
- **Documentation**: https://github.com/creditXcredit/workstation/blob/main/README.md

---

## Build Documentation

### Build Process Overview

The workstation platform uses a multi-stage Docker build process for optimized production images:

```
Build Stage (node:18-alpine)
  ↓
  1. Install all dependencies (including dev)
  2. Compile TypeScript to JavaScript
  3. Run build scripts
  ↓
Production Stage (node:18-alpine)
  ↓
  1. Copy package files
  2. Install production dependencies only
  3. Copy compiled code from build stage
  4. Set up non-root user
  5. Configure health checks
```

### Local Build

```bash
# Install dependencies
npm install

# Run linter
npm run lint

# Compile TypeScript
npm run build

# Run tests
npm test

# Full validation (lint + build + test)
npm run validate
```

### Docker Build

**Standard Build:**

```bash
# Build with version tag
docker build \
  --tag workstation:1.0.0 \
  --tag workstation:latest \
  --build-arg BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ") \
  --build-arg VCS_REF=$(git rev-parse HEAD) \
  --build-arg VERSION=1.0.0 \
  -f Dockerfile .
```

**Multi-Architecture Build:**

```bash
# Build for multiple platforms
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --tag workstation:1.0.0 \
  --tag workstation:latest \
  --push \
  -f Dockerfile .
```

### Build Artifacts

After successful build, the following artifacts are generated:

```
dist/
├── index.js                    # Main entry point
├── auth/                       # JWT authentication
│   └── jwt.js
├── automation/                 # Automation logic
│   ├── agents/
│   ├── orchestrator/
│   ├── workflow/
│   └── db/
│       └── schema.sql         # Database schema (copied)
├── middleware/                 # Express middleware
├── utils/                      # Utility functions
├── routes/                     # API routes
└── services/                   # Service layer
```

### Build Verification

```bash
# Verify build output
ls -la dist/

# Check build size
du -sh dist/

# Test compiled code
node dist/index.js

# Or with Docker
docker run --rm workstation:latest node dist/index.js --version
```

### Error Handling in Build Process

**Common Build Errors:**

1. **TypeScript Compilation Errors**
   ```
   ERROR_CODE: TS2307
   SOLUTION: Install missing @types/* packages
   ```

2. **Missing Dependencies**
   ```
   ERROR_CODE: MODULE_NOT_FOUND
   SOLUTION: Run npm install
   ```

3. **Asset Copy Failures**
   ```
   ERROR_CODE: ENOENT
   SOLUTION: Verify schema.sql exists in src/automation/db/
   ```

**Rollback Notes for Build Changes:**

```bash
# If new build breaks:
# 1. Revert Dockerfile changes
git checkout HEAD~1 -- Dockerfile

# 2. Rebuild with previous version
docker build --tag workstation:rollback .

# 3. Update docker-compose.yml
sed -i 's/workstation:latest/workstation:rollback/' docker-compose.yml

# 4. Restart services
docker-compose down && docker-compose up -d
```

### Continuous Integration Build

The CI/CD pipeline runs automated builds on:
- Push to main/develop branches
- Pull requests
- Tagged releases

**GitHub Actions Build:**

```yaml
# .github/workflows/build.yml
- name: Build and Test
  run: |
    npm ci
    npm run lint
    npm run build
    npm test
    
- name: Build Docker Image
  run: |
    docker build \
      --tag workstation:${{ github.sha }} \
      --build-arg BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ") \
      --build-arg VCS_REF=${{ github.sha }} \
      .
```

### Build Optimization Tips

1. **Layer Caching**: Organize Dockerfile to maximize layer reuse
2. **Multi-stage**: Use separate build and production stages
3. **Dependency Optimization**: Use `npm ci` instead of `npm install`
4. **Asset Minimization**: Minify and compress production assets
5. **Security Scanning**: Run vulnerability scans on built images

---

## Next Steps

- **[Rollback Procedures](./ROLLBACK_PROCEDURES.md)** - Comprehensive rollback guide
- **[MCP Containerization Guide](./MCP_CONTAINERIZATION_GUIDE.md)** - Data isolation and container management
- [API Documentation](./API.md)
- [Architecture Details](./ARCHITECTURE.md)
- [Security Best Practices](./SECURITY.md)
- [Contributing Guide](./CONTRIBUTING.md)

---

**Last Updated**: 2025-11-18  
**Version**: 1.0.1
