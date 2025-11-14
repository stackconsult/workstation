#!/bin/bash

# Chrome Extension Deployment Script
# This script prepares the extension for Chrome Web Store submission

set -e

echo "📦 Chrome Extension Build & Package"
echo "===================================="
echo ""

# Build extension
echo "🔨 Building extension..."
npm install
npm run build

echo "✅ Extension built successfully"
echo ""

# Create package directory
PACKAGE_DIR="extension-package"
mkdir -p "$PACKAGE_DIR"

# Copy dist to package
echo "📦 Packaging extension..."
cp -r dist/* "$PACKAGE_DIR/"

# Create zip file
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
ZIP_NAME="stackBrowserAgent-${TIMESTAMP}.zip"

cd "$PACKAGE_DIR"
zip -r "../${ZIP_NAME}" .
cd ..

echo "✅ Extension packaged: ${ZIP_NAME}"
echo ""

# Display package info
echo "📊 Package Information:"
echo "   File: ${ZIP_NAME}"
echo "   Size: $(du -h "${ZIP_NAME}" | cut -f1)"
echo ""

# Cleanup
rm -rf "$PACKAGE_DIR"

echo "🎯 Next Steps for Chrome Web Store:"
echo ""
echo "1. Go to Chrome Web Store Developer Dashboard:"
echo "   https://chrome.google.com/webstore/devconsole"
echo ""
echo "2. Create a new item (or update existing)"
echo ""
echo "3. Upload the package:"
echo "   File: ${ZIP_NAME}"
echo ""
echo "4. Fill in store listing:"
echo "   - Name: stackBrowserAgent"
echo "   - Description: Enterprise hybrid browser agent with multi-agent orchestration"
echo "   - Category: Productivity"
echo "   - Screenshots: Use docs/screenshots/"
echo ""
echo "5. Set privacy settings:"
echo "   - Single purpose: Browser automation and workflow orchestration"
echo "   - Data usage: Local storage for API keys (BYOK)"
echo "   - Remote code: LLM API calls (user-configured)"
echo ""
echo "6. Submit for review"
echo ""
echo "📝 Store Listing Tips:"
echo "   - Highlight: Enterprise features, multi-LLM support, privacy-first"
echo "   - Keywords: browser automation, workflow, AI agent, RAG"
echo "   - Support: Link to GitHub documentation"
echo ""
echo "✅ Extension package ready for submission!"
