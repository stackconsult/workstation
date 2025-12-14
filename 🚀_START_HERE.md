# 🚀 START HERE - How to Run Workstation

## What This Is

**WorkStation is an extension-first browser automation platform.** The Chrome extension is the primary user interface. The backend provides APIs, health monitoring, and optional web dashboards.

### Core Components
- **Chrome Extension** (PRIMARY UI) - Visual interface with 5 tabs: Execute, Builder, Templates, History, Settings
- **Backend API Server** - Node.js/Express providing REST APIs, WebSocket connections, workflow execution
- **32 Pre-built Templates** - Ready-to-use automation workflows
- **Visual Workflow Builder** - Drag-and-drop editor (accessible via extension or web)
- **25+ AI Agents** - Automated tasks and integrations

---

## Architecture: Extension-First

```
┌─────────────────────────────────────────┐
│     Chrome Extension (PRIMARY UI)       │
│  Execute | Builder | Templates | etc.   │
└────────────────┬────────────────────────┘
                 │ REST + WebSocket
                 ▼
┌────────────────────────────────────────┐
│     Backend Server (Port 3000)         │
│  • APIs for workflows, templates       │
│  • Health checks, monitoring           │
│  • Optional web dashboards             │
└────────────────────────────────────────┘
```

**Key Point:** Most users interact exclusively through the extension. The web interfaces (`/dashboard`, `/workflow-builder.html`) are supplementary.

---

## STEP 1: Build the Chrome Extension

```bash
bash ./scripts/build-enterprise-chrome-extension.sh
```

**Output:** `dist/workstation-ai-agent-enterprise-v2.1.0.zip`

**⚡ SHORTCUT:** Production ZIPs are already built! Skip to STEP 2.

---

## STEP 2: Install in Chrome

```bash
cd dist
unzip workstation-ai-agent-enterprise-v2.1.0.zip -d chrome-extension-unpacked
```

Then in Chrome:
1. Go to `chrome://extensions/`
2. Enable **"Developer mode"** (top right toggle)
3. Click **"Load unpacked"**
4. Select `dist/chrome-extension-unpacked/`
5. Pin the extension (click puzzle icon → pin the Workstation icon)

---

## STEP 3: Start the Backend Server

### A. Generate Secure Secrets (REQUIRED)

WorkStation requires three secure random secrets. **DO NOT skip this step** or use placeholder values.

**EASIEST METHOD:**
```bash
npm run generate-secrets
```

This creates a `.env` file with cryptographically secure 256-bit secrets automatically.

**MANUAL METHOD:**
```bash
# Copy template
cp .env.example .env

# Generate three secrets (run this command 3 times)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Edit .env and paste the three outputs into:
# JWT_SECRET=<paste first output>
# SESSION_SECRET=<paste second output>
# ENCRYPTION_KEY=<paste third output>
```

### B. Configure Database (OPTIONAL)

**For local development:**
- Leave `DATABASE_URL` commented out in `.env`
- SQLite will be used automatically (fully functional, no setup needed)
- You'll see: `✅ Database: Using SQLite for local development (fully functional)`

**For production with PostgreSQL:**
- Uncomment and set `DATABASE_URL` in `.env`:
  ```
  DATABASE_URL=postgresql://user:password@localhost:5432/workstation
  ```
- Ensure PostgreSQL is installed and running
- Database will be created automatically on first run

### C. Install, Build, and Start

```bash
npm install
npm run build
npm start
```

**Server runs at:** `http://localhost:3000`

---

## STEP 4: Verify Everything Works

### A. Check Server Health

```bash
# Health check (should return JSON with status: "healthy")
curl http://localhost:3000/health

# Status endpoint (shows routes, DB mode, version)
curl http://localhost:3000/api/status
```

**Expected Output:**
```json
{
  "status": "operational",
  "version": "2.1.0",
  "database": {
    "mode": "SQLite (local)",
    "note": "Using SQLite for local development..."
  }
}
```

### B. Test Extension Connection

1. **Open Extension**: Click the WorkStation icon in Chrome toolbar
2. **Go to Settings Tab**: Navigate to the Settings tab
3. **Set Backend URL**: Enter `http://localhost:3000`
4. **Test Connection**: Click "Test Connection" button
5. **Expected Result**: Green checkmark "Connected to backend"

### C. Run a Simple Template

1. **Go to Templates Tab** in the extension
2. **Click any template** (e.g., "Web Scraping")
3. **Click Execute**
4. **Check History Tab**: The execution should appear with status

If all three steps work, you're ready to go! 🎉

---

## STEP 5: Use the Extension (PRIMARY INTERFACE)

### Extension Popup UI
Click the extension icon in Chrome toolbar to access 5 tabs:

1. **Execute Tab** - Record browser actions, type workflow code, execute tasks
2. **Builder Tab** - Visual drag-and-drop workflow editor
3. **Templates Tab** - Browse and use 32 pre-built workflows
4. **History Tab** - View execution history and results
5. **Settings Tab** - Configure backend URL, API keys, preferences

### Quick Workflow Example

**Using a Template:**
1. Click extension icon → **Templates** tab
2. Choose "Web Scraping" template
3. Click **Execute**
4. Check **History** tab for results

**Building from Scratch:**
1. Click extension icon → **Builder** tab
2. Click "Open Builder" (opens visual editor)
3. Drag "Navigate" node onto canvas
4. Drag "Extract Data" node onto canvas
5. Connect nodes, configure URLs/selectors
6. Click **Save** then **Execute**

---

## Optional: Web Interfaces

The backend provides optional web interfaces as supplements to the extension:

### Available Web Routes

| Route | Description | Use Case |
|-------|-------------|----------|
| `http://localhost:3000/` | Architecture info (JSON) | Check available routes and features |
| `http://localhost:3000/dashboard` | React production dashboard | System monitoring, agent management |
| `http://localhost:3000/workflow-builder.html` | Standalone visual builder | Use builder without extension |
| `http://localhost:3000/health` | Health check endpoint | Monitoring, uptime checks |
| `http://localhost:3000/api/status` | Status and routes listing | See DB mode, version, available APIs |

**Note:** These are supplementary. Most users only need the Chrome extension.

---

## Component Architecture

| Component | Purpose | Primary? | Location |
|-----------|---------|----------|----------|
| **Chrome Extension** | Visual UI, user interaction | ✅ PRIMARY | `chrome-extension/` |
| **Backend Server** | APIs, workflow execution, agents | Supporting | `src/` |
| **Workflow Builder (Web)** | Standalone visual editor | Optional | `public/workflow-builder.html` |
| **React Dashboard** | System monitoring UI | Optional | `src/ui/dashboard/` |
| **Templates** | 32 pre-built workflows | Via Extension | `src/workflow-templates/` |
| **Playwright Features** | Auto-wait, self-healing selectors | Backend | `chrome-extension/playwright/` |

---

## Troubleshooting

### ❌ "JWT_SECRET is not configured" error

**Problem:** Server fails to start with "JWT_SECRET environment variable is not set"

**Solution:**
```bash
npm run generate-secrets
```
This creates `.env` with secure random secrets. Then restart: `npm start`

**Why:** WorkStation requires real cryptographic secrets, not placeholder values.

---

### ❌ Extension shows "Backend offline"

**Problem:** Extension can't connect to backend

**Solutions:**
1. Verify backend is running:
   ```bash
   curl http://localhost:3000/health
   # Should return: {"status":"healthy",...}
   ```

2. Check extension Settings tab:
   - Backend URL should be: `http://localhost:3000`
   - Click "Test Connection" button

3. If using a different port, update both:
   - `.env` file: `PORT=3001`
   - Extension Settings: `http://localhost:3001`

---

### ⚠️ "Database connection failed" warnings

**If you see:** `Database connection failed after max retries`

**This is normal for local development if:**
- You haven't installed PostgreSQL
- `DATABASE_URL` is commented out in `.env`

**What's actually happening:**
- Server tries PostgreSQL, finds it's not configured
- Falls back to SQLite automatically
- Everything still works perfectly

**To silence these warnings:**
1. Make sure `DATABASE_URL` is commented in `.env`:
   ```bash
   # DATABASE_URL=postgresql://...
   ```
2. Restart server: `npm start`
3. You should see: `✅ Database: Using SQLite for local development (fully functional)`

**If you want PostgreSQL:**
1. Install PostgreSQL: 
   - Mac: `brew install postgresql@14`
   - Ubuntu: `sudo apt-get install postgresql-14`
   - Windows: Download from postgresql.org

2. Create database:
   ```bash
   createdb workstation
   ```

3. Uncomment DATABASE_URL in `.env` and set credentials:
   ```
   DATABASE_URL=postgresql://postgres:password@localhost:5432/workstation
   ```

4. Restart server

---

### 🔨 Build Issues

#### Extension build fails
**Problem:** `bash ./scripts/build-enterprise-chrome-extension.sh` fails

**Solution 1 (Easiest):** Use pre-built ZIP:
- Files already exist in `dist/` directory
- Skip build, go directly to STEP 2 (Install in Chrome)

**Solution 2:** Install ImageMagick (required for icon generation):
- **Mac:** `brew install imagemagick`
- **Ubuntu/Debian:** `sudo apt-get install imagemagick`
- **Windows:** Download from imagemagick.org

#### Backend build fails
**Problem:** `npm run build` fails with TypeScript errors

**Solution:**
```bash
# Clean and rebuild
rm -rf node_modules dist
npm install
npm run build
```

---

### 🌐 Port Already in Use

**Problem:** "Port 3000 already in use"

**Solution:**
1. Change port in `.env`:
   ```
   PORT=3001
   ```

2. Update extension Settings tab:
   - Backend URL: `http://localhost:3001`

3. Restart server: `npm start`

---

### 📦 Templates Not Loading

**Problem:** Templates tab in extension is empty

**Checklist:**
1. Backend must be running: `npm start`
2. Check backend health: `curl http://localhost:3000/health`
3. Test templates API:
   ```bash
   curl http://localhost:3000/api/workflow-templates
   # Should return JSON array of 32 templates
   ```
4. Check browser console (F12) for error messages
5. Verify Backend URL in extension Settings tab

---

### 📋 OS-Specific Issues

#### macOS
- **Problem:** `command not found: brew`
- **Solution:** Install Homebrew first: `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`

#### Ubuntu/Debian
- **Problem:** `sudo: command not found`
- **Solution:** You're likely running as root. Omit `sudo` from commands.
- **Problem:** `apt-get: command not found`
- **Solution:** Wrong OS. These commands are for Ubuntu/Debian, not macOS.

#### Windows
- **Problem:** Bash scripts won't run
- **Solution:** Use Git Bash or WSL (Windows Subsystem for Linux)
- **Alternative:** Use pre-built extension ZIP from `dist/` folder

---

### 🆘 Still Having Issues?

1. **Check logs:** Server logs appear in terminal where you ran `npm start`
2. **Check status:** `curl http://localhost:3000/api/status` shows configuration
3. **Verify secrets:** Run `npm run generate-secrets` (without --write) to test the generator
4. **Read documentation:** See `GETTING_STARTED.md` for detailed guide

---

## System Architecture Diagram

```
                         USER INTERACTIONS
                                │
                                ▼
            ┌────────────────────────────────────┐
            │     Chrome Extension               │
            │  (PRIMARY USER INTERFACE)          │
            │                                    │
            │  ┌──────┬─────────┬──────────┬───┐│
            │  │Execute│ Builder │Templates │...││
            │  └──────┴─────────┴──────────┴───┘│
            └────────────┬───────────────────────┘
                         │
                         │ REST + WebSocket
                         │ http://localhost:3000
                         │
                         ▼
            ┌────────────────────────────────────┐
            │     Backend Server (Port 3000)     │
            │  ┌──────────────────────────────┐  │
            │  │  Express.js REST APIs        │  │
            │  │  • /api/workflows            │  │
            │  │  • /api/templates            │  │
            │  │  • /api/agents               │  │
            │  └──────────────────────────────┘  │
            │  ┌──────────────────────────────┐  │
            │  │  WebSocket Servers           │  │
            │  │  • ws://localhost:3000/ws/*  │  │
            │  └──────────────────────────────┘  │
            │  ┌──────────────────────────────┐  │
            │  │  Optional Web UIs            │  │
            │  │  • /dashboard                │  │
            │  │  • /workflow-builder.html    │  │
            │  └──────────────────────────────┘  │
            └────────────┬───────────────────────┘
                         │
                    ┌────┴────┐
                    │         │
            ┌───────▼───┐ ┌──▼─────────┐
            │  Database │ │ Playwright │
            │  (SQLite  │ │  Browser   │
            │  or       │ │  Automation│
            │  Postgres)│ └────────────┘
            └───────────┘
```

---

## Database Behavior: SQLite vs PostgreSQL

### Local Development (Default)
**Configuration:** `DATABASE_URL` commented out or not set in `.env`

**What happens:**
- ✅ SQLite database automatically created in `./workstation.db`
- ✅ No installation or setup required
- ✅ All features work perfectly
- ℹ️ Single-file database (portable, easy to backup)
- ℹ️ Ideal for: Local development, testing, single-user scenarios

**Log message you'll see:**
```
✅ Database: Using SQLite for local development (fully functional)
```

### Production (Optional)
**Configuration:** `DATABASE_URL` set in `.env`
```
DATABASE_URL=postgresql://user:password@localhost:5432/workstation
```

**What happens:**
- ✅ Connects to PostgreSQL database
- ✅ Better performance for high-traffic scenarios
- ✅ Multi-user support with ACID transactions
- ⚠️ Requires PostgreSQL installation and configuration

**Features gated behind PostgreSQL:**
- Multi-tenant workspaces (Phase 6 feature)
- Advanced metrics and analytics
- Distributed workflow execution

**For 99% of users:** SQLite is perfectly adequate and recommended.

---

## Quick Commands Reference

```bash
# ⚡ Quick Start (New Users)
npm run generate-secrets    # Generate .env with secure secrets (REQUIRED first time)
npm install                 # Install dependencies
npm run build              # Compile TypeScript
npm start                  # Start server

# 🔧 Backend Server Commands
npm run dev                # Start server (development mode with auto-reload)
npm test                   # Run test suite
npm run lint               # Check code quality
npm run build:all          # Build both backend and React UI

# 📦 Chrome Extension Commands
# (Use pre-built ZIPs in dist/ or build manually)
bash ./scripts/build-enterprise-chrome-extension.sh  # Build full-featured ZIP
bash ./scripts/build-chrome-extension.sh             # Build simple version
npm run build:chrome:enterprise                      # Build via npm script

# 🔐 Security & Configuration
npm run generate-secrets   # Generate secure .env file with random secrets
node scripts/generate-secrets.js  # Show secrets without writing file

# 🏥 Health & Status Checks
curl http://localhost:3000/health          # Health check
curl http://localhost:3000/api/status      # Detailed status (routes, DB mode, version)
curl http://localhost:3000/                # Architecture overview

# 🔍 API Testing
curl http://localhost:3000/api/workflow-templates  # List all 32 templates
curl http://localhost:3000/auth/demo-token         # Get demo JWT token
```

---

## Next Steps

### 📚 Learn the Platform
1. **Browse Templates** - Open extension → Templates tab → explore 32 pre-built workflows
2. **Read Guides:**
   - [Workflow Templates Guide](WORKFLOW_TEMPLATES.md) - Details on all 32 templates
   - [Chrome Extension Guide](🚀_START_HERE_CHROME_EXTENSION.md) - Deep dive into extension features
   - [Getting Started Guide](GETTING_STARTED.md) - Comprehensive tutorial
   - [API Documentation](API.md) - Full API reference

3. **Check Examples:**
   - `examples/workflows/` - Sample workflow code
   - Extension Templates tab - Live, working examples

### 🔨 Build Your First Workflow

**Option 1: Visual Builder (Recommended for beginners)**
1. Open extension → **Builder** tab → "Open Builder"
2. Drag "Navigate" node onto canvas
3. Set URL to a website you want to automate
4. Drag "Extract Data" node below it
5. Connect the two nodes
6. Configure selectors (CSS selectors for data extraction)
7. Click **Save** then **Execute**
8. Check **History** tab for results

**Option 2: Code-Based (For advanced users)**
1. Open extension → **Execute** tab
2. Switch to "Code" mode
3. Write workflow in TypeScript/JavaScript
4. Click **Execute**
5. View results in **History** tab

### 🚀 Deploy to Production

**Local Testing → Production:**

1. **Test thoroughly locally** with SQLite database
2. **Set up PostgreSQL** for production:
   ```bash
   # Ubuntu/Debian
   sudo apt-get install postgresql-14
   
   # macOS
   brew install postgresql@14
   ```

3. **Generate production secrets:**
   ```bash
   npm run generate-secrets
   # Copy secrets to your production environment variables
   ```

4. **Choose deployment method:**

   **Option A: Docker**
   ```bash
   docker-compose up -d
   ```

   **Option B: Kubernetes**
   ```bash
   kubectl apply -f k8s/
   ```

   **Option C: Railway (Easiest)**
   - Connect GitHub repository
   - Set environment variables (JWT_SECRET, SESSION_SECRET, etc.)
   - Deploy automatically

   **Option D: Traditional VPS**
   ```bash
   # On server:
   git clone <repo>
   cd workstation
   npm run generate-secrets
   npm install
   npm run build
   npm start
   # Use PM2 or systemd for process management
   ```

5. **Update extension Backend URL** to your production domain

---

## Documentation Index

### Quick Reference
- **This File** - Quick start and basic setup
- [🚀_START_HERE_CHROME_EXTENSION.md](🚀_START_HERE_CHROME_EXTENSION.md) - Extension setup and features
- [QUICK_RUN.md](QUICK_RUN.md) - Ultra-quick start (1 minute)

### Comprehensive Guides
- [GETTING_STARTED.md](GETTING_STARTED.md) - Complete beginner tutorial
- [UI_INTEGRATION_GUIDE.md](UI_INTEGRATION_GUIDE.md) - Web dashboard integration
- [WORKFLOW_TEMPLATES.md](WORKFLOW_TEMPLATES.md) - All 32 templates explained
- [ARCHITECTURE.md](ARCHITECTURE.md) - System design and architecture

### Technical Documentation
- [API.md](API.md) - Complete REST API reference
- [BUILD_PROCESS.md](BUILD_PROCESS.md) - Build system details
- [CHANGELOG.md](CHANGELOG.md) - Version history and changes

### Troubleshooting & Support
- See "Troubleshooting" section above for common issues
- [Report Issues](https://github.com/stackconsult/workstation/issues) - Bug reports
- [Discussions](https://github.com/stackconsult/workstation/discussions) - Questions and community

---

## Summary Checklist

Before you can use WorkStation, ensure:

- [ ] ✅ Chrome extension installed and pinned
- [ ] ✅ `.env` file created with `npm run generate-secrets`
- [ ] ✅ Backend running with `npm start`
- [ ] ✅ Health check passes: `curl http://localhost:3000/health`
- [ ] ✅ Extension Settings → Backend URL set to `http://localhost:3000`
- [ ] ✅ Extension Settings → "Test Connection" shows green checkmark

Once all checks pass:

**🎉 YOU'RE READY! NOW GO BUILD SOME WORKFLOWS! 🚀**

Start with the Templates tab in the extension to see what's possible, then build your own workflows in the Builder tab.
