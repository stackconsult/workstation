#!/bin/bash
# Workflow Validation Script
# This script validates all GitHub Actions workflows and identifies phantom checks

set -e

echo "🔍 GitHub Actions Workflow Validator"
echo "===================================="
echo ""

WORKFLOW_DIR=".github/workflows"
ERRORS=0
WARNINGS=0

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if workflow directory exists
if [ ! -d "$WORKFLOW_DIR" ]; then
    echo -e "${RED}❌ Error: $WORKFLOW_DIR directory not found${NC}"
    exit 1
fi

echo -e "${BLUE}📂 Scanning workflow files...${NC}"
echo ""

# Find all active workflow files (excluding .disabled)
WORKFLOW_FILES=$(find "$WORKFLOW_DIR" -type f -name "*.yml" ! -name "*.disabled")
WORKFLOW_COUNT=$(echo "$WORKFLOW_FILES" | wc -l)

echo -e "${GREEN}Found $WORKFLOW_COUNT active workflow file(s)${NC}"
echo ""

# Validate YAML syntax
echo -e "${BLUE}📝 Validating YAML syntax...${NC}"
for file in $WORKFLOW_FILES; do
    filename=$(basename "$file")
    
    # Check if file has valid YAML syntax using Python
    if python3 -c "import yaml; yaml.safe_load(open('$file'))" 2>/dev/null; then
        echo -e "${GREEN}  ✓ $filename${NC}"
    else
        echo -e "${RED}  ✗ $filename - Invalid YAML syntax${NC}"
        ERRORS=$((ERRORS + 1))
    fi
done

echo ""

# Check for Python-related workflows in a Node.js project
echo -e "${BLUE}🔍 Checking for language mismatches...${NC}"
PROJECT_TYPE="Node.js/TypeScript"

if [ -f "package.json" ]; then
    echo -e "${GREEN}  ✓ Confirmed: This is a $PROJECT_TYPE project${NC}"
    
    # Check for inappropriate Python setup in workflows
    PYTHON_REFS=$(grep -r "setup-python\|python-version: '3\.\|pip install" $WORKFLOW_DIR/*.yml 2>/dev/null | grep -v ".disabled" || true)
    
    if [ -n "$PYTHON_REFS" ]; then
        echo -e "${YELLOW}  ⚠ Warning: Found Python references in Node.js project${NC}"
        echo "$PYTHON_REFS" | while read -r line; do
            echo -e "${YELLOW}    $line${NC}"
        done
        WARNINGS=$((WARNINGS + 1))
    else
        echo -e "${GREEN}  ✓ No inappropriate Python references found${NC}"
    fi
fi

echo ""

# Extract all job names from workflows
echo -e "${BLUE}📋 Listing all workflow jobs...${NC}"
echo ""
echo "Active Workflows and Jobs:"
echo "------------------------"

for file in $WORKFLOW_FILES; do
    filename=$(basename "$file")
    workflow_name=$(python3 -c "import yaml; print(yaml.safe_load(open('$file')).get('name', 'Unnamed'))" 2>/dev/null || echo "Unknown")
    
    echo -e "${GREEN}$filename${NC} - $workflow_name"
    
    # Extract job names
    jobs=$(python3 -c "
import yaml
import sys
try:
    with open('$file') as f:
        data = yaml.safe_load(f)
        if 'jobs' in data:
            for job in data['jobs'].keys():
                print(f'  - {job}')
except Exception as e:
    print(f'  Error parsing jobs: {e}', file=sys.stderr)
" 2>/dev/null || echo "  Unable to parse jobs")
    
    echo "$jobs"
    echo ""
done

# Check for phantom checks
echo -e "${BLUE}👻 Checking for phantom workflow references...${NC}"
echo ""

PHANTOM_CHECKS=(
    "Backend CI / test (3.9)"
    "Backend CI / test (3.10)"
    "Backend CI / test (3.11)"
    "Extension CI / build"
)

echo "Phantom checks (don't exist in workflows):"
for check in "${PHANTOM_CHECKS[@]}"; do
    # Check if this phantom check exists in any workflow
    if grep -q "$check" $WORKFLOW_DIR/*.yml 2>/dev/null; then
        echo -e "${RED}  ✗ Found in workflows: $check${NC}"
        ERRORS=$((ERRORS + 1))
    else
        echo -e "${YELLOW}  ⚠ Not in workflows but may be in branch protection: $check${NC}"
    fi
done

echo ""

# Summary
echo -e "${BLUE}📊 Summary${NC}"
echo "=========="
echo -e "Active workflows: ${GREEN}$WORKFLOW_COUNT${NC}"
echo -e "Errors: $([ $ERRORS -eq 0 ] && echo -e "${GREEN}$ERRORS${NC}" || echo -e "${RED}$ERRORS${NC}")"
echo -e "Warnings: $([ $WARNINGS -eq 0 ] && echo -e "${GREEN}$WARNINGS${NC}" || echo -e "${YELLOW}$WARNINGS${NC}")"
echo ""

# Recommendations
if [ $ERRORS -gt 0 ] || [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}📝 Recommendations:${NC}"
    echo ""
    
    if [ $WARNINGS -gt 0 ]; then
        echo "1. Remove any Python-related setup from workflows (this is a Node.js project)"
        echo ""
    fi
    
    echo "2. Update GitHub branch protection rules:"
    echo "   - Go to: Settings → Branches → Branch protection rules"
    echo "   - Remove phantom checks from required status checks:"
    for check in "${PHANTOM_CHECKS[@]}"; do
        echo "     * $check"
    done
    echo ""
    echo "3. Add only these actual checks to branch protection:"
    echo "   - Test (18.x)"
    echo "   - Test (20.x)"
    echo "   - Security Audit"
    echo ""
fi

# Run actual CI checks
echo -e "${BLUE}🧪 Running local CI checks...${NC}"
echo ""

if [ -f "package.json" ]; then
    # Check if dependencies are installed
    if [ ! -d "node_modules" ]; then
        echo "Installing dependencies..."
        npm install --silent
    fi
    
    # Run lint
    echo -e "${BLUE}Running linter...${NC}"
    if npm run lint --silent 2>&1 | tail -5; then
        echo -e "${GREEN}✓ Lint passed${NC}"
    else
        echo -e "${RED}✗ Lint failed${NC}"
        ERRORS=$((ERRORS + 1))
    fi
    echo ""
    
    # Run build
    echo -e "${BLUE}Building project...${NC}"
    if npm run build --silent; then
        echo -e "${GREEN}✓ Build passed${NC}"
    else
        echo -e "${RED}✗ Build failed${NC}"
        ERRORS=$((ERRORS + 1))
    fi
    echo ""
    
    # Run tests
    echo -e "${BLUE}Running tests...${NC}"
    if npm test --silent 2>&1 | tail -10; then
        echo -e "${GREEN}✓ Tests passed${NC}"
    else
        echo -e "${RED}✗ Tests failed${NC}"
        ERRORS=$((ERRORS + 1))
    fi
fi

echo ""
echo -e "${BLUE}================================${NC}"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Found $ERRORS error(s)${NC}"
    exit 1
fi
