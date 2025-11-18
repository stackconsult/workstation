# Production Build and Enforcement Instructions

## Master Directive for Enterprise-Grade Automation

**Last Updated:** 2025-11-18
**Status:** ACTIVE - ENFORCED IN CI/CD

---

## 🛑 Agent Rules

- **No pseudocode. No filler. No outputs phrased as "for example." ONLY production-ready code.**
- **Do NOT mention or scaffold for Railway. All wiring runs locally and with Docker.**
- **Do NOT skip, stub, or defer. Every step is mandatory and fully enforced.**

---

## ✅ Implemented Features

### 1. Playwright Browsers - FULLY INSTALLED IN CI ✅

**Location:** `.github/workflows/ci.yml`

```yaml
- name: Install Playwright Browsers (Full)
  run: npx playwright install --with-deps
```

**Local Setup:**
```bash
npx playwright install --with-deps
```

**Status:** ✅ Enforced in CI, runs on every PR and push

---

### 2. Component Mapping & Documentation ✅

**Location:** `.github/workflows/ci.yml`

```yaml
- name: Generate dependency map
  run: npx madge --image dependency-graph.svg --extensions ts,js .

- name: Generate documentation
  run: npx typedoc --out docs/api src --skipErrorChecking

- name: Upload dependency graph
  uses: actions/upload-artifact@v4
  with:
    name: dependency-graph
    path: dependency-graph.svg

- name: Upload generated documentation
  uses: actions/upload-artifact@v4
  with:
    name: api-documentation
    path: docs/api
```

**Local Generation:**
```bash
# Generate dependency graph (requires Graphviz)
sudo apt-get install graphviz  # Ubuntu/Debian
brew install graphviz          # macOS
npx madge --image dependency-graph.svg --extensions ts,js .

# Generate TypeScript documentation
npx typedoc --out docs/api src --skipErrorChecking
```

**Status:** ✅ Generated on every CI run, artifacts available for download

---

### 3. JWT Secret Validation - FAIL FAST ✅

**Location:** `src/index.ts` (BEFORE all imports)

```typescript
// ✅ JWT Secret Environment Validation (BEFORE imports to fail fast)
import dotenv from 'dotenv';
dotenv.config();

// Validate JWT_SECRET before server initialization - FAIL FAST
if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'changeme') {
  console.error('❌ FATAL: Unsafe JWT_SECRET configured. Server will not start.');
  console.error('   Set a secure JWT_SECRET in your .env file');
  throw new Error('Unsafe JWT_SECRET configured. Server will not start.');
}
```

**Generate Secure Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Status:** ✅ Server refuses to start with insecure JWT_SECRET

---

### 4. Error Handling Middleware ✅

**Location:** `src/middleware/errorHandler.ts` (already implemented)

**Implementation:**
```typescript
// Global error handler in src/index.ts
app.use(errorHandler);  // Must be LAST middleware
```

**Features:**
- Production vs development error responses
- Structured error logging
- HTTP status code mapping
- Security - no stack traces in production

**Status:** ✅ Comprehensive error handling active

---

### 5. Fail-Fast Global Logging ✅

**Location:** `src/index.ts` (BEFORE server initialization)

```typescript
// 🛡️ Fail-Fast Global Error Handlers - MUST be before server initialization
process.on('uncaughtException', (err) => {
  console.error('❌ FATAL: Unhandled exception:', err);
  logger.error('Unhandled exception - shutting down', { error: err.message, stack: err.stack });
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('❌ FATAL: Unhandled promise rejection:', err);
  logger.error('Unhandled promise rejection - shutting down', { error: err });
  process.exit(1);
});
```

**Status:** ✅ All unhandled errors cause immediate shutdown with logging

---

### 6. Strict Agent Initialization & Cleanup ✅

**Example Implementation:** `src/automation/agents/core/browser.ts`

```typescript
class BrowserAgent {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;

  async initialize(): Promise<void> {
    if (this.browser) {
      logger.warn('Browser agent already initialized');
      return;
    }
    
    this.browser = await chromium.launch({ headless: true });
    this.context = await this.browser.newContext();
    this.page = await this.context.newPage();
    
    logger.info('Browser agent initialized');
  }

  async close(): Promise<void> {
    try {
      if (this.page) await this.page.close();
      if (this.context) await this.context.close();
      if (this.browser) await this.browser.close();
      
      this.page = null;
      this.context = null;
      this.browser = null;
      
      logger.info('Browser agent closed cleanly');
    } catch (error) {
      logger.error('Error closing browser agent', { error });
      throw error;
    }
  }
}
```

**Status:** ✅ All agents follow strict init/cleanup pattern

---

### 7. Documentation and Schema Sync ✅

**Documentation Files:**
- `docs/DOCUMENTATION_INDEX.md` - Complete navigation
- `docs/guides/HOW_TO_USE_BROWSER_AGENT.md` - User guide
- `docs/api/API.md` - REST API reference
- `docs/architecture/ARCHITECTURE.md` - System design
- `docs/PRODUCTION_BUILD_ENFORCEMENT.md` - This file

**Update Requirements:**
- Every code change MUST update relevant docs
- Code snippets MUST be copy-paste ready
- No pseudocode in documentation
- All examples MUST be tested

**Status:** ✅ Documentation kept in sync with code

---

### 8. Security Enforcement ✅

**Implemented Measures:**

1. **No Secrets in Logs:**
   - IP addresses hashed before logging
   - JWT tokens never logged
   - Environment variables sanitized in logs

2. **Secret Detection in CI:**
   - TruffleHog secret scanning
   - GitHub Secret Scanning
   - npm audit for vulnerabilities

3. **Production Defaults:**
   - JWT_SECRET validation (fail-fast)
   - HTTPS headers enforced (Helmet)
   - CORS configured per environment
   - Rate limiting active

**Status:** ✅ Multi-layer security enforcement active

---

### 9. Block on Failure ✅

**CI Configuration:** `.github/workflows/ci.yml`

```yaml
- name: Check coverage scaling
  run: node scripts/coverage-scaling.js check
  continue-on-error: false  # BLOCKS on failure

- name: Run tests
  run: npm test
  # No continue-on-error - BLOCKS by default
```

**Blocking Checks:**
- ✅ Linting failures block merge
- ✅ Test failures block merge
- ✅ Build failures block merge
- ✅ Coverage threshold violations block merge
- ✅ Security vulnerabilities create alerts

**Status:** ✅ CI properly blocks on failures

---

### 10. Comprehensive Local/Docker Setup ✅

**README.md Updated:**
- Prerequisites listed (Node.js, npm, Playwright)
- Step-by-step local setup
- Docker deployment instructions
- Docker Compose configuration
- Production deployment guide
- Security warnings prominent

**Quick Start Test:**
```bash
# Clone and test
git clone https://github.com/creditXcredit/workstation.git
cd workstation
npm install
npx playwright install --with-deps
cp .env.example .env
# Edit .env with secure JWT_SECRET
npm run dev
```

**Status:** ✅ Accurate setup instructions matching actual code

---

## 🎯 Verification Checklist

Use this checklist to verify production readiness:

### Local Verification

```bash
# 1. Install dependencies
npm install

# 2. Install Playwright browsers
npx playwright install --with-deps

# 3. Generate secure JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Add to .env file

# 4. Run linter
npm run lint

# 5. Build project
npm run build

# 6. Run tests
npm test

# 7. Generate documentation
npx typedoc --out docs/api src --skipErrorChecking

# 8. Verify JWT_SECRET validation (should fail)
JWT_SECRET=changeme node dist/index.js
# Should see: "❌ FATAL: Unsafe JWT_SECRET configured"

# 9. Start server with valid secret
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))") npm start
```

### Docker Verification

```bash
# 1. Build image
docker build -t workstation .

# 2. Test with insecure secret (should fail)
docker run --rm -e JWT_SECRET=changeme workstation
# Should see: "❌ FATAL: Unsafe JWT_SECRET configured"

# 3. Run with secure secret
docker run -d --name workstation-test \
  -p 3000:3000 \
  -e JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))") \
  workstation

# 4. Check health
curl http://localhost:3000/health

# 5. Cleanup
docker stop workstation-test && docker rm workstation-test
```

### CI/CD Verification

```bash
# Check workflows
ls -la .github/workflows/

# Verify ci.yml contains:
# - Playwright installation with --with-deps
# - Graphviz installation
# - madge dependency graph generation
# - typedoc documentation generation
# - Artifact uploads
grep -A 3 "Install Playwright Browsers" .github/workflows/ci.yml
grep -A 3 "Generate dependency map" .github/workflows/ci.yml
```

---

## 🚦 CI/CD Status

### Current Workflow Status

| Workflow | Status | Purpose |
|----------|--------|---------|
| `ci.yml` | ✅ Active | Core CI: lint, build, test, docs, security |
| `secret-scan.yml` | ✅ Active | TruffleHog secret scanning |
| `audit-scan.yml` | ✅ Active | Comprehensive security audit (weekly) |
| `build-and-tag-images.yml` | ✅ Active | Docker image builds |

### Required Status Checks

These checks MUST pass before merge:

1. ✅ Test (Node 18.x)
2. ✅ Test (Node 20.x)
3. ✅ Security Audit
4. ✅ Linting
5. ✅ Build
6. ✅ Coverage Thresholds

---

## 📦 Dependencies

### Production Dependencies (Installed)

```json
{
  "playwright": "^1.56.1",
  "express": "^4.18.2",
  "jsonwebtoken": "^9.0.2",
  "winston": "^3.11.0",
  "helmet": "^8.1.0",
  "cors": "^2.8.5",
  "express-rate-limit": "^8.2.1",
  "sqlite3": "^5.1.7"
}
```

### Development Dependencies (Installed)

```json
{
  "typescript": "^5.3.2",
  "jest": "^29.7.0",
  "eslint": "^9.0.0",
  "madge": "^6.1.0",
  "typedoc": "^0.25.0",
  "audit-ci": "^7.1.0"
}
```

---

## 🔧 Maintenance

### Updating This Document

When making changes to the build/enforcement system:

1. Update this document FIRST
2. Implement the changes
3. Test locally
4. Update README.md if needed
5. Create PR with documentation updates
6. Verify CI passes

### Version History

| Date | Version | Changes |
|------|---------|---------|
| 2025-11-18 | 1.0 | Initial comprehensive documentation |

---

## 🆘 Troubleshooting

### Common Issues

**Issue: "Graphviz could not be found"**
```bash
# Ubuntu/Debian
sudo apt-get update && sudo apt-get install -y graphviz

# macOS
brew install graphviz

# Windows
choco install graphviz
```

**Issue: "Playwright browsers not installed"**
```bash
npx playwright install --with-deps
```

**Issue: "JWT_SECRET validation failing"**
```bash
# Generate secure secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Add to .env
echo "JWT_SECRET=your_generated_secret" >> .env
```

**Issue: "Tests failing in CI"**
```bash
# Run tests locally with CI environment
JWT_SECRET=test-secret-for-ci NODE_ENV=test npm test
```

---

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/creditXcredit/workstation/issues)
- **Documentation:** [Documentation Index](DOCUMENTATION_INDEX.md)
- **Security:** Report security issues privately to the maintainers

---

**End of Production Build Enforcement Documentation**
