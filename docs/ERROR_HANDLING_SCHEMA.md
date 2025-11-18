# 🔧 Error Handling Schema & Flow Documentation

## Executive Summary

This document provides a comprehensive visual and technical guide to error handling in enterprise CI/CD systems. It maps error patterns discovered in the Workstation repository, shows correct vs incorrect approaches, and provides actionable remediation paths.

---

## 📊 Error Classification Schema

```
┌─────────────────────────────────────────────────────────────────┐
│                    ERROR TAXONOMY TREE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─── 1. DEPENDENCY ERRORS                                     │
│  │    ├─ Missing packages (npm install not run)                │
│  │    ├─ Version conflicts (package-lock.json mismatch)        │
│  │    ├─ Deprecated packages (security vulnerabilities)        │
│  │    └─ Binary dependencies (Playwright browsers not installed)│
│  │                                                              │
│  ┌─── 2. CONFIGURATION ERRORS                                  │
│  │    ├─ Environment variables missing (JWT_SECRET undefined)  │
│  │    ├─ TypeScript config issues (lib/types misconfigured)    │
│  │    ├─ ESLint config problems (parser not found)             │
│  │    └─ Workflow YAML syntax errors                           │
│  │                                                              │
│  ┌─── 3. WORKFLOW ORCHESTRATION ERRORS                         │
│  │    ├─ Phantom checks (non-existent required status checks)  │
│  │    ├─ Artifact path mismatches (download/upload mismatch)   │
│  │    ├─ Workflow trigger conflicts                            │
│  │    └─ Permission scope issues                               │
│  │                                                              │
│  ┌─── 4. RUNTIME ERRORS                                        │
│  │    ├─ Database connection failures (SQLITE_MISUSE)          │
│  │    ├─ Browser launch failures (binary not found)            │
│  │    ├─ Memory leaks and resource exhaustion                  │
│  │    └─ Race conditions in async operations                   │
│  │                                                              │
│  └─── 5. SECURITY SCAN ERRORS                                  │
│       ├─ Vulnerability detection (npm audit critical)          │
│       ├─ Secret leaks (hardcoded credentials)                  │
│       ├─ Code quality issues (ESLint violations)               │
│       └─ License compliance violations                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Correct Error Handling Flow

### The Golden Pattern: Detect → Classify → Source → Fix → Verify

```
┌──────────────────────────────────────────────────────────────────────┐
│                    ENTERPRISE ERROR HANDLING FLOW                    │
└──────────────────────────────────────────────────────────────────────┘

   ┌─────────────┐
   │  1. DETECT  │  Automated scanning across all layers
   └──────┬──────┘
          │
          ├─→ Lint errors (ESLint)
          ├─→ Build errors (TypeScript compiler)
          ├─→ Test failures (Jest)
          ├─→ Security vulnerabilities (npm audit, CodeQL)
          ├─→ Workflow failures (GitHub Actions)
          │
          ▼
   ┌─────────────┐
   │ 2. CLASSIFY │  Categorize by severity and impact
   └──────┬──────┘
          │
          ├─→ CRITICAL: Security vulnerabilities, build blockers
          ├─→ HIGH: Test failures, missing dependencies
          ├─→ MEDIUM: Code quality issues, performance problems
          ├─→ LOW: Documentation gaps, minor warnings
          │
          ▼
   ┌─────────────┐
   │ 3. SOURCE   │  Find root cause and solutions
   └──────┬──────┘
          │
          ├─→ Check error messages and stack traces
          ├─→ Review recent changes (git history)
          ├─→ Search open-source solutions (GitHub Issues, Stack Overflow)
          ├─→ Consult documentation (official docs, community guides)
          │
          ▼
   ┌─────────────┐
   │  4. FIX     │  Apply minimal, surgical changes
   └──────┬──────┘
          │
          ├─→ Add missing dependencies (package.json)
          ├─→ Update configurations (tsconfig.json, .eslintrc)
          ├─→ Fix code issues (type errors, logic bugs)
          ├─→ Update workflows (GitHub Actions YAML)
          │
          ▼
   ┌─────────────┐
   │ 5. VERIFY   │  Validate fix effectiveness
   └──────┬──────┘
          │
          ├─→ Run lint locally (npm run lint)
          ├─→ Run build locally (npm run build)
          ├─→ Run tests locally (npm test)
          ├─→ Push and verify CI/CD passes
          │
          ▼
   ┌─────────────┐
   │ 6. DOCUMENT │  Prevent recurrence
   └──────┬──────┘
          │
          ├─→ Update error handling guides
          ├─→ Add to troubleshooting docs
          ├─→ Create test cases for regression
          └─→ Share knowledge with team
```

---

## ⚠️ Common Error Patterns & Solutions

### Pattern 1: Missing Dependencies

**❌ INCORRECT: Assuming dependencies exist**
```yaml
# .github/workflows/ci.yml
- name: Security Audit
  run: npx audit-ci --moderate  # ❌ audit-ci not in devDependencies
```

**✅ CORRECT: Declare all dependencies**
```yaml
# package.json
{
  "devDependencies": {
    "audit-ci": "^7.1.0"  # ✅ Explicitly declared
  }
}

# .github/workflows/ci.yml
- name: Install dependencies
  run: npm ci  # ✅ Installs from package-lock.json

- name: Security Audit
  run: npm run audit-ci  # ✅ Uses npm script
```

**Why this matters:**
- `npx` downloads packages on-demand, causing delays and failures
- Explicit dependencies ensure reproducible builds
- npm scripts provide consistent interface

---

### Pattern 2: Database Resource Management

**❌ INCORRECT: Database left open during tests**
```typescript
// tests/workflow.test.ts
describe('Workflow Tests', () => {
  it('should create workflow', async () => {
    const db = await database.getConnection();
    // Test logic...
    // ❌ Connection never closed
  });
});
```

**Error Result:**
```
SQLITE_MISUSE: Database is closed
Cannot perform operation on closed database
```

**✅ CORRECT: Proper resource cleanup**
```typescript
// tests/workflow.test.ts
describe('Workflow Tests', () => {
  let db: Database;

  beforeEach(async () => {
    db = await database.getConnection();
  });

  afterEach(async () => {
    await db.close();  // ✅ Always cleanup
  });

  it('should create workflow', async () => {
    // Test logic with db
  });
});
```

**Why this matters:**
- Resources must be explicitly released
- Prevents "connection pool exhausted" errors
- Ensures test isolation and repeatability

---

### Pattern 3: Workflow Artifact Path Mismatches

**❌ INCORRECT: Mismatched upload/download paths**
```yaml
# audit-scan.yml (Upload)
- name: Upload scan results
  uses: actions/upload-artifact@v4
  with:
    name: scan-results
    path: audit-output/  # ❌ Uploads directory structure

# audit-classify.yml (Download)
- name: Download scan results
  uses: actions/download-artifact@v4
  with:
    name: scan-results
    path: ./audit-results/  # ❌ Expects flat structure
```

**Error Result:**
```
Error: Unable to find file: audit-results/security-issues.json
Path does not exist
```

**✅ CORRECT: Consistent path structure**
```yaml
# audit-scan.yml (Upload)
- name: Upload scan results
  uses: actions/upload-artifact@v4
  with:
    name: scan-results
    path: |
      audit-output/security-issues.json
      audit-output/dependency-issues.json
      audit-output/code-quality.json
    # ✅ Explicit file list, flat structure

# audit-classify.yml (Download)
- name: Download scan results
  uses: actions/download-artifact@v4
  with:
    name: scan-results
    path: ./  # ✅ Download to current directory

- name: Process results
  run: |
    if [ -f "security-issues.json" ]; then
      # Process file
    else
      echo "Warning: No security issues found"
    fi
    # ✅ Defensive programming with fallbacks
```

**Why this matters:**
- Artifact structure must match expectations
- Explicit paths prevent silent failures
- Fallback handling improves resilience

---

### Pattern 4: Phantom Required Status Checks

**❌ INCORRECT: Required checks don't exist**
```
GitHub Branch Protection Settings:
├─ Required status checks:
│  ├─ Backend CI / test (3.9)     ❌ No such workflow
│  ├─ Backend CI / test (3.10)    ❌ No such workflow
│  ├─ Backend CI / test (3.11)    ❌ No such workflow
│  └─ Extension CI / build        ❌ No such workflow
```

**Error Result:**
```
Some required checks have not succeeded:
- Backend CI / test (3.9)
- Backend CI / test (3.10)
- Backend CI / test (3.11)
PR cannot be merged
```

**✅ CORRECT: Align checks with actual workflows**
```yaml
# .github/workflows/ci.yml
name: CI/CD

jobs:
  test-18:
    name: Test (18.x)  # ✅ Explicit job name
    runs-on: ubuntu-latest
    # Test logic...

  test-20:
    name: Test (20.x)  # ✅ Explicit job name
    runs-on: ubuntu-latest
    # Test logic...

# GitHub Branch Protection Settings:
├─ Required status checks:
│  ├─ Test (18.x)        ✅ Matches workflow job
│  └─ Test (20.x)        ✅ Matches workflow job
```

**Why this matters:**
- Required checks must match actual workflow job names
- Prevents PRs from being blocked by phantom checks
- Keeps CI/CD system maintainable

---

### Pattern 5: Security Scan Blocking CI

**❌ INCORRECT: Failing on non-critical issues**
```yaml
# .github/workflows/ci.yml
- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v4
  with:
    token: ${{ secrets.CODECOV_TOKEN }}
    fail_ci_if_error: true  # ❌ Blocks entire CI
```

**Error Result:**
```
Error uploading to Codecov: 401 Unauthorized
Security Audit job failed (6s)
Test (18.x) job cancelled (8s)
Test (20.x) job failed (6s)
```

**✅ CORRECT: Non-blocking optional checks**
```yaml
# .github/workflows/ci.yml
- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v4
  with:
    token: ${{ secrets.CODECOV_TOKEN }}
    fail_ci_if_error: false  # ✅ Non-blocking
  continue-on-error: true    # ✅ Don't fail CI
```

**Why this matters:**
- Optional tools shouldn't block critical CI
- Separates required vs nice-to-have checks
- Improves CI reliability and developer experience

---

## 🎯 Error Handling Best Practices

### 1. **Fail Fast, Recover Gracefully**
```typescript
// ❌ INCORRECT: Silent failure
async function fetchData(url: string) {
  try {
    const response = await fetch(url);
    return response.json();
  } catch (error) {
    return null;  // ❌ Hides error
  }
}

// ✅ CORRECT: Explicit error handling
async function fetchData(url: string): Promise<Data> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    logger.error('Failed to fetch data', { url, error });
    throw new FetchError(`Failed to fetch from ${url}`, { cause: error });
  }
}
```

### 2. **Use Type-Safe Error Handling**
```typescript
// ✅ CORRECT: Custom error types
class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field: string,
    public readonly value: unknown
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

class DatabaseError extends Error {
  constructor(
    message: string,
    public readonly query: string,
    public readonly code: string
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

// Use discriminated unions for error results
type Result<T, E extends Error> =
  | { success: true; data: T }
  | { success: false; error: E };
```

### 3. **Implement Retry Logic with Backoff**
```typescript
// ✅ CORRECT: Exponential backoff retry
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      
      const delay = baseDelay * Math.pow(2, attempt);
      logger.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms`, { error });
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Unreachable');
}
```

### 4. **Log Errors with Context**
```typescript
// ❌ INCORRECT: Minimal context
catch (error) {
  console.error('Error:', error);
}

// ✅ CORRECT: Rich contextual logging
catch (error) {
  logger.error('Workflow execution failed', {
    workflowId,
    executionId,
    userId,
    timestamp: new Date().toISOString(),
    error: {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    },
    metadata: {
      nodeVersion: process.version,
      platform: process.platform,
      memory: process.memoryUsage(),
    }
  });
}
```

### 5. **Validate Early, Fail Fast**
```typescript
// ✅ CORRECT: Input validation at boundaries
import Joi from 'joi';

const workflowSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  tasks: Joi.array().min(1).items(
    Joi.object({
      action: Joi.string().valid('navigate', 'click', 'type').required(),
      params: Joi.object().required()
    })
  ).required()
});

app.post('/workflows', (req, res) => {
  const { error, value } = workflowSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.details.map(d => ({
        field: d.path.join('.'),
        message: d.message
      }))
    });
  }
  
  // Proceed with validated data
});
```

---

## 🛡️ Security Error Handling

### Principle: Never Leak Sensitive Information

**❌ INCORRECT: Exposing internal details**
```typescript
catch (error) {
  res.status(500).json({
    error: error.message,           // ❌ Internal error messages
    stack: error.stack,              // ❌ Full stack trace
    config: dbConfig,                // ❌ Database credentials
    query: sqlQuery,                 // ❌ SQL injection vectors
  });
}
```

**✅ CORRECT: Safe error responses**
```typescript
catch (error) {
  // Log full details internally
  logger.error('Database operation failed', {
    error,
    query: sqlQuery,
    userId: req.user?.id,
  });
  
  // Return sanitized response
  res.status(500).json({
    error: 'An internal error occurred',
    requestId: generateRequestId(),  // ✅ For support tracking
    timestamp: new Date().toISOString(),
  });
}
```

---

## 📈 Monitoring & Observability

### Error Tracking Metrics

```typescript
// ✅ CORRECT: Structured error tracking
interface ErrorMetrics {
  timestamp: string;
  errorType: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  service: string;
  endpoint?: string;
  userId?: string;
  duration?: number;
  resolved: boolean;
}

class ErrorTracker {
  private metrics: ErrorMetrics[] = [];
  
  track(error: Error, context: Partial<ErrorMetrics>) {
    this.metrics.push({
      timestamp: new Date().toISOString(),
      errorType: error.constructor.name,
      severity: this.classifySeverity(error),
      service: 'workstation',
      resolved: false,
      ...context
    });
    
    // Export to monitoring system (Prometheus, DataDog, etc.)
    this.export();
  }
  
  private classifySeverity(error: Error): ErrorMetrics['severity'] {
    if (error instanceof SecurityError) return 'critical';
    if (error instanceof DatabaseError) return 'high';
    if (error instanceof ValidationError) return 'medium';
    return 'low';
  }
}
```

---

## 🔄 Error Recovery Patterns

### Circuit Breaker Pattern

```typescript
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime?: number;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  constructor(
    private maxFailures: number = 5,
    private resetTimeout: number = 60000
  ) {}
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime! > this.resetTimeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess() {
    this.failures = 0;
    this.state = 'closed';
  }
  
  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.maxFailures) {
      this.state = 'open';
    }
  }
}
```

---

## 📚 Summary: Error Handling Checklist

- [ ] **Detect**: Automated scanning at all levels (lint, build, test, security)
- [ ] **Classify**: Categorize by severity (critical, high, medium, low)
- [ ] **Source**: Find root cause using logs, docs, community resources
- [ ] **Fix**: Apply minimal, surgical changes
- [ ] **Verify**: Test locally before pushing
- [ ] **Document**: Update guides and add regression tests
- [ ] **Monitor**: Track error rates and patterns
- [ ] **Secure**: Never leak sensitive information in errors
- [ ] **Type-Safe**: Use TypeScript for compile-time error prevention
- [ ] **Resilient**: Implement retry logic and circuit breakers
- [ ] **Observable**: Log with rich context for debugging
- [ ] **Validated**: Check inputs at system boundaries

---

## 🎓 Learning Resources

### For Humans
1. [Error Handling in Node.js Best Practices](https://nodejs.org/en/docs/guides/error-handling)
2. [TypeScript Error Handling Patterns](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
3. [GitHub Actions Debugging](https://docs.github.com/en/actions/monitoring-and-troubleshooting-workflows)

### For Agents
1. Review this document for error patterns
2. Apply the Detect → Classify → Source → Fix → Verify flow
3. Prioritize fixes by severity (critical first)
4. Always validate changes before committing
5. Document reasoning for future reference

---

*This schema is a living document. Update it as new error patterns emerge.*
