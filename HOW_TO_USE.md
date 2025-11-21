# 🎯 How to Use Workstation - Quick Guide

**Simple, step-by-step instructions to start using the Visual Workflow Builder and Chrome Extension.**

---

## 🚀 ONE-CLICK DEPLOYMENT (RECOMMENDED)

### Option 1: Enhanced Deployment (Production-Ready)

**For production use with checkpoint/resume and rollback:**

```bash
# Clone the repository (if you haven't already)
git clone https://github.com/creditXcredit/workstation.git
cd workstation

# Run the ENHANCED one-click deployment script
./one-click-deploy-enhanced.sh
```

**Enhanced features:**
- ✅ Checkpoint/resume capability (resume from failures)
- ✅ Automatic retry with exponential backoff
- ✅ Pre-deployment snapshots for rollback
- ✅ Comprehensive health checks + smoke tests
- ✅ Persistent logging with rotation
- ✅ Better cross-platform support
- ✅ Graceful error handling

**Time to fully operational**: ~2-4 minutes

See [ENHANCED_DEPLOYMENT_GUIDE.md](ENHANCED_DEPLOYMENT_GUIDE.md) for detailed information.

### Option 2: Basic Deployment (Quick Start)

**For quick testing and development:**

```bash
# Clone the repository (if you haven't already)
git clone https://github.com/creditXcredit/workstation.git
cd workstation

# Run the basic one-click deployment script
./one-click-deploy.sh
```

**Basic features:**
- ✅ Install all dependencies automatically
- ✅ Build TypeScript code
- ✅ Build and load Chrome extension
- ✅ Start the backend server
- ✅ Open Chrome with workflow builder
- ✅ Auto-connect everything

**Time to fully operational**: ~2-3 minutes

**Manual steps required**: 0 (after running the script)

See [ONE_CLICK_DEPLOYMENT.md](ONE_CLICK_DEPLOYMENT.md) for detailed information.

---

## 📋 Table of Contents (Manual Setup)

1. [Start the Server](#1-start-the-server)
2. [Access the Visual Workflow Builder](#2-access-the-visual-workflow-builder)
3. [Install the Chrome Extension](#3-install-the-chrome-extension)
4. [Create Your First Workflow](#4-create-your-first-workflow)
5. [Run and Monitor Workflows](#5-run-and-monitor-workflows)

---

## 1. Start the Server

**First time setup:**
```bash
# Clone the repository
git clone https://github.com/creditXcredit/workstation.git
cd workstation

# Install dependencies
npm install

# Build the project
npm run build
```

**Start the server:**
```bash
npm start
```

✅ **Server is now running at:** `http://localhost:3000`

---

## 2. Access the Visual Workflow Builder

### Option A: Direct Browser Access (Recommended)

**Simply open your browser and go to:**

```
http://localhost:3000/workflow-builder.html
```

That's it! You'll see the visual workflow builder interface.

### Option B: From the Chrome Extension

1. Install the Chrome extension (see [Section 3](#3-install-the-chrome-extension))
2. Click the extension icon in Chrome
3. Click the **"Builder"** tab
4. Click **"Open Builder"** button

---

## 3. Install the Chrome Extension

### Step-by-Step Installation:

1. **Open Chrome and navigate to:**
   ```
   chrome://extensions/
   ```

2. **Enable "Developer mode"** (toggle in top-right corner)

3. **Click "Load unpacked"** button

4. **Navigate to the `chrome-extension` folder** in your cloned repository:
   ```
   /path/to/workstation/chrome-extension
   ```

5. **Select the folder** and click "Select"

✅ **Extension installed!** You'll see the Workstation icon in your Chrome toolbar.

### Using the Extension:

1. Click the Workstation icon in Chrome toolbar
2. You'll see 4 tabs:
   - **Execute** - Run workflows manually
   - **History** - View execution history
   - **Templates** - Browse workflow templates
   - **Builder** - Open visual workflow builder

---

## 4. Create Your First Workflow

### Using the Visual Builder:

1. **Open the builder** at `http://localhost:3000/workflow-builder.html`

2. **Add nodes** by clicking buttons in the left panel:
   - **Start** - Every workflow needs this
   - **Navigate** - Go to a URL
   - **Click** - Click an element
   - **Fill** - Type into a form field
   - **Extract** - Get data from the page
   - **End** - Every workflow needs this

3. **Connect nodes** - Click output connector (right circle) → input connector (left circle)

4. **Configure each node** - Click a node to edit its parameters in the right panel

5. **Save your workflow** - Click "Save Workflow" button (top-right)

6. **Execute** - Click "Execute Workflow" button to run it

### Example: Simple Google Search Workflow

```
[Start] 
  → [Navigate: url=https://google.com] 
  → [Fill: selector=input[name="q"], value="browser automation"]
  → [Click: selector=input[value="Google Search"]]
  → [Wait: duration=2000]
  → [End]
```

---

## 5. Run and Monitor Workflows

### Execute a Workflow:

**From the Builder:**
1. Click "Execute Workflow" button
2. Watch real-time status updates
3. See progress bar and task completion
4. View execution logs in the history panel

**From the Chrome Extension:**
1. Click extension icon
2. Go to "Execute" tab
3. Paste workflow JSON or select from templates
4. Click "Execute"
5. View results in "History" tab

### Monitor Execution:

**Real-time Status:**
- ✅ **Completed** - Green status
- 🏃 **Running** - Blue status with progress bar
- ❌ **Failed** - Red status with error details

**View Logs:**
- Click "Show Logs" in execution history
- See task-level timestamps and results
- Trace errors back to specific tasks

---

## 🎨 Visual Workflow Builder Features

### Node Categories (39 Total):

**Control Flow (6 nodes):**
- Start, End, Wait, Condition, Loop, Parallel

**Browser Actions (7 nodes):**
- Navigate, Click, Fill, Extract, Screenshot, Evaluate, GetContent

**Data Processing (6 nodes):**
- CSV Parse/Write, JSON Parse/Query, Excel Read/Write, PDF Extract/Generate

**Integrations (6 nodes):**
- Email Send/Receive, Google Sheets Read/Write, Calendar Create/List

**Storage (8 nodes):**
- File Read/Write, Database Query/Insert, S3 Upload/Download

**Orchestration (3 nodes):**
- Fork (parallel execution), Join, Trigger Workflow

### Key Features:

✅ **Drag-and-drop** node creation  
✅ **Visual connections** with bezier curves  
✅ **Real-time execution** monitoring  
✅ **Export/Import** workflows as JSON  
✅ **Authentication** with JWT tokens  
✅ **Execution history** with detailed logs  

---

## 🔧 Configuration

### Environment Variables:

Create a `.env` file in the root directory:

```bash
# Server Configuration
PORT=3000
JWT_SECRET=your-secret-key-here
JWT_EXPIRATION=24h

# Database (optional - uses SQLite by default)
DATABASE_URL=postgresql://user:pass@localhost:5432/workstation

# Google OAuth (for Sheets/Calendar - optional)
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/oauth2callback

# AWS S3 (optional)
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-east-1
```

**Default JWT Secret:** If not set, uses `super-secret-key-change-in-production`

---

## ⚡ Quick Commands

```bash
# Start the server
npm start

# Development mode (auto-restart)
npm run dev

# Build TypeScript
npm run build

# Run tests
npm test

# Lint code
npm run lint
```

---

## 🆘 Troubleshooting

### Server won't start?
- Check if port 3000 is already in use
- Run `npm install` to ensure dependencies are installed
- Run `npm run build` to compile TypeScript

### Workflow builder shows blank page?
- Make sure server is running on `http://localhost:3000`
- Check browser console for errors (F12)
- Clear browser cache and reload

### Chrome extension not working?
- Verify extension is enabled in `chrome://extensions/`
- Check that server is running
- Reload the extension

### Authentication errors?
- Set `JWT_SECRET` in `.env` file
- Use demo token endpoint: `GET http://localhost:3000/api/auth/demo-token`
- Check localStorage for `authToken` key

---

## 📚 Next Steps

**Explore Documentation:**
- [WORKFLOW_BUILDER_INTEGRATION.md](WORKFLOW_BUILDER_INTEGRATION.md) - Complete technical documentation
- [IMPLEMENTATION_ROADMAP.md](IMPLEMENTATION_ROADMAP.md) - All implemented features
- [API.md](API.md) - API endpoints reference
- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture

**Try Advanced Features:**
- Create parallel workflows with Fork/Join nodes
- Use data agents (CSV, JSON, Excel, PDF)
- Connect to Google Sheets or Calendar
- Store results in S3 or databases
- Chain multiple workflows together

**Get Help:**
- Check [GETTING_STARTED.md](GETTING_STARTED.md) for detailed setup
- Review [REPOSITORY_STATS.md](REPOSITORY_STATS.md) for project metrics
- Open an issue on GitHub for support

---

## 🎯 URLs at a Glance

| Feature | URL |
|---------|-----|
| **Visual Workflow Builder** | `http://localhost:3000/workflow-builder.html` |
| **API Base** | `http://localhost:3000/api` |
| **Demo Token** | `http://localhost:3000/api/auth/demo-token` |
| **Workflow Execution** | `POST http://localhost:3000/api/v2/execute` |
| **Execution Status** | `GET http://localhost:3000/api/v2/executions/:id/status` |
| **Chrome Extension** | Load from `chrome://extensions/` |

---

**That's it!** You now know how to:
✅ Start the server  
✅ Access the visual workflow builder  
✅ Install the Chrome extension  
✅ Create and run workflows  
✅ Monitor execution  

**Happy automating!** 🚀
