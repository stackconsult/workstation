# Module 3: Browser Agents

## Overview

Master the 7 core browser automation actions that power the Workstation system. Learn to build complex web scraping workflows, handle dynamic content, and integrate browser automation with your business processes.

## Learning Objectives

By the end of this module, you will:

- **Master the 7 Core Actions**: navigate, click, type, getText, screenshot, getContent, evaluate
- **Build Multi-Step Workflows**: Chain actions into complete automation sequences
- **Handle Dynamic Content**: Wait for elements, handle AJAX, deal with SPAs
- **Debug Browser Issues**: Use screenshots and console logs to troubleshoot
- **Connect to UI Extensions**: Wire browser automation to Chrome/Firefox extensions

## Prerequisites

- Module 1: Clone & Configure (completed)
- Module 2: Architecture Deep Dive (completed)
- Chrome or Firefox browser installed
- Basic understanding of CSS selectors and DOM

## Files in This Module

- **7-core-actions.md** - Detailed guide for all 7 browser actions with code examples
- **workflow-execution.md** - Build multi-step workflows with variable passing
- **error-handling.md** - Timeout strategies, retry logic, debugging techniques
- **browser-extension-wiring.md** - Connect automation to browser UI extensions

## What You'll Build

By the end of this module, you will have built:

✅ A web scraper that extracts product data  
✅ An automated login flow  
✅ A screenshot capture tool  
✅ A multi-page data extraction workflow  
✅ A browser extension that triggers automation

## Time to Complete

- **Core Actions**: 2-3 hours
- **Workflow Execution**: 1-2 hours
- **Error Handling**: 1 hour
- **Browser Extension**: 2 hours
- **Total**: 6-8 hours

## Quick Start

```typescript
// Example: Simple web scraper
import { BrowserAgent } from './src/automation/agents/core/BrowserAgent';

const agent = new BrowserAgent();

// Navigate to website
await agent.navigate('https://example.com');

// Extract text
const title = await agent.getText('h1');
const description = await agent.getText('p');

// Take screenshot
await agent.screenshot('./output/example.png');

console.log({ title, description });
```

## Business Applications

### For Agencies

**Service Packages You Can Build:**
- **Competitive Monitoring**: $1,000-$2,000/month - Daily price/feature tracking
- **Lead Generation**: $1,500-$3,000/month - Automated prospect research
- **QA Testing**: $800-$1,500/month - Automated regression testing
- **Content Aggregation**: $500-$1,000/month - Multi-site content collection

**Example**: E-commerce Monitoring Package
- Monitor 10 competitors daily
- Extract: prices, stock status, product descriptions
- Alert on price changes >10%
- Deliver: Daily Slack reports + weekly Excel exports
- **Price**: $1,500/month | **Cost**: $50/month hosting + 2 hours/month maintenance = **97% margin**

### For Founders

**Internal Automation Use Cases:**
- **Market Research**: Automate competitor analysis, save 10+ hours/week
- **Lead Qualification**: Extract company data from LinkedIn, Crunchbase
- **Content Curation**: Aggregate industry news from 20+ sources daily
- **Testing**: Automated user flow testing before releases

**Example**: Startup Market Research Workflow
- Daily: Scrape 5 competitor websites
- Extract: Pricing pages, feature lists, blog posts
- Compare: Track changes over time
- Output: Weekly summary email with insights
- **Time Saved**: 10 hours/week | **Value**: $500-$1,000/week

### For Platform Engineers

**Infrastructure Capabilities:**
- **Headless Browser**: Puppeteer/Playwright for server-side automation
- **Distributed Execution**: Scale to 100+ concurrent browser instances
- **Screenshot API**: Generate on-demand screenshots for any URL
- **SEO Monitoring**: Track page performance, meta tags, schema markup

### For Senior Developers

**Technical Patterns:**
- **Page Object Model**: Organize selectors and actions
- **Async/Await**: Handle asynchronous browser operations
- **Error Boundaries**: Graceful failure handling
- **Test Automation**: Integrate with Jest, Cypress, Playwright Test

## Module Roadmap

### Week 1: Core Actions Mastery
- **Day 1-2**: navigate, click, type (interactive actions)
- **Day 3-4**: getText, getContent (data extraction)
- **Day 5**: screenshot, evaluate (advanced actions)

### Week 2: Workflow Building
- **Day 1-2**: Multi-step workflows (login → navigate → extract)
- **Day 3-4**: Variable passing between actions
- **Day 5**: Conditional workflows (if-then-else logic)

### Week 3: Production Readiness
- **Day 1-2**: Error handling and retry strategies
- **Day 3**: Debugging techniques (screenshots, console logs)
- **Day 4-5**: Browser extension integration

## Success Metrics

Track your progress with these metrics:

- **Action Mastery**: Successfully use all 7 core actions
- **Workflow Complexity**: Build 5-step+ workflows
- **Error Rate**: <5% failure rate on production workflows
- **Execution Speed**: <10 seconds for simple workflows
- **Extension Integration**: Successfully trigger automation from UI

## Common Pitfalls to Avoid

❌ **Don't**: Use static waits (`sleep(5000)`) - brittle and slow  
✅ **Do**: Use dynamic waits (`waitForSelector()`) - reliable and fast

❌ **Don't**: Hard-code selectors in workflows  
✅ **Do**: Use selector configuration files for easy updates

❌ **Don't**: Ignore error handling  
✅ **Do**: Wrap browser actions in try-catch with fallbacks

❌ **Don't**: Run 100+ concurrent browsers on single instance  
✅ **Do**: Use worker instances or browser pools

❌ **Don't**: Store sensitive data in screenshots  
✅ **Do**: Redact sensitive info before capturing

## Hands-On Exercises

### Exercise 1: Product Price Tracker (30 minutes)

Build an automation that:
1. Navigates to e-commerce product page
2. Extracts product name and price
3. Takes screenshot
4. Saves data to JSON file

**Acceptance Criteria:**
- Handles loading states
- Extracts correct price (removing currency symbols)
- Screenshot shows product clearly
- JSON file contains structured data

### Exercise 2: Login Flow Automation (45 minutes)

Build an automation that:
1. Navigates to login page
2. Fills in username and password
3. Clicks login button
4. Waits for redirect to dashboard
5. Verifies successful login (checks for user profile element)

**Acceptance Criteria:**
- Handles 2FA (manual bypass for exercise)
- Waits for successful login before proceeding
- Captures screenshot on failure
- Returns success/failure boolean

### Exercise 3: Multi-Page Data Extraction (60 minutes)

Build an automation that:
1. Navigates to listing page
2. Extracts links to all products
3. Loops through each product link
4. Extracts details from each product page
5. Compiles data into CSV

**Acceptance Criteria:**
- Handles pagination (extracts from 3+ pages)
- Gracefully handles missing elements
- Includes retry logic for failed pages
- CSV has clean, structured data

## Real-World Case Studies

### Case Study 1: Agency Success Story

**Client**: B2B SaaS company  
**Challenge**: Track 15 competitors' pricing pages daily  
**Solution**: Browser automation workflow with Slack alerts  
**Results**:
- 20 hours/week of manual work eliminated
- Price changes detected within 1 hour
- Client increased prices 12% based on competitive data
- **Agency Revenue**: $1,800/month recurring

### Case Study 2: Founder Success Story

**Founder**: Solo SaaS founder  
**Challenge**: Generate leads from 5 industry directories  
**Solution**: Automated scraper + email validator + CRM integration  
**Results**:
- 500 qualified leads/month vs 50 manual
- 90% time reduction in lead generation
- Closed 2 enterprise deals from automated leads
- **Value**: $120,000 ARR attributed to automation

### Case Study 3: Platform Engineer Success Story

**Company**: QA testing platform  
**Challenge**: Test 100+ user flows across 3 browsers  
**Solution**: Distributed browser automation with Playwright  
**Results**:
- 6 hours → 20 minutes for full regression suite
- 95% test coverage vs 60% manual
- Caught 23 critical bugs before production
- **ROI**: $200,000/year in prevented downtime

## Tools and Technologies

### Browser Automation Libraries

**Puppeteer** (Default)
- Pros: Fast, mature, Chrome DevTools Protocol
- Cons: Chrome/Chromium only
- Best for: High-performance automation, screenshots

**Playwright** (Alternative)
- Pros: Multi-browser (Chrome, Firefox, Safari), modern API
- Cons: Larger bundle size
- Best for: Cross-browser testing, enterprise

**Selenium** (Legacy)
- Pros: Mature, wide language support
- Cons: Slower, more complex API
- Best for: Existing Selenium infrastructure

### Selector Strategies

1. **CSS Selectors**: `document.querySelector('.product-price')`
2. **XPath**: `//div[@class='product-price']`
3. **Data Attributes**: `[data-testid="price"]`
4. **Text Content**: `text=Add to Cart`

**Best Practice**: Use `data-testid` attributes for stability

### Debugging Tools

- **Chrome DevTools**: Inspect element, network tab, console
- **Playwright Inspector**: Step through automation visually
- **Screenshot Diffing**: Compare screenshots for visual regression
- **HAR Files**: Record network traffic for replay

## Next Steps

1. **Start with Core Actions**: Read [7 Core Actions Guide](./7-core-actions.md)
2. **Build First Workflow**: Follow [Workflow Execution](./workflow-execution.md)
3. **Add Error Handling**: Implement patterns from [Error Handling](./error-handling.md)
4. **Create Extension**: Build UI with [Browser Extension Wiring](./browser-extension-wiring.md)

## Additional Resources

- **Puppeteer Docs**: https://pptr.dev/
- **Playwright Docs**: https://playwright.dev/
- **CSS Selectors**: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors
- **XPath Tutorial**: https://www.w3schools.com/xml/xpath_intro.asp
- **Browser Automation Patterns**: Martin Fowler's patterns catalog

## Support and Community

- **GitHub Issues**: Report bugs or request features
- **Discord Community**: Join #browser-automation channel
- **Office Hours**: Weekly Q&A sessions (Fridays 2-3 PM EST)
- **Example Repository**: github.com/workstation/examples

## Certificate

Upon completing this module, you'll receive a "Browser Automation Expert" certificate demonstrating your ability to build production-grade web scraping and automation workflows.

**Requirements for Certificate:**
- Complete all 3 hands-on exercises
- Build 1 custom workflow (10+ actions)
- Pass final assessment (15 questions, 80% passing)
- Submit working code to GitHub

---

**Ready to master browser automation?** Start with [7 Core Actions →](./7-core-actions.md)
