# Workstation Installation Guide

## Version: v1.0.0

This guide covers installation of both the Chrome Extension and Workflow Builder.

---

## 🌐 Chrome Extension Installation

### Prerequisites
- Google Chrome 88 or higher
- Workstation backend running at http://localhost:3000

### Installation Steps

1. **Download the Extension**
   - Download: `public/downloads/workstation-chrome-extension-v1.0.0.zip`
   - Extract to a folder of your choice

2. **Load in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable **Developer mode** (toggle in top right)
   - Click **Load unpacked**
   - Select the `build/chrome-extension` directory

3. **Verify Installation**
   - Extension icon should appear in Chrome toolbar
   - Click the icon to open the popup
   - Connection status should show: "Connected to http://localhost:3000"

### Quick Start

1. Click the extension icon in Chrome toolbar
2. Enter a workflow description in the Execute tab:
   ```
   Navigate to google.com, search for "Workstation", and take a screenshot
   ```
3. Click "Execute Workflow"
4. View results in the Results panel

---

## 🎨 Workflow Builder Installation

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Workstation backend running at http://localhost:3000

### Installation Steps

1. **Download the Builder**
   - Download: `public/downloads/workstation-workflow-builder-v1.0.0.zip`
   - Extract to a folder of your choice

2. **Open in Browser**
   - Double-click `workflow-builder.html`
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

```bash
# From the project root
npm start
```

The backend will start on http://localhost:3000

### Verify Backend is Running

- Open http://localhost:3000/health in a browser
- Should return: `{"status":"ok","timestamp":"..."}`

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
- Start the backend: `npm start`
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
- Verify backend is running: `npm start`
- Check network tab (F12) for API errors
- Verify /api/v2/workflows endpoint is accessible

---

## 📖 Documentation

- **Main README:** https://github.com/creditXcredit/workstation
- **API Documentation:** `API.md`
- **Architecture:** `ARCHITECTURE.md`
- **Changelog:** `CHANGELOG.md`

---

## 🆘 Support

- **GitHub Issues:** https://github.com/creditXcredit/workstation/issues
- **Discussions:** https://github.com/creditXcredit/workstation/discussions

---

## 📄 License

MIT License - See LICENSE file for details

---

**Installation Date:** $(date)
**Version:** v1.0.0
**Platform:** $(uname -s) $(uname -m)
