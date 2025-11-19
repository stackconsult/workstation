# Prompt Engineering for Agent Automation

## Overview

Effective prompts are the foundation of reliable automation. This guide teaches you how to design task definitions, engineer workflows, and structure prompts that maximize agent performance and minimize failures.

**Key Principle**: Clear prompts = Reliable automation

## Understanding Agent Prompts

### Prompt vs. Task Definition

```json
{
  "task": {
    "name": "scrape_product_data",
    "agent_type": "browser",
    "action": "navigate",
    "parameters": {
      "url": "https://example.com/product/123"
    },
    "prompt": "Navigate to product page and wait for content to load",
    "success_criteria": "Page title contains 'Product'",
    "error_handling": "retry_once"
  }
}
```

**Components**:
- **Task Name**: Unique identifier for workflow step
- **Agent Type**: Which agent executes the task
- **Action**: Specific capability to invoke  
- **Parameters**: Input data for the action
- **Prompt**: Human-readable intent (for logging/debugging)
- **Success Criteria**: How to verify completion
- **Error Handling**: Retry strategy

## Prompt Engineering Patterns

### Pattern 1: Explicit Context

```json
// ❌ BAD: Vague context
{
  "name": "get_data",
  "action": "getText",
  "parameters": {"selector": ".content"}
}

// ✅ GOOD: Explicit context
{
  "name": "extract_product_title",
  "agent_type": "browser",
  "action": "getText",
  "parameters": {
    "selector": "h1.product-title",
    "wait_for_selector": true,
    "timeout": 5000
  },
  "description": "Extract product title from main heading after page load completes"
}
```

### Pattern 2: Defensive Selectors

```typescript
// Use multiple fallback selectors
{
  "name": "get_price",
  "action": "evaluate",
  "parameters": {
    "script": `
      // Try multiple selectors in priority order
      const selectors = [
        '.price-current',
        '[data-price]',
        '.product-price span',
        '#price'
      ];
      
      for (const selector of selectors) {
        const elem = document.querySelector(selector);
        if (elem) {
          const price = elem.textContent.trim();
          if (price && price.match(/\$?\d+\.\d{2}/)) {
            return price;
          }
        }
      }
      
      throw new Error('Price not found with any selector');
    `
  }
}
```

### Pattern 3: Wait Strategies

```json
{
  "tasks": [
    {
      "name": "navigate_and_wait",
      "action": "navigate",
      "parameters": {
        "url": "https://example.com",
        "waitUntil": "networkidle"
      }
    },
    {
      "name": "wait_for_dynamic_content",
      "action": "evaluate",
      "parameters": {
        "script": `
          // Wait for specific condition
          return new Promise((resolve) => {
            const interval = setInterval(() => {
              const elem = document.querySelector('.loaded-content');
              if (elem && elem.children.length > 0) {
                clearInterval(interval);
                resolve(true);
              }
            }, 500);
            
            // Timeout after 10 seconds
            setTimeout(() => {
              clearInterval(interval);
              resolve(false);
            }, 10000);
          });
        `
      }
    }
  ]
}
```

### Pattern 4: Data Validation

```typescript
{
  "name": "validate_and_extract",
  "action": "evaluate",
  "parameters": {
    "script": `
      const data = {
        title: document.querySelector('h1')?.textContent?.trim(),
        price: document.querySelector('.price')?.textContent?.trim(),
        inStock: document.querySelector('.in-stock')?.textContent?.includes('In Stock')
      };
      
      // Validate required fields
      if (!data.title || data.title.length < 3) {
        throw new Error('Invalid title extracted');
      }
      
      if (!data.price || !data.price.match(/\$\d+/)) {
        throw new Error('Invalid price format');
      }
      
      return data;
    `
  }
}
```

## Real-World Examples

### Example 1: E-commerce Scraping

```json
{
  "name": "Scrape Product Details",
  "description": "Extract complete product information from e-commerce site",
  "definition": {
    "tasks": [
      {
        "name": "navigate_to_product",
        "agent_type": "browser",
        "action": "navigate",
        "parameters": {
          "url": "{{input.product_url}}",
          "waitUntil": "networkidle"
        }
      },
      {
        "name": "wait_for_page_load",
        "agent_type": "browser",
        "action": "evaluate",
        "parameters": {
          "script": `
            // Wait for product data to be populated
            return new Promise((resolve) => {
              const checkLoaded = () => {
                const title = document.querySelector('h1.product-name');
                const price = document.querySelector('.price-current');
                const images = document.querySelectorAll('.product-image');
                
                if (title && price && images.length > 0) {
                  resolve(true);
                } else if (Date.now() - startTime > 10000) {
                  resolve(false);
                } else {
                  setTimeout(checkLoaded, 500);
                }
              };
              
              const startTime = Date.now();
              checkLoaded();
            });
          `
        }
      },
      {
        "name": "extract_product_data",
        "agent_type": "browser",
        "action": "evaluate",
        "parameters": {
          "script": `
            const extractText = (selector) => {
              const elem = document.querySelector(selector);
              return elem ? elem.textContent.trim() : null;
            };
            
            const extractPrice = () => {
              const priceElem = document.querySelector('.price-current');
              if (!priceElem) return null;
              
              const priceText = priceElem.textContent;
              const match = priceText.match(/\$?([\d,]+\.\d{2})/);
              return match ? parseFloat(match[1].replace(',', '')) : null;
            };
            
            const extractImages = () => {
              return Array.from(document.querySelectorAll('.product-image img'))
                .map(img => img.src)
                .filter(src => src && !src.includes('placeholder'));
            };
            
            return {
              title: extractText('h1.product-name'),
              brand: extractText('.product-brand'),
              price: extractPrice(),
              description: extractText('.product-description'),
              sku: extractText('[data-sku]'),
              inStock: document.querySelector('.in-stock') !== null,
              images: extractImages(),
              rating: parseFloat(extractText('.product-rating') || '0'),
              reviewCount: parseInt(extractText('.review-count') || '0'),
              timestamp: new Date().toISOString()
            };
          `
        }
      },
      {
        "name": "validate_extracted_data",
        "agent_type": "browser",
        "action": "evaluate",
        "parameters": {
          "script": `
            const data = {{tasks.extract_product_data}};
            
            const errors = [];
            
            if (!data.title || data.title.length < 5) {
              errors.push('Invalid or missing title');
            }
            
            if (!data.price || data.price <= 0) {
              errors.push('Invalid or missing price');
            }
            
            if (!data.images || data.images.length === 0) {
              errors.push('No product images found');
            }
            
            if (errors.length > 0) {
              throw new Error('Validation failed: ' + errors.join(', '));
            }
            
            return { valid: true, data };
          `
        }
      }
    ]
  }
}
```

### Example 2: Form Automation

```json
{
  "name": "Submit Lead Form",
  "description": "Fill and submit contact form with validation",
  "definition": {
    "tasks": [
      {
        "name": "navigate_to_form",
        "agent_type": "browser",
        "action": "navigate",
        "parameters": {
          "url": "{{input.form_url}}",
          "waitUntil": "domcontentloaded"
        }
      },
      {
        "name": "wait_for_form_ready",
        "agent_type": "browser",
        "action": "evaluate",
        "parameters": {
          "script": `
            // Wait for form elements to be interactive
            return new Promise((resolve) => {
              const checkReady = () => {
                const form = document.querySelector('form.contact-form');
                const inputs = form?.querySelectorAll('input, textarea');
                const submitBtn = form?.querySelector('button[type=submit]');
                
                if (form && inputs && inputs.length > 0 && submitBtn && !submitBtn.disabled) {
                  resolve(true);
                } else {
                  setTimeout(checkReady, 500);
                }
              };
              checkReady();
            });
          `
        }
      },
      {
        "name": "fill_name_field",
        "agent_type": "browser",
        "action": "type",
        "parameters": {
          "selector": "input[name='name'], #name, [placeholder*='Name']",
          "text": "{{input.name}}",
          "delay": 50
        }
      },
      {
        "name": "fill_email_field",
        "agent_type": "browser",
        "action": "type",
        "parameters": {
          "selector": "input[type='email'], input[name='email'], #email",
          "text": "{{input.email}}",
          "delay": 50
        }
      },
      {
        "name": "fill_message_field",
        "agent_type": "browser",
        "action": "type",
        "parameters": {
          "selector": "textarea[name='message'], #message, [placeholder*='Message']",
          "text": "{{input.message}}",
          "delay": 30
        }
      },
      {
        "name": "validate_form_before_submit",
        "agent_type": "browser",
        "action": "evaluate",
        "parameters": {
          "script": `
            const form = document.querySelector('form.contact-form');
            
            // Check if all required fields are filled
            const requiredFields = form.querySelectorAll('[required]');
            const emptyFields = Array.from(requiredFields).filter(field => !field.value);
            
            if (emptyFields.length > 0) {
              throw new Error('Required fields not filled: ' + emptyFields.map(f => f.name).join(', '));
            }
            
            // Validate email format
            const emailField = form.querySelector('input[type=email]');
            if (emailField && !emailField.value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
              throw new Error('Invalid email format');
            }
            
            return { valid: true };
          `
        }
      },
      {
        "name": "submit_form",
        "agent_type": "browser",
        "action": "click",
        "parameters": {
          "selector": "button[type='submit'], input[type='submit']"
        }
      },
      {
        "name": "wait_for_confirmation",
        "agent_type": "browser",
        "action": "evaluate",
        "parameters": {
          "script": `
            return new Promise((resolve, reject) => {
              const timeout = setTimeout(() => {
                reject(new Error('Confirmation message not received within 10 seconds'));
              }, 10000);
              
              const checkConfirmation = () => {
                const successMsg = document.querySelector('.success-message, .confirmation');
                const errorMsg = document.querySelector('.error-message, .form-error');
                
                if (successMsg) {
                  clearTimeout(timeout);
                  resolve({ success: true, message: successMsg.textContent });
                } else if (errorMsg) {
                  clearTimeout(timeout);
                  reject(new Error('Form submission error: ' + errorMsg.textContent));
                } else {
                  setTimeout(checkConfirmation, 500);
                }
              };
              
              checkConfirmation();
            });
          `
        }
      }
    ]
  }
}
```

### Example 3: Login Flow

```json
{
  "name": "Authenticated Session",
  "description": "Login and maintain session for subsequent requests",
  "definition": {
    "tasks": [
      {
        "name": "navigate_to_login",
        "agent_type": "browser",
        "action": "navigate",
        "parameters": {
          "url": "{{input.login_url}}",
          "waitUntil": "networkidle"
        }
      },
      {
        "name": "check_already_logged_in",
        "agent_type": "browser",
        "action": "evaluate",
        "parameters": {
          "script": `
            // Check if already logged in by looking for user menu or dashboard elements
            const userMenu = document.querySelector('.user-menu, .account-dropdown');
            const dashboard = document.querySelector('.dashboard, [data-logged-in]');
            
            return {
              alreadyLoggedIn: !!(userMenu || dashboard)
            };
          `
        }
      },
      {
        "name": "perform_login",
        "agent_type": "browser",
        "action": "evaluate",
        "parameters": {
          "script": `
            const status = {{tasks.check_already_logged_in}};
            
            if (status.alreadyLoggedIn) {
              return { skipped: true, reason: 'Already logged in' };
            }
            
            // Fill login form
            const usernameField = document.querySelector('input[name=username], input[type=email], #email');
            const passwordField = document.querySelector('input[name=password], input[type=password], #password');
            const submitBtn = document.querySelector('button[type=submit], input[type=submit]');
            
            if (!usernameField || !passwordField || !submitBtn) {
              throw new Error('Login form elements not found');
            }
            
            usernameField.value = '{{input.username}}';
            passwordField.value = '{{input.password}}';
            
            // Trigger submit
            submitBtn.click();
            
            return { submitted: true };
          `
        }
      },
      {
        "name": "verify_login_success",
        "agent_type": "browser",
        "action": "evaluate",
        "parameters": {
          "script": `
            return new Promise((resolve, reject) => {
              const timeout = setTimeout(() => {
                reject(new Error('Login verification timeout'));
              }, 15000);
              
              const checkLogin = () => {
                // Check for success indicators
                const userMenu = document.querySelector('.user-menu');
                const errorMsg = document.querySelector('.login-error, .error-message');
                
                if (userMenu) {
                  clearTimeout(timeout);
                  resolve({ success: true, loggedIn: true });
                } else if (errorMsg) {
                  clearTimeout(timeout);
                  reject(new Error('Login failed: ' + errorMsg.textContent));
                } else {
                  setTimeout(checkLogin, 500);
                }
              };
              
              checkLogin();
            });
          `
        }
      },
      {
        "name": "save_session_cookies",
        "agent_type": "browser",
        "action": "evaluate",
        "parameters": {
          "script": `
            // Extract session cookies for reuse
            const cookies = document.cookie.split(';').map(c => c.trim());
            const sessionCookies = cookies.filter(c => 
              c.includes('session') || c.includes('token') || c.includes('auth')
            );
            
            return {
              cookies: sessionCookies,
              timestamp: new Date().toISOString()
            };
          `
        }
      }
    ]
  }
}
```

## Prompt Optimization Tips

### 1. Use Clear Naming

```json
// ❌ BAD
{
  "name": "task1",
  "name": "do_thing",
  "name": "step"
}

// ✅ GOOD
{
  "name": "extract_product_title",
  "name": "validate_email_format",
  "name": "wait_for_page_load_complete"
}
```

### 2. Add Context Comments

```json
{
  "name": "extract_price",
  "description": "Extract price from product page. Handles multiple currency formats (USD, EUR, GBP). Returns null if price not found instead of throwing error to allow workflow to continue with partial data.",
  "action": "evaluate",
  "parameters": {
    "script": "/* extraction logic */"
  }
}
```

### 3. Specify Timeouts

```json
{
  "name": "wait_for_api_response",
  "action": "evaluate",
  "parameters": {
    "script": `
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('API response timeout after 30 seconds'));
        }, 30000); // Explicit timeout
        
        // ... wait logic
      });
    `,
    "timeout": 35000 // Browser timeout slightly higher than script timeout
  }
}
```

### 4. Handle Edge Cases

```typescript
{
  "name": "extract_with_fallbacks",
  "action": "evaluate",
  "parameters": {
    "script": `
      // Try multiple extraction strategies
      
      // Strategy 1: Standard selector
      let data = document.querySelector('.primary-selector')?.textContent;
      
      // Strategy 2: Fallback selector
      if (!data) {
        data = document.querySelector('.fallback-selector')?.textContent;
      }
      
      // Strategy 3: Data attribute
      if (!data) {
        data = document.querySelector('[data-value]')?.getAttribute('data-value');
      }
      
      // Strategy 4: Regex from page source
      if (!data) {
        const match = document.body.innerHTML.match(/targetValue":"([^"]+)"/);
        data = match ? match[1] : null;
      }
      
      // Final check
      if (!data) {
        console.warn('All extraction strategies failed');
        return { success: false, data: null, error: 'No data found' };
      }
      
      return { success: true, data, strategy: 'multiple_fallbacks' };
    `
  }
}
```

## Testing Prompts

### Manual Testing

```bash
# Test workflow with verbose logging
curl -X POST http://localhost:3000/api/v2/workflows/:id/execute \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "product_url": "https://example.com/product/123"
    },
    "options": {
      "verbose": true,
      "headless": false
    }
  }'
```

### Automated Testing

```typescript
// tests/workflows/prompts.test.ts
describe('Workflow Prompts', () => {
  it('should extract product data with all fields', async () => {
    const workflow = await workflowService.createWorkflow(productScrapingWorkflow);
    const execution = await orchestrator.execute(workflow.id, {
      product_url: 'https://example.com/product/test'
    });
    
    expect(execution.status).toBe('completed');
    expect(execution.result.title).toBeDefined();
    expect(execution.result.price).toBeGreaterThan(0);
    expect(execution.result.images).toHaveLength(expect.any(Number));
  });
  
  it('should handle missing data gracefully', async () => {
    const workflow = await workflowService.createWorkflow(productScrapingWorkflow);
    const execution = await orchestrator.execute(workflow.id, {
      product_url: 'https://example.com/nonexistent-product'
    });
    
    expect(execution.status).toBe('failed');
    expect(execution.error).toContain('Validation failed');
  });
});
```

## Prompt Engineering Checklist

- [ ] Clear, descriptive task names
- [ ] Explicit wait conditions
- [ ] Multiple fallback selectors
- [ ] Input validation
- [ ] Output validation
- [ ] Error messages with context
- [ ] Timeout specifications
- [ ] Success criteria defined
- [ ] Edge cases handled
- [ ] Comments explaining complex logic

## Common Pitfalls

### ❌ Brittle Selectors

```json
// Will break when HTML changes
{"selector": "body > div:nth-child(3) > div > span"}

// ✅ More resilient
{"selector": ".product-price, [data-price], #price"}
```

### ❌ Missing Waits

```json
// Might execute before content loads
[
  {"action": "navigate", "parameters": {"url": "..."}},
  {"action": "getText", "parameters": {"selector": ".content"}}
]

// ✅ Explicit wait
[
  {"action": "navigate", "parameters": {"url": "...", "waitUntil": "networkidle"}},
  {"action": "evaluate", "parameters": {"script": "/* wait for .content */"}},
  {"action": "getText", "parameters": {"selector": ".content"}}
]
```

### ❌ No Error Context

```json
// Generic error
{"error": "Failed to get text"}

// ✅ Detailed error
{
  "error": "Failed to extract product title",
  "details": {
    "selector": ".product-title",
    "page_url": "https://example.com/product/123",
    "available_selectors": [".title", ".name", "h1"],
    "timestamp": "2024-01-01T12:00:00Z"
  }
}
```

## Next Steps

- [external-integration-patterns.md](./external-integration-patterns.md) - Connect external systems
- [playbook-structure.md](./playbook-structure.md) - Create reusable workflows
- [Module 5: Automation](../module-5-automation/README.md) - Production deployment

---

> "Good prompts reduced our automation failure rate from 35% to under 5%." - Platform Engineer

> "Spending time on prompt engineering saved us hundreds of hours in maintenance." - Agency Lead
