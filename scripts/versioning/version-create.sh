#!/bin/bash

# Version Create Script
# Creates a new version snapshot with Docker image and MCP state backup

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
VERSIONS_DIR=".versions"
DOCKER_DIR="$VERSIONS_DIR/docker"
MCP_DIR="$VERSIONS_DIR/mcp"
INDEX_FILE="$VERSIONS_DIR/index.json"
MAX_VERSIONS=10

# Get version tag (semantic versioning)
VERSION=${1:-$(date +%Y%m%d-%H%M%S)}
DESCRIPTION=${2:-"Automated version snapshot"}

echo -e "${GREEN}Creating version snapshot: ${VERSION}${NC}"

# Create version directories
mkdir -p "$DOCKER_DIR/$VERSION"
mkdir -p "$MCP_DIR/$VERSION"

# Step 1: Backup MCP state
echo -e "${YELLOW}Step 1/5: Backing up MCP state...${NC}"
if [ -d "mcp-containers" ]; then
    cp -r mcp-containers "$MCP_DIR/$VERSION/"
    echo -e "${GREEN}✓ MCP containers backed up${NC}"
fi

if [ -d ".mcp" ]; then
    cp -r .mcp "$MCP_DIR/$VERSION/"
    echo -e "${GREEN}✓ MCP configuration backed up${NC}"
fi

# Step 2: Backup agent configurations
echo -e "${YELLOW}Step 2/5: Backing up agent configurations...${NC}"
if [ -d "agents" ]; then
    cp -r agents "$MCP_DIR/$VERSION/"
    echo -e "${GREEN}✓ Agent configurations backed up${NC}"
fi

# Step 3: Backup workflow configurations
echo -e "${YELLOW}Step 3/5: Backing up workflow configurations...${NC}"
if [ -d "src/automation/workflow" ]; then
    mkdir -p "$MCP_DIR/$VERSION/workflow"
    cp -r src/automation/workflow "$MCP_DIR/$VERSION/workflow/"
    echo -e "${GREEN}✓ Workflow configurations backed up${NC}"
fi

if [ -d "src/workflow-templates" ]; then
    cp -r src/workflow-templates "$MCP_DIR/$VERSION/"
    echo -e "${GREEN}✓ Workflow templates backed up${NC}"
fi

# Step 4: Create Docker image metadata
echo -e "${YELLOW}Step 4/5: Creating Docker image metadata...${NC}"
cat > "$DOCKER_DIR/$VERSION/Dockerfile.version" <<EOF
# Versioned Docker Image: $VERSION
# Created: $(date -Iseconds)
# Description: $DESCRIPTION

FROM node:18-alpine

LABEL version="$VERSION"
LABEL created="$(date -Iseconds)"
LABEL description="$DESCRIPTION"

# Copy entire workstation codebase
WORKDIR /workstation
COPY . .

# Install dependencies
RUN npm install

# Build application
RUN npm run build || true

# Expose ports
EXPOSE 3000

CMD ["npm", "start"]
EOF

echo -e "${GREEN}✓ Docker metadata created${NC}"

# Step 5: Update version index
echo -e "${YELLOW}Step 5/5: Updating version index...${NC}"

# Create or update index.json
if [ ! -f "$INDEX_FILE" ]; then
    echo '{"versions": []}' > "$INDEX_FILE"
fi

# Add new version to index using jq (or fallback to manual)
if command -v jq &> /dev/null; then
    TMP_INDEX=$(mktemp)
    jq ".versions += [{
        \"version\": \"$VERSION\",
        \"created\": \"$(date -Iseconds)\",
        \"description\": \"$DESCRIPTION\",
        \"docker_path\": \"$DOCKER_DIR/$VERSION\",
        \"mcp_path\": \"$MCP_DIR/$VERSION\"
    }]" "$INDEX_FILE" > "$TMP_INDEX"
    mv "$TMP_INDEX" "$INDEX_FILE"
else
    # Manual JSON append (basic fallback)
    echo "Note: jq not available, manual index update required"
fi

# Prune old versions (keep only MAX_VERSIONS)
VERSION_COUNT=$(ls -1 "$MCP_DIR" | wc -l)
if [ "$VERSION_COUNT" -gt "$MAX_VERSIONS" ]; then
    echo -e "${YELLOW}Pruning old versions (keeping last $MAX_VERSIONS)...${NC}"
    
    # Get oldest versions
    OLDEST_VERSIONS=$(ls -1t "$MCP_DIR" | tail -n +$((MAX_VERSIONS + 1)))
    
    for OLD_VERSION in $OLDEST_VERSIONS; do
        echo "  Removing version: $OLD_VERSION"
        rm -rf "$MCP_DIR/$OLD_VERSION"
        rm -rf "$DOCKER_DIR/$OLD_VERSION"
    done
    
    echo -e "${GREEN}✓ Old versions pruned${NC}"
fi

echo -e "${GREEN}✓ Version index updated${NC}"

# Summary
echo ""
echo -e "${GREEN}════════════════════════════════════════════${NC}"
echo -e "${GREEN}Version snapshot created successfully!${NC}"
echo -e "${GREEN}════════════════════════════════════════════${NC}"
echo -e "Version:     ${VERSION}"
echo -e "Created:     $(date)"
echo -e "Description: ${DESCRIPTION}"
echo -e "MCP Path:    ${MCP_DIR}/${VERSION}"
echo -e "Docker Path: ${DOCKER_DIR}/${VERSION}"
echo ""
echo -e "${YELLOW}To build Docker image:${NC}"
echo -e "  docker build -f $DOCKER_DIR/$VERSION/Dockerfile.version -t workstation:$VERSION ."
echo ""
echo -e "${YELLOW}To list all versions:${NC}"
echo -e "  ./scripts/versioning/version-list.sh"
echo ""
echo -e "${YELLOW}To rollback to this version:${NC}"
echo -e "  ./scripts/versioning/rollback.sh $VERSION"
echo ""
