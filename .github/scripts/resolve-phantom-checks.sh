#!/bin/bash
# Phantom Workflow Check Resolution Script
# 
# This script helps identify and resolve phantom GitHub Actions checks
# that appear in PRs but don't correspond to actual workflow files.

set -e

echo "=== Phantom Workflow Check Resolution ==="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "Step 1: Analyzing workflow files..."
echo "-----------------------------------"

# Find all workflow files
WORKFLOW_FILES=$(find .github/workflows -name "*.yml" -not -name "*.disabled" 2>/dev/null)
WORKFLOW_COUNT=$(echo "$WORKFLOW_FILES" | wc -l)

echo -e "${GREEN}Found $WORKFLOW_COUNT active workflow files${NC}"
echo ""

echo "Step 2: Extracting workflow and job names..."
echo "--------------------------------------------"

# Extract workflow names and jobs
echo "Active Workflows:"
for file in $WORKFLOW_FILES; do
    WORKFLOW_NAME=$(grep "^name:" "$file" | head -1 | sed 's/name: *//' | tr -d '"')
    if [ -n "$WORKFLOW_NAME" ]; then
        echo "  - $WORKFLOW_NAME ($file)"
    fi
done
echo ""

echo "Step 3: Checking for phantom workflow patterns..."
echo "--------------------------------------------------"

# Known phantom patterns from the issue
PHANTOM_CHECKS=(
    "Backend CI / test (3.9)"
    "Backend CI / test (3.10)"
    "Backend CI / test (3.11)"
    "Extension CI / build"
)

echo "Searching for phantom check patterns:"
FOUND_PHANTOM=0

for phantom in "${PHANTOM_CHECKS[@]}"; do
    # Search for any reference to this check name
    if grep -rq "$phantom" .github/workflows/ 2>/dev/null; then
        echo -e "  ${RED}✗ FOUND: $phantom${NC}"
        FOUND_PHANTOM=1
    else
        echo -e "  ${GREEN}✓ NOT FOUND: $phantom${NC}"
    fi
done

echo ""

if [ $FOUND_PHANTOM -eq 0 ]; then
    echo -e "${GREEN}✓ No phantom check references found in workflow files${NC}"
    echo ""
    echo "These checks might be:"
    echo "  1. Required status checks in GitHub repository settings"
    echo "  2. Checks from a different repository"
    echo "  3. Historical checks from deleted workflows"
    echo ""
else
    echo -e "${YELLOW}⚠ Found references to phantom checks${NC}"
    echo ""
fi

echo "Step 4: Checking for Python references..."
echo "------------------------------------------"

# Check for Python version references
PYTHON_REFS=$(grep -rn "python-version:\|python\|3\.9\|3\.10\|3\.11" .github/workflows/*.yml 2>/dev/null | grep -cv ".disabled")

if [ "$PYTHON_REFS" -eq 0 ]; then
    echo -e "${GREEN}✓ No Python references found in active workflows${NC}"
else
    echo -e "${YELLOW}⚠ Found $PYTHON_REFS Python references:${NC}"
    grep -rn "python-version:\|3\.9\|3\.10\|3\.11" .github/workflows/*.yml 2>/dev/null | grep -v ".disabled" || true
fi

echo ""

echo "Step 5: Project type verification..."
echo "-------------------------------------"

# Verify this is a Node.js project
if [ -f "package.json" ]; then
    echo -e "${GREEN}✓ package.json found - Node.js project${NC}"
    NODE_VERSION=$(node --version 2>/dev/null || echo "not installed")
    echo "  Node.js version: $NODE_VERSION"
fi

if [ -f "requirements.txt" ] || [ -f "setup.py" ] || [ -f "pyproject.toml" ]; then
    echo -e "${YELLOW}⚠ Python project files found${NC}"
else
    echo -e "${GREEN}✓ No Python project files found${NC}"
fi

echo ""

echo "Step 6: Recommendations..."
echo "---------------------------"

echo ""
echo "To resolve phantom GitHub Actions checks:"
echo ""
echo "1. Go to GitHub Repository Settings:"
echo "   https://github.com/<owner>/<repo>/settings/branches"
echo ""
echo "2. Edit branch protection rules for your protected branches"
echo ""
echo "3. Scroll to 'Require status checks to pass before merging'"
echo ""
echo "4. Remove these phantom checks if they appear:"
for phantom in "${PHANTOM_CHECKS[@]}"; do
    echo "   - $phantom"
done
echo ""
echo "5. Keep only these actual checks:"
echo "   - Test (18.x)"
echo "   - Test (20.x)"
echo "   - Security Audit"
echo ""
echo "6. Save changes"
echo ""

echo "Step 7: Validation..."
echo "----------------------"

# Run local CI checks
echo "Running local CI checks..."
echo ""

if command -v npm &> /dev/null; then
    echo "→ Running linter..."
    if npm run lint >/dev/null 2>&1; then
        echo -e "  ${GREEN}✓ Lint passed${NC}"
    else
        echo -e "  ${RED}✗ Lint failed${NC}"
    fi
    
    echo "→ Running build..."
    if npm run build >/dev/null 2>&1; then
        echo -e "  ${GREEN}✓ Build passed${NC}"
    else
        echo -e "  ${RED}✗ Build failed${NC}"
    fi
    
    echo "→ Running tests..."
    if npm test >/dev/null 2>&1; then
        echo -e "  ${GREEN}✓ Tests passed${NC}"
    else
        echo -e "  ${RED}✗ Tests failed${NC}"
    fi
else
    echo -e "${YELLOW}⚠ npm not found, skipping local validation${NC}"
fi

echo ""
echo "=== Resolution Complete ==="
echo ""
echo "Summary:"
echo "  - Active workflow files: $WORKFLOW_COUNT"
echo "  - Python references found: $PYTHON_REFS"
echo "  - Project type: Node.js/TypeScript"
echo ""
echo "Next steps:"
echo "  1. Review GitHub repository branch protection settings"
echo "  2. Remove phantom check requirements"
echo "  3. Monitor CI/CD pipeline for 24 hours"
echo "  4. Document any additional findings"
echo ""
