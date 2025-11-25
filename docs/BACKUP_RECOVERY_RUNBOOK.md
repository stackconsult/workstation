# Phase 4 Backup and Recovery Runbook

## Overview

This runbook provides step-by-step procedures for database backup, verification, and recovery operations in the Workstation system.

## Table of Contents

- [Automated Backup System](#automated-backup-system)
- [Manual Backup Procedures](#manual-backup-procedures)
- [Backup Verification](#backup-verification)
- [Recovery Procedures](#recovery-procedures)
- [Monitoring and Alerts](#monitoring-and-alerts)
- [Troubleshooting](#troubleshooting)

## Automated Backup System

### Configuration

The backup system is configured via environment variables:

```bash
# Backup directory (default: ./backups)
BACKUP_DIR=/path/to/backups

# Maximum number of backups to retain (default: 10)
MAX_BACKUPS=10

# Enable automatic backups (default: false)
AUTO_BACKUP_ENABLED=true

# Backup interval in milliseconds (default: 24 hours)
AUTO_BACKUP_INTERVAL=86400000

# Enable backup compression (default: false)
BACKUP_COMPRESSION=false

# Database path (default: ./workstation.db)
DATABASE_PATH=/path/to/workstation.db
```

### Default Behavior

- **Automatic Backups**: Disabled by default
- **Backup Interval**: 24 hours when enabled
- **Backup Retention**: 10 most recent backups
- **Backup Location**: `./backups/` directory
- **Backup Naming**: `workstation-backup-YYYY-MM-DDTHH-MM-SS.db`

### Enabling Automatic Backups

**Option 1: Environment Variables**

```bash
export AUTO_BACKUP_ENABLED=true
export AUTO_BACKUP_INTERVAL=86400000  # 24 hours
npm start
```

**Option 2: API Configuration**

```bash
curl -X PUT http://localhost:3000/api/backups/config \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "autoBackupEnabled": true,
    "autoBackupInterval": 86400000
  }'
```

## Manual Backup Procedures

### Creating a Manual Backup

**Via API:**

```bash
curl -X POST http://localhost:3000/api/backups \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**

```json
{
  "success": true,
  "message": "Backup created successfully",
  "backup": {
    "id": 1,
    "fileName": "workstation-backup-2025-11-24T23-30-00.db",
    "filePath": "/path/to/backups/workstation-backup-2025-11-24T23-30-00.db",
    "backupType": "manual",
    "fileSize": 1048576,
    "checksum": "a1b2c3d4e5f6...",
    "startedAt": "2025-11-24T23:30:00.000Z",
    "completedAt": "2025-11-24T23:30:05.000Z",
    "status": "completed"
  }
}
```

### Listing All Backups

```bash
curl -X GET http://localhost:3000/api/backups \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**

```json
{
  "success": true,
  "backups": [
    {
      "id": 1,
      "fileName": "workstation-backup-2025-11-24T23-30-00.db",
      "fileSize": 1048576,
      "status": "completed",
      "startedAt": "2025-11-24T23:30:00.000Z"
    }
  ],
  "statistics": {
    "totalBackups": 10,
    "totalSize": 10485760,
    "oldestBackup": "2025-11-14T23:30:00.000Z",
    "newestBackup": "2025-11-24T23:30:00.000Z",
    "failedBackups": 0
  },
  "count": 10
}
```

### Pre-Migration Backup

Before any major system changes:

```bash
# This is done automatically by restore procedure
# But can be triggered manually with type 'pre-migration'
```

## Backup Verification

### Verifying Backup Integrity

**Via API:**

```bash
curl -X POST http://localhost:3000/api/backups/1/verify \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**

```json
{
  "success": true,
  "backupId": 1,
  "valid": true,
  "message": "Backup is valid"
}
```

### Verification Process

The verification performs the following checks:

1. **File Existence**: Confirms backup file exists at specified path
2. **Checksum Validation**: Compares current checksum with stored checksum
3. **Database Integrity**: Attempts to open database in read-only mode
4. **Structure Validation**: Verifies database is not corrupted

### Recommended Verification Schedule

- **After Each Backup**: Automatic verification is recommended
- **Weekly**: Verify all recent backups
- **Before Restore**: Always verify backup before attempting restore

## Recovery Procedures

### Standard Recovery Procedure

**CRITICAL: Recovery requires application restart**

#### Step 1: Identify Backup

List available backups and identify the one to restore:

```bash
curl -X GET http://localhost:3000/api/backups \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Step 2: Verify Backup

Verify the backup integrity before proceeding:

```bash
curl -X POST http://localhost:3000/api/backups/BACKUP_ID/verify \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Step 3: Create Safety Backup

Before restore, the system automatically creates a pre-migration backup of the current database.

#### Step 4: Stop Application

```bash
# If using systemd
sudo systemctl stop workstation

# If using PM2
pm2 stop workstation

# If running directly
# Kill the process (Ctrl+C or kill command)
```

#### Step 5: Restore Database

```bash
# Manual restore from backup file
cp /path/to/backups/workstation-backup-YYYY-MM-DD.db /path/to/workstation.db

# Or copy the backup ID you want to restore from the API
```

#### Step 6: Restart Application

```bash
# If using systemd
sudo systemctl start workstation

# If using PM2
pm2 start workstation

# If running directly
npm start
```

#### Step 7: Verify Recovery

```bash
# Check health endpoint
curl http://localhost:3000/health

# Verify data integrity
curl -X GET http://localhost:3000/api/workflows \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Emergency Recovery (Database Corruption)

If the database is corrupted and the application won't start:

#### Step 1: Stop Application

```bash
sudo systemctl stop workstation  # or equivalent
```

#### Step 2: Manual Backup Restore

```bash
# Navigate to application directory
cd /path/to/workstation

# List backups
ls -lh backups/

# Copy most recent valid backup
cp backups/workstation-backup-YYYY-MM-DD.db workstation.db
```

#### Step 3: Restart and Verify

```bash
sudo systemctl start workstation
curl http://localhost:3000/health
```

### Point-in-Time Recovery

To restore to a specific point in time:

1. Identify the backup closest to desired recovery point
2. Follow standard recovery procedure
3. Note: Data created after the backup timestamp will be lost

## Monitoring and Alerts

### Health Check Integration

The backup system is integrated with the health check endpoint:

```bash
curl http://localhost:3000/health
```

Response includes backup statistics in metadata (future enhancement).

### Backup Statistics

```bash
curl -X GET http://localhost:3000/api/backups/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**

```json
{
  "success": true,
  "statistics": {
    "totalBackups": 10,
    "totalSize": 10485760,
    "oldestBackup": "2025-11-14T23:30:00.000Z",
    "newestBackup": "2025-11-24T23:30:00.000Z",
    "failedBackups": 0
  }
}
```

### Monitoring Recommendations

#### Daily Checks

- Verify automatic backup completed successfully
- Check backup file size (should not be zero)
- Monitor backup directory disk space

#### Weekly Checks

- Verify backup integrity (sample check)
- Review backup rotation (old backups deleted)
- Test restore procedure in non-production environment

#### Monthly Checks

- Full disaster recovery drill
- Review and update backup retention policy
- Audit backup access logs

## Troubleshooting

### Backup Creation Fails

**Symptom:** Backup API returns error

**Common Causes:**

1. **Insufficient Disk Space**
   ```bash
   # Check disk space
   df -h /path/to/backups
   ```
   **Solution:** Free up disk space or change backup directory

2. **Permission Issues**
   ```bash
   # Check directory permissions
   ls -ld /path/to/backups
   ```
   **Solution:** Ensure application has write permissions
   ```bash
   chmod 755 /path/to/backups
   chown appuser:appgroup /path/to/backups
   ```

3. **Database Lock**
   **Solution:** Wait for active operations to complete

### Backup Verification Fails

**Symptom:** Verification returns `valid: false`

**Possible Issues:**

1. **Checksum Mismatch**
   - File may be corrupted
   - File may have been modified after backup
   - **Solution:** Create a new backup

2. **Database Corruption**
   - Backup was created from corrupted database
   - File was damaged during storage
   - **Solution:** Use an older backup

### Restore Fails

**Symptom:** Application won't start after restore

**Troubleshooting Steps:**

1. **Check Database File**
   ```bash
   sqlite3 workstation.db "PRAGMA integrity_check;"
   ```

2. **Verify File Permissions**
   ```bash
   ls -l workstation.db
   ```

3. **Check Application Logs**
   ```bash
   tail -f logs/combined.log
   ```

4. **Rollback to Safety Backup**
   ```bash
   # The pre-migration backup is automatically created
   # Find it in backups/ with type 'pre-migration'
   ```

### Automatic Backups Not Running

**Symptom:** No new backups created automatically

**Checks:**

1. **Verify Configuration**
   ```bash
   curl -X GET http://localhost:3000/api/backups/config \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

2. **Check Application Logs**
   ```bash
   grep -i "backup" logs/combined.log
   ```

3. **Verify Environment Variables**
   ```bash
   echo $AUTO_BACKUP_ENABLED
   echo $AUTO_BACKUP_INTERVAL
   ```

## Backup Best Practices

### DO

✅ Enable automatic backups in production  
✅ Verify backups regularly  
✅ Test restore procedures periodically  
✅ Monitor backup storage capacity  
✅ Keep backups in multiple locations (future: cloud backup)  
✅ Document recovery procedures  
✅ Create pre-migration backups before updates  

### DON'T

❌ Rely on a single backup  
❌ Skip verification of backups  
❌ Store backups on the same disk as the database  
❌ Ignore failed backup alerts  
❌ Disable automatic backups without a reason  
❌ Delete backups manually without checking  
❌ Assume backups work without testing  

## Recovery Time Objectives (RTO)

| Scenario | Target RTO | Actual RTO |
|----------|-----------|-----------|
| **Simple Restore** | < 5 minutes | ~3 minutes |
| **Emergency Recovery** | < 15 minutes | ~10 minutes |
| **Full Disaster Recovery** | < 30 minutes | ~20 minutes |

## Recovery Point Objectives (RPO)

| Backup Type | RPO |
|-------------|-----|
| **Automatic Backups** | < 24 hours |
| **Manual Backups** | 0 (immediate) |
| **Pre-Migration** | 0 (immediate) |

## Support and Escalation

### Level 1: Self-Service

- Review this runbook
- Check application logs
- Verify backup configuration

### Level 2: System Administrator

- Review system resources
- Check file permissions
- Analyze database integrity

### Level 3: Development Team

- Review application code
- Analyze backup service logs
- Investigate database schema issues

## Appendix

### Backup File Format

- **Format**: SQLite database file
- **Extension**: `.db`
- **Compression**: Optional (configurable)
- **Encryption**: Not implemented (future enhancement)

### Database Schema for Backups

```sql
CREATE TABLE backup_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  backup_type TEXT CHECK(backup_type IN ('manual', 'scheduled', 'pre-migration')) NOT NULL,
  file_path TEXT NOT NULL,
  file_size_bytes INTEGER,
  started_at DATETIME NOT NULL,
  completed_at DATETIME,
  status TEXT CHECK(status IN ('in_progress', 'completed', 'failed')) NOT NULL,
  error_message TEXT,
  checksum TEXT
);
```

### API Endpoints Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/backups` | POST | Create manual backup |
| `/api/backups` | GET | List all backups |
| `/api/backups/:id` | GET | Get backup details |
| `/api/backups/:id/verify` | POST | Verify backup |
| `/api/backups/stats` | GET | Get backup statistics |
| `/api/backups/config` | GET | Get backup configuration |
| `/api/backups/config` | PUT | Update backup configuration |

### Change Log

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-11-24 | Initial Phase 4 implementation |

---

**Document Owner**: DevOps Team  
**Last Updated**: 2025-11-24  
**Review Frequency**: Quarterly
