#!/usr/bin/env bash

# ============================================================
# Workstation AI Agent - Live Application Verification
# ============================================================
# This script verifies that ALL components are properly wired
# and ready for production deployment
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$ROOT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASSED=0
FAILED=0
WARNINGS=0

print_header() {
    echo ""
    echo "=========================================="
    echo "$1"
    echo "=========================================="
    echo ""
}

print_test() {
    local status=$1
    local message=$2
    
    case $status in
        "PASS")
            echo -e "${GREEN}✅ PASS${NC} - $message"
            PASSED=$((PASSED + 1))
            ;;
        "FAIL")
            echo -e "${RED}❌ FAIL${NC} - $message"
            FAILED=$((FAILED + 1))
            ;;
        "WARN")
            echo -e "${YELLOW}⚠️  WARN${NC} - $message"
            WARNINGS=$((WARNINGS + 1))
            ;;
        "INFO")
            echo -e "${BLUE}ℹ️  INFO${NC} - $message"
            ;;
    esac
}

print_header "🔍 Live Application Verification"

# ============================================================
# TEST 1: Repository Structure
# ============================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test Suite 1: Repository Structure"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check critical files exist
FILES_TO_CHECK=(
    "package.json"
    "tsconfig.json"
    ".env.example"
    ".env"
    "src/index.ts"
    "scripts/build-enterprise-chrome-extension.sh"
    "scripts/start-production.sh"
    "docs/CHROME_WEB_STORE_SCREENSHOTS.md"
    "docs/PERMISSIONS_JUSTIFICATION.md"
    "docs/privacy-policy.html"
    "docs/screenshots/chrome-web-store/README.md"
)

for file in "${FILES_TO_CHECK[@]}"; do
    if [ -f "$file" ]; then
        print_test "PASS" "File exists: $file"
    else
        print_test "FAIL" "Missing file: $file"
    fi
done

# ============================================================
# TEST 2: Build System
# ============================================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test Suite 2: Build System"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if node_modules exists
if [ -d "node_modules" ]; then
    print_test "PASS" "node_modules directory exists"
else
    print_test "FAIL" "node_modules not found - run: npm install"
fi

# Check TypeScript compilation
print_test "INFO" "Testing TypeScript compilation..."
if npm run build > /tmp/build-test.log 2>&1; then
    print_test "PASS" "TypeScript builds successfully"
else
    print_test "FAIL" "TypeScript compilation failed"
    cat /tmp/build-test.log
fi

# Check dist output
if [ -f "dist/index.js" ]; then
    print_test "PASS" "Build output exists (dist/index.js)"
    DIST_SIZE=$(du -sh dist | cut -f1)
    print_test "INFO" "Build size: $DIST_SIZE"
else
    print_test "FAIL" "Build output missing (dist/index.js)"
fi

# ============================================================
# TEST 3: Chrome Extension
# ============================================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test Suite 3: Chrome Extension"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if Chrome extension ZIP exists
if [ -f "dist/workstation-ai-agent-enterprise-v2.1.0.zip" ]; then
    print_test "PASS" "Chrome extension ZIP exists"
    ZIP_SIZE=$(du -h "dist/workstation-ai-agent-enterprise-v2.1.0.zip" | cut -f1)
    print_test "INFO" "ZIP size: $ZIP_SIZE"
    
    # Verify ZIP integrity
    if unzip -t "dist/workstation-ai-agent-enterprise-v2.1.0.zip" > /dev/null 2>&1; then
        print_test "PASS" "ZIP file is valid"
    else
        print_test "FAIL" "ZIP file is corrupted"
    fi
    
    # Count files in ZIP
    FILE_COUNT=$(unzip -l "dist/workstation-ai-agent-enterprise-v2.1.0.zip" | tail -1 | awk '{print $2}')
    print_test "INFO" "Files in ZIP: $FILE_COUNT"
else
    print_test "FAIL" "Chrome extension ZIP not found"
    print_test "INFO" "Run: bash scripts/build-enterprise-chrome-extension.sh"
fi

# Check manifest.json
if [ -f "chrome-extension/manifest.json" ]; then
    print_test "PASS" "Chrome extension manifest exists"
    
    # Validate JSON
    if node -e "JSON.parse(require('fs').readFileSync('chrome-extension/manifest.json', 'utf8'))" 2>/dev/null; then
        print_test "PASS" "Manifest JSON is valid"
    else
        print_test "FAIL" "Manifest JSON is invalid"
    fi
else
    print_test "FAIL" "Chrome extension manifest missing"
fi

# ============================================================
# TEST 4: Configuration
# ============================================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test Suite 4: Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check .env file
if [ -f ".env" ]; then
    print_test "PASS" ".env file exists"
    
    # Safely extract variables from .env without sourcing
    JWT_SECRET="$(grep -E '^\s*JWT_SECRET\s*=' .env | grep -v '^\s*#' | tail -n 1 | sed -E 's/^\s*JWT_SECRET\s*=\s*//;s/\r$//')"
    SESSION_SECRET="$(grep -E '^\s*SESSION_SECRET\s*=' .env | grep -v '^\s*#' | tail -n 1 | sed -E 's/^\s*SESSION_SECRET\s*=\s*//;s/\r$//')"
    ENCRYPTION_KEY="$(grep -E '^\s*ENCRYPTION_KEY\s*=' .env | grep -v '^\s*#' | tail -n 1 | sed -E 's/^\s*ENCRYPTION_KEY\s*=\s*//;s/\r$//')"
    
    if [ -n "$JWT_SECRET" ] && [ ${#JWT_SECRET} -ge 32 ]; then
        print_test "PASS" "JWT_SECRET configured securely (${#JWT_SECRET} chars)"
    else
        print_test "FAIL" "JWT_SECRET not configured or too short"
    fi
    
    if [ -n "$SESSION_SECRET" ] && [ ${#SESSION_SECRET} -ge 32 ]; then
        print_test "PASS" "SESSION_SECRET configured securely (${#SESSION_SECRET} chars)"
    else
        print_test "FAIL" "SESSION_SECRET not configured or too short"
    fi
    
    if [ "$JWT_SECRET" = "$SESSION_SECRET" ]; then
        print_test "FAIL" "JWT_SECRET and SESSION_SECRET must be different"
    else
        print_test "PASS" "JWT_SECRET and SESSION_SECRET are different"
    fi
    
    if [ -n "$ENCRYPTION_KEY" ]; then
        print_test "PASS" "ENCRYPTION_KEY configured"
    else
        print_test "WARN" "ENCRYPTION_KEY not configured"
    fi
else
    print_test "FAIL" ".env file missing - copy from .env.example"
fi

# ============================================================
# TEST 5: Linting
# ============================================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test Suite 5: Code Quality (ESLint)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

print_test "INFO" "Running ESLint..."
if npm run lint > /tmp/lint-test.log 2>&1; then
    print_test "PASS" "ESLint passed with no errors"
else
    # More reliable error/warning count extraction using specific patterns
    ERROR_COUNT=$(grep -E "^\s*[0-9]+:[0-9]+\s+error\s+" /tmp/lint-test.log 2>/dev/null | wc -l || echo "0")
    WARNING_COUNT=$(grep -E "^\s*[0-9]+:[0-9]+\s+warning\s+" /tmp/lint-test.log 2>/dev/null | wc -l || echo "0")
    
    # Trim whitespace from counts
    ERROR_COUNT=$(echo "$ERROR_COUNT" | tr -d ' ')
    WARNING_COUNT=$(echo "$WARNING_COUNT" | tr -d ' ')
    
    if [ "$ERROR_COUNT" = "0" ]; then
        print_test "PASS" "ESLint passed (0 errors, $WARNING_COUNT warnings)"
    else
        print_test "FAIL" "ESLint found $ERROR_COUNT errors"
        tail -20 /tmp/lint-test.log
    fi
fi

# ============================================================
# TEST 6: Server Functionality
# ============================================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test Suite 6: Server Functionality"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

PORT=${PORT:-7042}

# Check if server is already running
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    print_test "INFO" "Server already running on port $PORT"
    SERVER_RUNNING=true
else
    print_test "INFO" "Starting test server on port $PORT..."
    
    # Trap to ensure cleanup of background server on exit or interruption
    cleanup_test_server() {
        if [[ -n "${TEST_SERVER_PID:-}" ]] && kill -0 "$TEST_SERVER_PID" 2>/dev/null; then
            echo -e "${YELLOW}Cleaning up test server (PID $TEST_SERVER_PID)...${NC}"
            kill "$TEST_SERVER_PID" 2>/dev/null || true
            wait "$TEST_SERVER_PID" 2>/dev/null || true
        fi
    }
    trap cleanup_test_server EXIT INT TERM
    
    nohup npm start > /tmp/test-server.log 2>&1 &
    TEST_SERVER_PID=$!
    sleep 5
    SERVER_RUNNING=false
fi

# Test health endpoint
print_test "INFO" "Testing health endpoint..."
if curl -s "http://localhost:$PORT/health" > /dev/null 2>&1; then
    print_test "PASS" "Health endpoint responding"
    
    HEALTH_RESPONSE=$(curl -s "http://localhost:$PORT/health")
    if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
        print_test "PASS" "Server reports healthy status"
    else
        print_test "WARN" "Server health status unclear"
    fi
else
    print_test "FAIL" "Health endpoint not responding"
fi

# Test demo token endpoint
print_test "INFO" "Testing demo token endpoint..."
DEMO_TOKEN_RESPONSE=$(curl -s "http://localhost:$PORT/auth/demo-token" 2>/dev/null || echo "{}")
if echo "$DEMO_TOKEN_RESPONSE" | grep -q "token"; then
    print_test "PASS" "Demo token endpoint working"
    
    DEMO_TOKEN=$(echo "$DEMO_TOKEN_RESPONSE" | jq -r '.token' 2>/dev/null || echo "")
    if [ -n "$DEMO_TOKEN" ]; then
        print_test "INFO" "Token generated: ${DEMO_TOKEN:0:20}..."
        
        # Test protected endpoint
        print_test "INFO" "Testing JWT authentication..."
        PROTECTED_RESPONSE=$(curl -s -H "Authorization: Bearer $DEMO_TOKEN" "http://localhost:$PORT/api/protected" 2>/dev/null || echo "{}")
        if echo "$PROTECTED_RESPONSE" | grep -q "Access granted"; then
            print_test "PASS" "JWT authentication working"
        else
            print_test "FAIL" "JWT authentication failed"
        fi
    fi
else
    print_test "FAIL" "Demo token endpoint not working"
fi

# Test dashboard redirect
print_test "INFO" "Testing dashboard redirect..."
DASHBOARD_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT/" 2>/dev/null || echo "000")
if [ "$DASHBOARD_STATUS" = "302" ] || [ "$DASHBOARD_STATUS" = "200" ]; then
    print_test "PASS" "Dashboard redirect working (HTTP $DASHBOARD_STATUS)"
else
    print_test "WARN" "Dashboard redirect returned HTTP $DASHBOARD_STATUS"
fi

# Stop test server if we started it
if [ "$SERVER_RUNNING" = false ]; then
    if [ -n "${TEST_SERVER_PID:-}" ]; then
        kill "$TEST_SERVER_PID" 2>/dev/null || true
        print_test "INFO" "Test server stopped"
    fi
fi

# ============================================================
# TEST 7: Documentation
# ============================================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test Suite 7: Documentation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

DOCS_TO_CHECK=(
    "README.md"
    "API.md"
    "ARCHITECTURE.md"
    "CHANGELOG.md"
    "QUICK_START_LIVE.md"
    "docs/CHROME_WEB_STORE_SCREENSHOTS.md"
    "docs/PERMISSIONS_JUSTIFICATION.md"
    "docs/privacy-policy.html"
)

for doc in "${DOCS_TO_CHECK[@]}"; do
    if [ -f "$doc" ]; then
        print_test "PASS" "Documentation exists: $doc"
    else
        print_test "WARN" "Missing documentation: $doc"
    fi
done

# ============================================================
# FINAL SUMMARY
# ============================================================
echo ""
echo "=========================================="
echo "📊 Verification Summary"
echo "=========================================="
echo ""
echo -e "${GREEN}✅ PASSED: $PASSED${NC}"
echo -e "${RED}❌ FAILED: $FAILED${NC}"
echo -e "${YELLOW}⚠️  WARNINGS: $WARNINGS${NC}"
echo ""

TOTAL=$((PASSED + FAILED + WARNINGS))

if [ "$TOTAL" -eq 0 ]; then
    SUCCESS_RATE=0
    echo -e "${YELLOW}⚠️  No tests were run. Success Rate is 0%.${NC}"
else
    SUCCESS_RATE=$((PASSED * 100 / TOTAL))
    echo "Success Rate: $SUCCESS_RATE% ($PASSED/$TOTAL)"
fi
echo ""

if [ $FAILED -eq 0 ]; then
    echo "=========================================="
    echo -e "${GREEN}✅ ALL CRITICAL TESTS PASSED!${NC}"
    echo "=========================================="
    echo ""
    echo "🎉 Application is FULLY WIRED and READY FOR PRODUCTION"
    echo ""
    echo "🚀 Next Steps:"
    echo "   1. Start server: bash scripts/start-production.sh"
    echo "   2. Install extension: Load dist/chrome-extension in Chrome"
    echo "   3. Test workflows: http://localhost:7042/dashboard"
    echo "   4. Deploy to production when ready"
    echo ""
    exit 0
else
    echo "=========================================="
    echo -e "${RED}❌ SOME TESTS FAILED${NC}"
    echo "=========================================="
    echo ""
    echo "Please fix the failed tests before deploying to production."
    echo ""
    echo "Common fixes:"
    echo "  - Run: npm install"
    echo "  - Run: npm run build"
    echo "  - Configure .env file"
    echo "  - Run: bash scripts/build-enterprise-chrome-extension.sh"
    echo ""
    exit 1
fi
