#!/bin/bash

# MCP Repository Sync Script
# Syncs with private MCP repository using GitHub App authentication

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CONFIG_FILE="$PROJECT_ROOT/mcp-sync-config.json"
LOG_FILE="$PROJECT_ROOT/logs/mcp-sync.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} [${level}] ${message}" | tee -a "$LOG_FILE"
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $@"
    log "INFO" "$@"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $@"
    log "SUCCESS" "$@"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $@"
    log "WARNING" "$@"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $@"
    log "ERROR" "$@"
}

# Ensure log directory exists
mkdir -p "$PROJECT_ROOT/logs"

# Load configuration
if [ ! -f "$CONFIG_FILE" ]; then
    log_error "Configuration file not found: $CONFIG_FILE"
    exit 1
fi

# Parse config using jq
MCP_OWNER=$(jq -r '.mcp.sourceRepo.owner' "$CONFIG_FILE")
MCP_REPO=$(jq -r '.mcp.sourceRepo.name' "$CONFIG_FILE")
MCP_DEFAULT_BRANCH=$(jq -r '.mcp.sourceRepo.defaultBranch' "$CONFIG_FILE")
LOCAL_PATH=$(jq -r '.mcp.localPath' "$CONFIG_FILE")
ROLLBACK_PATH=$(jq -r '.mcp.rollback.snapshotPath' "$CONFIG_FILE")
SYNC_BRANCHES=$(jq -r '.mcp.syncBranches[]' "$CONFIG_FILE")

FULL_LOCAL_PATH="$PROJECT_ROOT/$LOCAL_PATH"
FULL_ROLLBACK_PATH="$PROJECT_ROOT/$ROLLBACK_PATH"

log_info "=== MCP Repository Sync Started ==="
log_info "Source: $MCP_OWNER/$MCP_REPO"
log_info "Target: $FULL_LOCAL_PATH"

# Check for GitHub token
if [ -z "${GITHUB_TOKEN:-}" ]; then
    log_error "GITHUB_TOKEN environment variable not set"
    log_error "Please set GITHUB_TOKEN with appropriate permissions"
    exit 1
fi

# Function to create rollback snapshot
create_rollback_snapshot() {
    if [ ! -d "$FULL_LOCAL_PATH" ]; then
        log_info "No existing clone to snapshot"
        return 0
    fi
    
    local snapshot_name="snapshot-$(date +%Y%m%d-%H%M%S)"
    local snapshot_path="$FULL_ROLLBACK_PATH/$snapshot_name"
    
    mkdir -p "$FULL_ROLLBACK_PATH"
    
    log_info "Creating rollback snapshot: $snapshot_name"
    
    # Create hardcopy snapshot
    cp -r "$FULL_LOCAL_PATH" "$snapshot_path"
    
    # Store metadata
    cat > "$snapshot_path/.snapshot-metadata.json" <<EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "branch": "$(cd "$FULL_LOCAL_PATH" && git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')",
  "commit": "$(cd "$FULL_LOCAL_PATH" && git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "description": "Auto-snapshot before sync"
}
EOF
    
    log_success "Snapshot created: $snapshot_name"
    
    # Cleanup old snapshots (keep last N)
    local keep_count=$(jq -r '.mcp.rollback.keepSnapshots' "$CONFIG_FILE")
    local snapshot_count=$(find "$FULL_ROLLBACK_PATH" -maxdepth 1 -type d -name "snapshot-*" | wc -l)
    
    if [ "$snapshot_count" -gt "$keep_count" ]; then
        log_info "Cleaning up old snapshots (keeping last $keep_count)"
        find "$FULL_ROLLBACK_PATH" -maxdepth 1 -type d -name "snapshot-*" | \
            sort | head -n -"$keep_count" | xargs rm -rf
    fi
}

# Function to sync repository
sync_repository() {
    local repo_url="https://x-access-token:${GITHUB_TOKEN}@github.com/${MCP_OWNER}/${MCP_REPO}.git"
    
    if [ ! -d "$FULL_LOCAL_PATH" ]; then
        log_info "Cloning repository for the first time..."
        git clone "$repo_url" "$FULL_LOCAL_PATH"
        log_success "Repository cloned successfully"
    else
        log_info "Updating existing clone..."
        cd "$FULL_LOCAL_PATH"
        
        # Fetch all updates
        git fetch --all --prune
        
        # Update default branch
        git checkout "$MCP_DEFAULT_BRANCH"
        git pull origin "$MCP_DEFAULT_BRANCH"
        
        log_success "Repository updated successfully"
    fi
}

# Function to sync specific branches
sync_branches() {
    cd "$FULL_LOCAL_PATH"
    
    log_info "Syncing branches..."
    
    for branch in $SYNC_BRANCHES; do
        log_info "Syncing branch: $branch"
        
        # Check if branch exists remotely
        if git ls-remote --heads origin "$branch" | grep -q "$branch"; then
            # Check if branch exists locally
            if git show-ref --verify --quiet "refs/heads/$branch"; then
                git checkout "$branch"
                git pull origin "$branch"
            else
                git checkout -b "$branch" "origin/$branch"
            fi
            log_success "Branch $branch synced"
        else
            log_warning "Branch $branch does not exist on remote"
        fi
    done
    
    # Return to default branch
    git checkout "$MCP_DEFAULT_BRANCH"
}

# Function to check for new merges
check_for_merges() {
    cd "$FULL_LOCAL_PATH"
    
    local current_commit=$(git rev-parse HEAD)
    local remote_commit=$(git rev-parse "origin/$MCP_DEFAULT_BRANCH")
    
    if [ "$current_commit" != "$remote_commit" ]; then
        log_info "New commits detected on $MCP_DEFAULT_BRANCH"
        log_info "Current: $current_commit"
        log_info "Remote:  $remote_commit"
        
        # Get commit messages
        git log --oneline "$current_commit..$remote_commit" | while read line; do
            log_info "  - $line"
        done
        
        return 0
    else
        log_info "No new commits on $MCP_DEFAULT_BRANCH"
        return 1
    fi
}

# Main sync process
main() {
    local mode="${1:-sync}"
    
    case "$mode" in
        sync)
            log_info "Running full sync..."
            create_rollback_snapshot
            sync_repository
            sync_branches
            log_success "=== MCP Repository Sync Completed ==="
            ;;
        
        check)
            log_info "Checking for updates..."
            if [ ! -d "$FULL_LOCAL_PATH" ]; then
                log_info "Repository not cloned yet. Run 'sync' first."
                exit 1
            fi
            cd "$FULL_LOCAL_PATH"
            git fetch origin "$MCP_DEFAULT_BRANCH"
            check_for_merges
            ;;
        
        rollback)
            log_info "Rolling back to previous snapshot..."
            local latest_snapshot=$(find "$FULL_ROLLBACK_PATH" -maxdepth 1 -type d -name "snapshot-*" | sort | tail -n 1)
            
            if [ -z "$latest_snapshot" ]; then
                log_error "No snapshots available for rollback"
                exit 1
            fi
            
            log_info "Rolling back to: $(basename "$latest_snapshot")"
            
            # Backup current state before rollback
            if [ -d "$FULL_LOCAL_PATH" ]; then
                mv "$FULL_LOCAL_PATH" "${FULL_LOCAL_PATH}.before-rollback"
            fi
            
            # Restore snapshot
            cp -r "$latest_snapshot" "$FULL_LOCAL_PATH"
            
            log_success "Rollback completed"
            log_info "Previous state saved to: ${FULL_LOCAL_PATH}.before-rollback"
            ;;
        
        status)
            log_info "=== MCP Sync Status ==="
            
            if [ -d "$FULL_LOCAL_PATH" ]; then
                cd "$FULL_LOCAL_PATH"
                log_info "Repository: $MCP_OWNER/$MCP_REPO"
                log_info "Local path: $FULL_LOCAL_PATH"
                log_info "Current branch: $(git rev-parse --abbrev-ref HEAD)"
                log_info "Last commit: $(git log -1 --format='%h - %s (%ar)')"
                
                # Check sync status
                git fetch origin "$MCP_DEFAULT_BRANCH" 2>/dev/null || true
                local behind=$(git rev-list --count HEAD..origin/"$MCP_DEFAULT_BRANCH" 2>/dev/null || echo "?")
                local ahead=$(git rev-list --count origin/"$MCP_DEFAULT_BRANCH"..HEAD 2>/dev/null || echo "?")
                
                log_info "Sync status: $ahead commits ahead, $behind commits behind"
                
                # List snapshots
                local snapshot_count=$(find "$FULL_ROLLBACK_PATH" -maxdepth 1 -type d -name "snapshot-*" 2>/dev/null | wc -l)
                log_info "Available rollback snapshots: $snapshot_count"
            else
                log_warning "Repository not cloned yet. Run './scripts/mcp-sync.sh sync'"
            fi
            ;;
        
        *)
            log_error "Unknown mode: $mode"
            echo "Usage: $0 {sync|check|rollback|status}"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
