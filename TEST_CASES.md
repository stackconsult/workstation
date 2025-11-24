# Click-Deploy + Auto-Updater System Test Cases

This document outlines comprehensive test cases for the Click-Deploy and Auto-Updater features.

## Test Environment Setup

```bash
# Prerequisites
- Node.js v18+
- npm install completed
- Server running on localhost:3000
- Chrome browser installed

# Build packages
npm run build

# Start server
npm start
```

---

## 1. Download Endpoints Tests

### 1.1 Chrome Extension Download
**Test ID**: DL-01  
**Priority**: High  
**Steps**:
1. Navigate to `http://localhost:3000/downloads/chrome-extension.zip`
2. Verify file downloads successfully
3. Check file size is approximately 72KB
4. Extract ZIP file
5. Verify all extension files are present (manifest.json, background.js, etc.)

**Expected Result**:
- ✅ File downloads without errors
- ✅ ZIP contains all required files
- ✅ File is not corrupted

### 1.2 Workflow Builder Download
**Test ID**: DL-02  
**Priority**: High  
**Steps**:
1. Navigate to `http://localhost:3000/downloads/workflow-builder.zip`
2. Verify file downloads successfully
3. Check file size is approximately 14KB
4. Extract ZIP file
5. Verify HTML and CSS files are present

**Expected Result**:
- ✅ File downloads without errors
- ✅ ZIP contains expected files
- ✅ Files are readable

### 1.3 Manifest Endpoint
**Test ID**: DL-03  
**Priority**: High  
**Steps**:
1. Make GET request to `http://localhost:3000/downloads/manifest.json`
2. Parse JSON response
3. Verify structure contains `version`, `packages`, `buildCommands`
4. Check package availability flags

**Expected Result**:
```json
{
  "version": "1.0.0",
  "generated": "ISO-8601 timestamp",
  "packages": {
    "chromeExtension": {
      "filename": "chrome-extension.zip",
      "available": true,
      "size": 72324,
      "downloadUrl": "/downloads/chrome-extension.zip",
      "description": "..."
    },
    "workflowBuilder": {
      "filename": "workflow-builder.zip",
      "available": true,
      "size": 14033,
      "downloadUrl": "/downloads/workflow-builder.zip",
      "description": "..."
    }
  },
  "buildCommands": { ... }
}
```

### 1.4 404 Error Handling
**Test ID**: DL-04  
**Priority**: Medium  
**Steps**:
1. Delete generated ZIP files: `rm public/downloads/*.zip`
2. Navigate to `http://localhost:3000/downloads/chrome-extension.zip`
3. Verify 404 response with helpful error message

**Expected Result**:
- ✅ HTTP 404 status code
- ✅ JSON error response
- ✅ Helpful error message suggesting build command

### 1.5 Network Failure Handling
**Test ID**: DL-05  
**Priority**: Medium  
**Steps**:
1. Stop the server
2. Attempt download from dashboard
3. Verify graceful error handling in UI

**Expected Result**:
- ✅ Error message displayed in status area
- ✅ Button remains interactive
- ✅ No JavaScript errors in console

---

## 2. Dashboard UI Tests

### 2.1 Download Section Visibility
**Test ID**: UI-01  
**Priority**: High  
**Steps**:
1. Open `http://localhost:3000/dashboard.html`
2. Scroll to Quick Downloads section
3. Verify both download cards are visible

**Expected Result**:
- ✅ Chrome Extension card displays
- ✅ Workflow Builder card displays
- ✅ Version info shows "Version: 1.0.0"
- ✅ File sizes display correctly

### 2.2 Chrome Extension Download Button
**Test ID**: UI-02  
**Priority**: High  
**Steps**:
1. Open dashboard
2. Wait for manifest to load
3. Click "Download chrome-extension.zip" button
4. Verify download starts
5. Check status message updates

**Expected Result**:
- ✅ Button enabled after manifest loads
- ✅ Download initiates on click
- ✅ Status shows "✅ Download started!"
- ✅ Status clears after 3 seconds

### 2.3 Workflow Builder Download Button
**Test ID**: UI-03  
**Priority**: High  
**Steps**:
1. Open dashboard
2. Click "Download workflow-builder.zip" button
3. Verify download behavior

**Expected Result**:
- ✅ Same as UI-02 for workflow builder

### 2.4 Download Handler Initialization
**Test ID**: UI-04  
**Priority**: Medium  
**Steps**:
1. Open browser console
2. Navigate to dashboard
3. Check for JavaScript errors
4. Verify `window.downloadHandler` exists

**Expected Result**:
- ✅ No console errors
- ✅ Download handler initialized
- ✅ Manifest fetched automatically

### 2.5 Button States
**Test ID**: UI-05  
**Priority**: Medium  
**Steps**:
1. Before manifest loads: Check button shows "Checking..."
2. After manifest loads: Check button shows "Download ..."
3. If package unavailable: Check button shows "Not Available"

**Expected Result**:
- ✅ Button text updates correctly
- ✅ Disabled state matches availability
- ✅ Status messages are helpful

---

## 3. Workflow Builder Page Tests

### 3.1 Download Section in Header
**Test ID**: WB-01  
**Priority**: High  
**Steps**:
1. Open `http://localhost:3000/workflow-builder.html`
2. Locate download section in header
3. Verify version and size display
4. Click download button

**Expected Result**:
- ✅ Download section visible
- ✅ Information accurate
- ✅ Download works same as dashboard

### 3.2 React App Compatibility
**Test ID**: WB-02  
**Priority**: High  
**Steps**:
1. Open workflow builder
2. Verify React app still functions
3. Test download functionality
4. Test workflow builder features

**Expected Result**:
- ✅ No conflicts between download handler and React
- ✅ All features work correctly

---

## 4. Build Script Tests

### 4.1 Chrome Extension Build
**Test ID**: BUILD-01  
**Priority**: High  
**Steps**:
```bash
npm run build:chrome
```

**Expected Result**:
```
✓ Chrome extension zip created successfully
  File: /path/to/public/downloads/chrome-extension.zip
  Size: 0.07 MB (72324 bytes)
```

### 4.2 Workflow Builder Build
**Test ID**: BUILD-02  
**Priority**: High  
**Steps**:
```bash
npm run build:workflow
```

**Expected Result**:
```
✓ Workflow builder zip created successfully
  File: /path/to/public/downloads/workflow-builder.zip
  Size: 13.70 KB (14033 bytes)
```

### 4.3 Full Build
**Test ID**: BUILD-03  
**Priority**: High  
**Steps**:
```bash
npm run build
```

**Expected Result**:
- ✅ TypeScript compiles
- ✅ Assets copied
- ✅ Chrome extension zipped
- ✅ Workflow builder zipped
- ✅ No build errors

---

## 5. Auto-Updater Script Tests

### 5.1 Script Execution
**Test ID**: AUTO-01  
**Priority**: High  
**Steps**:
```bash
npm run update:agents
```

**Expected Result**:
- ✅ Script runs without errors
- ✅ Mock data generated
- ✅ Markdown generated
- ✅ Files checked for markers

### 5.2 Markdown Injection Library
**Test ID**: AUTO-02  
**Priority**: Medium  
**Steps**:
1. Add markers to a test markdown file
2. Run injection function
3. Verify content injected correctly
4. Check backup created

**Expected Result**:
- ✅ Content injected between markers
- ✅ Backup file created
- ✅ Original markers preserved

### 5.3 Rollback Function
**Test ID**: AUTO-03  
**Priority**: Medium  
**Steps**:
1. Inject content with backup
2. Call rollback function
3. Verify file restored

**Expected Result**:
- ✅ File restored to original state
- ✅ Backup file removed

---

## 6. GitHub Actions Workflow Tests

### 6.1 Manual Trigger
**Test ID**: GHA-01  
**Priority**: Medium  
**Steps**:
1. Go to Actions tab in GitHub
2. Find "Agent Status Auto-Update" workflow
3. Click "Run workflow"
4. Wait for completion

**Expected Result**:
- ✅ Workflow runs successfully
- ✅ Checks out code
- ✅ Installs dependencies
- ✅ Runs update script
- ✅ Commits changes if any

### 6.2 Scheduled Execution
**Test ID**: GHA-02  
**Priority**: Low  
**Steps**:
1. Wait for scheduled run (9 PM UTC)
2. Check workflow execution
3. Verify documentation updated

**Expected Result**:
- ✅ Runs at scheduled time
- ✅ Updates committed by github-actions bot

---

## 7. Integration Tests

### 7.1 End-to-End Download Flow
**Test ID**: INT-01  
**Priority**: Critical  
**Steps**:
1. Build packages: `npm run build`
2. Start server: `npm start`
3. Open dashboard
4. Download chrome extension
5. Extract and load in Chrome
6. Verify extension works

**Expected Result**:
- ✅ Complete flow works seamlessly
- ✅ Extension loads in Chrome
- ✅ No errors at any step

### 7.2 Cross-Browser Compatibility
**Test ID**: INT-02  
**Priority**: Medium  
**Steps**:
1. Test downloads in Chrome, Firefox, Safari, Edge
2. Verify all browsers handle downloads correctly

**Expected Result**:
- ✅ Downloads work in all browsers
- ✅ ZIP files extract correctly

---

## 8. Error Scenarios

### 8.1 Corrupted ZIP File
**Test ID**: ERR-01  
**Priority**: Low  
**Steps**:
1. Manually corrupt a ZIP file
2. Attempt download
3. Attempt extraction

**Expected Result**:
- ✅ Download succeeds
- ✅ Extraction fails with clear error
- ✅ User can report issue

### 8.2 Disk Space Full
**Test ID**: ERR-02  
**Priority**: Low  
**Steps**:
1. Simulate full disk during build
2. Verify graceful error handling

**Expected Result**:
- ✅ Build script reports error
- ✅ No corrupted files left

---

## Test Execution Checklist

- [ ] All download endpoints tested
- [ ] Dashboard UI fully tested
- [ ] Workflow builder page tested
- [ ] Build scripts validated
- [ ] Auto-updater script tested
- [ ] GitHub Actions workflow configured
- [ ] Integration tests passed
- [ ] Error scenarios handled
- [ ] Documentation updated
- [ ] All tests passing

---

## Automated Test Script

```bash
#!/bin/bash
# Quick test script

echo "🧪 Running Click-Deploy System Tests"

# Build
echo "📦 Building packages..."
npm run build || exit 1

# Test manifest endpoint (requires server running)
echo "🔍 Testing manifest endpoint..."
curl -f http://localhost:3000/downloads/manifest.json || echo "⚠️ Server not running"

# Check file existence
echo "📁 Checking generated files..."
[ -f "public/downloads/chrome-extension.zip" ] && echo "✅ Chrome extension ZIP exists" || echo "❌ Chrome extension ZIP missing"
[ -f "public/downloads/workflow-builder.zip" ] && echo "✅ Workflow builder ZIP exists" || echo "❌ Workflow builder ZIP missing"

# Test auto-updater
echo "🤖 Testing auto-updater..."
npm run update:agents || exit 1

echo "✅ Basic tests complete!"
```

---

## Manual Test Report Template

```markdown
### Test Execution Report

**Date**: YYYY-MM-DD
**Tester**: Name
**Environment**: Production/Staging/Local

| Test ID | Description | Result | Notes |
|---------|-------------|--------|-------|
| DL-01 | Chrome Extension Download | ✅ Pass | |
| DL-02 | Workflow Builder Download | ✅ Pass | |
| ... | ... | ... | ... |

**Summary**:
- Total Tests: X
- Passed: Y
- Failed: Z
- Skipped: W

**Issues Found**: None / List issues

**Sign-off**: ✅ Ready for deployment
```
