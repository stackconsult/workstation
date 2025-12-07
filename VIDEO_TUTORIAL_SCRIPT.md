# 🎥 Video Tutorial Script - Dashboard Setup

**Duration:** 10 minutes | **Difficulty:** Beginner | **Audience:** Business Professionals

---

## 📹 Scene 1: Introduction (30 seconds)

**[Show: Title Screen with Dashboard Screenshots]**

**Narrator:**
"Welcome! In the next 10 minutes, you'll learn how to deploy and run the stackBrowserAgent Enterprise Dashboard on your computer. No technical background needed - just follow along step by step."

**[Show: Preview of final dashboard running]**

"By the end of this video, you'll have a fully functional dashboard with real-time metrics, agent management, and workflow automation tools."

---

## 📹 Scene 2: Prerequisites (1 minute)

**[Show: Node.js website on screen]**

**Narrator:**
"First, we need to install Node.js. Think of Node.js as the engine that powers our dashboard."

**[Show: Clicking download button]**

"Step 1: Open your browser and go to nodejs.org"

**[Highlight: Green LTS download button]**

"Step 2: Click the green button that says 'Download Node.js LTS'"

**[Show: Installation wizard]**

"Step 3: Run the downloaded file and click 'Next' through all the steps"

**[Show: Installation complete screen]**

"That's it! Node.js is now installed."

---

## 📹 Scene 3: Getting the Application (1 minute)

**[Show: Windows Explorer / Finder]**

**Narrator:**
"Next, let's get the application files."

**[Show: ZIP file being extracted]**

"If you have a ZIP file: Right-click it, choose 'Extract All', and save it to a folder like C:\stackBrowserAgent"

**[Alternative: Show Git clone]**

"Or, if you're using Git: Open Command Prompt and type..."

**[Text on screen: git clone [repository-url]]**

"...git clone, then the repository URL."

**[Show: Files extracted successfully]**

"Perfect! Now we have all the files we need."

---

## 📹 Scene 4: Opening Command Prompt (1 minute)

**[Show: Windows Start Menu]**

**Narrator:**
"Now we'll open Command Prompt - this is where we'll run our setup commands."

**[Show: Pressing Win + R]**

"On Windows: Press the Windows key and R together"

**[Show: Run dialog]**

"Type 'cmd' and press Enter"

**[Show: Command Prompt opening]**

"This black window is your Command Prompt"

**[Show: Mac Terminal for Mac users]**

"On Mac: Press Command and Spacebar, type 'terminal', and press Enter"

---

## 📹 Scene 5: Navigating to the Folder (1 minute)

**[Show: Command Prompt with cursor]**

**Narrator:**
"First, we need to navigate to where we saved our files."

**[Type on screen: cd C:\stackBrowserAgent]**

"Type 'cd' followed by the path to your folder"

**[Press Enter]**

"Press Enter"

**[Show: Prompt changes to show new folder]**

"Great! You'll see the prompt change to show you're in the right folder."

**[Pause and show command clearly]**

"If you're not sure where your files are, right-click the folder in Windows Explorer and choose 'Copy as Path', then paste it here."

---

## 📹 Scene 6: Installing Dependencies (2 minutes)

**[Show: Command Prompt ready for input]**

**Narrator:**
"Now let's install the necessary packages. This is like gathering all the ingredients before cooking."

**[Type on screen: npm install]**

"Type: npm install"

**[Press Enter]**

"And press Enter"

**[Show: Installation progress with scrolling text]**

"You'll see lots of text scrolling by - this is completely normal! The computer is downloading and installing packages."

**[Show: Progress bar or percentage]**

"This takes about 2-3 minutes, so let's talk about what's happening..."

**[Overlay graphic: Packages being downloaded]**

"npm is downloading all the components needed to run the dashboard - think of it like automatically installing all the apps you need."

**[Show: "added X packages" message]**

"When you see 'added X packages' and the prompt returns, installation is complete!"

---

## 📹 Scene 7: Building the Application (1.5 minutes)

**[Show: Command Prompt with cursor]**

**Narrator:**
"Next, we need to build the application. This converts the source code into a format ready to run."

**[Type on screen: npm run build:all]**

"Type: npm run build:all"

**[Press Enter]**

"And press Enter"

**[Show: Build progress]**

"You'll see messages about compiling TypeScript and building the user interface."

**[Split screen: Backend build on left, UI build on right]**

"The system is building two parts: the backend server and the frontend dashboard interface."

**[Show: Success messages]**

"Watch for checkmarks and 'built in X seconds' messages - these mean success!"

**[Show: Final build complete message]**

"Perfect! Our application is now built and ready to run."

---

## 📹 Scene 8: Starting the Server (2 minutes)

**[Show: Command Prompt ready]**

**Narrator:**
"Now for the exciting part - starting the dashboard!"

**[Show: Security warning box]**

"Important! We need to set a security password first. This keeps your dashboard secure."

**[Type on screen: set JWT_SECRET=MySecurePassword123!]**

"On Windows, type: set JWT_SECRET equals your secure password"

**[Type on screen: export JWT_SECRET=MySecurePassword123!]**

"On Mac or Linux, type: export JWT_SECRET equals your secure password"

**[Highlight the password part]**

"Use a strong password - mix uppercase, lowercase, numbers, and symbols. Don't use simple passwords like '123456'!"

**[Type on screen: set NODE_ENV=production]**

"Next, type: set NODE_ENV equals production"

**[Type on screen: npm start]**

"Finally, type: npm start"

**[Show: Server starting messages]**

"The server is now starting! Watch for these messages..."

**[Highlight key messages:]**
- ✅ Server running on port 3000
- ✅ Database initialized  
- ✅ Phase 1-6 initialized

**[Show: All green checkmarks]**

"When you see these green checkmarks, you're ready to go!"

---

## 📹 Scene 9: Accessing the Dashboard (1.5 minutes)

**[Show: Chrome browser opening]**

**Narrator:**
"Now let's access your dashboard! Open your favorite web browser."

**[Type in address bar: localhost:3000]**

"In the address bar, type: localhost:3000"

**[Press Enter]**

"And press Enter"

**[Show: Automatic redirect to /dashboard]**

"You'll automatically be redirected to the dashboard"

**[Show: Dashboard loading with animation]**

"And there it is! Your Enterprise Dashboard is now running!"

**[Tour of dashboard - highlight each section:]**

**[Point to metrics cards]**
"Here you see real-time metrics: Active Agents, Running Workflows, Completed Tasks, and Success Rate"

**[Point to System Health]**
"System Health shows your server status and uptime"

**[Point to Recent Activity]**
"Recent Activity will show your latest actions"

**[Point to Quick Actions]**
"And Quick Actions let you create workflows and deploy agents with one click"

**[Click on sidebar]**

"Use the sidebar to navigate between Agents, Workflows, Monitoring, and Settings pages"

---

## 📹 Scene 10: Testing the Interface (1 minute)

**[Show: Clicking on Agents page]**

**Narrator:**
"Let's explore the interface. Click on 'Agents'..."

**[Show: Agents page loading]**

"Here you can manage all your automation agents"

**[Show: Filter buttons]**

"Filter by All, Active, or Inactive status"

**[Show: Deploy button]**

"And deploy new agents with this blue button"

**[Click on Workflows]**

"Click on 'Workflows'..."

**[Show: Workflows page]**

"This is where you create and manage automation workflows"

**[Show: Create Workflow button]**

"Start creating your first workflow by clicking here"

**[Show: Dark mode toggle]**

"Bonus tip: Toggle dark mode on and off with this button!"

---

## 📹 Scene 11: Stopping the Server (30 seconds)

**[Show: Command Prompt window]**

**Narrator:**
"When you're done using the dashboard, here's how to stop it safely."

**[Show: Cursor in Command Prompt]**

"Go back to your Command Prompt or Terminal window"

**[Show: Pressing Ctrl + C]**

"Press Control and C together"

**[Show: Confirmation prompt]**

"If asked 'Terminate batch job?', type Y and press Enter"

**[Show: Server stopped message]**

"The server stops immediately, and you can close the window."

---

## 📹 Scene 12: Troubleshooting Tips (1 minute)

**[Show: Common issues checklist]**

**Narrator:**
"Here are quick fixes for common issues:"

**[Show each problem/solution:]**

**Problem 1:**
"If you see 'npm not found': Reinstall Node.js and restart your Command Prompt"

**Problem 2:**
"If you see 'port already in use': Change the port by typing set PORT=3001 before npm start"

**Problem 3:**
"If the dashboard shows a blank page: Run npm run build:all again"

**Problem 4:**
"If you see module errors: Delete the node_modules folder and run npm install again"

**[Show: Health check URL]**

"You can always check system health at: localhost:3000/health"

---

## 📹 Scene 13: Wrap Up (30 seconds)

**[Show: Dashboard running successfully]**

**Narrator:**
"Congratulations! You've successfully deployed the stackBrowserAgent Enterprise Dashboard!"

**[Show recap checklist:]**
✅ Installed Node.js
✅ Downloaded the application
✅ Installed dependencies
✅ Built the application
✅ Started the server
✅ Accessed the dashboard

**[Show: Documentation files]**

"For more detailed information, check out these guides in your installation folder:
- DEPLOYMENT_GUIDE_FOR_BUSINESS_USERS.md
- QUICK_START_CARD.md
- UI_INTEGRATION_GUIDE.md"

**[Show: Final dashboard screenshot]**

"Happy automating! Remember: keep your Command Prompt window open while using the dashboard, and press Ctrl+C to stop when you're done."

**[Show: End screen with support information]**

"Thanks for watching! Bookmark localhost:3000 for easy access next time."

---

## 📝 Post-Production Notes

**Add These Visual Elements:**
- ✅ Checkmark animations for completed steps
- 🎯 Arrow pointers to highlight UI elements
- 📋 Text overlays for important commands
- ⚠️ Warning icons for security notes
- 🎨 Smooth transitions between scenes
- 🔊 Background music (subtle, professional)

**Screen Recording Tips:**
- Use 1920x1080 resolution
- Record at 30fps minimum
- Show mouse cursor clearly
- Zoom in on small text
- Pause between major steps
- Add captions for accessibility

**Voice-Over Tips:**
- Speak clearly and slowly
- Use a friendly, encouraging tone
- Pause after each command
- Emphasize important steps
- Repeat complex commands twice

---

## 🎬 Alternative: Screenshot Tutorial

If video isn't possible, convert this script to a screenshot-based tutorial with:
1. One screenshot per major step
2. Red arrows pointing to relevant UI elements
3. Command boxes with copy-paste commands
4. Green checkmarks for completed steps
5. Warning boxes for important notes

---

**Production Time Estimate:**
- Recording: 2-3 hours
- Editing: 4-6 hours
- Total: 6-9 hours

**Required Tools:**
- Screen recording software (OBS Studio, Camtasia)
- Video editing software (DaVinci Resolve, Adobe Premiere)
- Microphone for voice-over
- Graphics software for overlays (Canva, Figma)
