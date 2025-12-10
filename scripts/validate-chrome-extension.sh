#!/bin/bash

# Chrome Extension Validation Script
# Verifies the extension is built correctly and ready to use

set -e

echo "=========================================="
echo "🔍 Chrome Extension Validation"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Function to check
check() {
    local name="$1"
    local cmd="$2"
    
    echo -n "Checking $name... "
    if eval "$cmd" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS${NC}"
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
}

# Function to warn
warn() {
    local name="$1"
    local cmd="$2"
    
    echo -n "Checking $name... "
    if eval "$cmd" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  WARN${NC}"
        WARNINGS=$((WARNINGS + 1))
        return 1
    fi
}

echo "📦 Build Artifacts"
echo "-------------------"
check "ZIP file exists" "test -f dist/workstation-ai-agent-v2.1.0.zip"
check "ZIP file size > 100KB" "test $(stat -f%z dist/workstation-ai-agent-v2.1.0.zip 2>/dev/null || stat -c%s dist/workstation-ai-agent-v2.1.0.zip) -gt 100000"
check "ZIP integrity" "unzip -t dist/workstation-ai-agent-v2.1.0.zip"
check "Build directory exists" "test -d build/chrome-extension"

echo ""
echo "📋 Required Files in ZIP"
echo "------------------------"
check "manifest.json" "unzip -l dist/workstation-ai-agent-v2.1.0.zip | grep -q manifest.json"
check "background.js" "unzip -l dist/workstation-ai-agent-v2.1.0.zip | grep -q background.js"
check "content.js" "unzip -l dist/workstation-ai-agent-v2.1.0.zip | grep -q content.js"
check "popup/index.html" "unzip -l dist/workstation-ai-agent-v2.1.0.zip | grep -q popup/index.html"
check "popup/script.js" "unzip -l dist/workstation-ai-agent-v2.1.0.zip | grep -q popup/script.js"
check "icons/icon16.png" "unzip -l dist/workstation-ai-agent-v2.1.0.zip | grep -q icons/icon16.png"
check "icons/icon48.png" "unzip -l dist/workstation-ai-agent-v2.1.0.zip | grep -q icons/icon48.png"
check "icons/icon128.png" "unzip -l dist/workstation-ai-agent-v2.1.0.zip | grep -q icons/icon128.png"

echo ""
echo "🤖 Automation Modules"
echo "--------------------"
check "auto-wait.js" "unzip -l dist/workstation-ai-agent-v2.1.0.zip | grep -q playwright/auto-wait.js"
check "retry.js" "unzip -l dist/workstation-ai-agent-v2.1.0.zip | grep -q playwright/retry.js"
check "self-healing.js" "unzip -l dist/workstation-ai-agent-v2.1.0.zip | grep -q playwright/self-healing.js"
check "network.js" "unzip -l dist/workstation-ai-agent-v2.1.0.zip | grep -q playwright/network.js"

echo ""
echo "🔌 Integration Files"
echo "-------------------"
check "api-bridge.js" "unzip -l dist/workstation-ai-agent-v2.1.0.zip | grep -q api-bridge.js"
check "agent-registry.js" "unzip -l dist/workstation-ai-agent-v2.1.0.zip | grep -q agent-registry.js"
check "mcp-client.js" "unzip -l dist/workstation-ai-agent-v2.1.0.zip | grep -q mcp-client.js"
check "auto-updater.js" "unzip -l dist/workstation-ai-agent-v2.1.0.zip | grep -q auto-updater.js"

echo ""
echo "📄 Manifest Validation"
echo "---------------------"

# Extract manifest for validation
unzip -p dist/workstation-ai-agent-v2.1.0.zip manifest.json > /tmp/manifest.json 2>/dev/null

check "Valid JSON" "jq empty /tmp/manifest.json 2>/dev/null || python3 -m json.tool /tmp/manifest.json > /dev/null 2>&1"
check "Manifest V3" "grep -q '\"manifest_version\": 3' /tmp/manifest.json"
check "Name defined" "grep -q '\"name\"' /tmp/manifest.json"
check "Version defined" "grep -q '\"version\"' /tmp/manifest.json"
check "Background service worker" "grep -q '\"service_worker\"' /tmp/manifest.json"
check "Permissions defined" "grep -q '\"permissions\"' /tmp/manifest.json"

echo ""
echo "📚 Documentation"
echo "---------------"
check "Main README exists" "test -f README.md"
check "Quick start guide" "test -f 🚀_START_HERE_CHROME_EXTENSION.md"
check "Quick run guide" "test -f QUICK_RUN.md"
check "Privacy policy" "test -f docs/privacy-policy.html"
warn "Permissions justification" "test -f docs/PERMISSIONS_JUSTIFICATION.md"
warn "Screenshot guide" "test -f docs/CHROME_WEB_STORE_SCREENSHOTS.md"

echo ""
echo "🏗️  Source Files"
echo "---------------"
check "Chrome extension source" "test -d chrome-extension"
check "Source manifest" "test -f chrome-extension/manifest.json"
check "Source background" "test -f chrome-extension/background.js"
check "Source popup" "test -d chrome-extension/popup"
check "Playwright modules" "test -d chrome-extension/playwright"

echo ""
echo "🔧 Backend Files"
echo "---------------"
check "Backend source exists" "test -d src"
check "package.json exists" "test -f package.json"
check "TypeScript config" "test -f tsconfig.json"
warn "Backend compiled" "test -d dist && test -f dist/index.js"

echo ""
echo "=========================================="
echo "📊 Validation Summary"
echo "=========================================="
echo ""

TOTAL_CHECKS=$((ERRORS + WARNINGS))
PASSED_CHECKS=$((TOTAL_CHECKS - ERRORS - WARNINGS))

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ ALL CHECKS PASSED${NC}"
    echo ""
    echo "🚀 Your Chrome extension is ready!"
    echo ""
    echo "Next steps:"
    echo "  1. Load in Chrome: See 🚀_START_HERE_CHROME_EXTENSION.md"
    echo "  2. Start backend: npm install && npm run build && npm start"
    echo "  3. Deploy: Upload dist/workstation-ai-agent-v2.1.0.zip to Chrome Web Store"
    echo ""
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  PASSED WITH WARNINGS${NC}"
    echo ""
    echo "Warnings: $WARNINGS"
    echo ""
    echo "The extension will work, but some optional files are missing."
    echo "Check the warnings above for details."
    echo ""
    exit 0
else
    echo -e "${RED}❌ VALIDATION FAILED${NC}"
    echo ""
    echo "Errors: $ERRORS"
    echo "Warnings: $WARNINGS"
    echo ""
    echo "Please fix the errors above before proceeding."
    echo "Run: npm run build:chrome"
    echo ""
    exit 1
fi
