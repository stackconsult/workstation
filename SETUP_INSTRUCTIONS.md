# 🚀 GitHub Private Backup - Quick Setup

## What You Got

A complete MCP container infrastructure for immutable daily backups of `creditXcredit/mcp-private` with automated restore capabilities.

## Setup in 3 Steps (5 Minutes)

### Step 1: Create GitHub Token

1. Go to: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Name: `GitHub Private Backup Token`
4. Select scope: ✅ **repo** (Full control of private repositories)
5. Expiration: 90 days
6. Click "Generate token"
7. **Copy the token** (you won't see it again!)

### Step 2: Add Token to GitHub Secrets

1. Go to: https://github.com/creditXcredit/workstation/settings/secrets/actions
2. Click "New repository secret"
3. Name: `GITHUB_PRIVATE_TOKEN`
4. Value: Paste your token
5. Click "Add secret"

### Step 3: Run Initialization

```bash
cd workstation

# Export your token (or it will prompt you)
export GITHUB_PRIVATE_TOKEN="ghp_your_token_here"

# Run the one-command setup
./scripts/init-github-backup.sh

# That's it! The script will:
# ✅ Create directories
# ✅ Build container
# ✅ Start container
# ✅ Clone mcp-private
# ✅ Create first snapshot
```

## Verify It Works

```bash
# Check container is running
docker ps | grep github-private-backup

# View backup status
docker exec github-private-backup backup-manager status

# Expected output:
# Repository: Initialized ✓
# Current commit: abc123d
# Total snapshots: 1
```

## What Happens Next (Automatic)

✅ **Daily at 2 AM UTC**: GitHub Actions syncs with `mcp-private`  
✅ **If updates found**: Creates compressed snapshot  
✅ **After 30 days**: Auto-deletes old snapshots  
✅ **If backup fails**: Creates GitHub issue to alert you  

**You don't need to do anything else!** The system runs automatically.

## Common Commands

```bash
# Check status
docker exec github-private-backup backup-manager status

# Force sync now
docker exec github-private-backup backup-manager sync

# Create manual snapshot
docker exec github-private-backup backup-manager snapshot

# Restore from latest
docker exec github-private-backup backup-manager restore latest

# View logs
docker exec github-private-backup cat /backup/logs/backup-$(date +%Y%m%d).log
```

## Documentation

📖 **Detailed Guides** (if you need more info):
- Setup Guide: `docs/GITHUB_PRIVATE_BACKUP_SETUP.md`
- Quick Reference: `docs/GITHUB_PRIVATE_BACKUP_QUICKREF.md`
- Integration Guide: `docs/GITHUB_PRIVATE_BACKUP_INTEGRATION.md`
- Implementation Summary: `MCP_BACKUP_IMPLEMENTATION_COMPLETE.md`

## What's Inside

```
workstation/
├── mcp-containers/
│   └── github-private-backup-mcp/         ← Backup container
│       ├── Dockerfile                     ← Container image
│       ├── backup-manager.sh              ← CLI tool (5 commands)
│       └── README.md                      ← Container docs
│
├── docker-compose.github-backup.yml       ← Container orchestration
├── .github/workflows/
│   └── github-private-daily-backup.yml    ← Daily automation
│
├── scripts/
│   └── init-github-backup.sh              ← One-command setup
│
└── data/github-private-backup/            ← Created by setup
    ├── immutable/                         ← Full repository
    ├── snapshots/                         ← Daily backups (30 days)
    └── logs/                              ← Operation logs
```

## Architecture

```
┌─────────────────────────────────────┐
│   GitHub mcp-private Repo      │
│   (Your source of truth)           │
└──────────────┬──────────────────────┘
               │
               │ Daily Sync @ 2 AM UTC
               │ (GitHub Actions)
               ▼
┌─────────────────────────────────────┐
│  GitHub Private Backup Container   │
│  ┌───────────────────────────────┐ │
│  │ /backup/immutable/            │ │ ← Full clone
│  │   └── mcp-private/        │ │
│  ├───────────────────────────────┤ │
│  │ /backup/snapshots/            │ │ ← 30-day history
│  │   ├── snapshot-20241119.tar.gz│ │
│  │   ├── snapshot-20241120.tar.gz│ │
│  │   └── ...                     │ │
│  ├───────────────────────────────┤ │
│  │ /backup/logs/                 │ │ ← Operation logs
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
               │
               │ Accessible via
               │ docker exec
               ▼
    Your workstation can access
    backup data if needed
```

## Troubleshooting

**Container won't start?**
```bash
docker logs github-private-backup
docker-compose -f docker-compose.github-backup.yml restart
```

**Token not working?**
```bash
# Verify token is set
docker exec github-private-backup env | grep GITHUB_TOKEN

# Restart with token
docker-compose -f docker-compose.github-backup.yml down
export GITHUB_PRIVATE_TOKEN="your_token"
docker-compose -f docker-compose.github-backup.yml up -d
```

**Need help?**
- Check `docs/GITHUB_PRIVATE_BACKUP_SETUP.md` troubleshooting section
- Review logs: `docker logs github-private-backup`
- Create issue in repository

## Future: Add More Repositories

Want to backup other repos? It's easy! Use this as a template:

1. Copy `mcp-containers/github-private-backup-mcp/` to new name
2. Update `backup-manager.sh` with new repo URL
3. Copy `docker-compose.github-backup.yml` and update names
4. Copy GitHub Actions workflow and update references
5. Run initialization

**Time per new repository**: ~15 minutes

## Key Features

✅ Immutable storage (never lost)  
✅ Daily automated backups  
✅ 30-day point-in-time recovery  
✅ One-command restore  
✅ Space-efficient (hardlinks)  
✅ Secure (non-root, isolated)  
✅ Automated (no human needed)  
✅ Well documented (4 guides)

## Summary

You now have:
- 🔒 **Immutable backup** of `mcp-private`
- 📅 **Daily snapshots** for 30 days
- 🔄 **Automated sync** via GitHub Actions
- ⚡ **Quick restore** from any snapshot
- 📚 **Complete documentation**
- 🚀 **Template** for future repos

**Status**: ✅ Ready to use after 3-step setup above!

---

**Need Help?** Check the comprehensive docs in the `docs/` folder or create an issue.
