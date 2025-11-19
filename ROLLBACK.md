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
