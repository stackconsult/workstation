# 🚀 Chrome Extension Quick Deploy Card

## One-Command Build
```bash
npm run build:chrome:enterprise
```

## 📦 Output
```
dist/workstation-ai-agent-enterprise-v2.1.0.zip
```

## 🏃 Quick Install (3 Steps)

### 1. Extract ZIP
```bash
unzip dist/workstation-ai-agent-enterprise-v2.1.0.zip -d ~/chrome-extension
```

### 2. Load in Chrome
```
chrome://extensions/
→ Enable "Developer mode"
→ Click "Load unpacked"
→ Select ~/chrome-extension
```

### 3. Start Backend
```bash
npm install && npm run build && npm start
```

## ⚙️ Configure Extension

1. Click extension icon
2. Go to **Settings** tab
3. Set **Backend URL:** `http://localhost:3000`
4. Click **Save Settings** ✅

## 🎯 Test Extension

### Execute Tab
```
Description: Search for 'AI automation' on Google
Click: 🚀 Execute Workflow
```

### Templates Tab
```
Click: "Google Search" template
Click: 🚀 Execute Workflow
```

### Builder Tab
```
Click: 🎨 Open Builder
→ Visual workflow editor opens
```

## 📊 Package Info

| Property | Value |
|----------|-------|
| **File** | workstation-ai-agent-enterprise-v2.1.0.zip |
| **Size** | 143 KB (compressed) |
| **Files** | 54 total files |
| **Version** | 2.1.0 Enterprise |

## ✅ Deployment Checklist

- [ ] Build successful (npm run build:chrome:enterprise)
- [ ] ZIP file exists in dist/
- [ ] Extract ZIP to permanent location
- [ ] Load unpacked in Chrome
- [ ] Extension icon visible in toolbar
- [ ] Backend server running (npm start)
- [ ] Extension connected (green indicator)
- [ ] Execute tab works
- [ ] Templates load
- [ ] Builder opens
- [ ] History tracks workflows

## 🏢 Chrome Web Store Upload

**Dashboard:** https://chrome.google.com/webstore/devconsole

**Steps:**
1. Click "New Item"
2. Upload: `workstation-ai-agent-enterprise-v2.1.0.zip`
3. Fill metadata
4. Add screenshots (5 recommended)
5. Submit for review
6. Publish when approved ✅

## 🐛 Quick Troubleshooting

### Extension Won't Load
```bash
# Check manifest
cat manifest.json | jq .

# Verify required files
ls manifest.json background.js content.js popup/index.html
```

### Backend Won't Connect
```bash
# Test backend health
curl http://localhost:3000/health

# Check if port in use
lsof -i :3000
```

### Workflows Won't Execute
```
1. Check connection indicator (should be green)
2. Verify backend URL in Settings
3. Check browser console for errors
4. Enable auto-retry in Settings
```

## 📁 Package Contents

```
workstation-ai-agent-enterprise-v2.1.0.zip
├── manifest.json              (Extension config)
├── background.js              (Service worker)
├── content.js                 (Content script)
├── popup/                     (Extension UI)
│   ├── index.html
│   └── script.js
├── icons/                     (Extension icons)
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── playwright/                (Automation)
│   ├── auto-wait.js
│   ├── self-healing.js
│   ├── retry.js
│   └── ... (10 modules)
├── dashboard/                 (Web UI)
│   ├── dashboard.html
│   ├── workflow-builder.html
│   ├── css/
│   └── js/
├── api/                       (Documentation)
│   └── README.md
├── lib/                       (Libraries)
│   └── pako.min.js
├── README.md                  (User guide)
└── INSTALL.sh                 (Quick installer)
```

## 🔗 Quick Links

- **Repository:** https://github.com/creditXcredit/workstation
- **Documentation:** CHROME_EXTENSION_ENTERPRISE_DEPLOYMENT.md
- **Architecture:** ARCHITECTURE.md
- **API Docs:** API.md
- **Issues:** https://github.com/creditXcredit/workstation/issues

## 🎉 Success!

When everything works:
- ✅ Green connection indicator
- ✅ 4 tabs functional
- ✅ Templates execute
- ✅ Builder opens
- ✅ History tracks

---

**Quick Build Command:** `npm run build:chrome:enterprise`
**Full Guide:** CHROME_EXTENSION_ENTERPRISE_DEPLOYMENT.md
