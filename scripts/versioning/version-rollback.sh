#!/bin/bash

# version-rollback.sh - Rollback to a specific version
# Part of the 10-version rollback system

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
VERSIONS_DIR="$REPO_ROOT/.versions"
INDEX_FILE="$VERSIONS_DIR/index.json"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check arguments
if [ $# -ne 1 ]; then
    echo -e "${RED}Usage: $0 <version-tag>${NC}"
    echo -e "\nExample: $0 v1.0.0"
    echo -e "\nAvailable versions:"
    "$SCRIPT_DIR/version-list.sh" | grep "^  - " || echo "  (none)"
    exit 1
fi

TARGET_VERSION="$1"

echo -e "${BLUE}=== Version Rollback System ===${NC}\n"

# Check if versions directory exists
if [ ! -d "$VERSIONS_DIR" ]; then
    echo -e "${RED}Error: No versions found. Nothing to rollback.${NC}"
    exit 1
fi

# Check if index file exists
if [ ! -f "$INDEX_FILE" ]; then
    echo -e "${RED}Error: No version index found.${NC}"
    exit 1
fi

# Check if jq is available
if ! command -v jq &> /dev/null; then
    echo -e "${RED}Error: jq is required for rollback operations.${NC}"
    echo "Please install jq: apt-get install jq"
    exit 1
fi

# Verify target version exists
if ! jq -e ".versions[] | select(.tag == \"$TARGET_VERSION\")" "$INDEX_FILE" > /dev/null; then
    echo -e "${RED}Error: Version $TARGET_VERSION not found.${NC}"
    echo -e "\nAvailable versions:"
    jq -r '.versions[].tag' "$INDEX_FILE"
    exit 1
fi

# Get current version
CURRENT_VERSION=$(jq -r '.current_version' "$INDEX_FILE")

if [ "$CURRENT_VERSION" == "$TARGET_VERSION" ]; then
    echo -e "${YELLOW}Already at version $TARGET_VERSION. Nothing to do.${NC}"
    exit 0
fi

echo -e "${GREEN}Current Version:${NC} $CURRENT_VERSION"
echo -e "${GREEN}Target Version:${NC} $TARGET_VERSION"
echo ""

# Get version details
GIT_COMMIT=$(jq -r ".versions[] | select(.tag == \"$TARGET_VERSION\") | .git_commit" "$INDEX_FILE")
DOCKER_IMAGE=$(jq -r ".versions[] | select(.tag == \"$TARGET_VERSION\") | .docker_image" "$INDEX_FILE")
MCP_BACKUP=$(jq -r ".versions[] | select(.tag == \"$TARGET_VERSION\") | .mcp_backup" "$INDEX_FILE")
AGENT_BACKUP=$(jq -r ".versions[] | select(.tag == \"$TARGET_VERSION\") | .agent_backup" "$INDEX_FILE")
WORKFLOW_BACKUP=$(jq -r ".versions[] | select(.tag == \"$TARGET_VERSION\") | .workflow_backup" "$INDEX_FILE")

echo -e "${YELLOW}WARNING: This will:${NC}"
echo "  1. Restore Git repository to commit: ${GIT_COMMIT:0:8}"
echo "  2. Restore MCP state from: $MCP_BACKUP"
echo "  3. Restore Agent configs from: $AGENT_BACKUP"
echo "  4. Restore Workflow configs from: $WORKFLOW_BACKUP"
echo "  5. Switch Docker image to: $DOCKER_IMAGE"
echo ""
echo -e "${RED}This action cannot be easily undone!${NC}"
echo -n "Are you sure you want to continue? (yes/no): "

read -r CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${YELLOW}Rollback cancelled.${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}=== Starting Rollback ===${NC}\n"

# Step 1: Create a safety snapshot of current state
echo -e "${GREEN}[1/6] Creating safety snapshot of current state...${NC}"
SAFETY_TAG="v-rollback-safety-$(date +%s)"
"$SCRIPT_DIR/version-create.sh" "$SAFETY_TAG" "Safety snapshot before rollback to $TARGET_VERSION" "minor"

# Step 2: Restore Git repository
echo -e "${GREEN}[2/6] Restoring Git repository to $GIT_COMMIT...${NC}"
cd "$REPO_ROOT"
git checkout "$GIT_COMMIT" -- .

# Step 3: Restore MCP state
echo -e "${GREEN}[3/6] Restoring MCP state...${NC}"
if [ -d "$MCP_BACKUP" ]; then
    rsync -av --delete "$MCP_BACKUP/" "$REPO_ROOT/mcp-state/"
    echo "  MCP state restored from $MCP_BACKUP"
else
    echo -e "${YELLOW}  Warning: MCP backup not found at $MCP_BACKUP${NC}"
fi

# Step 4: Restore Agent configurations
echo -e "${GREEN}[4/6] Restoring Agent configurations...${NC}"
if [ -d "$AGENT_BACKUP" ]; then
    rsync -av "$AGENT_BACKUP/" "$REPO_ROOT/agents/"
    echo "  Agent configs restored from $AGENT_BACKUP"
else
    echo -e "${YELLOW}  Warning: Agent backup not found at $AGENT_BACKUP${NC}"
fi

# Step 5: Restore Workflow configurations
echo -e "${GREEN}[5/6] Restoring Workflow configurations...${NC}"
if [ -d "$WORKFLOW_BACKUP" ]; then
    rsync -av "$WORKFLOW_BACKUP/" "$REPO_ROOT/src/workflow-templates/"
    echo "  Workflow configs restored from $WORKFLOW_BACKUP"
else
    echo -e "${YELLOW}  Warning: Workflow backup not found at $WORKFLOW_BACKUP${NC}"
fi

# Step 6: Update current version in index
echo -e "${GREEN}[6/6] Updating version index...${NC}"
jq ".current_version = \"$TARGET_VERSION\"" "$INDEX_FILE" > "${INDEX_FILE}.tmp"
mv "${INDEX_FILE}.tmp" "$INDEX_FILE"

echo ""
echo -e "${GREEN}=== Rollback Complete ===${NC}\n"
echo -e "${GREEN}Rolled back from:${NC} $CURRENT_VERSION"
echo -e "${GREEN}Rolled back to:${NC} $TARGET_VERSION"
echo -e "${GREEN}Git commit:${NC} ${GIT_COMMIT:0:8}"
echo -e "${GREEN}Docker image:${NC} $DOCKER_IMAGE"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Rebuild the project: npm run build"
echo "  2. Restart services if running"
echo "  3. Pull Docker image: docker pull $DOCKER_IMAGE"
echo ""
echo -e "${GREEN}A safety snapshot was created: $SAFETY_TAG${NC}"
echo "  Use this to rollback if needed: ./version-rollback.sh $SAFETY_TAG"
