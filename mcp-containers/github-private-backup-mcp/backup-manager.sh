#!/bin/bash

# GitHub Private Repository Backup Manager
# Manages immutable backups with daily snapshot capabilities

set -euo pipefail

BACKUP_ROOT="/backup"
IMMUTABLE_PATH="$BACKUP_ROOT/immutable"
SNAPSHOTS_PATH="$BACKUP_ROOT/snapshots"
LOGS_PATH="$BACKUP_ROOT/logs"
LOG_FILE="$LOGS_PATH/backup-$(date +%Y%m%d).log"

# Ensure log directory exists
mkdir -p "$LOGS_PATH"

# Logging functions
log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

log_info() { log "INFO" "$@"; }
log_success() { log "SUCCESS" "$@"; }
log_error() { log "ERROR" "$@"; }

# Command handling
COMMAND=${1:-help}

case "$COMMAND" in
    init)
        log_info "Initializing backup repository..."
        
        if [ -z "${GITHUB_TOKEN:-}" ]; then
            log_error "GITHUB_TOKEN environment variable not set"
            exit 1
        fi
        
        REPO_URL="https://x-access-token:${GITHUB_TOKEN}@github.com/creditXcredit/mcp-private.git"
        
        if [ -d "$IMMUTABLE_PATH/.git" ]; then
            log_info "Repository already initialized, pulling latest..."
            cd "$IMMUTABLE_PATH"
            git fetch --all
            git pull origin main
        else
            log_info "Cloning repository..."
            git clone "$REPO_URL" "$IMMUTABLE_PATH"
        fi
        
        log_success "Repository initialized successfully"
        ;;
        
    snapshot)
        log_info "Creating daily snapshot..."
        
        if [ ! -d "$IMMUTABLE_PATH/.git" ]; then
            log_error "Immutable repository not initialized. Run 'init' first."
            exit 1
        fi
        
        # Create snapshot directory with timestamp
        SNAPSHOT_NAME="snapshot-$(date +%Y%m%d-%H%M%S)"
        SNAPSHOT_DIR="$SNAPSHOTS_PATH/$SNAPSHOT_NAME"
        
        mkdir -p "$SNAPSHOTS_PATH"
        
        log_info "Creating snapshot: $SNAPSHOT_NAME"
        
        # Create hardlink snapshot for space efficiency
        cp -al "$IMMUTABLE_PATH" "$SNAPSHOT_DIR"
        
        # Create metadata
        cat > "$SNAPSHOT_DIR/.snapshot-metadata.json" <<EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "snapshot_name": "$SNAPSHOT_NAME",
  "source": "$IMMUTABLE_PATH",
  "commit_hash": "$(cd $IMMUTABLE_PATH && git rev-parse HEAD)",
  "commit_date": "$(cd $IMMUTABLE_PATH && git log -1 --format=%cd)",
  "commit_message": "$(cd $IMMUTABLE_PATH && git log -1 --format=%s)"
}
EOF
        
        # Compress snapshot
        cd "$SNAPSHOTS_PATH"
        tar czf "${SNAPSHOT_NAME}.tar.gz" "$SNAPSHOT_NAME"
        
        # Remove uncompressed snapshot to save space
        rm -rf "$SNAPSHOT_NAME"
        
        log_success "Snapshot created: ${SNAPSHOT_NAME}.tar.gz"
        
        # Cleanup old snapshots (keep last 30 days)
        find "$SNAPSHOTS_PATH" -name "snapshot-*.tar.gz" -mtime +30 -delete
        log_info "Cleaned up snapshots older than 30 days"
        ;;
        
    sync)
        log_info "Syncing with remote repository..."
        
        if [ ! -d "$IMMUTABLE_PATH/.git" ]; then
            log_error "Immutable repository not initialized. Run 'init' first."
            exit 1
        fi
        
        if [ -z "${GITHUB_TOKEN:-}" ]; then
            log_error "GITHUB_TOKEN environment variable not set"
            exit 1
        fi
        
        cd "$IMMUTABLE_PATH"
        
        # Fetch latest changes
        git fetch --all
        
        # Check if there are updates
        LOCAL_HASH=$(git rev-parse HEAD)
        REMOTE_HASH=$(git rev-parse origin/main)
        
        if [ "$LOCAL_HASH" != "$REMOTE_HASH" ]; then
            log_info "Updates detected, syncing..."
            git pull origin main
            log_success "Sync completed successfully"
            
            # Auto-create snapshot after sync
            $0 snapshot
        else
            log_info "Already up-to-date"
        fi
        ;;
        
    restore)
        SNAPSHOT_NAME=${2:-latest}
        log_info "Restoring from snapshot: $SNAPSHOT_NAME"
        
        if [ "$SNAPSHOT_NAME" = "latest" ]; then
            SNAPSHOT_FILE=$(ls -t "$SNAPSHOTS_PATH"/snapshot-*.tar.gz 2>/dev/null | head -1)
        else
            SNAPSHOT_FILE="$SNAPSHOTS_PATH/${SNAPSHOT_NAME}.tar.gz"
        fi
        
        if [ ! -f "$SNAPSHOT_FILE" ]; then
            log_error "Snapshot not found: $SNAPSHOT_FILE"
            exit 1
        fi
        
        log_info "Restoring from: $SNAPSHOT_FILE"
        
        # Backup current state
        if [ -d "$IMMUTABLE_PATH" ]; then
            mv "$IMMUTABLE_PATH" "${IMMUTABLE_PATH}.backup-$(date +%Y%m%d-%H%M%S)"
        fi
        
        # Extract snapshot
        cd "$BACKUP_ROOT"
        tar xzf "$SNAPSHOT_FILE"
        EXTRACTED_DIR=$(basename "$SNAPSHOT_FILE" .tar.gz)
        mv "$EXTRACTED_DIR" immutable
        
        log_success "Restore completed successfully"
        ;;
        
    status)
        log_info "Backup Status Report"
        echo ""
        
        if [ -d "$IMMUTABLE_PATH/.git" ]; then
            cd "$IMMUTABLE_PATH"
            echo "Repository: Initialized ✓"
            echo "Current commit: $(git rev-parse --short HEAD)"
            echo "Last updated: $(git log -1 --format=%cd)"
            echo "Branch: $(git branch --show-current)"
        else
            echo "Repository: Not initialized ✗"
        fi
        
        echo ""
        echo "Snapshots:"
        if [ -d "$SNAPSHOTS_PATH" ]; then
            SNAPSHOT_COUNT=$(ls -1 "$SNAPSHOTS_PATH"/*.tar.gz 2>/dev/null | wc -l)
            echo "  Total: $SNAPSHOT_COUNT"
            echo "  Latest snapshots:"
            ls -lht "$SNAPSHOTS_PATH"/*.tar.gz 2>/dev/null | head -5 | awk '{print "    " $9 " (" $5 ")"}'
        else
            echo "  No snapshots found"
        fi
        
        echo ""
        echo "Disk usage:"
        du -sh "$IMMUTABLE_PATH" 2>/dev/null || echo "  Immutable: N/A"
        du -sh "$SNAPSHOTS_PATH" 2>/dev/null || echo "  Snapshots: N/A"
        ;;
        
    help|*)
        cat <<EOF
GitHub Private Repository Backup Manager

Usage: backup-manager <command> [options]

Commands:
  init            Initialize the immutable backup repository
  snapshot        Create a daily snapshot of the current state
  sync            Sync with remote repository and auto-snapshot if updated
  restore [name]  Restore from a snapshot (use 'latest' or snapshot name)
  status          Show backup status and statistics
  help            Show this help message

Environment Variables:
  GITHUB_TOKEN    GitHub personal access token with repo access

Examples:
  backup-manager init
  backup-manager sync
  backup-manager snapshot
  backup-manager restore latest
  backup-manager status

EOF
        ;;
esac
