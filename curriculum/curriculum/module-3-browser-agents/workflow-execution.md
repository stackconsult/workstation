# Workflow Execution - Module 3

## Overview

Learn to build sophisticated multi-step browser automation workflows by chaining actions, passing data between tasks, and handling complex user interactions.

## What is a Workflow?

A **workflow** is a sequence of browser actions that automate a complete user journey. Each workflow consists of:
- **Tasks**: Individual browser actions (navigate, click, type, etc.)
- **Parameters**: Configuration for each task
- **State**: Data passed between tasks
- **Error Handling**: Retry and recovery logic

## Workflow Structure

### Basic Workflow JSON

```json
{
  "name": "Login and Screenshot",
  "description": "Automated login flow with screenshot",
  "definition": {
    "tasks": [
      {
        "name": "navigate_to_login",
        "agent_type": "browser",
        "action": "navigate",
        "parameters": {
          "url": "https://example.com/login"
        }
      },
      {
        "name": "enter_username",
        "agent_type": "browser",
        "action": "type",
        "parameters": {
          "selector": "#username",
          "text": "user@example.com"
        }
      },
      {
        "name": "enter_password",
        "agent_type": "browser",
        "action": "type",
        "parameters": {
          "selector": "#password",
          "text": "secure_password"
        }
      },
      {
        "name": "click_login",
        "agent_type": "browser",
        "action": "click",
        "parameters": {
          "selector": "button[type='submit']"
        }
      },
      {
        "name": "capture_dashboard",
        "agent_type": "browser",
        "action": "screenshot",
        "parameters": {
          "fullPage": true
        }
      }
    ]
  }
}
```

## Creating Workflows via API

### POST to Workflows Endpoint

```bash
TOKEN=$(curl -s http://localhost:3000/auth/demo-token | jq -r '.token')

curl -X POST http://localhost:3000/api/v2/workflows \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @workflow.json
```

### Response

```json
{
  "id": "wf-abc123",
  "name": "Login and Screenshot",
  "status": "pending",
  "created_at": "2024-11-19T17:00:00.000Z",
  "updated_at": "2024-11-19T17:00:00.000Z"
}
```

## Executing Workflows

### Start Execution

```bash
curl -X POST http://localhost:3000/api/v2/workflows/wf-abc123/execute \
  -H "Authorization: Bearer $TOKEN"
```

### Check Status

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v2/workflows/wf-abc123
```

### Response with Progress

```json
{
  "id": "wf-abc123",
  "name": "Login and Screenshot",
  "status": "running",
  "progress": {
    "total_tasks": 5,
    "completed_tasks": 3,
    "current_task": "click_login",
    "percentage": 60
  },
  "results": [
    {
      "task": "navigate_to_login",
      "status": "completed",
      "result": {"url": "https://example.com/login"}
    },
    {
      "task": "enter_username",
      "status": "completed",
      "result": {"typed": true}
    },
    {
      "task": "enter_password",
      "status": "completed",
      "result": {"typed": true}
    }
  ]
}
```

## Advanced Workflow Patterns

### 1. Data Extraction Workflow

Extract structured data from multiple pages:

```json
{
  "name": "Product Scraper",
  "description": "Extract product data from listing pages",
  "definition": {
    "tasks": [
      {
        "name": "navigate_to_catalog",
        "agent_type": "browser",
        "action": "navigate",
        "parameters": {
          "url": "https://example.com/products"
        }
      },
      {
        "name": "get_product_links",
        "agent_type": "browser",
        "action": "evaluate",
        "parameters": {
          "script": "Array.from(document.querySelectorAll('.product-link')).map(a => a.href)"
        }
      },
      {
        "name": "extract_first_product",
        "agent_type": "browser",
        "action": "navigate",
        "parameters": {
          "url": "${get_product_links.result[0]}"
        }
      },
      {
        "name": "get_product_title",
        "agent_type": "browser",
        "action": "getText",
        "parameters": {
          "selector": "h1.product-title"
        }
      },
      {
        "name": "get_product_price",
        "agent_type": "browser",
        "action": "getText",
        "parameters": {
          "selector": ".price"
        }
      },
      {
        "name": "get_product_description",
        "agent_type": "browser",
        "action": "getText",
        "parameters": {
          "selector": ".description"
        }
      }
    ]
  }
}
```

**Business Value:**
- Agencies: Deliver automated competitor analysis
- Founders: Power product comparison features
- Platform Engineers: Feed data pipelines

### 2. Form Automation Workflow

Complete multi-step forms:

```json
{
  "name": "Registration Flow",
  "description": "Automated user registration",
  "definition": {
    "tasks": [
      {
        "name": "navigate",
        "agent_type": "browser",
        "action": "navigate",
        "parameters": {
          "url": "https://example.com/signup"
        }
      },
      {
        "name": "fill_email",
        "agent_type": "browser",
        "action": "type",
        "parameters": {
          "selector": "#email",
          "text": "${user_email}"
        }
      },
      {
        "name": "fill_password",
        "agent_type": "browser",
        "action": "type",
        "parameters": {
          "selector": "#password",
          "text": "${user_password}"
        }
      },
      {
        "name": "fill_confirm_password",
        "agent_type": "browser",
        "action": "type",
        "parameters": {
          "selector": "#confirm_password",
          "text": "${user_password}"
        }
      },
      {
        "name": "accept_terms",
        "agent_type": "browser",
        "action": "click",
        "parameters": {
          "selector": "#terms_checkbox"
        }
      },
      {
        "name": "submit_form",
        "agent_type": "browser",
        "action": "click",
        "parameters": {
          "selector": "button[type='submit']"
        }
      },
      {
        "name": "verify_success",
        "agent_type": "browser",
        "action": "getText",
        "parameters": {
          "selector": ".success-message"
        }
      }
    ]
  }
}
```

### 3. Monitoring Workflow

Track website changes:

```json
{
  "name": "Price Monitor",
  "description": "Check product price every hour",
  "trigger": {
    "type": "cron",
    "schedule": "0 * * * *"
  },
  "definition": {
    "tasks": [
      {
        "name": "navigate",
        "agent_type": "browser",
        "action": "navigate",
        "parameters": {
          "url": "https://example.com/product/123"
        }
      },
      {
        "name": "get_current_price",
        "agent_type": "browser",
        "action": "getText",
        "parameters": {
          "selector": ".price"
        }
      },
      {
        "name": "take_screenshot",
        "agent_type": "browser",
        "action": "screenshot",
        "parameters": {
          "selector": ".product-card",
          "fullPage": false
        }
      }
    ],
    "notifications": [
      {
        "condition": "price_changed",
        "slack_webhook": "${SLACK_WEBHOOK_URL}",
        "message": "Price changed to ${get_current_price.result}"
      }
    ]
  }
}
```

## Variable Substitution

### Parameter Variables

Pass data between tasks using `${}` syntax:

```json
{
  "name": "task_2",
  "parameters": {
    "text": "${task_1.result.value}"
  }
}
```

### Environment Variables

Use secrets and configuration:

```json
{
  "parameters": {
    "apiKey": "${env.API_KEY}",
    "webhookUrl": "${env.SLACK_WEBHOOK}"
  }
}
```

### Runtime Variables

Access workflow metadata:

```json
{
  "parameters": {
    "timestamp": "${workflow.started_at}",
    "workflow_id": "${workflow.id}"
  }
}
```

## Task Dependencies

### Sequential Execution (Default)

Tasks run in order, each waits for previous to complete:

```json
{
  "tasks": [
    {"name": "task_1", "action": "navigate"},
    {"name": "task_2", "action": "click"},
    {"name": "task_3", "action": "screenshot"}
  ]
}
```

### Conditional Execution (Future)

Execute tasks based on conditions:

```json
{
  "name": "conditional_task",
  "condition": "${previous_task.result.success} === true",
  "action": "click"
}
```

### Parallel Execution (Future)

Run independent tasks simultaneously:

```json
{
  "tasks": [
    {
      "name": "parallel_group",
      "parallel": true,
      "tasks": [
        {"name": "screenshot_1", "action": "screenshot"},
        {"name": "screenshot_2", "action": "screenshot"},
        {"name": "screenshot_3", "action": "screenshot"}
      ]
    }
  ]
}
```

## Error Handling in Workflows

### Retry Configuration

```json
{
  "name": "retry_task",
  "agent_type": "browser",
  "action": "navigate",
  "parameters": {
    "url": "https://example.com"
  },
  "retry": {
    "max_attempts": 3,
    "backoff": "exponential",
    "initial_delay": 1000,
    "max_delay": 10000
  }
}
```

### Error Recovery

```json
{
  "error_handling": {
    "on_error": "continue",
    "fallback_tasks": [
      {
        "name": "log_error",
        "agent_type": "logging",
        "action": "log",
        "parameters": {
          "level": "error",
          "message": "Workflow failed at ${failed_task.name}"
        }
      }
    ]
  }
}
```

## Workflow Templates

### E-Commerce Checkout Flow

```json
{
  "name": "Checkout Flow",
  "parameters": {
    "product_url": "string",
    "quantity": "number",
    "shipping_address": "object",
    "payment_info": "object"
  },
  "definition": {
    "tasks": [
      {"name": "navigate", "action": "navigate"},
      {"name": "add_to_cart", "action": "click"},
      {"name": "proceed_to_checkout", "action": "click"},
      {"name": "fill_shipping", "action": "type"},
      {"name": "fill_payment", "action": "type"},
      {"name": "complete_order", "action": "click"},
      {"name": "capture_confirmation", "action": "screenshot"}
    ]
  }
}
```

### Social Media Posting

```json
{
  "name": "Social Media Post",
  "parameters": {
    "platform": "string",
    "content": "string",
    "images": "array"
  },
  "definition": {
    "tasks": [
      {"name": "login", "action": "navigate"},
      {"name": "authenticate", "action": "type"},
      {"name": "open_composer", "action": "click"},
      {"name": "enter_content", "action": "type"},
      {"name": "upload_images", "action": "type"},
      {"name": "publish", "action": "click"}
    ]
  }
}
```

### Lead Generation

```json
{
  "name": "Lead Scraper",
  "parameters": {
    "search_query": "string",
    "max_results": "number"
  },
  "definition": {
    "tasks": [
      {"name": "search", "action": "navigate"},
      {"name": "enter_query", "action": "type"},
      {"name": "submit_search", "action": "click"},
      {"name": "extract_results", "action": "evaluate"},
      {"name": "visit_each_result", "action": "navigate"},
      {"name": "extract_contact_info", "action": "getText"}
    ]
  }
}
```

## Real-World Examples

### Example 1: Automated Testing

```typescript
// File: examples/workflows/e2e-testing.json
{
  "name": "E2E Login Test",
  "description": "Verify login flow works correctly",
  "definition": {
    "tasks": [
      {
        "name": "navigate_to_app",
        "agent_type": "browser",
        "action": "navigate",
        "parameters": {"url": "https://app.example.com"}
      },
      {
        "name": "click_login_button",
        "agent_type": "browser",
        "action": "click",
        "parameters": {"selector": ".login-btn"}
      },
      {
        "name": "enter_credentials",
        "agent_type": "browser",
        "action": "type",
        "parameters": {
          "selector": "#email",
          "text": "test@example.com"
        }
      },
      {
        "name": "submit",
        "agent_type": "browser",
        "action": "click",
        "parameters": {"selector": "button[type='submit']"}
      },
      {
        "name": "verify_dashboard",
        "agent_type": "browser",
        "action": "getText",
        "parameters": {"selector": ".dashboard-title"}
      },
      {
        "name": "assert_success",
        "agent_type": "browser",
        "action": "evaluate",
        "parameters": {
          "script": "document.querySelector('.dashboard-title').textContent === 'Dashboard'"
        }
      }
    ]
  }
}
```

**Use Case:** Continuous E2E testing in CI/CD pipeline

### Example 2: Competitive Intelligence

```typescript
// File: examples/workflows/competitor-analysis.json
{
  "name": "Competitor Pricing Scraper",
  "description": "Daily price comparison",
  "trigger": {
    "type": "cron",
    "schedule": "0 9 * * *"
  },
  "definition": {
    "tasks": [
      {
        "name": "scrape_competitor_a",
        "agent_type": "browser",
        "action": "navigate",
        "parameters": {"url": "https://competitor-a.com/pricing"}
      },
      {
        "name": "extract_prices_a",
        "agent_type": "browser",
        "action": "evaluate",
        "parameters": {
          "script": "Array.from(document.querySelectorAll('.price')).map(p => p.textContent)"
        }
      },
      {
        "name": "scrape_competitor_b",
        "agent_type": "browser",
        "action": "navigate",
        "parameters": {"url": "https://competitor-b.com/pricing"}
      },
      {
        "name": "extract_prices_b",
        "agent_type": "browser",
        "action": "evaluate",
        "parameters": {
          "script": "Array.from(document.querySelectorAll('.price')).map(p => p.textContent)"
        }
      }
    ]
  }
}
```

**Business Value:** 
- Save 10+ hours/week on manual price tracking
- Enable dynamic pricing strategies
- Identify market opportunities faster

## Workflow Best Practices

### 1. Keep Tasks Atomic

Each task should do one thing:

✅ **Good:**
```json
{"name": "click_submit", "action": "click", "parameters": {"selector": "#submit"}}
```

❌ **Bad:**
```json
{"name": "submit_and_verify", "action": "click"}  // Does too much
```

### 2. Use Descriptive Names

```json
{"name": "navigate_to_pricing_page"}  // Clear
{"name": "task_1"}  // Unclear
```

### 3. Add Wait Times for Dynamic Content

```json
{
  "name": "wait_for_results",
  "agent_type": "browser",
  "action": "evaluate",
  "parameters": {
    "script": "document.querySelector('.results').children.length > 0",
    "waitForResult": true,
    "timeout": 5000
  }
}
```

### 4. Include Verification Steps

Always verify critical actions succeeded:

```json
{
  "name": "verify_login",
  "agent_type": "browser",
  "action": "getText",
  "parameters": {"selector": ".user-name"}
}
```

### 5. Handle Errors Gracefully

```json
{
  "retry": {
    "max_attempts": 3,
    "backoff": "exponential"
  },
  "on_error": "continue"
}
```

## Debugging Workflows

### Enable Verbose Logging

```bash
LOG_LEVEL=debug npm run dev
```

### Screenshot on Failure

```json
{
  "error_handling": {
    "on_error": "screenshot",
    "screenshot_path": "/tmp/error-screenshots/"
  }
}
```

### Test Individual Tasks

```bash
curl -X POST http://localhost:3000/api/v2/tasks/execute \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "agent_type": "browser",
    "action": "navigate",
    "parameters": {"url": "https://example.com"}
  }'
```

### Monitor Workflow Progress

```bash
# Poll workflow status
while true; do
  curl -s -H "Authorization: Bearer $TOKEN" \
    http://localhost:3000/api/v2/workflows/wf-abc123 | jq '.status'
  sleep 2
done
```

## Performance Optimization

### Reduce Page Load Times

```json
{
  "parameters": {
    "url": "https://example.com",
    "waitUntil": "domcontentloaded"  // Don't wait for all resources
  }
}
```

### Reuse Browser Contexts

```json
{
  "workflow_config": {
    "browser_reuse": true,
    "context_persist": "5m"
  }
}
```

### Parallel Task Execution (Future)

```json
{
  "parallel": true,
  "tasks": [...]
}
```

## Security Considerations

### Never Hardcode Credentials

❌ **Bad:**
```json
{"text": "mypassword123"}
```

✅ **Good:**
```json
{"text": "${env.USER_PASSWORD}"}
```

### Sanitize User Inputs

```json
{
  "parameters": {
    "text": "${sanitize(user_input)}"
  }
}
```

### Use HTTPS Only

```json
{
  "parameters": {
    "url": "https://example.com"  // Always HTTPS
  }
}
```

## Next Steps

✅ **Workflow execution patterns learned**

→ Continue to [error-handling.md](./error-handling.md) to master failure recovery

→ Then [browser-extension-wiring.md](./browser-extension-wiring.md) for UI integration

## Business Impact

**For Agencies:**
- Deliver complex automations faster
- Reusable workflow templates across clients
- Reduce QA time by 70%

**For Founders:**
- Ship product features without backend APIs
- Rapid prototyping of automation ideas
- Scalable workflow infrastructure

**For Platform Engineers:**
- Declarative workflow definitions
- Version-controlled automation
- Observable and debuggable pipelines

**For Senior Developers:**
- Clean separation of concerns
- Testable workflow logic
- Idempotent operations
