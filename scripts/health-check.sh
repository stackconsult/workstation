#!/bin/bash
# Repository Health Check Script
# Comprehensive verification of repository state

set -e

echo "🔍 Repository Health Check"
echo "=========================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASS=0
FAIL=0
WARN=0

check_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASS++))
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAIL++))
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARN++))
}

echo "📋 Phase 1: Build & Test Status"
echo "--------------------------------"

# Check if project builds
if npm run build > /dev/null 2>&1; then
    check_pass "Project builds successfully"
else
    check_fail "Project build fails"
fi

# Check if tests pass
if npm test > /dev/null 2>&1; then
    check_pass "All tests pass"
else
    check_fail "Tests fail"
fi

# Check if linting passes
if npm run lint > /dev/null 2>&1; then
    check_pass "Linting passes"
else
    check_fail "Linting fails"
fi

echo ""
echo "🏗️  Phase 2: Agent Build Status"
echo "--------------------------------"

# Check agent builds
for agent in agent8 agent9 agent10 agent11 agent12; do
    if [ -d "agents/$agent/dist" ]; then
        check_pass "Agent $agent built"
    else
        check_fail "Agent $agent not built"
    fi
done

echo ""
echo "📦 Phase 3: Dependencies"
echo "------------------------"

# Check for node_modules
if [ -d "node_modules" ]; then
    check_pass "Dependencies installed"
else
    check_fail "Dependencies missing"
fi

# Check for security vulnerabilities
VULNS=$(npm audit --audit-level=moderate 2>&1 | grep "found 0 vulnerabilities" || echo "has vulnerabilities")
if [[ "$VULNS" == *"found 0 vulnerabilities"* ]]; then
    check_pass "No security vulnerabilities"
else
    check_warn "Security vulnerabilities detected (run: npm audit)"
fi

echo ""
echo "🔒 Phase 4: Environment & Security"
echo "-----------------------------------"

# Check .env file
if [ -f ".env" ]; then
    check_pass ".env file exists"
    if grep -q "JWT_SECRET=[a-f0-9]\{64\}" .env; then
        check_pass "Secure JWT_SECRET configured"
    else
        check_warn "JWT_SECRET may not be secure (should be 64 hex chars)"
    fi
else
    check_warn ".env file missing (will use defaults)"
fi

# Check .gitignore
if grep -q "^\.env$" .gitignore; then
    check_pass ".env in .gitignore"
else
    check_fail ".env NOT in .gitignore (SECURITY RISK)"
fi

if grep -q "agents/\*/node_modules" .gitignore; then
    check_pass "Agent dependencies excluded from git"
else
    check_warn "Agent node_modules not in .gitignore"
fi

echo ""
echo "📚 Phase 5: Documentation"
echo "-------------------------"

# Check key documentation files
docs=("README.md" "PROJECT_IDENTITY.md" "FUTURE_FEATURES.md" "ROADMAP.md" "API.md" "ARCHITECTURE.md" "SECURITY.md")
for doc in "${docs[@]}"; do
    if [ -f "$doc" ]; then
        check_pass "$doc exists"
    else
        check_warn "$doc missing"
    fi
done

echo ""
echo "🎯 Phase 6: Test Coverage"
echo "-------------------------"

# Run tests with coverage and extract percentage
COVERAGE=$(npm test 2>&1 | grep "All files" | awk '{print $3}')
if [ ! -z "$COVERAGE" ]; then
    COVERAGE_NUM=$(echo $COVERAGE | sed 's/%//')
    if (( $(echo "$COVERAGE_NUM > 30" | bc -l) )); then
        check_pass "Test coverage: $COVERAGE (target: >30%)"
    else
        check_warn "Test coverage: $COVERAGE (below 30%)"
    fi
else
    check_warn "Could not determine test coverage"
fi

echo ""
echo "🔧 Phase 7: Configuration Files"
echo "--------------------------------"

configs=("package.json" "tsconfig.json" ".eslintrc.json" "jest.config.js" "Dockerfile")
for config in "${configs[@]}"; do
    if [ -f "$config" ]; then
        check_pass "$config exists"
    else
        check_fail "$config missing"
    fi
done

echo ""
echo "📊 Summary"
echo "=========="
echo ""
echo -e "${GREEN}Passed:${NC}  $PASS"
echo -e "${YELLOW}Warnings:${NC} $WARN"
echo -e "${RED}Failed:${NC}  $FAIL"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✓ Repository is healthy!${NC}"
    exit 0
elif [ $FAIL -lt 3 ]; then
    echo -e "${YELLOW}⚠ Repository has minor issues${NC}"
    exit 0
else
    echo -e "${RED}✗ Repository has critical issues${NC}"
    exit 1
fi
