# Chrome Web Store Production Deployment Checklist

## 🎯 Overview

This checklist ensures your Workstation AI Agent Chrome extension and backend are properly configured for production deployment to the Chrome Web Store.

---

## ✅ Pre-Deployment Checklist

### 1. Backend Security Configuration

#### 1.1 Environment Variables - CRITICAL ⚠️

- [ ] **JWT_SECRET** generated using secure random method
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
  - [ ] Minimum 64 characters (256-bit)
  - [ ] Never use example/default values
  - [ ] Different from SESSION_SECRET

- [ ] **SESSION_SECRET** generated using secure random method
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
  - [ ] Minimum 64 characters (256-bit)
  - [ ] Never use example/default values
  - [ ] Different from JWT_SECRET

- [ ] **ENCRYPTION_KEY** generated using OpenSSL
  ```bash
  openssl rand -base64 48
  ```
  - [ ] Minimum 32 characters
  - [ ] Used for OAuth/Slack token encryption

- [ ] **NODE_ENV** set to `production`

- [ ] **ALLOWED_ORIGINS** configured with specific domains
  - [ ] NO wildcards (`*`) in production
  - [ ] Include all actual production domains
  - [ ] Example: `https://yourdomain.com,https://app.yourdomain.com`

- [ ] **Rate Limiting** enabled and configured
  - [ ] `RATE_LIMIT_WINDOW_MS=900000` (15 minutes)
  - [ ] `RATE_LIMIT_MAX_REQUESTS=100`
  - [ ] `AUTH_RATE_LIMIT_MAX=10`

#### 1.2 Security Best Practices

- [ ] `.env` file is in `.gitignore` (never committed)
- [ ] All secrets are randomly generated (no defaults)
- [ ] Backend served over HTTPS (not HTTP)
- [ ] SSL/TLS certificates properly configured
- [ ] Reverse proxy (nginx/Apache) configured if applicable
- [ ] Firewall rules allow only necessary ports
- [ ] Database credentials secured and rotated regularly

#### 1.3 Backend Deployment

- [ ] Backend server running and accessible
- [ ] Health check endpoint working (`/health`)
  ```bash
  curl https://your-api-domain.com/health
  # Expected: {"status":"ok","timestamp":"..."}
  ```
- [ ] API endpoints responding correctly
- [ ] WebSocket connections working (if using real-time features)
- [ ] Logs configured and monitored
- [ ] Process manager configured (PM2, systemd, etc.)
- [ ] Auto-restart on failure enabled
- [ ] Backup and disaster recovery plan in place

---

### 2. Chrome Extension Configuration

#### 2.1 Extension Package Verification

- [ ] Extension ZIP file built successfully
  ```bash
  npm run build:chrome:enterprise
  ```
- [ ] ZIP file size reasonable (< 200 KB recommended)
- [ ] All required files present in ZIP (54 files expected)
- [ ] Manifest V3 format validated
- [ ] No development files included
- [ ] No source maps in production build (optional - keep for debugging)

#### 2.2 Manifest.json Verification

- [ ] **name** is clear and descriptive
- [ ] **version** follows semantic versioning (e.g., 2.1.0)
- [ ] **description** is compelling (under 132 characters)
- [ ] **permissions** are minimal and justified
  - [ ] `activeTab` - For current tab automation
  - [ ] `storage` - For settings persistence
  - [ ] `scripting` - For automation execution
  - [ ] `notifications` - For user alerts
- [ ] **host_permissions** include production backend URL
  ```json
  "host_permissions": [
    "<all_urls>",
    "https://your-api-domain.com/*"
  ]
  ```
- [ ] **icons** present and correct sizes (16x16, 48x48, 128x128)
- [ ] **content_security_policy** configured (no unsafe-eval/unsafe-inline)

#### 2.3 Extension Testing

- [ ] Extension loads without errors in Chrome
- [ ] All 4 tabs functional (Execute, Builder, Templates, History, Settings)
- [ ] Backend connection successful
- [ ] Workflows execute correctly
- [ ] Templates load and work
- [ ] History tracking works
- [ ] Settings persist after reload
- [ ] No console errors
- [ ] Performance acceptable (< 500ms load time)
- [ ] Memory usage acceptable (< 50MB)

---

### 3. Chrome Web Store Submission

#### 3.1 Developer Account

- [ ] Chrome Web Store developer account created
- [ ] $5 registration fee paid
- [ ] Developer profile completed

#### 3.2 Store Listing Preparation

- [ ] **Privacy Policy** created and accessible
  - [ ] Created at: `docs/privacy-policy.html`
  - [ ] Hosted URL (choose one):
    - [ ] GitHub Pages: `https://creditXcredit.github.io/workstation/privacy-policy.html`
    - [ ] Or add to Chrome Web Store listing description
  - [ ] URL added to manifest.json `homepage_url` field
  - [ ] Privacy policy clearly explains:
    - [ ] What data is collected (workflows, settings, history)
    - [ ] How data is used (automation, persistence, improvement)
    - [ ] How data is stored (locally in browser)
    - [ ] How data is protected (CSP, validation, encryption)
    - [ ] User's rights (access, deletion, opt-out)
  - [ ] Compliance statements included (GDPR, CCPA)

- [ ] **Screenshots** prepared (5 recommended)
  - [ ] Size: 1280x800 or 640x400
  - [ ] Format: PNG or JPEG
  - [ ] Max file size: 2 MB per image
  - [ ] See `docs/CHROME_WEB_STORE_SCREENSHOTS.md` for detailed guide
  - [ ] Show key features:
    1. [ ] Extension popup with Execute tab
    2. [ ] Visual workflow builder
    3. [ ] Template library
    4. [ ] Execution history
    5. [ ] Settings panel

- [ ] **Promotional images** created (optional but recommended)
  - [ ] Small tile: 440x280
  - [ ] Large tile: 920x680
  - [ ] Marquee: 1400x560

- [ ] **Short description** written (132 characters max)
  ```
  Enterprise browser automation with 25+ AI agents, visual workflow builder, and Playwright-powered execution
  ```

- [ ] **Detailed description** written (comprehensive)
  - [ ] Feature highlights
  - [ ] Use cases
  - [ ] Requirements
  - [ ] Quick start guide

- [ ] **Category** selected: Productivity

- [ ] **Language** set: English (or your primary language)

#### 3.3 Privacy & Permissions

- [ ] **Privacy Policy** URL verified and accessible
  - [ ] URL: `https://github.com/creditXcredit/workstation/blob/main/docs/privacy-policy.html` (or GitHub Pages)
  - [ ] Privacy policy URL added to Chrome Web Store listing
  - [ ] Privacy policy covers all required sections (see docs/privacy-policy.html)

- [ ] **Permissions Justification** documented and ready
  - [ ] File created: `docs/PERMISSIONS_JUSTIFICATION.md` ✅
  - [ ] All 5 permissions explained (activeTab, storage, scripting, notifications, <all_urls>)
  - [ ] Host permissions justified (localhost backend)
  - [ ] User control mechanisms documented
  - [ ] Privacy protections documented
  - [ ] Security measures documented
  - [ ] FAQ section included
  - [ ] Ready for Chrome Web Store reviewer questions

- [ ] **Permissions in Chrome Web Store listing:**
  - [ ] `activeTab` - Execute automation workflows on current tab
  - [ ] `storage` - Save workflows, settings, and execution history locally
  - [ ] `scripting` - Inject automation scripts into web pages
  - [ ] `notifications` - Notify users of workflow completion/errors
  - [ ] `<all_urls>` - Allow automation on any website user chooses

#### 3.4 Submission

- [ ] All metadata completed
- [ ] Screenshots uploaded
- [ ] Promotional images uploaded (if any)
- [ ] Privacy policy linked
- [ ] Permissions justified
- [ ] Extension ZIP uploaded
- [ ] Preview reviewed
- [ ] Submission submitted for review

#### 3.5 Post-Submission

- [ ] Review status monitored (typically 1-3 business days)
- [ ] Any feedback from reviewers addressed promptly
- [ ] Extension published when approved
- [ ] Users notified of availability

---

### 4. Production Monitoring

#### 4.1 Backend Monitoring

- [ ] Uptime monitoring configured (e.g., UptimeRobot, Pingdom)
- [ ] Error logging configured (e.g., Sentry, LogRocket)
- [ ] Performance monitoring configured (e.g., New Relic, DataDog)
- [ ] Log aggregation configured (e.g., Papertrail, Loggly)
- [ ] Alerts configured for:
  - [ ] Server downtime
  - [ ] High error rates
  - [ ] High memory usage
  - [ ] High CPU usage
  - [ ] Database connection issues

#### 4.2 Extension Monitoring

- [ ] Chrome Web Store listing monitored for reviews
- [ ] User feedback monitored
- [ ] Crash reports reviewed (if using error reporting)
- [ ] Usage metrics tracked (if using analytics)

#### 4.3 Maintenance Plan

- [ ] Backup schedule configured
- [ ] Update schedule planned
- [ ] Security patch process defined
- [ ] Incident response plan documented
- [ ] Support channels established

---

### 5. Documentation

#### 5.1 User Documentation

- [ ] README.md comprehensive and up-to-date
- [ ] Installation guide clear and complete
- [ ] Quick start guide available
- [ ] Troubleshooting section comprehensive
- [ ] FAQ created (if applicable)

#### 5.2 Developer Documentation

- [ ] API documentation complete
- [ ] Architecture documented
- [ ] Deployment process documented
- [ ] Environment variables documented
- [ ] Security best practices documented

#### 5.3 Support Documentation

- [ ] Support email/contact method available
- [ ] GitHub Issues enabled (if open source)
- [ ] Community forum/Discord (if applicable)

---

## 🚀 Deployment Commands

### Generate All Secrets at Once

```bash
# Save this to a file: generate-secrets.sh
#!/bin/bash

echo "Generating production secrets..."
echo ""
echo "JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")"
echo "SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")"
echo "ENCRYPTION_KEY=$(openssl rand -base64 48)"
echo ""
echo "⚠️  SAVE THESE SECRETS SECURELY - Never commit to repository!"
echo "Add them to your .env file on the production server."
```

### Quick Deployment Script

```bash
#!/bin/bash

# 1. Build extension
npm run build:chrome:enterprise

# 2. Verify build
if [ -f "releases/workstation-ai-agent-enterprise-v2.1.0.zip" ]; then
  echo "✅ Extension ZIP created successfully"
else
  echo "❌ Extension build failed"
  exit 1
fi

# 3. Test ZIP integrity
unzip -t releases/workstation-ai-agent-enterprise-v2.1.0.zip > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "✅ ZIP integrity verified"
else
  echo "❌ ZIP is corrupted"
  exit 1
fi

# 4. Display next steps
echo ""
echo "🚀 Ready for Chrome Web Store submission!"
echo ""
echo "Next steps:"
echo "1. Go to: https://chrome.google.com/webstore/devconsole"
echo "2. Upload: releases/workstation-ai-agent-enterprise-v2.1.0.zip"
echo "3. Complete metadata and submit for review"
```

---

## ⚠️ Common Pitfalls to Avoid

1. **Using default/example secrets** - Always generate random secrets
2. **Wildcard CORS origins** - Specify exact domains in production
3. **HTTP instead of HTTPS** - Always use HTTPS for backend
4. **Committing .env file** - Never commit secrets to repository
5. **Missing permissions justification** - Chrome reviewers will reject
6. **Too many permissions** - Request only what's absolutely necessary
7. **Large extension size** - Keep under 200 KB for faster review
8. **Missing privacy policy** - Required if collecting any user data
9. **Unclear description** - Make it clear what the extension does
10. **No screenshots** - Screenshots significantly improve approval rate

---

## 📚 Resources

- **Chrome Web Store Developer Dashboard:** https://chrome.google.com/webstore/devconsole
- **Chrome Extension Documentation:** https://developer.chrome.com/docs/extensions/
- **Manifest V3 Migration:** https://developer.chrome.com/docs/extensions/mv3/intro/
- **Publishing Guide:** https://developer.chrome.com/docs/webstore/publish/

---

**Last Updated:** December 10, 2025
**Version:** 1.0.0
**Status:** Production Ready ✅
