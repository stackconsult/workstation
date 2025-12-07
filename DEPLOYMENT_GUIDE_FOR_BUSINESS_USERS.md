# 🚀 Quick Start Deployment Guide for Business Users

**Welcome!** This guide will help you deploy and run the stackBrowserAgent Enterprise Dashboard in just a few simple steps. No technical background required!

---

## 📋 What You'll Get

After following this guide, you'll have a fully functional enterprise dashboard running on your computer with:
- 📊 Real-time metrics dashboard
- 🤖 Agent management interface
- ⚙️ Workflow automation tools
- 📈 System monitoring
- 🎨 Professional user interface

---

## ⚡ Quick Start (5 Minutes)

### Step 1: Install Required Software

**Download and install Node.js:**
1. Go to https://nodejs.org
2. Click the **green button** that says "Download Node.js (LTS)"
3. Run the downloaded installer
4. Click "Next" through all the installation steps
5. Verify installation:
   - Open **Command Prompt** (Windows) or **Terminal** (Mac)
   - Type: `node --version`
   - You should see something like `v18.17.0` or higher

### Step 2: Download the Application

**Option A: If you have the ZIP file**
1. Extract the ZIP file to a folder on your computer (e.g., `C:\stackBrowserAgent`)
2. Remember this location - you'll need it!

**Option B: If you have Git access**
1. Open Command Prompt or Terminal
2. Type: `git clone https://github.com/creditXcredit/workstation.git`
3. Type: `cd workstation`

### Step 3: Install the Application

1. Open Command Prompt (Windows) or Terminal (Mac)
2. Navigate to where you extracted/cloned the files:
   ```bash
   cd C:\stackBrowserAgent
   ```
   (Replace with your actual folder location)

3. Type this command and press Enter:
   ```bash
   npm install
   ```
   - This will take 2-3 minutes
   - You'll see lots of text scrolling - this is normal!
   - Wait until it says "added X packages" and returns to the prompt

### Step 4: Build the Application

Type these commands one at a time:

```bash
npm run build:all
```

- This takes about 1 minute
- You'll see "✓ built in X.XXs" when it's done

### Step 5: Start the Application

**Windows Users:**
```bash
set JWT_SECRET=MySecurePassword123!
set NODE_ENV=production
npm start
```

**Mac/Linux Users:**
```bash
export JWT_SECRET=MySecurePassword123!
export NODE_ENV=production
npm start
```

You'll see messages like:
```
✅ Server running on port 3000
📍 Environment: production
🏥 Health check: http://localhost:3000/health
```

### Step 6: Access Your Dashboard

1. Open your web browser (Chrome, Firefox, Safari, or Edge)
2. Go to: **http://localhost:3000**
3. You'll automatically be redirected to the dashboard!

**🎉 Congratulations! Your dashboard is now running!**

---

## 📖 Detailed Guide (For First-Time Users)

### What is localhost:3000?

- `localhost` means "this computer"
- `3000` is the port number (like an apartment number)
- Together they create a web address that only works on your computer
- Your data stays on your computer - nothing is sent to the internet

### Understanding the Dashboard

When you open http://localhost:3000, you'll see:

#### **Dashboard Home**
![Dashboard](https://github.com/user-attachments/assets/1408401e-71b7-406d-b715-1cc9dadf1584)

- **Active Agents**: Number of automation agents running
- **Running Workflows**: Active automation processes
- **Completed Today**: Tasks finished today
- **Success Rate**: Percentage of successful operations
- **System Health**: Server status and uptime
- **Quick Actions**: Buttons to create workflows and deploy agents

#### **Agents Page**
![Agents](https://github.com/user-attachments/assets/26ebd6c5-2346-4148-8827-64d033195a47)

Click "Agents" in the sidebar to:
- View all your automation agents
- Filter by Active or Inactive status
- Deploy new agents with the blue button

#### **Workflows Page**
![Workflows](https://github.com/user-attachments/assets/0b804807-e377-4fed-b19d-c06eaa1a43a0)

Click "Workflows" in the sidebar to:
- See all your automation workflows
- Filter by status (Active, Paused, Draft)
- Create new workflows with the blue button

---

## 🔧 Common Setup Scenarios

### Scenario 1: Running on Your Local Computer (Recommended for Testing)

**Perfect for:** Testing, learning, personal use

**Steps:** Follow the Quick Start guide above

**When to use:** 
- You want to try out the system
- You're working alone
- You don't need to share access with others

### Scenario 2: Running on a Dedicated Server

**Perfect for:** Team use, production environments

**Steps:**
1. Follow Steps 1-4 from the Quick Start guide
2. Instead of Step 5, use:
   ```bash
   # Set your secret (use a strong password!)
   export JWT_SECRET=YourVerySecurePasswordHere123!
   
   # Set to production
   export NODE_ENV=production
   
   # Set the port (default is 3000)
   export PORT=3000
   
   # Start the server
   npm start
   ```

3. Access from other computers using:
   - `http://[SERVER-IP-ADDRESS]:3000`
   - Replace `[SERVER-IP-ADDRESS]` with your server's IP

**Security Note:** Always use a strong JWT_SECRET in production!

### Scenario 3: Running in Development Mode (For Developers)

**Perfect for:** Making changes, testing features

**Steps:**
1. Follow Steps 1-3 from Quick Start
2. Instead of building, run:
   ```bash
   # Terminal 1: Start backend
   npm run dev
   
   # Terminal 2 (open a new terminal window): Start frontend
   npm run dev:ui
   ```

3. Access at: **http://localhost:5173**
   - Changes to code reload automatically
   - Backend runs on port 3000
   - Frontend runs on port 5173

---

## ⚙️ Configuration Options

### Environment Variables Explained

These are settings you can change before starting the server:

| Variable | What It Does | Example | Required? |
|----------|-------------|---------|-----------|
| `JWT_SECRET` | Password for security tokens | `MySecret123!` | ✅ Yes |
| `NODE_ENV` | Running mode | `production` or `development` | ✅ Yes |
| `PORT` | Web server port | `3000` | No (default: 3000) |
| `ALLOWED_ORIGINS` | Who can access (for security) | `http://example.com` | No |

**Setting Environment Variables:**

**Windows (Command Prompt):**
```bash
set VARIABLE_NAME=value
```

**Windows (PowerShell):**
```bash
$env:VARIABLE_NAME="value"
```

**Mac/Linux:**
```bash
export VARIABLE_NAME=value
```

---

## 🎯 Stopping and Restarting

### To Stop the Server

1. Go to the Command Prompt/Terminal window where the server is running
2. Press `Ctrl + C` (on both Windows and Mac)
3. Type `Y` if asked to confirm
4. The server stops immediately

### To Restart the Server

1. Just run the start command again:
   ```bash
   npm start
   ```

### Auto-Start on Computer Boot (Optional)

**Windows:**
1. Press `Win + R`
2. Type `shell:startup`
3. Create a new file called `start-dashboard.bat` with:
   ```batch
   @echo off
   cd C:\stackBrowserAgent
   set JWT_SECRET=YourSecretHere
   set NODE_ENV=production
   npm start
   ```

**Mac:**
1. Create a file called `start-dashboard.sh`:
   ```bash
   #!/bin/bash
   cd /path/to/stackBrowserAgent
   export JWT_SECRET=YourSecretHere
   export NODE_ENV=production
   npm start
   ```
2. Make it executable: `chmod +x start-dashboard.sh`
3. Add to Login Items in System Preferences

---

## 🆘 Troubleshooting

### Problem: "npm: command not found"

**Solution:** Node.js is not installed properly
1. Reinstall Node.js from https://nodejs.org
2. Restart your Command Prompt/Terminal
3. Try again

### Problem: "Port 3000 is already in use"

**Solution:** Another program is using port 3000
1. Option A: Stop the other program
2. Option B: Use a different port:
   ```bash
   export PORT=3001
   npm start
   ```
3. Access at: http://localhost:3001

### Problem: "Cannot find module..."

**Solution:** Packages not installed
1. Delete the `node_modules` folder
2. Run: `npm install`
3. Try starting again

### Problem: Dashboard shows errors or blank page

**Solution:** Build may have failed
1. Run: `npm run build:all`
2. Check for any error messages
3. Fix any errors shown
4. Restart the server

### Problem: "EACCES permission denied"

**Solution:** Need administrator permissions
- **Windows:** Run Command Prompt as Administrator
- **Mac/Linux:** Add `sudo` before npm commands

### Problem: Changes not appearing

**Solution:** Need to rebuild
1. Stop the server (`Ctrl + C`)
2. Run: `npm run build:all`
3. Start again: `npm start`

---

## 📞 Getting Help

### Check the Logs

The server prints helpful messages. Look for:
- ✅ Green checkmarks = Success
- ❌ Red X's = Errors
- ⚠️ Yellow warnings = Cautions

### Common Log Messages

**Good Signs:**
```
✅ Server running on port 3000
✅ Database initialized successfully
info: Server started
```

**Warning Signs:**
```
error: Failed to connect to database
error: Port already in use
FATAL: Unhandled exception
```

### Support Resources

1. **Documentation:**
   - `UI_INTEGRATION_GUIDE.md` - Technical details
   - `TASK_COMPLETION_UI_INTEGRATION.md` - Implementation notes

2. **Check System Status:**
   - Go to: http://localhost:3000/health
   - Should show: `{ "status": "healthy" }`

3. **View Logs:**
   - All messages appear in the Command Prompt/Terminal window
   - Save logs: `npm start > logs.txt 2>&1`

---

## 🔒 Security Best Practices

### For Business Use

1. **Always use a strong JWT_SECRET:**
   - ❌ Bad: `secret`, `password`, `123456`
   - ✅ Good: `MyC0mp@nySecure!Pass2024`
   - Use at least 20 characters
   - Mix uppercase, lowercase, numbers, symbols

2. **Don't share your JWT_SECRET:**
   - Keep it private like a password
   - Don't commit it to Git
   - Don't email it or share in chat

3. **Use HTTPS in production:**
   - Get an SSL certificate
   - Use a reverse proxy (like nginx)
   - Redirects HTTP to HTTPS

4. **Set ALLOWED_ORIGINS:**
   ```bash
   export ALLOWED_ORIGINS=https://yourdomain.com
   ```
   - Only allows access from your domain
   - Blocks unauthorized access

5. **Keep software updated:**
   ```bash
   npm outdated        # Check for updates
   npm update          # Update packages
   ```

---

## 📊 Performance Tips

### For Best Performance

1. **Allocate enough memory:**
   ```bash
   export NODE_OPTIONS="--max-old-space-size=4096"
   npm start
   ```
   - Gives Node.js 4GB of memory

2. **Use production mode:**
   - Always set `NODE_ENV=production`
   - Faster than development mode
   - Smaller bundle sizes

3. **Close unused browser tabs:**
   - Dashboard uses some memory
   - Close other tabs for best performance

4. **Restart periodically:**
   - Restart server once a week
   - Clears memory and temporary files
   - Keeps things running smoothly

---

## 🎓 Learning Resources

### Understanding the System

**What is Node.js?**
- JavaScript runtime for building web servers
- Like a kitchen for cooking web applications
- Handles all the behind-the-scenes work

**What is React?**
- Library for building user interfaces
- Creates the beautiful dashboard you see
- Updates automatically when data changes

**What is Express?**
- Web server framework for Node.js
- Handles web requests (like viewing pages)
- Connects the frontend to backend

### Next Steps

1. **Explore the Dashboard:**
   - Click around the interface
   - Try different pages
   - View metrics and data

2. **Create Your First Workflow:**
   - Click "Create Workflow" button
   - Follow the guided steps
   - Test your automation

3. **Deploy Your First Agent:**
   - Go to Agents page
   - Click "Deploy New Agent"
   - Follow the wizard

---

## ✅ Checklist for Successful Deployment

- [ ] Node.js installed (v18 or higher)
- [ ] Application files downloaded/extracted
- [ ] Dependencies installed (`npm install`)
- [ ] Application built (`npm run build:all`)
- [ ] JWT_SECRET set
- [ ] NODE_ENV set to production
- [ ] Server started (`npm start`)
- [ ] Dashboard accessible at http://localhost:3000
- [ ] All pages load correctly
- [ ] Metrics displaying properly

---

## 🎉 You're All Set!

Congratulations! You now have a fully functional enterprise dashboard running. 

**Remember:**
- Keep the Command Prompt/Terminal window open while using the dashboard
- Press `Ctrl + C` to stop the server
- Run `npm start` to start it again
- Bookmark http://localhost:3000 for easy access

**Need help?** Check the troubleshooting section or review the log messages in your terminal window.

**Happy automating!** 🚀
