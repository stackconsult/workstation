# GitHub Private Backup - Quick Reference

## Container Commands

```bash
# Build and start container
docker-compose -f docker-compose.github-backup.yml build
docker-compose -f docker-compose.github-backup.yml up -d

# Initialize backup (first time)
docker exec github-private-backup backup-manager init

# Daily operations
docker exec github-private-backup backup-manager sync      # Sync with remote
docker exec github-private-backup backup-manager snapshot  # Create snapshot
docker exec github-private-backup backup-manager status    # Check status

# Restore operations
docker exec github-private-backup backup-manager restore latest                    # Latest snapshot
docker exec github-private-backup backup-manager restore snapshot-20241119-120000  # Specific snapshot

# View logs
docker logs github-private-backup
docker exec github-private-backup cat /backup/logs/backup-$(date +%Y%m%d).log

# Stop container
docker-compose -f docker-compose.github-backup.yml down
```

## GitHub Actions

**Workflow**: `.github/workflows/github-private-daily-backup.yml`

**Schedule**: Daily at 2 AM UTC

**Manual Trigger**:
1. Go to Actions → "GitHub Private Repository Daily Backup"
2. Click "Run workflow"
3. Select action: `sync`, `snapshot`, `status`, or `init`
4. Click "Run workflow"

## Setup Steps

```bash
# 1. Quick automated setup
chmod +x scripts/init-github-backup.sh
GITHUB_PRIVATE_TOKEN=your_token ./scripts/init-github-backup.sh

# 2. Set GitHub Secret for automation
# Go to Settings → Secrets → New secret
# Name: GITHUB_PRIVATE_TOKEN
# Value: your_personal_access_token

# 3. Verify setup
docker exec github-private-backup backup-manager status
```

## Directory Structure

```
data/github-private-backup/
├── immutable/          # Full repository clone
├── snapshots/          # Compressed daily snapshots
└── logs/               # Operation logs
```

## Monitoring

```bash
# Container health
docker ps --format "table {{.Names}}\t{{.Status}}" | grep backup

# Snapshot count (should be ~7-30)
docker exec github-private-backup ls /backup/snapshots/ | wc -l

# Disk usage
docker exec github-private-backup du -sh /backup/*

# Recent snapshots
docker exec github-private-backup ls -lht /backup/snapshots/ | head -5
```

## Troubleshooting

```bash
# Restart container
docker-compose -f docker-compose.github-backup.yml restart

# View detailed logs
docker logs github-private-backup --tail 100

# Rebuild from scratch
docker-compose -f docker-compose.github-backup.yml down
docker-compose -f docker-compose.github-backup.yml build --no-cache
docker-compose -f docker-compose.github-backup.yml up -d
docker exec github-private-backup backup-manager init
```

## Documentation

- **Setup Guide**: `docs/GITHUB_PRIVATE_BACKUP_SETUP.md`
- **Container README**: `mcp-containers/github-private-backup-mcp/README.md`
- **Workflow**: `.github/workflows/github-private-daily-backup.yml`

## Key Features

✅ Immutable repository storage  
✅ Daily automated backups  
✅ 30-day snapshot retention  
✅ One-command restore  
✅ GitHub Actions integration  
✅ Space-efficient hardlinks  
✅ Non-root security  
✅ Isolated backup network  
✅ Health monitoring  
✅ Automatic failure alerts
