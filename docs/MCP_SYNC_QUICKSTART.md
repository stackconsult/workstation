# Quick Start: MCP Repository Sync

Get started with the MCP Repository Sync System in 5 minutes.

## Step 1: Create GitHub Token

1. Go to [GitHub Settings → Tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Give it a name: `MCP Sync Token`
4. Select scope: `repo` (Full control of private repositories)
5. Click "Generate token"
6. **Copy the token immediately** (you won't see it again!)

## Step 2: Configure Token

### For Local Use

```bash
# Add to your shell profile (~/.bashrc or ~/.zshrc)
export GITHUB_TOKEN="your-token-here"

# Or set for current session only
export GITHUB_TOKEN="your-token-here"
```

### For GitHub Actions

1. Go to your repository on GitHub
2. Click Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `MCP_SYNC_TOKEN`
5. Value: Paste your token
6. Click "Add secret"

## Step 3: Test the Sync

```bash
# Check sync status (doesn't require token)
./scripts/mcp-sync.sh status

# Test connection and check for updates
./scripts/mcp-sync.sh check

# Perform first sync
./scripts/mcp-sync.sh sync
```

Expected output:
```
[INFO] === MCP Repository Sync Started ===
[INFO] Source: creditXcredit/mcp-private
[INFO] Target: /path/to/workstation/.mcp-clone
[INFO] Cloning repository for the first time...
[SUCCESS] Repository cloned successfully
[INFO] Syncing branches...
[INFO] Syncing branch: main
[SUCCESS] Branch main synced
[SUCCESS] === MCP Repository Sync Completed ===
```

## Step 4: Verify the Sync

```bash
# Check what was synced
ls -la .mcp-clone/

# View sync logs
cat logs/mcp-sync.log

# Check sync status
./scripts/mcp-sync.sh status
```

## Step 5: Enable Automated Sync

The branch watch agent is already configured and will run automatically every 5 minutes via GitHub Actions. No additional setup needed!

To trigger it manually:
1. Go to Actions → MCP Branch Watch Agent
2. Click "Run workflow"
3. Choose "sync" and click "Run workflow"

## What Happens Now?

### Automatic Monitoring (Every 5 Minutes)
- ✅ Checks MCP repository for new commits
- ✅ Syncs changes automatically
- ✅ Creates rollback snapshots
- ✅ Detects merge events
- ✅ Reports status in GitHub Actions

### When Merges Are Detected
- 🔀 Automatically triggers full stack update
- 📊 Provides detailed merge summaries
- 🔔 Creates commit with sync updates

### Rollback Safety
- 💾 Snapshot created before each sync
- ⏪ Keep last 10 snapshots
- 🔙 One-command rollback available

## Common Commands

```bash
# Check for updates (no sync)
./scripts/mcp-sync.sh check

# Full sync
./scripts/mcp-sync.sh sync

# View status
./scripts/mcp-sync.sh status

# Rollback to previous version
./scripts/mcp-sync.sh rollback
```

## Troubleshooting

### "GITHUB_TOKEN environment variable not set"

**Solution**: Export your token
```bash
export GITHUB_TOKEN="your-token-here"
```

### "Repository not found" or "Permission denied"

**Solutions**:
1. Verify token has `repo` scope
2. Check you have access to `creditXcredit/mcp-private`
3. Verify GitHub App installation: https://github.com/organizations/creditXcredit/settings/installations/95367223

### Sync not working in GitHub Actions

**Solutions**:
1. Verify `MCP_SYNC_TOKEN` secret is set in repository settings
2. Check workflow run logs: Actions → MCP Branch Watch Agent
3. Ensure workflow has necessary permissions

## Next Steps

- 📖 Read full documentation: [docs/MCP_SYNC_SYSTEM.md](MCP_SYNC_SYSTEM.md)
- 🔧 Customize configuration: Edit `mcp-sync-config.json`
- 📊 Monitor sync logs: `tail -f logs/mcp-sync.log`
- 🎯 Integrate with your workflow

## Need Help?

- Check logs: `cat logs/mcp-sync.log`
- View GitHub Actions runs: Actions → MCP Branch Watch Agent
- Review configuration: `cat mcp-sync-config.json`
- Full docs: [docs/MCP_SYNC_SYSTEM.md](MCP_SYNC_SYSTEM.md)
