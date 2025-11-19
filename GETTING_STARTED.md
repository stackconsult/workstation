# 🚀 Getting Started with Workstation

Welcome to Workstation! This guide will walk you through everything you need to know to get up and running.

## Table of Contents

- [What is Workstation?](#what-is-workstation)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [First Steps](#first-steps)
- [Create Your First Workflow](#create-your-first-workflow)
- [Using the Web Dashboard](#using-the-web-dashboard)
- [Next Steps](#next-steps)
- [Troubleshooting](#troubleshooting)

---

## What is Workstation?

Workstation is a **privacy-first browser automation platform** that lets you:

- 🤖 **Automate browser tasks** - Navigate, click, type, extract data, capture screenshots
- 🔄 **Create workflows** - Chain multiple actions together with error handling
- 🔐 **Secure your API** - JWT authentication with enterprise-grade security
- 💾 **Store workflows** - SQLite (dev) or PostgreSQL (production) persistence
- 🎨 **Manage visually** - Beautiful web dashboards included

**Perfect for:** Web scraping, form automation, testing, monitoring, and data collection.

---

## Prerequisites

Before you begin, ensure you have:

- **Node.js** version 18 or higher ([Download](https://nodejs.org/))
- **npm** (comes with Node.js)
- **Git** ([Download](https://git-scm.com/))

**Check your versions:**
```bash
node --version  # Should be v18.0.0 or higher
npm --version   # Should be 9.0.0 or higher
```

**Optional:**
- **Docker** for containerized deployment ([Download](https://www.docker.com/))
- **PostgreSQL** for production database (SQLite included for development)

---

## Installation

### Option 1: Clone from GitHub (Recommended)

```bash
# Clone the repository
git clone https://github.com/creditXcredit/workstation.git

# Navigate to the directory
cd workstation

# Install dependencies
npm install
```

### Option 2: Deploy to Railway

Click the button to deploy instantly:

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/stackbrowseragent)

Railway will:
- ✅ Clone the repository
- ✅ Install dependencies
- ✅ Generate secure secrets
- ✅ Deploy to production

### Option 3: Docker Container

```bash
# Pull the image
docker pull ghcr.io/creditxcredit/workstation:latest

# Run the container
docker run -d -p 3000:3000 \
  -e JWT_SECRET=your-secret-key \
  ghcr.io/creditxcredit/workstation:latest
```

---

## Configuration

### 1. Create Environment File

```bash
cp .env.example .env
```

### 2. Generate JWT Secret

**IMPORTANT:** Use a secure random string for production!

```bash
# Generate a secure secret (32+ characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Configure .env File

Open `.env` in your text editor and update:

```env
# JWT Configuration (REQUIRED)
JWT_SECRET=your-generated-secret-from-step-2
JWT_EXPIRATION=24h

# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration (comma-separated)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Logging
LOG_LEVEL=info
```

**Security Notes:**
- ⚠️ Never commit `.env` to version control
- ⚠️ Use different secrets for development and production
- ⚠️ Keep your JWT_SECRET private

---

## First Steps

### 1. Start the Development Server

```bash
npm run dev
```

You should see:
```
🚀 Server running on http://localhost:3000
✅ Database initialized
✅ All routes mounted
```

### 2. Verify Server is Running

**Health Check:**
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-11-17T12:00:00.000Z",
  "uptime": 123.456,
  "memory": {
    "used": "45 MB",
    "total": "100 MB"
  }
}
```

### 3. Get Your First JWT Token

```bash
curl http://localhost:3000/auth/demo-token
```

Expected response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "24h"
}
```

**Save this token!** You'll use it to authenticate API requests.

---

## Create Your First Workflow

### 1. Save Your Token

```bash
export TOKEN="your-token-from-previous-step"
```

### 2. Create a Simple Workflow

This workflow navigates to Google and captures a screenshot:

```bash
curl -X POST http://localhost:3000/api/v2/workflows \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My First Workflow",
    "description": "Navigate to Google and take a screenshot",
    "definition": {
      "tasks": [
        {
          "name": "navigate_to_google",
          "agent_type": "browser",
          "action": "navigate",
          "parameters": {
            "url": "https://www.google.com"
          }
        },
        {
          "name": "capture_screenshot",
          "agent_type": "browser",
          "action": "screenshot",
          "parameters": {
            "fullPage": true
          }
        }
      ]
    }
  }'
```

### 3. Execute Your Workflow

From the response above, copy the `workflow_id` and execute:

```bash
curl -X POST http://localhost:3000/api/v2/workflows/{workflow_id}/execute \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

### 4. Check Execution Status

```bash
curl http://localhost:3000/api/v2/executions/{execution_id} \
  -H "Authorization: Bearer $TOKEN"
```

---

## Using the Web Dashboard

Workstation includes three web interfaces:

### 1. Landing Page (Public Showcase)

```bash
open docs/landing.html
```

Features:
- Project overview
- Feature showcase
- Quick start guide
- Documentation links

### 2. Simple Dashboard (JWT & API Testing)

```bash
open docs/index.html
```

Features:
- Health check
- Token generation
- API endpoint testing
- JSON response viewer

**Configure API URL:**

Edit `docs/index.html` and update:
```javascript
apiUrl: 'http://localhost:3000'  // For local development
```

### 3. Control Center (Advanced Management)

```bash
open docs/workstation-control-center.html
```

Features:
- Workflow creation
- Execution monitoring
- Task management
- Real-time status

---

## Next Steps

### Learn More

- 📖 [Complete User Guide](docs/guides/HOW_TO_USE_BROWSER_AGENT.md)
- 🔌 [API Reference](docs/api/API.md)
- 🏗️ [Architecture Overview](docs/architecture/ARCHITECTURE.md)
- 🔐 [Security Best Practices](docs/guides/SECURITY.md)

### Try More Examples

Check out `examples/workflows/` for:
- Web scraping workflows
- Form automation
- Multi-page navigation
- Data extraction

### Build Something

Create your own workflows:
- Monitor website changes
- Automate form submissions
- Scrape product data
- Generate reports
- Capture screenshots

### Deploy to Production

When you're ready:
- 📦 [Build for Production](docs/guides/BUILD.md)
- 🚀 [Deployment Guide](docs/guides/DEPLOYMENT.md)
- ✅ [Deployment Checklist](docs/guides/DEPLOYMENT_CHECKLIST.md)

---

## Troubleshooting

### Server Won't Start

**Problem:** Port 3000 already in use

**Solution:**
```bash
# Change port in .env
PORT=3001

# Or kill process using port 3000
lsof -ti:3000 | xargs kill
```

### JWT Token Invalid

**Problem:** "Invalid token" error

**Solutions:**
1. Check JWT_SECRET is set in `.env`
2. Token may have expired (default: 24h)
3. Generate a new token: `curl http://localhost:3000/auth/demo-token`

### Browser Automation Fails

**Problem:** Workflow execution fails

**Solutions:**
1. Check Playwright is installed: `npm install`
2. Install browser binaries: `npx playwright install chromium`
3. Check logs: `tail -f logs/combined.log`

### Database Errors

**Problem:** "Database not found" or connection errors

**Solutions:**
1. Stop server and restart: `npm run dev`
2. Database will auto-create on first run
3. Check permissions on `workstation.db` file

### CORS Errors

**Problem:** Web dashboard can't connect

**Solutions:**
1. Add your origin to `.env`:
   ```env
   ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000
   ```
2. Restart server after changing `.env`

### Need More Help?

- 📖 [Full Documentation](docs/DOCUMENTATION_INDEX.md)
- 🐛 [Report Issues](https://github.com/creditXcredit/workstation/issues)
- 💬 [Ask Questions](https://github.com/creditXcredit/workstation/discussions)

---

## 🤖 Coding Agent & MCP Containers

### Running MCP Containers

Workstation includes 20 MCP containers managed through Docker Compose:

```bash
# Start all MCP containers
docker-compose -f docker-compose.mcp.yml up -d

# Start specific container (e.g., Agent-16)
docker-compose -f docker-compose.mcp.yml up -d mcp-16-data

# Check container status
docker-compose -f docker-compose.mcp.yml ps

# View logs
docker-compose -f docker-compose.mcp.yml logs -f mcp-16-data

# Stop all containers
docker-compose -f docker-compose.mcp.yml down
```

### Coding Agent Tool

The coding agent tool enables GitHub integration:

```bash
# Navigate to coding agent directory
cd tools/coding-agent

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your GITHUB_TOKEN

# Push branch to GitHub
npm run push-branch -- --branch feature/my-feature --message "Add new feature"

# Sync with GitHub
npm run sync-repo

# Check status
npm run status
```

### Coding Agent Endpoints

Agent-16 (MCP Container Manager) provides these endpoints:

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/containers/status` | Yes | Get all container statuses |
| GET | `/api/containers/:name/health` | Yes | Check specific container health |
| POST | `/api/containers/peelback` | Yes | Trigger container rollback |
| GET | `/api/containers/peelback/status/:id` | Yes | Check peelback operation status |
| POST | `/api/github/push-branch` | Yes | Push branch to GitHub |
| POST | `/api/github/sync` | Yes | Sync repository with GitHub |

**Example: Check Container Status**

```bash
# Get status of all containers
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3016/api/containers/status

# Response:
{
  "containers": [
    {
      "name": "mcp-01-selector",
      "status": "running",
      "health": "healthy",
      "port": 3001
    },
    ...
  ],
  "total": 20,
  "healthy": 20,
  "unhealthy": 0
}
```

**Example: Push Branch to GitHub**

```bash
# Push a new branch
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  http://localhost:3016/api/github/push-branch \
  -d '{
    "branch": "feature/new-mcp-container",
    "message": "Add new MCP container configuration",
    "files": ["docker-compose.mcp.yml"]
  }'

# Response:
{
  "success": true,
  "branch": "feature/new-mcp-container",
  "commit": "a1b2c3d4",
  "url": "https://github.com/creditXcredit/workstation/tree/feature/new-mcp-container"
}
```

**Example: Trigger Container Peelback**

```bash
# Roll back a specific container
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  http://localhost:3016/api/containers/peelback \
  -d '{
    "container": "mcp-01-selector",
    "tag": "v1.0.0",
    "verify_health": true
  }'

# Response:
{
  "success": true,
  "operation_id": "peelback-20241119-123456",
  "container": "mcp-01-selector",
  "tag": "v1.0.0",
  "status": "in_progress"
}
```

---

## Quick Reference

### Common Commands

```bash
# Development
npm run dev              # Start dev server with hot reload
npm run build           # Build for production
npm start               # Start production server
npm test                # Run tests
npm run lint            # Run linter

# Docker
docker build -t workstation .
docker run -p 3000:3000 workstation

# MCP Containers
docker-compose -f docker-compose.mcp.yml up -d     # Start all MCP containers
docker-compose -f docker-compose.mcp.yml ps        # Check status
docker-compose -f docker-compose.mcp.yml logs -f   # View logs

# Coding Agent
cd tools/coding-agent && npm run push-branch       # Push branch to GitHub
cd tools/coding-agent && npm run sync-repo         # Sync with GitHub

# Container Peelback (Rollback)
./.docker/peelback.sh mcp-16-data v1.0.0          # Rollback container

# Database
npm run db:migrate      # Run migrations (if any)
npm run db:seed         # Seed test data (if any)
```

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JWT_SECRET` | ✅ Yes | - | Secret for JWT signing |
| `JWT_EXPIRATION` | No | `24h` | Token expiration time |
| `PORT` | No | `3000` | Server port |
| `NODE_ENV` | No | `development` | Environment |
| `ALLOWED_ORIGINS` | No | `*` | CORS allowed origins |
| `LOG_LEVEL` | No | `info` | Logging verbosity |
| **`GITHUB_TOKEN`** | For coding agent | - | **GitHub personal access token** |
| **`MCP_MANAGER_AGENT`** | No | `agent-16` | **MCP container manager agent** |
| **`MCP_PORT_OFFSET`** | No | `3000` | **Base port for MCP containers** |
| **`MCP_CONTAINER_PREFIX`** | No | `mcp` | **Prefix for container names** |

⚠️ **Security**: Never commit `GITHUB_TOKEN` or `JWT_SECRET` to version control. Use environment variables or secret management tools.

### API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | No | Health check |
| GET | `/auth/demo-token` | No | Get demo token |
| POST | `/auth/token` | No | Generate custom token |
| POST | `/api/v2/workflows` | Yes | Create workflow |
| GET | `/api/v2/workflows` | Yes | List workflows |
| POST | `/api/v2/workflows/:id/execute` | Yes | Execute workflow |
| GET | `/api/v2/executions/:id` | Yes | Get execution status |
| **GET** | **`/api/containers/status`** | **Yes** | **Get container statuses** |
| **POST** | **`/api/containers/peelback`** | **Yes** | **Trigger container rollback** |
| **POST** | **`/api/github/push-branch`** | **Yes** | **Push branch to GitHub** |

---

**Welcome to Workstation! 🎉**

For more information:
- [MCP Containers Guide](mcp-containers/README.md)
- [Rollback Procedures](ROLLBACK.md)
- [Agent-16 Assignment](.agents/agent-16-assignment.json)
- [Architecture Documentation](ARCHITECTURE.md)

Questions? Open an issue or start a discussion on GitHub!

---

## 🤖 Addendum: Coding Agent & MCP Containers

### Overview

Workstation now includes **Agent 16 (Coding Agent)** and a full MCP container infrastructure for deploying 20+ specialized agents.

### What's New?

1. **Coding Agent (Agent 16)**:
   - GitHub API integration for repository management
   - Automated pull request reviews
   - Code analysis and quality checks
   - Data processing pipelines
   - Deployed as MCP container on port 3016

2. **MCP Container Infrastructure**:
   - 20+ specialized agents in isolated containers
   - Automated health monitoring and recovery
   - Peelback rollback script for safe deployments
   - Master orchestrator for agent coordination

### Quick Setup for Coding Agent

**Step 1: Configure Environment**
```bash
# Copy environment template
cp mcp-containers/.env.example mcp-containers/.env

# Edit and add your GitHub token
nano mcp-containers/.env
# Set: GITHUB_TOKEN=ghp_your_token_here
```

**Step 2: Start Coding Agent Container**
```bash
# Start Agent 16
docker-compose -f mcp-containers/docker-compose.mcp.yml up -d mcp-16-data-processing

# Check health
curl http://localhost:3016/health

# View logs
docker-compose -f mcp-containers/docker-compose.mcp.yml logs -f mcp-16-data-processing
```

**Step 3: Test GitHub Integration**
```bash
# List your repositories
curl http://localhost:3016/api/github/repos

# Get MCP server info
curl http://localhost:3016/mcp/info
```

### Starting All MCP Containers

To start all 20+ agent containers:

```bash
# Start all MCP containers
docker-compose -f mcp-containers/docker-compose.mcp.yml up -d

# Check status
docker-compose -f mcp-containers/docker-compose.mcp.yml ps

# View orchestrator logs (coordinates all agents)
docker-compose -f mcp-containers/docker-compose.mcp.yml logs -f mcp-20-orchestrator
```

### Rollback and Recovery

If a deployment fails or containers are unhealthy:

```bash
# Automatic rollback with peelback script
./.docker/peelback.sh

# Manual container restart
docker-compose -f mcp-containers/docker-compose.mcp.yml restart mcp-16-data-processing
```

### Environment Variables for Agent 16

| Variable | Required | Description |
|----------|----------|-------------|
| `GITHUB_TOKEN` | ✅ Yes | GitHub Personal Access Token (scopes: repo, workflow, read:org) |
| `NODE_ENV` | No | Environment (default: production) |
| `MCP_PORT` | No | Internal port (default: 3000) |
| `LOG_LEVEL` | No | Logging verbosity (default: info) |

### Coding Agent Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/mcp/info` | MCP metadata |
| GET | `/api/github/repos` | List repositories |
| GET | `/api/github/repos/:owner/:repo` | Get repository details |
| GET | `/api/github/pulls/:owner/:repo` | List pull requests |
| GET | `/api/github/issues/:owner/:repo` | List issues |
| GET | `/api/github/commits/:owner/:repo` | List commits |
| POST | `/api/code/analyze` | Analyze code quality |

### Port Allocation for MCP Containers

| Agent | Port | Container |
|-------|------|-----------|
| 00 | 3000 | Base MCP |
| 01 | 3001 | Selector |
| ... | ... | ... |
| 16 | 3016 | **Coding Agent (Data Processing)** |
| ... | ... | ... |
| 20 | 3020 | Master Orchestrator |

### Additional Resources

- **[MCP Containers README](mcp-containers/README.md)** - Complete MCP documentation
- **[Agent 16 Assignment](.agents/agent-16-assignment.json)** - Agent configuration
- **[Rollback Guide](ROLLBACK.md)** - Quick rollback procedures
- **[Architecture](ARCHITECTURE.md)** - Updated with agent & MCP sections

### Troubleshooting

**Container won't start:**
```bash
# Check logs
docker-compose -f mcp-containers/docker-compose.mcp.yml logs mcp-16-data-processing

# Rebuild without cache
docker-compose -f mcp-containers/docker-compose.mcp.yml build --no-cache mcp-16-data-processing
```

**GitHub token not working:**
- Ensure token has `repo`, `workflow`, and `read:org` scopes
- Generate at: https://github.com/settings/tokens
- Set in `mcp-containers/.env` as `GITHUB_TOKEN=ghp_...`

**Port already in use:**
- Change host port in `docker-compose.mcp.yml`
- Example: `"3116:3000"` maps host 3116 to container 3000

---

**Happy Automating! 🚀**
