# MCP Repository Sync System

This system provides automated synchronization with a private MCP (Model Context Protocol) repository, including branch watching, merge detection, and rollback capabilities.

## Overview

The MCP Sync System consists of three main components:

1. **Configuration** (`mcp-sync-config.json`) - Defines sync behavior and settings
2. **Sync Script** (`scripts/mcp-sync.sh`) - Handles repository operations
3. **Watch Agent** (`.github/workflows/mcp-branch-watch.yml`) - Automated monitoring

## Features

### 🔄 Automatic Synchronization
- Monitors private MCP repository for changes
- Syncs multiple branches (main, develop, staging)
- Creates local hardcopy clones
- Runs every 5 minutes via GitHub Actions

### 🔀 Merge Detection
- Automatically detects merge commits
- Triggers full stack updates on merge events
- Provides detailed merge summaries

### ⏪ Rollback Capabilities
- Creates snapshots before each sync
- Maintains last 10 snapshots by default
- One-command rollback to previous state
- Preserves metadata for each snapshot

### 📊 Status Monitoring
- Real-time sync status
- Commit tracking and comparison
- Snapshot inventory
- Detailed logging

## Setup

### Prerequisites

1. **GitHub Token**: Create a Personal Access Token with `repo` scope
   - Go to: https://github.com/settings/tokens
   - Generate new token (classic)
   - Select scope: `repo` (Full control of private repositories)
   - Copy the token

2. **Environment Variable**: Add token to your environment
   ```bash
   export GITHUB_TOKEN="your-github-token-here"
   ```

3. **GitHub Actions Secret**: For automated workflows
   - Go to: Repository Settings → Secrets and variables → Actions
   - Create new secret: `MCP_SYNC_TOKEN`
   - Paste your GitHub token

### Configuration

Edit `mcp-sync-config.json` to customize:

```json
{
  "mcp": {
    "sourceRepo": {
      "owner": "creditXcredit",
      "name": "mcp-private",
      "githubAppInstallationId": "95367223",
      "defaultBranch": "main"
    },
    "localPath": ".mcp-clone",
    "syncBranches": ["main", "develop", "staging"],
    "watchInterval": 300000,
    "autoSync": true
  }
}
```

### GitHub App Integration

This system is designed to work with GitHub App installation ID `95367223`:
- https://github.com/organizations/creditXcredit/settings/installations/95367223

The GitHub App provides enhanced permissions for private repository access.

## Usage

### Manual Sync Commands

```bash
# Full sync (clone or update)
./scripts/mcp-sync.sh sync

# Check for updates (without syncing)
./scripts/mcp-sync.sh check

# Show sync status
./scripts/mcp-sync.sh status

# Rollback to previous snapshot
./scripts/mcp-sync.sh rollback
```

### Automated Sync (GitHub Actions)

The watch agent runs automatically every 5 minutes:
- Checks for new commits in MCP repository
- Syncs changes if detected
- Creates rollback snapshots
- Detects and reports merge events

#### Manual Workflow Trigger

You can manually trigger the workflow:

1. Go to: Actions → MCP Branch Watch Agent
2. Click "Run workflow"
3. Select action:
   - `sync` - Perform full sync
   - `check` - Check for updates only
   - `status` - Show current status
   - `rollback` - Rollback to previous snapshot

## Directory Structure

```
workstation/
├── mcp-sync-config.json          # Configuration file
├── scripts/
│   └── mcp-sync.sh               # Sync script
├── .github/workflows/
│   └── mcp-branch-watch.yml      # Watch agent workflow
├── .mcp-clone/                   # Local MCP repository clone (gitignored)
├── .mcp-rollback/                # Rollback snapshots (gitignored)
│   ├── snapshot-20241119-120000/
│   ├── snapshot-20241119-120500/
│   └── ...
└── logs/
    └── mcp-sync.log              # Sync operation logs
```

## Workflow Details

### Sync Process

1. **Pre-Sync Snapshot**
   - Creates rollback snapshot of current state
   - Stores branch and commit metadata
   - Cleans up old snapshots (keeps last 10)

2. **Repository Clone/Update**
   - Clones repo if not exists
   - Fetches all updates if exists
   - Updates default branch

3. **Branch Synchronization**
   - Syncs all configured branches
   - Creates local branches if needed
   - Pulls latest changes

4. **Merge Detection**
   - Scans last 10 commits for merges
   - Reports merge count and details
   - Triggers full stack update if merges found

5. **Post-Sync**
   - Commits synced changes
   - Updates sync logs
   - Reports status

### Rollback Process

1. **Snapshot Selection**
   - Identifies latest snapshot
   - Verifies snapshot integrity
   - Reads snapshot metadata

2. **State Preservation**
   - Backs up current state
   - Saved as `.mcp-clone.before-rollback`

3. **State Restoration**
   - Restores snapshot to `.mcp-clone`
   - Preserves all files and history
   - Restores exact commit state

## Monitoring

### Logs

All sync operations are logged to `logs/mcp-sync.log`:

```bash
# View recent sync activity
tail -f logs/mcp-sync.log

# Search for errors
grep ERROR logs/mcp-sync.log

# View sync history
cat logs/mcp-sync.log
```

### GitHub Actions Summary

Each workflow run provides:
- Sync status and timestamp
- Latest commits from MCP repo
- Merge event detection
- Rollback snapshot count
- Error reporting

### Issue Creation on Failure

If sync fails, an issue is automatically created with:
- Failure timestamp and details
- Link to failed workflow run
- Action items checklist
- Recovery instructions

## Troubleshooting

### Sync Fails with Authentication Error

**Problem**: `GITHUB_TOKEN environment variable not set` or permission denied

**Solution**:
```bash
# Set token in environment
export GITHUB_TOKEN="your-token-here"

# Verify token has repo scope
# Check: https://github.com/settings/tokens
```

### Repository Not Found

**Problem**: 404 error when accessing MCP repository

**Solution**:
1. Verify repository name in `mcp-sync-config.json`
2. Ensure token has access to private repo
3. Check organization membership
4. Verify GitHub App installation

### Snapshot Directory Full

**Problem**: Too many snapshots consuming disk space

**Solution**:
```bash
# Reduce snapshot count in config
# Edit mcp-sync-config.json:
"rollback": {
  "keepSnapshots": 5  # Reduce from 10 to 5
}

# Or manually clean up
rm -rf .mcp-rollback/snapshot-older-than-needed
```

### Merge Detection Not Working

**Problem**: Merges not detected or reported

**Solution**:
1. Check if merge commits exist: `cd .mcp-clone && git log --merges -10`
2. Verify workflow permissions in `.github/workflows/mcp-branch-watch.yml`
3. Check GitHub Actions logs for errors

## Security

### Token Management

- Never commit tokens to repository
- Use GitHub Secrets for automation
- Rotate tokens periodically
- Use minimum required permissions

### Private Repository Access

- MCP repository access via GitHub App installation
- Token scoped to specific repositories
- Audit token usage regularly

### Snapshot Security

- Snapshots stored locally (not committed)
- Contains full repository history
- Include in `.gitignore`
- Clean up when no longer needed

## Integration with Full Stack Updates

When merges are detected, the system can trigger:

1. **MCP Integration Updates**
   - Update MCP configurations
   - Sync protocol definitions
   - Update API specifications

2. **Dependency Updates**
   - Update package dependencies
   - Sync shared libraries
   - Update type definitions

3. **Documentation Sync**
   - Update MCP documentation
   - Sync API references
   - Update integration guides

4. **Testing Pipeline**
   - Run integration tests
   - Verify MCP compatibility
   - Validate protocol changes

## Maintenance

### Regular Tasks

**Weekly**:
- Review sync logs
- Verify snapshots are created
- Check token expiration
- Monitor disk usage

**Monthly**:
- Clean old snapshots manually if needed
- Review and update branch list
- Audit sync configuration
- Update documentation

**Quarterly**:
- Rotate GitHub tokens
- Review GitHub App permissions
- Update workflow schedules
- Performance optimization

## Support

For issues or questions:

1. Check logs: `cat logs/mcp-sync.log`
2. Review GitHub Actions runs
3. Check automatically created issues
4. Verify configuration in `mcp-sync-config.json`

## License

ISC License - See LICENSE file for details
