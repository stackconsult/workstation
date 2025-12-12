#!/bin/bash

# Comprehensive Chrome Extension Test
# Validates all builds, files, and documentation

echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║                                                                              ║"
echo "║              CHROME EXTENSION - COMPREHENSIVE VALIDATION                     ║"
echo "║                                                                              ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
echo ""

PASS=0
FAIL=0

check() {
    echo -n "Testing: $1... "
    if eval "$2" > /dev/null 2>&1; then
        echo "✅ PASS"
        PASS=$((PASS + 1))
    else
        echo "❌ FAIL"
        FAIL=$((FAIL + 1))
        if [ ! -z "$3" ]; then
            echo "   Error: $3"
        fi
    fi
}

echo "📦 Testing Production ZIP Files"
echo "─────────────────────────────────"
check "Simple ZIP exists" "test -f dist/workstation-ai-agent-v2.1.0.zip"
check "Enterprise ZIP exists" "test -f dist/workstation-ai-agent-enterprise-v2.1.0.zip"
check "Simple ZIP integrity" "unzip -t dist/workstation-ai-agent-v2.1.0.zip"
check "Enterprise ZIP integrity" "unzip -t dist/workstation-ai-agent-enterprise-v2.1.0.zip"
check "Simple ZIP size > 90KB" "test $(stat -f%z dist/workstation-ai-agent-v2.1.0.zip 2>/dev/null || stat -c%s dist/workstation-ai-agent-v2.1.0.zip) -gt 90000"
check "Enterprise ZIP size > 140KB" "test $(stat -f%z dist/workstation-ai-agent-enterprise-v2.1.0.zip 2>/dev/null || stat -c%s dist/workstation-ai-agent-enterprise-v2.1.0.zip) -gt 140000"

echo ""
echo "📚 Testing Documentation Files"
echo "─────────────────────────────────"
check "⚡_CHROME_EXTENSION_READY.txt exists" "test -f ⚡_CHROME_EXTENSION_READY.txt"
check "QUICK_RUN.md exists" "test -f QUICK_RUN.md"
check "README_CHROME_EXTENSION.md exists" "test -f README_CHROME_EXTENSION.md"
check "🚀_START_HERE_CHROME_EXTENSION.md exists" "test -f 🚀_START_HERE_CHROME_EXTENSION.md"
check "CHROME_EXTENSION_FILES.txt exists" "test -f CHROME_EXTENSION_FILES.txt"

echo ""
echo "🔧 Testing Build Scripts"
echo "─────────────────────────────────"
check "build-chrome-extension.sh exists" "test -f scripts/build-chrome-extension.sh"
check "build-enterprise-chrome-extension.sh exists" "test -f scripts/build-enterprise-chrome-extension.sh"
check "validate-chrome-extension.sh exists" "test -f scripts/validate-chrome-extension.sh"
check "build-chrome-extension.sh is executable" "test -x scripts/build-chrome-extension.sh"

echo ""
echo "📄 Testing Chrome Web Store Documentation"
echo "─────────────────────────────────"
check "Privacy policy exists" "test -f docs/privacy-policy.html"
check "Permissions justification exists" "test -f docs/PERMISSIONS_JUSTIFICATION.md"
check "Screenshot guide exists" "test -f docs/CHROME_WEB_STORE_SCREENSHOTS.md"
check "Production checklist exists" "test -f CHROME_WEB_STORE_PRODUCTION_CHECKLIST.md"
check "Deployment guide exists" "test -f CHROME_EXTENSION_ENTERPRISE_DEPLOYMENT.md"

echo ""
echo "🗂️ Testing Source Files"
echo "─────────────────────────────────"
check "chrome-extension directory exists" "test -d chrome-extension"
check "manifest.json exists" "test -f chrome-extension/manifest.json"
check "background.js exists" "test -f chrome-extension/background.js"
check "popup directory exists" "test -d chrome-extension/popup"
check "playwright directory exists" "test -d chrome-extension/playwright"

echo ""
echo "📦 Testing ZIP Contents"
echo "─────────────────────────────────"
check "Simple ZIP has manifest" "unzip -l dist/workstation-ai-agent-v2.1.0.zip | grep -q manifest.json"
check "Simple ZIP has background.js" "unzip -l dist/workstation-ai-agent-v2.1.0.zip | grep -q background.js"
check "Enterprise ZIP has manifest" "unzip -l dist/workstation-ai-agent-enterprise-v2.1.0.zip | grep -q manifest.json"
check "Enterprise ZIP has dashboard" "unzip -l dist/workstation-ai-agent-enterprise-v2.1.0.zip | grep -q dashboard"

echo ""
echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║                                                                              ║"
echo "║                           VALIDATION SUMMARY                                 ║"
echo "║                                                                              ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
echo ""
echo "  ✅ Passed: $PASS"
echo "  ❌ Failed: $FAIL"
echo ""

if [ $FAIL -eq 0 ]; then
    echo "🎉 ALL TESTS PASSED! Chrome extension is ready to use!"
    echo ""
    echo "Next steps:"
    echo "  1. Extract: unzip dist/workstation-ai-agent-v2.1.0.zip -d ~/chrome-ext"
    echo "  2. Load in Chrome: chrome://extensions/ → Load unpacked"
    echo "  3. Or upload to Chrome Web Store: dist/workstation-ai-agent-enterprise-v2.1.0.zip"
    echo ""
    exit 0
else
    echo "⚠️  Some tests failed. Please review errors above."
    exit 1
fi
