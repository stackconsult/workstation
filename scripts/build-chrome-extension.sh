#!/bin/bash

# Chrome Extension Build and Package Script
# Creates a production-ready ZIP file for Chrome Web Store submission

set -e

echo "=========================================="
echo "Chrome Extension Build & Package"
echo "=========================================="
echo ""

# Configuration
BUILD_DIR="build/chrome-extension"
DIST_DIR="dist/chrome-extension"
OUTPUT_DIR="dist"
EXTENSION_NAME="workstation-ai-agent"
VERSION=$(node -p "require('./chrome-extension/manifest.json').version")
OUTPUT_ZIP="${OUTPUT_DIR}/${EXTENSION_NAME}-v${VERSION}.zip"

echo "📦 Building Chrome Extension v${VERSION}"
echo ""

# Step 1: Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf "$BUILD_DIR"
rm -rf "$DIST_DIR"
rm -f "$OUTPUT_ZIP"

# Step 2: Create build directories
echo "📁 Creating build directories..."
mkdir -p "$BUILD_DIR"
mkdir -p "$DIST_DIR"
mkdir -p "$OUTPUT_DIR"

# Step 3: Copy extension files
echo "📋 Copying extension files..."
cp -r chrome-extension/* "$BUILD_DIR/"

# Step 4: Remove development files (not needed in production)
echo "🗑️  Removing development files..."
cd "$BUILD_DIR"
rm -f README.md
rm -f README_V2.md
rm -f PLAYWRIGHT_FEATURES.md
rm -f *.backup
rm -rf .git
rm -rf node_modules

# Step 5: Validate manifest.json
echo "✅ Validating manifest.json..."
if ! node -e "JSON.parse(require('fs').readFileSync('./manifest.json', 'utf8'))"; then
    echo "❌ Error: Invalid manifest.json"
    exit 1
fi

# Step 6: Check required files
echo "🔍 Checking required files..."
REQUIRED_FILES=(
    "manifest.json"
    "background.js"
    "content.js"
    "icons/icon16.png"
    "icons/icon48.png"
    "icons/icon128.png"
    "popup/index.html"
)

MISSING_FILES=()
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        MISSING_FILES+=("$file")
    fi
done

if [ ${#MISSING_FILES[@]} -gt 0 ]; then
    echo "❌ Error: Missing required files:"
    printf '%s\n' "${MISSING_FILES[@]}"
    exit 1
fi

# Step 7: Create ZIP package
echo "📦 Creating ZIP package..."
# We're already in $BUILD_DIR from step 4
# Create the zip from here
zip -r "../../${OUTPUT_ZIP}" . -x "*.DS_Store" -x "__MACOSX/*" -x "*.git/*" -q

# Return to root directory
cd ../..

# Step 8: Verify ZIP contents
echo "🔍 Verifying ZIP package..."
if ! unzip -t "$OUTPUT_ZIP" > /dev/null 2>&1; then
    echo "❌ Error: ZIP file is corrupted"
    exit 1
fi

# Step 9: Calculate package size
SIZE=$(du -h "$OUTPUT_ZIP" | cut -f1)

# Step 10: Display summary
echo ""
echo "=========================================="
echo "✅ Build Complete!"
echo "=========================================="
echo ""
echo "Package Details:"
echo "  Name:     $EXTENSION_NAME"
echo "  Version:  $VERSION"
echo "  Size:     $SIZE"
echo "  Output:   $OUTPUT_ZIP"
echo ""
echo "📋 ZIP Contents:"
unzip -l "$OUTPUT_ZIP" | tail -n +4 | head -n -2 | awk '{print "  " $4}'
echo ""
echo "🚀 Next Steps:"
echo "  1. Test the extension locally:"
echo "     - Open chrome://extensions/"
echo "     - Enable 'Developer mode'"
echo "     - Click 'Load unpacked' and select: $BUILD_DIR"
echo ""
echo "  2. Upload to Chrome Web Store:"
echo "     - Go to: https://chrome.google.com/webstore/devconsole"
echo "     - Upload: $OUTPUT_ZIP"
echo ""
echo "  3. For CRX file (optional, for testing):"
echo "     - Load unpacked extension in Chrome"
echo "     - Click 'Pack extension' in chrome://extensions/"
echo "     - Select the build directory: $BUILD_DIR"
echo ""
echo "=========================================="
