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

Workstation is a comprehensive browser automation platform that combines:
- 🤖 **Playwright-based browser control** - Navigate, click, type, extract, screenshot
- 🔐 **Enterprise JWT authentication** - Secure API with rate limiting and CORS
- 🔄 **Workflow orchestration** - Multi-step automation with retry logic
- 💾 **Data persistence** - SQLite/PostgreSQL workflow storage
- 🎨 **Web dashboard** - Beautiful UI for management
- 🐳 **Easy deployment** - Docker, Railway, or local
- 🔌 **MCP Integration** - Model Context Protocol for GitHub Copilot and AI agents

**Perfect for:** Web scraping, form automation, E2E testing, monitoring, data collection, and AI-powered browser automation.

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

**Phase 1**: ✅ Complete - Browser Automation Layer  
**Phase 2**: 🚧 In Progress - Agent Ecosystem  
**Phase 3**: 📋 Planned - Slack Integration & AI Features

See [Roadmap](docs/architecture/ROADMAP.md) for detailed plans.

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

