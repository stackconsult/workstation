# 🧪 E2E Test Cases: Download & Installation Flow

**Complete test scenarios for the Click-Deploy + Auto-Updater system**

---

## Table of Contents

1. [Test Environment Setup](#test-environment-setup)
2. [Download Flow Tests](#download-flow-tests)
3. [Installation Verification Tests](#installation-verification-tests)
4. [Cross-Browser Compatibility Tests](#cross-browser-compatibility-tests)
5. [Error Scenario Tests](#error-scenario-tests)
6. [Performance Tests](#performance-tests)
7. [Test Execution](#test-execution)
8. [Bug Reporting Template](#bug-reporting-template)

---

## Test Environment Setup

### Prerequisites

- Node.js 18+
- Chrome, Firefox, Safari, Edge browsers
- Workstation server running on `http://localhost:3000`
- Clean browser profiles (no existing extensions)
- Network throttling tools (optional)

### Setup Steps

```bash
# Clone and install
git clone https://github.com/creditXcredit/workstation.git
cd workstation
npm install

# Build application and downloads
npm run build
npm run build:downloads

# Start server
npm start

# Verify server is running
curl http://localhost:3000/health
```

---

## Download Flow Tests

### TC-001: Chrome Extension Download from Dashboard

**Priority**: High  
**Type**: Functional

**Steps**:
1. Navigate to `http://localhost:3000/dashboard.html`
2. Locate "Download Chrome Extension" button
3. Click the download button
4. Observe browser download behavior

**Expected Results**:
- ✅ Download initiates immediately
- ✅ File name is `chrome-extension.zip`
- ✅ File size is > 0 bytes (typically 15-20 KB)
- ✅ Download completes without errors
- ✅ No console errors in browser DevTools

**Pass Criteria**: All expected results met

---

### TC-002: Workflow Builder Download from Dashboard

**Priority**: High  
**Type**: Functional

**Steps**:
1. Navigate to `http://localhost:3000/dashboard.html`
2. Locate "Download Workflow Builder" button
3. Click the download button
4. Observe browser download behavior

**Expected Results**:
- ✅ Download initiates immediately
- ✅ File name is `workflow-builder.zip`
- ✅ File size is > 0 bytes
- ✅ Download completes without errors
- ✅ No console errors in browser DevTools

**Pass Criteria**: All expected results met

---

### TC-003: Direct Download via API

**Priority**: Medium  
**Type**: API

**Steps**:
```bash
# Chrome Extension
curl -O http://localhost:3000/downloads/chrome-extension.zip

# Workflow Builder
curl -O http://localhost:3000/downloads/workflow-builder.zip

# Manifest
curl http://localhost:3000/downloads/manifest.json
```

**Expected Results**:
- ✅ Files download successfully
- ✅ Files are valid ZIP archives
- ✅ Manifest returns valid JSON
- ✅ HTTP status code is 200
- ✅ Content-Type headers are correct

**Pass Criteria**: All downloads succeed, files are valid

---

### TC-004: Download Button UI/UX

**Priority**: Medium  
**Type**: UI/UX

**Steps**:
1. Navigate to dashboard
2. Observe download buttons
3. Hover over buttons
4. Click buttons
5. Observe visual feedback

**Expected Results**:
- ✅ Buttons are prominently displayed
- ✅ Hover effect shows interactivity
- ✅ Click provides visual feedback
- ✅ Loading indicator appears (if implemented)
- ✅ Success message shows after download

**Pass Criteria**: Good user experience, clear feedback

---

### TC-005: Download Rate Limiting

**Priority**: High  
**Type**: Security

**Steps**:
1. Download chrome-extension.zip 20 times rapidly
2. Attempt 21st download
3. Wait 15 minutes
4. Attempt download again

**Expected Results**:
- ✅ First 20 downloads succeed
- ✅ 21st download returns 429 (Too Many Requests)
- ✅ Error message is user-friendly
- ✅ After 15 minutes, downloads work again

**Pass Criteria**: Rate limiting works correctly

---

## Installation Verification Tests

### TC-006: Chrome Extension Installation

**Priority**: High  
**Type**: Integration

**Steps**:
1. Download chrome-extension.zip
2. Extract ZIP file to folder
3. Navigate to `chrome://extensions/`
4. Enable "Developer mode"
5. Click "Load unpacked"
6. Select extracted folder
7. Verify extension loads

**Expected Results**:
- ✅ ZIP extracts without errors
- ✅ manifest.json is present and valid
- ✅ Extension loads in Chrome
- ✅ Extension icon appears in toolbar
- ✅ No errors in extension console

**Pass Criteria**: Extension installs and runs successfully

---

### TC-007: Extension Functionality Post-Install

**Priority**: High  
**Type**: Functional

**Steps**:
1. Install Chrome extension (TC-006)
2. Click extension icon
3. Navigate to Settings tab
4. Enter backend URL: `http://localhost:3000`
5. Save settings
6. Test natural language workflow

**Expected Results**:
- ✅ Extension popup opens
- ✅ Settings save successfully
- ✅ Can connect to backend
- ✅ Workflows execute correctly
- ✅ Real-time feedback works

**Pass Criteria**: All features work as expected

---

### TC-008: Workflow Builder Installation

**Priority**: Medium  
**Type**: Integration

**Steps**:
1. Download workflow-builder.zip
2. Extract ZIP file
3. Open workflow-builder.html in browser
4. Test drag-and-drop functionality
5. Save a workflow
6. Load the workflow

**Expected Results**:
- ✅ ZIP extracts successfully
- ✅ HTML file opens in browser
- ✅ Workflow builder interface loads
- ✅ Drag-and-drop works
- ✅ Save/load functionality works

**Pass Criteria**: Workflow builder fully functional

---

### TC-009: ZIP File Integrity

**Priority**: High  
**Type**: Security

**Steps**:
```bash
# Test Chrome Extension ZIP
unzip -t chrome-extension.zip

# Test Workflow Builder ZIP
unzip -t workflow-builder.zip

# Check for required files
unzip -l chrome-extension.zip | grep manifest.json
```

**Expected Results**:
- ✅ ZIP files are not corrupted
- ✅ All files extract successfully
- ✅ manifest.json exists
- ✅ No malicious files detected
- ✅ File structure matches expected

**Pass Criteria**: ZIP files are valid and secure

---

## Cross-Browser Compatibility Tests

### TC-010: Chrome Browser Download

**Priority**: High  
**Type**: Compatibility

**Steps**:
1. Open Chrome browser
2. Navigate to dashboard
3. Download both files
4. Verify downloads

**Expected Results**:
- ✅ Downloads work in Chrome
- ✅ Files download to correct location
- ✅ No browser-specific errors

**Pass Criteria**: Full functionality in Chrome

---

### TC-011: Firefox Browser Download

**Priority**: Medium  
**Type**: Compatibility

**Steps**:
1. Open Firefox browser
2. Navigate to dashboard
3. Download both files
4. Verify downloads

**Expected Results**:
- ✅ Downloads work in Firefox
- ✅ Files download to correct location
- ✅ No browser-specific errors

**Pass Criteria**: Full functionality in Firefox

---

### TC-012: Safari Browser Download

**Priority**: Medium  
**Type**: Compatibility

**Steps**:
1. Open Safari browser
2. Navigate to dashboard
3. Download both files
4. Verify downloads

**Expected Results**:
- ✅ Downloads work in Safari
- ✅ Files download to correct location
- ✅ No browser-specific errors

**Pass Criteria**: Full functionality in Safari

---

### TC-013: Edge Browser Download

**Priority**: Medium  
**Type**: Compatibility

**Steps**:
1. Open Edge browser
2. Navigate to dashboard
3. Download both files
4. Verify downloads

**Expected Results**:
- ✅ Downloads work in Edge
- ✅ Files download to correct location
- ✅ No browser-specific errors

**Pass Criteria**: Full functionality in Edge

---

## Error Scenario Tests

### TC-014: Download with Server Offline

**Priority**: High  
**Type**: Error Handling

**Steps**:
1. Stop workstation server
2. Attempt to download files
3. Observe error behavior

**Expected Results**:
- ✅ Clear error message displayed
- ✅ No confusing browser errors
- ✅ Helpful troubleshooting tips
- ✅ Retry mechanism works

**Pass Criteria**: Errors are handled gracefully

---

### TC-015: Download Missing Files

**Priority**: High  
**Type**: Error Handling

**Steps**:
```bash
# Delete download files
rm public/downloads/chrome-extension.zip
rm public/downloads/workflow-builder.zip

# Attempt download
curl http://localhost:3000/downloads/chrome-extension.zip
```

**Expected Results**:
- ✅ Returns 404 Not Found
- ✅ Error message explains issue
- ✅ Suggests running build:downloads
- ✅ No server crash

**Pass Criteria**: 404 handled correctly

---

### TC-016: Corrupt ZIP File Download

**Priority**: Medium  
**Type**: Error Handling

**Steps**:
1. Create corrupt ZIP file in downloads folder
2. Attempt to download
3. Try to extract

**Expected Results**:
- ✅ Download completes
- ✅ Extraction fails with clear error
- ✅ User can re-download
- ✅ Integrity check detects corruption

**Pass Criteria**: Corruption detected, clear error message

---

### TC-017: Network Interruption During Download

**Priority**: Medium  
**Type**: Error Handling

**Steps**:
1. Start download
2. Interrupt network mid-download
3. Observe behavior
4. Restore network and retry

**Expected Results**:
- ✅ Browser handles interruption
- ✅ Partial download can be resumed (browser feature)
- ✅ Retry works after network restore
- ✅ No data corruption

**Pass Criteria**: Graceful handling of network issues

---

## Performance Tests

### TC-018: Download Speed Test

**Priority**: Low  
**Type**: Performance

**Steps**:
```bash
# Measure download time
time curl -O http://localhost:3000/downloads/chrome-extension.zip
```

**Expected Results**:
- ✅ Chrome extension downloads < 2 seconds
- ✅ Workflow builder downloads < 5 seconds
- ✅ No timeouts
- ✅ Consistent performance

**Pass Criteria**: Downloads complete quickly

---

### TC-019: Concurrent Download Test

**Priority**: Medium  
**Type**: Performance

**Steps**:
```bash
# Start 10 concurrent downloads
for i in {1..10}; do
  curl -O "http://localhost:3000/downloads/chrome-extension.zip?id=$i" &
done
wait
```

**Expected Results**:
- ✅ All 10 downloads succeed
- ✅ No server errors
- ✅ Performance remains acceptable
- ✅ Rate limiting works correctly

**Pass Criteria**: Server handles concurrent downloads

---

### TC-020: Large File Download Test

**Priority**: Low  
**Type**: Performance

**Steps**:
1. Create larger test file (10MB+)
2. Add to downloads directory
3. Download via API
4. Measure performance

**Expected Results**:
- ✅ Large files download successfully
- ✅ No memory issues
- ✅ Streaming works correctly
- ✅ Progress tracking works

**Pass Criteria**: Large files handled efficiently

---

## Test Execution

### Manual Testing Checklist

- [ ] TC-001: Chrome Extension Download from Dashboard
- [ ] TC-002: Workflow Builder Download from Dashboard
- [ ] TC-003: Direct Download via API
- [ ] TC-004: Download Button UI/UX
- [ ] TC-005: Download Rate Limiting
- [ ] TC-006: Chrome Extension Installation
- [ ] TC-007: Extension Functionality Post-Install
- [ ] TC-008: Workflow Builder Installation
- [ ] TC-009: ZIP File Integrity
- [ ] TC-010: Chrome Browser Download
- [ ] TC-011: Firefox Browser Download
- [ ] TC-012: Safari Browser Download
- [ ] TC-013: Edge Browser Download
- [ ] TC-014: Download with Server Offline
- [ ] TC-015: Download Missing Files
- [ ] TC-016: Corrupt ZIP File Download
- [ ] TC-017: Network Interruption During Download
- [ ] TC-018: Download Speed Test
- [ ] TC-019: Concurrent Download Test
- [ ] TC-020: Large File Download Test

### Automated Testing

Run automated E2E tests:

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test suite
npm test -- tests/e2e/download-flow.test.ts

# Run with coverage
npm run test:coverage -- tests/e2e/
```

### Test Reporting

Document results in this format:

```markdown
## Test Execution Report

**Date**: 2025-11-23  
**Tester**: [Name]  
**Environment**: macOS/Windows/Linux + Chrome 119

### Results

| Test Case | Status | Notes |
|-----------|--------|-------|
| TC-001 | ✅ Pass | No issues |
| TC-002 | ✅ Pass | No issues |
| TC-003 | ❌ Fail | 404 error - files missing |
| ... | ... | ... |

### Summary

- **Total Tests**: 20
- **Passed**: 18
- **Failed**: 2
- **Blocked**: 0
- **Pass Rate**: 90%

### Issues Found

1. **Issue #1**: Download files not generated
   - **Severity**: High
   - **Steps to Reproduce**: ...
   - **Expected**: ...
   - **Actual**: ...

```

---

## Bug Reporting Template

Use this template to report bugs:

```markdown
## Bug Report

**Title**: [Short description]

**Priority**: Critical / High / Medium / Low

**Environment**:
- OS: [macOS 14.0 / Windows 11 / Ubuntu 22.04]
- Browser: [Chrome 119 / Firefox 120 / Safari 17]
- Node Version: [18.19.0]
- Server Version: [1.0.0]

**Steps to Reproduce**:
1. Navigate to ...
2. Click on ...
3. Observe ...

**Expected Behavior**:
[What should happen]

**Actual Behavior**:
[What actually happens]

**Screenshots**:
[Attach screenshots if applicable]

**Console Errors**:
```
[Paste console output]
```

**Network Logs**:
```
[Paste network tab info if relevant]
```

**Additional Context**:
[Any other relevant information]

**Possible Fix**:
[If you have suggestions]
```

---

## Performance Benchmarks

### Target Metrics

| Metric | Target | Acceptable | Poor |
|--------|--------|------------|------|
| Chrome Extension Download Time | < 1s | < 2s | > 3s |
| Workflow Builder Download Time | < 3s | < 5s | > 10s |
| Extension Install Time | < 10s | < 30s | > 60s |
| Server Response Time | < 100ms | < 500ms | > 1s |
| Concurrent Downloads (10) | All succeed | 8+ succeed | < 8 succeed |

### Performance Test Results Template

```markdown
## Performance Test Results

**Date**: 2025-11-23  
**System**: [Specs]

| Test | Metric | Target | Actual | Status |
|------|--------|--------|--------|--------|
| Download Time (Chrome Ext) | < 2s | 1.2s | ✅ Pass |
| Download Time (Workflow) | < 5s | 3.8s | ✅ Pass |
| Concurrent Downloads | 10/10 | 10/10 | ✅ Pass |
| Server Response | < 500ms | 120ms | ✅ Pass |
```

---

## Accessibility Tests

### TC-021: Keyboard Navigation

**Steps**:
1. Navigate to dashboard with Tab key
2. Focus on download buttons
3. Press Enter to download

**Expected**: Full keyboard accessibility

### TC-022: Screen Reader Support

**Steps**:
1. Enable screen reader (NVDA/JAWS/VoiceOver)
2. Navigate to download section
3. Verify announcements

**Expected**: Clear aria-labels, proper announcements

---

**Last Updated**: 2025-11-23  
**Version**: 1.0.0  
**Maintained By**: QA Team
