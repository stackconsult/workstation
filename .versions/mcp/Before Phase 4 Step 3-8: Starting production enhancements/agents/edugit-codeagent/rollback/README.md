# EduGit-CodeAgent Rollback System

## Overview

Docker-based version control for curriculum content with automated snapshots and easy restoration.

## Docker Images

**Naming Convention:**
```
edugit-curriculum:YYYY-MM-DD-HHMM
edugit-curriculum:2025-11-20-0500
```

## Retention Policy

- **Daily** (Last 30 days): All update images
- **Weekly** (Last 90 days): Every Monday snapshot
- **Monthly** (Last 1 year): First Monday of month
- **Major** (Indefinite): Significant version changes

## Available Commands

### List Versions
```bash
# List all available rollback versions
./list.sh
```

### Restore Content
```bash
# Restore to specific date-time
./restore.sh 2025-11-20-0500

# Restore previous version
./restore.sh latest-1

# Restore two versions back
./restore.sh latest-2
```

### Cleanup Old Images
```bash
# Remove images per retention policy
./cleanup.sh
```

## Automatic Snapshots

Images are automatically created:
- After every content enhancement
- Before major updates
- On schedule (Monday & Saturday 5 AM UTC)

## Manual Snapshot

```bash
# Create snapshot manually
docker commit curriculum-container edugit-curriculum:$(date +%Y-%m-%d-%H%M)
```

## Safety

- All snapshots immutable
- Original content always preserved
- Rollback tested before deployment
- Automatic cleanup prevents disk bloat
