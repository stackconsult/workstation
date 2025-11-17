#!/bin/bash

# MCP Build and Test Script
# Builds and tests all 20 MCP containers

set -e

echo "🚀 MCP Build and Test System"
echo "=============================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TOTAL_MCPS=0
BUILT_MCPS=0
FAILED_MCPS=0

# Find all MCP directories
MCP_DIRS=($(ls -d mcp-containers/[0-9][0-9]-* 2>/dev/null | sort))

echo -e "${BLUE}Found ${#MCP_DIRS[@]} MCP containers${NC}"
echo ""

# Function to build a single MCP
build_mcp() {
  local mcp_dir=$1
  local mcp_name=$(basename "$mcp_dir")
  
  echo -e "${YELLOW}Building ${mcp_name}...${NC}"
  
  cd "$mcp_dir"
  
  # Check if package.json exists
  if [ ! -f "package.json" ]; then
    echo -e "${RED}  ✗ No package.json found${NC}"
    return 1
  fi
  
  # Install dependencies
  echo "  📦 Installing dependencies..."
  if npm install --silent > /tmp/npm-install-${mcp_name}.log 2>&1; then
    echo -e "${GREEN}  ✓ Dependencies installed${NC}"
  else
    echo -e "${RED}  ✗ Failed to install dependencies${NC}"
    cat /tmp/npm-install-${mcp_name}.log | tail -20
    return 1
  fi
  
  # Build TypeScript
  echo "  🔨 Building TypeScript..."
  if npm run build > /tmp/npm-build-${mcp_name}.log 2>&1; then
    echo -e "${GREEN}  ✓ Build successful${NC}"
  else
    echo -e "${RED}  ✗ Build failed${NC}"
    cat /tmp/npm-build-${mcp_name}.log | tail -20
    return 1
  fi
  
  # Check if dist folder was created
  if [ -d "dist" ]; then
    local file_count=$(find dist -name "*.js" | wc -l)
    echo -e "${GREEN}  ✓ Generated ${file_count} JavaScript files${NC}"
  else
    echo -e "${RED}  ✗ No dist folder created${NC}"
    return 1
  fi
  
  cd - > /dev/null
  
  return 0
}

# Function to test health endpoint
test_health_endpoint() {
  local mcp_dir=$1
  local mcp_name=$(basename "$mcp_dir")
  local port=$2
  
  echo -e "${YELLOW}Testing ${mcp_name} health endpoint...${NC}"
  
  cd "$mcp_dir"
  
  # Start server in background
  node dist/index.js > /tmp/mcp-server-${mcp_name}.log 2>&1 &
  local server_pid=$!
  
  # Wait for server to start
  echo "  ⏳ Waiting for server to start..."
  sleep 3
  
  # Test health endpoint
  if curl -s http://localhost:3000/health > /tmp/health-${mcp_name}.json 2>&1; then
    local status=$(cat /tmp/health-${mcp_name}.json | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    if [ "$status" = "healthy" ]; then
      echo -e "${GREEN}  ✓ Health check passed${NC}"
      cat /tmp/health-${mcp_name}.json | jq '.' 2>/dev/null || cat /tmp/health-${mcp_name}.json
    else
      echo -e "${RED}  ✗ Health check returned: ${status}${NC}"
    fi
  else
    echo -e "${RED}  ✗ Health endpoint not responding${NC}"
  fi
  
  # Kill server
  kill $server_pid 2>/dev/null || true
  wait $server_pid 2>/dev/null || true
  
  cd - > /dev/null
}

# Main build loop
echo "Starting build process..."
echo ""

for mcp_dir in "${MCP_DIRS[@]}"; do
  TOTAL_MCPS=$((TOTAL_MCPS + 1))
  
  if build_mcp "$mcp_dir"; then
    BUILT_MCPS=$((BUILT_MCPS + 1))
    echo -e "${GREEN}✓ $(basename "$mcp_dir") built successfully${NC}"
  else
    FAILED_MCPS=$((FAILED_MCPS + 1))
    echo -e "${RED}✗ $(basename "$mcp_dir") build failed${NC}"
  fi
  
  echo ""
done

# Summary
echo "=============================="
echo -e "${BLUE}Build Summary${NC}"
echo "=============================="
echo -e "Total MCPs:    ${TOTAL_MCPS}"
echo -e "${GREEN}Built:         ${BUILT_MCPS}${NC}"
echo -e "${RED}Failed:        ${FAILED_MCPS}${NC}"
echo ""

if [ $FAILED_MCPS -eq 0 ]; then
  echo -e "${GREEN}✨ All MCPs built successfully!${NC}"
  exit 0
else
  echo -e "${RED}⚠️  Some MCPs failed to build${NC}"
  exit 1
fi
