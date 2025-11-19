# Monitoring Patterns

## Overview

Implement production-grade monitoring, logging, and observability for your Workstation platform. Learn Winston logging, metrics collection, health checks, error tracking, and dashboards that give you complete visibility into system performance and reliability.

**Business Value**: Reduce MTTR (Mean Time To Recovery) by 80% and prevent 90% of incidents through proactive monitoring.

## Table of Contents

1. [Logging with Winston](#logging-with-winston)
2. [Structured Logging](#structured-logging)
3. [Metrics Collection](#metrics-collection)
4. [Health Checks](#health-checks)
5. [Error Tracking](#error-tracking)
6. [Performance Monitoring](#performance-monitoring)
7. [Log Aggregation](#log-aggregation)
8. [Alerting Strategies](#alerting-strategies)

## Logging with Winston

Winston is already configured in the Workstation repository. Let's enhance it:

### Current Winston Setup

View the existing logger:

```typescript
// src/utils/logger.ts (already exists)
import winston from 'winston';

const logLevel = process.env.LOG_LEVEL || 'info';

export const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: 'logs/combined.log'
    })
  ]
});
```

### Enhanced Production Configuration

```typescript
// src/utils/logger.ts (enhanced version)
import winston from 'winston';
import path from 'path';

const logDir = process.env.LOG_DIR || 'logs';
const logLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

// Custom format for better readability
const customFormat = winston.format.printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  
  return msg;
});

// Create logger instance
export const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp'] })
  ),
  defaultMeta: {
    service: 'workstation',
    environment: process.env.NODE_ENV || 'development',
    version: process.env.APP_VERSION || '1.0.0'
  },
  transports: [
    // Console output
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        customFormat
      )
    }),
    
    // Error logs
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: winston.format.json(),
      maxsize: 10485760, // 10MB
      maxFiles: 10,
      tailable: true
    }),
    
    // Combined logs
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      format: winston.format.json(),
      maxsize: 10485760, // 10MB
      maxFiles: 10,
      tailable: true
    }),
    
    // Warn logs
    new winston.transports.File({
      filename: path.join(logDir, 'warn.log'),
      level: 'warn',
      format: winston.format.json(),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ],
  
  // Handle exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'exceptions.log')
    })
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'rejections.log')
    })
  ],
  
  // Exit on error
  exitOnError: false
});

// Create logs directory if it doesn't exist
import fs from 'fs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}
```

## Structured Logging

### Best Practices

```typescript
// ✅ GOOD: Structured logging with context
logger.info('Workflow executed', {
  workflowName: 'lead-enrichment',
  duration: 5000,
  itemsProcessed: 150,
  success: true,
  userId: 'user123'
});

// ❌ BAD: Unstructured string concatenation
logger.info(`Workflow lead-enrichment took 5000ms and processed 150 items for user123`);
```

### Standard Log Levels

```typescript
// ERROR: Something failed, requires immediate attention
logger.error('Database connection failed', {
  error: err.message,
  stack: err.stack,
  host: 'db.example.com',
  port: 5432
});

// WARN: Something unexpected but handled
logger.warn('API rate limit approaching', {
  current: 950,
  limit: 1000,
  remaining: 50,
  resetAt: new Date(Date.now() + 3600000).toISOString()
});

// INFO: General informational messages
logger.info('Server started', {
  port: 3000,
  environment: process.env.NODE_ENV,
  nodeVersion: process.version
});

// DEBUG: Detailed debugging information
logger.debug('Request received', {
  method: 'POST',
  path: '/api/workflows',
  body: sanitize(req.body),
  headers: sanitize(req.headers)
});
```

### Request Logging Middleware

```typescript
// src/middleware/request-logger.ts
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  
  // Log request
  logger.info('Request received', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    requestId: req.headers['x-request-id'] || generateRequestId()
  });
  
  // Capture response
  const originalSend = res.send;
  res.send = function(data: any) {
    const duration = Date.now() - startTime;
    
    logger.info('Response sent', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      contentLength: res.get('content-length')
    });
    
    // Performance warning
    if (duration > 1000) {
      logger.warn('Slow request detected', {
        method: req.method,
        path: req.path,
        duration
      });
    }
    
    return originalSend.call(this, data);
  };
  
  next();
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}
```

## Metrics Collection

### Basic Metrics Service

```typescript
// src/services/metrics.ts
import { logger } from '../utils/logger';

interface Metric {
  name: string;
  value: number;
  timestamp: Date;
  tags?: Record<string, string>;
}

class MetricsCollector {
  private metrics: Metric[] = [];
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();
  
  /**
   * Increment a counter
   */
  increment(name: string, value: number = 1, tags?: Record<string, string>): void {
    const current = this.counters.get(name) || 0;
    this.counters.set(name, current + value);
    
    this.recordMetric({
      name,
      value: current + value,
      timestamp: new Date(),
      tags
    });
  }
  
  /**
   * Set a gauge value
   */
  gauge(name: string, value: number, tags?: Record<string, string>): void {
    this.gauges.set(name, value);
    
    this.recordMetric({
      name,
      value,
      timestamp: new Date(),
      tags
    });
  }
  
  /**
   * Record histogram value
   */
  histogram(name: string, value: number, tags?: Record<string, string>): void {
    const values = this.histograms.get(name) || [];
    values.push(value);
    this.histograms.set(name, values);
    
    this.recordMetric({
      name,
      value,
      timestamp: new Date(),
      tags
    });
  }
  
  /**
   * Get all metrics
   */
  getMetrics(): Metric[] {
    return this.metrics;
  }
  
  /**
   * Get counter value
   */
  getCounter(name: string): number {
    return this.counters.get(name) || 0;
  }
  
  /**
   * Get gauge value
   */
  getGauge(name: string): number {
    return this.gauges.get(name) || 0;
  }
  
  /**
   * Get histogram statistics
   */
  getHistogramStats(name: string): { min: number; max: number; avg: number; count: number } | null {
    const values = this.histograms.get(name);
    if (!values || values.length === 0) return null;
    
    return {
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      count: values.length
    };
  }
  
  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
  }
  
  /**
   * Export metrics for Prometheus
   */
  exportPrometheus(): string {
    let output = '';
    
    // Counters
    this.counters.forEach((value, name) => {
      output += `# TYPE ${name} counter\n`;
      output += `${name} ${value}\n`;
    });
    
    // Gauges
    this.gauges.forEach((value, name) => {
      output += `# TYPE ${name} gauge\n`;
      output += `${name} ${value}\n`;
    });
    
    return output;
  }
  
  private recordMetric(metric: Metric): void {
    this.metrics.push(metric);
    
    // Keep only last 10000 metrics
    if (this.metrics.length > 10000) {
      this.metrics = this.metrics.slice(-10000);
    }
    
    logger.debug('Metric recorded', {
      name: metric.name,
      value: metric.value,
      tags: metric.tags
    });
  }
}

export const metrics = new MetricsCollector();

// Common metrics
export function recordWorkflowExecution(
  workflowName: string,
  duration: number,
  success: boolean
): void {
  metrics.increment('workflow_executions_total', 1, {
    workflow: workflowName,
    status: success ? 'success' : 'failure'
  });
  
  metrics.histogram('workflow_duration_ms', duration, {
    workflow: workflowName
  });
  
  if (success) {
    metrics.increment('workflow_successes_total', 1, { workflow: workflowName });
  } else {
    metrics.increment('workflow_failures_total', 1, { workflow: workflowName });
  }
}

export function recordAPICall(
  endpoint: string,
  method: string,
  statusCode: number,
  duration: number
): void {
  metrics.increment('api_requests_total', 1, {
    endpoint,
    method,
    status: String(statusCode)
  });
  
  metrics.histogram('api_response_time_ms', duration, {
    endpoint,
    method
  });
}
```

### Metrics API Endpoint

```typescript
// src/routes/metrics.ts
import express from 'express';
import { metrics } from '../services/metrics';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

/**
 * Get all metrics as JSON
 */
router.get('/metrics', authenticateToken, (req, res) => {
  res.json({
    timestamp: new Date().toISOString(),
    metrics: metrics.getMetrics(),
    counters: Array.from(metrics['counters'].entries()).map(([name, value]) => ({
      name,
      value
    })),
    gauges: Array.from(metrics['gauges'].entries()).map(([name, value]) => ({
      name,
      value
    }))
  });
});

/**
 * Get Prometheus-formatted metrics
 */
router.get('/metrics/prometheus', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send(metrics.exportPrometheus());
});

/**
 * Get specific metric
 */
router.get('/metrics/:name', authenticateToken, (req, res) => {
  const { name } = req.params;
  
  const counter = metrics.getCounter(name);
  const gauge = metrics.getGauge(name);
  const histogram = metrics.getHistogramStats(name);
  
  res.json({
    name,
    counter: counter > 0 ? counter : undefined,
    gauge: gauge > 0 ? gauge : undefined,
    histogram
  });
});

export default router;
```

## Health Checks

### Comprehensive Health Check

```typescript
// src/routes/health.ts
import express from 'express';
import { logger } from '../utils/logger';
import { scheduler } from '../automation/scheduler';

const router = express.Router();

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: {
    [key: string]: {
      status: 'pass' | 'fail';
      message?: string;
      duration?: number;
    };
  };
}

/**
 * Basic health check (for load balancers)
 */
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

/**
 * Detailed health check
 */
router.get('/health/detailed', async (req, res) => {
  const startTime = Date.now();
  const result: HealthCheckResult = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {}
  };
  
  // Check scheduler
  try {
    const schedulerStatus = scheduler.getStatus();
    const activeCount = schedulerStatus.filter(t => t.running).length;
    
    result.checks.scheduler = {
      status: activeCount > 0 ? 'pass' : 'fail',
      message: `${activeCount}/${schedulerStatus.length} tasks active`
    };
  } catch (error) {
    result.checks.scheduler = {
      status: 'fail',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
    result.status = 'degraded';
  }
  
  // Check memory
  const memUsage = process.memoryUsage();
  const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
  result.checks.memory = {
    status: heapUsedPercent < 90 ? 'pass' : 'fail',
    message: `Heap: ${Math.round(heapUsedPercent)}%`
  };
  
  if (heapUsedPercent >= 90) {
    result.status = 'degraded';
  }
  
  // Check disk space (if applicable)
  // Add database connection check here
  // Add external API checks here
  
  const duration = Date.now() - startTime;
  result.checks.self = {
    status: 'pass',
    duration
  };
  
  const statusCode = result.status === 'healthy' ? 200 : result.status === 'degraded' ? 200 : 503;
  res.status(statusCode).json(result);
});

/**
 * Readiness check (for Kubernetes)
 */
router.get('/health/ready', (req, res) => {
  // Check if app is ready to serve traffic
  const schedulerReady = scheduler.getStatus().length > 0;
  
  if (schedulerReady) {
    res.status(200).json({ status: 'ready' });
  } else {
    res.status(503).json({ status: 'not ready' });
  }
});

/**
 * Liveness check (for Kubernetes)
 */
router.get('/health/live', (req, res) => {
  // Check if app is alive (not deadlocked)
  res.status(200).json({ status: 'alive' });
});

export default router;
```

## Error Tracking

### Error Tracking Service

```typescript
// src/services/error-tracking.ts
import { logger } from '../utils/logger';
import { sendSlackNotification } from './slack';

interface ErrorReport {
  id: string;
  timestamp: Date;
  error: Error;
  context: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

class ErrorTracker {
  private errors: ErrorReport[] = [];
  private errorCounts: Map<string, number> = new Map();
  
  /**
   * Track an error
   */
  async trackError(
    error: Error,
    context: Record<string, any> = {},
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<void> {
    const errorId = this.generateErrorId(error);
    
    const report: ErrorReport = {
      id: errorId,
      timestamp: new Date(),
      error,
      context,
      severity
    };
    
    this.errors.push(report);
    
    // Track error count
    const count = (this.errorCounts.get(errorId) || 0) + 1;
    this.errorCounts.set(errorId, count);
    
    // Log error
    logger.error('Error tracked', {
      errorId,
      message: error.message,
      stack: error.stack,
      context,
      severity,
      occurrences: count
    });
    
    // Send alerts for critical errors
    if (severity === 'critical' || count >= 5) {
      await this.sendAlert(report, count);
    }
    
    // Keep only last 1000 errors
    if (this.errors.length > 1000) {
      this.errors = this.errors.slice(-1000);
    }
  }
  
  /**
   * Get error statistics
   */
  getStatistics(): {
    total: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    recentErrors: ErrorReport[];
  } {
    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    
    this.errors.forEach(error => {
      byType[error.error.constructor.name] = (byType[error.error.constructor.name] || 0) + 1;
      bySeverity[error.severity] = (bySeverity[error.severity] || 0) + 1;
    });
    
    return {
      total: this.errors.length,
      byType,
      bySeverity,
      recentErrors: this.errors.slice(-10)
    };
  }
  
  private generateErrorId(error: Error): string {
    // Create unique ID based on error type and message
    return `${error.constructor.name}:${error.message}`.substring(0, 100);
  }
  
  private async sendAlert(report: ErrorReport, count: number): Promise<void> {
    await sendSlackNotification(
      `🚨 ${report.severity.toUpperCase()} Error (${count} occurrences)\n` +
      `${report.error.constructor.name}: ${report.error.message}\n` +
      `Context: ${JSON.stringify(report.context, null, 2)}`
    );
  }
}

export const errorTracker = new ErrorTracker();
```

## Performance Monitoring

### Performance Tracking Decorator

```typescript
// src/utils/performance.ts
import { logger } from './logger';
import { metrics } from '../services/metrics';

/**
 * Decorator to track function execution time
 */
export function trackPerformance(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;
  
  descriptor.value = async function(...args: any[]) {
    const startTime = Date.now();
    const functionName = `${target.constructor.name}.${propertyKey}`;
    
    try {
      const result = await originalMethod.apply(this, args);
      const duration = Date.now() - startTime;
      
      logger.debug('Function executed', { functionName, duration });
      metrics.histogram('function_duration_ms', duration, { function: functionName });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Function failed', { functionName, duration, error });
      throw error;
    }
  };
  
  return descriptor;
}

/**
 * Manual performance tracking
 */
export class PerformanceTimer {
  private startTime: number;
  
  constructor(private name: string) {
    this.startTime = Date.now();
  }
  
  end(): number {
    const duration = Date.now() - this.startTime;
    
    logger.debug('Performance measurement', {
      name: this.name,
      duration
    });
    
    metrics.histogram('custom_duration_ms', duration, { operation: this.name });
    
    return duration;
  }
}

// Usage example
export async function exampleFunction() {
  const timer = new PerformanceTimer('data-processing');
  
  // Do work here
  await processData();
  
  const duration = timer.end();
  logger.info('Processing complete', { duration });
}
```

## Log Aggregation

### Centralized Logging Configuration

For production, integrate with log aggregation services:

```typescript
// src/utils/logger.ts (add to existing configuration)
import winston from 'winston';
import 'winston-daily-rotate-file';

// Daily rotating file transport
const dailyRotateTransport = new winston.transports.DailyRotateFile({
  filename: 'logs/application-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  format: winston.format.json()
});

// Add to transports array
logger.add(dailyRotateTransport);

// For production: Add external service transports
if (process.env.NODE_ENV === 'production') {
  // Example: Logtail/Papertrail
  if (process.env.LOGTAIL_TOKEN) {
    const { Logtail } = require('@logtail/node');
    const { LogtailTransport } = require('@logtail/winston');
    
    const logtail = new Logtail(process.env.LOGTAIL_TOKEN);
    logger.add(new LogtailTransport(logtail));
  }
  
  // Example: Sentry for error tracking
  if (process.env.SENTRY_DSN) {
    const Sentry = require('@sentry/node');
    Sentry.init({ dsn: process.env.SENTRY_DSN });
    
    logger.on('error', (error) => {
      Sentry.captureException(error);
    });
  }
}
```

## Alerting Strategies

### Alert Configuration

```typescript
// src/services/alerting.ts
import { logger } from '../utils/logger';
import { sendSlackNotification } from './slack';
import { metrics } from './metrics';

interface AlertRule {
  name: string;
  condition: () => Promise<boolean>;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  cooldown: number; // Minutes between alerts
}

class AlertManager {
  private lastAlertTime: Map<string, number> = new Map();
  
  /**
   * Check alert rule
   */
  async checkAlert(rule: AlertRule): Promise<void> {
    const lastAlert = this.lastAlertTime.get(rule.name) || 0;
    const now = Date.now();
    const cooldownMs = rule.cooldown * 60 * 1000;
    
    // Check cooldown
    if (now - lastAlert < cooldownMs) {
      return;
    }
    
    // Check condition
    try {
      const shouldAlert = await rule.condition();
      
      if (shouldAlert) {
        await this.sendAlert(rule);
        this.lastAlertTime.set(rule.name, now);
      }
    } catch (error) {
      logger.error('Alert check failed', {
        ruleName: rule.name,
        error: error instanceof Error ? error.message : 'Unknown'
      });
    }
  }
  
  private async sendAlert(rule: AlertRule): Promise<void> {
    const emoji = {
      info: 'ℹ️',
      warning: '⚠️',
      critical: '🚨'
    }[rule.severity];
    
    await sendSlackNotification(
      `${emoji} ${rule.severity.toUpperCase()} Alert\n` +
      `Rule: ${rule.name}\n` +
      `${rule.message}`
    );
    
    logger.warn('Alert sent', {
      ruleName: rule.name,
      severity: rule.severity
    });
  }
}

export const alertManager = new AlertManager();

// Define alert rules
export const alertRules: AlertRule[] = [
  {
    name: 'high-error-rate',
    severity: 'critical',
    message: 'Error rate exceeded 5% in the last hour',
    cooldown: 30,
    condition: async () => {
      const errorCount = metrics.getCounter('workflow_failures_total');
      const totalCount = metrics.getCounter('workflow_executions_total');
      return totalCount > 0 && (errorCount / totalCount) > 0.05;
    }
  },
  {
    name: 'high-memory-usage',
    severity: 'warning',
    message: 'Memory usage exceeded 80%',
    cooldown: 15,
    condition: async () => {
      const memUsage = process.memoryUsage();
      const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
      return heapUsedPercent > 80;
    }
  },
  {
    name: 'slow-response-time',
    severity: 'warning',
    message: 'Average response time exceeded 1000ms',
    cooldown: 10,
    condition: async () => {
      const stats = metrics.getHistogramStats('api_response_time_ms');
      return stats ? stats.avg > 1000 : false;
    }
  }
];

// Check all alert rules periodically
export function startAlertMonitoring(): void {
  setInterval(async () => {
    for (const rule of alertRules) {
      await alertManager.checkAlert(rule);
    }
  }, 60000); // Check every minute
}
```

## Testing Monitoring

### Monitor Test Script

```typescript
// tests/monitoring-test.ts
import { logger } from '../src/utils/logger';
import { metrics, recordWorkflowExecution } from '../src/services/metrics';
import { errorTracker } from '../src/services/error-tracking';

async function testMonitoring() {
  console.log('🧪 Testing monitoring systems...\n');
  
  // Test logging
  console.log('1. Testing logging...');
  logger.info('Test info message');
  logger.warn('Test warning message');
  logger.error('Test error message', { error: 'Test error details' });
  
  // Test metrics
  console.log('2. Testing metrics...');
  recordWorkflowExecution('test-workflow', 1500, true);
  recordWorkflowExecution('test-workflow', 2000, false);
  metrics.increment('test_counter', 5);
  metrics.gauge('test_gauge', 42);
  
  console.log('Metrics:', {
    counter: metrics.getCounter('test_counter'),
    gauge: metrics.getGauge('test_gauge'),
    workflow: metrics.getHistogramStats('workflow_duration_ms')
  });
  
  // Test error tracking
  console.log('3. Testing error tracking...');
  await errorTracker.trackError(
    new Error('Test error'),
    { userId: 'test123' },
    'low'
  );
  
  const errorStats = errorTracker.getStatistics();
  console.log('Error statistics:', errorStats);
  
  console.log('\n✅ Monitoring tests complete');
}

testMonitoring();
```

## Production Checklist

- [ ] Winston logger configured with file rotation
- [ ] Structured logging implemented across codebase
- [ ] Metrics collection for key operations
- [ ] Health check endpoints responding
- [ ] Error tracking capturing all errors
- [ ] Performance monitoring in place
- [ ] Alert rules configured
- [ ] Log aggregation service connected (optional)
- [ ] Metrics dashboard created (optional)
- [ ] On-call runbook documented

## Summary

You've learned:
- ✅ Winston logging configuration and best practices
- ✅ Structured logging patterns
- ✅ Metrics collection and monitoring
- ✅ Health check implementations
- ✅ Error tracking and reporting
- ✅ Performance monitoring techniques
- ✅ Log aggregation strategies
- ✅ Alerting and incident response

**Next**: Continue to [production-deployment.md](./production-deployment.md) for Railway and Docker deployment.
