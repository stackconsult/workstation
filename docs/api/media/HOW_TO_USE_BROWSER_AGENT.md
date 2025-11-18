# 🤖 How to Use the Browser Agent

**Quick Navigation:**
- [What is it?](#what-is-it)
- [5-Minute Quick Start](#5-minute-quick-start)
- [API Usage](#api-usage)
- [Web UI Usage](#web-ui-usage)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)

---

## What is it?

The Browser Agent is a **Playwright-powered automation engine** that lets you control web browsers programmatically through a simple REST API or web interface.

**Location in Code:** `src/automation/agents/core/browser.ts`

**7 Powerful Actions:**
1. `navigate` - Go to any URL
2. `click` - Click on elements
3. `type` - Fill in forms
4. `getText` - Extract text from pages
5. `screenshot` - Capture screenshots
6. `getContent` - Get full page HTML
7. `evaluate` - Run custom JavaScript

---

## 5-Minute Quick Start

### Step 1: Start the Server (30 seconds)

```bash
# From the repository root
npm install        # Install dependencies (first time only)
npm run dev        # Start the server

# Server will start at: http://localhost:3000
```

You should see:
```
✅ Server running on port 3000
📍 Environment: development
🏥 Health check: http://localhost:3000/health
🔑 Demo token: http://localhost:3000/auth/demo-token
```

### Step 2: Get an Authentication Token (10 seconds)

```bash
# In a new terminal
curl http://localhost:3000/auth/demo-token

# Copy the token from the response
```

### Step 3: Create Your First Browser Automation (30 seconds)

```bash
# Replace YOUR_TOKEN with the token from Step 2
curl -X POST http://localhost:3000/api/v2/workflows \
  -H "Authorization: ******" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My First Automation",
    "owner_id": "me",
    "definition": {
      "tasks": [
        {
          "name": "Visit Example.com",
          "agent_type": "browser",
          "action": "navigate",
          "config": {
            "url": "https://example.com"
          }
        },
        {
          "name": "Take Screenshot",
          "agent_type": "browser",
          "action": "screenshot",
          "config": {
            "path": "./screenshot.png"
          }
        }
      ]
    }
  }'

# Save the workflow ID from the response
```

### Step 4: Run Your Automation (10 seconds)

```bash
# Replace WORKFLOW_ID with the ID from Step 3
curl -X POST "http://localhost:3000/api/v2/workflows/WORKFLOW_ID/execute" \
  -H "Authorization: ******" \
  -H "Content-Type: application/json" \
  -d '{}'

# Your browser automation is now running!
```

**🎉 Done! You just automated a browser in 5 minutes.**

---

## API Usage

### Complete API Workflow

```bash
# 1. Get authentication token
TOKEN=$(curl -s http://localhost:3000/auth/demo-token | jq -r .token)

# 2. Create a workflow
WORKFLOW=$(curl -s -X POST http://localhost:3000/api/v2/workflows \
  -H "Authorization: ******" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Data Extraction",
    "owner_id": "automation-user",
    "definition": {
      "tasks": [
        {
          "name": "Navigate to target site",
          "agent_type": "browser",
          "action": "navigate",
          "config": {"url": "https://quotes.toscrape.com"}
        },
        {
          "name": "Extract quote text",
          "agent_type": "browser",
          "action": "getText",
          "config": {"selector": ".quote .text"}
        }
      ]
    }
  }')

WORKFLOW_ID=$(echo $WORKFLOW | jq -r '.data.id')
echo "Workflow created: $WORKFLOW_ID"

# 3. Execute the workflow
EXECUTION=$(curl -s -X POST "http://localhost:3000/api/v2/workflows/$WORKFLOW_ID/execute" \
  -H "Authorization: ******" \
  -H "Content-Type: application/json" \
  -d '{}')

EXECUTION_ID=$(echo $EXECUTION | jq -r '.data.id')
echo "Execution started: $EXECUTION_ID"

# 4. Check execution status
sleep 3
curl -s "http://localhost:3000/api/v2/executions/$EXECUTION_ID" \
  -H "Authorization: ******" | jq '.'

# 5. Get execution tasks
curl -s "http://localhost:3000/api/v2/executions/$EXECUTION_ID/tasks" \
  -H "Authorization: ******" | jq '.'
```

### Available API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Check server health |
| GET | `/auth/demo-token` | Get test token |
| POST | `/api/v2/workflows` | Create workflow |
| GET | `/api/v2/workflows` | List workflows |
| GET | `/api/v2/workflows/:id` | Get workflow |
| POST | `/api/v2/workflows/:id/execute` | Execute workflow |
| GET | `/api/v2/executions/:id` | Get execution status |
| GET | `/api/v2/executions/:id/tasks` | Get execution tasks |

---

## Web UI Usage

### Option 1: Simple Dashboard (Recommended for Beginners)

**File Location:** `docs/index.html`

**How to Use:**

```bash
# Method 1: Open directly in browser
open docs/index.html  # macOS
xdg-open docs/index.html  # Linux
start docs/index.html  # Windows

# Method 2: Serve with Python
cd docs
python3 -m http.server 8080
# Visit: http://localhost:8080

# Method 3: Serve with Node
npx http-server docs -p 8080
# Visit: http://localhost:8080
```

**Features:**
- 🏥 Health monitoring
- 🔑 Token management
- 🧪 API endpoint testing
- 📖 Interactive documentation

### Option 2: Advanced Control Center

**File Location:** `docs/workstation-control-center.html`

**Features:**
- 🤖 Full agent system monitoring
- 📊 Real-time analytics
- 🔄 Workflow orchestration
- ⚙️ Advanced settings

**Use the same serving methods as above**

---

## Examples

### Example 1: Web Scraping

```bash
curl -X POST http://localhost:3000/api/v2/workflows \
  -H "Authorization: ******" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Scrape Quotes",
    "owner_id": "me",
    "definition": {
      "tasks": [
        {
          "name": "Navigate to quotes site",
          "agent_type": "browser",
          "action": "navigate",
          "config": {"url": "https://quotes.toscrape.com"}
        },
        {
          "name": "Get all quotes",
          "agent_type": "browser",
          "action": "getText",
          "config": {"selector": ".quote"}
        },
        {
          "name": "Save page content",
          "agent_type": "browser",
          "action": "getContent",
          "config": {}
        }
      ]
    }
  }'
```

### Example 2: Form Automation

```bash
curl -X POST http://localhost:3000/api/v2/workflows \
  -H "Authorization: ******" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Fill Contact Form",
    "owner_id": "me",
    "definition": {
      "tasks": [
        {
          "name": "Go to form",
          "agent_type": "browser",
          "action": "navigate",
          "config": {"url": "https://example.com/contact"}
        },
        {
          "name": "Fill name field",
          "agent_type": "browser",
          "action": "type",
          "config": {
            "selector": "#name",
            "text": "John Doe"
          }
        },
        {
          "name": "Fill email field",
          "agent_type": "browser",
          "action": "type",
          "config": {
            "selector": "#email",
            "text": "john@example.com"
          }
        },
        {
          "name": "Click submit",
          "agent_type": "browser",
          "action": "click",
          "config": {"selector": "button[type=submit]"}
        },
        {
          "name": "Capture result",
          "agent_type": "browser",
          "action": "screenshot",
          "config": {"path": "./form-submitted.png"}
        }
      ]
    }
  }'
```

### Example 3: Custom JavaScript Execution

```bash
curl -X POST http://localhost:3000/api/v2/workflows \
  -H "Authorization: ******" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Run Custom Script",
    "owner_id": "me",
    "definition": {
      "tasks": [
        {
          "name": "Navigate",
          "agent_type": "browser",
          "action": "navigate",
          "config": {"url": "https://example.com"}
        },
        {
          "name": "Execute custom JS",
          "agent_type": "browser",
          "action": "evaluate",
          "config": {
            "script": "document.querySelectorAll('a').length"
          }
        }
      ]
    }
  }'
```

---

## Troubleshooting

### Problem: Server won't start

**Solution:**
```bash
# Check if port 3000 is already in use
lsof -i :3000

# Use a different port
PORT=3001 npm run dev
```

### Problem: "Playwright browser not found"

**Solution:**
```bash
# Install Playwright browsers
npx playwright install chromium
```

### Problem: "Authentication failed"

**Solution:**
```bash
# Make sure you're using the correct token
TOKEN=$(curl -s http://localhost:3000/auth/demo-token | jq -r .token)
echo $TOKEN

# Use it in your requests
curl -H "Authorization: ******" http://localhost:3000/api/v2/workflows
```

### Problem: Workflow creation fails

**Solution:**
- Check that `definition` has a `tasks` array
- Ensure `owner_id` is provided
- Verify JSON syntax is correct

**Correct format:**
```json
{
  "name": "My Workflow",
  "owner_id": "user-id",
  "definition": {
    "tasks": [...]
  }
}
```

### Problem: Can't find the browser agent code

**Locations:**
- **Main Agent:** `src/automation/agents/core/browser.ts`
- **Agent Registry:** `src/automation/agents/core/registry.ts`
- **Workflow Service:** `src/automation/workflow/service.ts`
- **Orchestration Engine:** `src/automation/orchestrator/engine.ts`

---

## Additional Resources

- **Full API Documentation:** See [API.md](./API.md)
- **Architecture Overview:** See [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Phase 1 Details:** See [PHASE1_COMPLETE.md](./PHASE1_COMPLETE.md)
- **More Examples:** See [examples/workflows/](./examples/workflows/)

---

## Need More Help?

1. **Check server logs** when running `npm run dev`
2. **Review test files** in `tests/` for more examples
3. **Open GitHub issue** for bugs or feature requests
4. **Check documentation** in the `docs/` folder

---

**Quick Links:**
- 📂 [Browser Agent Source Code](./src/automation/agents/core/browser.ts)
- 🌐 [Simple Web UI](./docs/index.html)
- 🎮 [Advanced Control Center](./docs/workstation-control-center.html)
- 📖 [Full Documentation](./README.md)

**Happy Automating! 🚀**
