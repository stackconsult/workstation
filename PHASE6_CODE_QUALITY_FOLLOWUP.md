# Phase 6: Code Quality Improvements - Follow-up Tasks

## Overview

This document tracks code quality improvements suggested in the Phase 6 code review. All **critical security issues** have been addressed. The items below are **best practice enhancements** that improve code quality, error handling, and observability.

## Status

### ✅ Completed (Critical Security)
- CSRF protection for session cookies
- Workspace initialization performance fix
- Token encryption (AES-256-GCM) for OAuth, Slack, password reset
- Unique random passwords per workspace
- Unused import cleanup

### 📋 Remaining (Code Quality Enhancements)

## 1. Error Handling with ErrorHandler Utilities

**Priority:** Medium
**Effort:** 2-3 hours
**Files Affected:** All route and service files

### Current State
Database queries and external API calls use raw try-catch blocks without retry logic or timeout protection.

### Desired State
All async operations should use `ErrorHandler.withRetry()` and `ErrorHandler.withTimeout()` utilities from `src/utils/error-handler.ts`.

### Implementation Checklist

#### src/routes/workspaces.ts
- [ ] Wrap all `db.query()` calls with ErrorHandler
- [ ] Add retry logic for database operations
- [ ] Add 5-second timeout for queries
- [ ] Use appropriate error categories

Example:
```typescript
import { ErrorHandler, ErrorCategory } from '../utils/error-handler';

// Before:
const result = await db.query('SELECT ...', [params]);

// After:
const result = await ErrorHandler.withRetry(
  () => ErrorHandler.withTimeout(
    () => db.query('SELECT ...', [params]),
    5000 // 5 second timeout
  ),
  {
    maxRetries: 3,
    retryableErrors: [ErrorCategory.DATABASE, ErrorCategory.NETWORK]
  }
);
```

#### src/services/email.ts
- [ ] Wrap `transporter.sendMail()` with ErrorHandler
- [ ] Add retry with 3 attempts, 2-second delay
- [ ] Add 10-second timeout for SMTP operations
- [ ] Log retry attempts with `onRetry` callback

Example:
```typescript
await ErrorHandler.withRetry(
  () => ErrorHandler.withTimeout(
    () => transporter.sendMail(mailOptions),
    10000 // 10 second timeout
  ),
  {
    maxRetries: 3,
    delayMs: 2000,
    retryableErrors: [ErrorCategory.NETWORK, ErrorCategory.TIMEOUT],
    onRetry: (attempt) => logger.warn(`Email retry attempt ${attempt}`, { email })
  }
);
```

#### src/services/slack.ts
- [ ] Wrap all Slack Web API calls with ErrorHandler
- [ ] Add retry for rate limiting (429 errors)
- [ ] Add 10-second timeout for Slack API calls
- [ ] Handle token expiration errors gracefully

Example:
```typescript
await ErrorHandler.withRetry(
  () => ErrorHandler.withTimeout(
    () => client.chat.postMessage({ channel, text, blocks }),
    10000
  ),
  {
    maxRetries: 3,
    retryableErrors: [ErrorCategory.NETWORK, ErrorCategory.EXTERNAL_API],
    onRetry: (attempt) => logger.warn(`Slack API retry ${attempt}`, { workspaceId })
  }
);
```

#### src/auth/passport.ts
- [ ] Wrap OAuth API calls with ErrorHandler
- [ ] Add retry for transient network failures
- [ ] Add timeout protection for OAuth provider APIs

### Testing
- [ ] Verify retry logic works with database connection failures
- [ ] Test timeout protection with slow queries
- [ ] Confirm error categorization is correct

## 2. Input Validation with Validation Utilities

**Priority:** Medium  
**Effort:** 1-2 hours
**Files Affected:** src/routes/workspaces.ts, src/routes/slack.ts, src/routes/auth.ts

### Current State
Request data is used directly without validation or sanitization.

### Desired State
All user input should be validated using utilities from `src/utils/validation.ts`.

### Implementation Checklist

#### src/routes/workspaces.ts
- [ ] Add `validateRequest` middleware to all POST/PUT endpoints
- [ ] Create Joi schemas for workspace operations
- [ ] Use `Validator.sanitizeObject()` for request bodies
- [ ] Validate email formats, password strength, slugs

Example:
```typescript
import { validateRequest, commonSchemas, Validator } from '../middleware/validation';
import Joi from 'joi';

// Create schema
const workspaceActivationSchema = Joi.object({
  genericUsername: Joi.string().min(3).max(100).required(),
  genericPassword: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required()
});

// Apply validation
router.post('/:slug/activate',
  validateRequest(workspaceActivationSchema),
  async (req, res) => {
    const sanitized = Validator.sanitizeObject(req.body);
    // ... use sanitized data
  }
);
```

#### src/routes/auth.ts
- [ ] Add validation for password reset requests
- [ ] Validate email formats strictly
- [ ] Sanitize all string inputs
- [ ] Use `commonSchemas.authRequest` for login

#### src/routes/slack.ts
- [ ] Validate Slack webhook payloads
- [ ] Sanitize command input from users
- [ ] Validate workspace IDs and channel names

### Testing
- [ ] Test with invalid input (SQL injection attempts)
- [ ] Test with XSS payloads
- [ ] Verify validation error messages are user-friendly

## 3. Health Check Registration

**Priority:** Low
**Effort:** 1 hour
**Files Affected:** src/services/email.ts, src/services/slack.ts

### Current State
Email and Slack services don't register health checks for monitoring.

### Desired State
All critical services should register health checks using `healthCheckManager` from `src/utils/health-check.ts`.

### Implementation Checklist

#### src/services/email.ts
- [ ] Register SMTP connection health check
- [ ] Mark as non-critical (email is optional)
- [ ] Test SMTP connection with `transporter.verify()`
- [ ] Set 5-second timeout

Example:
```typescript
import { healthCheckManager } from '../utils/health-check';

// Register after transporter initialization
if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  healthCheckManager.register({
    name: 'smtp-connection',
    check: async () => {
      try {
        await transporter.verify();
        return { healthy: true, message: 'SMTP connection active' };
      } catch (error) {
        return { 
          healthy: false, 
          message: `SMTP connection failed: ${error.message}` 
        };
      }
    },
    critical: false, // Email is optional
    timeout: 5000
  });
}
```

#### src/services/slack.ts
- [ ] Register health check per workspace integration
- [ ] Test Slack token validity with `auth.test()`
- [ ] Mark as non-critical
- [ ] Set 3-second timeout

Example:
```typescript
export function registerSlackHealthCheck(workspaceId: string, botToken: string): void {
  healthCheckManager.register({
    name: `slack-${workspaceId}`,
    check: async () => {
      try {
        const client = new WebClient(botToken);
        await client.auth.test();
        return { healthy: true, message: 'Slack connection active' };
      } catch (error) {
        return { 
          healthy: false, 
          message: `Slack token invalid: ${error.message}` 
        };
      }
    },
    critical: false,
    timeout: 3000
  });
}

// Call after OAuth completion
await registerSlackHealthCheck(workspace.id, botToken);
```

### Testing
- [ ] Verify health checks appear in `/health/live` endpoint
- [ ] Test with invalid credentials (should show unhealthy)
- [ ] Confirm timeout works correctly

## 4. Additional Improvements (Optional)

### Password Complexity Requirements
- [ ] Enforce minimum 12 characters (currently 8)
- [ ] Require mixed case, numbers, symbols
- [ ] Add password strength meter to UI
- [ ] Implement password history (prevent reuse)

### Rate Limiting Enhancement
- [ ] Add stricter limits for workspace activation
- [ ] Implement progressive delays after failed attempts
- [ ] Add IP-based rate limiting for password reset

### Audit Logging
- [ ] Log all workspace activations
- [ ] Log OAuth account linking events
- [ ] Log Slack integration changes
- [ ] Log failed authentication attempts

## Implementation Priority

### High Priority (Do Next)
1. Error handling with ErrorHandler utilities
2. Input validation with validation utilities

### Medium Priority
3. Health check registration

### Low Priority (Nice to Have)
4. Password complexity improvements
5. Enhanced rate limiting
6. Audit logging

## Estimated Timeline

- **Error Handling:** 2-3 hours (systematic replacement in all files)
- **Input Validation:** 1-2 hours (create schemas, apply middleware)
- **Health Checks:** 1 hour (register checks, test endpoints)

**Total:** 4-6 hours of focused development

## Testing Strategy

1. **Unit Tests:** Add tests for error handling retry logic
2. **Integration Tests:** Test validation with invalid inputs
3. **Health Check Tests:** Verify health endpoint responses
4. **Manual Testing:** Test all flows end-to-end

## Documentation Updates

After implementation:
- [ ] Update PHASE6_IMPLEMENTATION_GUIDE.md with error handling patterns
- [ ] Document validation schemas in API.md
- [ ] Add health check documentation to ARCHITECTURE.md
- [ ] Update CHANGELOG.md with improvements

## Success Criteria

✅ All database queries wrapped with ErrorHandler
✅ All user inputs validated with Joi schemas
✅ All services registered with health checks
✅ Tests passing with new error handling
✅ Documentation updated

## Notes

These improvements are **not blocking** for Phase 6 deployment. The current implementation is secure and functional. These enhancements improve:
- **Reliability:** Retry logic for transient failures
- **Security:** Input validation prevents injection attacks  
- **Observability:** Health checks enable monitoring

They can be implemented incrementally in follow-up PRs without affecting existing functionality.
