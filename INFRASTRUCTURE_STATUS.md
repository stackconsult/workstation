# 20-Agent System Infrastructure - Build Guide

## Overview

This document outlines the complete 20-agent system with Docker rollback, MCP containers, and self-healing capabilities as specified in the requirements.

## Current Status

### ✅ Phase 1 Complete: Foundation Infrastructure

1. **Docker System with Rollback**
   - `.docker/agent-base.Dockerfile` - Multi-stage base image with version labels
   - `.docker/mcp-base.Dockerfile` - MCP container base template
   - `scripts/rollback-agent.sh` - Rollback any agent to previous version
   - `scripts/list-versions.sh` - List all available versions for rollback

2. **MCP Container Template**
   - `mcp-containers/00-base-mcp/` - Base MCP server template
   - Includes Playwright browser automation
   - Health check endpoint on port 3000
   - TypeScript with full type safety

3. **Docker Compose for 20 MCPs**
   - `docker-compose.mcp.yml` - All 20 MCP containers defined
   - Ports 3001-3020 mapped (one per agent)
   - Health checks configured
   - Nginx reverse proxy included
   - Dependency chains established

### ⏳ Phase 2: To Be Built

**Each of the 20 agents requires:**

1. **Module Directory** (`modules/XX-name/`)
   - UI dashboard (React + TypeScript)
   - Backend API (Express + TypeScript)
   - Tests (Jest, >90% coverage)
   - Documentation
   - GitHub Actions workflow

2. **MCP Container** (`mcp-containers/XX-name-mcp/`)
   - Specific MCP server implementation
   - 3-5 specialized tools per agent
   - Playwright integration
   - TypeScript code

3. **Docker Image**
   - Based on `.docker/agent-base.Dockerfile`
   - Multi-stage build
   - Version tagging (latest, commit-sha, timestamp)
   - Health checks

4. **CI/CD Pipeline**
   - `.github/workflows/deploy-agent-XX.yml`
   - Build, test, deploy
   - Rollback support
   - GitHub Container Registry push

5. **Self-Healing Integration**
   - Health monitoring
   - Auto-fix triggers
   - Alert creation

## The 20 Agents

### Tier 1: Core Builders (Agents 1-6)
1. **CSS Selector Builder** - Generate, validate, optimize selectors
2. **Navigation Helper** - URL handling, page traversal
3. **Data Extraction** - Extract structured data from pages
4. **Error Handling** - Retry logic, fallback strategies
5. **Workflow Orchestrator** - Multi-step automation
6. **Project Builder** - Generate complete automation projects

### Tier 2: Quality & Monitoring (Agents 7-13)
7. **Code Quality** - Linting, formatting, best practices
8. **Performance Monitor** - Speed, memory, optimization
9. **Error Tracker** - Log, categorize, report errors
10. **Security Scanner** - Vulnerability detection, XSS, SQL injection
11. **Accessibility Checker** - WCAG compliance, A11y issues
12. **Integration Hub** - Connect to APIs, services
13. **Docs Auditor** - Documentation completeness, accuracy

### Tier 3: Platform & Advanced (Agents 14-20)
14. **Advanced Automation** - Complex workflows, AI-assisted
15. **API Integrator** - REST, GraphQL, WebSocket
16. **Data Processor** - Transform, validate, enrich data
17. **Learning Platform** - Tutorials, examples, courses
18. **Community Hub** - Share workflows, templates
19. **Deployment Manager** - Deploy to cloud, containers
20. **Master Orchestrator** - Coordinate all 19 agents

## Using the Infrastructure

### Build All MCP Containers

```bash
# Build all 20 MCP containers
docker-compose -f docker-compose.mcp.yml build

# Start all containers
docker-compose -f docker-compose.mcp.yml up -d

# Check status
docker-compose -f docker-compose.mcp.yml ps

# View logs
docker-compose -f docker-compose.mcp.yml logs -f mcp-01-selector
```

### Rollback an Agent

```bash
# List available versions
./scripts/list-versions.sh 01

# Rollback to previous version
./scripts/rollback-agent.sh modules/01-selectors previous

# Rollback to specific version
./scripts/rollback-agent.sh modules/01-selectors abc1234
```

### Health Check All Agents

```bash
# Check all MCPs
for i in {1..20}; do
  echo "Agent $i:"
  curl -f http://localhost:300$i/health || echo "FAILED"
done
```

## Architecture

### Docker Image Strategy

Each agent has 3 tags:
- `latest` - Current production version
- `{commit-sha}` - Specific commit
- `{timestamp}` - Build timestamp

Example:
```
ghcr.io/creditxcredit/workstation-agent-01:latest
ghcr.io/creditxcredit/workstation-agent-01:abc1234
ghcr.io/creditxcredit/workstation-agent-01:20251116-180000
```

### Rollback Strategy

1. Health check detects failure
2. System tries to rollback to previous version
3. If rollback succeeds, mark as latest
4. If rollback fails, alert created
5. Manual intervention required after 3 failed attempts

### Self-Healing (To Be Implemented)

Location: `agents/agent20/backend/src/self-healing/`

Components:
1. **Health Monitor** - Check all agents every 15 minutes
2. **Auto-Fix Engine** - Apply fixes automatically
3. **Recovery Actions** - Emergency procedures
4. **Alerting System** - Create GitHub issues, send notifications

Auto-fix strategies (in order):
1. Rollback to last known good version
2. Restart container
3. Clear cache and restart
4. Trigger full rebuild
5. Alert human (if all fail)

## Next Steps

### Immediate Tasks

1. **Build MCP Containers for Each Agent**
   - Create `mcp-containers/01-selector-mcp/` through `20-orchestrator-mcp/`
   - Each with 3-5 specialized tools
   - Full Playwright integration
   - TypeScript implementations

2. **Create Module Directories**
   - `modules/01-selectors/` through `modules/20-orchestrator/`
   - UI dashboards
   - Backend APIs
   - Tests
   - Documentation

3. **Implement Self-Healing System**
   - Health monitor service
   - Auto-fix engine
   - Recovery procedures
   - Alerting integration

4. **Setup CI/CD Pipelines**
   - GitHub Actions for each agent
   - Auto-build on commit
   - Auto-deploy to GHCR
   - Rollback support

5. **Create Agent 20 Master Orchestrator**
   - Coordinates all 19 agents
   - Self-healing system
   - Monitoring dashboard
   - Admin interface

### Build Order

1. Infrastructure (✅ Complete)
2. Agent 1-6 (Tier 1)
3. Agent 7-13 (Tier 2)
4. Agent 14-20 (Tier 3)
5. Self-healing system
6. Final integration testing

## File Structure

```
workstation/
├── .docker/
│   ├── agent-base.Dockerfile          ✅
│   └── mcp-base.Dockerfile            ✅
├── scripts/
│   ├── rollback-agent.sh              ✅
│   ├── list-versions.sh               ✅
│   └── emergency-rollback-all.sh      ⏳
├── mcp-containers/
│   ├── 00-base-mcp/                   ✅
│   ├── 01-selector-mcp/               ⏳
│   ├── 02-navigation-mcp/             ⏳
│   └── ... (18 more)                  ⏳
├── modules/
│   ├── 01-selectors/                  ⏳
│   ├── 02-navigation/                 ⏳
│   └── ... (18 more)                  ⏳
├── agents/
│   ├── agent20/                       
│   │   └── backend/src/self-healing/  ⏳
│   └── agent21/                       ✅
├── docker-compose.mcp.yml             ✅
└── INFRASTRUCTURE_STATUS.md           ✅
```

## Validation Checklist

After building each agent, verify:

- [ ] Docker image exists with 3 tags (latest, commit, timestamp)
- [ ] MCP container runs and passes health check
- [ ] UI deployed and accessible
- [ ] API endpoints respond correctly
- [ ] Tests pass with >90% coverage
- [ ] Documentation complete
- [ ] GitHub Actions workflow green
- [ ] Rollback tested and working
- [ ] Self-healing detects and fixes issues

## Completion Criteria

System is 100% complete when:

- [ ] All 20 MCP containers running
- [ ] All 20 modules deployed
- [ ] All Docker images in GHCR
- [ ] Self-healing system operational
- [ ] All health checks passing
- [ ] All tests >90% coverage
- [ ] Complete documentation
- [ ] Rollback tested for all agents

## Resources

- Docker Documentation: https://docs.docker.com/
- MCP SDK: https://github.com/modelcontextprotocol/sdk
- Playwright: https://playwright.dev/
- GitHub Container Registry: https://docs.github.com/packages

## Support

For build issues:
1. Check health endpoint: `curl http://localhost:300X/health`
2. View container logs: `docker logs mcp-<name>`
3. Review GitHub Actions: `.github/workflows/`
4. Check rollback history: `logs/rollbacks/history.log`

---

**Status**: Foundation Complete ✅ | Agent Implementation In Progress ⏳
**Last Updated**: November 17, 2025
**Version**: Infrastructure v1.0.0
