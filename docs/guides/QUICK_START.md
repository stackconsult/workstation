# Quick Start Guide

Get up and running with stackBrowserAgent in 5 minutes.

## Prerequisites

- Node.js 18.x or 20.x
- npm 8.x or higher

## Installation

### 1. Clone and Install

```bash
git clone https://github.com/creditXcredit/workstation.git
cd workstation
npm ci
```

### 2. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Generate secure JWT secret
openssl rand -base64 32

# Edit .env and paste the generated secret
nano .env
```

**Required `.env` contents:**
```bash
JWT_SECRET=<paste-your-generated-secret-here>
JWT_EXPIRATION=24h
NODE_ENV=development
PORT=3000
```

### 3. Verify Setup

```bash
# Run linter
npm run lint

# Build project
npm run build

# Run tests
npm test
```

### 4. Start Server

```bash
# Development mode (with auto-reload)
npm run dev

# Or production mode
npm start
```

### 5. Test API

```bash
# Check health
curl http://localhost:3000/health

# Get demo token
curl http://localhost:3000/auth/demo-token

# Use token to access protected endpoint
TOKEN="<token-from-previous-step>"
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/protected
```

## Docker Quick Start

### Using Docker

```bash
# Build image
docker build -t stackbrowseragent .

# Run container
docker run -p 3000:3000 \
  -e JWT_SECRET="$(openssl rand -base64 32)" \
  -e NODE_ENV=production \
  stackbrowseragent
```

### Using Docker Compose

```bash
# Set JWT_SECRET in .env.production
echo "JWT_SECRET=$(openssl rand -base64 32)" > .env.production
echo "NODE_ENV=production" >> .env.production

# Start services
docker-compose up -d

# Check logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Common Commands

```bash
# Development
npm run dev              # Start dev server with auto-reload
npm run lint             # Check code style
npm test                 # Run tests
npm test -- --coverage   # Run tests with coverage report

# Production
npm run build            # Compile TypeScript
npm start                # Start production server

# Testing
npm run test:watch       # Run tests in watch mode
npm run test:integration # Run integration tests only

# Validation
npm run validate         # Run lint, build, and tests
```

## Next Steps

1. **Read Documentation:**
   - [Enterprise Automation Guide](ENTERPRISE_AUTOMATION.md)
   - [API Documentation](../api/API.md)
   - [Architecture Guide](../architecture/ARCHITECTURE.md)

2. **Explore Features:**
   - JWT Authentication
   - Rate Limiting
   - Health Monitoring
   - Browser Automation (Playwright)
   - Phase 1 Workflow System

3. **Local Development:**
   - Set up your IDE with TypeScript support
   - Install recommended VS Code extensions
   - Configure ESLint in your editor

4. **Contribute:**
   - Read [Contributing Guide](../../CONTRIBUTING.md)
   - Check [open issues](https://github.com/creditXcredit/workstation/issues)
   - Submit pull requests

## Troubleshooting

### Server won't start

**Error:** `Unsafe JWT_SECRET configured`

**Fix:**
```bash
# Generate new secret
openssl rand -base64 32

# Update .env
JWT_SECRET=your-new-secret-here
```

### Port already in use

**Error:** `EADDRINUSE`

**Fix:**
```bash
# Use different port
PORT=3001 npm start
```

### Tests failing

**Fix:**
```bash
# Clean reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
npm test
```

## Getting Help

- **Documentation:** [docs/](../)
- **Issues:** [GitHub Issues](https://github.com/creditXcredit/workstation/issues)
- **Discussions:** [GitHub Discussions](https://github.com/creditXcredit/workstation/discussions)

---

**Ready to go?** Jump to the [Enterprise Automation Guide](ENTERPRISE_AUTOMATION.md) for advanced features!
