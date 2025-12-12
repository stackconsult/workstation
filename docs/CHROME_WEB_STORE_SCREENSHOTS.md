# Chrome Web Store Screenshots and Media Requirements

## 📸 Required Screenshots for Chrome Web Store Submission

Chrome Web Store requires screenshots to showcase your extension's functionality. This document provides specifications and guidance for creating professional screenshots.

---

## 🎯 Screenshot Requirements

### Minimum Requirements
- **Quantity:** At least 1 screenshot (5 recommended)
- **Size:** 1280x800 or 640x400 pixels
- **Format:** PNG or JPEG
- **Max File Size:** 2 MB per image

### Recommended Screenshots (5 Total)

#### 1. Extension Popup - Execute Tab
**What to capture:**
- Extension popup open showing the Execute tab
- Sample workflow description in the textarea
- All 4 tabs visible (Execute, Builder, Templates, History, Settings)
- Connection status indicator (green = connected)
- Execute Workflow button

**Recommended size:** 1280x800
**Filename:** `screenshot-1-execute-tab.png`

**How to capture:**
1. Open Chrome DevTools (F12)
2. Click extension icon to open popup
3. Switch to Execute tab
4. Enter sample text: "Search for 'AI automation' on Google and take a screenshot"
5. Use screenshot tool to capture the popup area

---

#### 2. Visual Workflow Builder
**What to capture:**
- Workflow builder interface open in full browser window
- Drag-and-drop node editor with sample workflow
- Multiple nodes connected (e.g., Navigate → Click → Extract Data)
- Zoom/pan controls visible
- Save/Export buttons

**Recommended size:** 1280x800
**Filename:** `screenshot-2-workflow-builder.png`

**How to capture:**
1. Click extension icon → Builder tab → Open Builder
2. Create a sample visual workflow with 3-4 nodes
3. Connect nodes with lines
4. Capture full browser window with workflow visible

---

#### 3. Template Library
**What to capture:**
- Extension popup showing Templates tab
- Multiple workflow templates visible
- Template cards showing:
  - Template name
  - Description
  - Category badge
  - Complexity indicator

**Recommended size:** 1280x800
**Filename:** `screenshot-3-templates.png`

**How to capture:**
1. Open extension popup
2. Click Templates tab
3. Scroll to show variety of templates
4. Capture popup with 4-6 templates visible

---

#### 4. Execution History
**What to capture:**
- Extension popup showing History tab
- Multiple completed workflow executions
- Status badges (success, error, running)
- Timestamps
- Clear All button

**Recommended size:** 1280x800
**Filename:** `screenshot-4-history.png`

**How to capture:**
1. Execute 3-4 workflows first (to populate history)
2. Open extension popup
3. Click History tab
4. Capture popup showing execution history

---

#### 5. Settings Panel
**What to capture:**
- Extension popup showing Settings tab
- Backend URL configuration
- Poll interval setting
- Auto-retry toggle
- Connection status indicator
- Save Settings button

**Recommended size:** 1280x800
**Filename:** `screenshot-5-settings.png`

**How to capture:**
1. Open extension popup
2. Click Settings tab
3. Show configured backend URL: `http://localhost:3000`
4. Capture popup with all settings visible

---

## 🎨 Optional Promotional Images

### Small Promotional Tile
- **Size:** 440x280 pixels
- **Purpose:** Chrome Web Store search results
- **Content:** Extension icon + "Workstation AI Agent" text + tagline

### Large Promotional Tile
- **Size:** 920x680 pixels
- **Purpose:** Chrome Web Store featured listings
- **Content:** More detailed graphic with feature highlights

### Marquee Promotional Image
- **Size:** 1400x560 pixels
- **Purpose:** Chrome Web Store homepage carousel
- **Content:** Professional banner with key features

---

## 📝 Screenshot Best Practices

### 1. Clean and Professional
- ✅ Clear, high-resolution images
- ✅ Professional font rendering
- ✅ Proper spacing and alignment
- ❌ No watermarks or overlays
- ❌ No personal/sensitive information

### 2. Consistent Styling
- Use same theme/appearance across all screenshots
- Ensure connection status shows "connected" (green)
- Use sample data that looks realistic but not real

### 3. Highlight Key Features
- Show extension doing something useful
- Demonstrate the value proposition
- Make it clear what the extension does

### 4. Context Matters
- Show the extension in actual use
- Include relevant UI elements
- Demonstrate real workflows

---

## 🛠️ Tools for Creating Screenshots

### Built-in Tools
- **Chrome Screenshot Tool:** DevTools → More tools → Capture screenshot
- **macOS:** Cmd+Shift+4 → Select area
- **Windows:** Windows+Shift+S → Select area
- **Linux:** Screenshot utility

### Professional Tools
- **Snagit:** Advanced screenshot editing
- **Greenshot:** Free, open-source
- **Lightshot:** Simple, fast captures
- **Monosnap:** Cross-platform

### Image Editing
- **GIMP:** Free, open-source (resize, crop, annotate)
- **Photoshop:** Professional editing
- **Preview (macOS):** Basic resize/crop
- **Paint.NET (Windows):** Free editing

---

## 📋 Screenshot Checklist

Before submitting to Chrome Web Store, verify:

### Technical Requirements
- [ ] All screenshots are 1280x800 or 640x400 pixels
- [ ] File format is PNG or JPEG
- [ ] Each file is under 2 MB
- [ ] Minimum 1 screenshot (5 recommended)
- [ ] Images are clear and high-quality

### Content Requirements
- [ ] Screenshots show actual extension UI
- [ ] No personal or sensitive information visible
- [ ] Sample data looks professional
- [ ] All text is readable
- [ ] Features are clearly demonstrated

### Feature Coverage
- [ ] Screenshot showing Execute tab
- [ ] Screenshot showing Templates library
- [ ] Screenshot showing Workflow Builder
- [ ] Screenshot showing History tracking
- [ ] Screenshot showing Settings panel

---

## 📁 Screenshot Storage

Store screenshots in repository:
```
docs/
  screenshots/
    chrome-web-store/
      screenshot-1-execute-tab.png
      screenshot-2-workflow-builder.png
      screenshot-3-templates.png
      screenshot-4-history.png
      screenshot-5-settings.png
      promotional-tile-small.png (optional)
      promotional-tile-large.png (optional)
      marquee.png (optional)
```

---

## 🚀 Uploading to Chrome Web Store

### Step 1: Prepare Screenshots
1. Create all 5 recommended screenshots
2. Verify size and format requirements
3. Rename files descriptively

### Step 2: Upload Process
1. Go to Chrome Web Store Developer Dashboard
2. Select your extension listing
3. Navigate to "Store listing" tab
4. Scroll to "Screenshots" section
5. Click "Add screenshot" for each image
6. Upload in order (screenshots appear in upload order)

### Step 3: Add Captions (Optional)
- Screenshot 1: "Execute workflows with natural language"
- Screenshot 2: "Visual workflow builder - drag and drop"
- Screenshot 3: "20+ pre-built workflow templates"
- Screenshot 4: "Track execution history and results"
- Screenshot 5: "Configure settings and backend connection"

---

## 💡 Tips for Great Screenshots

1. **Use Realistic Data**
   - Example workflows that make sense
   - Realistic execution times
   - Professional-looking URLs

2. **Show Success States**
   - Green connection indicators
   - Successful workflow executions
   - Completed states (not loading)

3. **Highlight Key Features**
   - Visual workflow builder is unique - emphasize it
   - Show the 25+ AI agents capability
   - Demonstrate ease of use

4. **Maintain Consistency**
   - Same browser window size
   - Same zoom level
   - Same theme/styling

5. **Consider User Perspective**
   - What would a new user want to see?
   - Does it clearly show value?
   - Is it immediately understandable?

---

## 📊 Example Screenshot Descriptions

Use these when uploading to Chrome Web Store:

### Execute Tab
> "Execute browser automation workflows using natural language descriptions. Simply describe what you want to automate, and the AI agents handle the rest."

### Workflow Builder
> "Visual drag-and-drop workflow builder lets you create complex automation sequences without coding. Connect nodes to build powerful workflows."

### Templates
> "Choose from 20+ pre-built workflow templates for common tasks like web scraping, form filling, data extraction, and testing."

### History
> "Track all workflow executions with detailed history, status indicators, and timestamps. Easily re-run or edit past workflows."

### Settings
> "Configure backend server connection, polling intervals, and extension behavior. Full control over how the extension works for you."

---

## 🎬 Video Demo (Optional)

Chrome Web Store also accepts video demos:
- **Platform:** YouTube
- **Length:** 30-60 seconds recommended
- **Content:** Quick demo of key features
- **Format:** Professional, concise, engaging

**What to include:**
1. Opening extension popup (2s)
2. Executing a simple workflow (8s)
3. Showing workflow builder (5s)
4. Browsing templates (3s)
5. Checking history (2s)
6. Total: ~20 seconds

---

## ✅ Final Checklist

Before Chrome Web Store submission:

- [ ] Created all 5 screenshots (minimum 1, recommended 5)
- [ ] Verified all screenshots meet size requirements (1280x800 or 640x400)
- [ ] Checked file formats (PNG or JPEG)
- [ ] Confirmed each file is under 2 MB
- [ ] No sensitive information in screenshots
- [ ] Screenshots show professional sample data
- [ ] All key features demonstrated
- [ ] Images are high-quality and clear
- [ ] Screenshots stored in repository for future reference
- [ ] Ready to upload to Chrome Web Store Developer Dashboard

---

**Last Updated:** December 10, 2025  
**For:** Workstation AI Agent v2.1.0 Enterprise  
**Chrome Web Store Requirements:** https://developer.chrome.com/docs/webstore/images/
