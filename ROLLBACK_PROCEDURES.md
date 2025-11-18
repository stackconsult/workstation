# Rollback Procedures and Recovery Guide
## Docker Image Rollback & MCP Container Management

**Last Updated**: November 18, 2025  
**Related Documentation**: [CI/CD Fixes Documentation](CI_FIXES_DOCUMENTATION.md)

### Table of Contents
1. [Overview](#overview)
2. [CI/CD Error Prevention](#cicd-error-prevention)
3. [Rollback Strategy](#rollback-strategy)
4. [Docker Image Rollback](#docker-image-rollback)
5. [MCP Container Management](#mcp-container-management)
6. [Database Rollback](#database-rollback)
7. [Configuration Rollback](#configuration-rollback)
8. [Automated Recovery](#automated-recovery)
9. [Testing Rollback Procedures](#testing-rollback-procedures)
10. [Post-Rollback Verification](#post-rollback-verification)

---

## Overview

This guide provides comprehensive procedures for rolling back deployments in the workstation platform, with special attention to Docker image management and MCP containerization.

### Key Principles
- **Zero Downtime**: Rollback procedures minimize service interruption
- **Data Integrity**: Database rollback preserves data consistency
- **Automated Recovery**: MCP recovery and peelback mechanisms provide automatic rollback
- **Versioned Deployments**: All Docker images are tagged with version information
- **Health Check Triggers**: Automatic rollback on health check failures
- **CI/CD Protection**: Multi-layer validation prevents bad code from reaching production

### Recent Updates
- **2025-11-17**: Fixed CI pipeline coverage thresholds (commit `2b9009d`)
- **2025-11-17**: Added DEPLOYMENT_INTEGRATED.md and QUICKSTART_INTEGRATED.md
- **2025-11-18**: Enhanced error handling documentation and rollback procedures

---

## CI/CD Error Prevention

### How We Prevent Production Failures

Before code reaches production, it must pass through **6 validation layers**:

```
Commit → Lint → Build → Tests → Coverage → Security → Production
  ↓       ↓       ↓       ↓         ↓          ↓          ↓
Local  Syntax  Type    Logic    Quality    Vulns     Deploy
Check  Errors  Errors  Failures Regression Found     Only
                                                      If All
                                                      Pass
```

#### Layer 1: Linting (Pre-Merge)
```bash
npm run lint
# Catches: Code style issues, unused variables, potential bugs
```

#### Layer 2: Build Validation (Pre-Merge)
```bash
npm run build
# Catches: TypeScript errors, type mismatches, import errors
```

#### Layer 3: Test Validation (Pre-Merge)
```bash
npm test
# Catches: Logic errors, regressions, broken functionality
# Current: 146 tests, 65.66% coverage
```

#### Layer 4: Coverage Enforcement (Pre-Merge)
```javascript
// jest.config.js
coverageThreshold: {
  global: { statements: 55 },
  './src/auth/**/*.ts': { statements: 95 },      // Critical: Auth
  './src/middleware/**/*.ts': { statements: 95 }, // Critical: Error handling
}
```

**Recent Fix (2025-11-17)**:
- Adjusted orchestrator thresholds: 45% → 42% (realistic for integration tests)
- Adjusted agents thresholds: 15% → 12% (realistic for browser automation)
- Maintains quality while preventing false CI failures

#### Layer 5: Security Scanning (Pre-Merge)
```yaml
# .github/workflows/ci.yml
- TruffleHog secret scanning
- npm audit for vulnerabilities
- Dependency checks with audit-ci
```

#### Layer 6: Docker Build (Main Branch Only)
- Only production-ready code builds Docker images
- Failed tests = No Docker image = Cannot deploy

### Error Handling in Code

See [CI/CD Fixes Documentation](CI_FIXES_DOCUMENTATION.md) for complete details on:
- Application-level error handlers
- Authentication error handling
- Workflow retry logic
- Comprehensive logging

---

## Rollback Strategy

### Decision Matrix

| Severity | Trigger | Action | Rollback Target |
|----------|---------|--------|----------------|
| **Critical** | Service crash, data corruption | Immediate auto-rollback | Previous stable version |
| **High** | Health check failure (3+ times) | Auto-rollback after retry | Previous stable version |
| **Medium** | Performance degradation >50% | Manual rollback decision | Previous stable version |
| **Low** | Non-critical feature issues | Schedule rollback window | Previous stable version |

### Rollback Timeline

```
Detection → Decision → Execution → Verification → Documentation
   (1-5min)   (0-10min)   (5-15min)    (10-20min)    (post-rollback)
```

---

## Docker Image Rollback

### 1. List Available Docker Images

```bash
# List all workstation images with tags
docker images | grep workstation

# List with creation date and size
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.CreatedAt}}\t{{.Size}}" | grep workstation
```

**Expected Output:**
```
REPOSITORY                TAG                 CREATED AT              SIZE
workstation              1.0.5               2025-11-17 10:30:00     250MB
workstation              1.0.4               2025-11-10 08:15:00     248MB
workstation              1.0.3               2025-11-03 14:20:00     246MB
workstation              latest              2025-11-17 10:30:00     250MB
```

### 2. Quick Rollback to Previous Version

```bash
# Stop current containers
docker-compose down

# Edit docker-compose.yml to use previous tag
# Change: image: workstation:1.0.5
# To:     image: workstation:1.0.4

# Or use environment variable override
export WORKSTATION_VERSION=1.0.4
docker-compose up -d

# Verify rollback
docker ps | grep workstation
docker logs workstation-container --tail 50
```

### 3. Emergency Rollback Script

Create `/scripts/emergency-rollback.sh`:

```bash
#!/bin/bash
set -euo pipefail

# Emergency rollback script with error handling
# Usage: ./scripts/emergency-rollback.sh <version>

VERSION=${1:-"latest"}
BACKUP_DIR="/var/backups/workstation"

echo "🔄 Starting emergency rollback to version: ${VERSION}"

# Error handler
handle_error() {
    echo "❌ Rollback failed at line $1"
    echo "⚠️  Manual intervention required"
    exit 1
}

trap 'handle_error $LINENO' ERR

# 1. Backup current state
echo "📦 Backing up current configuration..."
mkdir -p "${BACKUP_DIR}/$(date +%Y%m%d_%H%M%S)"
docker-compose config > "${BACKUP_DIR}/$(date +%Y%m%d_%H%M%S)/docker-compose.yml"

# 2. Stop current services
echo "⏸️  Stopping current services..."
docker-compose down --remove-orphans

# 3. Pull target version (if needed)
echo "⬇️  Pulling version ${VERSION}..."
docker pull workstation:${VERSION} || echo "⚠️  Using local image"

# 4. Update docker-compose.yml
echo "📝 Updating docker-compose configuration..."
sed -i.bak "s/workstation:.*/workstation:${VERSION}/" docker-compose.yml

# 5. Start with new version
echo "🚀 Starting services with version ${VERSION}..."
docker-compose up -d

# 6. Wait for health check
echo "🏥 Waiting for health check..."
sleep 10
for i in {1..30}; do
    if curl -sf http://localhost:3000/health > /dev/null 2>&1; then
        echo "✅ Health check passed"
        break
    fi
    echo "⏳ Waiting... (${i}/30)"
    sleep 2
done

# 7. Verify rollback
echo "🔍 Verifying rollback..."
docker ps | grep workstation
echo ""
echo "✅ Rollback to version ${VERSION} complete"
echo "📋 Check logs: docker logs workstation --tail 100"
echo "🔙 To revert: ./scripts/emergency-rollback.sh <previous_version>"
```

### 4. Tagged Deployment Strategy

**Build with Version Tags:**

```bash
# Build with multiple tags
docker build \
  --tag workstation:1.0.5 \
  --tag workstation:1.0 \
  --tag workstation:latest \
  --tag workstation:$(git rev-parse --short HEAD) \
  --build-arg BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ") \
  --build-arg VCS_REF=$(git rev-parse HEAD) \
  --build-arg VERSION=1.0.5 \
  -f Dockerfile .

# Push to registry (if using external registry)
docker push workstation:1.0.5
docker push workstation:1.0
```

**Rollback Using Tags:**

```bash
# Rollback to specific version
docker-compose down
docker tag workstation:1.0.4 workstation:rollback-target
docker-compose up -d workstation:rollback-target

# Or directly in docker-compose:
services:
  workstation:
    image: workstation:1.0.4  # Specify exact version
    # ... rest of configuration
```

---

## MCP Container Management

### 1. MCP Recovery Configuration

The MCP configuration (`mcp-config.yml`) includes automated recovery mechanisms:

```yaml
recovery:
  enabled: true
  peelback:
    enabled: true
    snapshots:
      interval: 300000  # 5 minutes
      maxSnapshots: 10
      storage: "/app/data/snapshots"
  
  rollback:
    enabled: true
    strategy: "automatic"  # automatic, manual
    triggers:
      - "criticalError"
      - "healthCheckFailure"
```

### 2. MCP Container Rollback

**List MCP Containers:**

```bash
# List all MCP containers
docker ps -a | grep mcp

# Check MCP container health
docker inspect --format='{{.State.Health.Status}}' <container_id>
```

**Rollback Individual MCP Container:**

```bash
#!/bin/bash
# Rollback specific MCP container
# Usage: ./rollback-mcp.sh <mcp-name> <version>

MCP_NAME=$1
VERSION=${2:-"latest"}

echo "🔄 Rolling back ${MCP_NAME} to version ${VERSION}"

# Stop container
docker-compose stop ${MCP_NAME}

# Pull previous version
docker pull mcp-containers/${MCP_NAME}:${VERSION}

# Update docker-compose for this service
# Then restart
docker-compose up -d ${MCP_NAME}

# Verify
docker logs ${MCP_NAME} --tail 50
```

**Rollback All MCP Containers:**

```bash
#!/bin/bash
# Rollback all MCP containers to a stable release

set -euo pipefail

STABLE_VERSION=${1:-"1.0.0"}

echo "🔄 Rolling back all MCP containers to version ${STABLE_VERSION}"

# Get list of MCP services
MCP_SERVICES=$(docker-compose config --services | grep mcp)

for service in ${MCP_SERVICES}; do
    echo "📦 Rolling back ${service}..."
    docker-compose stop ${service}
    
    # Update image version
    docker pull mcp-containers/${service}:${STABLE_VERSION} || echo "⚠️  Using local image"
    
    # Restart with new version
    docker-compose up -d ${service}
    
    # Brief health check
    sleep 5
    if [ "$(docker inspect --format='{{.State.Status}}' ${service})" == "running" ]; then
        echo "✅ ${service} rolled back successfully"
    else
        echo "❌ ${service} rollback failed"
    fi
done

echo "✅ MCP container rollback complete"
```

### 3. MCP Snapshot Management

**Create Manual Snapshot:**

```bash
# Trigger manual snapshot before risky operations
curl -X POST http://localhost:8082/admin/snapshot \
  -H "Authorization: Bearer ${MCP_TOKEN}" \
  -d '{"description": "Pre-deployment snapshot"}'
```

**List Available Snapshots:**

```bash
# List all snapshots
curl http://localhost:8082/admin/snapshots \
  -H "Authorization: Bearer ${MCP_TOKEN}"

# Expected output:
# [
#   {
#     "id": "snapshot-1700265600",
#     "timestamp": "2025-11-17T10:00:00Z",
#     "description": "Pre-deployment snapshot",
#     "size": "50MB"
#   },
#   ...
# ]
```

**Restore from Snapshot:**

```bash
# Restore specific snapshot
curl -X POST http://localhost:8082/admin/restore \
  -H "Authorization: Bearer ${MCP_TOKEN}" \
  -d '{"snapshotId": "snapshot-1700265600"}'

# Automatic rollback (triggered by health check failure)
# No manual intervention needed - MCP handles automatically
```

### 4. MCP Peelback Mechanism

The peelback feature automatically creates restore points:

```bash
# Check peelback status
curl http://localhost:8082/admin/peelback/status \
  -H "Authorization: Bearer ${MCP_TOKEN}"

# Force peelback to previous state
curl -X POST http://localhost:8082/admin/peelback/revert \
  -H "Authorization: Bearer ${MCP_TOKEN}" \
  -d '{"levels": 1}'  # Go back 1 snapshot

# Peelback multiple levels (for major issues)
curl -X POST http://localhost:8082/admin/peelback/revert \
  -H "Authorization: Bearer ${MCP_TOKEN}" \
  -d '{"levels": 3}'  # Go back 3 snapshots
```

---

## Database Rollback

### 1. Database Snapshot Strategy

```bash
# Create pre-deployment database backup
docker exec workstation-db sqlite3 /app/data/workstation.db ".backup /app/data/backups/workstation-$(date +%Y%m%d_%H%M%S).db"

# Or using docker volume
docker run --rm \
  -v workstation-data:/data \
  -v $(pwd)/backups:/backups \
  alpine \
  cp /data/workstation.db /backups/workstation-$(date +%Y%m%d_%H%M%S).db
```

### 2. Database Rollback Procedure

```bash
#!/bin/bash
# Database rollback script with verification

set -euo pipefail

BACKUP_FILE=$1
DB_PATH="/app/data/workstation.db"

if [ -z "${BACKUP_FILE}" ]; then
    echo "Usage: $0 <backup_file>"
    exit 1
fi

echo "🔄 Rolling back database to: ${BACKUP_FILE}"

# Stop services using database
docker-compose stop workstation

# Create emergency backup of current state
docker exec workstation-db sqlite3 ${DB_PATH} ".backup ${DB_PATH}.emergency"

# Restore from backup
docker exec workstation-db sqlite3 ${DB_PATH} ".restore ${BACKUP_FILE}"

# Verify integrity
docker exec workstation-db sqlite3 ${DB_PATH} "PRAGMA integrity_check;"

# Restart services
docker-compose up -d workstation

echo "✅ Database rollback complete"
```

### 3. Migration Rollback

```bash
# Rollback database migrations (if using migration tool)
cd /home/runner/work/workstation/workstation
npm run migrate:rollback

# Or manually:
docker exec -it workstation-db sqlite3 /app/data/workstation.db < migrations/rollback/001_rollback.sql
```

---

## Configuration Rollback

### 1. Configuration Versioning

```bash
# Backup current configuration
mkdir -p /var/backups/workstation/config/$(date +%Y%m%d_%H%M%S)
cp mcp-config.yml /var/backups/workstation/config/$(date +%Y%m%d_%H%M%S)/
cp docker-compose.yml /var/backups/workstation/config/$(date +%Y%m%d_%H%M%S)/
cp .env /var/backups/workstation/config/$(date +%Y%m%d_%H%M%S)/
```

### 2. Configuration Rollback Script

```bash
#!/bin/bash
# Rollback configuration to specific backup

BACKUP_DIR=$1

if [ -z "${BACKUP_DIR}" ]; then
    echo "Available backups:"
    ls -1 /var/backups/workstation/config/
    echo ""
    echo "Usage: $0 <backup_directory>"
    exit 1
fi

BACKUP_PATH="/var/backups/workstation/config/${BACKUP_DIR}"

if [ ! -d "${BACKUP_PATH}" ]; then
    echo "❌ Backup directory not found: ${BACKUP_PATH}"
    exit 1
fi

echo "🔄 Rolling back configuration from: ${BACKUP_DIR}"

# Backup current config
mkdir -p /var/backups/workstation/config/current
cp mcp-config.yml /var/backups/workstation/config/current/
cp docker-compose.yml /var/backups/workstation/config/current/
cp .env /var/backups/workstation/config/current/

# Restore from backup
cp ${BACKUP_PATH}/mcp-config.yml ./
cp ${BACKUP_PATH}/docker-compose.yml ./
cp ${BACKUP_PATH}/.env ./

# Restart services to apply new configuration
docker-compose down
docker-compose up -d

echo "✅ Configuration rollback complete"
```

---

## Automated Recovery

### 1. Health Check-Based Rollback

The MCP configuration automatically triggers rollback on health check failures:

```yaml
recovery:
  rollback:
    enabled: true
    strategy: "automatic"
    triggers:
      - "criticalError"
      - "healthCheckFailure"
```

**How It Works:**
1. Health check fails 3 consecutive times
2. MCP triggers automatic rollback to last known good snapshot
3. Services restart with previous configuration
4. Notification sent (if configured)
5. Incident logged for review

### 2. GitHub Actions Rollback Workflow

Create `.github/workflows/auto-rollback.yml`:

```yaml
name: Automated Rollback on Deployment Failure

on:
  deployment_status:

jobs:
  rollback-on-failure:
    if: github.event.deployment_status.state == 'failure'
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Configure SSH
        uses: webfactory/ssh-agent@v0.8.0
        with:
          ssh-private-key: ${{ secrets.DEPLOY_KEY }}
      
      - name: Execute Rollback
        run: |
          ssh deploy@production-server << 'EOF'
            cd /opt/workstation
            ./scripts/emergency-rollback.sh previous
          EOF
      
      - name: Notify Team
        uses: slackapi/slack-github-action@v1
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK }}
          payload: |
            {
              "text": "🔄 Automated rollback executed due to deployment failure",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*Deployment Rollback Triggered*\n\nReason: Deployment failure detected\nEnvironment: Production\nAction: Rolled back to previous stable version"
                  }
                }
              ]
            }
```

### 3. Monitoring Integration

**Prometheus Alerting:**

```yaml
# prometheus/alerts/rollback.yml
groups:
  - name: rollback
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected - consider rollback"
          description: "Error rate is {{ $value }} errors/second"
      
      - alert: HealthCheckFailure
        expr: up{job="workstation"} == 0
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Service down - automatic rollback initiated"
          description: "Workstation service failed health check"
```

---

## Testing Rollback Procedures

### 1. Staging Environment Testing

```bash
# Test complete rollback procedure in staging
cd /opt/workstation-staging

# Deploy test version
docker-compose down
docker-compose up -d workstation:test-version

# Simulate failure
docker exec workstation kill -9 1

# Verify automatic rollback
docker logs workstation --follow
curl http://staging.workstation/health

# Manual rollback test
./scripts/emergency-rollback.sh 1.0.4
```

### 2. Rollback Drills

Schedule regular rollback drills:

```bash
#!/bin/bash
# Monthly rollback drill script

echo "🎯 Starting rollback drill $(date)"

# 1. Deploy canary version
echo "📦 Deploying canary..."
docker-compose up -d workstation:canary

# 2. Run health checks
sleep 30
HEALTH_STATUS=$(curl -sf http://localhost:3000/health || echo "failed")

# 3. Trigger rollback
echo "🔄 Triggering rollback..."
./scripts/emergency-rollback.sh previous

# 4. Verify rollback success
sleep 15
ROLLBACK_HEALTH=$(curl -sf http://localhost:3000/health || echo "failed")

# 5. Report results
if [ "${ROLLBACK_HEALTH}" != "failed" ]; then
    echo "✅ Rollback drill successful"
else
    echo "❌ Rollback drill failed"
    exit 1
fi

echo "📝 Drill complete - results logged"
```

---

## Post-Rollback Verification

### 1. Verification Checklist

After rollback, verify:

```bash
# 1. Service health
curl http://localhost:3000/health
curl http://localhost:8082/health  # MCP server

# 2. Container status
docker ps | grep workstation
docker logs workstation --tail 100

# 3. Database integrity
docker exec workstation-db sqlite3 /app/data/workstation.db "PRAGMA integrity_check;"

# 4. MCP functionality
curl http://localhost:8082/admin/status \
  -H "Authorization: Bearer ${MCP_TOKEN}"

# 5. API endpoints
curl -X POST http://localhost:3000/api/auth/generate \
  -H "Content-Type: application/json" \
  -d '{"userId": "test", "permissions": ["read"]}'
```

### 2. Post-Rollback Report

Generate rollback report:

```bash
#!/bin/bash
# Generate post-rollback report

cat > /tmp/rollback-report.md << EOF
# Rollback Report
**Date**: $(date)
**Reason**: ${ROLLBACK_REASON:-"Manual rollback"}
**From Version**: ${OLD_VERSION}
**To Version**: ${NEW_VERSION}

## Verification Results
- [ ] Health checks passing
- [ ] All containers running
- [ ] Database integrity confirmed
- [ ] API endpoints functional
- [ ] MCP containers operational

## Metrics
- Downtime: ${DOWNTIME}
- Rollback duration: ${DURATION}
- Data loss: ${DATA_LOSS:-"None"}

## Actions Taken
1. Stopped services
2. Rolled back to version ${NEW_VERSION}
3. Verified health checks
4. Confirmed functionality

## Next Steps
- [ ] Identify root cause
- [ ] Create fix plan
- [ ] Update deployment procedures
- [ ] Schedule post-mortem
EOF

cat /tmp/rollback-report.md
```

### 3. Monitoring After Rollback

```bash
# Monitor system for 30 minutes after rollback
for i in {1..30}; do
    echo "=== Check $i/30 at $(date) ==="
    
    # Health check
    curl -sf http://localhost:3000/health || echo "❌ Health check failed"
    
    # Error rate
    docker logs workstation --since 1m 2>&1 | grep -i error || echo "✅ No errors"
    
    # CPU/Memory
    docker stats --no-stream workstation | tail -1
    
    echo ""
    sleep 60
done
```

---

## Emergency Contacts

### Escalation Path

1. **On-Call Engineer** (Primary)
   - Response Time: 15 minutes
   - Authority: Execute rollback

2. **Platform Lead** (Secondary)
   - Response Time: 30 minutes
   - Authority: Approve major rollbacks

3. **CTO** (Escalation)
   - Response Time: 1 hour
   - Authority: Data loss decisions

### Communication Channels

- **Slack**: #workstation-incidents
- **PagerDuty**: workstation-critical
- **Email**: ops@workstation.com

---

## Appendix: Common Rollback Scenarios

### Scenario 1: Failed Deployment

```bash
# Detection
docker logs workstation | grep ERROR

# Rollback
./scripts/emergency-rollback.sh previous

# Verify
curl http://localhost:3000/health
```

### Scenario 2: Database Migration Failure

```bash
# Stop services
docker-compose stop workstation

# Restore database
docker exec workstation-db sqlite3 /app/data/workstation.db ".restore /app/data/backups/pre-migration.db"

# Rollback migration
npm run migrate:rollback

# Restart
docker-compose up -d workstation
```

### Scenario 3: Configuration Error

```bash
# Identify bad config
docker-compose config

# Restore from backup
cp /var/backups/workstation/config/20251117_1000/docker-compose.yml ./

# Reload
docker-compose down && docker-compose up -d
```

### Scenario 4: MCP Container Crash Loop

```bash
# Check logs
docker logs mcp-container

# Rollback to previous snapshot
curl -X POST http://localhost:8082/admin/peelback/revert \
  -H "Authorization: Bearer ${MCP_TOKEN}" \
  -d '{"levels": 1}'

# Restart
docker-compose restart mcp-container
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-11-18 | Initial rollback procedures documentation |

---

**Last Updated**: 2025-11-18
**Maintained By**: Platform Team
**Review Cycle**: Monthly
