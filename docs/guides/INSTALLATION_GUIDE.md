# 📦 Workstation Installation Guide

**Complete installation instructions for all Workstation components**

---

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Server Installation](#server-installation)
3. [Chrome Extension Installation](#chrome-extension-installation)
4. [Workflow Builder Installation](#workflow-builder-installation)
5. [Verification Steps](#verification-steps)
6. [Troubleshooting](#troubleshooting)
7. [Next Steps](#next-steps)

---

## System Requirements

### Minimum Requirements

- **Operating System**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 20.04+)
- **Node.js**: v18.0.0 or higher
- **npm**: v8.0.0 or higher
- **Memory**: 2GB RAM (4GB recommended)
- **Disk Space**: 500MB free space
- **Browser**: Chrome 90+ or Edge 90+ (for extension)

### Optional Requirements

- **Docker**: 20.10+ (for containerized deployment)
- **PostgreSQL**: 12+ (for production database)
- **Git**: 2.30+ (for source installation)

---

## Server Installation

### Option 1: Quick Install (Recommended)

**For most users - fastest way to get started:**

```bash
# Clone the repository
git clone https://github.com/creditXcredit/workstation.git
cd workstation

# Install dependencies
npm install

# Install Playwright browsers (REQUIRED)
npx playwright install --with-deps

# Configure environment
cp .env.example .env
# Edit .env and set JWT_SECRET (see below)

# Build the application
npm run build

# Generate download artifacts
npm run build:downloads

# Start the server
npm start
```

**⚠️ IMPORTANT: Set JWT_SECRET**

Before starting, generate a secure JWT secret:

```bash
# Generate secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Add to .env file
JWT_SECRET=your_generated_secret_here
```

**The server will NOT start without a valid JWT_SECRET!**

### Option 2: Docker Deployment

**For containerized deployment:**

```bash
# Clone repository
git clone https://github.com/creditXcredit/workstation.git
cd workstation

# Build Docker image
docker build -t workstation .

# Run container
docker run -d \
  --name workstation \
  -p 3000:3000 \
  -e JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))") \
  -e NODE_ENV=production \
  --restart unless-stopped \
  workstation
```

### Option 3: Railway Deployment

**For cloud deployment:**

1. Click the "Deploy on Railway" badge in README.md
2. Configure environment variables:
   - `JWT_SECRET`: Generate using crypto (see above)
   - `NODE_ENV`: production
   - `PORT`: 3000 (auto-configured by Railway)
3. Deploy and wait for build completion
4. Access your deployment URL

### Verify Server Installation

After installation, verify the server is running:

```bash
# Check health endpoint
curl http://localhost:3000/health

# Expected response:
# {"success":true,"status":"healthy",...}
```

**Access Points:**

- 🏠 **Home**: `http://localhost:3000/`
- 📊 **Dashboard**: `http://localhost:3000/dashboard.html`
- 🎨 **Workflow Builder**: `http://localhost:3000/workflow-builder.html`
- 📥 **Downloads**: `http://localhost:3000/downloads/`
- 📋 **API Docs**: `http://localhost:3000/api/docs`

---

## Chrome Extension Installation

### Download and Install

**Step 1: Download the Extension**

Choose one of these methods:

**Method A: Download from Dashboard (Easiest)**

1. Open `http://localhost:3000/dashboard.html` in Chrome
2. Click the "📦 Download Chrome Extension" button
3. Save the ZIP file to your Downloads folder

**Method B: Direct Download**

1. Visit `http://localhost:3000/downloads/chrome-extension.zip`
2. Save the ZIP file

**Method C: Build from Source**

```bash
# From project root
npm run build:chrome

# Extension will be in build/chrome-extension/
```

**Step 2: Extract the ZIP File**

1. Locate the downloaded `chrome-extension.zip` file
2. Right-click and select "Extract All..." (Windows) or double-click (Mac)
3. Choose a permanent location (e.g., `Documents/Workstation/chrome-extension`)
4. **Important**: Don't delete this folder - Chrome needs it to stay installed!

**Step 3: Load Extension in Chrome**

1. Open Chrome browser
2. Navigate to `chrome://extensions/`
3. Enable **"Developer mode"** (toggle in top-right corner)
4. Click **"Load unpacked"** button
5. Browse to the extracted `chrome-extension` folder
6. Select the folder and click "Select Folder"
7. The Workstation extension icon should appear in your toolbar! 🎉

**Step 4: Configure Extension**

1. Click the Workstation extension icon in your toolbar
2. Go to **Settings** tab
3. Configure:
   - **Backend URL**: `http://localhost:3000` (default)
   - **Poll Interval**: 5 seconds (default)
   - **API Timeout**: 30 seconds (default)
4. Click **Save Settings**

**Step 5: Authenticate**

1. Click **Login** tab
2. Enter your JWT token (get from dashboard or generate new one)
3. Click **Login**
4. ✅ You're ready to use the extension!

### Extension Features

Once installed, you can:

- ✨ **Natural Language Workflows**: Describe automation tasks in plain English
- 🎯 **Visual Recording**: Record browser actions (click, type, navigate)
- 📊 **Workflow Management**: View, execute, and monitor workflows
- 💾 **History**: Access previously run workflows
- ⚙️ **Settings**: Customize backend URL and behavior

### Updating the Extension

To update to a new version:

1. Download the latest ZIP file
2. Extract to the SAME location as before
3. Go to `chrome://extensions/`
4. Click the **refresh icon** on the Workstation extension card
5. Extension is now updated! 🚀

---

## Workflow Builder Installation

### Download and Install

**Step 1: Download the Workflow Builder**

Choose one of these methods:

**Method A: Download from Dashboard (Easiest)**

1. Open `http://localhost:3000/dashboard.html`
2. Click the "🎨 Download Workflow Builder" button
3. Save the ZIP file

**Method B: Direct Download**

1. Visit `http://localhost:3000/downloads/workflow-builder.zip`
2. Save the ZIP file

**Method C: Use Online Version (No Download)**

1. Simply visit `http://localhost:3000/workflow-builder.html`
2. Use the workflow builder directly in your browser
3. No installation needed! 🎉

**Step 2: Extract and Use (For Downloaded Version)**

1. Extract the ZIP file to a convenient location
2. Open `workflow-builder.html` in your browser
3. Start building visual workflows!

### Workflow Builder Features

The workflow builder provides:

- 🎨 **Drag-and-Drop Interface**: Visual workflow creation
- 📋 **30+ Node Types**: Navigate, click, type, extract, and more
- 🔄 **Real-time Preview**: See your workflow as you build
- 💾 **Save/Load**: Export workflows as JSON files
- 📚 **Templates**: 8+ pre-built workflow templates
- 🔍 **Validation**: Real-time error checking
- 📊 **Execution**: Run workflows directly from the builder

### Building Your First Workflow

1. Open the workflow builder
2. Click **"New Workflow"**
3. Drag nodes from the left panel to the canvas
4. Connect nodes by dragging between connection points
5. Configure each node's parameters
6. Click **"Save Workflow"** to export as JSON
7. Load the workflow in the dashboard to execute

---

## Verification Steps

### Verify Full Installation

After installing all components, verify everything works:

**1. Check Server Health**

```bash
curl http://localhost:3000/health
```

Expected: `{"success":true,"status":"healthy"}`

**2. Check Downloads Endpoint**

```bash
curl http://localhost:3000/downloads/health
```

Expected: `{"success":true,"status":"healthy","files":[...]}`

**3. Check Extension Installation**

- Go to `chrome://extensions/`
- Verify Workstation extension shows "Enabled"
- Click extension icon - should open popup

**4. Check Workflow Builder**

- Visit `http://localhost:3000/workflow-builder.html`
- Verify workflow builder interface loads
- Try dragging a node to the canvas

**5. Run Test Workflow**

Create a simple test workflow:

```bash
# Get JWT token
TOKEN=$(curl -s http://localhost:3000/auth/demo-token | jq -r '.token')

# Create test workflow
curl -X POST http://localhost:3000/api/v2/workflows \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Workflow",
    "description": "Installation verification",
    "definition": {
      "tasks": [{
        "name": "navigate",
        "agent_type": "browser",
        "action": "navigate",
        "parameters": {"url": "https://example.com"}
      }]
    }
  }'
```

Expected: JSON response with workflow ID

---

## Troubleshooting

### Common Issues

#### Server Won't Start

**Problem**: Server fails to start with "Invalid JWT_SECRET" error

**Solution**:
```bash
# Generate new secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Update .env file
echo "JWT_SECRET=your_generated_secret_here" >> .env

# Restart server
npm start
```

#### Extension Won't Load

**Problem**: Chrome shows "Failed to load extension" error

**Solution**:
1. Ensure you extracted the ZIP file completely
2. Verify `manifest.json` exists in the extension folder
3. Check Chrome console for specific errors
4. Try re-downloading the extension

#### Downloads Return 404

**Problem**: Download endpoints return "File not found" errors

**Solution**:
```bash
# Generate download artifacts
npm run build:downloads

# Verify files exist
ls -la public/downloads/

# Restart server
npm start
```

#### Port Already in Use

**Problem**: Server fails with "EADDRINUSE" error

**Solution**:
```bash
# Find process using port 3000
lsof -i :3000  # Mac/Linux
netstat -ano | findstr :3000  # Windows

# Kill the process or change port
PORT=3001 npm start
```

#### Playwright Browsers Missing

**Problem**: Browser automation fails with "Browser not found"

**Solution**:
```bash
# Install Playwright browsers
npx playwright install --with-deps

# Verify installation
npx playwright --version
```

### Getting Help

If you encounter issues not covered here:

1. Check the [Troubleshooting Guide](TROUBLESHOOTING.md)
2. Review [FAQ](FAQ.md)
3. Search [GitHub Issues](https://github.com/creditXcredit/workstation/issues)
4. Create a new issue with:
   - Your operating system
   - Node.js version (`node --version`)
   - Error messages (full stack trace)
   - Steps to reproduce

---

## Next Steps

After successful installation:

### 1. Explore Documentation

- 📖 [How to Use Guide](../../HOW_TO_USE.md) - Basic usage
- 🔧 [API Documentation](../../API.md) - REST API reference
- 🏗️ [Architecture Guide](../architecture/ARCHITECTURE.md) - System design
- 📊 [Workflow Examples](../../examples/workflows/) - Sample workflows

### 2. Try Example Workflows

```bash
# Navigate to examples
cd examples/workflows/

# List available workflows
ls -la

# Try the Google search example
curl -X POST http://localhost:3000/api/v2/workflows \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @google-search.json
```

### 3. Build Your First Automation

1. Open the workflow builder
2. Browse the template gallery
3. Select a template that matches your use case
4. Customize the parameters
5. Save and execute

### 4. Join the Community

- ⭐ [Star the repo](https://github.com/creditXcredit/workstation)
- 💬 [Join discussions](https://github.com/creditXcredit/workstation/discussions)
- 🐛 [Report bugs](https://github.com/creditXcredit/workstation/issues)
- 🤝 [Contribute](CONTRIBUTING.md)

---

## Additional Resources

### Video Tutorials

Coming soon! Check back for:
- Installation walkthrough
- Chrome extension usage
- Workflow builder tutorial
- Advanced automation patterns

### Sample Workflows

Browse our collection of pre-built workflows:
- Web scraping
- Form automation
- Data extraction
- E2E testing
- Monitoring

### API Integration

Learn to integrate Workstation into your applications:
- REST API guide
- Authentication flows
- Webhook integration
- Custom agents

---

**Installation Complete!** 🎉

You're now ready to automate browser tasks with Workstation. Happy automating!

**Need Help?** See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) or [FAQ.md](FAQ.md)

---

**Last Updated**: 2025-11-23  
**Version**: 1.0.0  
**Maintained By**: Workstation Team
