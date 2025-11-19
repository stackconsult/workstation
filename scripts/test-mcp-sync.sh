#!/bin/bash

# Test MCP Sync Configuration and Script

set -euo pipefail

echo "=== Testing MCP Sync System ==="
echo ""

# Test 1: Check configuration file exists
echo "✓ Test 1: Configuration file exists"
if [ ! -f "mcp-sync-config.json" ]; then
    echo "✗ FAILED: mcp-sync-config.json not found"
    exit 1
fi
echo "  ✓ Pass: mcp-sync-config.json exists"

# Test 2: Validate JSON syntax
echo ""
echo "✓ Test 2: Configuration JSON is valid"
if ! jq empty mcp-sync-config.json 2>/dev/null; then
    echo "✗ FAILED: Invalid JSON in mcp-sync-config.json"
    exit 1
fi
echo "  ✓ Pass: Valid JSON syntax"

# Test 3: Check required fields
echo ""
echo "✓ Test 3: Required configuration fields present"
required_fields=(
    ".mcp.sourceRepo.owner"
    ".mcp.sourceRepo.name"
    ".mcp.sourceRepo.defaultBranch"
    ".mcp.localPath"
    ".mcp.syncBranches"
)

for field in "${required_fields[@]}"; do
    value=$(jq -r "$field" mcp-sync-config.json 2>/dev/null)
    if [ -z "$value" ] || [ "$value" = "null" ]; then
        echo "✗ FAILED: Missing required field: $field"
        exit 1
    fi
    echo "  ✓ $field = $value"
done

# Test 4: Check sync script exists and is executable
echo ""
echo "✓ Test 4: Sync script exists and is executable"
if [ ! -f "scripts/mcp-sync.sh" ]; then
    echo "✗ FAILED: scripts/mcp-sync.sh not found"
    exit 1
fi
if [ ! -x "scripts/mcp-sync.sh" ]; then
    echo "✗ FAILED: scripts/mcp-sync.sh is not executable"
    exit 1
fi
echo "  ✓ Pass: Script exists and is executable"

# Test 5: Check workflow file exists
echo ""
echo "✓ Test 5: Watch agent workflow exists"
if [ ! -f ".github/workflows/mcp-branch-watch.yml" ]; then
    echo "✗ FAILED: .github/workflows/mcp-branch-watch.yml not found"
    exit 1
fi
echo "  ✓ Pass: Workflow file exists"

# Test 6: Verify documentation exists
echo ""
echo "✓ Test 6: Documentation exists"
docs=(
    "docs/MCP_SYNC_SYSTEM.md"
    "docs/MCP_SYNC_QUICKSTART.md"
)

for doc in "${docs[@]}"; do
    if [ ! -f "$doc" ]; then
        echo "✗ FAILED: $doc not found"
        exit 1
    fi
    echo "  ✓ $doc exists"
done

# Test 7: Check .gitignore excludes MCP directories
echo ""
echo "✓ Test 7: .gitignore configured correctly"
if ! grep -q ".mcp-clone/" .gitignore; then
    echo "✗ FAILED: .mcp-clone/ not in .gitignore"
    exit 1
fi
if ! grep -q ".mcp-rollback/" .gitignore; then
    echo "✗ FAILED: .mcp-rollback/ not in .gitignore"
    exit 1
fi
echo "  ✓ Pass: MCP directories in .gitignore"

# Test 8: Verify script has proper shebang and error handling
echo ""
echo "✓ Test 8: Script structure validation"
if ! head -n 1 scripts/mcp-sync.sh | grep -q "^#!/bin/bash"; then
    echo "✗ FAILED: Missing bash shebang"
    exit 1
fi
if ! grep -q "set -euo pipefail" scripts/mcp-sync.sh; then
    echo "✗ FAILED: Missing error handling flags"
    exit 1
fi
echo "  ✓ Pass: Script has proper structure"

# Test 9: Check npm ci replaced with npm install
echo ""
echo "✓ Test 9: CI/CD workflows updated"
workflow_files=(
    ".github/workflows/ci.yml"
    ".github/workflows/agent2-ci.yml"
    ".github/workflows/agent3-ci.yml"
    ".github/workflows/agent4-ci.yml"
)

for workflow in "${workflow_files[@]}"; do
    if grep -q "npm ci" "$workflow"; then
        echo "✗ FAILED: $workflow still contains 'npm ci'"
        exit 1
    fi
done
echo "  ✓ Pass: All workflows use 'npm install'"

echo ""
echo "==================================="
echo "✅ All Tests Passed!"
echo "==================================="
echo ""
echo "MCP Sync System is properly configured."
echo "Next steps:"
echo "  1. Set GITHUB_TOKEN environment variable"
echo "  2. Run: ./scripts/mcp-sync.sh status"
echo "  3. Run: ./scripts/mcp-sync.sh sync"
echo ""
echo "See docs/MCP_SYNC_QUICKSTART.md for setup guide"
