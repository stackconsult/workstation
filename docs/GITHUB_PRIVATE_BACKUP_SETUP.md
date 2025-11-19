# GitHub Private Repository Backup Setup Guide

## Overview

This guide walks you through setting up the immutable backup infrastructure for the `creditXcredit/mcp-private` repository with automated daily backups.

## Prerequisites

Before starting, ensure you have:

- [x] Docker and Docker Compose installed
- [x] Access to `creditXcredit/mcp-private` repository
- [x] GitHub Personal Access Token with `repo` scope
- [x] Admin access to workstation repository for GitHub Secrets

## Step 1: Create GitHub Personal Access Token

1. Go to GitHub Settings → Developer Settings → Personal Access Tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. **Token name**: `GitHub Private Backup Token`
4. **Expiration**: 90 days (set reminder to rotate)
5. **Scopes**: Select `repo` (Full control of private repositories)
6. Click "Generate token"
7. **IMPORTANT**: Copy the token immediately (you won't see it again)

## Step 2: Add Token to GitHub Secrets

### For GitHub Actions (Automated Backups)

1. Go to `creditXcredit/workstation` repository
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. **Name**: `GITHUB_PRIVATE_TOKEN`
5. **Value**: Paste your personal access token
6. Click "Add secret"

### For Local Development (Optional)

Create a `.env` file in the workstation root:

```bash
# DO NOT COMMIT THIS FILE
GITHUB_PRIVATE_TOKEN=ghp_your_token_here
```

Add to `.gitignore` (already included):
```
.env
```

## Step 3: Initialize Backup Infrastructure

### Option A: Automated Setup (Recommended)

Run the initialization script:

```bash
cd workstation
chmod +x scripts/init-github-backup.sh
./scripts/init-github-backup.sh
```

This will:
- Create required directories
- Build the backup container
- Start the container
- Initialize the repository
- Create first snapshot

### Option B: Manual Setup

1. **Create data directories**:
   ```bash
   mkdir -p data/github-private-backup/{immutable,snapshots,logs}
   ```

2. **Build the backup container**:
   ```bash
   docker-compose -f docker-compose.github-backup.yml build
   ```

3. **Start the container**:
   ```bash
   export GITHUB_PRIVATE_TOKEN="your_token_here"
   docker-compose -f docker-compose.github-backup.yml up -d
   ```

4. **Initialize the backup repository**:
   ```bash
   docker exec github-private-backup backup-manager init
   ```

5. **Create first snapshot**:
   ```bash
   docker exec github-private-backup backup-manager snapshot
   ```

6. **Verify setup**:
   ```bash
   docker exec github-private-backup backup-manager status
   ```

## Step 4: Enable Automated Daily Backups

The GitHub Actions workflow `.github/workflows/github-private-daily-backup.yml` is automatically enabled once the `GITHUB_PRIVATE_TOKEN` secret is set.

**Schedule**: Daily at 2 AM UTC

**Actions performed**:
1. Syncs with `mcp-private` repository
2. Creates snapshot if updates detected
3. Maintains 30-day snapshot retention
4. Reports status in workflow summary
5. Creates issue if backup fails

### Manual Trigger

You can manually trigger a backup:

1. Go to Actions tab in workstation repository
2. Select "GitHub Private Repository Daily Backup"
3. Click "Run workflow"
4. Select action: `sync`, `snapshot`, `status`, or `init`
5. Click "Run workflow"

## Step 5: Verify Everything Works

### Test Local Backup

```bash
# Check container is running
docker ps | grep github-private-backup

# Check health status
docker inspect github-private-backup --format='{{.State.Health.Status}}'

# View backup status
docker exec github-private-backup backup-manager status

# List snapshots
docker exec github-private-backup ls -lh /backup/snapshots/

# View logs
docker exec github-private-backup cat /backup/logs/backup-$(date +%Y%m%d).log
```

### Test GitHub Actions Workflow

1. Go to Actions tab → "GitHub Private Repository Daily Backup"
2. Click "Run workflow" → Select "status" → "Run workflow"
3. Wait for workflow to complete (should take 1-2 minutes)
4. Check workflow summary for backup status report

Expected output:
```
✅ Backup container built successfully
✅ Backup container started
📊 Backup Status Report
  Repository: Initialized ✓
  Current commit: abc123d
  Total snapshots: 1
```

## Step 6: Integration with Existing MCP Sync

Update `mcp-sync-config.json` to reference the backup container:

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

## Common Operations

### Daily Operations (Automated)

These run automatically via GitHub Actions:
- Daily sync at 2 AM UTC
- Automatic snapshot on updates
- Cleanup of 30+ day old snapshots
- Status reporting

### Manual Operations

```bash
# Sync with remote (creates snapshot if updated)
docker exec github-private-backup backup-manager sync

# Force create snapshot
docker exec github-private-backup backup-manager snapshot

# Check backup status
docker exec github-private-backup backup-manager status

# List all snapshots
docker exec github-private-backup ls -lh /backup/snapshots/

# View latest log
docker exec github-private-backup cat /backup/logs/backup-$(date +%Y%m%d).log
```

### Restore Operations

```bash
# Restore from latest snapshot
docker exec github-private-backup backup-manager restore latest

# Restore from specific snapshot
docker exec github-private-backup backup-manager restore snapshot-20241119-120000

# List available snapshots for restore
docker exec github-private-backup ls /backup/snapshots/
```

## Monitoring

### Daily Checks (Automated)

GitHub Actions workflow provides:
- ✅ Success/failure notifications
- 📊 Backup status in workflow summary
- 📦 Snapshot inventory
- 💾 Disk usage monitoring
- 🚨 Automatic issue creation on failures

### Weekly Manual Checks

Recommended weekly manual verification:

```bash
# 1. Check backup health
docker ps --format "table {{.Names}}\t{{.Status}}" | grep backup

# 2. Verify snapshot count
docker exec github-private-backup ls /backup/snapshots/ | wc -l
# Should be ≈7 for weekly backups

# 3. Check disk usage
docker exec github-private-backup du -sh /backup/*

# 4. Test restore procedure (optional)
docker exec github-private-backup backup-manager restore latest
```

### Monthly Reviews

- Review backup logs for any errors
- Test full restore procedure
- Verify GitHub token still valid
- Check disk space trends
- Update documentation if needed

## Troubleshooting

### Issue: Container Not Starting

**Symptom**: `docker ps` doesn't show github-private-backup

**Solutions**:
```bash
# Check for errors
docker logs github-private-backup

# Rebuild container
docker-compose -f docker-compose.github-backup.yml down
docker-compose -f docker-compose.github-backup.yml build --no-cache
docker-compose -f docker-compose.github-backup.yml up -d
```

### Issue: Authentication Failed

**Symptom**: "GITHUB_TOKEN environment variable not set" or authentication errors

**Solutions**:
```bash
# Verify token is set
docker exec github-private-backup env | grep GITHUB_TOKEN

# Restart with token
docker-compose -f docker-compose.github-backup.yml down
export GITHUB_PRIVATE_TOKEN="your_token_here"
docker-compose -f docker-compose.github-backup.yml up -d

# Re-initialize
docker exec github-private-backup backup-manager init
```

### Issue: Repository Not Syncing

**Symptom**: "Already up-to-date" but changes exist in mcp-private

**Solutions**:
```bash
# Force fetch
docker exec github-private-backup sh -c "cd /backup/immutable && git fetch --all && git reset --hard origin/main"

# Re-sync
docker exec github-private-backup backup-manager sync
```

### Issue: Snapshots Not Creating

**Symptom**: No snapshots in `/backup/snapshots/`

**Solutions**:
```bash
# Check permissions
docker exec github-private-backup ls -la /backup/

# Manually create snapshot
docker exec github-private-backup backup-manager snapshot

# Check logs
docker exec github-private-backup cat /backup/logs/backup-$(date +%Y%m%d).log
```

### Issue: Disk Space Running Low

**Symptom**: "No space left on device"

**Solutions**:
```bash
# Check current usage
docker exec github-private-backup du -sh /backup/*

# Clean old snapshots
docker exec github-private-backup find /backup/snapshots -name "*.tar.gz" -mtime +7 -delete

# Increase retention from 30 to 7 days if needed
docker exec github-private-backup find /backup/snapshots -name "*.tar.gz" -mtime +7 -delete
```

## Security Best Practices

### Token Management

- ✅ Use GitHub Secrets (never commit tokens)
- ✅ Set token expiration (90 days recommended)
- ✅ Use minimum required scopes (`repo` only)
- ✅ Rotate tokens quarterly
- ✅ Revoke tokens when no longer needed

### Access Control

- ✅ Container runs as non-root user (UID 1001)
- ✅ Backup volumes are isolated
- ✅ Network is segregated from public
- ✅ Health checks monitor integrity
- ✅ Logs track all operations

### Data Protection

- ✅ Immutable repository is read-only
- ✅ Snapshots are compressed and timestamped
- ✅ 30-day retention prevents data loss
- ✅ Restore capability tested regularly
- ✅ Logs retained for 90 days

## Maintenance Schedule

### Daily (Automated)
- Sync with `mcp-private` at 2 AM UTC
- Create snapshot if updates detected
- Clean snapshots older than 30 days

### Weekly (Manual)
- Review backup status
- Verify snapshot count
- Check disk usage
- Review error logs

### Monthly (Manual)
- Test restore procedure
- Verify token validity
- Review disk space trends
- Update documentation

### Quarterly (Manual)
- Rotate GitHub token
- Review security practices
- Audit backup procedures
- Update retention policies if needed

## Next Steps

After completing this setup:

1. ✅ **Verify**: Run test backup and restore
2. ✅ **Monitor**: Check first automated backup runs successfully
3. ✅ **Document**: Note any repository-specific configurations
4. ✅ **Train**: Ensure team knows restore procedures
5. ✅ **Schedule**: Set calendar reminders for quarterly token rotation

## Support

For issues or questions:

- 📖 Review [Container README](mcp-containers/github-private-backup-mcp/README.md)
- 🔍 Check [Troubleshooting](#troubleshooting) section above
- 📊 Review backup logs in `/backup/logs/`
- 🚨 Check GitHub Actions workflow runs
- 💬 Create issue in workstation repository

## Appendix: Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub mcp-private                    │
│                    (Source of Truth)                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ Daily Sync (2 AM UTC)
                         │ via GitHub Actions
                         ▼
         ┌───────────────────────────────────┐
         │  GitHub Private Backup Container  │
         ├───────────────────────────────────┤
         │                                   │
         │  /backup/immutable/              │◄─── Immutable Clone
         │    ├── .git/                     │
         │    └── repository files          │
         │                                   │
         │  /backup/snapshots/              │◄─── Daily Snapshots
         │    ├── snapshot-20241119.tar.gz  │     (30-day retention)
         │    ├── snapshot-20241120.tar.gz  │
         │    └── ...                       │
         │                                   │
         │  /backup/logs/                   │◄─── Operation Logs
         │    └── backup-YYYYMMDD.log       │
         │                                   │
         └───────────────────────────────────┘
                         │
                         │ Accessible via
                         │ docker exec
                         ▼
         ┌───────────────────────────────────┐
         │     Workstation MCP System        │
         │  (Can reference backup data)      │
         └───────────────────────────────────┘
```

## Version History

- **v1.0.0** (2024-11-19): Initial setup guide
  - Immutable backup container setup
  - GitHub Actions automation
  - Restore procedures
  - Monitoring and maintenance guidelines
