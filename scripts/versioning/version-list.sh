#!/bin/bash

# version-list.sh - List all available versions with details
# Part of the 10-version rollback system

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
VERSIONS_DIR="$REPO_ROOT/.versions"
INDEX_FILE="$VERSIONS_DIR/index.json"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Version History ===${NC}\n"

# Check if versions directory exists
if [ ! -d "$VERSIONS_DIR" ]; then
    echo -e "${YELLOW}No versions found. Run version-create.sh to create the first version.${NC}"
    exit 0
fi

# Check if index file exists
if [ ! -f "$INDEX_FILE" ]; then
    echo -e "${YELLOW}No version index found. Run version-create.sh to create the first version.${NC}"
    exit 0
fi

# Read and parse index
if command -v jq &> /dev/null; then
    # Use jq if available for better formatting
    VERSIONS=$(jq -r '.versions[] | "\(.tag)|\(.timestamp)|\(.description)|\(.docker_image)|\(.git_commit)"' "$INDEX_FILE")
    
    echo -e "${GREEN}Available Versions:${NC}\n"
    echo "Tag             | Timestamp           | Description                    | Docker Image        | Git Commit"
    echo "----------------|---------------------|--------------------------------|---------------------|------------"
    
    while IFS='|' read -r tag timestamp desc docker commit; do
        printf "%-15s | %-19s | %-30s | %-19s | %s\n" "$tag" "$timestamp" "$desc" "$docker" "${commit:0:8}"
    done <<< "$VERSIONS"
    
    # Show current version
    CURRENT=$(jq -r '.current_version' "$INDEX_FILE")
    echo -e "\n${GREEN}Current Version:${NC} $CURRENT"
    
    # Show total count
    COUNT=$(jq -r '.versions | length' "$INDEX_FILE")
    echo -e "${GREEN}Total Versions:${NC} $COUNT"
    
else
    # Fallback to basic parsing without jq
    echo -e "${GREEN}Available Versions:${NC}\n"
    
    # Extract versions manually
    grep -o '"tag":"[^"]*"' "$INDEX_FILE" | cut -d'"' -f4 | while read -r tag; do
        echo "  - $tag"
    done
    
    # Show current version
    CURRENT=$(grep -o '"current_version":"[^"]*"' "$INDEX_FILE" | cut -d'"' -f4)
    echo -e "\n${GREEN}Current Version:${NC} $CURRENT"
fi

# Show disk usage
echo -e "\n${BLUE}=== Disk Usage ===${NC}\n"
du -sh "$VERSIONS_DIR"/{docker,mcp} 2>/dev/null || echo "Version directories not yet created"

# Show latest 3 versions with more details
if command -v jq &> /dev/null; then
    echo -e "\n${BLUE}=== Latest 3 Versions (Details) ===${NC}\n"
    jq -r '.versions[-3:] | reverse | .[] | "Tag: \(.tag)\nTimestamp: \(.timestamp)\nDescription: \(.description)\nDocker Image: \(.docker_image)\nGit Commit: \(.git_commit)\nMCP Backup: \(.mcp_backup)\nAgent Backup: \(.agent_backup)\nWorkflow Backup: \(.workflow_backup)\n---"' "$INDEX_FILE"
fi

echo -e "\n${GREEN}Use version-rollback.sh <tag> to rollback to a specific version${NC}"
