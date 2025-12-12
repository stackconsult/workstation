#!/bin/bash

# Enterprise Chrome Extension Build Script
# Creates a production-ready, fully functional Chrome extension ZIP
# for deployment in Google Chrome Developer Extension Builder

set -e

echo "=========================================="
echo "🏢 ENTERPRISE CHROME EXTENSION BUILD"
echo "=========================================="
echo ""

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BUILD_DIR="$ROOT_DIR/build/chrome-extension-enterprise"
OUTPUT_DIR="$ROOT_DIR/dist"
EXTENSION_NAME="workstation-ai-agent-enterprise"
VERSION=$(node -p "require('$ROOT_DIR/chrome-extension/manifest.json').version")
OUTPUT_ZIP="${OUTPUT_DIR}/${EXTENSION_NAME}-v${VERSION}.zip"

cd "$ROOT_DIR"

echo "📦 Building Enterprise Chrome Extension v${VERSION}"
echo "🏗️  Build Directory: $BUILD_DIR"
echo "📁 Output: $OUTPUT_ZIP"
echo ""

# ============================================================================
# PHASE 1: CLEAN & SETUP
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Phase 1: Clean & Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "🧹 Cleaning previous builds..."
rm -rf "$BUILD_DIR"
rm -f "$OUTPUT_ZIP"

echo "📁 Creating build directories..."
mkdir -p "$BUILD_DIR"
mkdir -p "$OUTPUT_DIR"

# ============================================================================
# PHASE 2: GENERATE HIGH-QUALITY ICONS
# ============================================================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Phase 2: Generate High-Quality Icons"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if command -v convert &> /dev/null; then
    echo "✨ Generating PNG icons from SVG..."
    
    # Create temporary directory for icons
    mkdir -p "$BUILD_DIR/icons"
    
    # Generate icons at different sizes
    convert -background none \
            -size 16x16 \
            "$ROOT_DIR/chrome-extension/icons/icon.svg" \
            "$BUILD_DIR/icons/icon16.png"
    
    convert -background none \
            -size 48x48 \
            "$ROOT_DIR/chrome-extension/icons/icon.svg" \
            "$BUILD_DIR/icons/icon48.png"
    
    convert -background none \
            -size 128x128 \
            "$ROOT_DIR/chrome-extension/icons/icon.svg" \
            "$BUILD_DIR/icons/icon128.png"
    
    echo "✅ Generated icons: 16x16, 48x48, 128x128"
else
    echo "⚠️  ImageMagick not found, using existing icons..."
    mkdir -p "$BUILD_DIR/icons"
    cp "$ROOT_DIR/chrome-extension/icons"/*.png "$BUILD_DIR/icons/" 2>/dev/null || true
    cp "$ROOT_DIR/chrome-extension/icons/icon.svg" "$BUILD_DIR/icons/"
fi

# ============================================================================
# PHASE 3: BUILD BACKEND (TypeScript → JavaScript)
# ============================================================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Phase 3: Build Backend (TypeScript)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "🔨 Compiling TypeScript backend..."
npm run build

echo "✅ Backend compiled to dist/"

# ============================================================================
# PHASE 4: BUILD FRONTEND UI (Vite Build)
# ============================================================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Phase 4: Build Frontend UI"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "vite.config.ts" ]; then
    echo "🎨 Building UI with Vite..."
    npm run build:ui || echo "⚠️  UI build failed or not configured, continuing..."
else
    echo "ℹ️  No Vite config found, skipping UI build"
fi

# ============================================================================
# PHASE 5: COPY CHROME EXTENSION FILES
# ============================================================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Phase 5: Copy Chrome Extension Files"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "📋 Copying core extension files..."

# Core extension files
cp "$ROOT_DIR/chrome-extension/manifest.json" "$BUILD_DIR/"
cp "$ROOT_DIR/chrome-extension/background.js" "$BUILD_DIR/"
cp "$ROOT_DIR/chrome-extension/content.js" "$BUILD_DIR/"

# API and integration files
echo "📋 Copying API bridge and integration files..."
cp "$ROOT_DIR/chrome-extension/api-bridge.js" "$BUILD_DIR/"
cp "$ROOT_DIR/chrome-extension/agent-registry.js" "$BUILD_DIR/"
cp "$ROOT_DIR/chrome-extension/mcp-client.js" "$BUILD_DIR/"
cp "$ROOT_DIR/chrome-extension/mcp-sync-manager.js" "$BUILD_DIR/"
cp "$ROOT_DIR/chrome-extension/auto-connect.js" "$BUILD_DIR/"
cp "$ROOT_DIR/chrome-extension/auto-updater.js" "$BUILD_DIR/"
cp "$ROOT_DIR/chrome-extension/error-reporter.js" "$BUILD_DIR/"

# Popup UI
echo "📋 Copying popup UI..."
mkdir -p "$BUILD_DIR/popup"
cp -r "$ROOT_DIR/chrome-extension/popup"/* "$BUILD_DIR/popup/"

# Playwright features
echo "📋 Copying Playwright automation features..."
mkdir -p "$BUILD_DIR/playwright"
cp -r "$ROOT_DIR/chrome-extension/playwright"/* "$BUILD_DIR/playwright/"

# Libraries
echo "📋 Copying required libraries..."
mkdir -p "$BUILD_DIR/lib"
cp -r "$ROOT_DIR/chrome-extension/lib"/* "$BUILD_DIR/lib/" 2>/dev/null || true

echo "✅ Extension files copied"

# ============================================================================
# PHASE 6: BUNDLE BACKEND API FOR EXTENSION
# ============================================================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Phase 6: Bundle Backend API"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Create a bundled API directory for the extension
echo "📦 Bundling backend API for extension use..."
mkdir -p "$BUILD_DIR/api"

# Copy essential API files (if they should be accessible from extension)
# Note: Most backend runs separately, but we can include API documentation
cat > "$BUILD_DIR/api/README.md" << 'EOF'
# Workstation AI Agent API

This Chrome extension connects to the Workstation backend API.

## Backend Server
The backend server must be running for full functionality.

**Start backend:**
```bash
npm start
```

**Default URL:** http://localhost:3000

## API Endpoints

### Workflow Execution
- `POST /api/workflow/execute` - Execute workflow
- `GET /api/workflow/status/:id` - Get workflow status
- `GET /api/workflow/history` - Get workflow history

### Templates
- `GET /api/templates` - List all templates
- `GET /api/templates/:id` - Get specific template

### Health
- `GET /health` - Health check
- `GET /api/health` - API health check

## Authentication
The extension uses JWT authentication when configured.

Set `JWT_SECRET` in the backend `.env` file.
EOF

# ============================================================================
# PHASE 7: COPY DASHBOARD & UI ASSETS
# ============================================================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Phase 7: Copy Dashboard & UI Assets"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Copy public assets for embedded dashboard
echo "🎨 Copying dashboard and UI assets..."
mkdir -p "$BUILD_DIR/dashboard"

if [ -d "$ROOT_DIR/public" ]; then
    # Copy essential public files
    cp "$ROOT_DIR/public/workflow-builder.html" "$BUILD_DIR/dashboard/" 2>/dev/null || true
    cp "$ROOT_DIR/public/dashboard.html" "$BUILD_DIR/dashboard/" 2>/dev/null || true
    
    # Copy CSS
    if [ -d "$ROOT_DIR/public/css" ]; then
        mkdir -p "$BUILD_DIR/dashboard/css"
        cp -r "$ROOT_DIR/public/css"/* "$BUILD_DIR/dashboard/css/"
    fi
    
    # Copy JS
    if [ -d "$ROOT_DIR/public/js" ]; then
        mkdir -p "$BUILD_DIR/dashboard/js"
        cp -r "$ROOT_DIR/public/js"/* "$BUILD_DIR/dashboard/js/"
    fi
fi

echo "✅ Dashboard assets copied"

# ============================================================================
# PHASE 8: CREATE COMPREHENSIVE README
# ============================================================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Phase 8: Create Documentation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cat > "$BUILD_DIR/README.md" << 'EOF'
# Workstation AI Agent - Enterprise Chrome Extension

## 🚀 Installation Guide

### Method 1: Load Unpacked Extension (Development)

1. **Extract this ZIP file** to a permanent location
2. **Open Chrome** and navigate to: `chrome://extensions/`
3. **Enable Developer Mode** (toggle in top-right corner)
4. Click **"Load unpacked"**
5. Select the extracted folder
6. Extension installed! ✅

### Method 2: Chrome Web Store (Production)

*Coming soon - This extension will be published to the Chrome Web Store*

## 🔧 Backend Server Setup

This extension requires the backend server to be running for full functionality.

### Start the Backend:

```bash
# Navigate to the backend directory
cd /path/to/workstation

# Install dependencies (first time only)
npm install

# Build the backend
npm run build

# Start the server
npm start
```

**Server will run on:** http://localhost:3000

### Configure Extension:

1. Click the extension icon
2. Go to **Settings** tab
3. Set **Backend URL** to: `http://localhost:3000`
4. Click **Save Settings**

## 📚 Features

### ✨ Browser Automation
- Record and replay browser interactions
- Visual workflow builder
- Multi-step automation sequences
- Playwright-powered execution

### 🤖 AI Agents
- 25+ pre-configured AI agents
- Intelligent task execution
- Self-healing workflows
- Context-aware automation

### 🔄 Real-time Sync
- MCP (Model Context Protocol) integration
- Live workflow updates
- Auto-reconnect capability
- Status monitoring

### 📊 Workflow Management
- Template library (20+ workflows)
- Execution history
- Result tracking
- Export capabilities

## 🎯 Quick Start

### Execute a Workflow:

1. Click extension icon
2. Enter workflow description:
   ```
   Search for 'AI automation' on Google and take a screenshot
   ```
3. Click **🚀 Execute Workflow**
4. Watch automation run in real-time!

### Use Templates:

1. Go to **Templates** tab
2. Choose from 20+ ready-made workflows:
   - Google Search
   - Form Filling
   - Data Extraction
   - Screenshot Capture
   - Multi-page Navigation
3. Click template to load
4. Execute immediately or customize

### Visual Builder:

1. Go to **Builder** tab
2. Click **🎨 Open Builder**
3. Drag-and-drop workflow nodes
4. Connect actions visually
5. Save and execute

## 🛡️ Security Features

- JWT authentication
- Rate limiting
- Input validation
- XSS protection
- CSP enforcement
- Secure error handling

## 🔍 Troubleshooting

### Extension not connecting to backend:

1. Verify backend is running: `http://localhost:3000/health`
2. Check extension Settings > Backend URL
3. Ensure no firewall blocking localhost
4. Check browser console for errors

### Workflows not executing:

1. Verify backend connection (green indicator)
2. Check workflow syntax
3. Review execution history for errors
4. Enable auto-retry in Settings

### Icons not displaying:

1. Reload extension: `chrome://extensions/` → Click reload
2. Clear browser cache
3. Reinstall extension

## 📖 Documentation

Full documentation available at:
- **API Reference:** `/api/README.md`
- **GitHub:** https://github.com/creditXcredit/workstation
- **Architecture:** See ARCHITECTURE.md in repository

## 🆘 Support

- **Issues:** https://github.com/creditXcredit/workstation/issues
- **Discussions:** https://github.com/creditXcredit/workstation/discussions

## 📄 License

ISC License - See LICENSE file

## 🏆 Credits

Built with:
- Playwright (browser automation)
- Express.js (backend API)
- TypeScript (type safety)
- React (UI components)
- MCP (AI integration)

---

**Version:** 2.1.0 Enterprise
**Built:** $(date)
**Platform:** Google Chrome Extension
EOF

# ============================================================================
# PHASE 9: CREATE INSTALLATION SCRIPT
# ============================================================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Phase 9: Create Installation Script"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cat > "$BUILD_DIR/INSTALL.sh" << 'EOF'
#!/bin/bash

echo "=========================================="
echo "Workstation AI Agent - Quick Install"
echo "=========================================="
echo ""

# Check if running on macOS or Linux
if [[ "$OSTYPE" == "darwin"* ]]; then
    CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    CHROME_EXTENSIONS="chrome://extensions/"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    CHROME_PATH="google-chrome"
    CHROME_EXTENSIONS="chrome://extensions/"
else
    echo "❌ Unsupported operating system"
    exit 1
fi

echo "📋 Installation Steps:"
echo ""
echo "1. This script will open Chrome extensions page"
echo "2. Enable 'Developer mode' (toggle in top-right)"
echo "3. Click 'Load unpacked'"
echo "4. Select this folder: $(pwd)"
echo ""
read -p "Press Enter to open Chrome..."

# Open Chrome extensions page
if command -v xdg-open &> /dev/null; then
    xdg-open "$CHROME_EXTENSIONS"
elif command -v open &> /dev/null; then
    open "$CHROME_EXTENSIONS"
else
    echo "Please manually open: $CHROME_EXTENSIONS"
fi

echo ""
echo "✅ Follow the instructions in Chrome to complete installation"
echo ""
EOF

chmod +x "$BUILD_DIR/INSTALL.sh"

echo "✅ Installation script created"

# ============================================================================
# PHASE 10: OPTIMIZE & CLEAN
# ============================================================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Phase 10: Optimize & Clean"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "🧹 Removing development files..."
cd "$BUILD_DIR"

# Remove development files
rm -f README_V2.md 2>/dev/null || true
rm -f PLAYWRIGHT_FEATURES.md 2>/dev/null || true
rm -f *.backup 2>/dev/null || true
rm -rf .git 2>/dev/null || true
rm -rf node_modules 2>/dev/null || true
rm -rf test 2>/dev/null || true
rm -rf tests 2>/dev/null || true

# Remove .map files (optional - keep for debugging)
# find . -name "*.map" -delete

echo "✅ Cleaned development files"

# ============================================================================
# PHASE 11: VALIDATE MANIFEST
# ============================================================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Phase 11: Validate Manifest"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "✅ Validating manifest.json..."
if ! node -e "JSON.parse(require('fs').readFileSync('./manifest.json', 'utf8'))"; then
    echo "❌ Error: Invalid manifest.json"
    exit 1
fi

echo "✅ Manifest valid"

# ============================================================================
# PHASE 12: CHECK REQUIRED FILES
# ============================================================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Phase 12: Verify Required Files"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

REQUIRED_FILES=(
    "manifest.json"
    "background.js"
    "content.js"
    "icons/icon16.png"
    "icons/icon48.png"
    "icons/icon128.png"
    "popup/index.html"
    "popup/script.js"
    "README.md"
)

echo "🔍 Checking required files..."
MISSING_FILES=()
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        MISSING_FILES+=("$file")
    else
        echo "  ✓ $file"
    fi
done

if [ ${#MISSING_FILES[@]} -gt 0 ]; then
    echo ""
    echo "❌ Error: Missing required files:"
    printf '  ✗ %s\n' "${MISSING_FILES[@]}"
    exit 1
fi

echo "✅ All required files present"

# ============================================================================
# PHASE 13: CREATE ZIP PACKAGE
# ============================================================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Phase 13: Create ZIP Package"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "📦 Creating enterprise ZIP package..."

# Create ZIP from build directory
zip -r "$OUTPUT_ZIP" . \
    -x "*.DS_Store" \
    -x "__MACOSX/*" \
    -x "*.git/*" \
    -x "node_modules/*" \
    -q

echo "✅ ZIP created: $OUTPUT_ZIP"

# Return to root
cd "$ROOT_DIR"

# ============================================================================
# PHASE 14: VERIFY & REPORT
# ============================================================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Phase 14: Verify & Report"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "🔍 Verifying ZIP package..."
if ! unzip -t "$OUTPUT_ZIP" > /dev/null 2>&1; then
    echo "❌ Error: ZIP file is corrupted"
    exit 1
fi

# Calculate sizes
ZIP_SIZE=$(du -h "$OUTPUT_ZIP" | cut -f1)
UNZIPPED_SIZE=$(du -sh "$BUILD_DIR" | cut -f1)
FILE_COUNT=$(find "$BUILD_DIR" -type f | wc -l)

# ============================================================================
# FINAL REPORT
# ============================================================================
echo ""
echo "=========================================="
echo "✅ ENTERPRISE BUILD COMPLETE!"
echo "=========================================="
echo ""
echo "📦 Package Details:"
echo "  Name:          $EXTENSION_NAME"
echo "  Version:       $VERSION"
echo "  ZIP Size:      $ZIP_SIZE"
echo "  Unzipped Size: $UNZIPPED_SIZE"
echo "  Total Files:   $FILE_COUNT"
echo ""
echo "📁 Output Locations:"
echo "  ZIP Package:   $OUTPUT_ZIP"
echo "  Build Folder:  $BUILD_DIR"
echo ""
echo "📋 ZIP Contents (summary):"
unzip -l "$OUTPUT_ZIP" | tail -n +4 | head -n 30 | awk '{print "  " $4}'
echo "  ..."
echo ""
echo "🚀 Next Steps:"
echo ""
echo "  1️⃣  Extract ZIP to permanent location:"
echo "     unzip $OUTPUT_ZIP -d /path/to/install/"
echo ""
echo "  2️⃣  Load in Chrome (Development):"
echo "     - Open: chrome://extensions/"
echo "     - Enable 'Developer mode'"
echo "     - Click 'Load unpacked'"
echo "     - Select: $BUILD_DIR"
echo ""
echo "  3️⃣  Or use Chrome Developer Dashboard:"
echo "     - Go to: https://chrome.google.com/webstore/devconsole"
echo "     - Click 'New Item'"
echo "     - Upload: $OUTPUT_ZIP"
echo ""
echo "  4️⃣  Start Backend Server:"
echo "     npm install && npm run build && npm start"
echo "     Server: http://localhost:3000"
echo ""
echo "  5️⃣  Configure Extension:"
echo "     - Click extension icon"
echo "     - Settings > Backend URL: http://localhost:3000"
echo "     - Save Settings"
echo ""
echo "📚 Documentation:"
echo "  - README:      $BUILD_DIR/README.md"
echo "  - API Docs:    $BUILD_DIR/api/README.md"
echo "  - Install:     $BUILD_DIR/INSTALL.sh"
echo ""
echo "=========================================="
echo "🎉 Ready for Chrome Web Store Deployment!"
echo "=========================================="
