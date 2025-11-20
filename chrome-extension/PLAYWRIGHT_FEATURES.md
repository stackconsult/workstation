# Playwright-Enhanced Chrome Extension Documentation

## Overview

The Workstation Chrome Extension now features **enterprise-grade Playwright integration** for true agentic browser automation with self-healing capabilities and resilience.

## Architecture

### Core Modules

#### 1. **PlaywrightAutoWait** (`playwright/auto-wait.js`)
Intelligent element waiting system based on Playwright's auto-waiting concepts.

**Features:**
- Multiple element states: `visible`, `enabled`, `attached`
- Configurable timeout and polling intervals
- Element actionability checks
- Navigation and network idle waiting

**Multi-Strategy Selector System:**
The selector system tries multiple strategies in priority order:
1. ARIA role with label (highest priority for accessibility)
2. Data-test-id attributes (preferred for automation)
3. Element ID
4. Name attribute
5. Placeholder text
6. Text content
7. Class-based selectors
8. Full CSS path with nth-child (fallback)

**Example Usage:**
```javascript
// Wait for an element to be visible
const element = await PlaywrightAutoWait.waitForElement('#submit-button', {
  state: 'visible',
  timeout: 5000
});

// Get multiple selector strategies for an element
const strategies = PlaywrightAutoWait.getSelectorStrategies(element);
// Returns: ['[data-testid="submit"]', '#submit-button', 'button.btn-primary', ...]

// Wait for navigation to complete
await PlaywrightAutoWait.waitForNavigation({ timeout: 30000 });

// Wait for network to be idle
await PlaywrightAutoWait.waitForNetworkIdle({ idleTime: 500 });
```

#### 2. **PlaywrightNetworkMonitor** (`playwright/network.js`)
Real-time network monitoring and interception.

**Features:**
- Fetch API and XMLHttpRequest interception
- Request/response tracking with timestamps
- Network statistics aggregation
- Event listener system
- Wait for specific requests

**Example Usage:**
```javascript
const monitor = PlaywrightNetworkMonitor.getInstance();
monitor.setupInterception();

// Add listener for network events
monitor.addListener((eventType, data) => {
  console.log(`Network ${eventType}:`, data);
});

// Wait for a specific API call
const response = await monitor.waitForRequest('/api/users', { timeout: 10000 });

// Get network statistics
const stats = monitor.getStatistics();
console.log(`Total requests: ${stats.totalRequests}`);
console.log(`Failed requests: ${stats.failedResponses}`);
console.log(`Average duration: ${stats.averageDuration}ms`);
```

#### 3. **PlaywrightRetryManager** (`playwright/retry.js`)
Intelligent retry strategies for self-healing workflows.

**Features:**
- Exponential backoff retry mechanism
- Error type classification
- Alternative selector discovery
- Dynamic timeout adjustment
- Configurable retry limits

**Error Handling Strategies:**
- **ELEMENT_NOT_FOUND**: Tries alternative selectors
- **TIMEOUT**: Increases timeout values
- **NETWORK_ERROR**: Waits longer with higher multiplier
- **ELEMENT_NOT_ACTIONABLE**: Waits for page to settle
- **DEFAULT**: Generic exponential backoff

**Example Usage:**
```javascript
const retryManager = new PlaywrightRetryManager();

// Handle retry for a failed execution
const retryDecision = await retryManager.handleRetry(
  executionId,
  workflow,
  error,
  executionContext
);

if (retryDecision.shouldRetry) {
  console.log(`Retrying after ${retryDecision.delay}ms`);
  // Re-queue with updated parameters
}

// Configure retry behavior
retryManager.setMaxRetries(5);
retryManager.setBaseDelay(2000); // 2 seconds
```

#### 4. **PlaywrightExecution** (`playwright/execution.js`)
Enhanced workflow execution engine with queue management.

**Features:**
- Workflow execution queue
- Step-by-step execution with auto-waiting
- Variable resolution
- Execution status tracking
- Cancellation support

**Supported Actions:**
- `navigate`: Navigate to URL
- `click`: Click element with auto-waiting
- `type`: Type text into element
- `screenshot`: Capture visible tab
- `wait`: Wait for specified duration

**Example Usage:**
```javascript
const execution = new PlaywrightExecution();

// Execute a workflow
const executionId = await execution.executeWorkflow(
  workflow,
  tabId,
  (result) => {
    if (result.success) {
      console.log('Workflow completed:', result.result);
    } else {
      console.error('Workflow failed:', result.error);
    }
  }
);

// Check execution status
const status = execution.getExecutionStatus(executionId);
console.log(`Status: ${status.status}, Retry count: ${status.retryCount}`);

// Cancel execution
execution.cancelExecution(executionId);
```

## Integration

### Content Script Integration

The content script now uses Playwright's multi-strategy selector system for recording actions:

```javascript
// Before (simple selector)
const selector = element.id ? `#${element.id}` : `.${element.className}`;

// After (Playwright multi-strategy)
const strategies = PlaywrightAutoWait.getSelectorStrategies(element);
const actionData = {
  selector: strategies[0],  // Primary strategy
  alternativeSelectors: strategies.slice(1)  // Fallback strategies
};
```

### Background Service Worker Integration

The background service worker integrates PlaywrightExecution for local workflow execution:

```javascript
// Execute workflow locally with Playwright
chrome.runtime.sendMessage({
  action: 'executeWorkflow',
  workflow: {
    definition: {
      tasks: [
        { action: 'navigate', parameters: { url: 'https://example.com' } },
        { action: 'click', parameters: { selector: '#button', timeout: 5000 } },
        { action: 'screenshot', parameters: {} }
      ]
    }
  },
  useLocal: true,  // Use Playwright execution
  tabId: currentTabId
}, (response) => {
  console.log('Execution result:', response);
});
```

## Workflow Definition Format

```javascript
{
  "description": "Example workflow with Playwright features",
  "definition": {
    "tasks": [
      {
        "action": "navigate",
        "parameters": {
          "url": "https://example.com"
        }
      },
      {
        "action": "click",
        "parameters": {
          "selector": "#submit-button",
          "alternativeSelectors": [
            "[data-testid='submit']",
            "button.submit"
          ],
          "timeout": 5000
        },
        "variables": {}
      },
      {
        "action": "type",
        "parameters": {
          "selector": "input[name='email']",
          "text": "{{email}}",
          "timeout": 3000
        },
        "variables": {
          "email": "user@example.com"
        }
      },
      {
        "action": "wait",
        "parameters": {
          "duration": 1000
        }
      },
      {
        "action": "screenshot",
        "parameters": {}
      }
    ]
  }
}
```

## Self-Healing Capabilities

### Automatic Selector Fallback

When a primary selector fails, the extension automatically tries alternative strategies:

```javascript
// Recording captures multiple strategies
const strategies = [
  '[data-testid="login"]',  // Primary: data-testid
  '#login-button',           // Fallback 1: ID
  'button.login',            // Fallback 2: Class
  'button:nth-of-type(1)'    // Fallback 3: CSS path
];

// Execution tries each strategy until one succeeds
for (const selector of strategies) {
  try {
    await PlaywrightAutoWait.waitForElement(selector, { timeout: 3000 });
    // Success! Use this selector
    break;
  } catch (error) {
    // Try next strategy
    continue;
  }
}
```

### Dynamic Timeout Adjustment

The retry manager automatically increases timeouts for slow-loading pages:

```javascript
// Initial timeout: 5000ms
// Retry 1: 7500ms (1.5x)
// Retry 2: 11250ms (1.5x)
// Retry 3: 16875ms (1.5x)
```

### Network-Aware Retries

Network errors get longer delays with higher multipliers:

```javascript
// Base delay: 1000ms
// Network error retry 1: 3000ms (3x multiplier)
// Network error retry 2: 6000ms (exponential backoff)
// Network error retry 3: 12000ms
```

## Performance Metrics

### Extension Size
- **Total**: 65.75 KB
- **Playwright modules**: ~38 KB
- **Other files**: ~28 KB
- **Status**: ✅ Well within Chrome Web Store limits (10 MB)

### Module Breakdown
- `auto-wait.js`: 315 lines, 9.6 KB
- `network.js`: 315 lines, 8.4 KB
- `retry.js`: 299 lines, 8.6 KB
- `execution.js`: 363 lines, 10.7 KB

### Performance Characteristics
- **Element wait polling**: 100ms intervals (configurable)
- **Default timeout**: 30 seconds (configurable)
- **Network idle detection**: 500ms without activity
- **Retry base delay**: 1 second with exponential backoff

## Configuration

### Auto-Wait Configuration

```javascript
// Configure wait behavior
await PlaywrightAutoWait.waitForElement(selector, {
  state: 'visible',        // 'visible', 'enabled', 'attached'
  timeout: 30000,          // Maximum wait time in ms
  pollingInterval: 100     // Check every 100ms
});
```

### Retry Configuration

```javascript
// Configure retry behavior
retryManager.setMaxRetries(3);      // Maximum 3 retries
retryManager.setBaseDelay(1000);    // 1 second base delay
```

### Network Monitoring Configuration

```javascript
// Wait for network idle
await PlaywrightAutoWait.waitForNetworkIdle({
  timeout: 30000,   // Maximum wait time
  idleTime: 500     // No activity for 500ms = idle
});
```

## Troubleshooting

### Element Not Found

**Problem**: Element selector fails even with retries.

**Solutions**:
1. Check if element is in iframe (not currently supported)
2. Verify element is not dynamically generated after page load
3. Use browser DevTools to test selectors manually
4. Check console for recorded selector strategies

### Timeout Errors

**Problem**: Operations timing out consistently.

**Solutions**:
1. Increase timeout in workflow definition
2. Check network conditions
3. Verify page load performance
4. Use network monitoring to identify slow API calls

### Network Monitoring Not Working

**Problem**: Network requests not being captured.

**Solutions**:
1. Ensure `setupInterception()` is called early
2. Check if requests are using unsupported methods (WebSocket)
3. Verify page is not using Service Workers that bypass fetch
4. Check browser console for errors

## Best Practices

### 1. Selector Strategy Priority

Always prefer automation-friendly selectors:
```javascript
// ✅ Good: Stable, automation-friendly
[data-testid="submit-button"]
#user-email
[name="password"]

// ⚠️ Okay: Somewhat stable
.btn-primary
button.submit

// ❌ Avoid: Fragile, likely to break
div > div > button:nth-child(3)
.css-abc123-xyz
```

### 2. Timeout Values

Use appropriate timeouts for different operations:
```javascript
// Fast operations (clicks, type)
{ timeout: 5000 }

// Moderate operations (page loads)
{ timeout: 15000 }

// Slow operations (API calls, heavy processing)
{ timeout: 30000 }
```

### 3. Error Handling

Always handle execution results:
```javascript
chrome.runtime.sendMessage({ action: 'executeWorkflow', workflow }, (response) => {
  if (response.success) {
    console.log('Success:', response.result);
  } else {
    console.error('Failed:', response.error);
    // Implement fallback or user notification
  }
});
```

### 4. Network Monitoring

Use network monitoring to optimize workflow timing:
```javascript
const monitor = PlaywrightNetworkMonitor.getInstance();
monitor.addListener((type, data) => {
  if (type === 'response' && data.status >= 400) {
    console.warn('Failed request:', data.url);
  }
});
```

## Comparison with Standard Extension

### Before (PR #141)
- Simple selector generation (ID, class, nth-child)
- No retry mechanism
- Basic error handling
- Manual timing with setTimeout
- No network awareness

### After (Current Implementation)
- ✅ Multi-strategy selector system (8 strategies)
- ✅ Intelligent retry with exponential backoff
- ✅ Error classification and custom handling
- ✅ Auto-waiting for elements (Playwright-style)
- ✅ Network monitoring and idle detection
- ✅ Self-healing workflows
- ✅ Execution queue management
- ✅ Variable resolution
- ✅ Cancellation support

## API Reference

### PlaywrightAutoWait

#### Methods

**waitForElement(selector, options)**
- `selector` (string): CSS selector
- `options.state` (string): Element state - 'visible', 'enabled', 'attached'
- `options.timeout` (number): Maximum wait time in ms
- `options.pollingInterval` (number): Polling interval in ms
- Returns: `Promise<HTMLElement>`

**getSelectorStrategies(element)**
- `element` (HTMLElement): Element to generate selectors for
- Returns: `string[]` Array of selector strategies

**waitForActionable(selector, options)**
- Waits for element to be visible and enabled
- Returns: `Promise<HTMLElement>`

**waitForNavigation(options)**
- Waits for page to reach `readyState === 'complete'`
- Returns: `Promise<void>`

**waitForNetworkIdle(options)**
- Waits for no network activity for specified duration
- Returns: `Promise<void>`

### PlaywrightNetworkMonitor

#### Methods

**getInstance()**
- Returns singleton instance
- Returns: `PlaywrightNetworkMonitor`

**setupInterception()**
- Initializes network monitoring
- Returns: `void`

**addListener(callback)**
- `callback` (Function): `(eventType, data) => void`
- Returns: `Function` Unsubscribe function

**getStatistics()**
- Returns: `Object` Network statistics

**waitForRequest(urlPattern, options)**
- `urlPattern` (string|RegExp): URL pattern to match
- Returns: `Promise<Object>` Response object

### PlaywrightRetryManager

#### Methods

**handleRetry(executionId, workflow, error, execution)**
- Returns: `Promise<Object>` Retry decision

**setMaxRetries(max)**
- `max` (number): Maximum retry count
- Returns: `void`

**setBaseDelay(delay)**
- `delay` (number): Base delay in ms
- Returns: `void`

### PlaywrightExecution

#### Methods

**executeWorkflow(workflow, tabId, callback)**
- `workflow` (Object): Workflow definition
- `tabId` (number): Tab ID to execute in
- `callback` (Function): Result callback
- Returns: `string` Execution ID

**getExecutionStatus(executionId)**
- `executionId` (string): Execution ID
- Returns: `Object|null` Execution status

**cancelExecution(executionId)**
- `executionId` (string): Execution ID
- Returns: `boolean` Success status

## Future Enhancements

### Planned Features
1. **Trace Recording**: Capture execution traces for debugging
2. **Trace Viewer**: UI to analyze trace data
3. **Docker Snapshots**: 15-minute peel-back recovery
4. **GitHub Agent Integration**: Multi-agent collaboration
5. **AI-Powered Selector Healing**: ML-based selector suggestions
6. **Cross-Frame Support**: Execute in iframes
7. **Service Worker Support**: Handle Service Worker requests
8. **WebSocket Monitoring**: Track WebSocket connections

### Contributing

To add new Playwright features:
1. Create module in `chrome-extension/playwright/`
2. Export class with clear API
3. Add to `manifest.json` web_accessible_resources
4. Integrate with content or background script
5. Update test script to validate
6. Document in this README

## License

MIT License - See LICENSE file for details

## Support

For issues or questions:
- GitHub Issues: https://github.com/creditXcredit/workstation/issues
- Documentation: https://github.com/creditXcredit/workstation/tree/main/chrome-extension
- Examples: See `examples/` directory
