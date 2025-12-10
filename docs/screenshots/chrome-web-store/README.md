# Chrome Web Store Screenshots

## 📸 Required Screenshots

This directory should contain 5 screenshots for Chrome Web Store submission:

1. **screenshot-1-execute-tab.png** (1280x800 or 640x400)
   - Extension popup showing Execute tab
   - Sample workflow text entered
   - All 4 tabs visible
   - Connection status visible

2. **screenshot-2-workflow-builder.png** (1280x800 or 640x400)
   - Visual workflow builder in browser
   - Sample workflow with connected nodes
   - Zoom/pan controls visible
   - Professional layout

3. **screenshot-3-templates.png** (1280x800 or 640x400)
   - Templates tab showing multiple templates
   - Template cards with descriptions
   - Category badges visible
   - Clean, organized view

4. **screenshot-4-history.png** (1280x800 or 640x400)
   - History tab showing executed workflows
   - Status badges (success/error/running)
   - Timestamps visible
   - Clear All button visible

5. **screenshot-5-settings.png** (1280x800 or 640x400)
   - Settings tab showing configuration
   - Backend URL configured
   - Poll interval setting
   - Auto-retry toggle
   - Connection status indicator

## 🛠️ How to Create Screenshots

### Automated Script
Run the interactive screenshot creation script:
```bash
./scripts/create-screenshots.sh
```

### Manual Process
1. Build and load extension: `npm run build:chrome:enterprise`
2. Load unpacked extension from `build/chrome-extension-enterprise/`
3. Start backend server: `npm start`
4. Follow detailed instructions in `../../CHROME_WEB_STORE_SCREENSHOTS.md`
5. Save each screenshot in this directory

## ✅ Requirements

- **Size:** 1280x800 or 640x400 pixels
- **Format:** PNG or JPEG
- **Max file size:** 2 MB per image
- **Quality:** High resolution, clear text, professional appearance

## 📋 Checklist

Before Chrome Web Store submission, verify:
- [ ] All 5 screenshots created
- [ ] Correct file names (screenshot-1 through screenshot-5)
- [ ] Correct dimensions (1280x800 or 640x400)
- [ ] PNG or JPEG format
- [ ] Each file < 2 MB
- [ ] No personal/sensitive information visible
- [ ] Professional appearance
- [ ] Clear, readable text
- [ ] Connection status shows "connected" (green)

## 📚 Resources

- Screenshot creation guide: `../../CHROME_WEB_STORE_SCREENSHOTS.md`
- Screenshot creation script: `../../../scripts/create-screenshots.sh`
- Chrome Web Store requirements: https://developer.chrome.com/docs/webstore/images/

---

**Status:** Screenshots need to be created manually  
**Last Updated:** December 10, 2025
