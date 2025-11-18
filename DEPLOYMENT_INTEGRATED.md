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

## Build Documentation

### Overview

The workstation platform uses a multi-stage build process that produces optimized production images with minimal dependencies and attack surface.

### Build Process

#### Standard Build

Build the Docker image from the repository root:

```bash
# Build with default configuration
docker build -t workstation:latest .

# Build with specific tag
docker build -t workstation:1.0.0 .

# Build without cache
docker build --no-cache -t workstation:latest .
```

#### Multi-Stage Build

The Dockerfile uses multi-stage builds for optimization:

1. **Dependencies Stage**: Installs Node.js dependencies
2. **Build Stage**: Compiles TypeScript to JavaScript
3. **Production Stage**: Creates minimal runtime image

```dockerfile
# Example multi-stage structure
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
CMD ["node", "dist/index.js"]
```

### Build Arguments

Customize builds with build arguments:

```bash
# Set Node version
docker build --build-arg NODE_VERSION=18 -t workstation:latest .

# Set build environment
docker build --build-arg BUILD_ENV=production -t workstation:latest .

# Skip tests during build
docker build --build-arg SKIP_TESTS=true -t workstation:latest .
```

### CI/CD Integration

#### GitHub Actions

Automated builds triggered on:
- Push to main branch
- Pull request creation
- Release tags

```yaml
# .github/workflows/build.yml excerpt
- name: Build Docker image
  run: docker build -t workstation:${{ github.sha }} .

- name: Run tests
  run: docker run workstation:${{ github.sha }} npm test

- name: Push to registry
  run: docker push workstation:${{ github.sha }}
```

#### Build Verification

Verify build integrity:

```bash
# Check image layers
docker history workstation:latest

# Inspect image metadata
docker inspect workstation:latest

# Verify size optimization
docker images workstation:latest

# Run security scan
docker scan workstation:latest
```

### Build Optimization

#### Layer Caching

Optimize build times with layer caching:

```dockerfile
# Copy dependency files first (changes less frequently)
COPY package*.json ./
RUN npm ci

# Copy source code last (changes more frequently)
COPY . .
RUN npm run build
```

#### Size Reduction

Minimize image size:

```bash
# Use alpine base images
FROM node:18-alpine

# Remove dev dependencies
RUN npm prune --production

# Remove unnecessary files
RUN rm -rf /tmp/* /var/cache/apk/*
```

### Build Troubleshooting

#### Common Build Errors

**Error**: `npm ERR! code ELIFECYCLE`

**Solution**:
```bash
# Clear npm cache
npm cache clean --force

# Rebuild with fresh dependencies
docker build --no-cache -t workstation:latest .
```

**Error**: `COPY failed: no source files were specified`

**Solution**:
- Check `.dockerignore` file
- Verify source files exist
- Ensure correct COPY path

**Error**: `The command '/bin/sh -c npm run build' returned a non-zero code`

**Solution**:
```bash
# Run build locally to see detailed errors
npm run build

# Check TypeScript configuration
npx tsc --noEmit

# Verify all dependencies installed
npm install
```

### Production Builds

#### Security Scanning

Scan images before deployment:

```bash
# Trivy scan
trivy image workstation:latest

# Snyk scan
snyk container test workstation:latest

# Docker Scout
docker scout cves workstation:latest
```

#### Image Tagging

Use semantic versioning:

```bash
# Tag with version
docker tag workstation:latest workstation:1.0.0

# Tag with commit SHA
docker tag workstation:latest workstation:${GIT_SHA}

# Tag for registry
docker tag workstation:latest registry.example.com/workstation:1.0.0
```

#### Registry Push

Push to container registry:

```bash
# Docker Hub
docker push username/workstation:latest

# GitHub Container Registry
docker push ghcr.io/username/workstation:latest

# Private registry
docker push registry.example.com/workstation:latest
```

### Local Development Builds

#### Development Image

Build for local development with hot reload:

```bash
# Build development image
docker build --target builder -t workstation:dev .

# Run with volume mount
docker run -v $(pwd):/app workstation:dev
```

#### Build Scripts

Use npm scripts for common tasks:

```bash
# Full build
npm run build

# Watch mode
npm run build:watch

# Production build
npm run build:production
```

### Build Verification Checklist

Before deploying:

- [ ] All tests passing
- [ ] Security scan clean
- [ ] Image size optimized
- [ ] Environment variables documented
- [ ] Health checks configured
- [ ] Logs structured and readable
- [ ] Metrics exposed
- [ ] Documentation updated

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

## Next Steps

- [API Documentation](./API.md)
- [Architecture Details](./ARCHITECTURE.md)
- [Security Best Practices](./SECURITY.md)
- [Contributing Guide](./CONTRIBUTING.md)
- [Rollback Procedures](./ROLLBACK_PROCEDURES.md)
- [MCP Containerization Guide](./MCP_CONTAINERIZATION_GUIDE.md)

---

**Last Updated**: 2025-11-18  
**Version**: 1.0.1
