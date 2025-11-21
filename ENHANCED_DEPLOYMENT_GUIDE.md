# 🚀 Enhanced One-Click Deployment Guide

## Overview

The enhanced deployment script (`one-click-deploy-enhanced.sh`) includes significant improvements over the basic version with enterprise-grade features for production readiness.

## New Features

### 1. ✅ Checkpoint/Resume Capability
- **Automatic checkpoints** saved at each deployment step
- **Resume from failure** - If deployment fails, restart continues from last successful step
- **Progress tracking** - Always know where deployment stopped

**Usage:**
```bash
# If deployment fails at step 4, simply re-run:
./one-click-deploy-enhanced.sh

# You'll be prompted:
# "Previous deployment found at step 4"
# "Resume from checkpoint? (y/n)"
```

### 2. 🔄 Enhanced Error Handling with Retries
- **Exponential backoff retry** for network operations
- **3 automatic retry attempts** with 2s, 4s, 8s delays
- **Intelligent failure handling** - Distinguishes temporary vs permanent failures

**Applies to:**
- npm install
- npm ci (dependency verification)
- Network-dependent operations

### 3. 🏥 Comprehensive Health Checks
- **Multi-level validation:**
  - Basic health endpoint check
  - JWT authentication endpoint test
  - API responsiveness verification
- **Smoke tests** ensure all critical functionality works
- **Graceful degradation** - Option to continue even if optional checks fail

### 4. 📸 Pre-Deployment Snapshot Rollback
- **Automatic snapshots** created before deployment
- **Rollback capability** to previous working state
- **Backed up:**
  - `.env` configuration
  - `package-lock.json`
  - Git commit reference
  - Server PID files

**Snapshot storage:** `logs/snapshots/snapshot-YYYYMMDD-HHMMSS/`

**Manual rollback:**
```bash
# Snapshots are stored in logs/snapshots/
ls logs/snapshots/

# To manually rollback:
cp logs/snapshots/snapshot-20231121-143022/.env.backup .env
cp logs/snapshots/snapshot-20231121-143022/package-lock.json.backup package-lock.json
```

### 5. 📝 Persistent Logging with Rotation
- **Persistent logs** saved to `logs/deployment-YYYY-MM-DD-HHMMSS.log`
- **Automatic rotation** - Keeps last 10 deployment logs
- **Detailed timestamped entries** for troubleshooting
- **Survives reboots** - Unlike `/tmp` logs

**View logs:**
```bash
# Latest deployment
tail -f logs/deployment-*.log

# All deployments
ls -lt logs/deployment-*.log

# Specific deployment
cat logs/deployment-2023-11-21-143022.log
```

### 6. 🖥️ Better Cross-Platform Support
- **Platform detection** - Automatically detects macOS, Linux, Windows
- **WSL support** - Enhanced Windows Subsystem for Linux detection
- **Chromepath detection** - Tries multiple Chrome installation paths
- **Running instance detection** - Warns if Chrome is already running

### 7. 🔐 Dependency Integrity Validation
- **Extension manifest validation** - Ensures Chrome extension built correctly
- **Build output verification** - Validates compiled TypeScript
- **File existence checks** at each critical step

### 8. 🛡️ Graceful Process Management
- **SIGTERM before SIGKILL** - Allows processes to cleanup
- **Enhanced stop script** - Graceful shutdown with fallback
- **PID tracking** - Proper process management
- **Port conflict resolution** - Handles port 3000 already in use

## Comparison: Basic vs Enhanced

| Feature | Basic (`one-click-deploy.sh`) | Enhanced (`one-click-deploy-enhanced.sh`) |
|---------|------------------------------|-------------------------------------------|
| **Deployment Steps** | 7 steps | 8 steps (with health checks) |
| **Error Recovery** | ❌ Start over from beginning | ✅ Resume from checkpoint |
| **Retry Logic** | ❌ Fails immediately | ✅ 3 attempts with backoff |
| **Logging** | `/tmp` (temporary) | `logs/` (persistent) |
| **Rollback** | ❌ Manual only | ✅ Automated snapshots |
| **Health Checks** | Basic | Comprehensive + smoke tests |
| **Platform Support** | macOS/Linux | macOS/Linux/Windows/WSL |
| **Chrome Detection** | 5 paths | 6 paths + instance check |
| **Process Shutdown** | SIGKILL only | SIGTERM → SIGKILL |
| **Log Rotation** | ❌ None | ✅ Keeps last 10 |

## Usage

### First Time Deployment
```bash
# Clone repository (if not already done)
git clone https://github.com/creditXcredit/workstation.git
cd workstation

# Run enhanced deployment
./one-click-deploy-enhanced.sh
```

### After Failure/Interruption
```bash
# Simply re-run - you'll be asked to resume
./one-click-deploy-enhanced.sh

# Or force fresh deployment
rm logs/.deployment-checkpoint
./one-click-deploy-enhanced.sh
```

### Stopping Services
```bash
# Use the enhanced stop script
/tmp/stop-workstation.sh

# Or manually
kill $(cat /tmp/workstation-server.pid)
kill $(cat /tmp/workstation-chrome.pid)
```

## Deployment Steps

### Step 1: Prerequisites Check
- Node.js 18+ validation
- npm availability
- Chrome/Chromium detection (6 paths)
- Running Chrome instance detection
- Platform identification

### Step 2: Environment Setup
- `.env` file creation from template
- Secure JWT secret generation (32-byte random)
- Safe environment variable loading
- Platform-specific sed delimiter handling

### Step 3: Install Dependencies (with retry)
- npm install with 3 retry attempts
- Exponential backoff (2s, 4s, 8s)
- Intelligent npm ci verification if node_modules exists

### Step 4: Build TypeScript
- TypeScript compilation
- Build output validation
- Error reporting with rollback option

### Step 5: Build Chrome Extension
- Extension build to `build/chrome-extension/`
- Manifest validation
- Structure verification

### Step 6: Start Backend Server
- Graceful shutdown of existing server (SIGTERM → SIGKILL)
- Server startup with PID tracking
- 30-second startup wait with health polling
- Enhanced error logging

### Step 7: Comprehensive Health Checks (NEW)
- Health endpoint validation
- JWT authentication test
- API responsiveness check
- Option to continue on non-critical failures

### Step 8: Launch Chrome Extension
- User data directory creation
- Extension auto-loading
- Workflow builder auto-open
- PID tracking for Chrome process

## Logs and Debugging

### Log Files
```bash
# Deployment logs
logs/deployment-YYYY-MM-DD-HHMMSS.log

# Server logs
/tmp/workstation-server.log

# View in real-time
tail -f logs/deployment-*.log
tail -f /tmp/workstation-server.log
```

### Checkpoint Files
```bash
# Current checkpoint
cat logs/.deployment-checkpoint

# Clear checkpoint (force fresh deployment)
rm logs/.deployment-checkpoint
```

### Snapshot Management
```bash
# List snapshots
ls -lt logs/snapshots/

# View latest snapshot
cat logs/snapshots/.latest-snapshot

# Manually restore from snapshot
SNAPSHOT_ID=$(cat logs/snapshots/.latest-snapshot)
cp logs/snapshots/snapshot-$SNAPSHOT_ID/.env.backup .env
```

## Troubleshooting

### Deployment Fails at Step 3 (npm install)
- **Issue**: Network timeout or npm registry issues
- **Solution**: Script will auto-retry 3 times. If still fails:
  ```bash
  # Manually install and resume
  npm install
  ./one-click-deploy-enhanced.sh  # Resume from step 4
  ```

### Port 3000 Already in Use
- **Issue**: Another service on port 3000
- **Solution**: Script automatically handles with graceful shutdown
- **Manual check:**
  ```bash
  lsof -ti:3000
  kill $(lsof -ti:3000)
  ```

### Chrome Extension Doesn't Load
- **Issue**: Chrome not detected or running
- **Solutions:**
  1. Close all Chrome instances before running
  2. Load extension manually:
     - Navigate to `chrome://extensions/`
     - Enable Developer mode
     - Click "Load unpacked"
     - Select `build/chrome-extension/`

### Health Checks Fail
- **Issue**: Server started but health endpoint not responding
- **Solution**: Check server logs:
  ```bash
  tail -f /tmp/workstation-server.log
  curl http://localhost:3000/health
  ```

### Want to Rollback
- **Manual rollback:**
  ```bash
  SNAPSHOT_ID=$(cat logs/snapshots/.latest-snapshot)
  cp logs/snapshots/snapshot-$SNAPSHOT_ID/.env.backup .env
  cp logs/snapshots/snapshot-$SNAPSHOT_ID/package-lock.json.backup package-lock.json
  npm install
  ```

## Performance Metrics

- **First deployment**: ~2-4 minutes
- **Resume from checkpoint**: ~30 seconds - 2 minutes (depending on step)
- **Retry overhead**: +2-4 seconds per retry (exponential backoff)
- **Health check overhead**: +5-10 seconds
- **Snapshot creation**: +1-2 seconds

## Advanced Usage

### Environment Variables
```bash
# Override default port
PORT=8080 ./one-click-deploy-enhanced.sh

# Skip Chrome launch
SKIP_CHROME=1 ./one-click-deploy-enhanced.sh

# Custom log location
LOG_DIR=/var/log/workstation ./one-click-deploy-enhanced.sh
```

### Integration with CI/CD
```yaml
# GitHub Actions example
- name: Deploy with Enhanced Script
  run: |
    ./one-click-deploy-enhanced.sh
    
- name: Upload Deployment Logs
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: deployment-logs
    path: logs/deployment-*.log
```

## Migration from Basic to Enhanced

To switch from `one-click-deploy.sh` to `one-click-deploy-enhanced.sh`:

1. **Both scripts can coexist** - No conflicts
2. **Use enhanced for new deployments:**
   ```bash
   ./one-click-deploy-enhanced.sh
   ```
3. **Snapshots and checkpoints** are only in enhanced version
4. **Logs persist** in `logs/` directory (not `/tmp`)

## Future Enhancements

Planned improvements for future versions:
- Docker container support for complete isolation
- Multi-environment deployment (dev/staging/prod)
- Automated database migrations
- Integration test suite execution
- Performance benchmarking
- Slack/email notifications
- Cloud deployment (AWS/Azure/GCP)

## Support

- **Issues**: Check `logs/deployment-*.log` for detailed errors
- **Documentation**: See `ONE_CLICK_DEPLOYMENT.md` for basics
- **Integration Flow**: See `INTEGRATION_FLOW.md` for architecture

---

**Enhanced deployment delivers production-grade reliability with zero-downtime recovery.** 🚀
