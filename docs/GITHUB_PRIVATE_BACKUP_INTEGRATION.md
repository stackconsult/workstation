# GitHub Private Backup Integration with Workstation

## Overview

This document explains how the `mcp-private` backup container integrates with the workstation MCP infrastructure and enables future repository backups.

## Architecture

### Current Setup

```
┌──────────────────────────────────────────────────────────────┐
│                    GitHub Repositories                        │
├──────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │ mcp-private  │         │ workstation      │          │
│  │ (Private Config) │         │ (Main Repo)      │          │
│  └────────┬─────────┘         └────────┬─────────┘          │
└───────────┼────────────────────────────┼────────────────────┘
            │                            │
            │ Daily Sync                 │ Active Development
            │ (2 AM UTC)                 │
            ▼                            ▼
┌──────────────────────────────────────────────────────────────┐
│           Workstation MCP Container Infrastructure            │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────────────────────────────────────────┐     │
│  │  GitHub Private Backup Container (NEW!)            │     │
│  │  ┌──────────────────────────────────────────────┐ │     │
│  │  │ /backup/immutable/  (Full mcp-private)  │ │     │
│  │  │ /backup/snapshots/  (30-day retention)      │ │     │
│  │  │ /backup/logs/       (Operation logs)        │ │     │
│  │  └──────────────────────────────────────────────┘ │     │
│  └────────────────────────────────────────────────────┘     │
│                           │                                   │
│  ┌────────────────────────┼────────────────────────────┐    │
│  │  20 MCP Agent Containers (Existing)                 │    │
│  │  ├── 01-selector-mcp                                │    │
│  │  ├── 02-go-backend-browser-automation-engineer-mcp │    │
│  │  ├── ...                                            │    │
│  │  └── 20-orchestrator-mcp                           │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

## Integration Points

### 1. MCP Sync System Integration

The existing MCP sync system can now use the backup container as a data source:

**Update `mcp-sync-config.json`:**

```json
{
  "mcp": {
    "sourceRepo": {
      "owner": "creditXcredit",
      "name": "mcp-private",
      "defaultBranch": "main"
    },
    "localPath": "data/github-private-backup/immutable",
    "backupContainer": {
      "enabled": true,
      "name": "github-private-backup",
      "snapshotsPath": "data/github-private-backup/snapshots"
    },
    "syncBranches": ["main"],
    "watchInterval": 300000,
    "autoSync": true,
    "rollback": {
      "enabled": true,
      "keepSnapshots": 30,
      "snapshotPath": "data/github-private-backup/snapshots"
    }
  }
}
```

### 2. Shared Volume Access

Other MCP containers can access backup data via shared volumes:

**docker-compose.yml example:**

```yaml
services:
  # GitHub Private Backup Container
  github-private-backup:
    # ... (existing configuration)
    volumes:
      - github-private-data:/backup/immutable:rw
      - github-private-snapshots:/backup/snapshots:ro
  
  # Agent that needs access to mcp-private data
  mcp-agent-custom:
    build: ./mcp-containers/custom-agent
    volumes:
      # Read-only access to immutable backup
      - github-private-data:/data/mcp-private:ro
      # Read-only access to snapshots
      - github-private-snapshots:/data/backups:ro
```

### 3. GitHub Actions Workflow Integration

The backup workflow integrates with existing CI/CD:

**Cross-workflow triggering:**

```yaml
# .github/workflows/github-private-daily-backup.yml
- name: Trigger dependent workflows
  if: steps.sync.outputs.sync_updated == 'true'
  uses: actions/github-script@v7
  with:
    script: |
      // Trigger MCP sync workflow
      await github.rest.actions.createWorkflowDispatch({
        owner: context.repo.owner,
        repo: context.repo.repo,
        workflow_id: 'mcp-branch-watch.yml',
        ref: 'main'
      });
```

### 4. Backup Data Flow

```
GitHub mcp-private
    ↓ (1) Daily Sync @ 2 AM UTC
github-private-backup Container
    ├── /backup/immutable/  ← Master copy
    │   ↓ (2) On update
    ├── /backup/snapshots/  ← Versioned backups
    │   ↓ (3) Accessible via volumes
    └── Workstation MCP Agents
        ↓ (4) Use for configuration/data
        Application Services
```

## Future Repository Backup Setup

This infrastructure serves as a template for backing up additional repositories.

### Adding a New Repository Backup

1. **Create Container Directory**
   ```bash
   mkdir -p mcp-containers/{repo-name}-backup-mcp
   ```

2. **Copy and Customize Files**
   ```bash
   cp mcp-containers/github-private-backup-mcp/Dockerfile \
      mcp-containers/{repo-name}-backup-mcp/
   
   cp mcp-containers/github-private-backup-mcp/backup-manager.sh \
      mcp-containers/{repo-name}-backup-mcp/
   ```

3. **Update Dockerfile**
   - Change container labels
   - Update repository reference
   - Adjust resource limits if needed

4. **Update backup-manager.sh**
   - Change `REPO_URL` to new repository
   - Update branch names if different
   - Adjust retention policy if needed

5. **Create Docker Compose File**
   ```bash
   cp docker-compose.github-backup.yml \
      docker-compose.{repo-name}-backup.yml
   ```

6. **Update docker-compose**
   - Change container name
   - Update volume names
   - Change network if needed
   - Update environment variables

7. **Create Workflow**
   ```bash
   cp .github/workflows/github-private-daily-backup.yml \
      .github/workflows/{repo-name}-daily-backup.yml
   ```

8. **Update Workflow**
   - Change workflow name
   - Update token secret name
   - Change container references
   - Adjust schedule if needed

### Example: Adding `creditXcredit/core-api` Backup

```bash
# 1. Create structure
mkdir -p mcp-containers/core-api-backup-mcp

# 2. Copy template files
cp mcp-containers/github-private-backup-mcp/* \
   mcp-containers/core-api-backup-mcp/

# 3. Update backup-manager.sh
# Change REPO_URL to:
# REPO_URL="https://x-access-token:${GITHUB_TOKEN}@github.com/creditXcredit/core-api.git"

# 4. Create docker-compose
cat > docker-compose.core-api-backup.yml <<EOF
version: '3.8'

services:
  core-api-backup:
    build:
      context: ./mcp-containers/core-api-backup-mcp
    container_name: core-api-backup
    environment:
      - GITHUB_TOKEN=\${CORE_API_TOKEN}
    volumes:
      - core-api-immutable:/backup/immutable:rw
      - core-api-snapshots:/backup/snapshots:rw
      - core-api-logs:/backup/logs:rw
    networks:
      - backup-network

volumes:
  core-api-immutable:
    name: core-api-immutable
  core-api-snapshots:
    name: core-api-snapshots
  core-api-logs:
    name: core-api-logs

networks:
  backup-network:
    external: true
    name: workstation-backup-network
EOF

# 5. Create workflow
# (Similar to github-private-daily-backup.yml but for core-api)

# 6. Set GitHub Secret
# CORE_API_TOKEN with repo access
```

## Multi-Repository Backup Management

### Centralized Backup Orchestrator

For managing multiple repository backups:

```bash
#!/bin/bash
# scripts/backup-all-repos.sh

REPOS=(
  "github-private"
  "core-api"
  "workstation"
  # Add more repos here
)

for repo in "${REPOS[@]}"; do
  echo "Backing up $repo..."
  docker exec ${repo}-backup backup-manager sync
done
```

### Consolidated Status Dashboard

```bash
#!/bin/bash
# scripts/backup-status-all.sh

echo "=== Repository Backup Status ==="
echo ""

for container in $(docker ps --format '{{.Names}}' | grep -E '.*-backup$'); do
  echo "Container: $container"
  docker exec $container backup-manager status | head -10
  echo ""
done
```

### Unified Monitoring

```yaml
# .github/workflows/backup-health-check.yml
name: All Repository Backups Health Check

on:
  schedule:
    - cron: '0 6 * * *'  # Daily at 6 AM UTC

jobs:
  check-all-backups:
    runs-on: ubuntu-latest
    steps:
      - name: Check github-private backup
        run: # ... check logic
      
      - name: Check core-api backup
        run: # ... check logic
      
      - name: Check workstation backup
        run: # ... check logic
      
      - name: Create consolidated report
        run: # ... generate report
```

## Data Accessibility Patterns

### Pattern 1: Read-Only Configuration Access

MCP agents read configuration from `mcp-private`:

```yaml
services:
  mcp-agent:
    volumes:
      - github-private-data:/config/mcp-private:ro
    environment:
      - CONFIG_PATH=/config/mcp-private
```

### Pattern 2: Snapshot-Based Recovery

Restore specific version of configuration:

```bash
# 1. List available snapshots
docker exec github-private-backup ls -lh /backup/snapshots/

# 2. Restore specific snapshot
docker exec github-private-backup \
  backup-manager restore snapshot-20241115-020000

# 3. Restart dependent services
docker-compose restart mcp-agent
```

### Pattern 3: Cross-Container Data Sync

Sync backup data to another container:

```bash
# In docker-compose.yml
services:
  github-private-backup:
    volumes:
      - github-private-data:/backup/immutable:rw
  
  data-sync-agent:
    volumes:
      - github-private-data:/source:ro
      - agent-data:/destination:rw
    command: rsync -av /source/ /destination/
```

## Security Considerations

### Token Management

- **Separate Tokens**: Each repository backup uses its own GitHub token
- **Scoped Access**: Tokens have minimum required scope (repo)
- **Secret Isolation**: Stored in separate GitHub Secrets
- **Rotation Policy**: 90-day rotation recommended

### Network Isolation

```yaml
networks:
  backup-network:
    internal: true  # No external access
    driver: bridge
    ipam:
      config:
        - subnet: 172.25.0.0/16
```

### Volume Permissions

```bash
# Set proper ownership
chown -R 1001:1001 data/github-private-backup/
chmod 750 data/github-private-backup/immutable
chmod 750 data/github-private-backup/snapshots
```

## Maintenance & Monitoring

### Health Check All Backups

```bash
#!/bin/bash
# scripts/health-check-backups.sh

for backup in $(docker ps --format '{{.Names}}' | grep backup); do
  health=$(docker inspect $backup --format '{{.State.Health.Status}}')
  if [ "$health" != "healthy" ]; then
    echo "❌ $backup: $health"
  else
    echo "✅ $backup: healthy"
  fi
done
```

### Disk Usage Monitoring

```bash
#!/bin/bash
# scripts/monitor-backup-storage.sh

echo "Backup Storage Usage:"
echo ""

for backup in data/*-backup; do
  repo=$(basename $backup)
  echo "$repo:"
  du -sh $backup/*
  echo ""
done
```

### Automated Cleanup

```yaml
# .github/workflows/backup-cleanup.yml
name: Backup Storage Cleanup

on:
  schedule:
    - cron: '0 3 * * 0'  # Weekly on Sunday

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Clean old snapshots (>30 days)
        run: |
          find data/*/snapshots -name "*.tar.gz" -mtime +30 -delete
```

## Troubleshooting

### Issue: Multiple Backups Failing

**Diagnosis:**
```bash
# Check all backup containers
docker ps -a | grep backup

# Check logs for patterns
for backup in $(docker ps -a --format '{{.Names}}' | grep backup); do
  echo "=== $backup ==="
  docker logs $backup --tail 20
done
```

**Common Causes:**
- Token expired
- Rate limit exceeded
- Network connectivity issues
- Disk space full

### Issue: Snapshot Restore Conflicts

**Diagnosis:**
```bash
# Check snapshot integrity
docker exec github-private-backup \
  tar tzf /backup/snapshots/snapshot-XXX.tar.gz | head
```

**Resolution:**
```bash
# Restore to temporary location
docker exec github-private-backup sh -c "
  cd /backup
  tar xzf snapshots/snapshot-XXX.tar.gz -C /tmp
  mv immutable immutable.old
  mv /tmp/snapshot-XXX immutable
"
```

## Best Practices

1. **Separate Tokens**: One token per repository backup
2. **Staggered Schedules**: Spread backup times to avoid resource conflicts
3. **Regular Testing**: Monthly restore tests
4. **Monitoring**: Set up alerts for backup failures
5. **Documentation**: Keep backup inventory up-to-date
6. **Retention Policy**: Adjust based on repository importance
7. **Access Control**: Limit volume mounts to read-only when possible
8. **Health Checks**: Monitor all backup containers
9. **Capacity Planning**: Monitor disk usage trends
10. **Disaster Recovery**: Test full recovery procedures quarterly

## Summary

The GitHub Private backup infrastructure provides:

✅ **Scalable Template**: Easy to replicate for new repositories  
✅ **Integration Ready**: Works with existing MCP system  
✅ **Automated Operations**: Daily backups via GitHub Actions  
✅ **Secure by Default**: Isolated networks and proper permissions  
✅ **Future Proof**: Designed for multi-repository expansion  
✅ **Well Documented**: Comprehensive guides and examples  

This foundation enables the workstation to host immutable backups of all creditXcredit repositories with minimal additional configuration.
