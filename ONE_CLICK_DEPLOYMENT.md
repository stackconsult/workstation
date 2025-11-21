# 🚀 One-Click Deployment Guide

## Quick Start (Literally One Click!)

```bash
./one-click-deploy.sh
```

That's it! The script will:
- ✅ Install all dependencies
- ✅ Build TypeScript code
- ✅ Build Chrome extension
- ✅ Start backend server
- ✅ Load Chrome extension automatically
- ✅ Open workflow builder in Chrome

---

## What Happens During Deployment

### Step 1: Prerequisites Check
- Verifies Node.js 18+ is installed
- Checks for npm
- Detects Chrome/Chromium browser

### Step 2: Environment Setup
- Creates `.env` file from template
- Generates secure JWT secret automatically
- No manual configuration needed!

### Step 3: Dependencies
- Runs `npm install` (or `npm ci` if already installed)
- Installs all required packages

### Step 4: Build
- Compiles TypeScript to JavaScript
- Prepares all assets

### Step 5: Chrome Extension
- Builds extension to `build/chrome-extension/`
- Validates manifest

### Step 6: Start Server
- Launches backend on http://localhost:3000
- Waits for server to be healthy
- Logs output to `/tmp/workstation-server.log`

### Step 7: Launch Chrome
- Opens Chrome with extension pre-loaded
- Navigates to workflow builder automatically
- Uses temporary profile to avoid conflicts

---

## After Deployment

### 🌐 URLs Ready to Use

| Service | URL |
|---------|-----|
| **Workflow Builder** | http://localhost:3000/workflow-builder.html |
| **Dashboard** | http://localhost:3000/dashboard.html |
| **API** | http://localhost:3000/api |
| **Health Check** | http://localhost:3000/health |

### 🎯 What's Running

1. **Backend Server** (PID saved to `/tmp/workstation-server.pid`)
   - Express.js server on port 3000
   - All APIs active
   - JWT authentication ready

2. **Chrome Browser** (PID saved to `/tmp/workstation-chrome.pid`)
   - Extension automatically loaded
   - Workflow builder open
   - Connected to backend

3. **Chrome Extension**
   - ✅ Auto-connected to backend
   - ✅ JWT token obtained automatically
   - ✅ Connection status indicator active
   - ✅ All features ready

---

## Using the Extension

### Connection Status

At the top of the extension popup, you'll see:
- 🟢 **Green dot** = Connected to backend
- 🔴 **Red dot** = Backend offline

### Builder Tab

Click "Open Builder" to:
- Create visual workflows with drag-and-drop
- Execute workflows in real-time
- Save and load workflows
- Monitor execution progress

### Features Available

✅ **Automatic Connection**
- Extension detects backend automatically
- Tries multiple URLs (localhost:3000, 127.0.0.1:3000, etc.)
- Shows connection status in real-time

✅ **JWT Authentication**
- Token obtained automatically on first connection
- Stored securely in Chrome storage
- Auto-refreshed when expired

✅ **One-Click Workflow Creation**
- Open Builder → Drag nodes → Execute
- No manual configuration needed

---

## Stopping Everything

Run the cleanup script:

```bash
/tmp/stop-workstation.sh
```

This will:
- Stop the backend server
- Close Chrome
- Clean up temp files

---

## Troubleshooting

### Chrome Didn't Launch Automatically

If Chrome wasn't detected, manually load the extension:

1. Open Chrome and go to: `chrome://extensions/`
2. Enable "Developer mode" (toggle top-right)
3. Click "Load unpacked"
4. Select folder: `/path/to/workstation/build/chrome-extension/`
5. Navigate to: http://localhost:3000/workflow-builder.html

### Server Failed to Start

Check the logs:
```bash
tail -f /tmp/workstation-server.log
```

Common issues:
- Port 3000 already in use → Change PORT in `.env`
- Missing dependencies → Run `npm install`
- Build errors → Run `npm run build` manually

### Extension Shows "Offline"

1. Check if server is running:
   ```bash
   curl http://localhost:3000/health
   ```

2. If server is down, restart it:
   ```bash
   npm start
   ```

3. Extension will auto-reconnect within 10 seconds

### No Workflows Appearing

1. Verify you're logged in (check extension status)
2. Create a test workflow in the visual builder
3. Click "Save Workflow"
4. Check History tab in extension

---

## Development Mode

For development with auto-reload:

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Load extension from
build/chrome-extension/
```

The extension will auto-connect to the dev server.

---

## Advanced Options

### Custom Backend URL

If running backend on different port/host:

1. Open extension popup
2. Go to Settings tab
3. Change "Backend URL"
4. Click "Save Settings"

### Manual Token Setup

If auto-token fails:

1. Get token manually:
   ```bash
   curl http://localhost:3000/auth/demo-token
   ```

2. Copy the token

3. Store in Chrome extension:
   - Open DevTools (F12)
   - Go to Application → Storage → Local Storage
   - Add key: `authToken` with token value

---

## What's Next?

### Create Your First Workflow

1. Click "Builder" tab in extension
2. Click "Open Builder"
3. Drag nodes from left panel:
   - Start → Navigate → Click → Extract → End
4. Configure each node (click to select)
5. Click "Execute Workflow"
6. Watch real-time progress!

### Try Templates

1. Go to "Templates" tab in extension
2. Click any template (Google Search, Form Filler, etc.)
3. Click "Execute Workflow"
4. See results instantly

### View History

1. Go to "History" tab
2. See all executed workflows
3. Click any item to re-run

---

## Architecture

```
┌─────────────────────────────────────────┐
│   One-Click Deploy Script               │
│   (one-click-deploy.sh)                 │
└────────────┬────────────────────────────┘
             │
             ├─► Install Dependencies (npm)
             ├─► Build TypeScript
             ├─► Build Chrome Extension
             ├─► Start Backend Server
             │   └─► http://localhost:3000
             │
             └─► Launch Chrome
                 ├─► Auto-load Extension
                 │   ├─► Auto-connect to backend
                 │   ├─► Auto-obtain JWT token
                 │   └─► Show connection status
                 │
                 └─► Open Workflow Builder
                     └─► Ready to use!
```

---

## Files Created

| File | Purpose |
|------|---------|
| `.env` | Environment configuration (auto-generated) |
| `build/chrome-extension/` | Built extension files |
| `/tmp/workstation-server.log` | Server logs |
| `/tmp/workstation-server.pid` | Server process ID |
| `/tmp/workstation-chrome.pid` | Chrome process ID |
| `/tmp/stop-workstation.sh` | Cleanup script |
| `/tmp/workstation-chrome-profile/` | Temp Chrome profile |

---

## Security

✅ **JWT Secret**
- Automatically generated (32-byte random)
- Stored in `.env` (not committed to git)
- Unique per deployment

✅ **Token Storage**
- Stored in Chrome's secure storage
- Not accessible to websites
- Auto-refreshed when expired

✅ **Network**
- All communication localhost-only by default
- No external network access required
- CORS configured for security

---

## FAQ

**Q: Do I need to run the script every time?**
A: No! Only for first-time setup. After that:
```bash
npm start  # Just start the server
```
Then open Chrome with extension already installed.

**Q: Can I use this in production?**
A: This is designed for local development. For production:
- Use environment-specific `.env` files
- Set up proper authentication
- Use reverse proxy (nginx)
- Enable HTTPS

**Q: How do I update the extension?**
A: Just run `npm run build:chrome` and reload the extension in Chrome.

**Q: Can I customize the deployment?**
A: Yes! Edit `.env` for configuration:
```bash
PORT=3000
JWT_SECRET=your-secret
NODE_ENV=development
```

**Q: What if port 3000 is in use?**
A: Change PORT in `.env` and restart. Extension will auto-detect new port.

---

## Support

- 📚 **Documentation**: See `HOW_TO_USE.md` and `WORKFLOW_BUILDER_INTEGRATION.md`
- 🐛 **Issues**: GitHub Issues
- 💬 **Discussions**: GitHub Discussions
- 📧 **Email**: support@workstation.dev

---

## Success Checklist

After running `./one-click-deploy.sh`, verify:

- [ ] Chrome opened automatically
- [ ] Extension icon visible in toolbar
- [ ] Workflow builder loaded
- [ ] Extension shows "Connected" (green dot)
- [ ] Can create and execute workflows
- [ ] Health check responds: `curl http://localhost:3000/health`

If all checked, you're ready to automate! 🎉

---

**Deployment Time**: ~2-3 minutes (depending on internet speed)
**User Actions Required**: 1 (run script)
**Manual Steps After**: 0

**Truly one-click. Truly automated. Truly simple.** 🚀
