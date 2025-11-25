#!/bin/bash

# ============================================================================
# Agent 17: Project Builder - Build and Setup Script
# ============================================================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Agent 17: Project Builder${NC}"
echo -e "${BLUE}  Build and Setup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

echo -e "${BLUE}[1/5]${NC} Installing dependencies..."
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

echo -e "${BLUE}[2/5]${NC} Building TypeScript..."
npm run build
echo -e "${GREEN}✓ Build completed${NC}"
echo ""

echo -e "${BLUE}[3/5]${NC} Verifying builder tools..."
if [ -d "node_modules/inquirer" ]; then
    echo -e "${GREEN}✓ Inquirer (CLI) installed${NC}"
fi
if [ -d "node_modules/fs-extra" ]; then
    echo -e "${GREEN}✓ fs-extra (file operations) installed${NC}"
fi
echo ""

echo -e "${BLUE}[4/5]${NC} Creating output directory..."
mkdir -p ../../generated-projects
echo -e "${GREEN}✓ Output directory ready${NC}"
echo ""

echo -e "${BLUE}[5/5]${NC} Setup complete!"
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  ✓ Agent 17 Ready!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Commands:${NC}"
echo -e "  ${GREEN}npm run generate${NC}  - Generate a new project"
echo -e "  ${GREEN}npm run dev${NC}       - Run in development mode"
