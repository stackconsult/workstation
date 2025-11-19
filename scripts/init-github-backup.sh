#!/bin/bash

# GitHub Private Repository Backup - Initialization Script
# This script sets up the backup infrastructure and performs initial backup

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}GitHub Private Backup Initialization${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Step 1: Check prerequisites
echo -e "${BLUE}[1/7]${NC} Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker not found${NC}"
    echo "Please install Docker: https://docs.docker.com/get-docker/"
    exit 1
fi
echo -e "${GREEN}✓${NC} Docker installed"

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}✗ Docker Compose not found${NC}"
    echo "Please install Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi
echo -e "${GREEN}✓${NC} Docker Compose installed"

# Step 2: Check GitHub token
echo ""
echo -e "${BLUE}[2/7]${NC} Checking GitHub token..."

if [ -z "${GITHUB_PRIVATE_TOKEN:-}" ]; then
    echo -e "${YELLOW}⚠${NC}  GITHUB_PRIVATE_TOKEN not set in environment"
    echo ""
    echo "Please provide your GitHub Personal Access Token:"
    echo "1. Go to: https://github.com/settings/tokens"
    echo "2. Create token with 'repo' scope"
    echo "3. Copy the token"
    echo ""
    read -sp "Enter token (input hidden): " GITHUB_PRIVATE_TOKEN
    echo ""
    export GITHUB_PRIVATE_TOKEN
fi

if [ -z "$GITHUB_PRIVATE_TOKEN" ]; then
    echo -e "${RED}✗ No token provided${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} GitHub token available"

# Step 3: Create directories
echo ""
echo -e "${BLUE}[3/7]${NC} Creating backup directories..."

cd "$PROJECT_ROOT"

mkdir -p data/github-private-backup/immutable
mkdir -p data/github-private-backup/snapshots
mkdir -p data/github-private-backup/logs

echo -e "${GREEN}✓${NC} Directories created:"
echo "  - data/github-private-backup/immutable"
echo "  - data/github-private-backup/snapshots"
echo "  - data/github-private-backup/logs"

# Step 4: Build container
echo ""
echo -e "${BLUE}[4/7]${NC} Building backup container..."

if docker-compose -f docker-compose.github-backup.yml build; then
    echo -e "${GREEN}✓${NC} Container built successfully"
else
    echo -e "${RED}✗ Container build failed${NC}"
    exit 1
fi

# Step 5: Start container
echo ""
echo -e "${BLUE}[5/7]${NC} Starting backup container..."

if docker-compose -f docker-compose.github-backup.yml up -d; then
    echo -e "${GREEN}✓${NC} Container started"
else
    echo -e "${RED}✗ Failed to start container${NC}"
    exit 1
fi

# Wait for container to be ready
echo "Waiting for container to be healthy..."
timeout=60
elapsed=0
while [ $elapsed -lt $timeout ]; do
    if docker ps | grep -q "github-private-backup.*healthy"; then
        echo -e "${GREEN}✓${NC} Container is healthy"
        break
    fi
    sleep 2
    elapsed=$((elapsed + 2))
done

if [ $elapsed -ge $timeout ]; then
    echo -e "${YELLOW}⚠${NC}  Container health check timeout (will continue anyway)"
fi

# Step 6: Initialize repository
echo ""
echo -e "${BLUE}[6/7]${NC} Initializing backup repository..."

if docker exec github-private-backup backup-manager init; then
    echo -e "${GREEN}✓${NC} Repository initialized"
else
    echo -e "${RED}✗ Repository initialization failed${NC}"
    echo "Check logs: docker logs github-private-backup"
    exit 1
fi

# Step 7: Create first snapshot
echo ""
echo -e "${BLUE}[7/7]${NC} Creating initial snapshot..."

if docker exec github-private-backup backup-manager snapshot; then
    echo -e "${GREEN}✓${NC} Initial snapshot created"
else
    echo -e "${YELLOW}⚠${NC}  Snapshot creation failed (may retry automatically)"
fi

# Final status
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✓ Setup Complete!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Display status
echo "Backup Status:"
docker exec github-private-backup backup-manager status

echo ""
echo -e "${GREEN}Next Steps:${NC}"
echo "1. Verify setup: docker exec github-private-backup backup-manager status"
echo "2. Set GitHub Secret GITHUB_PRIVATE_TOKEN for automated backups"
echo "3. Enable daily backups in GitHub Actions"
echo ""
echo "Documentation:"
echo "- Setup Guide: docs/GITHUB_PRIVATE_BACKUP_SETUP.md"
echo "- Container README: mcp-containers/github-private-backup-mcp/README.md"
echo ""
echo "Commands:"
echo "- Status:   docker exec github-private-backup backup-manager status"
echo "- Sync:     docker exec github-private-backup backup-manager sync"
echo "- Snapshot: docker exec github-private-backup backup-manager snapshot"
echo "- Restore:  docker exec github-private-backup backup-manager restore latest"
echo ""
echo -e "${GREEN}✓ Backup infrastructure is ready!${NC}"
