# MCP Containers Overview

This directory contains all Model Context Protocol (MCP) server implementations for the Workstation platform.

## What are MCP Containers?

MCP (Model Context Protocol) containers are standardized server implementations that expose agent capabilities through a consistent API. Each agent in the Workstation ecosystem has its own dedicated MCP container.

## Directory Structure

```
mcp-containers/
├── 00-base-mcp/                    # Base MCP implementation (template)
├── 01-selector-mcp/                # CSS Selector Builder
├── 02-go-backend-browser-automation-engineer-mcp/  # Browser Automation
├── 03-database-orchestration-specialist-mcp/       # Database Operations
├── 04-integration-specialist-slack-webhooks-mcp/   # Slack Integration
├── 05-workflow-mcp/                # Workflow Orchestration
├── 06-project-builder-mcp/         # Project Scaffolding
├── 07-code-quality-mcp/            # Code Quality Analysis
├── 08-performance-mcp/             # Performance Monitoring
├── 09-error-tracker-mcp/           # Error Tracking
├── 10-security-mcp/                # Security Scanning
├── 11-accessibility-mcp/           # Accessibility Testing
├── 12-integration-mcp/             # Integration Testing
├── 13-docs-auditor-mcp/            # Documentation Auditing
├── 14-advanced-automation-mcp/     # Advanced Automation
├── 15-api-integration-mcp/         # API Integration
├── 16-data-processing-mcp/         # Data Processing (Agent 16)
├── 17-learning-platform-mcp/       # Learning Platform
├── 18-community-hub-mcp/           # Community Management
├── 19-deployment-mcp/              # Deployment Automation
├── 20-orchestrator-mcp/            # Master Orchestrator
├── .env.example                    # Environment configuration template
├── docker-compose.mcp.yml          # Docker Compose for all MCP containers
└── README.md                       # This file
```

## Getting Started

### Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- Node.js 18+ (for local development)

### Quick Start

1. **Copy environment template**:
   ```bash
   cp .env.example .env
   ```

2. **Configure environment**:
   Edit `.env` and set required variables (especially `GITHUB_TOKEN` for agent 16)

3. **Start all MCP containers**:
   ```bash
   docker-compose -f docker-compose.mcp.yml up -d
   ```

4. **Start specific MCP container**:
   ```bash
   docker-compose -f docker-compose.mcp.yml up -d mcp-16-data-processing
   ```

5. **View logs**:
   ```bash
   docker-compose -f docker-compose.mcp.yml logs -f mcp-16-data-processing
   ```

### Health Checks

Each MCP container exposes a `/health` endpoint:

```bash
# Check all MCP containers
for i in {1..20}; do
  port=$((3000 + i))
  echo "MCP-$(printf %02d $i): $(curl -s http://localhost:$port/health)"
done
```

## Agent 16: Data Processing & Coding Agent

Agent 16 is the coding agent that provides GitHub integration and data processing capabilities.

### Features

- GitHub repository operations
- Pull request management
- Code analysis and suggestions
- Data transformation pipelines
- Automated code reviews

### Configuration

Agent 16 requires a GitHub token for API access:

```bash
# In .env file
GITHUB_TOKEN=ghp_your_token_here
```

### Usage

See [tools/coding-agent/](../tools/coding-agent/) for the coding agent implementation and usage examples.

## Development

### Building a New MCP Container

1. Create directory:
   ```bash
   mkdir -p mcp-containers/XX-new-agent-mcp/src
   cd mcp-containers/XX-new-agent-mcp
   ```

2. Initialize package:
   ```bash
   npm init -y
   npm install express @modelcontextprotocol/sdk
   ```

3. Create `src/index.ts`:
   ```typescript
   import express from 'express';
   import { MCPServer } from '@modelcontextprotocol/sdk';
   
   const app = express();
   const mcp = new MCPServer({ name: 'new-agent' });
   
   app.get('/health', (req, res) => {
     res.json({ status: 'ok', agent: 'new-agent' });
   });
   
   app.listen(3000, () => {
     console.log('MCP server running on port 3000');
   });
   ```

4. Add to `docker-compose.mcp.yml`:
   ```yaml
   mcp-XX-new-agent:
     build: ./mcp-containers/XX-new-agent-mcp
     container_name: mcp-new-agent
     ports:
       - "30XX:3000"
     environment:
       - NODE_ENV=production
       - MCP_SERVER_NAME=new-agent
     restart: unless-stopped
   ```

### Testing

```bash
# Test locally
cd mcp-containers/XX-agent-mcp
npm install
npm run dev

# Test in Docker
docker-compose -f docker-compose.mcp.yml build mcp-XX-agent
docker-compose -f docker-compose.mcp.yml up mcp-XX-agent
```

## Deployment

### Production Deployment

```bash
# Build all images
docker-compose -f docker-compose.mcp.yml build

# Deploy
docker-compose -f docker-compose.mcp.yml up -d

# Verify
docker-compose -f docker-compose.mcp.yml ps
```

### Rollback

Use the peelback script for automated rollback:

```bash
../.docker/peelback.sh
```

See [ROLLBACK.md](../ROLLBACK.md) for detailed rollback procedures.

## Port Allocation

| Agent | Port | MCP Container |
|-------|------|---------------|
| 00 | 3000 | Base MCP |
| 01 | 3001 | Selector |
| 02 | 3002 | Navigation |
| 03 | 3003 | Database |
| 04 | 3004 | Slack Integration |
| 05 | 3005 | Workflow |
| 06 | 3006 | Project Builder |
| 07 | 3007 | Code Quality |
| 08 | 3008 | Performance |
| 09 | 3009 | Error Tracker |
| 10 | 3010 | Security |
| 11 | 3011 | Accessibility |
| 12 | 3012 | Integration |
| 13 | 3013 | Docs Auditor |
| 14 | 3014 | Advanced Automation |
| 15 | 3015 | API Integration |
| 16 | 3016 | Data Processing (Coding Agent) |
| 17 | 3017 | Learning Platform |
| 18 | 3018 | Community Hub |
| 19 | 3019 | Deployment |
| 20 | 3020 | Orchestrator |
# MCP Containers

**20 Specialized Model Context Protocol Containers for Workstation**

This directory contains all MCP (Model Context Protocol) container implementations, orchestrated through Docker Compose with nginx reverse proxy.

---

## Table of Contents

1. [Overview](#overview)
2. [Container List](#container-list)
3. [Quick Start](#quick-start)
4. [Container Details](#container-details)
5. [Health Checks](#health-checks)
6. [Peelback Operations](#peelback-operations)
7. [Configuration](#configuration)
8. [Troubleshooting](#troubleshooting)

---

## Overview

Workstation includes **20 specialized MCP containers**, each providing specific automation capabilities. All containers:

- Run on isolated Docker network (`workstation-mcp-network`)
- Expose standard health check endpoint (`/health`)
- Use consistent port mapping (3001-3020)
- Support Docker peelback for rollbacks
- Are managed by **Agent-16** (Data Processing MCP)

### Architecture

```
┌────────────────────────────────────────────┐
│      Nginx Proxy (Port 80)                 │
│      Routes to all MCP containers          │
└──────────────┬─────────────────────────────┘
               │
    ┌──────────┼──────────┐
    │          │          │
┌───▼───┐  ┌──▼───┐  ┌──▼───┐
│MCP-01 │  │MCP-16│  │MCP-20│
│3001   │  │3016  │  │3020  │
└───────┘  └──────┘  └──────┘
           (Manager)  (Orchestrator)
```

---

## Container List

| # | Container Name | Port | Description | Status |
|---|----------------|------|-------------|--------|
| 01 | selector-mcp | 3001 | CSS Selector Builder | ✅ Active |
| 02 | navigation-mcp | 3002 | Browser Navigation Helper | ✅ Active |
| 03 | database-orchestration-specialist-mcp | 3003 | Database Operations | ✅ Active |
| 04 | integration-specialist-slack-webhooks-mcp | 3004 | Slack/Webhook Integration | ✅ Active |
| 05 | workflow-mcp | 3005 | Workflow Orchestration | ✅ Active |
| 06 | project-builder-mcp | 3006 | Project Scaffolding | ✅ Active |
| 07 | code-quality-mcp | 3007 | Code Quality & Linting | ✅ Active |
| 08 | performance-mcp | 3008 | Performance Monitoring | ✅ Active |
| 09 | error-tracker-mcp | 3009 | Error Tracking | ✅ Active |
| 10 | security-mcp | 3010 | Security Scanning | ✅ Active |
| 11 | accessibility-mcp | 3011 | Accessibility Checks | ✅ Active |
| 12 | integration-mcp | 3012 | API Integration Hub | ✅ Active |
| 13 | docs-auditor-mcp | 3013 | Documentation Auditing | ✅ Active |
| 14 | advanced-automation-mcp | 3014 | Advanced Automation | ✅ Active |
| 15 | api-integration-mcp | 3015 | External API Integration | ✅ Active |
| **16** | **data-processing-mcp** | **3016** | **Container Manager** | **✅ Manager** |
| 17 | learning-platform-mcp | 3017 | Learning Platform | ✅ Active |
| 18 | community-hub-mcp | 3018 | Community Features | ✅ Active |
| 19 | deployment-mcp | 3019 | Deployment Automation | ✅ Active |
| 20 | orchestrator-mcp | 3020 | Master Orchestrator | ✅ Active |

---

## Quick Start

### Prerequisites

- Docker 20.10+ installed
- Docker Compose 2.0+ installed
- Workstation repository cloned

### Start All Containers

```bash
# 1. Navigate to workstation directory
cd /home/runner/work/workstation/workstation

# 2. Configure environment (first time only)
cp mcp-containers/.env.example mcp-containers/.env
# Edit .env with your settings

# 3. Start all MCP containers
docker-compose -f docker-compose.mcp.yml up -d

# 4. Verify containers started
docker-compose -f docker-compose.mcp.yml ps

# 5. Check health
curl http://localhost/health                    # Nginx proxy
curl http://localhost:3016/api/containers/status # All containers via Agent-16
```

### Start Specific Container

```bash
# Start only Agent-16 (Manager)
docker-compose -f docker-compose.mcp.yml up -d mcp-16-data

# Verify it started
docker-compose -f docker-compose.mcp.yml ps mcp-16-data
curl http://localhost:3016/health
```

### Stop Containers

```bash
# Stop all containers
docker-compose -f docker-compose.mcp.yml down

# Stop specific container
docker-compose -f docker-compose.mcp.yml stop mcp-16-data

# Stop and remove volumes
docker-compose -f docker-compose.mcp.yml down -v
```

---

## Container Details

### Base Image: mcp-base

All MCP containers are built from `.docker/mcp-base.Dockerfile`:

```dockerfile
FROM node:20-alpine

# Includes:
# - Chromium browser for Playwright
# - Node.js 20 runtime
# - Production dependencies only
# - Health check endpoint
# - Non-root user
```

### Container Structure

Each MCP container follows this structure:

```
mcp-containers/XX-name-mcp/
├── src/
│   ├── index.ts          # Main entry point
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   └── utils/            # Helper functions
├── Dockerfile            # Container build config
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript config
└── README.md             # Container-specific docs
```

### Example: MCP-16 (Data Processing - Manager)

**Location**: `mcp-containers/16-data-processing-mcp/`

**Responsibilities**:
- Monitor all 20 MCP containers
- Execute peelback operations
- Coordinate inter-container communication
- Report aggregate status

**API Endpoints**:
```
GET  /health                              - Container health
GET  /api/containers/status               - All container statuses
GET  /api/containers/:name/health         - Specific container health
POST /api/containers/peelback             - Trigger rollback
GET  /api/containers/peelback/status/:id  - Peelback operation status
```

**Usage Example**:
```bash
# Get status of all containers
curl http://localhost:3016/api/containers/status

# Check specific container
curl http://localhost:3016/api/containers/mcp-01-selector/health

# Trigger peelback
curl -X POST http://localhost:3016/api/containers/peelback \
  -H "Content-Type: application/json" \
  -d '{"container":"mcp-01-selector","tag":"v1.0.0"}'
```

---

## Health Checks

### Standard Health Check

Every container implements:

```bash
# Endpoint
GET /health

# Response (healthy)
{
  "status": "healthy",
  "timestamp": "2024-11-19T12:00:00Z",
  "uptime": 3600,
  "container": "mcp-16-data",
  "version": "1.0.0"
}

# Response (unhealthy)
{
  "status": "unhealthy",
  "timestamp": "2024-11-19T12:00:00Z",
  "error": "Database connection failed"
}
```

### Docker Health Check

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
  interval: 30s      # Check every 30 seconds
  timeout: 10s       # 10 second timeout
  retries: 3         # Retry 3 times before unhealthy
  start_period: 40s  # Grace period on startup
```

### Manual Health Checks

```bash
# Check all containers via Agent-16
curl http://localhost:3016/api/containers/status

# Check individual container
curl http://localhost:3001/health  # MCP-01
curl http://localhost:3016/health  # MCP-16 (Manager)
curl http://localhost:3020/health  # MCP-20 (Orchestrator)

# Check via nginx proxy
curl http://localhost/mcp-01/health
curl http://localhost/mcp-16/health

# Check using docker-compose
docker-compose -f docker-compose.mcp.yml ps
# Look for "healthy" status in output
```

---

## Peelback Operations

**Peelback** = Rolling back a container to a previous image version.

### Using Peelback Script

```bash
# Basic syntax
./.docker/peelback.sh <container-name> <image-tag> [--verify-health]

# Example: Rollback MCP-16 to v1.0.0
./.docker/peelback.sh mcp-16-data v1.0.0 --verify-health

# Example: Rollback MCP-01
./.docker/peelback.sh mcp-01-selector v0.9.5
```

### Using Agent-16 API

```bash
# Trigger peelback via API
curl -X POST http://localhost:3016/api/containers/peelback \
  -H "Content-Type: application/json" \
  -d '{
    "container": "mcp-01-selector",
    "tag": "v1.0.0",
    "verify_health": true
  }'

# Check peelback status
curl http://localhost:3016/api/containers/peelback/status/latest
```

### Peelback Workflow

```
1. Validate container exists
2. Stop target container
3. Pull specified image tag
4. Start container with old image
5. Verify health check passes
6. Log peelback event
7. Return status (success/failure)
```

### Peelback Safety

- ✅ Automatic health check verification
- ✅ Current state backup before rollback
- ✅ Image tag validation
- ✅ Rollback on failure
- ✅ Event logging

---

## Configuration

### Environment Variables

**File**: `mcp-containers/.env.example`

```bash
# MCP Container Configuration
MCP_MANAGER_AGENT=agent-16
MCP_CONTAINER_COUNT=20
MCP_PORT_OFFSET=3000
MCP_CONTAINER_PREFIX=mcp
NODE_ENV=production

# Networking
MCP_NETWORK=workstation-mcp-network
NGINX_PORT=80

# Health Checks
HEALTH_CHECK_INTERVAL=30s
HEALTH_CHECK_TIMEOUT=10s
HEALTH_CHECK_RETRIES=3

# Logging
LOG_LEVEL=info
LOG_DIR=/var/log/mcp
```

### Docker Compose Configuration

**File**: `docker-compose.mcp.yml`

Key sections:
```yaml
version: '3.8'

services:
  # Example service (MCP-16)
  mcp-16-data:
    build: ./mcp-containers/16-data-processing-mcp
    container_name: mcp-data
    ports:
      - "3016:3000"
    environment:
      - NODE_ENV=production
      - MCP_SERVER_NAME=data-processor
      - MCP_MANAGER_AGENT=agent-16
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    volumes:
      - ./logs/mcp-16:/app/logs
      - mcp_data:/app/data

networks:
  default:
    name: workstation-mcp-network

volumes:
  mcp_data:
```

### Nginx Proxy Configuration

**File**: `.docker/nginx.conf`

Routes traffic to all MCP containers:

```nginx
upstream mcp_containers {
    server mcp-01-selector:3000;
    server mcp-02-navigation:3000;
    # ... all 20 containers
}

server {
    listen 80;
    
    # Route to specific container
    location /mcp-01/ {
        proxy_pass http://mcp-01-selector:3000/;
    }
    
    location /mcp-16/ {
        proxy_pass http://mcp-16-data:3000/;
    }
    
    # Health check
    location /health {
        return 200 "healthy\n";
    }
}
```

---

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose -f docker-compose.mcp.yml logs mcp-XX-agent

# Rebuild
docker-compose -f docker-compose.mcp.yml build --no-cache mcp-XX-agent

# Restart
docker-compose -f docker-compose.mcp.yml restart mcp-XX-agent
```

### Port Conflicts

```bash
# Check what's using the port
lsof -i :3016

# Use different port in docker-compose.mcp.yml
ports:
  - "3116:3000"  # Host port 3116 maps to container port 3000
```

### Environment Variables Not Loading

```bash
# Verify .env file exists
ls -la mcp-containers/.env

# Check container environment
docker-compose -f docker-compose.mcp.yml exec mcp-XX-agent env
```

## Security

- Never commit `.env` files with real credentials
- Use `.env.example` as a template
- Rotate tokens regularly
- Use Docker secrets for production deployments
- Review [SECURITY_SUMMARY.md](../SECURITY_SUMMARY.md)

## Documentation

- [MCP_CONTAINERIZATION_GUIDE.md](../MCP_CONTAINERIZATION_GUIDE.md) - Detailed containerization guide
- [ARCHITECTURE.md](../ARCHITECTURE.md) - Architecture documentation
- [GETTING_STARTED.md](../GETTING_STARTED.md) - Getting started guide
- [API.md](../API.md) - API documentation

## Support

- Issues: [GitHub Issues](https://github.com/creditXcredit/workstation/issues)
- Documentation: [docs/](../docs/)
- Examples: [examples/](../examples/)
**Problem**: Container fails to start

**Solutions**:
```bash
# 1. Check logs
docker-compose -f docker-compose.mcp.yml logs mcp-16-data

# 2. Check if port is in use
lsof -i :3016

# 3. Verify image exists
docker images | grep mcp-16

# 4. Rebuild container
docker-compose -f docker-compose.mcp.yml build mcp-16-data
docker-compose -f docker-compose.mcp.yml up -d mcp-16-data

# 5. Check environment variables
docker-compose -f docker-compose.mcp.yml config | grep mcp-16-data
```

### Health Check Fails

**Problem**: Container shows as unhealthy

**Solutions**:
```bash
# 1. Manual health check
curl http://localhost:3016/health

# 2. Check container logs
docker-compose -f docker-compose.mcp.yml logs --tail=50 mcp-16-data

# 3. Restart container
docker-compose -f docker-compose.mcp.yml restart mcp-16-data

# 4. If persistent, try peelback
./.docker/peelback.sh mcp-16-data v1.0.0

# 5. Check dependencies
# Ensure database/external services are accessible
```

### Nginx Routing Issues

**Problem**: Can't access containers via proxy

**Solutions**:
```bash
# 1. Check nginx is running
docker-compose -f docker-compose.mcp.yml ps nginx-proxy

# 2. Test nginx config
docker exec mcp-proxy nginx -t

# 3. Check nginx logs
docker-compose -f docker-compose.mcp.yml logs nginx-proxy

# 4. Verify container connectivity
docker exec mcp-proxy ping mcp-16-data

# 5. Restart nginx
docker-compose -f docker-compose.mcp.yml restart nginx-proxy
```

### Container Communication Issues

**Problem**: Containers can't communicate

**Solutions**:
```bash
# 1. Verify network
docker network ls | grep workstation-mcp-network

# 2. Check container network
docker network inspect workstation-mcp-network

# 3. Test connectivity
docker exec mcp-16-data ping mcp-01-selector

# 4. Verify DNS resolution
docker exec mcp-16-data nslookup mcp-01-selector

# 5. Recreate network
docker-compose -f docker-compose.mcp.yml down
docker network rm workstation-mcp-network
docker-compose -f docker-compose.mcp.yml up -d
```

### Peelback Failures

**Problem**: Peelback operation fails

**Solutions**:
```bash
# 1. Check image tag exists
docker images | grep mcp-16

# 2. Verify container name
docker-compose -f docker-compose.mcp.yml ps

# 3. Check peelback logs
tail -f /var/log/peelback/peelback_$(date +%Y%m%d).log

# 4. Manual peelback
docker-compose -f docker-compose.mcp.yml stop mcp-16-data
docker pull ghcr.io/creditxcredit/workstation/mcp-16:v1.0.0
docker-compose -f docker-compose.mcp.yml up -d mcp-16-data

# 5. Verify health after peelback
curl http://localhost:3016/health
```

### Resource Issues

**Problem**: High CPU/memory usage

**Solutions**:
```bash
# 1. Check container stats
docker stats

# 2. Check specific container
docker stats mcp-16-data

# 3. Check logs for errors
docker-compose -f docker-compose.mcp.yml logs --tail=100 mcp-16-data

# 4. Restart container
docker-compose -f docker-compose.mcp.yml restart mcp-16-data

# 5. Scale down if needed
docker-compose -f docker-compose.mcp.yml stop mcp-17-learning mcp-18-community
```

---

## Additional Resources

- [Getting Started Guide](../GETTING_STARTED.md) - Setup instructions
- [Architecture Documentation](../ARCHITECTURE.md) - System architecture
- [Rollback Guide](../ROLLBACK.md) - Rollback procedures
- [Agent-16 Assignment](../.agents/agent-16-assignment.json) - Manager details
- [Docker Compose Reference](https://docs.docker.com/compose/) - Docker Compose docs

---

## Support

For MCP container issues:
- 📖 [Documentation](../docs/DOCUMENTATION_INDEX.md)
- 🐛 [Issue Tracker](https://github.com/creditXcredit/workstation/issues)
- 💬 [Discussions](https://github.com/creditXcredit/workstation/discussions)

---

**Last Updated**: November 19, 2024  
**Version**: 1.0.0  
**Maintained By**: Agent-16 (Data Processing MCP)
