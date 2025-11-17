#!/bin/bash
# Pre-commit validation script
# Ensures build, tests, and documentation are in sync

set -e

echo "🔍 Running pre-commit validation..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Error tracking
ERRORS=0

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
    else
        echo -e "${RED}✗${NC} $2"
        ERRORS=$((ERRORS + 1))
    fi
}

# 1. Check if node_modules exists
echo "1️⃣  Checking dependencies..."
if [ -d "node_modules" ]; then
    print_status 0 "Dependencies installed"
else
    echo -e "${YELLOW}⚠${NC}  Dependencies not installed. Running npm install..."
    npm install > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        print_status 0 "Dependencies installed successfully"
    else
        print_status 1 "Failed to install dependencies"
    fi
fi
echo ""

# 2. Run linter
echo "2️⃣  Running linter..."
npm run lint > /tmp/lint.log 2>&1
LINT_STATUS=$?
print_status $LINT_STATUS "Linting check"
if [ $LINT_STATUS -ne 0 ]; then
    echo "   Lint errors:"
    cat /tmp/lint.log | grep -E "error|warning" | head -10
fi
echo ""

# 3. Run build
echo "3️⃣  Running build..."
npm run build > /tmp/build.log 2>&1
BUILD_STATUS=$?
print_status $BUILD_STATUS "TypeScript compilation"
if [ $BUILD_STATUS -ne 0 ]; then
    echo "   Build errors:"
    cat /tmp/build.log | grep -E "error" | head -10
fi
echo ""

# 4. Run tests
echo "4️⃣  Running tests..."
# Run tests without coverage for faster execution
npm test -- --maxWorkers=2 --bail > /tmp/test.log 2>&1
TEST_STATUS=$?
print_status $TEST_STATUS "Test suite"
if [ $TEST_STATUS -ne 0 ]; then
    echo "   Test failures:"
    cat /tmp/test.log | grep -E "FAIL|Error" | head -10
fi
echo ""

# 5. Check for common documentation issues
echo "5️⃣  Checking documentation..."
DOC_ERRORS=0

# Check if README mentions features that don't exist in code
if grep -q "Phase 1" README.md; then
    if [ ! -f "src/automation/agents/core/browser.ts" ]; then
        echo -e "${RED}✗${NC} README mentions Phase 1 browser agent but code not found"
        DOC_ERRORS=$((DOC_ERRORS + 1))
    else
        print_status 0 "Browser agent code exists as documented"
    fi
fi

# Check if HOW_TO_USE guide exists and matches README
if [ -f "HOW_TO_USE_BROWSER_AGENT.md" ]; then
    if grep -q "HOW_TO_USE_BROWSER_AGENT" README.md; then
        print_status 0 "HOW_TO_USE guide linked in README"
    else
        echo -e "${RED}✗${NC} HOW_TO_USE guide exists but not linked in README"
        DOC_ERRORS=$((DOC_ERRORS + 1))
    fi
fi

# Check if documented UIs exist
if grep -q "docs/index.html" README.md; then
    if [ -f "docs/index.html" ]; then
        print_status 0 "Documented UI files exist"
    else
        echo -e "${RED}✗${NC} README mentions docs/index.html but file not found"
        DOC_ERRORS=$((DOC_ERRORS + 1))
    fi
fi

if [ $DOC_ERRORS -gt 0 ]; then
    ERRORS=$((ERRORS + DOC_ERRORS))
fi
echo ""

# 6. Security check
echo "6️⃣  Running security audit..."
npm audit --audit-level=high > /tmp/audit.log 2>&1
AUDIT_STATUS=$?
if [ $AUDIT_STATUS -eq 0 ]; then
    print_status 0 "No high/critical vulnerabilities"
else
    VULN_COUNT=$(npm audit --audit-level=high --json 2>/dev/null | grep -o '"vulnerabilities":{"info":[0-9]*' | grep -o '[0-9]*$' || echo "0")
    if [ "$VULN_COUNT" = "0" ]; then
        print_status 0 "No high/critical vulnerabilities"
    else
        print_status 1 "Found vulnerabilities - check npm audit"
    fi
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed!${NC}"
    echo "   Ready to commit."
    exit 0
else
    echo -e "${RED}❌ $ERRORS check(s) failed!${NC}"
    echo ""
    echo "Please fix the issues above before committing."
    echo ""
    echo "Common fixes:"
    echo "  • Linting errors: Run 'npm run lint' and fix issues"
    echo "  • Build errors: Check TypeScript compilation errors"
    echo "  • Test failures: Run 'npm test' and fix failing tests"
    echo "  • Documentation: Ensure documented features exist in code"
    echo ""
    exit 1
fi
