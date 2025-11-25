# Chrome Extension Installation

## Version: v1.0.0

### Method 1: Load Unpacked (Development)

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select the `build/chrome-extension` directory
5. The extension should now appear in your extensions list

### Method 2: Install from ZIP (Distribution)

1. Download `workstation-chrome-extension-v1.0.0.zip`
2. Extract the ZIP file
3. Open Chrome and navigate to `chrome://extensions/`
4. Enable **Developer mode** (toggle in top right)
5. Click **Load unpacked**
6. Select the extracted directory
7. The extension should now appear in your extensions list

### Verification

- Extension icon should appear in Chrome toolbar
- Click the icon to open the popup interface
- Verify connection status shows "Connected to http://localhost:3000"
- If backend is not running, start it with: `npm start`

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
- Start the backend: `npm start`
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
