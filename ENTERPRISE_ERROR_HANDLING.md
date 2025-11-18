# Enterprise Error Handling Education System

## Overview

This document provides a comprehensive guide to the error handling system implemented in the Workstation platform, designed for enterprise-grade reliability and security.

## Core Principles

### 1. Defense in Depth
- Multiple layers of error handling
- Fail-safe mechanisms at each layer
- Graceful degradation when services fail

### 2. Security First
- Never expose sensitive information in error messages
- Sanitize all error outputs
- Log full details internally, send minimal info to clients

### 3. Observability
- Structured logging with consistent format
- Error tracking with context
- Performance monitoring integration

## Error Handling Architecture

### Layer 1: Application-Level Error Handling

```typescript
// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log full error details internally (never send to client)
  logger.error('Unhandled error:', {
    error: err.message,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // Don't leak internal errors to client
  if (res.headersSent) {
    return next(err);
  }

  // In production, send generic error message
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(500).json({
    error: 'Internal server error',
    message: isDevelopment ? err.message : 'An unexpected error occurred',
  });
}
```

**Key Features:**
- ✅ Logs full error details internally
- ✅ Never exposes stack traces in production
- ✅ Provides helpful messages in development
- ✅ Handles edge cases (headers already sent)

### Layer 2: Authentication & Authorization Errors

```typescript
// src/auth/jwt.ts
export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  const payload = verifyToken(token);
  
  if (!payload) {
    res.status(403).json({ error: 'Invalid or expired token' });
    return;
  }

  (req as AuthenticatedRequest).user = payload;
  next();
}
```

**Key Features:**
- ✅ Clear distinction between 401 (no token) and 403 (invalid token)
- ✅ No information leakage about token structure
- ✅ Consistent error format

### Layer 3: Input Validation Errors

```typescript
// src/middleware/validation.ts
export function validateRequest(schema: Joi.ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));
      
      res.status(400).json({
        error: 'Validation failed',
        details: errors,
      });
      return;
    }

    req.body = value;
    next();
  };
}
```

**Key Features:**
- ✅ Collects all validation errors (not just first)
- ✅ Strips unknown fields (security)
- ✅ Clear field-level error messages
- ✅ Sanitizes input data

### Layer 4: Database Error Handling

```typescript
// Example from workflow execution
try {
  const workflow = await db.get<Workflow>(
    'SELECT * FROM workflows WHERE id = ?',
    input.workflow_id
  );

  if (!workflow) {
    throw new Error(`Workflow not found: ${input.workflow_id}`);
  }
} catch (error) {
  logger.error('Database error', { 
    operation: 'get_workflow',
    error: error instanceof Error ? error.message : 'Unknown error'
  });
  throw new Error('Failed to retrieve workflow');
}
```

**Key Features:**
- ✅ Specific error messages for debugging
- ✅ Generic messages to clients
- ✅ Proper logging context

### Layer 5: Async Operation Error Handling

```typescript
// Async execution with proper error handling
this.runWorkflow(execution, workflow, input.variables).catch(error => {
  logger.error('Workflow execution failed', { executionId, error });
});
```

**Key Features:**
- ✅ Never leaves promises unhandled
- ✅ Logs context for debugging
- ✅ Doesn't crash the application

## Error Categories & Responses

### 1. Client Errors (4xx)

#### 400 Bad Request
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "userId",
      "message": "userId is required"
    }
  ]
}
```

#### 401 Unauthorized
```json
{
  "error": "No token provided"
}
```

#### 403 Forbidden
```json
{
  "error": "Invalid or expired token"
}
```

#### 404 Not Found
```json
{
  "error": "Not found",
  "path": "/api/unknown"
}
```

### 2. Server Errors (5xx)

#### 500 Internal Server Error
```json
// Production
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}

// Development
{
  "error": "Internal server error",
  "message": "Database connection failed: SQLITE_BUSY"
}
```

## Logging Strategy

### Structured Logging Format

```typescript
// All logs follow this structure
{
  "timestamp": "2025-11-17T23:19:09.389Z",
  "level": "error",
  "message": "Workflow execution failed",
  "service": "stackBrowserAgent",
  "executionId": "uuid-here",
  "error": {
    "code": "SQLITE_MISUSE",
    "message": "Database is closed"
  }
}
```

### Log Levels

1. **error**: Application errors, failed operations
2. **warn**: Degraded performance, potential issues
3. **info**: Normal operations, state changes
4. **debug**: Detailed debugging information (dev only)

### Log Sanitization

```typescript
// Never log sensitive data
❌ logger.error('Auth failed', { password: user.password });
✅ logger.error('Auth failed', { userId: user.id });

❌ logger.info('Token', { token: jwtToken });
✅ logger.info('Token generated', { userId: payload.userId });
```

## Best Practices

### DO ✅

1. **Use try-catch blocks for all async operations**
   ```typescript
   try {
     await riskyOperation();
   } catch (error) {
     logger.error('Operation failed', { error });
     throw new Error('User-friendly message');
   }
   ```

2. **Provide context in errors**
   ```typescript
   logger.error('Failed to process workflow', {
     workflowId,
     executionId,
     step: currentStep,
     error: error.message
   });
   ```

3. **Use specific error types**
   ```typescript
   class ValidationError extends Error {
     constructor(message: string, public field: string) {
       super(message);
       this.name = 'ValidationError';
     }
   }
   ```

4. **Handle database cleanup**
   ```typescript
   let db: Database;
   try {
     db = await getDatabase();
     // ... operations
   } finally {
     if (db) await db.close();
   }
   ```

### DON'T ❌

1. **Never expose stack traces to clients**
   ```typescript
   ❌ res.status(500).json({ error: err.stack });
   ✅ res.status(500).json({ error: 'Internal server error' });
   ```

2. **Never log sensitive information**
   ```typescript
   ❌ logger.error('Auth failed', { password, token });
   ✅ logger.error('Auth failed', { userId });
   ```

3. **Never swallow errors silently**
   ```typescript
   ❌ try { riskyOp(); } catch {}
   ✅ try { riskyOp(); } catch (e) { logger.error('Failed', { e }); }
   ```

4. **Never trust user input**
   ```typescript
   ❌ const query = `SELECT * FROM users WHERE id = ${userId}`;
   ✅ const query = await db.get('SELECT * FROM users WHERE id = ?', userId);
   ```

## Testing Error Handling

### Unit Tests

```typescript
describe('Error Handler', () => {
  it('should not expose stack traces in production', () => {
    process.env.NODE_ENV = 'production';
    const error = new Error('Test error');
    // ... test that stack is not in response
  });
  
  it('should log full error details', () => {
    const error = new Error('Test error');
    // ... verify logger was called with full context
  });
});
```

### Integration Tests

```typescript
describe('API Error Handling', () => {
  it('should return 401 for missing token', async () => {
    const res = await request(app).get('/api/protected');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('No token provided');
  });
  
  it('should return 403 for invalid token', async () => {
    const res = await request(app)
      .get('/api/protected')
      .set('Authorization', 'Bearer invalid-token');
    expect(res.status).toBe(403);
  });
});
```

## Monitoring & Observability

### Metrics to Track

1. **Error Rate**: Errors per minute/hour
2. **Error Types**: Distribution of 4xx vs 5xx
3. **Response Times**: Latency when errors occur
4. **Recovery Time**: Time to resolve issues

### Alert Thresholds

- **Critical**: > 10 errors/minute
- **Warning**: > 5 errors/minute
- **Info**: > 1 error/minute

### Log Aggregation

```yaml
# Example log aggregation configuration
logs:
  - source: application
    service: stackBrowserAgent
    filters:
      - level: error
      - level: warn
    destinations:
      - cloudwatch
      - datadog
```

## Recovery Procedures

### 1. Database Connection Issues

```bash
# Check database status
npm run verify

# Restart service
npm restart

# Check logs
tail -f logs/app.log
```

### 2. Authentication Issues

```bash
# Verify JWT_SECRET is set
echo $JWT_SECRET

# Regenerate demo token
curl http://localhost:3000/auth/demo-token

# Test authentication
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/protected
```

### 3. Memory Leaks

```bash
# Monitor memory usage
node --inspect src/index.ts

# Generate heap snapshot
kill -USR2 <pid>

# Analyze with Chrome DevTools
```

## Security Considerations

### 1. Information Disclosure Prevention

- ✅ Generic error messages in production
- ✅ Detailed logs only in secure locations
- ✅ No stack traces in API responses
- ✅ Sanitized error messages

### 2. Rate Limiting

```typescript
// Prevent error-based DDoS
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests'
});
```

### 3. Input Sanitization

```typescript
// Always validate and sanitize
if (payload.userId && typeof payload.userId === 'string') {
  payload.userId = payload.userId.trim().replace(/[<>]/g, '');
}
```

## Continuous Improvement

### Error Analysis Cycle

1. **Collect**: Aggregate all errors
2. **Classify**: Categorize by type and severity
3. **Prioritize**: Focus on high-impact errors
4. **Fix**: Implement solutions
5. **Verify**: Test fixes
6. **Deploy**: Roll out improvements
7. **Monitor**: Track error reduction

### Metrics for Success

- Reduced error rate over time
- Faster mean time to recovery (MTTR)
- Improved user experience
- Better observability

## References

- [Express Error Handling](https://expressjs.com/en/guide/error-handling.html)
- [Node.js Error Handling Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [OWASP Error Handling](https://owasp.org/www-community/Improper_Error_Handling)
- [Winston Logging Library](https://github.com/winstonjs/winston)

## Contributing

To improve error handling:

1. Add tests for new error scenarios
2. Document error codes and messages
3. Update this guide with new patterns
4. Share lessons learned from production incidents

## Support

For questions or issues:
- GitHub Issues: https://github.com/creditXcredit/workstation/issues
- Documentation: See ARCHITECTURE.md and API.md
- CI/CD: See .github/workflows/ci.yml
