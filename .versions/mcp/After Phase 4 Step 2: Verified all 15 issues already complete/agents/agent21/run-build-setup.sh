#!/bin/bash

# ============================================================================
# Agent 21: Universal Automation Builder - Build and Setup Script
# ============================================================================
# This script builds Agent 21 and prepares it for generating automation systems
# ============================================================================

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Agent 21: Universal Automation Builder${NC}"
echo -e "${BLUE}  Build and Setup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check Node.js version
echo -e "${BLUE}[1/5]${NC} Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}✗ Node.js 18+ required (current: $(node -v))${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node -v)${NC}"
echo ""

# Install dependencies
echo -e "${BLUE}[2/5]${NC} Installing dependencies..."
if [ ! -d "node_modules" ]; then
    npm install
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "${GREEN}✓ Dependencies already installed${NC}"
fi
echo ""

# Build TypeScript
echo -e "${BLUE}[3/5]${NC} Building TypeScript..."
npm run build
echo -e "${GREEN}✓ Build completed${NC}"
echo ""

# Verify build output
echo -e "${BLUE}[4/5]${NC} Verifying build output..."
if [ ! -f "dist/index.js" ]; then
    echo -e "${RED}✗ Build failed - dist/index.js not found${NC}"
    exit 1
fi
if [ ! -f "dist/cli.js" ]; then
    echo -e "${RED}✗ Build failed - dist/cli.js not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Build output verified${NC}"
echo ""

# Create output directory for generated projects
echo -e "${BLUE}[5/5]${NC} Setting up output directory..."
mkdir -p ../../generated-projects
echo -e "${GREEN}✓ Output directory ready${NC}"
echo ""

# Success message
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  ✓ Agent 21 Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Available Commands:${NC}"
echo -e "  ${GREEN}npm run generate${NC}  - Generate a new automation system"
echo -e "  ${GREEN}npm run dev${NC}       - Run in development mode"
echo -e "  ${GREEN}npm start${NC}        - Run built version"
echo -e "  ${GREEN}npm run build${NC}    - Rebuild TypeScript"
echo ""
echo -e "${BLUE}Quick Start:${NC}"
echo -e "  1. Run: ${GREEN}npm run generate${NC}"
echo -e "  2. Answer 7 questions about your automation"
echo -e "  3. Get a complete, working MCP server!"
echo ""
echo -e "${BLUE}Generated projects will be saved to:${NC}"
echo -e "  ${YELLOW}../../generated-projects/${NC}"
echo ""
echo -e "${GREEN}Ready to generate automation systems! 🚀${NC}"
