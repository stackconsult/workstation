#!/usr/bin/env bash

##
# One-Click Deployment for Chrome Extension and Workflow Builder
# Builds and packages both components for distribution
##

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  🚀 Workstation One-Click Deployment                     ║${NC}"
echo -e "${BLUE}║  Chrome Extension + Workflow Builder                     ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}🔍 Checking prerequisites...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js 18+${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found. Please install npm${NC}"
    exit 1
fi

if ! command -v zip &> /dev/null; then
    echo -e "${RED}❌ zip not found. Please install zip utility${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All prerequisites met${NC}"
echo ""

# Step 1: Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
else
    echo -e "${GREEN}✅ Dependencies already installed${NC}"
fi

# Step 2: Build the project
echo ""
echo -e "${YELLOW}🔨 Building project...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build successful${NC}"

# Step 3: Deploy Chrome Extension
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Deploying Chrome Extension${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

./scripts/deploy-chrome-extension.sh

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Chrome Extension deployment failed${NC}"
    exit 1
fi

# Step 4: Deploy Workflow Builder
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Deploying Workflow Builder${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

./scripts/deploy-workflow-builder.sh

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Workflow Builder deployment failed${NC}"
    exit 1
fi

# Step 5: Generate combined installation guide
echo ""
echo -e "${YELLOW}📝 Generating combined installation guide...${NC}"

VERSION=$(node -p "require('./package.json').version")

cat > "public/downloads/INSTALLATION_GUIDE.md" << EOF
# Workstation Installation Guide

## Version: v${VERSION}

This guide covers installation of both the Chrome Extension and Workflow Builder.

---

## 🌐 Chrome Extension Installation

### Prerequisites
- Google Chrome 88 or higher
- Workstation backend running at http://localhost:3000

### Installation Steps

1. **Download the Extension**
   - Download: \`public/downloads/workstation-chrome-extension-v${VERSION}.zip\`
   - Extract to a folder of your choice

2. **Load in Chrome**
   - Open Chrome and navigate to \`chrome://extensions/\`
   - Enable **Developer mode** (toggle in top right)
   - Click **Load unpacked**
   - Select the \`build/chrome-extension\` directory

3. **Verify Installation**
   - Extension icon should appear in Chrome toolbar
   - Click the icon to open the popup
   - Connection status should show: "Connected to http://localhost:3000"

### Quick Start

1. Click the extension icon in Chrome toolbar
2. Enter a workflow description in the Execute tab:
   \`\`\`
   Navigate to google.com, search for "Workstation", and take a screenshot
   \`\`\`
3. Click "Execute Workflow"
4. View results in the Results panel

---

## 🎨 Workflow Builder Installation

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Workstation backend running at http://localhost:3000

### Installation Steps

1. **Download the Builder**
   - Download: \`public/downloads/workstation-workflow-builder-v${VERSION}.zip\`
   - Extract to a folder of your choice

2. **Open in Browser**
   - Double-click \`workflow-builder.html\`
   - Or open via browser: File → Open → workflow-builder.html
   - Or access via backend: http://localhost:3000/workflow-builder.html

3. **Verify Installation**
   - Visual workflow canvas should load
   - Node library should appear on the left
   - No error messages in browser console

### Quick Start

1. Open workflow-builder.html in your browser
2. Drag nodes from the library onto the canvas:
   - Start → Navigate → Extract → End
3. Click each node to configure parameters
4. Click "Save" to save the workflow
5. Click "Execute" to run the workflow
6. View real-time execution status

---

## 🚀 Starting the Backend

Both components require the Workstation backend to be running:

\`\`\`bash
# From the project root
npm start
\`\`\`

The backend will start on http://localhost:3000

### Verify Backend is Running

- Open http://localhost:3000/health in a browser
- Should return: \`{"status":"ok","timestamp":"..."}\`

---

## 📚 Features

### Chrome Extension Features
- ✅ Execute browser automation workflows
- ✅ Record browser actions
- ✅ Pre-built workflow templates
- ✅ Workflow history tracking
- ✅ Playwright auto-waiting and self-healing
- ✅ Network monitoring and retry logic

### Workflow Builder Features
- 🎨 Visual drag-and-drop interface
- 🧩 30+ node types across 5 categories
- ⚡ Parallel execution support
- 💾 Save workflows to backend
- 🚀 Real-time execution monitoring
- 📊 Execution history
- 📋 Workflow templates

---

## 🔧 Troubleshooting

### Chrome Extension Issues

**"Backend server offline" message:**
- Start the backend: \`npm start\`
- Check backend URL in Settings tab
- Verify port 3000 is not blocked by firewall

**Extension doesn't load:**
- Check chrome://extensions/ for error messages
- Verify manifest.json is valid JSON
- Try reloading the extension (click reload icon)

**Workflows don't execute:**
- Check browser console (F12) for errors
- Verify backend is running: http://localhost:3000/health
- Check that JWT token is set (Settings tab)

### Workflow Builder Issues

**"Please login first" error:**
- Backend requires JWT authentication
- Log in via main application or API
- Token stored in localStorage.authToken

**Nodes won't connect:**
- Drag from output connector (right) to input connector (left)
- Ensure node types are compatible
- Refresh page if connections don't render

**Save/Execute fails:**
- Verify backend is running: \`npm start\`
- Check network tab (F12) for API errors
- Verify /api/v2/workflows endpoint is accessible

---

## 📖 Documentation

- **Main README:** https://github.com/creditXcredit/workstation
- **API Documentation:** \`API.md\`
- **Architecture:** \`ARCHITECTURE.md\`
- **Changelog:** \`CHANGELOG.md\`

---

## 🆘 Support

- **GitHub Issues:** https://github.com/creditXcredit/workstation/issues
- **Discussions:** https://github.com/creditXcredit/workstation/discussions

---

## 📄 License

MIT License - See LICENSE file for details

---

**Installation Date:** \$(date)
**Version:** v${VERSION}
**Platform:** \$(uname -s) \$(uname -m)
EOF

# Step 6: Create quick reference card
cat > "public/downloads/QUICK_REFERENCE.md" << 'EOF'
# Workstation Quick Reference

## 🚀 Quick Start Commands

```bash
# Install dependencies
npm install

# Build project
npm run build

# Start backend
npm start

# Deploy Chrome extension
./scripts/deploy-chrome-extension.sh

# Deploy Workflow builder
./scripts/deploy-workflow-builder.sh

# Deploy both (one-click)
./scripts/deploy-all.sh
```

## 🌐 URLs

- Backend Health: http://localhost:3000/health
- Workflow Builder: http://localhost:3000/workflow-builder.html
- Dashboard: http://localhost:3000/dashboard.html
- API Docs: http://localhost:3000/api-docs

## 🔑 Environment Variables

```bash
# Required
JWT_SECRET=your-secret-key-here

# Optional
PORT=3000
NODE_ENV=production
LOG_LEVEL=info
```

## 📦 Chrome Extension Paths

- Source: `chrome-extension/`
- Build: `build/chrome-extension/`
- Package: `public/downloads/workstation-chrome-extension-v*.zip`

## 🎨 Workflow Builder Paths

- Source: `public/workflow-builder.html`
- Build: `build/workflow-builder/`
- Package: `public/downloads/workstation-workflow-builder-v*.zip`

## 🔧 Common Tasks

### Load Chrome Extension
1. chrome://extensions/
2. Enable Developer mode
3. Load unpacked: `build/chrome-extension/`

### Test Workflow Builder
1. Open: http://localhost:3000/workflow-builder.html
2. Add nodes: Start → Navigate → End
3. Configure and Execute

### Check Backend Status
```bash
curl http://localhost:3000/health
```

### Get JWT Token
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"demo"}'
```

## 📊 API Endpoints

- POST /api/auth/login - Get JWT token
- GET /api/v2/workflows - List workflows
- POST /api/v2/workflows - Create workflow
- POST /api/v2/workflows/:id/execute - Execute workflow
- GET /api/v2/executions/:id/status - Get execution status
- GET /api/v2/templates - List templates

## 🐛 Debug Mode

```bash
# Enable debug logs
export LOG_LEVEL=debug
npm start

# Check logs
tail -f logs/app.log
```
EOF

# Final summary
echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  ✅ Deployment Complete!                                 ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}📦 Packages Created:${NC}"
echo "  - Chrome Extension: public/downloads/workstation-chrome-extension-v${VERSION}.zip"
echo "  - Workflow Builder: public/downloads/workstation-workflow-builder-v${VERSION}.zip"
echo ""
echo -e "${GREEN}📄 Documentation:${NC}"
echo "  - Installation Guide: public/downloads/INSTALLATION_GUIDE.md"
echo "  - Quick Reference: public/downloads/QUICK_REFERENCE.md"
echo "  - Chrome Extension Install: public/downloads/CHROME_EXTENSION_INSTALL.md"
echo "  - Workflow Builder README: build/workflow-builder/README.md"
echo ""
echo -e "${YELLOW}🎯 Next Steps:${NC}"
echo "  1. Start the backend: ${GREEN}npm start${NC}"
echo "  2. Load Chrome extension: ${GREEN}chrome://extensions/${NC}"
echo "  3. Open Workflow Builder: ${GREEN}http://localhost:3000/workflow-builder.html${NC}"
echo ""
echo -e "${BLUE}For detailed instructions, see: public/downloads/INSTALLATION_GUIDE.md${NC}"
echo ""
