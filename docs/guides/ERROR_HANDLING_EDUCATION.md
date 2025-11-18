# 🎓 Error Handling Education Guide

## Purpose

This guide teaches developers and AI agents how to implement enterprise-grade error handling in modern CI/CD systems. Through real examples from the Workstation repository, you'll learn to identify, fix, and prevent common error patterns.

---

## 🧠 Core Principles

### 1. **Errors Are Information, Not Failures**

Errors tell us:
- **What** went wrong (error type)
- **Where** it happened (stack trace, line numbers)
- **When** it occurred (timestamp)
- **Why** it failed (context, inputs)
- **How** to fix it (error message, suggestions)

**Mindset Shift:**
```
❌ "The build failed. I don't know why."
✅ "The build failed with TS2307 at line 6. Module 'express' not found. I need to run npm install."
```

### 2. **Prevention > Detection > Recovery**

**Best to Worst:**
1. **Prevent**: Type systems, linters, validation catch errors before runtime
2. **Detect**: Tests, monitoring, logging catch errors during execution
3. **Recovery**: Try-catch, fallbacks handle errors when they occur

**Example:**
```typescript
// PREVENTION: TypeScript catches this at compile time
function divide(a: number, b: number): number {
  return a / b;
}
divide("10", 5);  // ❌ Compile error: Argument of type 'string' is not assignable to parameter of type 'number'

// DETECTION: Runtime assertion
function divide(a: number, b: number): number {
  if (b === 0) {
    throw new Error('Division by zero');  // Detect before operation
  }
  return a / b;
}

// RECOVERY: Handle when error occurs
try {
  const result = divide(10, 0);
} catch (error) {
  console.error('Failed to divide:', error);
  return fallbackValue;
}
```

### 3. **Fail Fast, Recover Gracefully**

**Fail Fast:** Detect problems immediately, don't let bad data propagate
**Recover Gracefully:** Provide fallbacks, don't crash entire system

```typescript
// ❌ INCORRECT: Silent failure propagates
async function getUserData(userId: string) {
  try {
    const user = await db.getUser(userId);
    return user;
  } catch (error) {
    return null;  // ❌ Hides error, caller doesn't know what went wrong
  }
}

// ✅ CORRECT: Fail fast at boundary
async function getUserData(userId: string): Promise<User> {
  if (!userId || typeof userId !== 'string') {
    throw new ValidationError('Invalid userId', { userId });  // ✅ Fail immediately
  }
  
  try {
    const user = await db.getUser(userId);
    if (!user) {
      throw new NotFoundError(`User ${userId} not found`);
    }
    return user;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;  // ✅ Let known errors bubble
    throw new DatabaseError('Failed to fetch user', { userId, cause: error });  // ✅ Wrap unknown errors
  }
}

// Application layer handles recovery
app.get('/users/:id', async (req, res) => {
  try {
    const user = await getUserData(req.params.id);
    res.json(user);
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(400).json({ error: error.message });  // ✅ Graceful degradation
    }
    if (error instanceof NotFoundError) {
      return res.status(404).json({ error: error.message });
    }
    // Log unexpected errors
    logger.error('Unexpected error in /users/:id', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

---

## 🔍 Understanding Error Types

### Compile-Time Errors (Prevention)

**Caught by:** TypeScript compiler, ESLint
**When:** Before code runs
**Examples:**
```typescript
// Type Error
const name: string = 42;  // ❌ Type 'number' is not assignable to type 'string'

// Module Not Found
import { Router } from 'express';  // ❌ Cannot find module 'express'
// Fix: npm install express

// Undefined Variable
console.log(process.env.API_KEY);  // ❌ Cannot find name 'process'
// Fix: Add @types/node to devDependencies
```

### Runtime Errors (Detection)

**Caught by:** Tests, monitoring, logs
**When:** During code execution
**Examples:**
```typescript
// Null Reference
const user = null;
console.log(user.name);  // ❌ Cannot read property 'name' of null

// Database Connection
await db.query('SELECT * FROM users');  // ❌ SQLITE_MISUSE: Database is closed

// Network Timeout
await fetch('https://api.example.com', { timeout: 5000 });  // ❌ Request timeout after 5000ms
```

### Logical Errors (Hardest to Detect)

**Caught by:** Code review, integration tests, production monitoring
**When:** Code runs but produces wrong results
**Examples:**
```typescript
// ❌ Off-by-one error
for (let i = 1; i <= arr.length; i++) {  // Should start at 0
  console.log(arr[i]);  // Skips first element, undefined on last iteration
}

// ❌ Incorrect comparison
if (user.age = 18) {  // Should be ===, not =
  console.log('Adult');  // Always true, assigns 18 to user.age
}

// ❌ Race condition
async function processItems(items: Item[]) {
  items.forEach(async (item) => {  // ❌ forEach doesn't await
    await processItem(item);
  });
  console.log('All done!');  // ❌ Prints before processing completes
}
```

---

## 🛠️ Real-World Case Studies

### Case Study 1: The Missing Dependency Crisis

**Problem:** CI/CD fails intermittently with "Command not found: audit-ci"

**Investigation:**
```bash
$ npm run audit-ci
> npx audit-ci --moderate

npx: installed 85 in 12.034s  # ❌ Downloads every time
# Sometimes fails with network timeout
```

**Root Cause:**
- `audit-ci` not in `package.json` devDependencies
- `npx` downloads package on each run
- Network issues cause random failures

**Fix:**
```json
// package.json
{
  "devDependencies": {
    "audit-ci": "^7.1.0"  // ✅ Explicit dependency
  },
  "scripts": {
    "audit-ci": "audit-ci --moderate"  // ✅ Local binary
  }
}
```

```yaml
# .github/workflows/ci.yml
- name: Install dependencies
  run: npm ci  # ✅ Installs audit-ci from package-lock.json

- name: Security Audit
  run: npm run audit-ci  # ✅ Uses local binary, fast and reliable
```

**Lesson:** Declare all dependencies explicitly. Never rely on `npx` for critical CI/CD tools.

---

### Case Study 2: The Phantom Check Mystery

**Problem:** PRs blocked by "Backend CI / test (3.9)" check that doesn't exist

**Investigation:**
```bash
$ grep -r "Backend CI" .github/workflows/
# No results

$ grep -r "python" .github/workflows/
.github/workflows/agent-orchestrator.yml:  - name: Setup Python
.github/workflows/agent-orchestrator.yml:    uses: actions/setup-python@v5
```

**Root Cause:**
- GitHub branch protection requires "Backend CI / test (3.9, 3.10, 3.11)"
- These workflows were deleted but still required
- One workflow had Python setup for a Node.js project

**Fix:**
```yaml
# REMOVED from agent-orchestrator.yml
- name: Setup Python
  uses: actions/setup-python@v5
  with:
    python-version: '3.11'
```

**GitHub Settings Update:**
```
Branch Protection → main branch
Required status checks:
  ❌ REMOVE: Backend CI / test (3.9)
  ❌ REMOVE: Backend CI / test (3.10)
  ❌ REMOVE: Backend CI / test (3.11)
  ❌ REMOVE: Extension CI / build
  ✅ KEEP: Test (18.x)
  ✅ KEEP: Test (20.x)
  ✅ KEEP: Security Audit
```

**Lesson:** Keep GitHub branch protection rules in sync with actual workflows. Audit required checks quarterly.

---

### Case Study 3: The Artifact Path Mismatch

**Problem:** `audit-classify.yml` workflow can't find downloaded artifacts

**Investigation:**
```yaml
# audit-scan.yml (uploads)
- uses: actions/upload-artifact@v4
  with:
    name: scan-results
    path: audit-output/  # Uploads directory with nested structure

# audit-classify.yml (downloads)
- uses: actions/download-artifact@v4
  with:
    name: scan-results
    path: ./audit-results/  # Expects flat structure

- run: cat audit-results/security-issues.json
# ❌ Error: No such file (actually at audit-results/audit-output/security-issues.json)
```

**Root Cause:**
- Upload preserves directory structure
- Download doesn't flatten automatically
- Paths don't match expectations

**Fix:**
```yaml
# audit-scan.yml (upload specific files, not directory)
- uses: actions/upload-artifact@v4
  with:
    name: scan-results
    path: |
      audit-output/security-issues.json
      audit-output/dependency-issues.json
      audit-output/code-quality.json
    # ✅ Uploads files directly, flat structure

# audit-classify.yml (download to root)
- uses: actions/download-artifact@v4
  with:
    name: scan-results
    path: ./  # ✅ Downloads to current directory

- run: |
    if [ -f "security-issues.json" ]; then
      cat security-issues.json
    else
      echo "Warning: No security issues found"
    fi
    # ✅ Defensive: handles missing files gracefully
```

**Lesson:** Be explicit about artifact paths. Always add fallback handling for missing files.

---

### Case Study 4: The Database Connection Leak

**Problem:** Tests fail with "SQLITE_MISUSE: Database is closed"

**Investigation:**
```typescript
// tests/workflow.test.ts
describe('Workflow Tests', () => {
  it('should create workflow', async () => {
    const db = await database.getConnection();
    const workflow = await workflowService.create(db, workflowData);
    expect(workflow.id).toBeDefined();
    // ❌ Connection never closed
  });
  
  it('should list workflows', async () => {
    const db = await database.getConnection();
    // ❌ Previous connection still open, resource exhaustion
    const workflows = await workflowService.list(db);
  });
});
```

**Root Cause:**
- Database connections opened but never closed
- Connection pool exhausted
- Subsequent operations fail with SQLITE_MISUSE

**Fix:**
```typescript
// tests/workflow.test.ts
describe('Workflow Tests', () => {
  let db: Database;

  beforeEach(async () => {
    db = await database.getConnection();  // ✅ Fresh connection each test
  });

  afterEach(async () => {
    await db.close();  // ✅ Always cleanup
  });

  it('should create workflow', async () => {
    const workflow = await workflowService.create(db, workflowData);
    expect(workflow.id).toBeDefined();
    // ✅ Connection closed by afterEach
  });
  
  it('should list workflows', async () => {
    const workflows = await workflowService.list(db);
    // ✅ Uses fresh connection
  });
});
```

**Lesson:** Always cleanup resources in tests. Use `beforeEach`/`afterEach` hooks for setup/teardown.

---

## 🎯 Best Practices Deep Dive

### Practice 1: Structured Logging

**Why it matters:**
- Searchable, filterable logs
- Machine-readable for alerts
- Context for debugging

**Implementation:**
```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()  // ✅ Structured format
  ),
  defaultMeta: { service: 'workstation' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// ✅ CORRECT: Rich context
logger.error('Workflow execution failed', {
  workflowId: '123',
  userId: 'user-456',
  action: 'navigate',
  url: 'https://example.com',
  error: {
    message: error.message,
    stack: error.stack,
    name: error.name
  },
  duration: 1234,
  timestamp: new Date().toISOString()
});

// Later: Search logs
// $ cat error.log | jq 'select(.workflowId == "123")'
```

### Practice 2: Input Validation at Boundaries

**Why it matters:**
- Prevents invalid data from entering system
- Clear error messages for users
- Type safety at runtime

**Implementation:**
```typescript
import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

// Define validation schema
const workflowSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  description: Joi.string().max(500).optional(),
  tasks: Joi.array().min(1).items(
    Joi.object({
      action: Joi.string().valid('navigate', 'click', 'type', 'screenshot').required(),
      params: Joi.object().required()
    })
  ).required()
});

// Validation middleware
export const validateWorkflow = (req: Request, res: Response, next: NextFunction) => {
  const { error, value } = workflowSchema.validate(req.body, {
    abortEarly: false,  // ✅ Collect all errors
    stripUnknown: true  // ✅ Remove unknown fields
  });
  
  if (error) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        type: detail.type
      }))
    });
  }
  
  req.body = value;  // ✅ Use validated value
  next();
};

// Use in routes
app.post('/workflows', validateWorkflow, async (req, res) => {
  // req.body is validated and typed
  const workflow = await workflowService.create(req.body);
  res.json(workflow);
});
```

### Practice 3: Retry Logic with Exponential Backoff

**Why it matters:**
- Handles transient failures (network glitches)
- Prevents overwhelming failing services
- Improves reliability

**Implementation:**
```typescript
interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2
  }
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt < options.maxRetries; attempt++) {
    try {
      return await fn();  // ✅ Success, return immediately
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === options.maxRetries - 1) {
        // Last attempt failed, give up
        throw new Error(
          `Failed after ${options.maxRetries} attempts: ${lastError.message}`,
          { cause: lastError }
        );
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        options.baseDelay * Math.pow(options.backoffMultiplier, attempt),
        options.maxDelay
      );
      
      logger.warn(`Attempt ${attempt + 1}/${options.maxRetries} failed, retrying in ${delay}ms`, {
        error: lastError.message,
        attempt: attempt + 1,
        delay
      });
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

// Usage
const data = await retryWithBackoff(
  () => fetch('https://api.example.com/data').then(r => r.json()),
  { maxRetries: 3, baseDelay: 1000, maxDelay: 10000, backoffMultiplier: 2 }
);
// Attempts:
// 1st: immediate
// 2nd: after 1000ms (1s)
// 3rd: after 2000ms (2s)
// Throws if all fail
```

### Practice 4: Circuit Breaker Pattern

**Why it matters:**
- Prevents cascading failures
- Allows failing services to recover
- Fast failure when service is down

**Implementation:**
```typescript
type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failures = 0;
  private lastFailureTime?: number;
  private successCount = 0;
  
  constructor(
    private threshold: number = 5,        // Open after 5 failures
    private timeout: number = 60000,      // Stay open for 60s
    private successThreshold: number = 2  // Need 2 successes to close
  ) {}
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit should transition from OPEN to HALF_OPEN
    if (this.state === 'OPEN') {
      const timeSinceFailure = Date.now() - (this.lastFailureTime || 0);
      if (timeSinceFailure > this.timeout) {
        logger.info('Circuit breaker transitioning to HALF_OPEN');
        this.state = 'HALF_OPEN';
        this.successCount = 0;
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
    
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        logger.info('Circuit breaker CLOSED after successful recovery');
        this.state = 'CLOSED';
        this.successCount = 0;
      }
    }
  }
  
  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.state === 'HALF_OPEN') {
      logger.warn('Circuit breaker OPENED during recovery attempt');
      this.state = 'OPEN';
      return;
    }
    
    if (this.failures >= this.threshold) {
      logger.error(`Circuit breaker OPENED after ${this.failures} failures`);
      this.state = 'OPEN';
    }
  }
  
  getState(): CircuitState {
    return this.state;
  }
}

// Usage
const breaker = new CircuitBreaker(5, 60000, 2);

async function fetchData() {
  return breaker.execute(async () => {
    const response = await fetch('https://api.example.com/data');
    return response.json();
  });
}

// Behavior:
// - First 4 failures: Circuit CLOSED, continues trying
// - 5th failure: Circuit OPEN, fast-fails for 60s
// - After 60s: Circuit HALF_OPEN, allows one request
// - If success: Circuit CLOSED
// - If failure: Circuit OPEN again for 60s
```

---

## 🔐 Security Error Handling

### Never Leak Sensitive Information

**❌ INCORRECT: Exposing internals**
```typescript
app.post('/auth/login', async (req, res) => {
  try {
    const user = await db.query('SELECT * FROM users WHERE email = ?', [req.body.email]);
    // ...
  } catch (error) {
    res.status(500).json({
      error: error.message,  // ❌ "ECONNREFUSED: Connection to database failed at 10.0.1.5:5432"
      stack: error.stack,    // ❌ Full stack trace with file paths
      sql: sqlQuery,         // ❌ SQL query with table structure
      config: dbConfig       // ❌ Database credentials
    });
  }
});
```

**✅ CORRECT: Safe error handling**
```typescript
app.post('/auth/login', async (req, res) => {
  const requestId = generateRequestId();  // For support tracking
  
  try {
    const user = await db.query('SELECT * FROM users WHERE email = ?', [req.body.email]);
    // ...
  } catch (error) {
    // ✅ Log full details internally
    logger.error('Login failed', {
      requestId,
      userId: req.body.email,  // Safe to log email
      error: {
        message: error.message,
        stack: error.stack,
        code: error.code
      },
      ip: hashIP(req.ip),  // Hash IP for privacy
      timestamp: new Date().toISOString()
    });
    
    // ✅ Return generic message to client
    res.status(500).json({
      error: 'An internal error occurred. Please contact support.',
      requestId,  // Support can look up logs
      timestamp: new Date().toISOString()
    });
  }
});
```

### Rate Limiting for Error-Heavy Endpoints

**Implementation:**
```typescript
import rateLimit from 'express-rate-limit';

// ✅ Strict limits for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,  // 5 attempts
  message: 'Too many login attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: hashIP(req.ip),
      path: req.path,
      timestamp: new Date().toISOString()
    });
    
    res.status(429).json({
      error: 'Too many requests',
      retryAfter: '15 minutes'
    });
  }
});

app.post('/auth/login', authLimiter, loginHandler);
```

---

## 📊 Monitoring & Alerting

### Error Budget and SLOs

**Concept:** Errors are expected. Set acceptable thresholds.

```typescript
interface ErrorBudget {
  period: 'day' | 'week' | 'month';
  allowedErrors: number;
  currentErrors: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

class ErrorBudgetTracker {
  private budgets: Map<string, ErrorBudget> = new Map();
  
  track(endpoint: string, severity: ErrorBudget['severity']) {
    const key = `${endpoint}-${severity}`;
    const budget = this.budgets.get(key) || {
      period: 'day',
      allowedErrors: this.getAllowedErrors(severity),
      currentErrors: 0,
      severity
    };
    
    budget.currentErrors++;
    this.budgets.set(key, budget);
    
    // Alert if budget exceeded
    if (budget.currentErrors > budget.allowedErrors) {
      this.alert(endpoint, budget);
    }
  }
  
  private getAllowedErrors(severity: ErrorBudget['severity']): number {
    switch (severity) {
      case 'critical': return 0;    // Zero tolerance
      case 'high': return 5;         // 5 per day
      case 'medium': return 50;      // 50 per day
      case 'low': return 500;        // 500 per day
    }
  }
  
  private alert(endpoint: string, budget: ErrorBudget) {
    logger.error('Error budget exceeded', {
      endpoint,
      severity: budget.severity,
      allowed: budget.allowedErrors,
      current: budget.currentErrors,
      exceeded: budget.currentErrors - budget.allowedErrors
    });
    
    // Send to alerting system (PagerDuty, Slack, etc.)
  }
}
```

---

## 🎓 Summary: Key Takeaways

### For Humans

1. **Errors are your friends** - They tell you what's wrong and how to fix it
2. **Fail fast, recover gracefully** - Detect early, handle appropriately
3. **Prevention beats detection** - Use types, linters, validation
4. **Log with context** - Structured logging makes debugging easy
5. **Never leak secrets** - Generic messages to users, full logs internally
6. **Test error paths** - Don't just test happy paths
7. **Monitor and alert** - Track error rates, set budgets
8. **Document patterns** - Share knowledge, prevent recurring issues

### For AI Agents

1. **Read error messages carefully** - They contain the fix
2. **Follow the schema** - Detect → Classify → Source → Fix → Verify
3. **Prioritize by severity** - Critical first, low priority last
4. **Make minimal changes** - Surgical fixes, not rewrites
5. **Validate everything** - Run lint, build, test before committing
6. **Learn from examples** - Study case studies in this guide
7. **Document your changes** - Update guides with new patterns
8. **Ask for help** - If stuck, escalate to humans

---

## 🚀 Next Steps

1. **Read** [ERROR_HANDLING_SCHEMA.md](../ERROR_HANDLING_SCHEMA.md) for visual flow diagrams
2. **Study** case studies in this guide
3. **Practice** implementing error handling in your projects
4. **Share** knowledge with your team
5. **Improve** this guide as you learn new patterns

---

*Remember: Good error handling is invisible when it works, invaluable when it doesn't.*
