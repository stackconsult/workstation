# Build Documentation - Security Enhanced

## Overview

This document provides build instructions for the stackBrowserAgent with security enhancements implemented in v1.1.0.

---

## Prerequisites

### System Requirements

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Operating System**: Linux, macOS, or Windows (WSL recommended)
- **Memory**: Minimum 512MB RAM
- **Disk Space**: 500MB free space

### Development Tools

```bash
# Install Node.js (using nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# Verify installation
node --version  # Should be v18.x.x or higher
npm --version   # Should be v9.x.x or higher
```

---

## Building from Source

### 1. Clone Repository

```bash
git clone https://github.com/creditXcredit/workstation.git
cd workstation
```

### 2. Install Dependencies

```bash
# Clean install (recommended for production builds)
npm ci

# Or regular install (for development)
npm install
```

**Expected output:**
```
added 568 packages, and audited 569 packages in 15s
85 packages are looking for funding
found 0 vulnerabilities
```

### 3. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit with your configuration
nano .env
```

**Required configuration:**

```env
# CRITICAL: Set strong JWT secret (minimum 32 characters)
JWT_SECRET=generate-secure-secret-use-command-below-min-32-chars

# Token expiration (default: 24 hours)
JWT_EXPIRATION=24h

# Server port
PORT=3000

# Node environment (development, production, test)
NODE_ENV=development

# CORS allowed origins (comma-separated)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Logging level (error, warn, info, debug)
LOG_LEVEL=info
```

**Generate secure JWT secret:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Lint Code

```bash
npm run lint
```

**Expected output:**
```
> stackbrowseragent@1.0.0 lint
> eslint src --ext .ts
```

No output means linting passed successfully.

### 5. Build Application

```bash
npm run build
```

**Expected output:**
```
> stackbrowseragent@1.0.0 build
> tsc
```

**Build artifacts created:**
- `dist/` - Compiled JavaScript files
- `dist/index.js` - Main entry point
- `dist/**/*.js` - All compiled modules
- `dist/**/*.d.ts` - TypeScript declaration files

### 6. Run Tests

```bash
npm test
```

**Expected output:**
```
PASS tests/auth.test.ts
PASS tests/integration.test.ts

Test Suites: 2 passed, 2 total
Tests:       23 passed, 23 total
Snapshots:   0 total
Time:        3.5s
```

---

## Build Modes

### Development Build

```bash
# Development mode (with hot reload)
npm run dev

# Uses ts-node for direct TypeScript execution
# No build step required
```

**Features:**
- Hot reload on file changes
- Detailed error messages
- Stack traces in responses
- Debug logging enabled

### Production Build

```bash
# 1. Ensure environment is configured
export NODE_ENV=production
export JWT_SECRET="your-production-secret-min-32-chars"
export ALLOWED_ORIGINS="https://yourdomain.com"

# 2. Clean and build
rm -rf dist/
npm ci --production
npm run build

# 3. Start application
npm start
```

**Features:**
- Optimized JavaScript code
- Generic error messages (security)
- No stack traces leaked
- Production logging only
- File logging enabled

### Test Build

```bash
# Run tests with coverage
npm test -- --coverage

# View coverage report
open coverage/lcov-report/index.html
```

---

## Security-Enhanced Build Process

### Pre-Build Security Checks

```bash
# 1. Check for vulnerabilities
npm audit

# 2. Check for hardcoded secrets (should fail if .env committed)
if [ -f .env ] && git ls-files --error-unmatch .env 2>/dev/null; then
  echo "ERROR: .env file should not be committed!"
  exit 1
fi

# 3. Verify JWT_SECRET not hardcoded
if grep -r "JWT_SECRET.*=.*['\"]" src/ 2>/dev/null | grep -v "process.env"; then
  echo "ERROR: JWT_SECRET appears to be hardcoded!"
  exit 1
fi

# 4. Lint code
npm run lint

# 5. Run tests
npm test
```

### Build with Security Validation

```bash
#!/bin/bash
# secure-build.sh

set -e  # Exit on error

echo "🔍 Starting secure build process..."

# 1. Security checks
echo "1. Running security audit..."
npm audit --audit-level=high

# 2. Lint code
echo "2. Linting code..."
npm run lint

# 3. Run tests
echo "3. Running tests..."
npm test

# 4. Build application
echo "4. Building application..."
npm run build

# 5. Verify build artifacts
echo "5. Verifying build artifacts..."
if [ ! -f "dist/index.js" ]; then
  echo "ERROR: Build failed - dist/index.js not found"
  exit 1
fi

# 6. Production environment check
if [ "$NODE_ENV" = "production" ]; then
  echo "6. Validating production configuration..."
  
  if [ -z "$JWT_SECRET" ]; then
    echo "ERROR: JWT_SECRET not set for production"
    exit 1
  fi
  
  if [ ${#JWT_SECRET} -lt 32 ]; then
    echo "ERROR: JWT_SECRET must be at least 32 characters"
    exit 1
  fi
  
  if [ -z "$ALLOWED_ORIGINS" ]; then
    echo "WARNING: ALLOWED_ORIGINS not set - CORS will block all origins"
  fi
fi

echo "✅ Secure build completed successfully!"
```

**Usage:**

```bash
chmod +x secure-build.sh
./secure-build.sh
```

---

## Docker Build

### Build Docker Image

```bash
# Build image
docker build -t stackbrowseragent:latest .

# Build with specific tag
docker build -t stackbrowseragent:1.1.0 .

# Build with security enhancements
docker build --no-cache -t stackbrowseragent:secure .
```

### Run Docker Container

```bash
# Run with environment variables
docker run -d \
  -p 3000:3000 \
  -e JWT_SECRET="your-secure-secret-min-32-chars" \
  -e ALLOWED_ORIGINS="https://yourdomain.com" \
  -e NODE_ENV=production \
  --name stackbrowseragent \
  stackbrowseragent:latest

# Check logs
docker logs -f stackbrowseragent

# Stop container
docker stop stackbrowseragent
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - JWT_SECRET=${JWT_SECRET}
      - ALLOWED_ORIGINS=${ALLOWED_ORIGINS}
      - NODE_ENV=production
      - LOG_LEVEL=info
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

**Build and run:**

```bash
# Create .env.docker file
cat > .env.docker << EOF
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
ALLOWED_ORIGINS=https://yourdomain.com
EOF

# Build and start
docker-compose --env-file .env.docker up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

---

## CI/CD Integration

### GitHub Actions Build

```yaml
# .github/workflows/build.yml
name: Build and Test

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run security audit
        run: npm audit --audit-level=high
      
      - name: Lint code
        run: npm run lint
      
      - name: Build application
        run: npm run build
      
      - name: Run tests
        run: npm test
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: dist-${{ matrix.node-version }}
          path: dist/
          retention-days: 7
```

---

## Build Troubleshooting

### Common Build Errors

#### Error: TypeScript compilation failed

```bash
# Clean and rebuild
rm -rf dist/ node_modules/
npm install
npm run build
```

#### Error: Tests failing

```bash
# Check test environment
NODE_ENV=test npm test

# Run specific test
npm test -- tests/auth.test.ts

# Run with verbose output
npm test -- --verbose
```

#### Error: Linting errors

```bash
# Auto-fix linting issues
npm run lint -- --fix

# Check specific file
npx eslint src/index.ts
```

#### Error: npm audit vulnerabilities

```bash
# Try auto-fix
npm audit fix

# Force fix (may have breaking changes)
npm audit fix --force

# Manual fix
npm update <package-name>
```

---

## Build Verification

### Post-Build Checklist

```bash
# 1. Verify dist/ directory exists
ls -la dist/

# 2. Check main entry point
ls -la dist/index.js

# 3. Verify TypeScript declarations
ls -la dist/**/*.d.ts

# 4. Test built application
node dist/index.js &
PID=$!
sleep 3

# 5. Health check
curl http://localhost:3000/health

# 6. Cleanup
kill $PID
```

### Security Verification

```bash
# 1. No secrets in built files
grep -r "JWT_SECRET.*=.*['\"]" dist/ || echo "✓ No hardcoded secrets"

# 2. No .env in build
ls dist/.env 2>/dev/null && echo "✗ .env found in build!" || echo "✓ No .env in build"

# 3. Verify security headers
npm start &
sleep 3
curl -I http://localhost:3000/health | grep -E "X-|Content-Security|Strict-Transport"
pkill -f "node dist/index.js"
```

---

## Build Optimization

### Production Optimizations

```bash
# 1. Use production dependencies only
npm ci --production

# 2. Remove dev dependencies from package.json
npm prune --production

# 3. Enable production mode
export NODE_ENV=production

# 4. Build with optimizations
npm run build
```

### Build Size Optimization

```bash
# Check build size
du -sh dist/

# Analyze bundle
npm install -g source-map-explorer
source-map-explorer dist/index.js dist/index.js.map
```

---

## Deployment Builds

### Railway Deployment

```bash
# Railway builds automatically from main branch
# Ensure railway.json is configured

# Manual deployment
railway up
```

### Heroku Deployment

```bash
# Create Procfile
echo "web: npm start" > Procfile

# Deploy
heroku create stackbrowseragent
git push heroku main

# Set environment variables
heroku config:set JWT_SECRET="your-secret"
heroku config:set ALLOWED_ORIGINS="https://yourapp.herokuapp.com"
```

### AWS Elastic Beanstalk

```bash
# Create .ebextensions/environment.config
mkdir -p .ebextensions
cat > .ebextensions/environment.config << EOF
option_settings:
  aws:elasticbeanstalk:application:environment:
    NODE_ENV: production
    JWT_EXPIRATION: 24h
EOF

# Deploy
eb init -p node.js-18 stackbrowseragent
eb create production
eb setenv JWT_SECRET="your-secret" ALLOWED_ORIGINS="https://yourdomain.com"
```

---

## Build Maintenance

### Regular Build Tasks

```bash
# Weekly security update
npm audit
npm update
npm test
npm run build

# Monthly dependency update
npm outdated
npm update --save
npm test
npm run build

# Quarterly major updates
npx npm-check-updates -u
npm install
npm test
npm run build
```

---

## Support

For build issues:
- GitHub Issues: https://github.com/creditXcredit/workstation/issues
- Documentation: See README.md and CONTRIBUTING.md

---

**Document Version**: 1.0  
**Last Updated**: November 14, 2024  
**Build Version**: 1.1.0 (Security Enhanced)
