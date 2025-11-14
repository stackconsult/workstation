# Security Testing Guide

## Overview

This guide provides comprehensive testing procedures for validating all security improvements implemented in the stackBrowserAgent application.

---

## Prerequisites

### Required Tools

```bash
# Install curl for API testing
sudo apt-get install curl  # Ubuntu/Debian
brew install curl          # macOS

# Install jq for JSON parsing
sudo apt-get install jq    # Ubuntu/Debian
brew install jq            # macOS

# Optional: Install httpie for prettier output
pip install httpie
```

### Test Environment Setup

```bash
# 1. Clone and install
git clone https://github.com/creditXcredit/workstation.git
cd workstation
npm install

# 2. Set up test environment
cp .env.example .env.test
nano .env.test  # Edit with test values

# 3. Build the application
npm run build
```

---

## Automated Security Tests

### Run All Tests

```bash
# Run the full test suite
npm test

# Expected output:
# Test Suites: 2 passed, 2 total
# Tests:       23 passed, 23 total
```

### Coverage Report

```bash
# Generate coverage report
npm test -- --coverage

# View HTML report
open coverage/lcov-report/index.html  # macOS
xdg-open coverage/lcov-report/index.html  # Linux
```

---

## Manual Security Testing

### 1. JWT Security Tests

#### Test 1.1: Production JWT Secret Enforcement

**Objective**: Verify JWT_SECRET is required in production

```bash
# This should FAIL with error message
JWT_SECRET= NODE_ENV=production npm start

# Expected output:
# Error: JWT_SECRET environment variable is required in production

# This should SUCCEED
JWT_SECRET="test-secret-32-characters-minimum-here" NODE_ENV=production npm start
```

**Pass Criteria**: ✅ Application fails to start without JWT_SECRET in production

---

#### Test 1.2: JWT Algorithm Validation

**Objective**: Verify only allowed algorithms accepted

```bash
# Start the server
npm run dev &
sleep 3

# Generate a valid token
TOKEN=$(curl -s http://localhost:3000/auth/demo-token | jq -r '.token')

# Try to use a token with 'none' algorithm (should fail)
# Note: You'd need to craft this manually, as our API won't generate it
# Using a valid token should work:
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/protected

# Expected: {"message":"Access granted to protected resource","user":{...}}
```

**Pass Criteria**: 
- ✅ Valid tokens with HS256 accepted
- ✅ Tokens with 'none' algorithm rejected

---

#### Test 1.3: Token Expiration

**Objective**: Verify expired tokens are rejected

```bash
# Generate token with 5 second expiration
JWT_EXPIRATION=5s npm run dev &
sleep 3

TOKEN=$(curl -s http://localhost:3000/auth/demo-token | jq -r '.token')

# Use immediately (should work)
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/protected
# Expected: 200 OK

# Wait for expiration
sleep 10

# Use expired token (should fail)
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/protected
# Expected: 403 Forbidden
```

**Pass Criteria**: 
- ✅ Valid tokens accepted
- ✅ Expired tokens rejected with 403

---

### 2. Security Headers Tests

#### Test 2.1: Helmet Headers Present

**Objective**: Verify all security headers are set

```bash
# Start server
npm run dev &
sleep 3

# Check headers
curl -I http://localhost:3000/health

# Expected headers:
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# X-XSS-Protection: 1; mode=block
# Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
# Content-Security-Policy: default-src 'self'...
```

**Pass Criteria**: ✅ All security headers present in response

---

#### Test 2.2: Content Security Policy

**Objective**: Verify CSP blocks unauthorized resources

```bash
# Check CSP header
curl -I http://localhost:3000/health | grep -i "content-security-policy"

# Expected: Content-Security-Policy header with restrictive policy
```

**Pass Criteria**: 
- ✅ CSP header present
- ✅ default-src restricted to 'self'
- ✅ script-src restricted

---

### 3. CORS Protection Tests

#### Test 3.1: Allowed Origins

**Objective**: Verify CORS allows configured origins

```bash
# Start with specific allowed origins
ALLOWED_ORIGINS=http://localhost:3000,http://example.com npm run dev &
sleep 3

# Test allowed origin
curl -H "Origin: http://localhost:3000" -I http://localhost:3000/health | grep -i "access-control"

# Expected: Access-Control-Allow-Origin: http://localhost:3000
```

**Pass Criteria**: ✅ Allowed origins receive proper CORS headers

---

#### Test 3.2: Blocked Origins

**Objective**: Verify CORS blocks unauthorized origins

```bash
# Test blocked origin
curl -H "Origin: http://evil.com" -v http://localhost:3000/health 2>&1 | grep -i "access-control"

# Expected: No Access-Control-Allow-Origin header OR error
```

**Pass Criteria**: ✅ Unauthorized origins blocked or not allowed

---

#### Test 3.3: Production CORS Enforcement

**Objective**: Verify production requires explicit CORS configuration

```bash
# Start in production without ALLOWED_ORIGINS
ALLOWED_ORIGINS= NODE_ENV=production JWT_SECRET="test-secret-32-chars-minimum" npm start &
sleep 3

# Try to access from any origin
curl -H "Origin: http://localhost:3000" http://localhost:3000/health

# Expected: Request should fail or be blocked
```

**Pass Criteria**: ✅ Production blocks requests without explicit CORS config

---

### 4. Input Sanitization Tests

#### Test 4.1: XSS Prevention in userId

**Objective**: Verify HTML tags removed from userId

```bash
# Try to inject script tags
curl -X POST http://localhost:3000/auth/token \
  -H "Content-Type: application/json" \
  -d '{"userId":"<script>alert(1)</script>","role":"user"}' | jq

# Get the token and decode it
TOKEN=$(curl -s -X POST http://localhost:3000/auth/token \
  -H "Content-Type: application/json" \
  -d '{"userId":"<script>alert(1)</script>","role":"user"}' | jq -r '.token')

# Decode token (use jwt.io or decode manually)
echo $TOKEN | cut -d. -f2 | base64 -d 2>/dev/null | jq

# Expected: userId should be "scriptalert(1)/script" (tags removed)
```

**Pass Criteria**: 
- ✅ Script tags removed from userId
- ✅ Token still generated successfully

---

#### Test 4.2: Whitespace Trimming

**Objective**: Verify whitespace trimmed from inputs

```bash
# Try with leading/trailing whitespace
curl -X POST http://localhost:3000/auth/token \
  -H "Content-Type: application/json" \
  -d '{"userId":"  test-user  ","role":"user"}' | jq

# Decode token
TOKEN=$(curl -s -X POST http://localhost:3000/auth/token \
  -H "Content-Type: application/json" \
  -d '{"userId":"  test-user  ","role":"user"}' | jq -r '.token')

echo $TOKEN | cut -d. -f2 | base64 -d 2>/dev/null | jq

# Expected: userId should be "test-user" (whitespace trimmed)
```

**Pass Criteria**: ✅ Whitespace trimmed from inputs

---

### 5. Privacy & Logging Tests

#### Test 5.1: IP Anonymization

**Objective**: Verify IPs are hashed in logs

```bash
# Make a request
curl http://localhost:3000/health

# Check logs (if file logging enabled)
# In production with file logging:
tail logs/combined.log | grep "Request completed"

# Expected: Should see ipHash instead of ip field
# Example: "ipHash":"3e48ef9d22e096da" instead of "ip":"127.0.0.1"
```

**Pass Criteria**: 
- ✅ Logs contain ipHash field
- ✅ No raw IP addresses in logs
- ✅ Hash is consistent for same IP

---

#### Test 5.2: Log Directory Creation

**Objective**: Verify logs directory created automatically

```bash
# Remove logs directory
rm -rf logs/

# Start in production mode
NODE_ENV=production JWT_SECRET="test-secret" npm start &
sleep 3

# Check if directory was created
ls -la logs/

# Expected: logs/ directory exists with error.log and combined.log
```

**Pass Criteria**: ✅ logs/ directory created automatically

---

### 6. Error Handling Tests

#### Test 6.1: Production Error Messages

**Objective**: Verify no sensitive information leaked in production

```bash
# Start in production mode
NODE_ENV=production JWT_SECRET="test-secret" npm start &
sleep 3

# Try to cause an error (e.g., invalid token)
curl -H "Authorization: Bearer invalid-token" http://localhost:3000/api/protected | jq

# Expected: Generic error message, no stack trace
# {"error":"Invalid or expired token"}
```

**Pass Criteria**: 
- ✅ Generic error messages in production
- ✅ No stack traces in response
- ✅ No internal paths or code exposed

---

#### Test 6.2: Development Error Messages

**Objective**: Verify detailed errors in development

```bash
# Start in development mode
NODE_ENV=development npm run dev &
sleep 3

# Trigger error
curl -H "Authorization: Bearer invalid-token" http://localhost:3000/api/protected | jq

# Expected: More detailed error message for debugging
```

**Pass Criteria**: ✅ Detailed errors available in development

---

### 7. Rate Limiting Tests

#### Test 7.1: General Endpoint Rate Limit

**Objective**: Verify 100 requests per 15 minutes limit

```bash
# Hit endpoint 101 times rapidly
for i in {1..101}; do
  curl -s http://localhost:3000/health -o /dev/null -w "%{http_code}\n"
  sleep 0.1
done

# Expected: First 100 requests succeed (200), 101st fails (429)
```

**Pass Criteria**: ✅ Request 101 returns 429 Too Many Requests

---

#### Test 7.2: Auth Endpoint Rate Limit

**Objective**: Verify 10 requests per 15 minutes limit

```bash
# Hit auth endpoint 11 times
for i in {1..11}; do
  curl -s http://localhost:3000/auth/demo-token -o /dev/null -w "%{http_code}\n"
  sleep 0.5
done

# Expected: First 10 succeed (200), 11th fails (429)
```

**Pass Criteria**: ✅ Request 11 returns 429 Too Many Requests

---

### 8. Authentication Flow Tests

#### Test 8.1: Complete Auth Flow

**Objective**: Verify end-to-end authentication works

```bash
# 1. Get demo token
TOKEN=$(curl -s http://localhost:3000/auth/demo-token | jq -r '.token')
echo "Token: $TOKEN"

# 2. Access protected endpoint
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/protected | jq

# Expected: {"message":"Access granted...","user":{...}}

# 3. Try without token
curl http://localhost:3000/api/protected | jq

# Expected: {"error":"No token provided"}

# 4. Try with invalid token
curl -H "Authorization: Bearer invalid" http://localhost:3000/api/protected | jq

# Expected: {"error":"Invalid or expired token"}
```

**Pass Criteria**: 
- ✅ Valid token grants access
- ✅ No token returns 401
- ✅ Invalid token returns 403

---

#### Test 8.2: Custom Token Generation

**Objective**: Verify custom token generation with validation

```bash
# Valid request
curl -X POST http://localhost:3000/auth/token \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user","role":"admin"}' | jq

# Expected: {"token":"..."}

# Invalid request (missing userId)
curl -X POST http://localhost:3000/auth/token \
  -H "Content-Type: application/json" \
  -d '{"role":"admin"}' | jq

# Expected: 400 Bad Request with validation error

# Invalid role
curl -X POST http://localhost:3000/auth/token \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user","role":"invalid"}' | jq

# Expected: 400 Bad Request with validation error
```

**Pass Criteria**: 
- ✅ Valid requests succeed
- ✅ Invalid requests rejected with proper error
- ✅ Validation messages clear and helpful

---

## Load Testing

### Basic Load Test

```bash
# Install Apache Bench
sudo apt-get install apache2-utils  # Ubuntu
brew install apache2               # macOS

# Test health endpoint
ab -n 1000 -c 10 http://localhost:3000/health

# Test with authentication
TOKEN=$(curl -s http://localhost:3000/auth/demo-token | jq -r '.token')
ab -n 1000 -c 10 -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/protected
```

**Pass Criteria**:
- ✅ No errors under load
- ✅ Response times acceptable (<100ms p95)
- ✅ Rate limiting still works

---

## Security Scanning

### npm Audit

```bash
# Run npm security audit
npm audit

# Expected: 0 vulnerabilities
```

**Pass Criteria**: ✅ No high or critical vulnerabilities

---

### Dependency Check

```bash
# Check for outdated dependencies
npm outdated

# Update if needed
npm update
npm audit fix
```

---

## Compliance Checks

### OWASP Top 10 Checklist

- [x] A01:2021 – Broken Access Control
  - JWT authentication implemented
  - Rate limiting prevents abuse
  
- [x] A02:2021 – Cryptographic Failures
  - Strong JWT secrets required
  - HTTPS enforced via HSTS
  
- [x] A03:2021 – Injection
  - Input validation with Joi
  - Input sanitization for XSS
  
- [x] A04:2021 – Insecure Design
  - Security-by-design approach
  - Defense in depth
  
- [x] A05:2021 – Security Misconfiguration
  - Helmet security headers
  - Secure defaults
  
- [x] A06:2021 – Vulnerable Components
  - npm audit passing
  - Dependabot enabled
  
- [x] A07:2021 – Authentication Failures
  - JWT with algorithm validation
  - Rate limiting on auth
  
- [x] A08:2021 – Data Integrity Failures
  - JWT signature verification
  - Input validation
  
- [x] A09:2021 – Logging Failures
  - Winston structured logging
  - IP anonymization
  
- [x] A10:2021 – SSRF
  - No external requests in current scope

---

## Continuous Security Testing

### GitHub Actions Integration

```yaml
# .github/workflows/security-tests.yml
name: Security Tests

on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Security audit
        run: npm audit --audit-level=high
      
      - name: Check for secrets
        run: |
          if grep -r "JWT_SECRET.*=" .env 2>/dev/null; then
            echo "ERROR: .env file committed!"
            exit 1
          fi
```

---

## Incident Response Testing

### Simulated Attack Scenarios

#### Scenario 1: Brute Force Attack

```bash
# Simulate brute force on auth endpoint
for i in {1..20}; do
  curl -s -X POST http://localhost:3000/auth/token \
    -H "Content-Type: application/json" \
    -d '{"userId":"attacker","role":"admin"}' \
    -o /dev/null -w "%{http_code}\n"
done

# Expected: Rate limiting kicks in after 10 attempts
```

#### Scenario 2: JWT Forgery Attempt

```bash
# Try to use unsigned token
curl -H "Authorization: Bearer eyJhbGciOiJub25lIn0.eyJ1c2VySWQiOiJhdHRhY2tlciJ9." \
  http://localhost:3000/api/protected

# Expected: 403 Forbidden (algorithm validation prevents this)
```

#### Scenario 3: CORS Attack

```bash
# Simulate malicious origin
curl -H "Origin: http://evil.com" \
  -H "Content-Type: application/json" \
  -X POST http://localhost:3000/auth/token \
  -d '{"userId":"victim","role":"admin"}'

# Expected: CORS blocks the request
```

---

## Test Results Documentation

### Test Report Template

```markdown
# Security Test Report

**Date**: YYYY-MM-DD
**Tester**: Name
**Version**: 1.1.0

## Test Results Summary

| Category | Tests Run | Passed | Failed | Notes |
|----------|-----------|--------|--------|-------|
| JWT Security | 3 | 3 | 0 | All JWT tests passed |
| Security Headers | 2 | 2 | 0 | Headers present |
| CORS Protection | 3 | 3 | 0 | CORS working correctly |
| Input Sanitization | 2 | 2 | 0 | XSS prevention working |
| Privacy | 2 | 2 | 0 | IP anonymization working |
| Error Handling | 2 | 2 | 0 | No leaks detected |
| Rate Limiting | 2 | 2 | 0 | Limits enforced |
| Auth Flow | 2 | 2 | 0 | End-to-end working |

**Total**: 18 tests run, 18 passed, 0 failed

## Vulnerabilities Found

None

## Recommendations

- Continue monitoring rate limit effectiveness
- Consider implementing refresh tokens
- Plan for Redis-backed rate limiting

## Sign-off

Tested by: _______________
Date: _______________
```

---

## Support

For questions about security testing:
- GitHub Issues: https://github.com/creditXcredit/workstation/issues
- Security email: security@yourdomain.com

---

**Document Version**: 1.0  
**Last Updated**: November 14, 2024  
**Next Review**: February 14, 2025
