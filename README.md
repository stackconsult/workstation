# 🖥️ Workstation

**Privacy-First Browser Automation Platform**

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/stackbrowseragent)
[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-blue)](https://modelcontextprotocol.io)
![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue)
![Test Coverage](https://img.shields.io/badge/coverage-67%25-brightgreen)
![License](https://img.shields.io/badge/license-ISC-blue)

> **Local-first automation** with JWT authentication, workflow orchestration, and AI integration. Zero cloud costs. Full control. Production-ready.

---

## ✨ What is Workstation?

Workstation is a **production-ready** browser automation platform that combines:
- 🤖 **Playwright-based browser control** - Navigate, click, type, extract, screenshot (✅ LIVE)
- 🔐 **Enterprise JWT authentication** - Secure API with rate limiting and CORS (✅ LIVE)
- 🔄 **Workflow orchestration** - Multi-step automation with retry logic (✅ LIVE)
- 💾 **Data persistence** - SQLite/PostgreSQL workflow storage (✅ LIVE)
- 🎨 **Web dashboard** - Beautiful UI for management (✅ LIVE)
- 🐳 **Easy deployment** - Docker, Railway, or local (✅ LIVE)
- 🔌 **MCP Integration** - Model Context Protocol for GitHub Copilot and AI agents (✅ LIVE)
- 🛠️ **Coding Agent Service** - REST API for Git operations, branch management, and PR automation (✅ NEW)

**Perfect for:** Web scraping, form automation, E2E testing, monitoring, data collection, AI-powered browser automation, and automated code deployment workflows.

**Current Status**: 
- ✅ **Phase 1 Complete**: Full browser automation with 7 core actions
- ✅ **170 Tests Passing**: Production-ready code quality
- 🚧 **Phase 2 Active**: Building multi-agent ecosystem

---

## 🚀 Quick Start (30 seconds)

```bash
# Clone and install
git clone https://github.com/creditXcredit/workstation.git
cd workstation && npm install

# Start server
npm run dev

# Get authentication token
curl http://localhost:3000/auth/demo-token

# Open dashboard
open docs/landing.html
```

**Next Steps:**
- 📖 [Complete User Guide](docs/guides/HOW_TO_USE_BROWSER_AGENT.md)
- 🎯 [30-Second Tutorial](START_HERE.md)
- 📚 [Full Documentation](docs/DOCUMENTATION_INDEX.md)
- 🎨 [Interactive Dashboard](docs/index.html)

---

## 📊 Key Features

### 🤖 Browser Automation
- **7 Core Actions**: navigate, click, type, getText, screenshot, getContent, evaluate
- **Playwright Integration**: Full Chromium control (headless or headed)
- **Automatic Retries**: Exponential backoff for reliability
- **Error Handling**: Comprehensive error recovery

### 🔄 Workflow Engine
- **JSON Workflows**: Define multi-step automations
- **Task Tracking**: Real-time execution monitoring
- **Variable Substitution**: Dynamic parameter injection
- **Database Storage**: SQLite (dev) / PostgreSQL (prod)

### 🔐 Security First
- **JWT Authentication**: HS256/384/512 algorithms
- **Rate Limiting**: 100 req/15min, 10 auth req/15min
- **Security Headers**: Helmet integration (CSP, HSTS, XSS)
- **CORS Protection**: Configurable origin whitelist
- **GDPR Compliance**: IP anonymization in logs

### 🎨 User Interfaces
- **Landing Page**: Feature showcase and documentation
- **Simple Dashboard**: JWT and API testing
- **Control Center**: Advanced workflow management

### 🔄 MCP Repository Sync (NEW!)
- **Automated Sync**: Monitors private MCP repo every 5 minutes
- **Branch Watching**: Tracks main, develop, staging branches
- **Merge Detection**: Auto-triggers updates on merge events
- **Rollback System**: One-command rollback with 10 snapshots
- **Full Integration**: GitHub Actions automation included
- 📖 [Quick Start Guide](docs/MCP_SYNC_QUICKSTART.md) | [Full Documentation](docs/MCP_SYNC_SYSTEM.md)

### 🚀 Deployment Ready
- **Railway**: One-click deployment
- **Docker**: Multi-platform containers (amd64, arm64)
- **Local**: Quick start with npm
- **CI/CD**: GitHub Actions included

---

## 📊 Implementation Status

### Core Features (Phase 1) ✅ 95% Complete

| Feature | Status | Files | Tests | Details |
|---------|--------|-------|-------|---------|
| **Browser Agent** | ✅ Production | `src/automation/agents/core/browser.ts` | ✅ Passing | 7 actions, 235 lines |
| **Workflow Engine** | ✅ Production | `src/automation/orchestrator/engine.ts` | ✅ Passing | 325 lines, full retry logic |
| **Database Layer** | ✅ Production | `src/automation/db/` | ✅ Passing | 3 tables, 7 indexes |
| **REST API** | ✅ Production | `src/routes/automation.ts` | ✅ Passing | 7 endpoints |
| **JWT Auth** | ✅ Production | `src/auth/jwt.ts` | ✅ Passing | HS256/384/512 |
| **Rate Limiting** | ✅ Production | `src/index.ts` | ✅ Passing | 100 req/15min |
| **Docker Deploy** | ✅ Production | `Dockerfile`, Railway | ✅ Working | Multi-platform |

### Agent Ecosystem (Phase 2) 🚧 40% Complete

| Component | Status | Completion | Notes |
|-----------|--------|------------|-------|
| **Agent Registry** | ✅ Complete | 100% | `src/automation/agents/core/registry.ts` |
| **Browser Agent** | ✅ Complete | 100% | Full Playwright integration |
| **Data Agents** | ⏳ Planned | 0% | CSV, JSON, Excel, PDF |
| **Integration Agents** | ⏳ Planned | 0% | Email, Sheets, Calendar |
| **Storage Agents** | ⏳ Planned | 0% | File, Database, S3 |
| **Parallel Execution** | ⏳ Planned | 0% | DAG-based task scheduling |

### Advanced Features (Phase 3-4) ⏳ 10-15% Complete

| Feature | Status | Notes |
|---------|--------|-------|
| **Slack Integration** | ⏳ Planned | Infrastructure ready, SDK pending |
| **Multi-tenant Workspaces** | ⏳ Planned | Database schema ready |
| **Secrets Management** | ⏳ Planned | Encryption layer needed |
| **Metrics/Monitoring** | ⚠️ Partial | Health checks done, Prometheus pending |
| **Webhook System** | ⏳ Planned | Trigger type supported in DB |

### Code Quality Metrics

```
📊 Total Lines of Code:     3,367 lines (TypeScript)
📊 Total Test Files:        36 files
📊 Total Tests:             170 tests (100% passing)
📊 Test Coverage:           67.18% statements, 51.92% branches, 70.94% functions, 66.88% lines
📊 Agent Directories:       17 agents
📊 Documentation Files:     112 docs
📊 Build Status:            ✅ Passing
📊 Security Vulnerabilities: 0 critical/high
```

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [📖 Documentation Index](docs/DOCUMENTATION_INDEX.md) | Complete navigation of all docs |
| [🎯 START_HERE.md](START_HERE.md) | 30-second quick start |
| [📅 Project Timeline](PROJECT_TIMELINE.md) | Complete development history |
| [🚀 Development Phases](DEVELOPMENT_PHASES.md) | Detailed phase documentation |
| [📘 User Guide](docs/guides/HOW_TO_USE_BROWSER_AGENT.md) | Complete usage manual |
| [🛠️ Coding Agent Guide](docs/guides/CODING_AGENT.md) | Git operations REST API guide |
| [⚡ Quick Reference](docs/guides/CODING_AGENT_QUICK_REF.md) | Coding agent quick reference |
| [🔌 API Reference](docs/api/API.md) | REST API documentation |
| [📋 Data Schemas](docs/SCHEMAS.md) | JSON schemas for workflows & agents |
| [🏗️ Architecture](docs/architecture/ARCHITECTURE.md) | System design overview |
| [📊 Visual Documentation](docs/assets/diagrams/VISUAL_DOCUMENTATION.md) | 25+ Mermaid diagrams |
| [🛣️ Roadmap](docs/architecture/ROADMAP.md) | Future plans |
| [🔐 Security](docs/guides/SECURITY.md) | Security best practices |
| [🚀 Deployment](docs/guides/DEPLOYMENT.md) | Deployment options |
| [🔄 Rollback Procedures](ROLLBACK_PROCEDURES.md) | Emergency rollback and recovery |
| [🐛 CI/CD Fixes](CI_FIXES_DOCUMENTATION.md) | CI pipeline fixes and error prevention |
| [⚡ Integrated Deployment](DEPLOYMENT_INTEGRATED.md) | Full-stack deployment with rollback |
| [🚀 Integrated Quickstart](QUICKSTART_INTEGRATED.md) | Quickstart for integrated platform |

---

## 💻 Installation & Setup

### Local Development

1. **Clone the repository:**
```bash
git clone https://github.com/creditXcredit/workstation.git
cd workstation
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with your settings
```

**Security Note**: Generate a secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

4. **Start development server:**
```bash
npm run dev
```

5. **Build for production:**
```bash
npm run build
npm start
```

### Docker Deployment

```bash
# Build image
docker build -t workstation .

# Run container
docker run -p 3000:3000 -e JWT_SECRET=your_secret workstation
```

### Railway Deployment

Click the button above or visit:
```
https://railway.app/template/stackbrowseragent
```

---

## 🎯 Usage Examples

### Create a Workflow

```bash
# Get authentication token
TOKEN=$(curl -s http://localhost:3000/auth/demo-token | jq -r '.token')

# Create workflow
curl -X POST http://localhost:3000/api/v2/workflows \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Google Search",
    "description": "Search and screenshot",
    "definition": {
      "tasks": [
        {
          "name": "navigate",
          "agent_type": "browser",
          "action": "navigate",
          "parameters": {"url": "https://google.com"}
        },
        {
          "name": "screenshot",
          "agent_type": "browser",
          "action": "screenshot",
          "parameters": {"fullPage": true}
        }
      ]
    }
  }'
```

More examples in [`examples/workflows/`](examples/workflows/)

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run linting
npm run lint

# Check coverage scaling (prevents regression)
node scripts/coverage-scaling.js check
```

**Test Coverage**: 67.18% statements, 51.92% branches, 70.94% functions, 66.88% lines (170 tests)

**Quality Gates**:
- ✅ Global coverage: 55%+ statements required
- ✅ Critical components (auth, middleware): 95%+ required
- ✅ Coverage scaling: No regressions allowed
- ✅ All tests must pass before merge

See [CI/CD Fixes Documentation](CI_FIXES_DOCUMENTATION.md) for details on coverage thresholds and error prevention.

---

## 🤝 Contributing

We welcome contributions! Please see:
- [Contributing Guide](docs/guides/CONTRIBUTING.md)
- [Build Instructions](docs/guides/BUILD.md)
- [Architecture Overview](docs/architecture/ARCHITECTURE.md)

---

## 📄 License

ISC License - see [LICENSE](LICENSE) file for details.

---

## 🆘 Support

- 📖 [Documentation](docs/DOCUMENTATION_INDEX.md)
- 🐛 [Issue Tracker](https://github.com/creditXcredit/workstation/issues)
- 💬 [Discussions](https://github.com/creditXcredit/workstation/discussions)

---

## 🌟 Project Status

**Current Phase**: ✅ Phase 1 Complete (95%) | 🚧 Phase 2 In Progress (40%)

### What's Working Now ✅

**Browser Automation** (Production Ready)
- ✅ 7 core actions: navigate, click, type, getText, screenshot, getContent, evaluate
- ✅ Full Playwright integration with headless/headed support
- ✅ 170 tests passing with ~67% coverage

**Workflow Engine** (Production Ready)
- ✅ Complete orchestration system with retry logic
- ✅ Database-backed state persistence (SQLite/PostgreSQL)
- ✅ 7 REST API endpoints for workflow management
- ✅ JWT authentication and rate limiting

**Deployment** (Production Ready)
- ✅ Docker containerization (multi-platform)
- ✅ Railway one-click deployment
- ✅ Health check and monitoring endpoints

### Roadmap Progress

| Phase | Status | Completion |
|-------|--------|------------|
| Phase 0: JWT Auth & API | ✅ Complete | 100% |
| Phase 1: Browser Automation | ✅ Complete | 95% |
| Phase 2: Agent Ecosystem | 🚧 In Progress | 40% |
| Phase 3: Slack Integration | ⏳ Planned | 10% |
| Phase 4: Advanced Features | ⏳ Planned | 15% |
| Phase 5: Enterprise Scale | ⏳ Planned | 0% |

See detailed [Roadmap](docs/architecture/ROADMAP.md) for complete progress and timelines.

---

## 🔌 GitHub Copilot & MCP Integration

Workstation implements the Model Context Protocol (MCP), enabling seamless integration with GitHub Copilot and AI agents:

- **Natural Language Automation**: Control browser through Copilot chat
- **AI-Powered Workflows**: Let AI create and execute complex automations
- **Enterprise-Ready**: JWT auth, rate limiting, comprehensive security
- **Extensible**: Build custom tools and capabilities

**Quick Setup:**
```json
// .github/copilot/mcp-servers.json
{
  "mcpServers": {
    "workstation": {
      "url": "http://localhost:3000",
      "auth": { "type": "bearer", "token": "${WORKSTATION_TOKEN}" }
    }
  }
}
```

**Learn More:**
- [MCP Documentation](.mcp/README.md)
- [Publishing Guide](.mcp/guides/PUBLISHING.md)
- [API Usage](.mcp/guides/API_USAGE.md)
- [Ecosystem Vision](.mcp/guides/ECOSYSTEM_VISION.md)

---

---

## 🤖 Coding Agent & MCP Containers

Workstation includes a **dedicated coding agent (Agent 16)** for GitHub integration and code automation, deployed as an MCP container.

### What is the Coding Agent?

The Coding Agent provides:
- **GitHub API Integration**: Full repository, PR, issue, and commit management
- **Automated Code Reviews**: AI-powered pull request analysis and suggestions
- **Data Processing**: ETL pipelines and data transformation capabilities
- **MCP Server**: Standardized Model Context Protocol interface
- **Container-First**: Deployed via Docker with health checks and auto-recovery

### Quick Start

1. **Configure GitHub Token:**
   ```bash
   cp mcp-containers/.env.example mcp-containers/.env
   # Edit .env and add your GITHUB_TOKEN
   ```

2. **Start Coding Agent:**
   ```bash
   docker-compose -f mcp-containers/docker-compose.mcp.yml up -d mcp-16-data-processing
   ```

3. **Verify Health:**
   ```bash
   curl http://localhost:3016/health
   ```

### MCP Container Architecture

All 20+ agents run as dedicated MCP containers with:
- **Isolated Environments**: Each agent in its own container
- **Port Mapping**: Ports 3000-3020 for agent access
- **Health Monitoring**: Automatic health checks every 30s
- **Auto Recovery**: Peelback script for automatic rollback
- **Orchestration**: Master orchestrator (Agent 20) coordinates all agents

### Available Endpoints

Agent 16 exposes these endpoints:

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Health check |
| `GET /mcp/info` | MCP metadata |
| `GET /api/github/repos` | List repositories |
| `GET /api/github/pulls/:owner/:repo` | List pull requests |
| `GET /api/github/issues/:owner/:repo` | List issues |
| `GET /api/github/commits/:owner/:repo` | List commits |
| `POST /api/code/analyze` | Analyze code quality |

### Deployment

**Start all MCP containers:**
```bash
docker-compose -f mcp-containers/docker-compose.mcp.yml up -d
```

**Rollback on failure:**
```bash
./.docker/peelback.sh
```

**Check status:**
```bash
docker-compose -f mcp-containers/docker-compose.mcp.yml ps
```

### Documentation

- [MCP Containers README](mcp-containers/README.md) - Full container documentation
- [Agent 16 Assignment](.agents/agent-16-assignment.json) - Agent configuration
- [Coding Agent Source](tools/coding-agent/src/index.ts) - Implementation details
- [Rollback Guide](ROLLBACK.md) - Quick rollback reference
- [Architecture](ARCHITECTURE.md) - System architecture

### Requirements

- **GITHUB_TOKEN**: Required for Agent 16 GitHub API access
- **Docker 20.10+**: For containerized deployment
- **Docker Compose 2.0+**: For orchestration
## 🤖 Coding Agent & MCP Containers

Workstation provides a **live MCP container ecosystem** with 20 specialized agents, orchestrated through Docker and nginx proxy. Agent-16 (Data Processing MCP) is designated as the **MCP Container Manager**.

### Overview

The coding agent enables:
- **Automated Branch Management**: Push branches and sync with GitHub
- **Container Orchestration**: Manage 20 MCP containers via agent-16
- **Docker Peelback Support**: Roll back container layers to previous versions
- **Health Monitoring**: Automated health checks and recovery

### MCP Container Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    nginx-proxy (Port 80)                 │
│              Routes traffic to MCP containers            │
└───────────────────┬─────────────────────────────────────┘
                    │
     ┌──────────────┼──────────────┐
     │              │              │
┌────▼────┐   ┌────▼────┐   ┌────▼────┐
│ MCP-01  │   │ MCP-16  │...│ MCP-20  │
│ Port    │   │ Port    │   │ Port    │
│ 3001    │   │ 3016    │   │ 3020    │
│         │   │ (Manager│   │         │
│         │   │  Agent) │   │         │
└─────────┘   └─────────┘   └─────────┘
```

### Running MCP Containers Locally

**1. Start All Containers:**
```bash
cd /home/runner/work/workstation/workstation
docker-compose -f docker-compose.mcp.yml up -d
```

**2. Check Health:**
```bash
# Check nginx proxy
curl http://localhost/health

# Check individual containers
curl http://localhost:3016/health  # Agent-16 (Manager)
```

**3. View Logs:**
```bash
docker-compose -f docker-compose.mcp.yml logs -f mcp-16-data
```

**4. Stop Containers:**
```bash
docker-compose -f docker-compose.mcp.yml down
```

### Docker Peelback Support

**Peelback** allows you to roll back container layers to a previous image tag:

```bash
# Roll back agent-16 to previous version
./.docker/peelback.sh mcp-16-data v1.0.0

# Roll back with safety checks
./.docker/peelback.sh mcp-16-data v1.0.0 --verify-health
```

**How Peelback Works:**
1. Stops the target container
2. Pulls the specified image tag
3. Starts container with the older image
4. Verifies health checks
5. Logs rollback event

### Agent-16: MCP Container Manager

Agent-16 (Data Processing MCP) is assigned to manage all MCP containers:

**Responsibilities:**
- Monitor container health
- Execute peelback operations
- Coordinate inter-container communication
- Report container status

**API Endpoint:**
```bash
# Get container status
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3016/api/containers/status

# Trigger peelback
curl -X POST -H "Authorization: Bearer $TOKEN" \
  http://localhost:3016/api/containers/peelback \
  -d '{"container":"mcp-01-selector","tag":"v1.0.0"}'
```

See [.agents/agent-16-assignment.json](.agents/agent-16-assignment.json) for full details.

### Coding Agent Tool

A lightweight TypeScript/Node tool for GitHub integration:

```bash
cd tools/coding-agent
npm install
npm run push-branch -- --branch feature/my-feature
```

**Environment Variables:**
```bash
export GITHUB_TOKEN=your_github_token
export MCP_MANAGER_AGENT=agent-16
export NODE_ENV=development
```

⚠️ **Security**: Never commit `GITHUB_TOKEN`. Use environment variables or secret management.

### Rollback Instructions

For complete rollback procedures including git-based, Docker image, and database rollback:

📖 **See [ROLLBACK.md](ROLLBACK.md)**

Key rollback scenarios:
- **Git Rollback**: Revert commits and reset branches
- **Docker Image Rollback**: Pull and deploy previous container versions
- **Database Rollback**: Restore from backups (if applicable)
- **Container Peelback**: Roll back individual container layers

### Additional Resources

- [MCP Containers README](mcp-containers/README.md) - Container details and setup
- [Architecture Documentation](ARCHITECTURE.md) - MCP topology and diagrams
- [Getting Started Guide](GETTING_STARTED.md) - Coding agent endpoints and examples
- [CI/CD Workflows](.github/workflows/README.md) - Container build and rollback procedures

---

**Built with ❤️ using TypeScript, Express, Playwright, and modern web technologies.**

