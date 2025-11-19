# Rollback Guide - Quick Reference

This is a quick reference guide for common rollback scenarios. For comprehensive rollback procedures, see [ROLLBACK_PROCEDURES.md](ROLLBACK_PROCEDURES.md).

## Quick Rollback Commands

### Docker Rollback
```bash
# Rollback to previous Docker image
docker-compose down
docker-compose pull
docker tag workstation:latest workstation:backup
docker tag workstation:previous workstation:latest
docker-compose up -d
```

### MCP Container Rollback
```bash
# Use the peelback script for automated rollback
./.docker/peelback.sh

# Or manually rollback specific MCP containers
docker-compose -f mcp-containers/docker-compose.mcp.yml down
docker-compose -f mcp-containers/docker-compose.mcp.yml up -d
```

### Git Rollback
```bash
# Rollback to previous commit
git revert HEAD
git push origin main

# Or rollback to specific commit
git revert <commit-hash>
git push origin main
```

### Database Rollback
```bash
# Backup current database
cp workstation.db workstation.db.backup

# Restore from previous backup
cp workstation.db.previous workstation.db

# Restart services
npm run restart
```

## Emergency Rollback

If services are down, use the emergency rollback:

```bash
# Stop all services
docker-compose down

# Restore from last known good state
git checkout main
git pull origin main

# Rebuild and restart
npm run build
docker-compose up -d
```

## Verification After Rollback

```bash
# Check service health
curl http://localhost:3000/health

# Check logs
docker-compose logs -f

# Run tests
npm test
```

## See Also

- [ROLLBACK_PROCEDURES.md](ROLLBACK_PROCEDURES.md) - Comprehensive rollback procedures
- [DEPLOYMENT_INTEGRATED.md](DEPLOYMENT_INTEGRATED.md) - Deployment documentation
- [QUICKSTART_INTEGRATED.md](QUICKSTART_INTEGRATED.md) - Quick start guide
- [.docker/peelback.sh](.docker/peelback.sh) - Automated peelback script
# Rollback Guide

**Complete Rollback Procedures for Workstation Platform**

This guide provides step-by-step instructions for rolling back deployments, containers, and configurations in the Workstation platform.

---

## Table of Contents

1. [Overview](#overview)
2. [Quick Rollback Reference](#quick-rollback-reference)
3. [Git-Based Rollback](#git-based-rollback)
4. [Docker Image Rollback](#docker-image-rollback)
5. [Database Rollback](#database-rollback)
6. [Container Peelback](#container-peelback)
7. [Configuration Rollback](#configuration-rollback)
8. [Emergency Procedures](#emergency-procedures)
9. [Post-Rollback Verification](#post-rollback-verification)
10. [Prevention Best Practices](#prevention-best-practices)

---

## Overview

### When to Rollback

Rollback when you encounter:
- **Production failures** after deployment
- **Breaking changes** in new releases
- **Performance degradation** in current version
- **Security vulnerabilities** requiring immediate revert
- **Data integrity issues** from recent changes

### Rollback Principles

- ✅ **Test rollback procedures regularly** (monthly)
- ✅ **Document every rollback** for post-mortem
- ✅ **Verify backups** before initiating rollback
- ✅ **Communicate** with team during rollback
- ✅ **Monitor health checks** after rollback

---

## Quick Rollback Reference

### Emergency Quick Commands

```bash
# 1. Git Rollback (revert last commit)
git revert HEAD
git push origin main

# 2. Docker Image Rollback (use previous tag)
docker pull ghcr.io/creditxcredit/workstation:v1.0.0
docker-compose up -d

# 3. Container Peelback (roll back specific container)
./.docker/peelback.sh mcp-16-data v1.0.0

# 4. Database Restore (from backup)
sqlite3 workstation.db < backup_$(date -d 'yesterday' +%Y%m%d).sql
```

---

## Git-Based Rollback

### Scenario 1: Revert Last Commit

**Use when:** Recent commit caused issues but hasn't affected production

```bash
# 1. Check commit history
git log --oneline -5

# 2. Revert the last commit (creates new commit)
git revert HEAD

# 3. Push the revert
git push origin main

# 4. Verify
git log --oneline -2
```

### Scenario 2: Reset to Specific Commit

**Use when:** Need to go back multiple commits (⚠️ Destructive)

```bash
# 1. Find the commit hash to reset to
git log --oneline -10

# 2. Create backup branch first
git branch backup-$(date +%Y%m%d)
git push origin backup-$(date +%Y%m%d)

# 3. Reset to specific commit (local only)
git reset --hard <commit-hash>

# 4. Force push (⚠️ Use with caution)
git push --force origin main

# Alternative: Safe reset (preserve working directory)
git reset --soft <commit-hash>
git reset HEAD .
```

### Scenario 3: Rollback Merged PR

**Use when:** Merged PR caused production issues

```bash
# 1. Find merge commit
git log --oneline --merges -5

# 2. Revert the merge commit
git revert -m 1 <merge-commit-hash>

# 3. Push revert
git push origin main

# 4. Update PR with rollback note
# Document reason in GitHub PR comments
```

### Scenario 4: Rollback to Previous Tag

**Use when:** Need to return to last stable release

```bash
# 1. List available tags
git tag -l

# 2. Checkout tag
git checkout tags/v1.0.0

# 3. Create rollback branch
git checkout -b rollback-to-v1.0.0

# 4. Force update main branch (⚠️ Coordinate with team)
git branch -f main
git checkout main
git push --force origin main
```

---

## Docker Image Rollback

### Scenario 1: Rollback Main Application

**Use when:** Current Docker image has issues

```bash
# 1. Check available image tags
docker images ghcr.io/creditxcredit/workstation

# 2. Stop current container
docker-compose down

# 3. Edit docker-compose.yml to use previous tag
# Change: image: ghcr.io/creditxcredit/workstation:latest
# To:     image: ghcr.io/creditxcredit/workstation:v1.0.0

# 4. Pull specific version
docker pull ghcr.io/creditxcredit/workstation:v1.0.0

# 5. Start with previous version
docker-compose up -d

# 6. Verify health
curl http://localhost:3000/health
```

### Scenario 2: Rollback MCP Container

**Use when:** Specific MCP container has issues

```bash
# 1. Identify problematic container
docker-compose -f docker-compose.mcp.yml ps

# 2. Stop specific container
docker-compose -f docker-compose.mcp.yml stop mcp-16-data

# 3. Use peelback script
./.docker/peelback.sh mcp-16-data v1.0.0 --verify-health

# Alternative: Manual rollback
docker pull ghcr.io/creditxcredit/workstation/mcp-16:v1.0.0
docker-compose -f docker-compose.mcp.yml up -d mcp-16-data

# 4. Verify container health
docker-compose -f docker-compose.mcp.yml logs mcp-16-data
curl http://localhost:3016/health
```

### Scenario 3: Rollback All MCP Containers

**Use when:** System-wide MCP issues

```bash
# 1. Stop all MCP containers
docker-compose -f docker-compose.mcp.yml down

# 2. Edit docker-compose.mcp.yml
# Update all image tags to previous stable version

# 3. Pull all previous images
docker-compose -f docker-compose.mcp.yml pull

# 4. Start all containers
docker-compose -f docker-compose.mcp.yml up -d

# 5. Verify all containers
for i in {1..20}; do
  echo "Checking MCP-$i..."
  curl -f http://localhost:300$i/health || echo "MCP-$i failed"
done

# 6. Check nginx proxy
curl http://localhost/health
```

### Scenario 4: Rollback Nginx Proxy

**Use when:** Proxy configuration issues

```bash
# 1. Stop proxy
docker-compose -f docker-compose.mcp.yml stop nginx-proxy

# 2. Restore previous nginx.conf
cp .docker/nginx.conf.backup .docker/nginx.conf

# 3. Rebuild proxy image
docker build -t mcp-nginx-proxy -f .docker/nginx-proxy.Dockerfile .docker/

# 4. Restart proxy
docker-compose -f docker-compose.mcp.yml up -d nginx-proxy

# 5. Verify routing
curl http://localhost/health
```

---

## Database Rollback

### Scenario 1: Restore SQLite Database

**Use when:** Database corruption or data loss

```bash
# 1. Stop application
npm stop
# or
docker-compose down

# 2. List available backups
ls -lh backups/

# 3. Backup current database (safety)
cp workstation.db workstation.db.before-rollback-$(date +%Y%m%d-%H%M%S)

# 4. Restore from backup
cp backups/workstation.db.20241118 workstation.db

# Alternative: Use sqlite3 to restore
sqlite3 workstation.db < backups/backup_20241118.sql

# 5. Verify database integrity
sqlite3 workstation.db "PRAGMA integrity_check;"

# 6. Start application
npm start
# or
docker-compose up -d

# 7. Verify data
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/v2/workflows
```

### Scenario 2: Rollback Specific Tables

**Use when:** Only certain tables affected

```bash
# 1. Export current state (safety)
sqlite3 workstation.db ".dump workflows" > workflows_backup_$(date +%Y%m%d).sql

# 2. Drop affected tables
sqlite3 workstation.db "DROP TABLE workflows;"

# 3. Restore from backup
sqlite3 workstation.db < backups/workflows_only_20241118.sql

# 4. Verify table
sqlite3 workstation.db "SELECT COUNT(*) FROM workflows;"

# 5. Restart application
npm start
```

### Scenario 3: Rollback Database Schema

**Use when:** Migration caused issues

```bash
# 1. Check migration history
npm run db:migration:list
# or manually:
sqlite3 workstation.db "SELECT * FROM migrations ORDER BY id DESC LIMIT 5;"

# 2. Rollback last migration
npm run db:migration:rollback

# Alternative: Manual rollback
sqlite3 workstation.db < migrations/rollback/down_20241118_v2.sql

# 3. Verify schema
sqlite3 workstation.db ".schema"

# 4. Restart application
npm start
```

### Scenario 4: PostgreSQL Rollback (Production)

**Use when:** Using PostgreSQL in production

```bash
# 1. Connect to database
psql -U workstation -d workstation_prod

# 2. Check backup availability
\l+

# 3. Create safety snapshot
pg_dump workstation_prod > rollback_safety_$(date +%Y%m%d).sql

# 4. Restore from backup
# Option A: Point-in-time recovery
pg_restore -d workstation_prod backup_20241118.dump

# Option B: SQL restore
psql -U workstation -d workstation_prod < backup_20241118.sql

# 5. Verify data
psql -U workstation -d workstation_prod -c "SELECT COUNT(*) FROM workflows;"

# 6. Restart application
docker-compose restart
```

---

## Container Peelback

### Using the Peelback Script

The `.docker/peelback.sh` script automates container rollback with safety checks.

### Scenario 1: Basic Peelback

```bash
# Syntax
./.docker/peelback.sh <container-name> <image-tag> [--verify-health]

# Example: Rollback agent-16
./.docker/peelback.sh mcp-16-data v1.0.0 --verify-health
```

### Scenario 2: Peelback with Logs

```bash
# Enable verbose logging
PEELBACK_VERBOSE=1 ./.docker/peelback.sh mcp-16-data v1.0.0

# Check peelback logs
tail -f /var/log/peelback/peelback_$(date +%Y%m%d).log
```

### Scenario 3: Multi-Container Peelback

```bash
# Create rollback script
cat > rollback_all_mcps.sh << 'EOF'
#!/bin/bash
CONTAINERS=(
  "mcp-01-selector"
  "mcp-02-navigation"
  "mcp-16-data"
  "mcp-20-orchestrator"
)
VERSION="v1.0.0"

for container in "${CONTAINERS[@]}"; do
  echo "Rolling back $container to $VERSION..."
  ./.docker/peelback.sh "$container" "$VERSION" --verify-health
  if [ $? -ne 0 ]; then
    echo "Failed to rollback $container"
    exit 1
  fi
done
echo "All containers rolled back successfully"
EOF

chmod +x rollback_all_mcps.sh
./rollback_all_mcps.sh
```

### Scenario 4: Peelback via Agent-16 API

```bash
# Use Agent-16 API to trigger peelback
curl -X POST -H "Authorization: Bearer $TOKEN" \
  http://localhost:3016/api/containers/peelback \
  -H "Content-Type: application/json" \
  -d '{
    "container": "mcp-01-selector",
    "tag": "v1.0.0",
    "verify_health": true
  }'

# Check peelback status
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3016/api/containers/peelback/status/latest
```

---

## Configuration Rollback

### Scenario 1: Rollback Environment Variables

```bash
# 1. Backup current .env
cp .env .env.backup-$(date +%Y%m%d)

# 2. Restore from backup
cp .env.backup-20241117 .env

# 3. Restart application
npm run dev
# or
docker-compose restart

# 4. Verify configuration
node -e "require('dotenv').config(); console.log(process.env.JWT_SECRET)"
```

### Scenario 2: Rollback nginx Configuration

```bash
# 1. Backup current config
cp .docker/nginx.conf .docker/nginx.conf.backup-$(date +%Y%m%d)

# 2. Restore from backup
cp .docker/nginx.conf.backup-20241117 .docker/nginx.conf

# 3. Validate nginx config
docker run --rm -v $(pwd)/.docker/nginx.conf:/etc/nginx/nginx.conf:ro nginx nginx -t

# 4. Restart nginx
docker-compose -f docker-compose.mcp.yml restart nginx-proxy

# 5. Verify routing
curl http://localhost/health
```

### Scenario 3: Rollback docker-compose Configuration

```bash
# 1. Check git history
git log --oneline docker-compose.mcp.yml

# 2. Show previous version
git show HEAD^:docker-compose.mcp.yml > docker-compose.mcp.yml.previous

# 3. Review changes
diff docker-compose.mcp.yml docker-compose.mcp.yml.previous

# 4. Restore if needed
mv docker-compose.mcp.yml.previous docker-compose.mcp.yml

# 5. Restart containers
docker-compose -f docker-compose.mcp.yml up -d
```

---

## Emergency Procedures

### Critical Production Failure

**When production is completely down:**

```bash
# 1. IMMEDIATE: Switch to last known good version
docker-compose down
docker pull ghcr.io/creditxcredit/workstation:last-known-good
docker-compose up -d

# 2. Notify team
# Post to Slack/Discord: "PRODUCTION ROLLBACK IN PROGRESS"

# 3. Verify recovery
curl http://localhost:3000/health

# 4. Check logs
docker-compose logs -f --tail=100

# 5. Document incident
echo "$(date): Production failure, rolled back to last-known-good" >> incidents.log
```

### Data Corruption Emergency

**When database integrity is compromised:**

```bash
# 1. IMMEDIATE: Stop all services
docker-compose down
npm stop

# 2. Backup corrupted database
cp workstation.db corrupted_$(date +%Y%m%d-%H%M%S).db

# 3. Restore from last backup
cp backups/workstation.db.last-known-good workstation.db

# 4. Verify integrity
sqlite3 workstation.db "PRAGMA integrity_check;"

# 5. Start services
docker-compose up -d

# 6. Verify recovery
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/v2/workflows
```

### Security Breach Response

**When security vulnerability detected:**

```bash
# 1. IMMEDIATE: Take system offline
docker-compose down

# 2. Rotate all secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" > new_jwt_secret.txt
# Update .env with new JWT_SECRET

# 3. Rollback to pre-breach version
git checkout tags/pre-breach-version
docker-compose build
docker-compose up -d

# 4. Invalidate all existing tokens
# (Requires manual user re-authentication)

# 5. Security audit
npm audit
npm audit fix

# 6. Document breach
echo "$(date): Security breach detected, system rolled back" >> security_incidents.log
```

---

## Post-Rollback Verification

### Verification Checklist

After any rollback, verify:

- [ ] **Application Health**
  ```bash
  curl http://localhost:3000/health
  # Should return: {"status":"healthy"}
  ```

- [ ] **All Services Running**
  ```bash
  docker-compose ps
  # All containers should show "Up"
  ```

- [ ] **API Endpoints Working**
  ```bash
  curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/v2/workflows
  # Should return workflows list
  ```

- [ ] **Database Accessible**
  ```bash
  sqlite3 workstation.db "SELECT COUNT(*) FROM workflows;"
  # Should return count without errors
  ```

- [ ] **MCP Containers Healthy**
  ```bash
  for i in {1..20}; do curl -f http://localhost:300$i/health; done
  # All should return healthy status
  ```

- [ ] **Nginx Proxy Routing**
  ```bash
  curl http://localhost/health
  # Should return proxy health status
  ```

- [ ] **Logs Clean**
  ```bash
  docker-compose logs --tail=50
  # Check for errors
  ```

### Performance Verification

```bash
# 1. Response time check
time curl http://localhost:3000/health
# Should be < 100ms

# 2. Load test (optional)
# Use tools like Apache Bench
ab -n 100 -c 10 http://localhost:3000/health

# 3. Memory usage
docker stats --no-stream

# 4. Disk space
df -h
```

---

## Prevention Best Practices

### 1. Regular Backups

```bash
# Automated daily backup script
cat > backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="backups"
DATE=$(date +%Y%m%d)

# Backup database
cp workstation.db "$BACKUP_DIR/workstation.db.$DATE"

# Backup configs
tar -czf "$BACKUP_DIR/config_$DATE.tar.gz" .env .docker/nginx.conf docker-compose.yml

# Keep only last 7 days
find "$BACKUP_DIR" -type f -mtime +7 -delete
EOF

chmod +x backup.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /home/runner/work/workstation/workstation/backup.sh") | crontab -
```

### 2. Version Tagging

```bash
# Always tag releases
git tag -a v1.0.1 -m "Release 1.0.1"
git push origin v1.0.1

# Tag Docker images
docker tag workstation:latest workstation:v1.0.1
docker push ghcr.io/creditxcredit/workstation:v1.0.1
```

### 3. Testing Before Deploy

```bash
# Full validation before production
npm run validate
npm test
npm run lint
npm run build

# Test in staging environment first
docker-compose -f docker-compose.staging.yml up -d
# Run smoke tests
./test.sh
```

### 4. Document Changes

```bash
# Update CHANGELOG.md before every release
# Include:
# - What changed
# - Breaking changes
# - Rollback instructions (if special)
```

### 5. Monitor Health

```bash
# Set up health monitoring
cat > monitor.sh << 'EOF'
#!/bin/bash
HEALTH_URL="http://localhost:3000/health"
if ! curl -f -s "$HEALTH_URL" > /dev/null; then
  echo "ALERT: Health check failed at $(date)"
  # Trigger rollback or alert
fi
EOF

# Run every 5 minutes
(crontab -l 2>/dev/null; echo "*/5 * * * * /home/runner/work/workstation/workstation/monitor.sh") | crontab -
```

---

## Additional Resources

- [Deployment Guide](DEPLOYMENT_INTEGRATED.md) - Deployment procedures
- [CI/CD Documentation](.github/workflows/README.md) - Build and deployment automation
- [Architecture Documentation](ARCHITECTURE.md) - System architecture
- [Getting Started](GETTING_STARTED.md) - Setup and configuration
- [Rollback Procedures (Extended)](ROLLBACK_PROCEDURES.md) - Original rollback doc

---

## Support

For rollback assistance:
- 📖 [Documentation](docs/DOCUMENTATION_INDEX.md)
- 🐛 [Issue Tracker](https://github.com/creditXcredit/workstation/issues)
- 💬 [Discussions](https://github.com/creditXcredit/workstation/discussions)

---

**Last Updated**: November 19, 2024  
**Version**: 1.0.0
