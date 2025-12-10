# 🖥️ Workstation Web Interfaces

This directory contains the web interfaces for Workstation browser automation platform.

## 🎨 Available Interfaces

### 1. Landing Page (`landing.html`)
**Purpose:** Public-facing showcase and documentation hub

**Features:**
- Hero section with clear value proposition
- Feature showcase with icons and descriptions
- Use cases and examples
- Quick start guide with code snippets
- Documentation navigation
- Call-to-action sections

**Best for:** First-time visitors, project overview, marketing

### 2. Simple Dashboard (`index.html`)
**Purpose:** JWT authentication and API testing

**Features:**
- Health check monitoring
- JWT token generation (demo and custom)
- API endpoint testing
- JSON response viewer
- Documentation links

**Best for:** Developers testing the API, token management

### 3. Control Center (`workstation-control-center.html`)
**Purpose:** Advanced workflow management

**Features:**
- Workflow creation and editing
- Execution monitoring
- Task management
- Real-time status updates
- Advanced configuration

**Best for:** Power users, production workflow management

## 📁 Directory Structure

```
docs/
├── landing.html                     # Public landing page
├── index.html                       # Simple dashboard
├── workstation-control-center.html  # Advanced control center
├── README.md                        # This file
├── DOCUMENTATION_INDEX.md           # Complete doc navigation
│
├── guides/                          # User guides
│   ├── HOW_TO_USE_BROWSER_AGENT.md
│   ├── QUICKSTART.md
│   └── ...
│
├── architecture/                    # System design docs
│   ├── ARCHITECTURE.md
│   ├── ROADMAP.md
│   └── ...
│
├── api/                            # API documentation
│   ├── API.md
│   └── ...
│
├── archives/                       # Historical docs (83 files)
│
└── assets/                         # Visual resources
    ├── screenshots/
    └── diagrams/
```

## 🚀 Quick Start

### For GitHub Pages

1. **Enable GitHub Pages:**
   - Repository Settings → Pages
   - Source: Deploy from branch
   - Branch: `main`, folder: `/docs`
   - Save

2. **Access your site:**
   ```
   https://[username].github.io/workstation/landing.html
   ```

### For Local Development

```bash
# Option 1: Open directly in browser
open docs/landing.html

# Option 2: Use a local server (recommended)
cd docs
python3 -m http.server 8000
# Visit http://localhost:8000

# Option 3: Use Node.js http-server
npx http-server docs -p 8000
```

### Configuration

**For local development:**

Edit the `apiUrl` in each HTML file:

```javascript
// In landing.html, index.html, or workstation-control-center.html
apiUrl: 'http://localhost:3000'
```

**For production/GitHub Pages:**

```javascript
apiUrl: 'https://your-railway-app.railway.app'
```

### CORS Setup

Add your GitHub Pages URL to the backend:

```env
# In .env file
ALLOWED_ORIGINS=https://[username].github.io,http://localhost:8000
```

## 📖 Documentation

### Complete Guides

- [📚 Documentation Index](DOCUMENTATION_INDEX.md) - Complete navigation
- [🚀 Getting Started Guide](../GETTING_STARTED.md) - Comprehensive onboarding
- [🎯 START_HERE](../START_HERE.md) - 30-second quick start
- [📘 Browser Agent Guide](guides/HOW_TO_USE_BROWSER_AGENT.md) - Complete usage
- [🔌 API Reference](api/API.md) - API documentation
- [🏗️ Architecture](architecture/ARCHITECTURE.md) - System design

### By Category

**User Guides:**
- Quick starts (standard, integrated, production)
- How-to guides
- Deployment guides
- Security guide
- Monitoring guide

**Architecture:**
- System architecture
- MCP architecture
- Project roadmap
- Future features

**API:**
- REST API reference
- Available integrations

**Archives:**
- 83 historical implementation documents
- Completion reports
- Audit summaries

## 🎨 Customization

### Change Theme

Edit the HTML file's `<html>` tag:

```html
<!-- Light theme (default) -->
<html lang="en">

<!-- Dark theme -->
<html lang="en" data-theme="dark">

<!-- Other DaisyUI themes -->
<html lang="en" data-theme="synthwave">
```

[Available themes](https://daisyui.com/docs/themes/)

### Add Custom Styles

Add to the `<style>` section in each HTML file:

```css
.custom-class {
  /* Your styles */
}
```

### Modify Features

All interfaces use **Alpine.js** for reactivity. To add features:

1. Add HTML in the appropriate section
2. Add methods to the Alpine.js data object
3. Use Alpine directives (`x-data`, `@click`, etc.)

## 🔧 Troubleshooting

### "Not Connected" in Dashboard

**Cause:** Cannot reach API

**Solutions:**
- Verify `apiUrl` is correct
- Check backend is running
- Verify CORS settings

### CORS Errors

**Cause:** Origin not allowed

**Solution:**
Add your domain to `ALLOWED_ORIGINS` in backend `.env`

### Token Issues

**Cause:** Invalid or expired token

**Solutions:**
- Generate new token
- Check JWT_SECRET is set
- Verify token hasn't expired (default: 24h)

### Styles Not Loading

**Cause:** CDN issue or network problem

**Solution:**
Download CSS/JS files locally or use different CDN

---

## 📋 Chrome Web Store Documentation (NEW)

### Privacy Policy
**Location:** `docs/privacy-policy.html`

**Purpose:** Privacy policy for Chrome Web Store compliance

**Key Information:**
- What data is collected (workflows, settings, history - all stored locally)
- How data is used (automation, persistence, improvement)
- User rights (access, deletion, opt-out)
- Compliance with GDPR, CCPA, and Chrome Web Store policies

**Usage:**
- Host on GitHub Pages: `https://creditXcredit.github.io/workstation/docs/privacy-policy.html`
- Or link in Chrome Web Store listing description
- Referenced in manifest.json via `homepage_url`

**Status:** ✅ Complete and ready for deployment

### Screenshot Guide
**Location:** `docs/CHROME_WEB_STORE_SCREENSHOTS.md`

**Purpose:** Complete guide for creating screenshots for Chrome Web Store submission

**Contents:**
- Screenshot size and format requirements (1280x800 or 640x400, PNG/JPEG)
- 5 recommended screenshots with detailed capture instructions
- Optional promotional images specifications
- Screenshot best practices and tools
- Upload process to Chrome Web Store

**Status:** ✅ Complete guide, screenshots need to be created

### Permissions Justification
**Location:** `docs/PERMISSIONS_JUSTIFICATION.md`

**Purpose:** Comprehensive documentation of all Chrome extension permissions for reviewer transparency and user understanding

**Contents:**
- Detailed justification for each of 5 permissions (activeTab, storage, scripting, notifications, <all_urls>)
- Specific use cases for each permission
- Privacy protection measures
- Security implementations
- User control mechanisms
- Alternative approaches considered
- Technical implementation details
- FAQ section addressing common concerns
- Compliance with Chrome Web Store policies

**Status:** ✅ Complete and ready for submission

### Screenshot Creation Tools
**Automated Script:** `scripts/create-screenshots.sh`

**Purpose:** Interactive bash script that guides through screenshot creation process

**Features:**
- Step-by-step instructions for each screenshot
- Automatic directory creation
- Extension build verification
- Backend server startup reminders
- Screenshot verification after completion
- Professional guidance for each capture

**Status:** ✅ Complete and executable

### Screenshot Directory
**Location:** `docs/screenshots/chrome-web-store/`

**Required Files:**
- screenshot-1-execute-tab.png (1280x800 or 640x400)
- screenshot-2-workflow-builder.png (1280x800 or 640x400)
- screenshot-3-templates.png (1280x800 or 640x400)
- screenshot-4-history.png (1280x800 or 640x400)
- screenshot-5-settings.png (1280x800 or 640x400)

**Status:** Directory created, screenshots need to be generated manually

### Related Chrome Web Store Documentation
- [Production Checklist](../CHROME_WEB_STORE_PRODUCTION_CHECKLIST.md) - 100+ item pre-deployment verification
- [Enterprise Deployment](../CHROME_EXTENSION_ENTERPRISE_DEPLOYMENT.md) - Complete deployment guide
- [Build Complete](../CHROME_EXTENSION_BUILD_COMPLETE.md) - Package contents and build summary

---
