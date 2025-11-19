# Validation Checklist - Module 1

## Pre-Validation Setup

Ensure you have completed:
- [ ] Repository cloned
- [ ] Dependencies installed (`npm install`)
- [ ] Playwright browsers installed (`npx playwright install`)
- [ ] Environment configured (`.env` file created)
- [ ] Project built (`npm run build`)
- [ ] Server started (`npm run dev`)

## Core Functionality Tests

### 1. Server Health Check

**Test:** Verify server is running

```bash
curl http://localhost:3000/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-11-19T17:00:00.000Z",
  "uptime": 42
}
```

**Pass Criteria:**
- ✅ HTTP 200 status code
- ✅ JSON response with `status: "ok"`
- ✅ Valid timestamp
- ✅ Uptime > 0

### 2. JWT Token Generation

**Test:** Generate a demo authentication token

```bash
curl http://localhost:3000/auth/demo-token
```

**Expected Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "24h",
  "userId": "demo-user",
  "role": "user"
}
```

**Pass Criteria:**
- ✅ HTTP 200 status code
- ✅ Token is a valid JWT string (3 parts separated by dots)
- ✅ Expiration matches `.env` configuration
- ✅ User information included

### 3. Protected Route Access

**Test:** Access protected endpoint with authentication

```bash
# Get token
TOKEN=$(curl -s http://localhost:3000/auth/demo-token | jq -r '.token')

# Access protected route
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/protected
```

**Expected Response:**
```json
{
  "message": "Access granted",
  "user": {
    "userId": "demo-user",
    "role": "user"
  }
}
```

**Pass Criteria:**
- ✅ HTTP 200 status code
- ✅ User information correctly decoded
- ✅ No authentication errors

### 4. Rate Limiting

**Test:** Verify rate limiting is active

```bash
# Send multiple requests rapidly
for i in {1..20}; do 
  curl -s http://localhost:3000/auth/demo-token | jq -r '.message // .error' 
done | tail -5
```

**Expected Behavior:**
After ~10 requests (depending on config), should see:
```
Too many requests, please try again later.
```

**Pass Criteria:**
- ✅ Rate limit kicks in after configured threshold
- ✅ HTTP 429 status code when limited
- ✅ Appropriate error message

### 5. Invalid Token Handling

**Test:** Verify security with invalid token

```bash
curl -H "Authorization: Bearer invalid-token" http://localhost:3000/api/protected
```

**Expected Response:**
```json
{
  "error": "Invalid token"
}
```

**Pass Criteria:**
- ✅ HTTP 403 status code
- ✅ Clear error message
- ✅ No sensitive information leaked

### 6. Missing Token Handling

**Test:** Verify authentication requirement

```bash
curl http://localhost:3000/api/protected
```

**Expected Response:**
```json
{
  "error": "No token provided"
}
```

**Pass Criteria:**
- ✅ HTTP 401 status code
- ✅ Clear error message

## Browser Automation Tests (If Applicable)

### 7. Browser Agent Health

**Test:** Check browser agent is available

```bash
curl http://localhost:3000/api/v2/agents
```

**Expected Response:**
```json
{
  "agents": [
    {
      "type": "browser",
      "name": "Browser Agent",
      "actions": ["navigate", "click", "type", "getText", "screenshot", "getContent", "evaluate"]
    }
  ]
}
```

**Pass Criteria:**
- ✅ Browser agent is registered
- ✅ All 7 actions available

### 8. Simple Navigation Test

**Test:** Execute basic browser navigation

```bash
TOKEN=$(curl -s http://localhost:3000/auth/demo-token | jq -r '.token')

curl -X POST http://localhost:3000/api/v2/workflows \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Navigation",
    "definition": {
      "tasks": [{
        "name": "navigate",
        "agent_type": "browser",
        "action": "navigate",
        "parameters": {"url": "https://example.com"}
      }]
    }
  }'
```

**Expected Response:**
```json
{
  "id": "wf-1234567890",
  "status": "pending",
  "created_at": "2024-11-19T17:00:00.000Z"
}
```

**Pass Criteria:**
- ✅ Workflow created successfully
- ✅ Returns workflow ID
- ✅ Status is "pending" or "running"

## Database Tests

### 9. Workflow Storage

**Test:** Verify database connectivity

```bash
TOKEN=$(curl -s http://localhost:3000/auth/demo-token | jq -r '.token')

# List workflows
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/v2/workflows
```

**Expected Response:**
```json
{
  "workflows": [],
  "total": 0
}
```

**Pass Criteria:**
- ✅ HTTP 200 status code
- ✅ Returns array (empty or with workflows)
- ✅ No database errors

## Build & Test Suite

### 10. TypeScript Build

**Test:** Verify TypeScript compilation

```bash
npm run build
```

**Expected Output:**
```
> stackbrowseragent@1.0.0 build
> tsc && npm run copy-assets

> stackbrowseragent@1.0.0 copy-assets
> mkdir -p dist/automation/db && cp src/automation/db/schema.sql dist/automation/db/
```

**Pass Criteria:**
- ✅ No TypeScript errors
- ✅ `dist/` directory created
- ✅ All files compiled

### 11. Linting

**Test:** Check code quality

```bash
npm run lint
```

**Expected Output:**
```
> stackbrowseragent@1.0.0 lint
> eslint src --ext .ts

(No errors)
```

**Pass Criteria:**
- ✅ No linting errors
- ✅ No warnings (or acceptable warnings documented)

### 12. Test Suite

**Test:** Run automated tests

```bash
npm test
```

**Expected Output:**
```
PASS tests/auth/jwt.test.ts
PASS tests/middleware/errorHandler.test.ts
PASS tests/routes/automation.test.ts

Test Suites: 36 passed, 36 total
Tests:       170 passed, 170 total
```

**Pass Criteria:**
- ✅ All tests pass
- ✅ Coverage > 55% (current baseline)

## Docker Validation (If Using Docker)

### 13. Docker Build

**Test:** Build Docker image

```bash
docker build -t workstation:test .
```

**Pass Criteria:**
- ✅ Build completes without errors
- ✅ Image size < 500MB (reasonable)

### 14. Docker Run

**Test:** Run containerized application

```bash
docker run -d \
  --name workstation-test \
  -p 3001:3000 \
  -e JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))") \
  workstation:test

# Wait for startup
sleep 5

# Test health
curl http://localhost:3001/health

# Cleanup
docker stop workstation-test
docker rm workstation-test
```

**Pass Criteria:**
- ✅ Container starts successfully
- ✅ Health check passes
- ✅ No crashes or errors

## Performance Checks

### 15. Response Time

**Test:** Measure API performance

```bash
# Health endpoint
time curl -s http://localhost:3000/health > /dev/null

# Auth endpoint
time curl -s http://localhost:3000/auth/demo-token > /dev/null
```

**Pass Criteria:**
- ✅ Health check: < 50ms
- ✅ Token generation: < 100ms
- ✅ Protected route: < 150ms

### 16. Memory Usage

**Test:** Check server memory footprint

```bash
# Get Node.js process ID
PID=$(pgrep -f "node.*src/index.ts")

# Check memory (macOS/Linux)
ps -o pid,rss,vsz,comm $PID
```

**Pass Criteria:**
- ✅ RSS < 200MB (typical for idle server)
- ✅ No memory leaks (stable over time)

## Security Validation

### 17. Environment Security

**Test:** Verify secrets are not exposed

```bash
# Check .env is not in git
git ls-files | grep "^\.env$"

# Check JWT_SECRET is not default
grep "JWT_SECRET=changeme" .env
```

**Pass Criteria:**
- ✅ `.env` not tracked by git
- ✅ JWT_SECRET is not "changeme"
- ✅ JWT_SECRET is at least 32 characters

### 18. CORS Configuration

**Test:** Verify CORS headers

```bash
curl -H "Origin: http://evil.com" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     http://localhost:3000/api/protected \
     -v 2>&1 | grep -i "access-control"
```

**Pass Criteria:**
- ✅ CORS headers present
- ✅ Allowed origins configured correctly
- ✅ Credentials handling appropriate

## Documentation Tests

### 19. README Accuracy

**Manual Check:** Verify documentation is current

- [ ] Installation steps work as documented
- [ ] All commands in README execute successfully
- [ ] Example code runs without errors
- [ ] Links to documentation work

### 20. API Documentation

**Test:** Verify API docs match implementation

```bash
# Compare endpoints in API.md with actual routes
curl http://localhost:3000/api/docs 2>/dev/null || echo "No API docs endpoint"
```

**Manual Check:**
- [ ] All documented endpoints exist
- [ ] Request/response examples are accurate
- [ ] Authentication requirements documented

## Completion Summary

Mark each section as you complete it:

**Core Functionality** (6 tests)
- [ ] Server Health Check
- [ ] JWT Token Generation
- [ ] Protected Route Access
- [ ] Rate Limiting
- [ ] Invalid Token Handling
- [ ] Missing Token Handling

**Browser Automation** (2 tests)
- [ ] Browser Agent Health
- [ ] Simple Navigation Test

**Database** (1 test)
- [ ] Workflow Storage

**Build & Test** (3 tests)
- [ ] TypeScript Build
- [ ] Linting
- [ ] Test Suite

**Docker** (2 tests, optional)
- [ ] Docker Build
- [ ] Docker Run

**Performance** (2 tests)
- [ ] Response Time
- [ ] Memory Usage

**Security** (2 tests)
- [ ] Environment Security
- [ ] CORS Configuration

**Documentation** (2 tests)
- [ ] README Accuracy
- [ ] API Documentation

## Troubleshooting Guide

### Server Won't Start

```bash
# Check port availability
lsof -i :3000

# Check environment
cat .env | grep JWT_SECRET

# Check logs
tail -f logs/app.log
```

### Tests Failing

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build

# Run specific test
npm test -- tests/auth/jwt.test.ts
```

### Database Issues

```bash
# Check SQLite file
ls -la data/workstation.db

# Reset database (WARNING: deletes data)
rm -f data/workstation.db
npm run dev  # Will recreate schema
```

### Docker Issues

```bash
# Check Docker daemon
docker info

# View container logs
docker logs workstation-test

# Inspect container
docker exec -it workstation-test sh
```

## Next Steps

✅ **All tests passing?**

→ Proceed to [Module 2: Architecture Deep Dive](../module-2-architecture/README.md)

⚠️ **Some tests failing?**

→ Review [Troubleshooting](#troubleshooting-guide) section

→ Check [GitHub Issues](https://github.com/creditXcredit/workstation/issues)

→ Review [setup-steps.md](./setup-steps.md) for proper installation

## Business Value Delivered

**For Agencies:**
- ✅ Validated installation reduces client onboarding errors
- ✅ Automated tests enable faster deployments
- ✅ Quality assurance built into setup process

**For Founders:**
- ✅ Production-ready baseline with security validation
- ✅ Performance benchmarks established
- ✅ Documentation accuracy verified

**For Platform Engineers:**
- ✅ Infrastructure health checks automated
- ✅ Security best practices enforced
- ✅ Container deployment validated

**For Senior Developers:**
- ✅ Complete test coverage for onboarding
- ✅ Clear acceptance criteria
- ✅ Performance baselines documented
