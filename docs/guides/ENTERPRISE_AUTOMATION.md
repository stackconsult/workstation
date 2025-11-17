# Enterprise Automation Guide

## Overview

This guide documents the enterprise-grade automation, security, and quality assurance features implemented in the stackBrowserAgent workstation system. These features ensure production-ready deployments with comprehensive monitoring, testing, and fail-safe mechanisms.

## Table of Contents

1. [CI/CD Pipeline Features](#cicd-pipeline-features)
2. [Error Handling System](#error-handling-system)
3. [Security Guards](#security-guards)
4. [Quick Start Guide](#quick-start-guide)
5. [Local Development](#local-development)
6. [Docker Deployment](#docker-deployment)
7. [Troubleshooting](#troubleshooting)

---

## CI/CD Pipeline Features

### Automated Browser Testing

The CI pipeline automatically installs all Playwright browsers with system dependencies before running tests.

**Configuration Location:** `.github/workflows/ci.yml`

```yaml
- name: Install Playwright Browsers (Full)
  run: npx playwright install --with-deps
```

**Browsers Installed:**
- Chromium (latest stable)
- Firefox (latest stable)
- WebKit (latest stable)

**System Dependencies:** Automatically installed on Ubuntu runners including graphics libraries, fonts, and media codecs.

### Dependency Mapping

Automatically generates visual dependency graphs on every CI run.

```yaml
- name: Generate dependency map
  run: |
    npm install -g madge
    madge --image dependency-graph.svg --extensions ts,js src
```

**Output:** `dependency-graph.svg` uploaded as GitHub Actions artifact

**Usage:**
1. Navigate to Actions tab in GitHub
2. Select latest workflow run
3. Download "dependency-graph" artifact
4. Open `dependency-graph.svg` to visualize codebase dependencies

### Documentation Generation

Automatically generates TypeDoc documentation from TypeScript source code.

```yaml
- name: Generate documentation
  run: |
    npm install -g typedoc
    npx typedoc --out docs-generated src
```

**Output:** Complete API documentation in `docs-generated` folder

**Access:**
1. Download "documentation" artifact from GitHub Actions
2. Open `docs-generated/index.html` in browser
3. Browse auto-generated API documentation

### Test Coverage Requirements

**Minimum Coverage:** 90% overall

**Coverage Report:** Generated on every test run

```bash
npm test -- --coverage
```

**Coverage Enforcement:**
- CI fails if coverage drops below thresholds
- Per-file coverage thresholds defined in `jest.config.js`
- Coverage reports uploaded to Codecov (optional)

### Secret Scanning

**Tool:** Gitleaks

Automatically scans every commit for accidentally committed secrets.

**Protected Patterns:**
- API keys
- Private keys
- Passwords
- JWT secrets
- Database credentials
- OAuth tokens

**Failure Behavior:**
- CI fails immediately if secrets detected
- No merge allowed until secrets removed
- GitHub Security tab shows scan results

### Automated Issue Creation

CI automatically creates GitHub Issues when failures occur.

**Issue Created When:**
- Test failures
- Build failures
- Security vulnerabilities
- Coverage drops
- Secret leaks detected
- Playwright browser installation fails

**Issue Content:**
- Workflow name and run ID
- Branch and commit SHA
- Triggered by user
- Link to workflow run
- Checklist of action items
- Labels: `automation-fail`, `blocking`

**Smart Duplicate Prevention:**
- Checks for existing open issues on same branch
- If found within 24 hours, adds comment instead of new issue
- Prevents issue spam

---

## Error Handling System

### AppError Class

Custom error class for operational errors with structured metadata.

**Location:** `src/middleware/errorHandler.ts`

**Usage:**

```typescript
import { AppError } from './middleware/errorHandler';

// Create operational error
throw new AppError(
  404,                    // HTTP status code
  'Resource not found',   // Error message
  'RESOURCE_NOT_FOUND',   // Error code
  true                    // isOperational (default: true)
);

// Non-operational error (system failure)
throw new AppError(
  500,
  'Database connection failed',
  'DB_CONNECTION_FAILED',
  false  // Won't expose message to clients in production
);
```

**Properties:**
- `statusCode`: HTTP status code (400, 404, 500, etc.)
- `message`: Human-readable error message
- `code`: Machine-readable error code (e.g., 'VALIDATION_ERROR')
- `isOperational`: Whether error is expected/safe to expose

### Global Error Handler

Centralized error handling with security best practices.

**Features:**
- Structured JSON responses
- Error code for machine parsing
- Timestamp for debugging
- Request path logging
- Stack trace protection (never sent to clients)
- Environment-aware messaging

**Response Format:**

```json
{
  "error": "Resource not found",
  "code": "RESOURCE_NOT_FOUND",
  "timestamp": "2025-11-17T22:00:00.000Z",
  "path": "/api/users/123",
  "message": "Detailed error (only in development)"
}
```

**Production vs Development:**

| Feature | Production | Development |
|---------|-----------|-------------|
| Stack traces in response | ❌ Never | ❌ Never |
| Stack traces in logs | ❌ No | ✅ Yes |
| Detailed error messages | ⚠️ Only operational | ✅ Always |
| Generic "Internal server error" | ✅ Non-operational | ❌ No |

**Example Usage in Routes:**

```typescript
import { AppError } from '../middleware/errorHandler';

app.get('/api/users/:id', authenticateToken, async (req, res, next) => {
  try {
    const user = await findUser(req.params.id);
    
    if (!user) {
      // Operational error - safe to show to client
      throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
    }
    
    res.json({ user });
  } catch (error) {
    // Pass to error handler
    next(error);
  }
});
```

### 404 Handler

Handles all unmatched routes with consistent format.

**Response:**

```json
{
  "error": "Not found",
  "code": "NOT_FOUND",
  "path": "/api/invalid-endpoint",
  "timestamp": "2025-11-17T22:00:00.000Z"
}
```

---

## Security Guards

### JWT Secret Validation

**Critical:** Server refuses to start with unsafe JWT secrets.

**Location:** `src/index.ts` (before all imports)

**Validation Rules:**

1. **Production:**
   - JWT_SECRET must be set
   - Must not be 'changeme'
   - Must not be default value
   - Minimum 32 characters recommended

2. **Development:**
   - Warning logged if using defaults
   - Server starts anyway

3. **Test:**
   - No validation (allows test secrets)

**Example Error:**

```
FATAL: Unsafe JWT_SECRET configured. Server will not start.
JWT_SECRET must be set to a secure value in production (at least 32 characters).
Current value is either missing or using a default/unsafe value.
```

**Fix:**

```bash
# Generate secure secret
openssl rand -base64 32

# Set in .env
JWT_SECRET=your-secure-random-string-here
```

### Global Exception Handlers

**Purpose:** Prevent silent failures and ensure proper cleanup.

**Location:** `src/index.ts` (very first lines)

**Handlers:**

```typescript
process.on('uncaughtException', (err: Error) => {
  console.error('FATAL: Unhandled exception:', err);
  console.error('Stack trace:', err.stack);
  process.exit(1);  // Exit immediately
});

process.on('unhandledRejection', (reason: unknown) => {
  console.error('FATAL: Unhandled promise rejection:', reason);
  process.exit(1);  // Exit immediately
});
```

**Behavior:**
- Logs full error details to stderr
- Exits with code 1 (failure)
- Prevents zombie processes
- Enables orchestrator to restart service

---

## Quick Start Guide

### Prerequisites

- Node.js 18.x or 20.x
- npm 8.x or higher
- Docker (optional, for containerized deployment)
- Git

### Installation

```bash
# Clone repository
git clone https://github.com/creditXcredit/workstation.git
cd workstation

# Install dependencies
npm ci

# Create environment file
cp .env.example .env

# Edit .env and set secure JWT_SECRET
# Generate with: openssl rand -base64 32
nano .env
```

### Environment Configuration

**Required Variables:**

```bash
# .env
JWT_SECRET=your-secure-secret-here-minimum-32-chars
JWT_EXPIRATION=24h
NODE_ENV=development
PORT=3000
```

**Optional Variables:**

```bash
# CORS configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Logging
LOG_LEVEL=info
```

### Development Server

```bash
# Run linter
npm run lint

# Build TypeScript
npm run build

# Run tests
npm test

# Start development server (with auto-reload)
npm run dev

# Or start production build
npm start
```

### Verify Installation

```bash
# Check health endpoint
curl http://localhost:3000/health

# Get demo token
curl http://localhost:3000/auth/demo-token

# Test protected endpoint
TOKEN="your-token-here"
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/protected
```

---

## Local Development

### Development Workflow

```bash
# 1. Start development server
npm run dev

# 2. Make code changes

# 3. Run linter (in another terminal)
npm run lint

# 4. Run tests
npm test

# 5. Check coverage
npm test -- --coverage

# 6. Build production
npm run build
```

### Testing

**Run All Tests:**
```bash
npm test
```

**Run Specific Test Suite:**
```bash
npm test -- tests/errorHandler.test.ts
```

**Watch Mode:**
```bash
npm run test:watch
```

**Coverage Report:**
```bash
npm test -- --coverage
open coverage/lcov-report/index.html
```

### Linting

**Run ESLint:**
```bash
npm run lint
```

**Fix Auto-Fixable Issues:**
```bash
npm run lint -- --fix
```

### Building

**TypeScript Compilation:**
```bash
npm run build
```

**Output:** Compiled JavaScript in `dist/` directory

**Clean Build:**
```bash
rm -rf dist/
npm run build
```

---

## Docker Deployment

### Build Docker Image

```bash
# Build image
docker build -t stackbrowseragent:latest .

# Build with specific tag
docker build -t stackbrowseragent:v1.0.0 .
```

### Run Container

**Basic:**
```bash
docker run -p 3000:3000 \
  -e JWT_SECRET="your-secure-secret" \
  -e NODE_ENV=production \
  stackbrowseragent:latest
```

**With Environment File:**
```bash
docker run -p 3000:3000 \
  --env-file .env.production \
  stackbrowseragent:latest
```

**With Volume Mounts:**
```bash
docker run -p 3000:3000 \
  -e JWT_SECRET="your-secure-secret" \
  -e NODE_ENV=production \
  -v $(pwd)/logs:/app/logs \
  stackbrowseragent:latest
```

### Docker Compose

**File:** `docker-compose.yml`

```yaml
version: '3.8'
services:
  workstation:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - JWT_SECRET=${JWT_SECRET}
      - JWT_EXPIRATION=24h
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

**Commands:**
```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild and restart
docker-compose up -d --build
```

### GitHub Container Registry

**Pull from GHCR:**
```bash
# Latest version
docker pull ghcr.io/creditxcredit/workstation:latest

# Specific commit
docker pull ghcr.io/creditxcredit/workstation:sha-abc1234
```

**Run GHCR Image:**
```bash
docker run -p 3000:3000 \
  -e JWT_SECRET="your-secret" \
  -e NODE_ENV=production \
  ghcr.io/creditxcredit/workstation:latest
```

---

## Troubleshooting

### Server Won't Start

**Symptom:** `FATAL: Unsafe JWT_SECRET configured`

**Solution:**
```bash
# Generate secure secret
openssl rand -base64 32

# Update .env
JWT_SECRET=generated-secret-here
```

---

### Tests Failing

**Symptom:** Jest tests fail with coverage errors

**Solution:**
```bash
# Clean install dependencies
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build

# Run tests
npm test
```

---

### CI Pipeline Fails

**Symptom:** GitHub Actions workflow fails

**Solution:**
1. Check Actions tab for specific error
2. Look for automated issue creation
3. Review logs in failed job
4. Common issues:
   - Playwright browsers not installing
   - Coverage dropped below threshold
   - Linting errors
   - Secret detected

---

### Docker Build Fails

**Symptom:** `docker build` command fails

**Solution:**
```bash
# Use BuildKit
DOCKER_BUILDKIT=1 docker build -t stackbrowseragent .

# Check for multi-platform
docker buildx build --platform linux/amd64,linux/arm64 -t stackbrowseragent .
```

---

### Port Already in Use

**Symptom:** `EADDRINUSE: address already in use :::3000`

**Solution:**
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 npm start
```

---

### Database Connection Errors

**Symptom:** `SQLITE_MISUSE: Database is closed`

**Solution:**
```bash
# Reinitialize database
rm -rf *.db
npm run build
npm start
```

---

## Best Practices

### Security

1. **Never commit secrets**
   - Use `.env` files (in `.gitignore`)
   - Use environment variables in production
   - Rotate secrets regularly

2. **JWT Security**
   - Use strong secrets (32+ characters)
   - Set appropriate expiration times
   - Consider refresh token pattern for long-lived sessions

3. **Error Handling**
   - Use AppError for expected failures
   - Mark operational errors as `isOperational: true`
   - Never expose stack traces to clients
   - Log all errors internally

### Testing

1. **Maintain Coverage**
   - Target: 90%+ overall coverage
   - Write tests for new features first
   - Test edge cases and error paths

2. **Test Types**
   - Unit tests for utilities and services
   - Integration tests for API endpoints
   - Security tests for authentication flows

### CI/CD

1. **Monitor Pipelines**
   - Check for failed workflows
   - Review automated issues
   - Fix failures immediately

2. **Artifacts**
   - Download dependency graphs regularly
   - Review generated documentation
   - Check coverage trends

### Documentation

1. **Keep Updated**
   - Update docs with code changes
   - Document breaking changes
   - Add examples for new features

2. **Use Comments**
   - JSDoc for public APIs
   - Inline comments for complex logic
   - README for setup instructions

---

## Additional Resources

- [API Documentation](../api/API.md)
- [Architecture Guide](../architecture/ARCHITECTURE.md)
- [Contributing Guide](../../CONTRIBUTING.md)
- [Changelog](../../CHANGELOG.md)

---

## Support

For issues, questions, or contributions:
- GitHub Issues: https://github.com/creditXcredit/workstation/issues
- Pull Requests: https://github.com/creditXcredit/workstation/pulls

---

**Last Updated:** 2025-11-17  
**Version:** 1.0.0
