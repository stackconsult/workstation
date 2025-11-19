# 7 Core Browser Actions: Complete Reference Guide

## Introduction

The 7 core browser actions form the foundation of all Workstation automation. Master these actions and you can automate any web-based task. This guide provides comprehensive documentation with code examples, business use cases, and troubleshooting tips.

**The 7 Core Actions:**
1. **navigate** - Load a webpage
2. **click** - Interact with elements
3. **type** - Enter text into inputs
4. **getText** - Extract text content
5. **screenshot** - Capture visual state
6. **getContent** - Retrieve HTML source
7. **evaluate** - Execute custom JavaScript

## Action 1: navigate(url, options?)

### Purpose
Load a webpage and wait for it to be ready for interaction.

### Syntax
```typescript
await agent.navigate(url: string, options?: NavigateOptions): Promise<void>

interface NavigateOptions {
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2';
  timeout?: number; // milliseconds
  referer?: string;
}
```

### Examples

**Basic Navigation:**
```typescript
// Navigate to URL
await agent.navigate('https://example.com');
```

**Wait for Network Idle:**
```typescript
// Wait for all network requests to complete (good for SPAs)
await agent.navigate('https://app.example.com/dashboard', {
  waitUntil: 'networkidle0',
  timeout: 30000 // 30 seconds
});
```

**Set Custom Referer:**
```typescript
// Appear to come from Google search
await agent.navigate('https://example.com', {
  referer: 'https://www.google.com/search?q=example'
});
```

### Business Use Cases

**E-commerce Price Monitoring:**
```typescript
// Navigate to competitor product page
await agent.navigate('https://competitor.com/products/widget-pro');
const price = await agent.getText('.price');
```

**Lead Generation:**
```typescript
// Navigate to company directory
await agent.navigate('https://directory.com/companies?industry=tech');
const companies = await agent.getText('.company-list');
```

### Troubleshooting

**Issue**: Page never loads (timeout)
**Solution**: Increase timeout or use `waitUntil: 'domcontentloaded'`

**Issue**: Page loads but content missing
**Solution**: Use `waitUntil: 'networkidle0'` for AJAX-heavy sites

**Issue**: Anti-bot detection triggers
**Solution**: Add delays, use residential proxies, randomize user agent

## Action 2: click(selector, options?)

### Purpose
Click an element on the page (button, link, checkbox, etc.).

### Syntax
```typescript
await agent.click(selector: string, options?: ClickOptions): Promise<void>

interface ClickOptions {
  button?: 'left' | 'right' | 'middle';
  clickCount?: number; // for double-click
  delay?: number; // delay between mousedown and mouseup
  timeout?: number;
}
```

### Examples

**Basic Click:**
```typescript
// Click login button
await agent.click('button[type="submit"]');
```

**Wait for Element Before Clicking:**
```typescript
// Wait up to 10 seconds for button to appear
await agent.click('#load-more-btn', { timeout: 10000 });
```

**Double-Click:**
```typescript
// Double-click to select text
await agent.click('.editable-field', { clickCount: 2 });
```

**Right-Click (Context Menu):**
```typescript
// Right-click to open context menu
await agent.click('.file-item', { button: 'right' });
```

### Business Use Cases

**Automated Login:**
```typescript
await agent.navigate('https://app.example.com/login');
await agent.type('#username', 'user@example.com');
await agent.type('#password', process.env.PASSWORD);
await agent.click('button[type="submit"]');
// Wait for redirect
await agent.waitForNavigation();
```

**Pagination Scraping:**
```typescript
let hasNextPage = true;
while (hasNextPage) {
  const data = await agent.getText('.data-list');
  // Process data...
  
  try {
    await agent.click('.next-page', { timeout: 2000 });
  } catch {
    hasNextPage = false;
  }
}
```

### Troubleshooting

**Issue**: Element not clickable (covered by another element)
**Solution**: Scroll element into view or wait for overlay to close

**Issue**: Click doesn't trigger action
**Solution**: Try `evaluate()` with `.click()` instead of Puppeteer click

**Issue**: Button appears but click fails
**Solution**: Add delay after page load: `await page.waitForTimeout(1000)`

## Action 3: type(selector, text, options?)

### Purpose
Enter text into input fields, textareas, or contenteditable elements.

### Syntax
```typescript
await agent.type(selector: string, text: string, options?: TypeOptions): Promise<void>

interface TypeOptions {
  delay?: number; // milliseconds between keystrokes
  timeout?: number;
}
```

### Examples

**Basic Text Entry:**
```typescript
// Type into input field
await agent.type('#search', 'workstation automation');
```

**Human-Like Typing:**
```typescript
// Type with random delay (50-150ms per keystroke)
await agent.type('#message', 'Hello world!', { delay: 100 });
```

**Clear and Type:**
```typescript
// Clear existing value first
await agent.evaluate((sel) => {
  document.querySelector(sel).value = '';
}, '#email');
await agent.type('#email', 'new@example.com');
```

### Business Use Cases

**Form Automation:**
```typescript
// Fill out contact form
await agent.type('#name', 'John Doe');
await agent.type('#email', 'john@example.com');
await agent.type('#company', 'Acme Corp');
await agent.type('#message', 'Interested in your services');
await agent.click('button[type="submit"]');
```

**Search Automation:**
```typescript
// Search for products
await agent.type('.search-input', 'wireless headphones');
await agent.click('.search-button');
await agent.waitForSelector('.search-results');
const results = await agent.getText('.product-title');
```

### Troubleshooting

**Issue**: Text not appearing in field
**Solution**: Click field first to focus: `await agent.click(selector); await agent.type(...)`

**Issue**: Only first character typed
**Solution**: Increase delay option or check for JavaScript interference

**Issue**: Special characters not working
**Solution**: Use `evaluate()` to set value directly for complex text

## Action 4: getText(selector)

### Purpose
Extract visible text content from one or more elements.

### Syntax
```typescript
await agent.getText(selector: string): Promise<string | string[]>
```

### Examples

**Extract Single Element:**
```typescript
// Get product price
const price = await agent.getText('.product-price');
console.log(price); // "$99.99"
```

**Extract Multiple Elements:**
```typescript
// Get all product names
const names = await agent.getText('.product-name');
console.log(names); // ["Product 1", "Product 2", "Product 3"]
```

**Extract from Table:**
```typescript
// Get all table cells in a column
const values = await agent.getText('table tr td:nth-child(2)');
```

### Business Use Cases

**Price Monitoring:**
```typescript
await agent.navigate('https://competitor.com/pricing');
const plans = {
  starter: await agent.getText('.plan-starter .price'),
  pro: await agent.getText('.plan-pro .price'),
  enterprise: await agent.getText('.plan-enterprise .price')
};
// Save to database
await savePricingData(plans);
```

**Job Board Scraping:**
```typescript
await agent.navigate('https://jobs.example.com/remote');
const jobTitles = await agent.getText('.job-title');
const companies = await agent.getText('.company-name');
const locations = await agent.getText('.location');

const jobs = jobTitles.map((title, i) => ({
  title,
  company: companies[i],
  location: locations[i]
}));
```

### Troubleshooting

**Issue**: getText returns empty string
**Solution**: Element may be hidden, check CSS display property

**Issue**: getText returns unexpected content
**Solution**: Inspect element to verify selector matches intended target

**Issue**: Getting duplicate text
**Solution**: Refine selector to be more specific (add classes, IDs)

## Action 5: screenshot(path, options?)

### Purpose
Capture a screenshot of the current page or specific element.

### Syntax
```typescript
await agent.screenshot(path: string, options?: ScreenshotOptions): Promise<void>

interface ScreenshotOptions {
  type?: 'png' | 'jpeg';
  quality?: number; // 0-100, for jpeg only
  fullPage?: boolean;
  clip?: { x: number; y: number; width: number; height: number };
  omitBackground?: boolean;
}
```

### Examples

**Full Page Screenshot:**
```typescript
// Capture entire page
await agent.screenshot('./output/page.png', { fullPage: true });
```

**Visible Viewport Only:**
```typescript
// Capture what's currently visible
await agent.screenshot('./output/viewport.png');
```

**Element Screenshot:**
```typescript
// Capture specific element
const element = await page.$('.product-card');
await element.screenshot({ path: './output/product.png' });
```

**JPEG with Quality:**
```typescript
// Smaller file size
await agent.screenshot('./output/page.jpg', {
  type: 'jpeg',
  quality: 80
});
```

### Business Use Cases

**Visual Regression Testing:**
```typescript
// Before change
await agent.navigate('https://app.example.com');
await agent.screenshot('./baseline/homepage.png');

// After change
await agent.screenshot('./current/homepage.png');

// Compare with pixelmatch library
const diff = compareImages('./baseline/homepage.png', './current/homepage.png');
if (diff > 0.1) {
  alert('Visual regression detected!');
}
```

**Audit Trail:**
```typescript
// Capture evidence of competitor pricing
await agent.navigate('https://competitor.com/pricing');
const timestamp = new Date().toISOString();
await agent.screenshot(`./audit/${timestamp}-competitor-pricing.png`, {
  fullPage: true
});
```

### Troubleshooting

**Issue**: Screenshot is black or white
**Solution**: Wait for page load: `await page.waitForSelector('body')`

**Issue**: Elements cut off in fullPage screenshot
**Solution**: Scroll to bottom before screenshot to trigger lazy loading

**Issue**: File size too large
**Solution**: Use jpeg with quality: 70-80 for reasonable compression

## Action 6: getContent()

### Purpose
Retrieve the full HTML source of the current page.

### Syntax
```typescript
await agent.getContent(): Promise<string>
```

### Examples

**Get Full HTML:**
```typescript
const html = await agent.getContent();
console.log(html.length); // 50000+ characters
```

**Parse HTML with Cheerio:**
```typescript
import * as cheerio from 'cheerio';

const html = await agent.getContent();
const $ = cheerio.load(html);

// Extract structured data
const products = [];
$('.product').each((i, elem) => {
  products.push({
    name: $(elem).find('.name').text(),
    price: $(elem).find('.price').text(),
    image: $(elem).find('img').attr('src')
  });
});
```

### Business Use Cases

**Structured Data Extraction:**
```typescript
await agent.navigate('https://directory.com/companies');
const html = await agent.getContent();

// Parse with regex or cheerio
const companies = extractCompanies(html);
await saveToDatabase(companies);
```

**Meta Tag Analysis:**
```typescript
const html = await agent.getContent();
const $ = cheerio.load(html);

const meta = {
  title: $('title').text(),
  description: $('meta[name="description"]').attr('content'),
  keywords: $('meta[name="keywords"]').attr('content'),
  ogImage: $('meta[property="og:image"]').attr('content')
};
```

### Troubleshooting

**Issue**: HTML doesn't match browser view
**Solution**: Wait for dynamic content: use `waitUntil: 'networkidle0'`

**Issue**: Missing AJAX-loaded content
**Solution**: Use `evaluate()` to get rendered DOM instead of initial HTML

## Action 7: evaluate(script, ...args)

### Purpose
Execute custom JavaScript in the browser context.

### Syntax
```typescript
await agent.evaluate<T>(script: Function | string, ...args: any[]): Promise<T>
```

### Examples

**Get Computed Style:**
```typescript
const color = await agent.evaluate(() => {
  const elem = document.querySelector('.product-title');
  return window.getComputedStyle(elem).color;
});
```

**Trigger Events:**
```typescript
// Trigger change event on select
await agent.evaluate((selector) => {
  const select = document.querySelector(selector);
  select.dispatchEvent(new Event('change', { bubbles: true }));
}, '#country-select');
```

**Extract Complex Data:**
```typescript
const productData = await agent.evaluate(() => {
  return Array.from(document.querySelectorAll('.product')).map(p => ({
    name: p.querySelector('.name')?.textContent,
    price: parseFloat(p.querySelector('.price')?.textContent.replace('$', '')),
    inStock: !p.querySelector('.out-of-stock'),
    rating: p.querySelector('.stars')?.getAttribute('data-rating')
  }));
});
```

**Infinite Scroll:**
```typescript
// Scroll to bottom to load more content
await agent.evaluate(() => {
  window.scrollTo(0, document.body.scrollHeight);
});
await agent.waitForTimeout(2000); // Wait for content to load
```

### Business Use Cases

**Dynamic Content Extraction:**
```typescript
// Extract data that requires JavaScript to render
const data = await agent.evaluate(() => {
  const dataLayer = window.dataLayer || [];
  return dataLayer.find(event => event.event === 'productView');
});
```

**Bypass Restrictions:**
```typescript
// Remove overlays blocking content
await agent.evaluate(() => {
  document.querySelectorAll('.modal-overlay').forEach(el => el.remove());
  document.querySelectorAll('.popup').forEach(el => el.remove());
});
```

### Troubleshooting

**Issue**: evaluate() returns undefined
**Solution**: Ensure function returns a value, not relying on implicit return

**Issue**: Can't access Node.js variables
**Solution**: Pass variables as arguments to evaluate function

**Issue**: Complex objects not returned
**Solution**: Return JSON-serializable data only (no DOM nodes, functions)

## Combining Actions: Real-World Workflows

### Example 1: E-commerce Product Scraper

```typescript
async function scrapeProduct(url: string) {
  const agent = new BrowserAgent();
  
  // 1. Navigate
  await agent.navigate(url, { waitUntil: 'networkidle0' });
  
  // 2. Extract data
  const name = await agent.getText('h1.product-name');
  const price = await agent.getText('.price');
  const description = await agent.getText('.description');
  
  // 3. Click to see more details
  await agent.click('.view-details');
  await agent.waitForSelector('.full-description');
  const fullDescription = await agent.getText('.full-description');
  
  // 4. Take screenshot
  await agent.screenshot(`./products/${name}.png`);
  
  // 5. Get structured data
  const specs = await agent.evaluate(() => {
    return Array.from(document.querySelectorAll('.spec-row')).reduce((acc, row) => {
      const key = row.querySelector('.spec-name')?.textContent;
      const value = row.querySelector('.spec-value')?.textContent;
      if (key && value) acc[key] = value;
      return acc;
    }, {});
  });
  
  return { name, price, description, fullDescription, specs };
}
```

### Example 2: Automated Login and Data Export

```typescript
async function exportUserData() {
  const agent = new BrowserAgent();
  
  // 1. Navigate and login
  await agent.navigate('https://app.example.com/login');
  await agent.type('#email', process.env.USER_EMAIL);
  await agent.type('#password', process.env.USER_PASSWORD);
  await agent.click('button[type="submit"]');
  
  // 2. Wait for dashboard
  await agent.waitForSelector('.dashboard');
  
  // 3. Navigate to export page
  await agent.click('a[href="/export"]');
  await agent.waitForSelector('.export-options');
  
  // 4. Configure export
  await agent.click('#format-csv');
  await agent.click('#include-all');
  
  // 5. Trigger export
  await agent.click('button.export-btn');
  
  // 6. Wait for download (monitor downloads folder)
  await agent.waitForTimeout(5000);
  
  console.log('Export completed!');
}
```

## Performance Optimization

### Use Efficient Selectors

**Slow:**
```typescript
await agent.getText('div div div span.price'); // Inefficient
```

**Fast:**
```typescript
await agent.getText('.product-price'); // Direct class
await agent.getText('#price-123'); // ID lookup
await agent.getText('[data-testid="price"]'); // Data attribute
```

### Batch Operations

**Slow:**
```typescript
for (const link of links) {
  await agent.click(link);
  const data = await agent.getText('.data');
  // Process...
}
```

**Fast:**
```typescript
const allData = await agent.evaluate(() => {
  return Array.from(document.querySelectorAll('.link')).map(link => {
    link.click();
    return document.querySelector('.data')?.textContent;
  });
});
```

### Reuse Browser Instances

**Slow:**
```typescript
for (const url of urls) {
  const agent = new BrowserAgent(); // New browser each time
  await agent.navigate(url);
  // ...
  await agent.close();
}
```

**Fast:**
```typescript
const agent = new BrowserAgent(); // Reuse browser
for (const url of urls) {
  await agent.navigate(url);
  // ...
}
await agent.close();
```

## Security Best Practices

1. **Never hardcode credentials**: Use environment variables
2. **Sanitize extracted data**: Prevent injection attacks
3. **Respect robots.txt**: Check before scraping
4. **Rate limiting**: Add delays between requests
5. **User agent rotation**: Avoid detection
6. **Proxy rotation**: Distribute requests across IPs

## Next Steps

- **Build workflows**: [Workflow Execution Guide](./workflow-execution.md)
- **Handle errors**: [Error Handling Patterns](./error-handling.md)
- **Create UI**: [Browser Extension Wiring](./browser-extension-wiring.md)
