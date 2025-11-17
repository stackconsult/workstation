# MCP Testing & Validation Guide

## Overview

This document provides comprehensive testing procedures for all 20 MCP containers in the workstation system.

## Testing Strategy

### Test Levels

1. **Unit Tests** - Individual tool functions
2. **Integration Tests** - MCP-to-MCP communication
3. **Health Check Tests** - Endpoint availability
4. **Docker Tests** - Container build and run
5. **End-to-End Tests** - Full workflow execution

## Quick Start

### Build All MCPs

```bash
./scripts/build-and-test-mcps.sh
```

### Build Single MCP

```bash
cd mcp-containers/05-workflow-mcp
npm install
npm run build
```

### Test Health Endpoint

```bash
cd mcp-containers/05-workflow-mcp
node dist/index.js &
SERVER_PID=$!
sleep 2
curl http://localhost:3000/health | jq
kill $SERVER_PID
```

## MCP Status Matrix

| MCP | Number | Name | Build Status | Health Check | Docker Build |
|-----|--------|------|--------------|--------------|--------------|
| Selector Builder | 01 | selector-mcp | ✅ | ✅ | ⏳ |
| Navigation | 02 | navigation-mcp | 🔨 | ⏳ | ⏳ |
| Data Extraction | 03 | extraction-mcp | 🔨 | ⏳ | ⏳ |
| Error Handling | 04 | error-handling-mcp | 🔨 | ⏳ | ⏳ |
| Workflow | 05 | workflow-mcp | ✅ | ⏳ | ⏳ |
| Project Builder | 06 | project-builder-mcp | ✅ | ⏳ | ⏳ |
| Code Quality | 07 | code-quality-mcp | ✅ | ⏳ | ⏳ |
| Performance | 08 | performance-mcp | ✅ | ⏳ | ⏳ |
| Error Tracker | 09 | error-tracker-mcp | ✅ | ⏳ | ⏳ |
| Security Scanner | 10 | security-mcp | ✅ | ⏳ | ⏳ |
| Accessibility | 11 | accessibility-mcp | ✅ | ⏳ | ⏳ |
| Integration Hub | 12 | integration-mcp | ✅ | ⏳ | ⏳ |
| Docs Auditor | 13 | docs-auditor-mcp | ✅ | ⏳ | ⏳ |
| Advanced Automation | 14 | advanced-automation-mcp | ✅ | ⏳ | ⏳ |
| API Integrator | 15 | api-integration-mcp | ✅ | ⏳ | ⏳ |
| Data Processor | 16 | data-processing-mcp | ✅ | ⏳ | ⏳ |
| Learning Platform | 17 | learning-platform-mcp | ✅ | ⏳ | ⏳ |
| Community Hub | 18 | community-hub-mcp | ✅ | ⏳ | ⏳ |
| Deployment Manager | 19 | deployment-mcp | ✅ | ⏳ | ⏳ |
| Master Orchestrator | 20 | orchestrator-mcp | ✅ | ⏳ | ⏳ |

Legend:
- ✅ Complete
- 🔨 Needs Rebuild
- ⏳ Pending
- ❌ Failed

## Individual MCP Tests

### MCP-05: Workflow Orchestrator

**Build Test:**
```bash
cd mcp-containers/05-workflow-mcp
npm install
npm run build
ls -la dist/
```

**Health Check:**
```bash
node dist/index.js &
SERVER_PID=$!
sleep 2
curl http://localhost:3000/health
kill $SERVER_PID
```

**Tool Tests:**
```bash
# Test create_workflow tool
echo '{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "create_workflow",
    "arguments": {
      "name": "test-workflow",
      "steps": [{"action": "test"}]
    }
  },
  "id": 1
}' | node dist/index.js
```

### MCP-06: Project Builder

**Build Test:**
```bash
cd mcp-containers/06-project-builder-mcp
npm install
npm run build
```

**Tool Tests:**
- `scaffold_project`
- `generate_component`
- `add_dependency`

### MCP-07: Code Quality

**Build Test:**
```bash
cd mcp-containers/07-code-quality-mcp
npm install
npm run build
```

**Tool Tests:**
- `lint_code`
- `check_types`
- `analyze_complexity`

### MCP-08: Performance Monitor

**Build Test:**
```bash
cd mcp-containers/08-performance-mcp
npm install
npx playwright install chromium  # Required for browser
npm run build
```

**Tool Tests:**
- `measure_load_time`
- `run_lighthouse`
- `monitor_memory`

### MCP-09: Error Tracker

**Build Test:**
```bash
cd mcp-containers/09-error-tracker-mcp
npm install
npm run build
```

**Tool Tests:**
- `log_error`
- `query_errors`
- `get_error_stats`

### MCP-10: Security Scanner

**Build Test:**
```bash
cd mcp-containers/10-security-mcp
npm install
npm run build
```

**Tool Tests:**
- `scan_dependencies`
- `check_secrets`
- `analyze_headers`

### MCP-11: Accessibility Checker

**Build Test:**
```bash
cd mcp-containers/11-accessibility-mcp
npm install
npx playwright install chromium
npm run build
```

**Tool Tests:**
- `check_wcag`
- `analyze_contrast`
- `check_aria`

### MCP-12: Integration Hub

**Build Test:**
```bash
cd mcp-containers/12-integration-mcp
npm install
npm run build
```

**Tool Tests:**
- `call_api`
- `send_webhook`

### MCP-13: Docs Auditor

**Build Test:**
```bash
cd mcp-containers/13-docs-auditor-mcp
npm install
npm run build
```

**Tool Tests:**
- `check_completeness`
- `validate_links`

### MCP-14: Advanced Automation

**Build Test:**
```bash
cd mcp-containers/14-advanced-automation-mcp
npm install
npx playwright install chromium
npm run build
```

**Tool Tests:**
- `create_bot`
- `schedule_task`

### MCP-15: API Integrator

**Build Test:**
```bash
cd mcp-containers/15-api-integration-mcp
npm install
npm run build
```

**Tool Tests:**
- `test_endpoint`
- `generate_client`

### MCP-16: Data Processor

**Build Test:**
```bash
cd mcp-containers/16-data-processing-mcp
npm install
npm run build
```

**Tool Tests:**
- `transform_data`
- `export_csv`

### MCP-17: Learning Platform

**Build Test:**
```bash
cd mcp-containers/17-learning-platform-mcp
npm install
npm run build
```

**Tool Tests:**
- `train_model`
- `predict`

### MCP-18: Community Hub

**Build Test:**
```bash
cd mcp-containers/18-community-hub-mcp
npm install
npm run build
```

**Tool Tests:**
- `share_workflow`
- `search_workflows`

### MCP-19: Deployment Manager

**Build Test:**
```bash
cd mcp-containers/19-deployment-mcp
npm install
npm run build
```

**Tool Tests:**
- `deploy_container`
- `rollback_deployment`

### MCP-20: Master Orchestrator

**Build Test:**
```bash
cd mcp-containers/20-orchestrator-mcp
npm install
npm run build
```

**Tool Tests:**
- `route_request`
- `health_check_all`
- `coordinate_workflow`

## Docker Tests

### Build Single Container

```bash
cd mcp-containers/05-workflow-mcp
docker build -t workstation-mcp-05:test .
```

### Run Single Container

```bash
docker run -p 3005:3000 workstation-mcp-05:test
```

### Test Health from Docker

```bash
docker run -d --name test-mcp-05 -p 3005:3000 workstation-mcp-05:test
sleep 2
curl http://localhost:3005/health
docker stop test-mcp-05
docker rm test-mcp-05
```

### Build All Containers

```bash
docker-compose -f docker-compose.mcp.yml build
```

### Start All Containers

```bash
docker-compose -f docker-compose.mcp.yml up -d
```

### Check All Health Endpoints

```bash
for i in {1..20}; do
  port=$((3000 + i))
  echo "Testing MCP-$(printf '%02d' $i) on port $port"
  curl -s http://localhost:$port/health | jq -r '.agent + " - " + .status'
done
```

## Integration Tests

### Test MCP-to-MCP Communication

```bash
# Start MCP-20 (Orchestrator)
cd mcp-containers/20-orchestrator-mcp
node dist/index.js &
ORCH_PID=$!

# Start MCP-05 (Workflow)
cd ../05-workflow-mcp
node dist/index.js &
WORK_PID=$!

# Test orchestrator routing to workflow
sleep 2
curl -X POST http://localhost:3020/route \
  -H "Content-Type: application/json" \
  -d '{
    "targetMcp": "workflow",
    "tool": "create_workflow",
    "args": {"name": "test"}
  }'

# Cleanup
kill $ORCH_PID $WORK_PID
```

## Performance Tests

### Load Test Single MCP

```bash
# Install apache-bench
sudo apt-get install apache2-utils

# Run 1000 requests with 10 concurrent
ab -n 1000 -c 10 http://localhost:3000/health
```

### Memory Leak Test

```bash
# Start MCP
node dist/index.js &
SERVER_PID=$!

# Monitor memory
while true; do
  ps -o rss,vsz,cmd $SERVER_PID
  sleep 5
done
```

## Validation Checklist

For each MCP, verify:

- [ ] package.json exists and valid
- [ ] tsconfig.json exists and valid
- [ ] src/index.ts compiles without errors
- [ ] npm install succeeds
- [ ] npm run build succeeds
- [ ] dist/index.js is generated
- [ ] Health endpoint responds on port 3000
- [ ] Health check returns "healthy" status
- [ ] Dockerfile builds successfully
- [ ] Docker container starts and runs
- [ ] All tools are registered
- [ ] Tool execution returns valid responses
- [ ] Error handling works properly
- [ ] Graceful shutdown works
- [ ] README.md is comprehensive
- [ ] No TypeScript errors
- [ ] No ESLint warnings

## Common Issues

### Issue: npm install fails

**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: TypeScript compilation errors

**Solution:**
```bash
# Check tsconfig.json
# Ensure all dependencies are installed
npm install @modelcontextprotocol/sdk --save
```

### Issue: Playwright not found

**Solution:**
```bash
npx playwright install chromium
```

### Issue: Health endpoint not responding

**Solution:**
- Check if port 3000 is already in use
- Verify Express server is starting
- Check logs for errors

### Issue: Docker build fails

**Solution:**
- Ensure npm run build works locally first
- Check Dockerfile syntax
- Verify base image is available

## Test Coverage Goals

- Unit Tests: 80%+ code coverage
- Integration Tests: All MCP-to-MCP paths
- Health Checks: 100% uptime requirement
- Docker: All containers build and run
- End-to-End: Full workflow execution

## Continuous Testing

### Pre-commit Hooks

```bash
# .git/hooks/pre-commit
#!/bin/bash
./scripts/build-and-test-mcps.sh
```

### CI/CD Pipeline

GitHub Actions workflow for automated testing:
- Build all MCPs on push
- Run health checks
- Build Docker containers
- Run integration tests
- Deploy on success

## Monitoring in Production

### Health Check Monitoring

```bash
# Cron job to check health every 5 minutes
*/5 * * * * /path/to/check-mcp-health.sh
```

### Alerting

- Send alert if health check fails
- Monitor memory usage
- Track error rates
- Log performance metrics

## Documentation

Each MCP must have:
- Comprehensive README.md
- Tool documentation
- Example usage
- Troubleshooting guide

## Next Steps

1. Run full build test: `./scripts/build-and-test-mcps.sh`
2. Fix any build failures
3. Test health endpoints
4. Build Docker containers
5. Run integration tests
6. Deploy to staging environment
7. Monitor in production
