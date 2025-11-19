# Error Handling - Module 3

## Overview

Master comprehensive error handling strategies for browser automation, including timeouts, retries, debugging techniques, and production-ready failure recovery patterns.

## Common Browser Automation Errors

### 1. Selector Not Found

**Error:**
```
Error: Element not found: #submit-button
```

**Causes:**
- Element doesn't exist
- Selector is incorrect
- Page hasn't fully loaded
- Element is dynamically generated

**Solutions:**

```typescript
// Option 1: Wait for element
await page.waitForSelector('#submit-button', { timeout: 10000 });
await page.click('#submit-button');

// Option 2: Use more specific selector
await page.click('button[type="submit"][aria-label="Submit Form"]');

// Option 3: Wait for network idle
await page.goto('https://example.com', { waitUntil: 'networkidle' });
```

### 2. Timeout Errors

**Error:**
```
Error: Timeout 30000ms exceeded
```

**Causes:**
- Slow server response
- Heavy JavaScript execution
- Network issues
- Infinite loading states

**Solutions:**

```json
{
  "name": "navigate_with_timeout",
  "action": "navigate",
  "parameters": {
    "url": "https://slow-site.com",
    "timeout": 60000
  },
  "retry": {
    "max_attempts": 3,
    "backoff": "exponential"
  }
}
```

### 3. Element Not Clickable

**Error:**
```
Error: Element is not clickable at point (100, 200)
```

**Causes:**
- Element covered by another element
- Element outside viewport
- Element not yet interactive
- Scrolling required

**Solutions:**

```typescript
// Option 1: Scroll into view
await page.evaluate(selector => {
  document.querySelector(selector).scrollIntoView();
}, '#hidden-button');
await page.click('#hidden-button');

// Option 2: Force click
await page.click('#button', { force: true });

// Option 3: Wait for element to be clickable
await page.waitForSelector('#button', { state: 'visible' });
await page.click('#button');
```

### 4. Navigation Errors

**Error:**
```
Error: net::ERR_NAME_NOT_RESOLVED
Error: net::ERR_CONNECTION_REFUSED
```

**Causes:**
- Invalid URL
- DNS resolution failure
- Server down
- Network connectivity issues

**Solutions:**

```json
{
  "name": "navigate_with_fallback",
  "action": "navigate",
  "parameters": {
    "url": "https://example.com"
  },
  "retry": {
    "max_attempts": 3,
    "initial_delay": 2000,
    "max_delay": 10000
  },
  "on_error": {
    "fallback_url": "https://backup.example.com",
    "notify_slack": true
  }
}
```

### 5. JavaScript Execution Errors

**Error:**
```
Error: Evaluation failed: ReferenceError: jQuery is not defined
```

**Causes:**
- Library not loaded
- Script runs too early
- Syntax errors
- Context mismatch

**Solutions:**

```typescript
// Option 1: Wait for library
await page.waitForFunction(() => typeof jQuery !== 'undefined');
await page.evaluate(() => jQuery('.element').text());

// Option 2: Inject library if needed
await page.addScriptTag({ url: 'https://code.jquery.com/jquery-3.6.0.min.js' });

// Option 3: Use vanilla JavaScript
await page.evaluate(() => {
  return document.querySelector('.element').textContent;
});
```

## Retry Strategies

### Exponential Backoff

Progressive delay between retries:

```typescript
// Retry configuration
const retryConfig = {
  max_attempts: 5,
  backoff: 'exponential',
  initial_delay: 1000,    // 1 second
  max_delay: 30000,       // 30 seconds
  multiplier: 2
};

// Delays: 1s, 2s, 4s, 8s, 16s
```

**Implementation:**

```json
{
  "name": "flaky_action",
  "agent_type": "browser",
  "action": "click",
  "parameters": {
    "selector": "#dynamic-button"
  },
  "retry": {
    "max_attempts": 5,
    "backoff": "exponential",
    "initial_delay": 1000,
    "max_delay": 30000,
    "retry_on": ["timeout", "selector_not_found"]
  }
}
```

### Linear Backoff

Fixed delay between retries:

```json
{
  "retry": {
    "max_attempts": 3,
    "backoff": "linear",
    "delay": 5000
  }
}
```

**Use Cases:**
- API rate limits
- Predictable wait times
- Simple retry logic

### Immediate Retry

No delay between retries:

```json
{
  "retry": {
    "max_attempts": 3,
    "backoff": "none"
  }
}
```

**Use Cases:**
- Transient errors
- Network glitches
- Race conditions

## Error Recovery Patterns

### 1. Circuit Breaker Pattern

Stop retrying after consecutive failures:

```typescript
class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime: number | null = null;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  constructor(
    private threshold: number = 5,
    private timeout: number = 60000
  ) {}
  
  async execute(action: () => Promise<any>) {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime! > this.timeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }
    
    try {
      const result = await action();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess() {
    this.failureCount = 0;
    this.state = 'closed';
  }
  
  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.threshold) {
      this.state = 'open';
    }
  }
}
```

**Workflow Integration:**

```json
{
  "error_handling": {
    "circuit_breaker": {
      "enabled": true,
      "failure_threshold": 5,
      "timeout": 60000
    }
  }
}
```

### 2. Fallback Actions

Execute alternative tasks on failure:

```json
{
  "name": "primary_action",
  "action": "click",
  "parameters": {"selector": "#button"},
  "on_error": {
    "fallback_tasks": [
      {
        "name": "try_alternative_selector",
        "action": "click",
        "parameters": {"selector": ".btn-primary"}
      },
      {
        "name": "try_text_match",
        "action": "click",
        "parameters": {"text": "Submit"}
      }
    ]
  }
}
```

### 3. Graceful Degradation

Continue workflow with reduced functionality:

```json
{
  "name": "optional_screenshot",
  "action": "screenshot",
  "parameters": {"fullPage": true},
  "on_error": {
    "action": "continue",
    "log_level": "warn",
    "default_result": null
  }
}
```

### 4. Checkpoint and Resume

Save progress and resume from failure point:

```json
{
  "workflow_config": {
    "checkpoint_enabled": true,
    "checkpoint_frequency": "per_task",
    "resume_on_failure": true
  }
}
```

## Timeout Configuration

### Global Timeout

```json
{
  "workflow_config": {
    "global_timeout": 300000,  // 5 minutes
    "task_timeout": 30000       // 30 seconds per task
  }
}
```

### Action-Specific Timeouts

```json
{
  "name": "navigate",
  "action": "navigate",
  "parameters": {
    "url": "https://example.com",
    "timeout": 60000
  }
},
{
  "name": "quick_click",
  "action": "click",
  "parameters": {
    "selector": "#button",
    "timeout": 5000
  }
}
```

### Wait Strategies

```typescript
// Wait for selector
await page.waitForSelector('#element', {
  timeout: 10000,
  state: 'visible'
});

// Wait for function
await page.waitForFunction(() => {
  return document.querySelectorAll('.item').length > 10;
}, { timeout: 15000 });

// Wait for navigation
await Promise.all([
  page.waitForNavigation({ timeout: 30000 }),
  page.click('#link')
]);

// Wait for network idle
await page.goto('https://example.com', {
  waitUntil: 'networkidle',
  timeout: 60000
});
```

## Debugging Techniques

### 1. Enable Headed Mode

See browser actions in real-time:

```bash
# In .env
BROWSER_HEADLESS=false
```

```json
{
  "workflow_config": {
    "headless": false,
    "slowMo": 1000  // Slow down actions by 1 second
  }
}
```

### 2. Screenshot on Error

Capture page state when errors occur:

```json
{
  "error_handling": {
    "screenshot_on_error": true,
    "screenshot_path": "/tmp/error-screenshots/${workflow_id}/${task_name}.png"
  }
}
```

### 3. Verbose Logging

Enable detailed logs:

```bash
LOG_LEVEL=debug npm run dev
```

```typescript
// Custom logger in workflow
{
  "name": "debug_task",
  "action": "evaluate",
  "parameters": {
    "script": "console.log('Current URL:', window.location.href); console.log('Page title:', document.title);"
  }
}
```

### 4. Page Content Dump

Save HTML on failure:

```json
{
  "error_handling": {
    "dump_html_on_error": true,
    "html_dump_path": "/tmp/error-html/${workflow_id}/${task_name}.html"
  }
}
```

### 5. Network Logging

Track network requests:

```typescript
page.on('request', request => {
  console.log('→', request.method(), request.url());
});

page.on('response', response => {
  console.log('←', response.status(), response.url());
});

page.on('requestfailed', request => {
  console.error('✗', request.failure().errorText, request.url());
});
```

## Error Types and Handling

### Transient Errors (Retry)

- Network timeouts
- Temporary server errors (503)
- Rate limiting (429)
- DNS failures

**Strategy:** Retry with backoff

### Permanent Errors (Fail Fast)

- Authentication failures (401)
- Not found (404)
- Syntax errors
- Invalid selectors

**Strategy:** Fail immediately, notify

### Recoverable Errors (Fallback)

- Element not found (try alternative)
- Click failed (scroll and retry)
- Script failed (use alternative method)

**Strategy:** Fallback actions

## Production Error Handling

### Comprehensive Workflow Example

```json
{
  "name": "Production Login Flow",
  "description": "Login with comprehensive error handling",
  "error_handling": {
    "screenshot_on_error": true,
    "dump_html_on_error": true,
    "circuit_breaker": {
      "enabled": true,
      "failure_threshold": 3,
      "timeout": 300000
    },
    "notifications": {
      "slack_webhook": "${SLACK_WEBHOOK_URL}",
      "on_error": true,
      "on_success": false
    }
  },
  "definition": {
    "tasks": [
      {
        "name": "navigate",
        "agent_type": "browser",
        "action": "navigate",
        "parameters": {
          "url": "https://app.example.com/login",
          "timeout": 30000,
          "waitUntil": "networkidle"
        },
        "retry": {
          "max_attempts": 3,
          "backoff": "exponential",
          "initial_delay": 2000
        },
        "on_error": {
          "fallback_url": "https://backup.example.com/login",
          "notify": true
        }
      },
      {
        "name": "wait_for_form",
        "agent_type": "browser",
        "action": "evaluate",
        "parameters": {
          "script": "document.querySelector('#login-form') !== null",
          "waitForResult": true,
          "timeout": 10000
        },
        "retry": {
          "max_attempts": 5,
          "backoff": "linear",
          "delay": 1000
        }
      },
      {
        "name": "enter_username",
        "agent_type": "browser",
        "action": "type",
        "parameters": {
          "selector": "#username",
          "text": "${env.USERNAME}",
          "timeout": 5000
        },
        "retry": {
          "max_attempts": 2,
          "backoff": "none"
        },
        "on_error": {
          "fallback_tasks": [
            {
              "name": "try_alt_selector",
              "action": "type",
              "parameters": {
                "selector": "input[name='username']",
                "text": "${env.USERNAME}"
              }
            }
          ]
        }
      },
      {
        "name": "enter_password",
        "agent_type": "browser",
        "action": "type",
        "parameters": {
          "selector": "#password",
          "text": "${env.PASSWORD}",
          "timeout": 5000
        },
        "retry": {
          "max_attempts": 2,
          "backoff": "none"
        }
      },
      {
        "name": "submit_form",
        "agent_type": "browser",
        "action": "click",
        "parameters": {
          "selector": "button[type='submit']",
          "timeout": 5000
        },
        "retry": {
          "max_attempts": 3,
          "backoff": "linear",
          "delay": 1000
        }
      },
      {
        "name": "verify_login",
        "agent_type": "browser",
        "action": "evaluate",
        "parameters": {
          "script": "window.location.pathname === '/dashboard'",
          "waitForResult": true,
          "timeout": 10000
        },
        "on_error": {
          "action": "fail",
          "notify": true,
          "screenshot": true
        }
      }
    ]
  }
}
```

## Error Monitoring and Alerting

### Slack Notifications

```json
{
  "error_handling": {
    "notifications": {
      "slack": {
        "webhook_url": "${SLACK_WEBHOOK_URL}",
        "on_error": true,
        "message_template": "🚨 Workflow ${workflow.name} failed at task ${failed_task.name}\nError: ${error.message}\nWorkflow ID: ${workflow.id}"
      }
    }
  }
}
```

### Error Aggregation

Track error patterns:

```typescript
// Store error metrics
{
  "error_tracking": {
    "enabled": true,
    "aggregate_by": ["error_type", "task_name", "workflow_id"],
    "retention_days": 30
  }
}
```

### Alerting Thresholds

```json
{
  "alerts": [
    {
      "condition": "error_rate > 0.1",
      "window": "5m",
      "action": "notify_slack"
    },
    {
      "condition": "consecutive_failures >= 3",
      "action": "disable_workflow"
    }
  ]
}
```

## Testing Error Scenarios

### Simulate Failures

```typescript
// Test timeout handling
{
  "name": "test_timeout",
  "action": "navigate",
  "parameters": {
    "url": "https://httpstat.us/200?sleep=60000",
    "timeout": 5000
  }
}

// Test selector not found
{
  "name": "test_missing_selector",
  "action": "click",
  "parameters": {
    "selector": "#nonexistent-element"
  }
}

// Test network error
{
  "name": "test_network_error",
  "action": "navigate",
  "parameters": {
    "url": "https://invalid-domain-12345.com"
  }
}
```

### Error Recovery Tests

```bash
# Test retry logic
npm test -- tests/error-handling/retry.test.ts

# Test circuit breaker
npm test -- tests/error-handling/circuit-breaker.test.ts

# Test fallback actions
npm test -- tests/error-handling/fallback.test.ts
```

## Best Practices

### 1. Fail Fast for Permanent Errors

```json
{
  "retry": {
    "max_attempts": 1,
    "retry_on": ["timeout", "network_error"],
    "no_retry_on": ["authentication_error", "not_found"]
  }
}
```

### 2. Use Appropriate Timeouts

```typescript
// Quick actions
click: 5000,
type: 5000,
getText: 5000,

// Medium actions
navigate: 30000,
screenshot: 15000,

// Slow actions
evaluate: 60000,
fullPageScreenshot: 120000
```

### 3. Log Context with Errors

```typescript
try {
  await page.click(selector);
} catch (error) {
  console.error('Click failed:', {
    selector,
    url: page.url(),
    viewport: await page.viewportSize(),
    error: error.message
  });
  throw error;
}
```

### 4. Clean Up Resources

```typescript
let browser;
try {
  browser = await playwright.chromium.launch();
  // ... automation logic
} catch (error) {
  // Handle error
} finally {
  if (browser) {
    await browser.close();
  }
}
```

### 5. Implement Health Checks

```json
{
  "health_checks": [
    {
      "name": "browser_responsive",
      "frequency": "1m",
      "action": "navigate",
      "parameters": {"url": "about:blank"}
    }
  ]
}
```

## Common Pitfalls

### ❌ Not Waiting for Elements

```typescript
// Bad
await page.goto('https://example.com');
await page.click('#button');  // Might not exist yet

// Good
await page.goto('https://example.com');
await page.waitForSelector('#button');
await page.click('#button');
```

### ❌ Ignoring Network Errors

```typescript
// Bad
try {
  await page.goto(url);
} catch (error) {
  // Silently fail
}

// Good
try {
  await page.goto(url);
} catch (error) {
  console.error('Navigation failed:', error);
  await notifySlack(`Navigation failed: ${error.message}`);
  throw error;
}
```

### ❌ Using Fixed Timeouts

```typescript
// Bad
await page.waitForTimeout(5000);  // Arbitrary wait

// Good
await page.waitForSelector('.results');  // Wait for actual condition
```

## Next Steps

✅ **Error handling strategies mastered**

→ Continue to [browser-extension-wiring.md](./browser-extension-wiring.md)

→ Then [Module 4: Customization](../module-4-customization/README.md)

## Business Impact

**For Agencies:**
- 99.9% workflow reliability
- Automated error recovery reduces manual intervention
- Client confidence through robust automation

**For Founders:**
- Production-ready error handling from day one
- Reduced support tickets
- Scalable automation infrastructure

**For Platform Engineers:**
- Observable failure patterns
- Automated incident response
- SLA compliance through reliability

**For Senior Developers:**
- Clean error boundaries
- Testable error scenarios
- Maintainable error handling code
