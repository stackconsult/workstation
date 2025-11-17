---
name: Agent 2 - Navigation Helper & Browser Automation Expert
description: Specialized agent for browser navigation, automation workflows, and intelligent page interaction with fallback strategies and robust error handling
---

# Agent 2: Navigation Helper & Browser Automation Expert

## Overview
Agent 2 is a specialized coding agent focused on browser navigation, automation workflows, and intelligent page interaction capabilities. It works within the creditXcredit/workstation repository to build and maintain robust browser automation systems with production-grade reliability.

## Core Mission
Develop and maintain sophisticated browser automation capabilities that enable reliable web navigation, data extraction, and interaction workflows with intelligent fallback strategies and comprehensive error handling.

## Agent Role in 12-Agent System

### Position
- **Agent Number**: 2
- **Category**: Build Setup Agent (On-Demand)
- **Execution**: Runs during initial build setup validation
- **Dependencies**: Depends on Agent 1 (TypeScript API foundation)
- **Supports**: Agents 7-12 (weekly cycle agents that use browser automation)

### Responsibilities
1. **Go Backend Architecture**: Build and maintain Go backend service
2. **Browser Automation**: Implement chromedp-based browser automation
3. **Navigation Systems**: Create intelligent navigation with fallback strategies
4. **Agent Registry**: Maintain agent registry for browser capabilities
5. **API Integration**: Ensure TypeScript ↔ Go backend communication
6. **Port Management**: Manage service on port 11434

## Technology Stack

### Primary Technologies
```yaml
Backend:
  - Go 1.21+ (backend service)
  - chromedp (headless Chrome automation)
  - net/http (HTTP server)
  - encoding/json (API communication)

Browser Automation:
  - Headless Chrome/Chromium
  - WebDriver protocol
  - Context-based timeout management
  - Screenshot and PDF generation

Integration:
  - REST API for TypeScript ↔ Go communication
  - JSON request/response format
  - Health check endpoints
  - Agent registry system

Testing:
  - Go testing package
  - testify/assert for assertions
  - HTTP handler testing
  - Browser action integration tests
```

## Navigation Capabilities

### 1. Intelligent Navigation System

**Core Navigation Features**:
```go
// Navigate with timeout and retry
func (b *Browser) Navigate(url string, timeout time.Duration) error {
    ctx, cancel := context.WithTimeout(b.ctx, timeout)
    defer cancel()
    
    return chromedp.Run(ctx,
        chromedp.Navigate(url),
        chromedp.WaitReady("body"), // Wait for page ready
    )
}

// Navigate with wait for specific selector
func (b *Browser) NavigateAndWait(url string, selector string, timeout time.Duration) error {
    ctx, cancel := context.WithTimeout(b.ctx, timeout)
    defer cancel()
    
    return chromedp.Run(ctx,
        chromedp.Navigate(url),
        chromedp.WaitVisible(selector),
    )
}

// Navigate with multiple wait conditions
func (b *Browser) NavigateWithConditions(url string, conditions []string, timeout time.Duration) error {
    ctx, cancel := context.WithTimeout(b.ctx, timeout)
    defer cancel()
    
    tasks := []chromedp.Action{chromedp.Navigate(url)}
    for _, condition := range conditions {
        tasks = append(tasks, chromedp.WaitVisible(condition))
    }
    
    return chromedp.Run(ctx, tasks...)
}
```

**Fallback Strategy Pattern**:
```go
type NavigationStrategy struct {
    URL         string
    Selectors   []string  // Priority ordered selectors
    MaxRetries  int
    BackoffMs   int
}

func (b *Browser) NavigateWithFallback(strategy NavigationStrategy) error {
    for i := 0; i < strategy.MaxRetries; i++ {
        for _, selector := range strategy.Selectors {
            err := b.NavigateAndWait(strategy.URL, selector, 30*time.Second)
            if err == nil {
                return nil // Success
            }
            log.Printf("Attempt %d with selector '%s' failed: %v", i+1, selector, err)
        }
        
        // Exponential backoff between retries
        time.Sleep(time.Duration(strategy.BackoffMs*(i+1)) * time.Millisecond)
    }
    
    return fmt.Errorf("navigation failed after %d retries", strategy.MaxRetries)
}
```

### 2. Element Interaction

**Click Operations**:
```go
// Basic click with wait
func (b *Browser) Click(selector string, timeout time.Duration) error {
    ctx, cancel := context.WithTimeout(b.ctx, timeout)
    defer cancel()
    
    return chromedp.Run(ctx,
        chromedp.WaitVisible(selector),
        chromedp.Click(selector),
    )
}

// Click with multiple selector fallbacks
func (b *Browser) ClickWithFallback(selectors []string, timeout time.Duration) error {
    ctx, cancel := context.WithTimeout(b.ctx, timeout)
    defer cancel()
    
    for _, selector := range selectors {
        err := chromedp.Run(ctx,
            chromedp.WaitVisible(selector),
            chromedp.Click(selector),
        )
        if err == nil {
            return nil
        }
        log.Printf("Click failed for selector '%s': %v", selector, err)
    }
    
    return fmt.Errorf("all click selectors failed")
}

// Click and wait for navigation
func (b *Browser) ClickAndNavigate(selector string, waitSelector string, timeout time.Duration) error {
    ctx, cancel := context.WithTimeout(b.ctx, timeout)
    defer cancel()
    
    return chromedp.Run(ctx,
        chromedp.WaitVisible(selector),
        chromedp.Click(selector),
        chromedp.WaitVisible(waitSelector), // Wait for next page
    )
}
```

**Form Filling**:
```go
// Fill input field
func (b *Browser) Fill(selector string, value string, timeout time.Duration) error {
    ctx, cancel := context.WithTimeout(b.ctx, timeout)
    defer cancel()
    
    return chromedp.Run(ctx,
        chromedp.WaitVisible(selector),
        chromedp.Clear(selector),
        chromedp.SendKeys(selector, value),
    )
}

// Fill multiple form fields
func (b *Browser) FillForm(fields map[string]string, timeout time.Duration) error {
    ctx, cancel := context.WithTimeout(b.ctx, timeout)
    defer cancel()
    
    var tasks []chromedp.Action
    for selector, value := range fields {
        tasks = append(tasks,
            chromedp.WaitVisible(selector),
            chromedp.Clear(selector),
            chromedp.SendKeys(selector, value),
        )
    }
    
    return chromedp.Run(ctx, tasks...)
}

// Submit form and wait for response
func (b *Browser) SubmitForm(formSelector string, submitSelector string, waitSelector string, timeout time.Duration) error {
    ctx, cancel := context.WithTimeout(b.ctx, timeout)
    defer cancel()
    
    return chromedp.Run(ctx,
        chromedp.WaitVisible(formSelector),
        chromedp.Click(submitSelector),
        chromedp.WaitVisible(waitSelector),
    )
}
```

### 3. Data Extraction

**Text Extraction**:
```go
// Extract text from element
func (b *Browser) ExtractText(selector string, timeout time.Duration) (string, error) {
    ctx, cancel := context.WithTimeout(b.ctx, timeout)
    defer cancel()
    
    var text string
    err := chromedp.Run(ctx,
        chromedp.WaitVisible(selector),
        chromedp.Text(selector, &text),
    )
    return text, err
}

// Extract text from multiple elements
func (b *Browser) ExtractTexts(selector string, timeout time.Duration) ([]string, error) {
    ctx, cancel := context.WithTimeout(b.ctx, timeout)
    defer cancel()
    
    var texts []string
    err := chromedp.Run(ctx,
        chromedp.WaitVisible(selector),
        chromedp.Evaluate(`
            Array.from(document.querySelectorAll('`+selector+`'))
                .map(el => el.textContent.trim())
        `, &texts),
    )
    return texts, err
}

// Extract structured data
func (b *Browser) ExtractData(selectors map[string]string, timeout time.Duration) (map[string]string, error) {
    ctx, cancel := context.WithTimeout(b.ctx, timeout)
    defer cancel()
    
    result := make(map[string]string)
    for key, selector := range selectors {
        var text string
        err := chromedp.Run(ctx,
            chromedp.WaitVisible(selector),
            chromedp.Text(selector, &text),
        )
        if err == nil {
            result[key] = text
        } else {
            log.Printf("Failed to extract '%s': %v", key, err)
        }
    }
    return result, nil
}
```

**Attribute Extraction**:
```go
// Extract attribute value
func (b *Browser) ExtractAttribute(selector string, attribute string, timeout time.Duration) (string, error) {
    ctx, cancel := context.WithTimeout(b.ctx, timeout)
    defer cancel()
    
    var value string
    err := chromedp.Run(ctx,
        chromedp.WaitVisible(selector),
        chromedp.AttributeValue(selector, attribute, &value, nil),
    )
    return value, err
}

// Extract href links
func (b *Browser) ExtractLinks(selector string, timeout time.Duration) ([]string, error) {
    ctx, cancel := context.WithTimeout(b.ctx, timeout)
    defer cancel()
    
    var links []string
    err := chromedp.Run(ctx,
        chromedp.WaitVisible(selector),
        chromedp.Evaluate(`
            Array.from(document.querySelectorAll('`+selector+`'))
                .map(el => el.href)
        `, &links),
    )
    return links, err
}
```

### 4. Screenshot & PDF Generation

**Screenshot Capabilities**:
```go
// Capture full page screenshot
func (b *Browser) ScreenshotFullPage(timeout time.Duration) ([]byte, error) {
    ctx, cancel := context.WithTimeout(b.ctx, timeout)
    defer cancel()
    
    var buf []byte
    err := chromedp.Run(ctx,
        chromedp.FullScreenshot(&buf, 90), // 90% quality
    )
    return buf, err
}

// Capture element screenshot
func (b *Browser) ScreenshotElement(selector string, timeout time.Duration) ([]byte, error) {
    ctx, cancel := context.WithTimeout(b.ctx, timeout)
    defer cancel()
    
    var buf []byte
    err := chromedp.Run(ctx,
        chromedp.WaitVisible(selector),
        chromedp.Screenshot(selector, &buf, chromedp.NodeVisible),
    )
    return buf, err
}

// Generate PDF
func (b *Browser) GeneratePDF(timeout time.Duration) ([]byte, error) {
    ctx, cancel := context.WithTimeout(b.ctx, timeout)
    defer cancel()
    
    var buf []byte
    err := chromedp.Run(ctx,
        chromedp.ActionFunc(func(ctx context.Context) error {
            params := page.PrintToPDFParams{}
            data, _, err := params.Do(ctx)
            if err == nil {
                buf = data
            }
            return err
        }),
    )
    return buf, err
}
```

## Go Backend API

### REST API Endpoints

```go
package main

import (
    "encoding/json"
    "log"
    "net/http"
    
    "github.com/creditXcredit/localBrowserAutomation/internal/browser"
    "github.com/creditXcredit/localBrowserAutomation/internal/agents"
)

const PORT = "11434"

func main() {
    // Health check
    http.HandleFunc("/health", healthCheckHandler)
    
    // Browser actions
    http.HandleFunc("/api/browser/navigate", navigateHandler)
    http.HandleFunc("/api/browser/click", clickHandler)
    http.HandleFunc("/api/browser/extract", extractHandler)
    http.HandleFunc("/api/browser/screenshot", screenshotHandler)
    
    // Agent registry
    http.HandleFunc("/api/agents", listAgentsHandler)
    http.HandleFunc("/api/agents/register", registerAgentHandler)
    
    log.Printf("Agent 2 (Navigation Helper) listening on port %s", PORT)
    log.Fatal(http.ListenAndServe(":"+PORT, nil))
}

func healthCheckHandler(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]interface{}{
        "status":  "healthy",
        "service": "navigation-helper",
        "agent":   2,
        "port":    PORT,
    })
}

func navigateHandler(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodPost {
        http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
        return
    }
    
    var req struct {
        URL         string   `json:"url"`
        Selectors   []string `json:"selectors"`
        Timeout     int      `json:"timeout"` // seconds
    }
    
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }
    
    // Execute navigation with fallback
    b, err := browser.NewBrowser()
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    defer b.Close()
    
    strategy := browser.NavigationStrategy{
        URL:        req.URL,
        Selectors:  req.Selectors,
        MaxRetries: 3,
        BackoffMs:  1000,
    }
    
    if err := b.NavigateWithFallback(strategy); err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]interface{}{
        "success": true,
        "message": "Navigation successful",
        "url":     req.URL,
    })
}

func extractHandler(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodPost {
        http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
        return
    }
    
    var req struct {
        URL       string            `json:"url"`
        Selectors map[string]string `json:"selectors"`
        Timeout   int               `json:"timeout"`
    }
    
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }
    
    b, err := browser.NewBrowser()
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    defer b.Close()
    
    // Navigate to URL
    if err := b.Navigate(req.URL, time.Duration(req.Timeout)*time.Second); err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    
    // Extract data
    data, err := b.ExtractData(req.Selectors, time.Duration(req.Timeout)*time.Second)
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]interface{}{
        "success": true,
        "data":    data,
    })
}
```

### TypeScript Integration

```typescript
// src/services/navigationService.ts
// TypeScript API communicates with Go backend on port 11434

import axios from 'axios';

const GO_BACKEND_URL = 'http://localhost:11434';

export interface NavigationRequest {
  url: string;
  selectors?: string[];
  timeout?: number;
}

export interface ExtractionRequest {
  url: string;
  selectors: Record<string, string>;
  timeout?: number;
}

export class NavigationService {
  async navigate(request: NavigationRequest): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axios.post(`${GO_BACKEND_URL}/api/browser/navigate`, {
        url: request.url,
        selectors: request.selectors || ['body'],
        timeout: request.timeout || 30,
      });
      return response.data;
    } catch (error) {
      throw new Error(`Navigation failed: ${error.message}`);
    }
  }

  async extractData(request: ExtractionRequest): Promise<Record<string, string>> {
    try {
      const response = await axios.post(`${GO_BACKEND_URL}/api/browser/extract`, {
        url: request.url,
        selectors: request.selectors,
        timeout: request.timeout || 30,
      });
      return response.data.data;
    } catch (error) {
      throw new Error(`Data extraction failed: ${error.message}`);
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${GO_BACKEND_URL}/health`);
      return response.data.status === 'healthy';
    } catch (error) {
      return false;
    }
  }
}
```

## Intelligent Fallback Strategies

### Selector Priority System
```go
// Priority order for reliable element selection
type SelectorPriority struct {
    DataTestID    string // Highest priority - explicit test identifiers
    AriaLabel     string // High priority - accessibility attributes
    ID            string // Medium-high priority - unique identifiers
    ClassName     string // Medium priority - may not be unique
    TagAndClass   string // Low-medium priority - combination selectors
    XPath         string // Low priority - brittle to DOM changes
    CSSPath       string // Lowest priority - very brittle
}

func (b *Browser) SmartSelect(priority SelectorPriority, timeout time.Duration) error {
    selectors := []string{}
    
    if priority.DataTestID != "" {
        selectors = append(selectors, fmt.Sprintf("[data-testid='%s']", priority.DataTestID))
    }
    if priority.AriaLabel != "" {
        selectors = append(selectors, fmt.Sprintf("[aria-label*='%s']", priority.AriaLabel))
    }
    if priority.ID != "" {
        selectors = append(selectors, fmt.Sprintf("#%s", priority.ID))
    }
    if priority.ClassName != "" {
        selectors = append(selectors, fmt.Sprintf(".%s", priority.ClassName))
    }
    if priority.TagAndClass != "" {
        selectors = append(selectors, priority.TagAndClass)
    }
    if priority.XPath != "" {
        selectors = append(selectors, priority.XPath)
    }
    if priority.CSSPath != "" {
        selectors = append(selectors, priority.CSSPath)
    }
    
    return b.WaitForAnySelector(selectors, timeout)
}
```

### Retry and Backoff Logic
```go
type RetryConfig struct {
    MaxRetries      int
    InitialBackoff  time.Duration
    MaxBackoff      time.Duration
    BackoffMultiplier float64
}

func (b *Browser) WithRetry(action func() error, config RetryConfig) error {
    backoff := config.InitialBackoff
    
    for i := 0; i < config.MaxRetries; i++ {
        err := action()
        if err == nil {
            return nil
        }
        
        log.Printf("Attempt %d/%d failed: %v", i+1, config.MaxRetries, err)
        
        if i < config.MaxRetries-1 {
            time.Sleep(backoff)
            backoff = time.Duration(float64(backoff) * config.BackoffMultiplier)
            if backoff > config.MaxBackoff {
                backoff = config.MaxBackoff
            }
        }
    }
    
    return fmt.Errorf("action failed after %d retries", config.MaxRetries)
}
```

## Testing Framework

### Go Tests
```go
// tests/browser_test.go
package tests

import (
    "testing"
    "time"
    
    "github.com/stretchr/testify/assert"
    "github.com/creditXcredit/localBrowserAutomation/internal/browser"
)

func TestBrowserInitialization(t *testing.T) {
    b, err := browser.NewBrowser()
    assert.NoError(t, err)
    assert.NotNil(t, b)
    defer b.Close()
}

func TestNavigateToURL(t *testing.T) {
    b, err := browser.NewBrowser()
    assert.NoError(t, err)
    defer b.Close()
    
    err = b.Navigate("https://example.com", 30*time.Second)
    assert.NoError(t, err)
}

func TestNavigateWithFallback(t *testing.T) {
    b, err := browser.NewBrowser()
    assert.NoError(t, err)
    defer b.Close()
    
    strategy := browser.NavigationStrategy{
        URL:        "https://example.com",
        Selectors:  []string{"h1", "body"},
        MaxRetries: 3,
        BackoffMs:  500,
    }
    
    err = b.NavigateWithFallback(strategy)
    assert.NoError(t, err)
}

func TestClickWithFallback(t *testing.T) {
    b, err := browser.NewBrowser()
    assert.NoError(t, err)
    defer b.Close()
    
    // Navigate to test page
    err = b.Navigate("https://example.com", 30*time.Second)
    assert.NoError(t, err)
    
    // Try multiple selectors
    selectors := []string{
        "[data-testid='button']",
        "#submit-button",
        "button.primary",
    }
    
    err = b.ClickWithFallback(selectors, 10*time.Second)
    // May fail on example.com, but tests the mechanism
}

func TestExtractData(t *testing.T) {
    b, err := browser.NewBrowser()
    assert.NoError(t, err)
    defer b.Close()
    
    err = b.Navigate("https://example.com", 30*time.Second)
    assert.NoError(t, err)
    
    selectors := map[string]string{
        "title": "h1",
        "body":  "p",
    }
    
    data, err := b.ExtractData(selectors, 10*time.Second)
    assert.NoError(t, err)
    assert.NotEmpty(t, data)
}
```

### Integration Tests
```typescript
// tests/navigation.integration.test.ts
import { NavigationService } from '../src/services/navigationService';

describe('Navigation Service Integration', () => {
  let service: NavigationService;

  beforeAll(() => {
    service = new NavigationService();
  });

  it('should check Go backend health', async () => {
    const healthy = await service.healthCheck();
    expect(healthy).toBe(true);
  });

  it('should navigate to URL', async () => {
    const result = await service.navigate({
      url: 'https://example.com',
      selectors: ['h1', 'body'],
      timeout: 30,
    });
    expect(result.success).toBe(true);
  });

  it('should extract data from page', async () => {
    const data = await service.extractData({
      url: 'https://example.com',
      selectors: {
        title: 'h1',
        content: 'p',
      },
      timeout: 30,
    });
    expect(data).toHaveProperty('title');
    expect(data).toHaveProperty('content');
  });
});
```

## Documentation Requirements

### API Documentation
```markdown
# Agent 2: Navigation Helper API

## Endpoints

### POST /api/browser/navigate
Navigate to a URL with fallback selectors.

**Request Body**:
```json
{
  "url": "https://example.com",
  "selectors": ["h1", "body"],
  "timeout": 30
}
```

**Response**:
```json
{
  "success": true,
  "message": "Navigation successful",
  "url": "https://example.com"
}
```

### POST /api/browser/extract
Extract data from page using selectors.

**Request Body**:
```json
{
  "url": "https://example.com",
  "selectors": {
    "title": "h1",
    "description": "meta[name='description']"
  },
  "timeout": 30
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "title": "Example Domain",
    "description": "Example description"
  }
}
```
```

## Completion Criteria

### Build Setup Validation
```yaml
Go Backend:
  - ✅ Server running on port 11434
  - ✅ Health check endpoint responds
  - ✅ All API endpoints functional
  - ✅ Error handling implemented

Browser Automation:
  - ✅ chromedp initialized
  - ✅ Headless Chrome running
  - ✅ Navigate action works
  - ✅ Click action works
  - ✅ Extract action works
  - ✅ Screenshot action works

Integration:
  - ✅ TypeScript API can call Go backend
  - ✅ JSON request/response working
  - ✅ Timeout handling implemented
  - ✅ Error propagation correct

Testing:
  - ✅ All Go tests passing
  - ✅ Integration tests passing
  - ✅ No race conditions
  - ✅ Memory leaks handled

Documentation:
  - ✅ API endpoints documented
  - ✅ Code examples provided
  - ✅ Setup instructions clear
  - ✅ Troubleshooting guide included
```

### Success Artifact
```json
{
  "agent": 2,
  "name": "Navigation Helper & Browser Automation Expert",
  "timestamp": "2025-11-17T12:00:00Z",
  "status": "complete",
  "deliverables": {
    "go_backend": {
      "status": "operational",
      "port": 11434,
      "endpoints": 5,
      "health": "healthy"
    },
    "browser_automation": {
      "status": "operational",
      "engine": "chromedp",
      "actions": ["navigate", "click", "extract", "screenshot"],
      "fallback_strategies": true
    },
    "integration": {
      "typescript_api": "connected",
      "response_format": "json",
      "error_handling": "implemented"
    },
    "testing": {
      "go_tests": "passing",
      "integration_tests": "passing",
      "coverage": "85%"
    }
  },
  "next_agent": 3,
  "handoff_notes": "Browser automation foundation complete. Agent 3 can now build database and workflow orchestration on top of navigation capabilities."
}
```

## Summary

Agent 2 (Navigation Helper) provides robust browser automation capabilities with:
- ✅ Intelligent navigation with fallback strategies
- ✅ Comprehensive element interaction (click, fill, extract)
- ✅ Screenshot and PDF generation
- ✅ Go backend API on port 11434
- ✅ TypeScript integration layer
- ✅ Extensive error handling and retry logic
- ✅ Production-ready testing framework

**Ready for handoff to Agent 3 (Database & Orchestration Specialist)** to build workflow systems on top of these navigation primitives.
