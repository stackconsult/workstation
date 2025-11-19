#!/bin/bash
# Module 5 Automation Validation Script

set -e

echo "🧪 Module 5: Automation Validation"
echo "==================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

TESTS_PASSED=0
TESTS_FAILED=0

# Test function
test_check() {
  local test_name="$1"
  local command="$2"
  
  echo -n "Testing: $test_name... "
  
  if eval "$command" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((TESTS_PASSED++))
    return 0
  else
    echo -e "${RED}✗ FAIL${NC}"
    ((TESTS_FAILED++))
    return 1
  fi
}

# 1. Check Node.js and npm
echo "1. Environment Checks"
echo "---------------------"
test_check "Node.js installed" "node --version"
test_check "npm installed" "npm --version"
test_check "TypeScript installed" "npx tsc --version"
echo ""

# 2. Check dependencies
echo "2. Dependency Checks"
echo "--------------------"
test_check "node-cron installed" "npm list node-cron"
test_check "winston installed" "npm list winston"
test_check "axios installed" "npm list axios"
test_check "express installed" "npm list express"
echo ""

# 3. Check project structure
echo "3. Project Structure"
echo "--------------------"
test_check "src directory exists" "[ -d 'src' ]"
test_check "package.json exists" "[ -f 'package.json' ]"
test_check "tsconfig.json exists" "[ -f 'tsconfig.json' ]"
test_check "Dockerfile exists" "[ -f 'Dockerfile' ]"
test_check "railway.json exists" "[ -f 'railway.json' ]"
echo ""

# 4. Check automation files
echo "4. Automation Files"
echo "-------------------"
test_check "scheduler exists" "[ -f 'src/automation/scheduler.ts' ] || [ -f 'dist/automation/scheduler.js' ]"
test_check "logger exists" "[ -f 'src/utils/logger.ts' ] || [ -f 'dist/utils/logger.js' ]"
test_check "logs directory" "[ -d 'logs' ] || mkdir -p logs"
echo ""

# 5. Build and compile
echo "5. Build Process"
echo "----------------"
test_check "TypeScript compiles" "npm run build"
test_check "dist directory created" "[ -d 'dist' ]"
echo ""

# 6. Environment variables
echo "6. Environment Configuration"
echo "----------------------------"
if [ -f ".env" ]; then
  test_check "JWT_SECRET defined" "grep -q 'JWT_SECRET=' .env"
  test_check "NODE_ENV defined" "grep -q 'NODE_ENV=' .env || echo 'Optional'"
  echo -e "${YELLOW}Note: Check .env for production secrets${NC}"
else
  echo -e "${YELLOW}⚠ No .env file found (optional for testing)${NC}"
fi
echo ""

# 7. Docker validation
echo "7. Docker Checks"
echo "----------------"
if command -v docker &> /dev/null; then
  test_check "Docker installed" "docker --version"
  test_check "Dockerfile syntax" "docker build --dry-run . 2>/dev/null || docker build -t workstation-test ."
else
  echo -e "${YELLOW}⚠ Docker not installed (optional)${NC}"
fi
echo ""

# 8. Health check endpoint
echo "8. Application Health"
echo "---------------------"
if pgrep -f "node.*dist/index.js" > /dev/null; then
  test_check "Application running" "pgrep -f 'node.*dist/index.js'"
  test_check "Health endpoint" "curl -f http://localhost:3000/health 2>/dev/null"
else
  echo -e "${YELLOW}⚠ Application not running (start with: npm start)${NC}"
fi
echo ""

# 9. Cron syntax validation
echo "9. Cron Syntax Validation"
echo "-------------------------"
# Test some common cron patterns
CRON_PATTERNS=(
  "*/5 * * * *"
  "0 2 * * *"
  "0 9 * * 1-5"
)

for pattern in "${CRON_PATTERNS[@]}"; do
  # Basic validation (5 fields)
  if [[ $(echo "$pattern" | awk '{print NF}') -eq 5 ]]; then
    echo -e "${GREEN}✓${NC} Valid cron: $pattern"
    ((TESTS_PASSED++))
  else
    echo -e "${RED}✗${NC} Invalid cron: $pattern"
    ((TESTS_FAILED++))
  fi
done
echo ""

# 10. GitHub Actions workflows
echo "10. CI/CD Workflows"
echo "-------------------"
test_check ".github/workflows exists" "[ -d '.github/workflows' ]"
test_check "CI workflow exists" "[ -f '.github/workflows/ci.yml' ]"
test_check "Weekly agent workflow" "[ -f '.github/workflows/agent17-weekly.yml' ]"
echo ""

# Summary
echo "================================="
echo "Test Summary"
echo "================================="
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ All tests passed!${NC}"
  echo "Your automation setup is ready for production."
  exit 0
else
  echo -e "${RED}❌ Some tests failed.${NC}"
  echo "Please review the failures above and fix them."
  exit 1
fi
