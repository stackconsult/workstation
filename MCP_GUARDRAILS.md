# MCP Guardrails & Error Handling Specification

## Overview

This document defines the comprehensive guardrails, error handling strategies, and safety mechanisms for the 20-MCP system.

## System-Wide Guardrails

### 1. Rate Limiting

**Implementation:**
```typescript
// Applied at Nginx proxy level
limit_req_zone $binary_remote_addr zone=mcp_limit:10m rate=100r/m;

// Per-MCP rate limiting
class RateLimiter {
  private requestCounts: Map<string, number> = new Map();
  private readonly limit = 100; // requests per minute
  private readonly window = 60000; // 1 minute in ms
  
  async checkLimit(clientId: string): Promise<boolean> {
    const now = Date.now();
    const count = this.requestCounts.get(clientId) || 0;
    
    if (count >= this.limit) {
      throw new Error('Rate limit exceeded');
    }
    
    this.requestCounts.set(clientId, count + 1);
    return true;
  }
}
```

**Configuration:**
- Global: 100 requests/minute per client
- Per MCP: 100 requests/minute
- Burst allowance: 20 requests
- Violation response: 429 Too Many Requests

### 2. Timeout Management

**Browser Operations:**
```typescript
// Default timeouts
const TIMEOUTS = {
  pageLoad: 60000,        // 60 seconds
  toolExecution: 30000,   // 30 seconds
  networkRequest: 10000,  // 10 seconds
  dbQuery: 5000,          // 5 seconds
};

// Implementation
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operation: string
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Timeout: ${operation} exceeded ${timeoutMs}ms`)),
        timeoutMs
      )
    ),
  ]);
}
```

### 3. Resource Limits

**Memory:**
```yaml
# docker-compose.mcp.yml
services:
  mcp-XX-name:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
          cpus: '0.25'
```

**Browser Instances:**
```typescript
class BrowserPool {
  private maxInstances = 2;
  private activeInstances = 0;
  
  async getBrowser(): Promise<Browser> {
    if (this.activeInstances >= this.maxInstances) {
      throw new Error('Browser instance limit reached');
    }
    
    this.activeInstances++;
    const browser = await chromium.launch();
    
    return browser;
  }
  
  async releaseBrowser(browser: Browser): Promise<void> {
    await browser.close();
    this.activeInstances--;
  }
}
```

### 4. Input Validation

**JSON Schema Validation:**
```typescript
function validateInput(args: any, schema: any): boolean {
  // URL validation
  if (schema.properties.url) {
    const urlPattern = /^https?:\/\/.+/;
    if (!urlPattern.test(args.url)) {
      throw new Error('Invalid URL format');
    }
  }
  
  // Selector validation
  if (schema.properties.selector) {
    try {
      document.querySelector(args.selector); // Test selector syntax
    } catch (e) {
      throw new Error('Invalid CSS selector syntax');
    }
  }
  
  // Required fields
  for (const field of schema.required || []) {
    if (!(field in args)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
  
  return true;
}
```

**Sanitization:**
```typescript
function sanitizeInput(input: string): string {
  // Remove potential XSS
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/javascript:/gi, '');
}
```

### 5. Security Controls

**No Arbitrary Code Execution:**
```typescript
// NEVER allow
eval(userInput);  // ❌ Blocked
Function(userInput)();  // ❌ Blocked
new Function(userInput);  // ❌ Blocked

// Instead use safe alternatives
const allowedOperations = {
  'add': (a, b) => a + b,
  'multiply': (a, b) => a * b,
};

function safeExecute(operation: string, ...args: any[]) {
  if (!(operation in allowedOperations)) {
    throw new Error('Operation not allowed');
  }
  return allowedOperations[operation](...args);
}
```

**Sandboxed Browser Contexts:**
```typescript
const context = await browser.newContext({
  permissions: [],
  bypassCSP: false,
  javaScriptEnabled: true,
  acceptDownloads: false,
  offline: false,
});
```

**CORS Restrictions:**
```typescript
// Health endpoints only accessible from proxy
app.use('/health', (req, res, next) => {
  const allowedOrigins = [
    'http://localhost',
    'http://mcp-proxy',
  ];
  
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  next();
});
```

## Error Handling Strategies

### 1. Retry with Exponential Backoff

```typescript
interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
  }
): Promise<T> {
  let lastError: Error;
  let delay = config.initialDelay;
  
  for (let attempt = 0; attempt < config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < config.maxRetries - 1) {
        console.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
        await sleep(delay);
        delay = Math.min(delay * config.backoffMultiplier, config.maxDelay);
      }
    }
  }
  
  throw new Error(`Failed after ${config.maxRetries} attempts: ${lastError!.message}`);
}
```

### 2. Circuit Breaker

```typescript
enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation
  OPEN = 'OPEN',         // Failing, reject immediately
  HALF_OPEN = 'HALF_OPEN' // Testing if recovered
}

class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime = 0;
  
  private readonly failureThreshold = 5;
  private readonly successThreshold = 3;
  private readonly timeout = 60000; // 60 seconds
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = CircuitState.HALF_OPEN;
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
  
  private onSuccess(): void {
    this.failureCount = 0;
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        this.state = CircuitState.CLOSED;
      }
    }
  }
  
  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.failureThreshold) {
      this.state = CircuitState.OPEN;
    }
  }
}
```

### 3. Graceful Degradation

```typescript
async function scrapeWithFallback(url: string): Promise<any> {
  const strategies = [
    () => primaryScraper(url),
    () => fallbackScraper(url),
    () => cachedResult(url),
    () => defaultResult(),
  ];
  
  for (const strategy of strategies) {
    try {
      return await strategy();
    } catch (error) {
      console.warn(`Strategy failed: ${error.message}`);
      // Continue to next strategy
    }
  }
  
  throw new Error('All strategies exhausted');
}
```

### 4. Structured Error Logging

```typescript
enum ErrorLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

interface ErrorLog {
  timestamp: string;
  level: ErrorLevel;
  mcp: string;
  tool: string;
  message: string;
  stack?: string;
  context?: any;
  userId?: string;
}

function logError(
  level: ErrorLevel,
  message: string,
  context?: any
): void {
  const log: ErrorLog = {
    timestamp: new Date().toISOString(),
    level,
    mcp: process.env.MCP_SERVER_NAME || 'unknown',
    tool: context?.tool || 'unknown',
    message,
    stack: context?.error?.stack,
    context,
  };
  
  // Log to console
  console.error(JSON.stringify(log));
  
  // Send to MCP-09 (Error Tracker)
  if (level === ErrorLevel.ERROR || level === ErrorLevel.FATAL) {
    sendToErrorTracker(log).catch(console.error);
  }
}
```

### 5. Error Recovery

```typescript
class ErrorRecovery {
  async recoverFromError(error: Error, context: any): Promise<void> {
    if (error.message.includes('navigation')) {
      // Navigation error - try refreshing
      await context.page.reload();
    } else if (error.message.includes('timeout')) {
      // Timeout - try with longer timeout
      await context.page.setDefaultTimeout(60000);
    } else if (error.message.includes('memory')) {
      // Memory issue - close unused pages
      await this.cleanupResources(context);
    } else if (error.message.includes('network')) {
      // Network issue - retry with backoff
      await sleep(2000);
    }
  }
  
  private async cleanupResources(context: any): Promise<void> {
    if (context.browser) {
      const pages = await context.browser.pages();
      for (const page of pages.slice(1)) {
        await page.close();
      }
    }
  }
}
```

## MCP-Specific Guardrails

### Browser-Based MCPs (01, 02, 03, 08, 11, 14)

**Additional Guardrails:**
```typescript
// Limit navigation
const allowedDomains = [
  'example.com',
  'test.com',
];

page.on('request', request => {
  const url = new URL(request.url());
  if (!allowedDomains.some(d => url.hostname.includes(d))) {
    request.abort();
  }
});

// Block resource types
await page.route('**/*', route => {
  const type = route.request().resourceType();
  if (['image', 'stylesheet', 'font', 'media'].includes(type)) {
    route.abort();
  } else {
    route.continue();
  }
});

// Limit page size
page.on('response', async response => {
  const contentLength = response.headers()['content-length'];
  if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) {
    throw new Error('Page size exceeds 10MB limit');
  }
});
```

### Data Processing MCPs (09, 16, 17)

**Additional Guardrails:**
```typescript
// Limit array sizes
function validateDataSize(data: any[]): void {
  const maxItems = 10000;
  if (data.length > maxItems) {
    throw new Error(`Data size exceeds limit: ${maxItems} items`);
  }
}

// Prevent infinite loops
function processWithTimeout(data: any[], processor: Function): any[] {
  const startTime = Date.now();
  const timeout = 30000;
  const results = [];
  
  for (const item of data) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Processing timeout exceeded');
    }
    results.push(processor(item));
  }
  
  return results;
}
```

### Integration MCPs (12, 15)

**Additional Guardrails:**
```typescript
// Whitelist external APIs
const allowedAPIs = [
  'https://api.github.com',
  'https://api.stripe.com',
];

function validateAPIEndpoint(url: string): void {
  if (!allowedAPIs.some(api => url.startsWith(api))) {
    throw new Error('API endpoint not whitelisted');
  }
}

// Limit response size
async function fetchWithSizeLimit(url: string): Promise<any> {
  const response = await fetch(url);
  const reader = response.body?.getReader();
  const maxSize = 5 * 1024 * 1024; // 5MB
  let receivedLength = 0;
  const chunks = [];
  
  while (true) {
    const { done, value } = await reader!.read();
    if (done) break;
    
    receivedLength += value.length;
    if (receivedLength > maxSize) {
      throw new Error('Response size exceeds 5MB limit');
    }
    
    chunks.push(value);
  }
  
  return Buffer.concat(chunks).toString();
}
```

## Health Check Enhancements

```typescript
interface HealthMetrics {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  requestCount: number;
  errorCount: number;
  errorRate: number;
  avgResponseTime: number;
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
  browserInstances?: number;
  lastError?: {
    timestamp: string;
    message: string;
  };
}

class HealthMonitor {
  private metrics: HealthMetrics;
  
  getHealth(): HealthMetrics {
    const memUsage = process.memoryUsage();
    
    this.metrics = {
      status: this.determineStatus(),
      uptime: process.uptime(),
      requestCount: this.requestCount,
      errorCount: this.errorCount,
      errorRate: this.calculateErrorRate(),
      avgResponseTime: this.calculateAvgResponseTime(),
      memoryUsage: {
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
      },
      browserInstances: this.browserInstances,
      lastError: this.lastError,
    };
    
    return this.metrics;
  }
  
  private determineStatus(): 'healthy' | 'degraded' | 'unhealthy' {
    if (this.errorRate > 0.5) return 'unhealthy';
    if (this.errorRate > 0.1) return 'degraded';
    if (this.avgResponseTime > 5000) return 'degraded';
    return 'healthy';
  }
}
```

## Monitoring & Alerting

### Alert Conditions

**Critical (Immediate Response):**
- Health check failing for > 2 minutes
- Error rate > 50%
- Memory usage > 90%
- All browser instances exhausted

**Warning (Monitor Closely):**
- Error rate > 10%
- Response time > 5 seconds
- Memory usage > 70%
- Circuit breaker opened

**Info (Track Trends):**
- Request rate changes
- Average response time trends
- Resource usage patterns

### Alert Actions

```typescript
enum AlertLevel {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
}

interface Alert {
  level: AlertLevel;
  mcp: string;
  condition: string;
  timestamp: string;
  metrics: any;
}

async function sendAlert(alert: Alert): Promise<void> {
  // Log to MCP-09
  await logToErrorTracker(alert);
  
  // Send to monitoring service
  if (alert.level === AlertLevel.CRITICAL) {
    await sendSlackAlert(alert);
    await sendEmailAlert(alert);
  }
  
  // Auto-remediation
  if (alert.condition === 'memory_high') {
    await restartMCP(alert.mcp);
  }
}
```

## Testing Guardrails

```typescript
// Test rate limiting
describe('Rate Limiting', () => {
  it('should block after 100 requests', async () => {
    for (let i = 0; i < 100; i++) {
      await callTool('test_tool', {});
    }
    
    await expect(callTool('test_tool', {}))
      .rejects.toThrow('Rate limit exceeded');
  });
});

// Test timeout
describe('Timeout', () => {
  it('should timeout after 30 seconds', async () => {
    const slowTool = () => new Promise(resolve => 
      setTimeout(resolve, 31000)
    );
    
    await expect(withTimeout(slowTool(), 30000, 'slow'))
      .rejects.toThrow('Timeout');
  });
});

// Test circuit breaker
describe('Circuit Breaker', () => {
  it('should open after 5 failures', async () => {
    const breaker = new CircuitBreaker();
    const failingFn = () => Promise.reject(new Error('fail'));
    
    for (let i = 0; i < 5; i++) {
      await expect(breaker.execute(failingFn))
        .rejects.toThrow();
    }
    
    await expect(breaker.execute(failingFn))
      .rejects.toThrow('Circuit breaker is OPEN');
  });
});
```

## Documentation Updates

Each MCP README must include:
- Guardrail configuration
- Error codes and meanings
- Retry behavior
- Timeout values
- Rate limits
- Recovery procedures

## Continuous Improvement

1. Monitor metrics in production
2. Adjust guardrails based on usage patterns
3. Add new error scenarios as discovered
4. Update documentation
5. Test changes thoroughly

## Rollback Procedures

If guardrails cause issues:
1. Identify problematic guardrail
2. Adjust configuration (increase limits)
3. Deploy update
4. Monitor impact
5. Document learnings

## Summary

This comprehensive guardrail and error handling system ensures:
- System stability under load
- Graceful degradation on failures
- Quick recovery from errors
- Visibility into system health
- Protection against abuse
- Safe resource management
