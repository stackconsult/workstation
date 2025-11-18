# 🖥️ Workstation

**Privacy-First Browser Automation Platform**

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/stackbrowseragent)
[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-blue)](https://modelcontextprotocol.io)
![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue)
![Test Coverage](https://img.shields.io/badge/coverage-94%25-brightgreen)
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
Workstation is a comprehensive browser automation platform that combines:
- 🤖 **Playwright-based browser control** - Navigate, click, type, extract, screenshot
- 🔐 **Enterprise JWT authentication** - Secure API with rate limiting and CORS
- 🔄 **Workflow orchestration** - Multi-step automation with retry logic
- 💾 **Data persistence** - SQLite/PostgreSQL workflow storage
- 🎨 **Web dashboard** - Beautiful UI for management
- 🐳 **Easy deployment** - Docker, Railway, or local
- 🔌 **MCP Integration** - Model Context Protocol for GitHub Copilot and AI agents

**Perfect for:** Web scraping, form automation, E2E testing, monitoring, data collection, and AI-powered browser automation.

**Current Status**: 
- ✅ **Phase 1 Complete**: Full browser automation with 7 core actions
- ✅ **146 Tests Passing**: Production-ready code quality
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
📊 Total Tests:             146 tests (100% passing)
📊 Test Coverage:           65.66%
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

**Test Coverage**: 65.66% statements, 48.57% branches, 67.01% functions, 65.43% lines (146 tests)

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
- ✅ 146 tests passing with 65.66% coverage

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

**Built with ❤️ using TypeScript, Express, Playwright, and modern web technologies.**

