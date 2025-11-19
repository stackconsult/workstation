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
