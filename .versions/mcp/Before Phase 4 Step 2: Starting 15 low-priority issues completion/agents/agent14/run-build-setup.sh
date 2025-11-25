#!/bin/bash

# ============================================================================
# Agent 14: Advanced Analytics & Visualization - Build and Setup Script
# ============================================================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Agent 14: Advanced Analytics${NC}"
echo -e "${BLUE}  Build and Setup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

echo -e "${BLUE}[1/4]${NC} Installing dependencies..."
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

echo -e "${BLUE}[2/4]${NC} Building TypeScript..."
npm run build
echo -e "${GREEN}✓ Build completed${NC}"
echo ""

echo -e "${BLUE}[3/4]${NC} Verifying analytics libraries..."
if [ -d "node_modules/recharts" ]; then
    echo -e "${GREEN}✓ Recharts installed${NC}"
fi
if [ -d "node_modules/d3" ]; then
    echo -e "${GREEN}✓ D3.js installed${NC}"
fi
echo ""

echo -e "${BLUE}[4/4]${NC} Setup complete!"
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  ✓ Agent 14 Ready!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Commands:${NC}"
echo -e "  ${GREEN}npm run dev${NC}   - Start development server"
echo -e "  ${GREEN}npm start${NC}    - Start production server"
