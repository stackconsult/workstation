#!/bin/bash
set -e

# Repository Metrics Update Script
# This script ensures metrics are always accurate by measuring the actual codebase
# Can be run locally or via CI/CD

echo "🔍 Counting repository metrics..."

# Count total TypeScript/JavaScript LOC (excluding node_modules, dist, build, .git)
TOTAL_LOC=$(find . -path ./node_modules -prune -o -path ./dist -prune -o \
  -path ./build -prune -o -path ./.git -prune -o \
  -type f \( -name "*.ts" -o -name "*.js" \) -exec wc -l {} + 2>/dev/null | \
  tail -1 | awk '{print $1}')

# Count total files
TOTAL_FILES=$(find . -path ./node_modules -prune -o -path ./dist -prune -o \
  -path ./build -prune -o -path ./.git -prune -o \
  -type f \( -name "*.ts" -o -name "*.js" \) -print | wc -l)

# Count per directory
SRC_LOC=$(find src -name "*.ts" -o -name "*.js" 2>/dev/null | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}' || echo "0")
SRC_FILES=$(find src -name "*.ts" -o -name "*.js" 2>/dev/null | wc -l)

CHROME_LOC=$(find chrome-extension -name "*.ts" -o -name "*.js" 2>/dev/null | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}' || echo "0")
CHROME_FILES=$(find chrome-extension -name "*.ts" -o -name "*.js" 2>/dev/null | wc -l)

AGENTS_LOC=$(find agents -name "*.ts" -o -name "*.js" 2>/dev/null | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}' || echo "0")
AGENTS_FILES=$(find agents -name "*.ts" -o -name "*.js" 2>/dev/null | wc -l)

MCP_LOC=$(find mcp-containers -name "*.ts" -o -name "*.js" 2>/dev/null | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}' || echo "0")
MCP_FILES=$(find mcp-containers -name "*.ts" -o -name "*.js" 2>/dev/null | wc -l)

TOOLS_LOC=$(find tools -name "*.ts" -o -name "*.js" 2>/dev/null | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}' || echo "0")
TOOLS_FILES=$(find tools -name "*.ts" -o -name "*.js" 2>/dev/null | wc -l)

PUBLIC_LOC=$(find public -name "*.ts" -o -name "*.js" 2>/dev/null | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}' || echo "0")
PUBLIC_FILES=$(find public -name "*.ts" -o -name "*.js" 2>/dev/null | wc -l)

TESTS_LOC=$(find tests -name "*.ts" -o -name "*.js" 2>/dev/null | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}' || echo "0")
TESTS_FILES=$(find tests -name "*.ts" -o -name "*.js" 2>/dev/null | wc -l)

# Calculate other code
OTHER_LOC=$((TOTAL_LOC - SRC_LOC - CHROME_LOC - AGENTS_LOC - MCP_LOC - TOOLS_LOC - PUBLIC_LOC - TESTS_LOC))
OTHER_FILES=$((TOTAL_FILES - SRC_FILES - CHROME_FILES - AGENTS_FILES - MCP_FILES - TOOLS_FILES - PUBLIC_FILES - TESTS_FILES))

# Display results
echo ""
echo "=== Repository Metrics ==="
echo "Total LOC:          $TOTAL_LOC"
echo "Total Files:        $TOTAL_FILES"
echo ""
echo "Breakdown:"
echo "  src/:             $SRC_LOC LOC ($SRC_FILES files)"
echo "  chrome-extension: $CHROME_LOC LOC ($CHROME_FILES files)"
echo "  agents:           $AGENTS_LOC LOC ($AGENTS_FILES files)"
echo "  mcp-containers:   $MCP_LOC LOC ($MCP_FILES files)"
echo "  tools:            $TOOLS_LOC LOC ($TOOLS_FILES files)"
echo "  public:           $PUBLIC_LOC LOC ($PUBLIC_FILES files)"
echo "  tests:            $TESTS_LOC LOC ($TESTS_FILES files)"
echo "  other:            $OTHER_LOC LOC ($OTHER_FILES files)"
echo ""

# Export for use in other scripts
export REPO_TOTAL_LOC=$TOTAL_LOC
export REPO_TOTAL_FILES=$TOTAL_FILES
export REPO_SRC_LOC=$SRC_LOC
export REPO_CHROME_LOC=$CHROME_LOC
export REPO_AGENTS_LOC=$AGENTS_LOC
export REPO_MCP_LOC=$MCP_LOC

echo "✅ Metrics counted successfully"
echo ""
echo "To use in other scripts:"
echo "  source ./scripts/update-metrics.sh"
echo "  echo \$REPO_TOTAL_LOC"
