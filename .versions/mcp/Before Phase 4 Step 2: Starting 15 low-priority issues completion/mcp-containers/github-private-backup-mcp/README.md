# GitHub Private Repository Immutable Backup Container

## Overview

This MCP container provides a secure, immutable backup storage system for the `creditXcredit/mcp-private` repository with automated daily snapshots and restore capabilities.

## Features

- **Immutable Storage**: Full repository clone maintained as source of truth
- **Daily Snapshots**: Automated compressed snapshots with 30-day retention
- **Space Efficient**: Uses hardlinks to minimize storage overhead
- **Restore Capability**: One-command restore from any snapshot
- **Metadata Tracking**: Each snapshot includes commit hash, date, and message
- **Security**: Runs as non-root user with minimal permissions
- **Health Monitoring**: Built-in health checks

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- GitHub Personal Access Token with `repo` scope for `mcp-private` access
- Token stored in `GITHUB_TOKEN` environment variable or GitHub Secret

### Initial Setup

1. **Build the container**:
   ```bash
   docker-compose -f docker-compose.github-backup.yml build
   ```

2. **Start the container**:
   ```bash
   docker-compose -f docker-compose.github-backup.yml up -d
   ```

3. **Initialize the backup repository**:
   ```bash
   docker exec github-private-backup backup-manager init
   ```

4. **Verify status**:
   ```bash
   docker exec github-private-backup backup-manager status
   ```

## Usage

### Manual Commands

All operations are performed via the `backup-manager` command inside the container:

```bash
# Initialize/update the immutable repository
docker exec github-private-backup backup-manager init

# Sync with remote (auto-creates snapshot if updated)
docker exec github-private-backup backup-manager sync

# Create manual snapshot
docker exec github-private-backup backup-manager snapshot

# Check status
docker exec github-private-backup backup-manager status

# Restore from latest snapshot
docker exec github-private-backup backup-manager restore latest

# Restore from specific snapshot
docker exec github-private-backup backup-manager restore snapshot-20241119-120000
```

### Automated Daily Backups

The included GitHub Actions workflow `.github/workflows/github-private-daily-backup.yml` provides:

- **Scheduled Sync**: Every day at 2 AM UTC
- **Manual Trigger**: On-demand sync via workflow dispatch
- **Automatic Snapshots**: Created after each successful sync
- **Status Reporting**: Summary in GitHub Actions UI
- **Failure Alerts**: Creates GitHub issue on backup failures

## Directory Structure

Inside the container:

```
/backup/
├── immutable/           # Full repository clone (source of truth)
│   └── .git/           # Git repository data
├── snapshots/          # Compressed daily snapshots
│   ├── snapshot-YYYYMMDD-HHMMSS.tar.gz
│   └── ...
├── logs/               # Operation logs
│   └── backup-YYYYMMDD.log
└── config/             # Configuration files (if needed)
```

On host (via Docker volumes):

```
./data/github-private-backup/
├── immutable/          # Persistent repository
├── snapshots/          # Persistent snapshots
└── logs/               # Persistent logs
```

## Backup Strategy

### Immutable Repository

- **Purpose**: Acts as the master copy of `mcp-private`
- **Updates**: Only updated via `sync` command
- **Protection**: Read-only for most operations
- **Location**: `/backup/immutable`

### Snapshots

- **Frequency**: Daily (automated) or on-demand (manual)
- **Format**: Compressed tar.gz with metadata JSON
- **Retention**: 30 days (automatically cleaned)
- **Storage**: Hardlinks reduce disk usage
- **Location**: `/backup/snapshots`

### Metadata

Each snapshot includes:
```json
{
  "timestamp": "2024-11-19T14:30:00Z",
  "snapshot_name": "snapshot-20241119-143000",
  "source": "/backup/immutable",
  "commit_hash": "abc123def456...",
  "commit_date": "Mon Nov 18 10:00:00 2024",
  "commit_message": "Update documentation"
}
```

## Restore Procedures

### Full Restore

Restore the entire repository from a snapshot:

```bash
# Restore from latest snapshot
docker exec github-private-backup backup-manager restore latest

# Restore from specific snapshot
docker exec github-private-backup backup-manager restore snapshot-20241119-120000
```

### File-Level Restore

Extract specific files from a snapshot:

```bash
# Enter the container
docker exec -it github-private-backup /bin/bash

# Extract and view snapshot
cd /backup
tar xzf snapshots/snapshot-20241119-120000.tar.gz
cd snapshot-20241119-120000

# Copy specific files as needed
cp path/to/file.txt /backup/restored-files/
```

## Integration with Workstation

The backup container integrates with the main workstation repository:

1. **MCP Sync System**: The existing `mcp-sync.sh` script can reference this backup
2. **Workflow Integration**: GitHub Actions workflows can trigger backup operations
3. **Volume Sharing**: Backup data accessible to other MCP containers if needed

### Sync Configuration

Update `mcp-sync-config.json` to use the backup container as source:

```json
{
  "mcp": {
    "sourceRepo": {
      "owner": "creditXcredit",
      "name": "mcp-private",
      "defaultBranch": "main"
    },
    "localPath": "data/github-private-backup/immutable",
    "syncBranches": ["main"]
  }
}
```

## Monitoring

### Health Checks

The container includes a health check that verifies:
- Repository is initialized (`.git` directory exists)
- Runs every 30 seconds
- 3 retries before marking unhealthy

Check health status:
```bash
docker ps --format "table {{.Names}}\t{{.Status}}"
```

### Logs

View operation logs:
```bash
# Container logs
docker logs github-private-backup

# Backup operation logs
docker exec github-private-backup cat /backup/logs/backup-$(date +%Y%m%d).log

# Follow live logs
docker exec github-private-backup tail -f /backup/logs/backup-$(date +%Y%m%d).log
```

### Disk Usage

Monitor storage consumption:
```bash
# Quick status
docker exec github-private-backup backup-manager status

# Detailed disk usage
docker exec github-private-backup du -sh /backup/*
```

## Security

### Access Control

- **Non-root User**: Container runs as user `backup` (UID 1001)
- **Token Security**: `GITHUB_TOKEN` never logged or exposed
- **Read-only Filesystem**: Immutable repository protected from accidental modification
- **Isolated Network**: Container on dedicated backup network

### Best Practices

1. **Token Management**:
   - Use GitHub Secrets for CI/CD workflows
   - Rotate tokens quarterly
   - Minimum required scope (`repo` for private repos)

2. **Backup Verification**:
   - Test restore procedures monthly
   - Verify snapshot integrity
   - Monitor backup success rate

3. **Access Logging**:
   - All operations logged with timestamps
   - Review logs weekly
   - Alert on suspicious activity

## Troubleshooting

### Common Issues

1. **Repository Not Initialized**
   ```
   Error: Immutable repository not initialized
   ```
   **Solution**: Run `backup-manager init`

2. **Authentication Failed**
   ```
   Error: GITHUB_TOKEN environment variable not set
   ```
   **Solution**: Ensure token is set in environment or docker-compose

3. **Disk Space Full**
   ```
   Error: No space left on device
   ```
   **Solution**: Clean old snapshots or increase volume size

4. **Permission Denied**
   ```
   Error: Permission denied on /backup/immutable
   ```
   **Solution**: Check volume permissions, may need `chown 1001:1001`

### Diagnostic Commands

```bash
# Check container status
docker ps -a | grep github-private-backup

# View recent logs
docker logs --tail 50 github-private-backup

# Inspect volume mounts
docker inspect github-private-backup | grep Mounts -A 20

# Test GitHub connectivity
docker exec github-private-backup curl -s https://api.github.com/repos/creditXcredit/mcp-private
```

## Maintenance

### Regular Tasks

- **Daily**: Automated via GitHub Actions
- **Weekly**: Review backup logs and success rate
- **Monthly**: Test restore procedure
- **Quarterly**: Rotate GitHub token, verify volume health

### Snapshot Cleanup

Automatic cleanup keeps last 30 days. To manually clean:

```bash
# List all snapshots
docker exec github-private-backup ls -lh /backup/snapshots/

# Remove specific snapshot
docker exec github-private-backup rm /backup/snapshots/snapshot-YYYYMMDD-HHMMSS.tar.gz

# Clean snapshots older than N days
docker exec github-private-backup find /backup/snapshots -name "*.tar.gz" -mtime +N -delete
```

## Performance

### Storage Requirements

- **Immutable Repo**: ~Size of `mcp-private` repository
- **Each Snapshot**: ~Same size (compressed)
- **30 Days**: ~30x repository size maximum
- **Hardlinks**: Save space on uncompressed snapshots

### Time Estimates

- **Initial Clone**: 1-5 minutes (depends on repo size)
- **Sync**: 10-60 seconds
- **Snapshot**: 30-120 seconds
- **Restore**: 30-120 seconds

## Support

For issues or questions:

1. Check this README and troubleshooting section
2. Review backup logs: `/backup/logs/`
3. Check GitHub Actions workflow runs
4. Create issue in workstation repository

## Version History

- **v1.0.0** (2024-11-19): Initial implementation
  - Immutable backup container
  - Daily snapshot automation
  - Restore capabilities
  - GitHub Actions integration
