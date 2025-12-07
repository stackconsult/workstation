# 📄 Quick Reference Card - One Page Setup

**Print this page and keep it handy!**

---

## 🚀 5-Minute Setup (First Time)

### 1️⃣ Install Node.js
- Go to: **https://nodejs.org**
- Download the **green LTS button**
- Install it (click Next → Next → Finish)

### 2️⃣ Get the Application
- Extract the ZIP file to: `C:\stackBrowserAgent`
- Or use Git: `git clone [repository-url]`

### 3️⃣ Open Command Prompt
**Windows:** Press `Win + R`, type `cmd`, press Enter  
**Mac:** Press `Cmd + Space`, type `terminal`, press Enter

### 4️⃣ Run These Commands (Copy & Paste)

```bash
# Go to the folder
cd C:\stackBrowserAgent

# Install
npm install

# Build
npm run build:all
```

---

## ▶️ Starting the Dashboard

### Every Time You Want to Use It

**Windows:**
```bash
cd C:\stackBrowserAgent
set JWT_SECRET=MySecurePassword123!
set NODE_ENV=production
npm start
```

**Mac/Linux:**
```bash
cd /path/to/stackBrowserAgent
export JWT_SECRET=MySecurePassword123!
export NODE_ENV=production
npm start
```

### Access Your Dashboard
Open browser → Go to: **http://localhost:3000**

---

## ⏹️ Stopping the Dashboard

1. Go to Command Prompt/Terminal window
2. Press: **Ctrl + C**
3. Type: **Y** (if asked)

---

## 🆘 Quick Fixes

| Problem | Solution |
|---------|----------|
| **"npm not found"** | Reinstall Node.js, restart terminal |
| **"Port in use"** | Change port: `set PORT=3001` |
| **Blank page** | Run: `npm run build:all` |
| **Errors on start** | Delete `node_modules`, run `npm install` |

---

## 📋 Daily Use Checklist

- [ ] Open Command Prompt/Terminal
- [ ] Run start commands
- [ ] Open http://localhost:3000
- [ ] Use the dashboard
- [ ] Press Ctrl+C when done

---

## 🔐 Security Notes

**✅ DO:**
- Use a strong JWT_SECRET (20+ characters)
- Set NODE_ENV=production
- Keep the secret private

**❌ DON'T:**
- Share your JWT_SECRET
- Use "password" or "123456" as secret
- Leave the server running when not in use

---

## 📱 Support Quick Links

- Health Check: http://localhost:3000/health
- Full Guide: `DEPLOYMENT_GUIDE_FOR_BUSINESS_USERS.md`
- Technical Docs: `UI_INTEGRATION_GUIDE.md`

---

## 💡 Pro Tips

**Bookmark This:**
- http://localhost:3000

**Keep Terminal Open:**
- Don't close the window while using dashboard
- Minimize it instead

**Auto-Start (Windows):**
1. Create file: `start.bat`
2. Add commands from "Starting" section
3. Double-click to run

---

**Version:** 1.0.0 | **Last Updated:** December 2024

© stackBrowserAgent - Enterprise Dashboard
