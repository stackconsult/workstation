# Rollback Guide - Security Fixes

## Overview

This guide provides detailed procedures for rolling back security fixes if issues are encountered in production. Each fix can be rolled back independently or as a complete package.

---

## Quick Reference

| Fix | Severity | Rollback Complexity | Files Affected |
|-----|----------|---------------------|----------------|
| JWT Secret Enforcement | Critical | Low | jwt.ts, env.ts |
| JWT Algorithm Validation | Critical | Low | jwt.ts |
| Helmet Security Headers | High | Low | index.ts, package.json |
| CORS Restrictions | High | Medium | index.ts, .env.example |
| Input Sanitization | Medium | Low | jwt.ts |
| IP Anonymization | Medium | Low | index.ts |
| Error Handling | Medium | Low | errorHandler.ts |
| Log Directory Creation | Low | Low | logger.ts |

---

## Complete Rollback

### Option 1: Git Revert (Recommended)

```bash
# 1. Identify the commit to revert
git log --oneline | head -10

# 2. Revert the security fixes commit
git revert <security-fixes-commit-hash>

# 3. Rebuild the application
npm ci
npm run build

# 4. Run tests to verify
npm test

# 5. Deploy
npm start

# 6. Verify application is working
curl http://localhost:3000/health
```

**Pros**: 
- Preserves git history
- Can be easily re-applied later
- Safe and auditable

**Cons**:
- Creates additional commit
- May have merge conflicts

---

### Option 2: Reset to Previous Commit

⚠️ **WARNING**: This rewrites git history. Only use if you haven't pushed to main branch.

```bash
# 1. Backup current state (optional)
git branch backup-before-reset

# 2. Find the commit before security fixes
git log --oneline | head -10

# 3. Hard reset to previous commit
git reset --hard <previous-commit-hash>

# 4. Force push (if already pushed)
git push --force origin <branch-name>

# 5. Rebuild and test
npm ci
npm run build
npm test
npm start
```

**Pros**:
- Clean history
- Complete rollback

**Cons**:
- Loses git history
- Dangerous if others have pulled the changes
- Requires force push

---

### Option 3: Cherry-Pick Previous State

```bash
# 1. Create a new branch for rollback
git checkout -b rollback-security-fixes

# 2. Cherry-pick the state before security fixes
git cherry-pick <commit-before-security-fixes>

# 3. Rebuild and test
npm ci
npm run build
npm test

# 4. Deploy if tests pass
npm start
```

---

## Individual Fix Rollbacks

### 1. Rollback JWT Secret Enforcement

**When to rollback**: If production deployment fails due to missing JWT_SECRET.

**Impact**: Returns to allowing default JWT secret (less secure).

**Steps**:

```bash
# 1. Edit src/auth/jwt.ts
# Remove or comment out lines 7-9:
```

```typescript
// REMOVE THESE LINES:
if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET environment variable is required in production');
}
```

```bash
# 2. Restore original JWT_SECRET line
```

```typescript
// CHANGE FROM:
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-min-32-chars-long-for-testing-only-' + Math.random().toString(36);

// BACK TO:
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';
```

```bash
# 3. Rebuild and restart
npm run build
npm start

# 4. Verify
curl http://localhost:3000/auth/demo-token
```

**Alternative**: Set JWT_SECRET environment variable instead of rolling back:

```bash
export JWT_SECRET="your-secure-32-character-secret-key"
npm start
```

---

### 2. Rollback JWT Algorithm Validation

**When to rollback**: If existing tokens fail validation after deployment.

**Impact**: Removes protection against 'none' algorithm attack.

**Steps**:

```bash
# 1. Edit src/auth/jwt.ts
```

```typescript
// REMOVE THIS LINE:
const ALLOWED_ALGORITHMS: jwt.Algorithm[] = ['HS256', 'HS384', 'HS512'];

// In generateToken function, REMOVE:
algorithm: 'HS256',

// In verifyToken function, CHANGE FROM:
const options: VerifyOptions = {
  algorithms: ALLOWED_ALGORITHMS,
};
return jwt.verify(token, JWT_SECRET, options) as JWTPayload;

// BACK TO:
return jwt.verify(token, JWT_SECRET) as JWTPayload;
```

```bash
# 2. Rebuild and restart
npm run build
npm start

# 3. Test with existing tokens
curl -H "Authorization: Bearer <old-token>" http://localhost:3000/api/protected
```

---

### 3. Rollback Helmet Security Headers

**When to rollback**: If security headers cause issues with frontend applications.

**Impact**: Removes security headers protection (XSS, clickjacking, etc.).

**Steps**:

```bash
# 1. Remove helmet from package.json
npm uninstall helmet @types/helmet

# 2. Edit src/index.ts
```

```typescript
// REMOVE THIS IMPORT:
import helmet from 'helmet';

// REMOVE THIS BLOCK (lines 44-58):
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));
```

```bash
# 3. Rebuild and restart
npm ci
npm run build
npm start

# 4. Verify headers removed
curl -I http://localhost:3000/health | grep -E "X-|Content-Security|Strict-Transport"
# Should not show security headers
```

**Alternative**: Adjust Helmet configuration to allow specific sources:

```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://your-cdn.com"],
      scriptSrc: ["'self'", "https://your-cdn.com"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
```

---

### 4. Rollback CORS Restrictions

**When to rollback**: If legitimate requests are being blocked.

**Impact**: Allows all origins again (CSRF vulnerability).

**Steps**:

```bash
# 1. Edit src/index.ts
```

```typescript
// REPLACE THE ENTIRE CORS BLOCK (lines 60-88) WITH:
app.use(cors());
```

```bash
# 2. Remove ALLOWED_ORIGINS from .env
# Edit .env and remove:
ALLOWED_ORIGINS=...

# 3. Rebuild and restart
npm run build
npm start

# 4. Test CORS working
curl -H "Origin: https://any-origin.com" http://localhost:3000/health
# Should work for any origin
```

**Alternative**: Add missing origins to ALLOWED_ORIGINS:

```bash
# In .env, add the blocked origins:
ALLOWED_ORIGINS=http://localhost:3000,https://your-frontend.com,https://blocked-origin.com
```

---

### 5. Rollback Input Sanitization

**When to rollback**: If userId validation is too strict for existing users.

**Impact**: Removes XSS protection in userId field.

**Steps**:

```bash
# 1. Edit src/auth/jwt.ts
# In generateToken function, REMOVE lines 27-29:
```

```typescript
// REMOVE THESE LINES:
if (payload.userId && typeof payload.userId === 'string') {
  payload.userId = payload.userId.trim().replace(/[<>]/g, '');
}
```

```bash
# 2. Rebuild and restart
npm run build
npm start

# 3. Test with special characters
curl -X POST http://localhost:3000/auth/token \
  -H "Content-Type: application/json" \
  -d '{"userId":"user<123>","role":"user"}'
```

**Alternative**: Adjust sanitization to be less strict:

```typescript
// Keep trim, remove only specific characters
if (payload.userId && typeof payload.userId === 'string') {
  payload.userId = payload.userId.trim();
}
```

---

### 6. Rollback IP Anonymization

**When to rollback**: If you need full IP addresses for debugging.

**Impact**: Logs full IP addresses (privacy concern).

**Steps**:

```bash
# 1. Edit src/index.ts
```

```typescript
// REMOVE THE CRYPTO IMPORT:
import { createHash } from 'crypto';

// REPLACE THE REQUEST LOGGING MIDDLEWARE (lines 92-104):
app.use((req: Request, res: Response, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    });
  });
  next();
});
```

```bash
# 2. Rebuild and restart
npm run build
npm start

# 3. Check logs show full IPs
tail -f logs/combined.log | grep "Request completed"
```

**Alternative**: Log both hashed and full IP in development:

```typescript
const ipHash = req.ip ? createHash('sha256').update(req.ip).digest('hex').substring(0, 16) : 'unknown';
logger.info('Request completed', {
  method: req.method,
  path: req.path,
  status: res.statusCode,
  duration: `${duration}ms`,
  ipHash,
  ip: process.env.NODE_ENV === 'development' ? req.ip : undefined,
});
```

---

### 7. Rollback Error Handling Improvements

**When to rollback**: If you need detailed error messages for debugging.

**Impact**: May leak stack traces to clients.

**Steps**:

```bash
# 1. Edit src/middleware/errorHandler.ts
# Replace the entire errorHandler function with:
```

```typescript
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  if (res.headersSent) {
    return next(err);
  }

  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
}
```

```bash
# 2. Rebuild and restart
npm run build
npm start
```

**Alternative**: Enable detailed errors only for specific IPs:

```typescript
const trustedIPs = ['127.0.0.1', '::1'];
const isDevelopment = process.env.NODE_ENV === 'development';
const isTrusted = req.ip && trustedIPs.includes(req.ip);

res.status(500).json({
  error: 'Internal server error',
  message: (isDevelopment || isTrusted) ? err.message : 'An unexpected error occurred',
});
```

---

### 8. Rollback Log Directory Creation

**When to rollback**: If filesystem permissions cause issues.

**Impact**: May fail to start if logs/ directory doesn't exist.

**Steps**:

```bash
# 1. Edit src/utils/logger.ts
```

```typescript
// REMOVE THESE IMPORTS:
import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

// REMOVE THIS FUNCTION:
function ensureLogDirectory(filepath: string): void {
  const dir = dirname(filepath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

// REMOVE THESE LINES (around line 40-42):
const errorLogPath = 'logs/error.log';
const combinedLogPath = 'logs/combined.log';
ensureLogDirectory(errorLogPath);

// CHANGE BACK TO:
logger.add(
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
  })
);
logger.add(
  new winston.transports.File({
    filename: 'logs/combined.log',
  })
);
```

```bash
# 2. Manually create logs directory
mkdir -p logs

# 3. Rebuild and restart
npm run build
npm start
```

---

## Emergency Rollback Scenarios

### Scenario 1: Production is Down After Deployment

**Immediate Action**:

```bash
# 1. Switch to previous release
cd /path/to/deployment
git checkout <previous-working-commit>

# 2. Quick rebuild (if needed)
npm ci --production
npm run build

# 3. Restart service immediately
pm2 restart app  # or your process manager
# OR
systemctl restart your-service
```

**Verification**:

```bash
# Check health endpoint
curl http://your-domain.com/health

# Check logs for errors
tail -f logs/error.log
```

---

### Scenario 2: Existing Tokens Stop Working

**Cause**: JWT algorithm validation

**Quick Fix**:

```bash
# 1. Temporarily disable algorithm validation
# Edit src/auth/jwt.ts and comment out algorithm check

# 2. Quick rebuild
npm run build && pm2 restart app

# 3. Issue new tokens to all users
# Use your token refresh mechanism
```

---

### Scenario 3: Frontend Blocked by CORS

**Cause**: CORS restrictions too tight

**Quick Fix**:

```bash
# 1. Add frontend origin to allowed list
export ALLOWED_ORIGINS="$ALLOWED_ORIGINS,https://your-frontend.com"

# 2. Restart service
pm2 restart app

# OR edit .env and restart
echo "ALLOWED_ORIGINS=https://your-frontend.com" >> .env
pm2 restart app
```

---

### Scenario 4: Security Headers Break Frontend

**Cause**: CSP blocking required resources

**Quick Fix**:

```bash
# 1. Temporarily disable Helmet
# Edit src/index.ts and comment out app.use(helmet({...}))

# 2. Rebuild and restart
npm run build && pm2 restart app

# 3. Later, configure CSP properly
# Add your CDN domains to CSP directives
```

---

## Post-Rollback Checklist

After any rollback, verify:

- [ ] Application starts successfully
- [ ] Health endpoint responds
- [ ] Authentication works
- [ ] API endpoints accessible
- [ ] Frontend can connect
- [ ] No errors in logs
- [ ] Rate limiting works
- [ ] Database connections OK
- [ ] Monitoring alerts clear
- [ ] Performance metrics normal

## Rollback Testing

Before production rollback, test in staging:

```bash
# 1. Deploy rollback to staging
git checkout staging
git cherry-pick <rollback-commit>
git push origin staging

# 2. Run automated tests
npm test
npm run test:integration

# 3. Manual smoke tests
curl http://staging.your-domain.com/health
curl http://staging.your-domain.com/auth/demo-token

# 4. Load test
# Use your load testing tool
ab -n 1000 -c 10 http://staging.your-domain.com/health

# 5. If all good, proceed to production
```

---

## Prevention for Future Deployments

### Blue-Green Deployment

```bash
# 1. Deploy to green environment
deploy-to-green.sh

# 2. Run tests on green
test-green-environment.sh

# 3. Switch traffic to green
switch-to-green.sh

# 4. Keep blue running for quick rollback
# If issues: switch-to-blue.sh
```

### Canary Deployment

```bash
# 1. Deploy to 10% of servers
deploy-canary.sh

# 2. Monitor for 15 minutes
monitor-canary.sh

# 3. If metrics good, deploy to all
deploy-all.sh

# 4. If issues, rollback canary
rollback-canary.sh
```

### Feature Flags

```typescript
// In code, use feature flags
if (process.env.ENABLE_SECURITY_HEADERS === 'true') {
  app.use(helmet({...}));
}

// Easy rollback via environment variable
export ENABLE_SECURITY_HEADERS=false
pm2 restart app
```

---

## Support Contacts

### Rollback Issues

- **DevOps Team**: devops@yourdomain.com
- **On-Call Engineer**: +1-XXX-XXX-XXXX
- **Slack**: #incident-response

### Escalation Path

1. DevOps Engineer (0-15 min)
2. Senior Developer (15-30 min)
3. Tech Lead (30-60 min)
4. CTO (60+ min)

---

## Documentation Updates

After rollback:

1. Document reason for rollback in CHANGELOG.md
2. Create incident report
3. Update SECURITY_FIXES.md with known issues
4. Schedule post-mortem meeting
5. Plan proper fix for next sprint

---

**Document Version**: 1.0  
**Last Updated**: November 14, 2024  
**Owner**: DevOps Team
