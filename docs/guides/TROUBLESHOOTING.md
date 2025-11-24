# 🔧 Troubleshooting Guide

**Common issues and solutions for Workstation installation and operation**

---

## Table of Contents

1. [Server Issues](#server-issues)
2. [Download Issues](#download-issues)
3. [Chrome Extension Issues](#chrome-extension-issues)
4. [Workflow Builder Issues](#workflow-builder-issues)
5. [Authentication Issues](#authentication-issues)
6. [Network Issues](#network-issues)
7. [Performance Issues](#performance-issues)
8. [Database Issues](#database-issues)
9. [Browser Automation Issues](#browser-automation-issues)
10. [Getting Help](#getting-help)

---

## Server Issues

### Server Won't Start

**Symptom**: Server fails to start with error message

**Common Causes & Solutions**:

#### 1. Invalid or Missing JWT_SECRET

```
Error: JWT_SECRET environment variable is required
```

**Solution**:
```bash
# Generate a secure secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Add to .env file
echo "JWT_SECRET=your_generated_secret_here" >> .env

# Restart server
npm start
```

#### 2. Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution**:
```bash
# Find process using port 3000
# On Mac/Linux:
lsof -i :3000

# On Windows:
netstat -ano | findstr :3000

# Kill the process (replace PID with actual process ID)
kill -9 <PID>

# Or use a different port
PORT=3001 npm start
```

#### 3. Missing Dependencies

```
Error: Cannot find module 'express'
```

**Solution**:
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Verify installation
npm list express
```

#### 4. Build Errors

```
Error: TypeScript compilation failed
```

**Solution**:
```bash
# Clean build
rm -rf dist
npm run build

# Check for TypeScript errors
npx tsc --noEmit

# Update TypeScript
npm install -D typescript@latest
```

---

## Download Issues

### Downloads Return 404 Not Found

**Symptom**: Clicking download button returns 404 error

**Cause**: Download artifacts not generated

**Solution**:
```bash
# Generate download artifacts
npm run build:downloads

# Verify files exist
ls -la public/downloads/

# Restart server
npm start
```

### Downloads Are Slow

**Symptom**: Downloads take longer than expected

**Possible Causes**:
1. Large file size
2. Network congestion
3. Server resource constraints

**Solution**:
```bash
# Check file sizes
ls -lh public/downloads/

# Monitor server resources
top  # or htop on Linux

# Increase server resources if needed
```

### Rate Limiting Errors

**Symptom**: "Too many requests" error (HTTP 429)

**Cause**: Downloaded files more than 20 times in 15 minutes

**Solution**:
```bash
# Wait 15 minutes and try again
# Or increase rate limit in src/routes/downloads.ts

# Check current rate limit status
curl -I http://localhost:3000/downloads/manifest.json
# Look for X-RateLimit-* headers
```

### Corrupt ZIP Files

**Symptom**: Downloaded ZIP won't extract

**Cause**: File corruption during download or build

**Solution**:
```bash
# Verify ZIP integrity
unzip -t public/downloads/chrome-extension.zip

# If corrupt, regenerate
npm run build:chrome
npm run build:downloads

# Re-download
curl -O http://localhost:3000/downloads/chrome-extension.zip
```

---

## Chrome Extension Issues

### Extension Won't Load in Chrome

**Symptom**: "Failed to load extension" error

**Common Causes & Solutions**:

#### 1. Missing manifest.json

**Solution**:
```bash
# Verify manifest exists
ls chrome-extension/manifest.json

# If missing, rebuild
npm run build:chrome
```

#### 2. Invalid manifest.json

**Solution**:
```bash
# Validate manifest
cat chrome-extension/manifest.json | python -m json.tool

# Check for required fields
jq '.manifest_version, .name, .version' chrome-extension/manifest.json
```

#### 3. Incorrect Folder Selected

**Solution**:
1. Ensure you selected the **folder** containing manifest.json
2. Not the ZIP file
3. Not a parent folder

#### 4. Developer Mode Not Enabled

**Solution**:
1. Go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Retry loading extension

### Extension Can't Connect to Backend

**Symptom**: Extension shows connection errors

**Solution**:
```bash
# Verify server is running
curl http://localhost:3000/health

# Check extension settings
1. Click extension icon
2. Go to Settings tab
3. Verify Backend URL: http://localhost:3000
4. Click Save Settings

# Check CORS settings
# In server, ensure localhost is allowed
```

### Extension Popup Doesn't Open

**Symptom**: Clicking extension icon does nothing

**Solution**:
1. Right-click extension icon → "Inspect popup"
2. Check console for errors
3. Verify popup.html exists in extension folder
4. Try reloading extension:
   - Go to `chrome://extensions/`
   - Click refresh icon on Workstation extension

---

## Workflow Builder Issues

### Workflow Builder Won't Load

**Symptom**: Blank page or errors when opening workflow-builder.html

**Solution**:
```bash
# Verify file exists
ls public/workflow-builder.html

# Check browser console for errors
# Press F12, go to Console tab

# Try accessing via server (preferred)
http://localhost:3000/workflow-builder.html

# Rather than file:// URL
```

### Drag and Drop Not Working

**Symptom**: Can't drag workflow nodes

**Solution**:
1. Check browser compatibility (Chrome 90+, Firefox 88+)
2. Disable browser extensions that might interfere
3. Clear browser cache: Ctrl+Shift+Delete
4. Try incognito/private mode

### Workflow Won't Save

**Symptom**: Save button doesn't work

**Solution**:
```javascript
// Check browser console
// Press F12 → Console

// Verify localStorage is enabled
localStorage.setItem('test', 'test');
// If error, localStorage is blocked

// Enable localStorage in browser settings
```

### Workflow Won't Execute

**Symptom**: Workflow saves but doesn't run

**Solution**:
```bash
# Verify server is running
curl http://localhost:3000/health

# Check if authenticated
# Get JWT token
TOKEN=$(curl -s http://localhost:3000/auth/demo-token | jq -r '.token')

# Test workflow execution
curl -X POST http://localhost:3000/api/v2/workflows/execute \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @my-workflow.json
```

---

## Authentication Issues

### JWT Token Expired

**Symptom**: "Token expired" or "Invalid token" errors

**Solution**:
```bash
# Generate new token
curl http://localhost:3000/auth/demo-token

# Or create custom token
curl -X POST http://localhost:3000/auth/token \
  -H "Content-Type: application/json" \
  -d '{"userId":"myuser","expiresIn":"24h"}'
```

### Can't Get Demo Token

**Symptom**: /auth/demo-token returns error

**Solution**:
```bash
# Verify JWT_SECRET is set
grep JWT_SECRET .env

# Check server logs
tail -f logs/server.log

# Restart server
npm start
```

---

## Network Issues

### CORS Errors

**Symptom**: "Access-Control-Allow-Origin" errors in browser console

**Solution**:
```bash
# Add your origin to ALLOWED_ORIGINS in .env
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Or set wildcard (development only!)
ALLOWED_ORIGINS=*

# Restart server
npm start
```

### Connection Refused

**Symptom**: "Connection refused" or "ERR_CONNECTION_REFUSED"

**Solution**:
```bash
# Verify server is running
ps aux | grep node

# Check if listening on correct port
lsof -i :3000

# Verify firewall not blocking
sudo ufw status  # Linux
# Check Windows Firewall on Windows

# Try accessing from localhost only
curl http://localhost:3000/health
```

---

## Performance Issues

### Slow Server Response

**Symptom**: Requests take longer than 1 second

**Diagnosis**:
```bash
# Check server load
top
# Look for high CPU/memory usage

# Check database performance
# If using PostgreSQL:
psql -U youruser -d workstation
\timing on
SELECT COUNT(*) FROM workflows;
```

**Solutions**:
1. Add database indexes
2. Increase server resources
3. Enable caching
4. Optimize queries

### High Memory Usage

**Symptom**: Node process using excessive memory

**Solution**:
```bash
# Increase Node memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm start

# Monitor memory
node --inspect dist/index.js
# Open chrome://inspect

# Check for memory leaks
# Use Chrome DevTools Memory profiler
```

### Browser Automation Slow

**Symptom**: Playwright actions take too long

**Solution**:
```typescript
// Increase timeout in workflow
{
  "action": "click",
  "parameters": {
    "selector": "#button",
    "timeout": 30000  // 30 seconds
  }
}
```

---

## Database Issues

### SQLite Database Locked

**Symptom**: "database is locked" error

**Solution**:
```bash
# Check for multiple server instances
ps aux | grep node

# Kill duplicate instances
kill <PID>

# If persistent, delete lock file
rm data/workstation.db-journal

# Restart server
npm start
```

### Database Migration Failed

**Symptom**: Schema errors after update

**Solution**:
```bash
# Backup database
cp data/workstation.db data/workstation.db.backup

# Reset database (development only!)
rm data/workstation.db
npm run build
npm start

# Or run migrations manually
node scripts/migrate-database.js
```

---

## Browser Automation Issues

### Playwright Browsers Not Installed

**Symptom**: "Executable doesn't exist" error

**Solution**:
```bash
# Install Playwright browsers
npx playwright install --with-deps

# Verify installation
npx playwright --version

# Install specific browser
npx playwright install chromium
```

### Browser Launch Fails

**Symptom**: Browser won't open

**Solution**:
```bash
# Check if running in headless mode
# In workflow, set headless: false for debugging

# Verify system dependencies (Linux)
sudo npx playwright install-deps

# Check permissions
ls -la ~/.cache/ms-playwright

# Try different browser
# Change browser: 'chromium' to 'firefox' or 'webkit'
```

### Screenshots Fail

**Symptom**: Screenshot action returns error

**Solution**:
```bash
# Ensure output directory exists
mkdir -p screenshots

# Check write permissions
ls -ld screenshots

# Verify disk space
df -h
```

---

## Getting Help

### Before Asking for Help

1. **Check this guide** for common solutions
2. **Search GitHub Issues**: https://github.com/creditXcredit/workstation/issues
3. **Review documentation**: README.md, INSTALLATION_GUIDE.md
4. **Check logs**: `tail -f logs/server.log`
5. **Test with minimal example**: Try simplest workflow first

### Reporting Bugs

When creating an issue, include:

```markdown
**Environment**:
- OS: [macOS 14 / Windows 11 / Ubuntu 22.04]
- Node Version: [18.19.0]
- Browser: [Chrome 119]
- Workstation Version: [1.0.0]

**Expected Behavior**:
[What should happen]

**Actual Behavior**:
[What actually happens]

**Steps to Reproduce**:
1. ...
2. ...
3. ...

**Error Messages**:
```
[Paste full error message]
```

**Console Output**:
```
[Paste relevant console output]
```

**Logs**:
```
[Paste server logs if applicable]
```
```

### Getting Support

- 📖 **Documentation**: https://github.com/creditXcredit/workstation/tree/main/docs
- 🐛 **Issues**: https://github.com/creditXcredit/workstation/issues
- 💬 **Discussions**: https://github.com/creditXcredit/workstation/discussions
- 📧 **Email**: support@workstation.dev (if available)

### Community Resources

- Discord/Slack: [Link if available]
- Stack Overflow: Tag `workstation-automation`
- Reddit: r/workstation (if exists)

---

## Diagnostic Commands

**Quick Health Check**:
```bash
# Server health
curl http://localhost:3000/health

# Downloads health
curl http://localhost:3000/downloads/health

# Get system info
node -v
npm -v
npx playwright --version

# Check running processes
ps aux | grep node

# Check disk space
df -h

# Check memory
free -h  # Linux
top -l 1 | grep PhysMem  # macOS
```

**Log Analysis**:
```bash
# View last 50 lines of logs
tail -50 logs/server.log

# Follow logs in real-time
tail -f logs/server.log

# Search for errors
grep -i error logs/server.log

# Count errors by type
grep -i error logs/server.log | sort | uniq -c
```

---

**Last Updated**: 2025-11-23  
**Version**: 1.0.0  
**Maintained By**: Support Team
