# ⚡ QUICK RUN - Chrome Extension

## Build, Test, Run in 60 Seconds

### Step 1: Build (10 seconds)
```bash
npm run build:chrome
```
**Result:** `dist/workstation-ai-agent-v2.1.0.zip` created

### Step 2: Load in Chrome (30 seconds)
```bash
# Extract
unzip dist/workstation-ai-agent-v2.1.0.zip -d ~/chrome-test

# Load in Chrome:
# 1. Open chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select ~/chrome-test
```

### Step 3: Start Backend (20 seconds)
```bash
npm install && npm run build && npm start
```
**Server:** http://localhost:3000

---

## Verify It Works

✅ Extension icon in Chrome toolbar  
✅ Popup opens with 4 tabs  
✅ Backend at http://localhost:3000/health/live  
✅ Extension Settings shows "Connected ✅"

---

## Need More Help?

See: **🚀_START_HERE_CHROME_EXTENSION.md** (complete guide)

---

**That's it!** You're running.
