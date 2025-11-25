#!/usr/bin/env bash

##
# Workflow Builder One-Click Deployment Script
# Packages workflow builder for distribution
##

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PUBLIC_DIR="public"
BUILD_DIR="build/workflow-builder"
DIST_DIR="public/downloads"
VERSION=$(node -p "require('./package.json').version")
BUILDER_ZIP="workstation-workflow-builder-v${VERSION}.zip"

echo -e "${GREEN}🚀 Workflow Builder Deployment${NC}"
echo "Version: $VERSION"
echo ""

# Step 1: Clean previous builds
echo -e "${YELLOW}📦 Cleaning previous builds...${NC}"
rm -rf "$BUILD_DIR"
rm -rf "$DIST_DIR/$BUILDER_ZIP"
mkdir -p "$BUILD_DIR"
mkdir -p "$DIST_DIR"

# Step 2: Copy workflow builder files
echo -e "${YELLOW}📂 Copying workflow builder files...${NC}"
cp "$PUBLIC_DIR/workflow-builder.html" "$BUILD_DIR/"
cp -r "$PUBLIC_DIR/css" "$BUILD_DIR/" 2>/dev/null || true
cp -r "$PUBLIC_DIR/js" "$BUILD_DIR/" 2>/dev/null || true

# Step 3: Create standalone bundle with CDN fallbacks
echo -e "${YELLOW}📦 Creating standalone bundle...${NC}"
cat > "$BUILD_DIR/README.md" << 'EOF'
# Workstation Workflow Builder

## Quick Start

1. Open `workflow-builder.html` in a web browser
2. Ensure the Workstation backend is running at http://localhost:3000
3. Log in if required (JWT token will be stored in localStorage)
4. Start building visual workflows!

## Features

- 🎨 Visual drag-and-drop workflow builder
- 🧩 30+ node types (Browser, Data, Integration, Storage agents)
- ⚡ Parallel execution support
- 💾 Save workflows to backend
- 🚀 Execute workflows with real-time status
- 📊 Execution history tracking
- 📋 Pre-built templates

## Node Categories

### Browser Agents
- Navigate, Click, Fill, Extract, Wait, Condition, Loop

### Data Agents  
- CSV Parse/Write, JSON Parse/Query, Excel Read/Write, PDF Extract/Generate

### Integration Agents
- Google Sheets Read/Write, Calendar Create/List, Email Send/Read

### Storage Agents
- Database Query/Insert, S3 Upload/Download, File Read/Write

### Orchestration
- Parallel execution for concurrent tasks

## Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Workstation backend running at http://localhost:3000
- JWT authentication token (get from login)

## Usage

### Creating a Workflow

1. Click nodes from the library to add them to the canvas
2. Drag nodes to position them
3. Click nodes to configure parameters
4. Connect nodes by dragging from output to input connectors
5. Save the workflow with the "Save" button
6. Execute with the "Execute" button

### Using Templates

1. Switch to the "Templates" tab
2. Browse available templates
3. Click a template to load it
4. Customize as needed
5. Execute or save

### Workflow Execution

- Click "Execute" to run the current workflow
- Monitor real-time status with progress bar
- View execution logs in the results panel
- Check execution history in the "History" panel

## Troubleshooting

**"Please login first" error:**
- The backend requires JWT authentication
- Log in via the main application first
- Token is stored in localStorage.authToken

**Workflow won't execute:**
- Check that backend is running: `npm start`
- Verify backend URL in browser console
- Check network tab for API errors

**Nodes won't connect:**
- Ensure you're dragging from output (right) to input (left)
- Check that node types are compatible
- Refresh if connections don't render

## Development

To run in development mode:
```bash
npm run dev
# Access at http://localhost:3000/workflow-builder.html
```

## API Endpoints Used

- POST /api/v2/workflows - Create workflow
- GET /api/v2/workflows - List workflows
- POST /api/v2/workflows/:id/execute - Execute workflow
- GET /api/v2/executions/:id/status - Get execution status
- GET /api/v2/executions/:id/logs - Get execution logs
- GET /api/v2/templates - List templates

## Support

GitHub: https://github.com/creditXcredit/workstation
Issues: https://github.com/creditXcredit/workstation/issues
EOF

# Step 4: Create ZIP package
echo -e "${YELLOW}📦 Creating ZIP package...${NC}"
cd "$BUILD_DIR"
zip -r "../../$DIST_DIR/$BUILDER_ZIP" . -x "*.DS_Store" -x "__MACOSX/*"
cd ../..

# Step 5: Generate checksum
echo -e "${YELLOW}🔐 Generating checksum...${NC}"
if command -v sha256sum &> /dev/null; then
    sha256sum "$DIST_DIR/$BUILDER_ZIP" > "$DIST_DIR/$BUILDER_ZIP.sha256"
elif command -v shasum &> /dev/null; then
    shasum -a 256 "$DIST_DIR/$BUILDER_ZIP" > "$DIST_DIR/$BUILDER_ZIP.sha256"
fi

# Step 6: Update downloads manifest
echo -e "${YELLOW}📋 Updating downloads manifest...${NC}"
node -e "
const fs = require('fs');

// Read existing manifest or create new one
let manifest = { 
  version: '$VERSION', 
  generated: new Date().toISOString(), 
  files: [] 
};

const manifestPath = '$DIST_DIR/manifest.json';
if (fs.existsSync(manifestPath)) {
  try {
    const existing = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    // Preserve existing structure and update version/generated
    manifest.version = '$VERSION';
    manifest.generated = new Date().toISOString();
    manifest.files = existing.files || [];
  } catch (e) {
    console.warn('Could not parse existing manifest, creating new one');
  }
}

// Add or update workflow builder entry
const builderEntry = {
  name: 'Workflow Builder',
  filename: '$BUILDER_ZIP',
  size: fs.statSync('$DIST_DIR/$BUILDER_ZIP').size,
  type: 'application/zip',
  description: 'Visual workflow builder for creating browser automation workflows',
  installUrl: '/downloads/$BUILDER_ZIP',
  docsUrl: 'https://github.com/creditXcredit/workstation#workflow-builder'
};

const existingIndex = manifest.files.findIndex(f => f.name === 'Workflow Builder');
if (existingIndex >= 0) {
  manifest.files[existingIndex] = builderEntry;
} else {
  manifest.files.push(builderEntry);
}

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
"

# Step 7: Display summary
echo ""
echo -e "${GREEN}✅ Workflow Builder Deployment Complete!${NC}"
echo ""
echo "📦 Package:  $DIST_DIR/$BUILDER_ZIP"
echo "📄 Docs:     $BUILD_DIR/README.md"
echo "🌐 Access:   http://localhost:3000/workflow-builder.html"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Extract the ZIP to your desired location"
echo "2. Open workflow-builder.html in a web browser"
echo "3. Ensure backend is running: npm start"
echo "4. Start building workflows!"
echo ""
