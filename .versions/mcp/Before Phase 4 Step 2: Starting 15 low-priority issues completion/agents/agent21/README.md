# Agent 21: Universal Automation Builder

## Overview

Agent 21 is a live, working automation system generator that creates personalized MCP servers and automation systems based on user requirements.

## Features

- **7-Question Interactive CLI** - Gather requirements through simple questionnaire
- **Real-Time Generation** - Creates complete working systems (not templates or examples)
- **MCP Server Creation** - Generates custom Model Context Protocol servers
- **Universal Templates** - Works for ANY use case and configuration
- **Complete Documentation** - Auto-generates README, API docs, architecture guides
- **Free-First** - Zero cost to operate, uses open-source tools
- **Production Ready** - Generates deployable, tested code

## Quick Start

### Install Dependencies

\`\`\`bash
cd agents/agent21
npm install
\`\`\`

### Build

\`\`\`bash
npm run build
\`\`\`

### Generate a System

\`\`\`bash
npm run generate
\`\`\`

Answer the 7 questions and Agent 21 will create a complete automation system for you!

## What Gets Generated

For each project, Agent 21 creates:

1. **Complete Project Structure**
   - src/ with organized code
   - tests/ with test setup
   - docs/ with comprehensive documentation
   - examples/ with usage examples

2. **Working MCP Server**
   - Full MCP protocol implementation
   - Tool definitions based on selected features
   - Handlers with real implementations
   - Type-safe TypeScript code

3. **Package Configuration**
   - package.json with all dependencies
   - tsconfig.json for TypeScript
   - .gitignore properly configured
   - .env.example with all needed variables

4. **Documentation**
   - README.md with quick start
   - API.md with all tools documented
   - ARCHITECTURE.md explaining design
   - CONTRIBUTING.md for developers

5. **Deployment Ready**
   - GitHub Actions CI/CD workflow
   - Docker support (if selected)
   - Railway/Vercel config (if selected)
   - Environment variable templates

## Supported Features

- 🌐 Browser Automation (Playwright)
- 📊 Database Support (SQLite)
- 📁 File Processing (CSV, Excel, PDF)
- 🔄 API Integration
- 📧 Email Notifications
- ⏰ Scheduled Tasks (Cron)
- 🎣 Webhook Support
- 🚀 REST API Server

## Supported Integrations

- GitHub
- Slack
- Discord
- Stripe
- SendGrid
- Twilio
- AWS
- Google Cloud

## Supported Use Cases

- E-commerce Automation
- Data Processing & Analytics
- Web Scraping & Monitoring
- Email & Communication
- Workflow Automation
- Testing & QA
- Social Media Management
- Custom Automation

## Example Usage

\`\`\`bash
$ npm run generate

🤖 Agent 21: Universal Automation Builder
Create personalized automation systems in minutes

? What is your project name? my-scraper
? Describe your automation system: Web scraping tool for e-commerce
? What is your primary use case? Web Scraping & Monitoring
? Select features to include: Browser Automation, API Integration, Database
? Select integrations (optional): GitHub, Slack
? How will you deploy this? Railway
? Output directory: ./generated-automation

📋 Configuration Summary:
────────────────────────────
Project: my-scraper
Use Case: web-scraping
Features: browser, api, database
Integrations: github, slack
Deployment: railway
────────────────────────────

? Generate automation system with these settings? Yes

⠹ Generating your automation system...
✔ System generated successfully!

📂 Location: ./generated-automation/my-scraper

🚀 Next steps:
  cd ./generated-automation
  npm install
  npm run dev

📖 Check README.md for detailed documentation
\`\`\`

## Architecture

Agent 21 consists of:

- **CLI Interface** (`src/cli.ts`) - Interactive questionnaire
- **Universal Builder** (`src/index.ts`) - Main orchestration
- **Automation Builder** (`src/generator/builder.ts`) - Project structure creation
- **Template Engine** (`src/generator/template-engine.ts`) - Code generation
- **MCP Generator** (`src/generator/mcp-generator.ts`) - MCP server creation
- **Docs Generator** (`src/generator/docs-generator.ts`) - Documentation creation

## Development

### Running in Development

\`\`\`bash
npm run dev
\`\`\`

### Building

\`\`\`bash
npm run build
\`\`\`

### Testing

\`\`\`bash
npm test
\`\`\`

## Technical Details

- **Language**: TypeScript
- **Runtime**: Node.js 18+
- **Dependencies**:
  - inquirer (interactive CLI)
  - chalk (colored output)
  - ora (spinners)
  - mustache (templating)
  - fs-extra (file operations)
  - js-yaml (YAML handling)

## License

MIT

## Author

Created as part of the workstation agent ecosystem.

---

**Agent 21**: Because every automation system should be as unique as the problem it solves.
