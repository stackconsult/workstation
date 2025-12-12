# Chrome Extension Permissions Justification

## Overview

This document provides detailed justification for each permission requested by the Workstation AI Agent Chrome extension. All permissions are essential for core functionality and follow the principle of least privilege.

---

## Permissions Breakdown

### 1. `activeTab`

**Required for:** Executing user-defined automation workflows on the currently active browser tab.

**Specific Use Cases:**
- User clicks "Execute Workflow" to run automation on their current page
- Playwright scripts need access to interact with page elements
- Form filling automation requires reading and writing to active tab elements
- Data extraction workflows need to access page content

**Why This Permission:**
- `activeTab` provides minimal access - only the tab user is currently viewing
- Access is granted only when user explicitly interacts with the extension
- More restrictive than `tabs` permission which would access all tabs
- Required by Chrome for content script injection

**Alternative Considered:** 
- `tabs` permission - Rejected as too broad; we only need current tab access
- No permission - Not possible; automation requires tab interaction

**User Control:** 
- Workflows execute ONLY when user explicitly clicks "Execute Workflow" button
- User sees exactly which tab will be automated
- User can cancel execution at any time
- No background access to tabs when extension popup is closed

**Privacy Protection:**
- Extension cannot access tabs in the background
- No automatic execution without user action
- Tab content is never stored or transmitted without explicit workflow step

---

### 2. `storage`

**Required for:** Saving workflows, execution history, and user settings locally in browser storage.

**Data Stored Locally:**
- **Workflow Definitions:** User-created automation scripts and configurations
- **Execution History:** Records of past workflow runs (timestamps, status, results)
- **Template Library:** Pre-built workflow templates for quick access
- **User Settings:** Backend URL, poll intervals, auto-retry preferences
- **Extension State:** Current tab, selected template, input field values

**Storage Type:** Chrome's `chrome.storage.local` and `chrome.storage.sync` APIs

**Data Size:** Typically < 5MB total

**Privacy Guarantees:**
- All data stored locally on user's device
- Never transmitted to external servers without explicit backend configuration
- User can view all stored data via extension History tab
- User can delete all data via "Clear All" button or extension uninstall

**Why This Permission:**
- Required for workflow persistence between browser sessions
- Necessary to save user preferences and settings
- Enables execution history tracking for debugging
- Allows template library functionality

**Alternative Considered:**
- No permission - Not viable; core features require data persistence
- IndexedDB - Less secure and not recommended for extensions
- localStorage - Deprecated for extensions; chrome.storage is standard

**User Control:**
- User can clear history at any time (History tab → Clear All)
- Uninstalling extension removes all stored data
- No automatic sync to cloud (unless user enables Chrome sync)
- User can export workflows as JSON for backup

**Data Retention:**
- Workflows: Until user deletes them
- History: Until user clears or extension is uninstalled
- Settings: Until user changes them
- No automatic data expiration

---

### 3. `scripting`

**Required for:** Injecting Playwright automation scripts into web pages to execute user-defined workflows.

**Specific Use Cases:**
- Injecting automation scripts to click buttons, fill forms, extract data
- Running Playwright auto-wait logic to wait for elements to appear
- Implementing self-healing selectors that adapt to page changes
- Executing network monitoring to track HTTP requests
- Performing visual workflow builder operations

**Technical Details:**
- Uses `chrome.scripting.executeScript()` API
- Scripts injected only when user triggers workflow execution
- All injected code is part of the extension package (no remote code execution)
- Scripts run in isolated context separate from page scripts

**Why This Permission:**
- Browser automation requires script injection capabilities
- Form filling, clicking, and data extraction need DOM manipulation
- Playwright automation framework requires this permission
- Content scripts alone cannot provide full automation capabilities

**Alternative Considered:**
- Content scripts only - Insufficient; cannot inject code on-demand
- `tabs` executeScript (deprecated) - Replaced by `scripting` in Manifest V3
- No permission - Core automation features would not work

**User Control:**
- Scripts execute only when user clicks "Execute Workflow"
- User sees workflow description before execution
- User can stop execution via browser tab close
- No scripts injected without explicit user action

**Security Measures:**
- All injected scripts are pre-packaged (no remote code)
- Content Security Policy prevents XSS
- Scripts run in isolated context (cannot access page variables directly)
- Input validation on all workflow parameters

**Code Review:**
- All injection code is open-source in repository
- Automated security scanning via CodeQL
- No eval() or unsafe dynamic code execution
- Strict TypeScript typing for safety

---

### 4. `notifications`

**Required for:** Notifying users when workflows complete, encounter errors, or require attention.

**Specific Use Cases:**
- Alert user when long-running workflow completes
- Notify user of workflow errors or failures
- Inform user of successful automation completion
- Display warnings for configuration issues (e.g., backend not connected)

**Notification Types:**
- **Success:** "Workflow completed successfully"
- **Error:** "Workflow failed: [error message]"
- **Warning:** "Backend connection lost - workflows disabled"
- **Info:** "Auto-update available for extension"

**Why This Permission:**
- Users may navigate away while workflow runs; notifications bring them back
- Error notifications help with debugging failed automations
- Success notifications improve user experience for long workflows
- Critical for workflows running in background

**Alternative Considered:**
- No permission - User would have to manually check extension for status
- In-extension only alerts - Missed if user closes popup
- Browser console only - Not user-friendly; requires dev tools

**User Control:**
- Notifications are non-intrusive (system-level)
- User can disable Chrome notifications for this extension
- Notifications auto-dismiss after timeout
- User can click notification to open extension details

**Privacy Protection:**
- Notifications never contain sensitive data (URLs, passwords, personal info)
- Generic messages only (e.g., "Workflow completed" not "Logged into bank.com")
- No notification tracking or analytics
- Notifications stored only in system notification center (not by extension)

**Frequency:**
- Maximum 1 notification per workflow execution
- No spam or promotional notifications
- No notifications when extension popup is open (redundant)

---

## Host Permissions

### `<all_urls>`

**Required for:** Allowing workflows to automate tasks on any website the user chooses.

**Specific Use Cases:**
- User wants to automate tasks on various websites (Google, GitHub, e-commerce sites)
- Generic workflow templates that work across multiple domains
- Data extraction from different sources as specified by user
- Form filling on any website user accesses

**Why This Permission:**
- Browser automation must work on user's choice of websites
- Cannot predict which sites user will want to automate
- Restrictive domain lists would break core functionality
- Industry standard for automation extensions (Selenium IDE, Playwright extension)

**Alternative Considered:**
- Specific domain list - Not feasible; user needs flexibility
- Optional permissions per site - Too many prompts; poor UX
- No permission - Extension would not work

**User Control:**
- Workflows ONLY run when user explicitly triggers them
- No automatic execution on page load
- User sees which site workflow will run on before execution
- User can review workflow before running

**Privacy Protection:**
- Extension does not read pages unless user runs workflow
- No background page monitoring or data collection
- Content scripts only injected when workflow executes
- No telemetry on which sites user visits

**Security Measures:**
- Workflows run in sandboxed context
- No cross-origin data leakage
- Input validation prevents malicious workflow injection
- Content Security Policy enforced

---

### `http://localhost:3000/*` (and configurable backend URL)

**Required for:** Connecting to the optional backend server for workflow execution, template storage, and API integration.

**Specific Use Cases:**
- Sending workflow execution requests to backend API
- Fetching workflow templates from backend
- Synchronizing workflow history across devices
- WebSocket connection for real-time status updates

**Default Configuration:**
- `http://localhost:3000` for local development
- User can configure production URL in Settings (e.g., `https://api.example.com`)

**Why This Permission:**
- Backend API provides advanced features (25+ AI agents, cloud storage)
- Real-time workflow status updates via WebSocket
- Template library synchronization
- Authentication via JWT tokens

**Alternative Considered:**
- No backend - Extension would still work, but with reduced features
- Fixed URL only - Too restrictive; users need custom backends

**User Control:**
- Backend connection is **completely optional**
- Extension works offline without backend (local-only mode)
- User configures backend URL in Settings tab
- User can disable backend connection at any time

**Privacy Protection:**
- Backend URL is user-controlled (self-hosted option)
- All communication over HTTPS (recommended)
- JWT authentication for secure API access
- User data stored on their backend, not third-party servers

**Security Measures:**
- CORS validation on backend
- JWT token expiration (24 hours default)
- Rate limiting on API endpoints
- Input validation on all requests

---

## Permissions Summary Table

| Permission | Required | Optional | Why Needed | User Impact |
|-----------|----------|----------|------------|-------------|
| `activeTab` | ✅ | ❌ | Execute workflows on current tab | Minimal - only active tab when triggered |
| `storage` | ✅ | ❌ | Save workflows and settings | None - local storage only |
| `scripting` | ✅ | ❌ | Inject automation scripts | None - only when user executes workflow |
| `notifications` | ✅ | ❌ | Alert on workflow completion | Minimal - standard Chrome notifications |
| `<all_urls>` | ✅ | ❌ | Automate any website user chooses | None - only when user triggers workflow |
| Backend URL | ❌ | ✅ | Optional backend integration | None - completely optional feature |

---

## Compliance

### Chrome Web Store Policies
- ✅ Single Purpose: Browser automation and workflow management
- ✅ Minimal Permissions: Only what's necessary for core features
- ✅ User Benefit: Clear value proposition for each permission
- ✅ Privacy: No data collection, tracking, or third-party sharing
- ✅ Security: CSP enforced, input validation, no remote code execution

### Privacy Regulations
- ✅ **GDPR (EU):** No personal data collection; user has full control
- ✅ **CCPA (California):** No data sale or sharing; user can delete all data
- ✅ **COPPA (Children):** Not directed at children; no child data collection

---

## User Transparency

### In-Extension Disclosure
- Extension description clearly lists all permissions
- Settings tab shows connection status and data storage location
- Privacy policy linked in extension (docs/privacy-policy.html)
- Help text explains each permission when user hovers over info icon

### Chrome Web Store Listing
- All permissions listed in "Details" section
- Detailed description explains why each permission is needed
- Screenshots show actual permission usage
- Privacy policy URL provided

---

## Technical Implementation

### Permission Request Flow
1. User installs extension → Chrome shows permission consent screen
2. User accepts permissions → Extension activates
3. User triggers workflow → Extension uses `activeTab` permission
4. Workflow executes → `scripting` injects automation code
5. Workflow completes → `notifications` alerts user
6. Results saved → `storage` persists history

### Code Examples

**activeTab Usage:**
```javascript
// Only when user clicks "Execute Workflow"
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const activeTab = tabs[0];
  executeWorkflowOnTab(activeTab.id);
});
```

**storage Usage:**
```javascript
// Save workflow to local storage
chrome.storage.local.set({
  workflows: userWorkflows,
  history: executionHistory
});
```

**scripting Usage:**
```javascript
// Inject automation script only when user executes workflow
chrome.scripting.executeScript({
  target: { tabId: activeTabId },
  func: automationScript,
  args: [workflowConfig]
});
```

**notifications Usage:**
```javascript
// Notify user when workflow completes
chrome.notifications.create({
  type: 'basic',
  title: 'Workflow Complete',
  message: 'Your automation finished successfully'
});
```

---

## Frequently Asked Questions

### Q: Why does the extension need access to all websites?
**A:** Users can create workflows for any website they choose. Restricting to specific sites would break core functionality. Access is only used when user explicitly runs a workflow.

### Q: Is my browsing history collected?
**A:** No. The extension only interacts with tabs when you run a workflow. No browsing history, URLs, or page content is collected.

### Q: Can the extension read my passwords?
**A:** No. The extension does not read password fields, login credentials, or sensitive form data unless explicitly programmed in a user-created workflow.

### Q: What data is sent to external servers?
**A:** None, unless you configure an optional backend server. All data stays local by default.

### Q: Can I use the extension without backend connection?
**A:** Yes! The extension works fully offline. Backend is optional for advanced features.

### Q: How do I delete all extension data?
**A:** Go to History tab → Click "Clear All" button, or uninstall the extension to remove all data.

---

## Audit Trail

| Date | Change | Reason |
|------|--------|--------|
| 2025-12-10 | Initial permissions defined | Chrome extension v2.1.0 release |
| 2025-12-10 | Added `homepage_url` to manifest | Privacy policy requirement |
| 2025-12-10 | Documented all permissions | Chrome Web Store compliance |

---

## Contact & Support

**Questions about permissions?**
- GitHub Issues: https://github.com/creditXcredit/workstation/issues
- Privacy Policy: docs/privacy-policy.html
- Security Concerns: Open a GitHub security advisory

---

**Last Updated:** December 12, 2025  
**Extension Version:** 2.1.0 Enterprise  
**Manifest Version:** 3  
**Review Status:** Ready for Chrome Web Store submission
