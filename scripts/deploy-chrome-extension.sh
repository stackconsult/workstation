#!/usr/bin/env bash

##
# Chrome Extension One-Click Deployment Script
# Builds, packages, and prepares the Chrome extension for installation
##

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
EXTENSION_DIR="chrome-extension"
BUILD_DIR="build/chrome-extension"
DIST_DIR="public/downloads"
VERSION=$(node -p "require('./package.json').version")
EXTENSION_ZIP="workstation-chrome-extension-v${VERSION}.zip"

echo -e "${GREEN}🚀 Chrome Extension Deployment${NC}"
echo "Version: $VERSION"
echo ""

# Step 1: Clean previous builds
echo -e "${YELLOW}📦 Cleaning previous builds...${NC}"
rm -rf "$BUILD_DIR"
rm -rf "$DIST_DIR/$EXTENSION_ZIP"
mkdir -p "$BUILD_DIR"
mkdir -p "$DIST_DIR"

# Step 2: Copy extension files
echo -e "${YELLOW}📂 Copying extension files...${NC}"
cp -r "$EXTENSION_DIR"/* "$BUILD_DIR/"

# Step 3: Update manifest version
echo -e "${YELLOW}✏️  Updating manifest version...${NC}"
node -e "
const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('$BUILD_DIR/manifest.json', 'utf8'));
manifest.version = '$VERSION';
manifest.version_name = 'v$VERSION';
fs.writeFileSync('$BUILD_DIR/manifest.json', JSON.stringify(manifest, null, 2));
"

# Step 4: Create ZIP package
echo -e "${YELLOW}📦 Creating ZIP package...${NC}"
cd "$BUILD_DIR"
zip -r "../../$DIST_DIR/$EXTENSION_ZIP" . -x "*.DS_Store" -x "__MACOSX/*"
cd ../..

# Step 5: Generate checksum
echo -e "${YELLOW}🔐 Generating checksum...${NC}"
if command -v sha256sum &> /dev/null; then
    sha256sum "$DIST_DIR/$EXTENSION_ZIP" > "$DIST_DIR/$EXTENSION_ZIP.sha256"
elif command -v shasum &> /dev/null; then
    shasum -a 256 "$DIST_DIR/$EXTENSION_ZIP" > "$DIST_DIR/$EXTENSION_ZIP.sha256"
fi

# Step 6: Create installation instructions
echo -e "${YELLOW}📝 Creating installation instructions...${NC}"
cat > "$DIST_DIR/CHROME_EXTENSION_INSTALL.md" << EOF
# Chrome Extension Installation

## Version: v${VERSION}

### Method 1: Load Unpacked (Development)

1. Open Chrome and navigate to \`chrome://extensions/\`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select the \`$BUILD_DIR\` directory
5. The extension should now appear in your extensions list

### Method 2: Install from ZIP (Distribution)

1. Download \`$EXTENSION_ZIP\`
2. Extract the ZIP file
3. Open Chrome and navigate to \`chrome://extensions/\`
4. Enable **Developer mode** (toggle in top right)
5. Click **Load unpacked**
6. Select the extracted directory
7. The extension should now appear in your extensions list

### Verification

- Extension icon should appear in Chrome toolbar
- Click the icon to open the popup interface
- Verify connection status shows "Connected to http://localhost:3000"
- If backend is not running, start it with: \`npm start\`

### Features

- ✅ Execute browser automation workflows
- ✅ Visual workflow builder integration
- ✅ Pre-built templates
- ✅ Workflow history tracking
- ✅ Playwright auto-waiting and self-healing
- ✅ Network monitoring and retry logic

### Requirements

- Chrome version 88 or higher
- Backend server running on http://localhost:3000
- Node.js 18+ (for backend)

### Troubleshooting

**Extension shows "Backend server offline":**
- Start the backend: \`npm start\`
- Check the backend URL in Settings tab
- Verify port 3000 is not blocked

**Extension doesn't load:**
- Check Chrome extensions page for error messages
- Verify manifest.json is valid
- Try reloading the extension

**Workflows don't execute:**
- Check browser console for errors
- Verify JWT token is set (check Settings tab)
- Ensure backend /api/v2/workflows endpoint is accessible

### Support

For issues, visit: https://github.com/creditXcredit/workstation/issues
EOF

# Step 7: Update downloads manifest
echo -e "${YELLOW}📋 Updating downloads manifest...${NC}"
node -e "
const fs = require('fs');
const path = require('path');

const manifest = {
  version: '$VERSION',
  generated: new Date().toISOString(),
  files: [
    {
      name: 'Chrome Extension',
      filename: '$EXTENSION_ZIP',
      size: fs.statSync('$DIST_DIR/$EXTENSION_ZIP').size,
      type: 'application/zip',
      description: 'Workstation Chrome Extension for browser automation',
      installUrl: '/downloads/$EXTENSION_ZIP',
      docsUrl: '/downloads/CHROME_EXTENSION_INSTALL.md'
    }
  ]
};

fs.writeFileSync('$DIST_DIR/manifest.json', JSON.stringify(manifest, null, 2));
"

# Step 8: Display summary
echo ""
echo -e "${GREEN}✅ Chrome Extension Deployment Complete!${NC}"
echo ""
echo "📦 Package:  $DIST_DIR/$EXTENSION_ZIP"
echo "📄 Docs:     $DIST_DIR/CHROME_EXTENSION_INSTALL.md"
echo "🔗 Install:  chrome://extensions/ -> Load unpacked -> $BUILD_DIR/"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Load the extension in Chrome: chrome://extensions/"
echo "2. Enable Developer mode"
echo "3. Click 'Load unpacked' and select: $BUILD_DIR/"
echo "4. Start the backend: npm start"
echo "5. Click the extension icon in Chrome toolbar"
echo ""
