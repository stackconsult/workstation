# 🤖 Gemini AI Integration - Business User Guide

**Turn natural language into browser automation workflows with Google's Gemini AI!**

---

## 🎯 What is This?

The Gemini integration lets you create browser automation workflows just by describing what you want to do in plain English. No coding required!

**Examples:**
- "Screenshot the homepage of hacker news"
- "Go to Google and search for AI news"
- "Scrape all headlines from reddit.com front page"

The AI understands your request and creates the automation workflow for you!

---

## 📋 Prerequisites

Before you start, you need:

1. ✅ **Workstation installed** (see [DEPLOYMENT_GUIDE_FOR_BUSINESS_USERS.md](../DEPLOYMENT_GUIDE_FOR_BUSINESS_USERS.md))
2. ✅ **Google Gemini API Key** (free to get - see below)

---

## 🔑 Getting Your Gemini API Key (5 Minutes)

### Step 1: Go to Google AI Studio
1. Open your web browser
2. Go to: **https://makersuite.google.com/app/apikey**
3. Sign in with your Google account (Gmail)

### Step 2: Create API Key
1. Click the blue **"Create API Key"** button
2. Choose **"Create API key in new project"**
3. Wait 5-10 seconds for the key to be created
4. Copy the key (it looks like: `AIzaSyC-xxxxxxxxxxxxxxxxxxxxx`)

### Step 3: Save Your Key Safely
- **DO NOT** share this key publicly
- **DO NOT** commit it to Git
- **DO** save it in a secure password manager or note

---

## ⚙️ Setup (2 Minutes)

### Option 1: Environment Variable (Recommended)

**Windows (Command Prompt):**
```bash
set GEMINI_API_KEY=AIzaSyC-your-actual-key-here
```

**Windows (PowerShell):**
```powershell
$env:GEMINI_API_KEY="AIzaSyC-your-actual-key-here"
```

**Mac/Linux:**
```bash
export GEMINI_API_KEY=AIzaSyC-your-actual-key-here
```

### Option 2: .env File (Permanent)

1. Find the `.env` file in your Workstation folder
2. If it doesn't exist, create one
3. Add this line:
```
GEMINI_API_KEY=AIzaSyC-your-actual-key-here
```
4. Save the file

### Option 3: Use the Example File

1. Find the file `.env.gemini.example`
2. Copy it to `.env` (or add contents to existing `.env`)
3. Replace `your_gemini_api_key_here` with your actual key
4. Save the file

---

## 🚀 Starting the System

### Step 1: Start the Server

**Windows:**
```bash
cd C:\stackBrowserAgent
set GEMINI_API_KEY=AIzaSyC-your-key-here
set NODE_ENV=production
npm start
```

**Mac/Linux:**
```bash
cd /path/to/stackBrowserAgent
export GEMINI_API_KEY=AIzaSyC-your-key-here
export NODE_ENV=production
npm start
```

### Step 2: Verify It's Running

You should see these messages:
```
✅ Server running on port 3000
✅ Gemini AI natural language workflow routes registered
```

### Step 3: Open the Gemini Dashboard

1. Open your web browser
2. Go to: **http://localhost:3000/gemini-dashboard.html**
3. You should see "Workstation + Gemini" with a purple gradient background

---

## 💬 Using the Gemini Dashboard

### The Interface

The dashboard has two main sections:

**Left Side - Chat:**
- Type what you want to automate
- View conversation history
- Quick example buttons

**Right Side - Workflow:**
- See the generated automation code
- Execute button to run it
- Save button to keep it
- Results display

### Step-by-Step Usage

#### 1. Type Your Request

In the chat input box, type what you want to do:
```
Screenshot the homepage of hacker news
```

Press **Send** (paper plane icon) or press **Enter**

#### 2. Wait for AI Response

- You'll see a typing animation (...)
- The AI processes your request
- A workflow appears on the right side
- The chat shows: "Workflow generated!" ✅

#### 3. Review the Workflow

The right panel shows the automation steps in JSON format:
```json
{
  "name": "Screenshot Hacker News",
  "description": "Take a screenshot of news.ycombinator.com",
  "tasks": [
    {
      "name": "navigate_to_site",
      "action": "navigate",
      "parameters": { "url": "https://news.ycombinator.com" }
    },
    {
      "name": "take_screenshot",
      "action": "screenshot",
      "parameters": { "fullPage": true }
    }
  ]
}
```

#### 4. Execute the Workflow

1. Click the green **"Execute"** button
2. The workflow runs automatically
3. You'll see: "Executing..." 
4. Wait for completion (usually 5-30 seconds)
5. Results appear in the "Result" section

#### 5. View Results

- Results are displayed with AI-generated formatting
- You can see:
  - Status (completed/failed)
  - Output data
  - Screenshots (if taken)
  - Scraped data (if applicable)

#### 6. Save for Later (Optional)

Click the **"Save"** button to:
- Store the workflow in your browser
- Reuse it later
- Build a library of workflows

---

## 🎨 Quick Start Examples

### Example 1: Simple Screenshot
```
Screenshot the homepage of hacker news
```

### Example 2: Google Search
```
Go to Google and search for latest AI news
```

### Example 3: Web Scraping
```
Scrape all headlines from reddit.com front page
```

### Example 4: Multi-Step Automation
```
Go to GitHub, search for "browser automation", and screenshot the results
```

### Example 5: Form Filling
```
Go to example.com, fill in the contact form with name "John" and email "john@example.com", and submit
```

---

## 🔧 Troubleshooting

### Problem: "Gemini API not configured"

**Solution:**
1. Check that you set the `GEMINI_API_KEY` environment variable
2. Restart the server after setting the variable
3. Verify the key is correct (no extra spaces)

### Problem: "Could not generate workflow"

**Possible Causes:**
- Request is too vague or unclear
- Gemini API is temporarily unavailable
- Network connectivity issues

**Solutions:**
1. Try rephrasing your request more specifically
2. Wait a minute and try again
3. Check your internet connection

### Problem: Workflow generates but execution fails

**Solutions:**
1. Check if the target website is accessible
2. Some websites block automation - this is normal
3. Try a different website or simpler task

### Problem: "Auth failed" or red status indicator

**Solutions:**
1. Check that the server is running
2. Refresh the page
3. Restart the server

---

## 💡 Tips for Best Results

### Writing Good Requests

**✅ Good Examples:**
- "Go to amazon.com and search for 'laptop'"
- "Screenshot the full page of wikipedia.org"
- "Get all links from bbc.com/news"

**❌ Avoid:**
- Vague requests: "do something"
- Complex multi-page flows (start simple)
- Requests involving login (authentication not supported yet)

### Understanding Limitations

**What Works Well:**
- Navigation to URLs
- Clicking buttons and links
- Typing into forms
- Taking screenshots
- Extracting text and data
- Waiting for elements

**What Doesn't Work:**
- File uploads/downloads
- Complex JavaScript interactions
- CAPTCHA solving
- Login/authentication flows
- Very long multi-step processes

---

## 📊 Understanding the Workflow JSON

The generated workflow uses this structure:

```json
{
  "name": "Workflow Name",           // What it does
  "description": "Details",          // How it works
  "tasks": [                         // Steps to execute
    {
      "name": "step_name",           // Step identifier
      "action": "navigate",          // Action type
      "parameters": {                // Action settings
        "url": "https://example.com"
      }
    }
  ]
}
```

**Common Actions:**
- `navigate` - Go to a URL
- `click` - Click an element
- `type` - Type text
- `screenshot` - Take a picture
- `getText` - Extract text
- `waitForSelector` - Wait for element

---

## 🔐 Security & Privacy

### Your Data

- Requests are sent to Google's Gemini API
- Google may log requests for service improvement
- Don't include sensitive information in requests
- Workflows execute on your local machine

### API Key Security

**DO:**
- Keep your API key private
- Use environment variables
- Rotate keys periodically

**DON'T:**
- Share keys publicly
- Commit keys to Git
- Use the same key across multiple projects

---

## 🆘 Getting Help

### Check Status

1. Open: **http://localhost:3000/api/gemini/status**
2. You should see:
```json
{
  "success": true,
  "configured": true,
  "model": "gemini-2.5-flash"
}
```

If `configured: false`, your API key isn't set correctly.

### View Logs

The server console shows detailed logs:
```
info: Gemini naturalLanguageToWorkflow called
info: Workflow generated successfully
```

### Test the API Directly

```bash
curl -X POST http://localhost:3000/api/gemini/natural-workflow \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Screenshot google.com"}'
```

---

## 📚 Related Documentation

- **[DEPLOYMENT_GUIDE_FOR_BUSINESS_USERS.md](../DEPLOYMENT_GUIDE_FOR_BUSINESS_USERS.md)** - Main setup guide
- **[docs/guides/GEMINI_INTEGRATION.md](../docs/guides/GEMINI_INTEGRATION.md)** - Technical details
- **[QUICK_START_CARD.md](../QUICK_START_CARD.md)** - Quick reference

---

## 🎓 Learning Path

### Beginner (Day 1)
1. Set up API key
2. Try the quick examples
3. Make simple one-step workflows

### Intermediate (Week 1)
1. Create multi-step workflows
2. Experiment with different websites
3. Save useful workflows

### Advanced (Month 1)
1. Combine with existing workflows
2. Create workflow templates
3. Build automation library

---

## ✅ Success Checklist

- [ ] Got Gemini API key
- [ ] Set environment variable
- [ ] Started server successfully
- [ ] Opened gemini-dashboard.html
- [ ] Tried a quick example
- [ ] Generated first workflow
- [ ] Executed successfully
- [ ] Saved a workflow

---

## 🌟 What's Next?

Once you're comfortable with Gemini workflows:

1. **Explore the Visual Builder** - `/workflow-builder.html`
2. **Learn the API** - Create workflows programmatically
3. **Schedule Workflows** - Run automations on a schedule
4. **Share Workflows** - Save and share with your team

---

**Happy Automating!** 🚀

*Last updated: December 2024*
