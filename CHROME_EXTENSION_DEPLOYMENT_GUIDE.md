# Chrome Extension Deployment Guide

## 🚀 RECOMMENDED: One-Click Deployment

**The easiest way to deploy everything:**

```bash
./one-click-deploy.sh
```

This automatically:
- Builds the backend
- Builds and loads the Chrome extension
- Starts the server
- Opens Chrome with the workflow builder
- Auto-connects all components

See [ONE_CLICK_DEPLOYMENT.md](ONE_CLICK_DEPLOYMENT.md) for details.

---

## Quick Start (Manual)

### For Developers

**Build and Test:**
```bash
# 1. Build backend
npm install
npm run build

# 2. Build extension
npm run build:chrome

# 3. Test extension
npm run test:chrome

# 4. Start backend server
npm run dev
# Server runs on http://localhost:3000
```

**Load Extension in Chrome:**
```bash
# 1. Open Chrome
chrome://extensions/

# 2. Enable "Developer mode" (toggle in top right)

# 3. Click "Load unpacked"

# 4. Select directory:
/home/runner/work/workstation/workstation/build/chrome-extension/

# 5. Extension loaded! ✅
```

**Verify Installation:**
1. Click extension icon in toolbar
2. Should see 4 tabs: Execute, Templates, History, Settings
3. Settings should show backend URL: `http://localhost:3000`
4. Templates tab should show 5 templates

---

## Manual Testing Checklist

### Tab 1: Execute
- [ ] Enter workflow description
- [ ] Click "🚀 Execute Workflow"
- [ ] Verify status updates in real-time
- [ ] Check result is displayed
- [ ] Verify workflow added to History
- [ ] Click "💾 Save" button
- [ ] Verify saved workflow appears in History

### Tab 2: Templates
- [ ] Verify 5 templates are displayed
- [ ] Click "Google Search" template
- [ ] Verify it loads into Execute tab
- [ ] Verify description is populated
- [ ] Test other templates

### Tab 3: History
- [ ] Verify executed workflows appear
- [ ] Check status badges (success, error, running, saved)
- [ ] Verify timestamps are human-readable
- [ ] Click a history item
- [ ] Verify it loads into Execute tab
- [ ] Click "Clear All"
- [ ] Confirm history is cleared

### Tab 4: Settings
- [ ] Verify default backend URL: `http://localhost:3000`
- [ ] Change poll interval (e.g., to 5000ms)
- [ ] Toggle auto-retry
- [ ] Click "💾 Save Settings"
- [ ] Verify settings persist after closing popup
- [ ] Change backend URL (if testing with remote server)

### Recording Feature
- [ ] Click "⏺️ Record" button
- [ ] Interact with a webpage
- [ ] Click "⏹️ Stop" button
- [ ] Verify actions are captured
- [ ] Click "🗑️ Clear" button

---

## Screenshots Needed

### For Documentation

1. **Main Execute Tab**
   - Screenshot of popup with Execute tab active
   - Show example workflow description
   - Capture "Execute" and "Save" buttons

2. **Templates Tab**
   - Screenshot showing all 5 templates
   - Highlight category badges
   - Show template cards with descriptions

3. **History Tab**
   - Screenshot with sample workflow history
   - Show different status badges (success, error, saved)
   - Display timestamps

4. **Settings Tab**
   - Screenshot of settings form
   - Show backend URL field
   - Show poll interval input
   - Show auto-retry checkbox

5. **Real-Time Execution**
   - Screenshot showing "⏳ Running... (50%)" status
   - Capture during active workflow execution

6. **Workflow Result**
   - Screenshot showing successful execution result
   - Display JSON output

### For Chrome Web Store

1. **Hero Screenshot** (1280x800)
   - Full extension popup with all features visible
   - Clean background
   - Professional look

2. **Feature Screenshots** (1280x800 each)
   - Templates library
   - Workflow history
   - Settings configuration
   - Live execution monitoring

3. **Promotional Images**
   - Small tile: 440x280
   - Large tile: 920x680
   - Marquee: 1400x560

---

## Chrome Web Store Preparation

### Store Listing Content

**Name:**
```
Workstation AI Agent - Browser Automation
```

**Short Description (132 chars max):**
```
Privacy-first browser automation with AI. Execute workflows, save templates, track history. No cloud, full control.
```

**Detailed Description:**
```
🤖 Workstation AI Agent - Enterprise Browser Automation

Transform your browser into an automation powerhouse with Workstation AI Agent. 
Execute complex workflows with natural language, save and reuse templates, 
and monitor everything in real-time.

✨ KEY FEATURES

• Natural Language Automation - Describe what you want, we handle the rest
• 5 Pre-Built Templates - Google Search, Form Filler, Screenshot Capture, Data Extractor, Login Flow
• Workflow History - Track all executions with status and timestamps
• Real-Time Monitoring - Live status updates with progress tracking
• Save & Load Workflows - Build once, reuse forever
• Configurable Settings - Customize backend URL, poll interval, auto-retry
• Visual Action Recording - Record clicks and typing for workflow creation

🔐 PRIVACY FIRST

• 100% local-first architecture
• No cloud storage or external services
• Your data stays on your machine
• Optional self-hosted backend
• JWT authentication built-in

🎯 USE CASES

• Web scraping and data extraction
• Automated form filling
• E2E testing and QA
• Website monitoring
• Repetitive task automation
• Screenshot capture workflows

🚀 ENTERPRISE GRADE

• Playwright-powered automation
• Self-healing workflows
• Automatic retries with exponential backoff
• Multi-strategy element selectors
• Network monitoring and recovery
• Context learning from experience

📊 POWERED BY OPEN SOURCE

• TypeScript + Express.js backend
• Playwright browser automation
• Manifest V3 compliant
• MIT licensed
• Active development

🔧 REQUIREMENTS

• Backend server (included, easy setup)
• Node.js 18+ (for backend)
• Chrome/Edge/Brave browser

📖 DOCUMENTATION

Full documentation available at:
https://github.com/creditXcredit/workstation

🆘 SUPPORT

• GitHub Issues: https://github.com/creditXcredit/workstation/issues
• Documentation: https://github.com/creditXcredit/workstation/blob/main/chrome-extension/README.md
• Examples: https://github.com/creditXcredit/workstation/tree/main/examples

⭐ OPEN SOURCE

Star us on GitHub: https://github.com/creditXcredit/workstation

Built with ❤️ by the Workstation team.
```

**Category:**
```
Productivity
```

**Language:**
```
English (United States)
```

### Privacy Policy

**Required for Chrome Web Store.**

Sample privacy policy:

```
Privacy Policy for Workstation AI Agent

Last Updated: November 20, 2025

1. DATA COLLECTION
   We do NOT collect, store, or transmit any user data to external servers.

2. LOCAL STORAGE
   All data is stored locally in your browser using Chrome's storage API:
   - Workflow definitions
   - Execution history
   - Settings and preferences
   - JWT authentication tokens

3. BACKEND COMMUNICATION
   The extension communicates with a self-hosted backend server that you control.
   No data is sent to third-party services.

4. PERMISSIONS
   We request the following permissions:
   - activeTab: To execute workflows on the current tab
   - storage: To save your workflows and settings locally
   - scripting: To record actions for workflow building
   - <all_urls>: To enable automation on any website you choose

5. DATA RETENTION
   All data remains on your local machine until you explicitly delete it.
   You can clear history and settings at any time from the extension.

6. SECURITY
   - JWT authentication for API communication
   - No third-party analytics or tracking
   - No telemetry or usage statistics
   - Open-source code for transparency

7. CHANGES TO POLICY
   We will update this policy as needed. Check this page for updates.

8. CONTACT
   GitHub: https://github.com/creditXcredit/workstation
   Email: [Your Email]

9. OPEN SOURCE
   Full source code: https://github.com/creditXcredit/workstation
   License: ISC
```

---

## Deployment Steps

### Step 1: Prepare Assets

- [ ] Create professional icons (16x16, 48x48, 128x128)
- [ ] Take all required screenshots
- [ ] Create promotional images
- [ ] Write store description
- [ ] Create privacy policy page

### Step 2: Test Thoroughly

- [ ] Test all features manually
- [ ] Test on different websites
- [ ] Test with remote backend
- [ ] Test error scenarios
- [ ] Test across Chrome, Edge, Brave

### Step 3: Package Extension

```bash
# Create production build
npm run build:chrome

# Create ZIP file for Chrome Web Store
cd build
zip -r chrome-extension.zip chrome-extension/

# Verify ZIP contents
unzip -l chrome-extension.zip
```

### Step 4: Chrome Web Store Submission

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
2. Click "New Item"
3. Upload `chrome-extension.zip`
4. Fill in store listing:
   - Upload screenshots
   - Upload promotional images
   - Add detailed description
   - Set category (Productivity)
   - Add privacy policy URL
5. Submit for review

**Note:** First submission requires $5 one-time developer fee.

### Step 5: Post-Submission

- [ ] Monitor review status
- [ ] Respond to reviewer feedback if needed
- [ ] Announce on GitHub when published
- [ ] Update README with Chrome Web Store link
- [ ] Create release notes

---

## Known Issues & Limitations

1. **Backend Required**: Extension needs backend server running
2. **Manual Setup**: Users need to install and run backend separately
3. **No Offline Mode**: Cannot execute workflows without backend
4. **Template Storage**: Templates are hardcoded (not user-editable yet)

### Future Improvements

- Standalone mode (no backend required)
- User-editable templates
- Cloud sync option
- Multi-workspace support
- Workflow export/import

---

## Support & Troubleshooting

### Common Issues

**Extension not loading:**
- Check Chrome version (requires latest)
- Verify all files in build/chrome-extension/
- Check browser console for errors

**Backend connection failed:**
- Verify backend is running: `npm run dev`
- Check backend URL in Settings tab
- Ensure no firewall blocking localhost:3000

**Workflow execution fails:**
- Check backend logs for errors
- Verify JWT token is valid
- Try refreshing token (reinstall extension)

**Templates not loading:**
- Verify backend `/api/v2/templates` endpoint works
- Check network tab in DevTools
- Verify JWT authentication

### Getting Help

1. Check documentation: [chrome-extension/README.md](chrome-extension/README.md)
2. Search GitHub issues: https://github.com/creditXcredit/workstation/issues
3. Create new issue with:
   - Extension version
   - Chrome version
   - Steps to reproduce
   - Console errors
   - Screenshots

---

## Monitoring & Analytics

### User Feedback

Create feedback form:
- GitHub Discussions
- Google Form for feature requests
- Bug report template

### Metrics to Track

- Downloads (Chrome Web Store)
- Active users (if analytics added)
- GitHub stars
- Issue reports
- Feature requests

---

## Continuous Improvement

### Roadmap

**v1.3 (Next):**
- Workflow export/import
- Enhanced template editor
- Workspace management
- Better error messages

**v2.0 (Future):**
- AI-powered suggestions
- Collaborative sharing
- Advanced analytics
- Chrome Web Store publication

---

## Success Criteria

**Launch Ready When:**
- [ ] All manual tests passing
- [ ] Screenshots captured
- [ ] Privacy policy published
- [ ] Store listing complete
- [ ] Documentation updated
- [ ] No critical bugs

**Successful Launch:**
- 100+ downloads in first week
- 4+ star rating
- Active user engagement
- Positive feedback
- No critical issues reported

---

**Current Status**: 95% Ready for Launch
**Remaining**: Screenshots, Icons, Manual Testing, Chrome Web Store Submission

Good luck with the launch! 🚀
