# Agent #17: AI-Powered Project Builder with Browser Automation

## Purpose
Build a GitHub Coding Agent that generates comprehensive, production-ready project prompts following a "free before paid" philosophy with BYOK (Bring Your Own Key) integrations. Now includes advanced browser automation capabilities for web scraping, search, and data extraction.

## Architecture
- **Type**: Node.js-based with TypeScript
- **Runtime**: Node.js 18+
- **Dependencies**: Playwright, Jest, TypeScript, ESLint
- **Philosophy**: Free open-source tools first, optional BYOK for premium features
- **New Capabilities**: Web search, form filling, element clicking, data extraction

## What This Agent Does

Agent #17 creates detailed project prompts that other AI agents (like GitHub Copilot) can execute to build complete, production-ready applications. **Now enhanced with browser automation capabilities** for web scraping, searching, and data extraction. It follows these core principles:

1. **Free Before Paid**: Always use free, open-source tools as defaults
2. **BYOK Optional**: Premium services require user-provided API keys
3. **Production Ready**: 80%+ test coverage, CI/CD, full documentation
4. **Security First**: No hardcoded secrets, secure key storage

## Inputs

### Configuration Files
- `agent-prompt.yml` - Complete agent specification
- Project templates in `templates/` directory
- Example prompts in `examples/` directory

### Environment Variables
None required for core functionality. BYOK services need user-provided keys:
- `OPENAI_API_KEY` (optional) - For OpenAI integrations
- `ANTHROPIC_API_KEY` (optional) - For Claude integrations
- `SENDGRID_API_KEY` (optional) - For email notifications
- `SLACK_WEBHOOK_URL` (optional) - For Slack alerts

### Triggers
- Manual: Run prompt generator on demand
- Scheduled: Generate project templates weekly
- Event-based: Auto-generate on new template requests

## Outputs

### Files Generated
- Complete project prompts (Markdown files)
- Project structure diagrams
- Configuration examples (.env.example, tsconfig.json, etc.)
- GitHub Actions workflows
- Test specifications

### Side Effects
- Creates example projects in `examples/` directory
- Updates template library
- Validates prompt completeness

### Reports
- Prompt generation summary
- Free vs BYOK service usage
- Project build success rates

## Integration Points

### Related Agents
- Can be used by any developer or AI agent
- Complements CI/CD workflows
- Integrates with GitHub Actions

### Workflows Triggered
- `build-projects.yml` - Generates projects from prompts
- `validate-prompts.yml` - Validates prompt quality

### Services Accessed
- GitHub Actions (free)
- npm registry (free)
- Optional BYOK services (user's own keys)

## Technology Stack

### Free (Default)
- **Playwright** (v1.40+) - Browser automation
- **TypeScript** (v5.3+) - Type safety
- **Jest** (v29.7+) - Testing framework
- **ESLint** (v8.0+) - Code linting
- **GitHub Actions** - CI/CD automation

### BYOK (Optional - User Provides Keys)
- **OpenAI API** - Advanced AI features
- **Anthropic Claude** - Long context analysis
- **SendGrid** - Email notifications
- **Slack** - Team notifications
- **AWS/GCP** - Cloud services

### Free Alternatives to BYOK
- **OpenAI** → Ollama (local LLMs)
- **SendGrid** → nodemailer with Gmail SMTP
- **Slack** → GitHub issue comments
- **AWS S3** → GitHub artifacts
- **Monitoring** → GitHub Actions logs

## Quick Start

### Installation
```bash
cd agents/agent17
npm install
npx playwright install chromium  # Install browser
npm test          # Run tests
npm run build     # Compile TypeScript
```

### Using Browser Automation Features (NEW)

```typescript
import Agent17 from './src/index.js';

const agent = new Agent17({ headless: true, logLevel: 'info' });
await agent.initialize();

// Web Search (FREE)
const searchResults = await agent.search({
  query: 'best price tracking tools',
  searchEngine: 'google',
  maxResults: 10
});

// Multi-Engine Search (FREE)
const multiResults = await agent.multiSearch(
  'competitor pricing strategies',
  ['google', 'bing', 'duckduckgo']
);

// Click Element (FREE)
await agent.clickElement({
  url: 'https://example.com',
  selector: '#buy-now-button',
  waitAfterClick: 2000
});

// Fill Form (FREE)
await agent.fillForm({
  url: 'https://example.com/contact',
  fields: {
    '#name': 'John Doe',
    '#email': 'john@example.com',
    '#message': 'Hello!'
  },
  submitSelector: '#submit-button'
});

// Extract Data (FREE)
const data = await agent.extractData({
  url: 'https://example.com/product',
  selectors: {
    price: '.product-price',
    title: 'h1.product-title',
    rating: '.star-rating'
  },
  takeScreenshot: true
});

// Extract with Fallback Selectors (FREE)
const reliableData = await agent.extractWithFallback(
  'https://example.com/product',
  {
    price: [
      '[data-testid="price"]',
      '.price-value',
      '#product-price',
      '.pricing span'
    ]
  }
);

// Close when done
await agent.close();
```

### Generate a Project Prompt
```bash
npm run generate -- --template competitor-tracker
```

This creates a complete prompt in `output/competitor-tracker-prompt.md` that you can paste into GitHub Copilot to build the project.

### Available Templates
1. **competitor-tracker** - E-commerce price monitoring
2. **web-scraper** - General web scraping framework
3. **api-wrapper** - Type-safe API client
4. **automation-suite** - Browser automation tests
5. **data-pipeline** - ETL data processing

## Example Usage

### 1. Generate Competitor Price Tracker
```bash
npm run generate -- --template competitor-tracker --output ./my-price-tracker.md
```

### 2. Copy prompt to GitHub Copilot
Open VS Code, press Cmd+Shift+I (or Ctrl+Shift+I), paste the generated prompt.

### 3. Watch AI Build Your Project
GitHub Copilot will generate:
- Complete TypeScript project structure
- All scraper implementations
- Test suites (80%+ coverage)
- GitHub Actions workflows
- Complete documentation

### 4. Add Optional BYOK Services
Edit `.env` to add your own API keys:
```env
# Optional - only if you want email alerts
SENDGRID_API_KEY=your-key-here

# Optional - only if you want Slack notifications  
SLACK_WEBHOOK_URL=your-webhook-here
```

Project works perfectly fine without any keys!

## Testing

```bash
npm test                 # Run all tests
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests
npm run test:coverage    # Coverage report (must be 80%+)
```

## Configuration

### .env.example (No Keys Required)
```env
# Core settings (no API keys needed)
NODE_ENV=development
LOG_LEVEL=info

# Optional BYOK Services (uncomment to use)
# OPENAI_API_KEY=sk-...
# ANTHROPIC_API_KEY=sk-ant-...
# SENDGRID_API_KEY=SG...
# SLACK_WEBHOOK_URL=https://hooks.slack.com/...
```

### Free Alternatives Are Always Shown
Every BYOK service includes free alternative instructions in the generated prompts.

## Best Practices

### For Prompt Generation
1. Always provide free alternatives to BYOK services
2. Include complete code examples
3. Specify 80%+ test coverage requirement
4. Add error handling patterns
5. Include GitHub Actions workflows
6. Document all environment variables

### For BYOK Integration
1. Make all premium services optional
2. Validate keys before use
3. Graceful degradation when keys missing
4. Clear setup instructions
5. Never commit .env file
6. Document free alternatives

### For Security
1. Use .env for all secrets
2. Validate all user inputs
3. Follow principle of least privilege
4. Rotate keys regularly
5. Monitor API usage
6. Log security events

## CI/CD Integration

### GitHub Actions (Free)
Agent #17 automatically includes GitHub Actions workflows in all generated projects:

```yaml
name: Build and Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test
      - run: npm run build
```

### Scheduled Tasks
```yaml
name: Run Scraper
on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
jobs:
  scrape:
    runs-on: ubuntu-latest
    steps:
      - run: npm run scrape
```

## Troubleshooting

### Issue: Generated prompt doesn't work
**Solution**: Validate prompt completeness with:
```bash
npm run validate -- --file output/my-prompt.md
```

### Issue: Want to add BYOK service
**Solution**: Edit template and add:
```yaml
byok_service:
  my_service:
    optional: true
    requires: "MY_API_KEY environment variable"
    free_alternative: "Alternative service name"
```

### Issue: Need higher test coverage
**Solution**: Prompts always specify 80%+ coverage. AI will generate comprehensive tests.

## Contributing

To add a new project template:

1. Create template in `templates/new-template/`
2. Add prompt structure
3. Include free alternatives for all BYOK
4. Test prompt generates working project
5. Document in README
6. Submit PR

## Performance

- Prompt generation: < 1 second
- Project scaffolding: < 5 seconds
- Full project build by AI: 2-5 minutes
- Test execution: Varies by project size

## Monitoring

Agent #17 tracks:
- Number of prompts generated
- Project build success rates
- Free vs BYOK service adoption
- Test coverage achieved
- Common failure patterns

## Success Metrics

A generated project is successful when:
- ✅ AI builds it without errors
- ✅ `npm install` works
- ✅ `npm test` passes (80%+ coverage)
- ✅ `npm run build` succeeds
- ✅ GitHub Actions workflows run
- ✅ Project works without API keys (BYOK optional)
- ✅ README complete and accurate

## Example Projects

See `examples/` directory for complete working examples:
- `competitor-tracker.md` - Full price tracking system
- `web-scraper.md` - General scraper framework
- `api-wrapper.md` - Type-safe API client

Each example can be pasted into GitHub Copilot to generate a complete, production-ready project in minutes.

## License

ISC License - Free to use, modify, and distribute

## Support

For issues or questions:
1. Check documentation in `agent-prompt.yml`
2. Review example prompts in `examples/`
3. Open GitHub issue
4. Follow free-before-paid philosophy

---

**Remember**: This agent prioritizes free, open-source solutions. BYOK services are always optional enhancements, never requirements.

---

## 🆕 Browser Automation Capabilities

Agent #17 now includes powerful browser automation features built on Playwright (FREE).

### Available Tools

#### 1. Web Search (FREE)
Search across Google, Bing, or DuckDuckGo:
```typescript
const results = await agent.search({
  query: 'best web scraping tools 2024',
  searchEngine: 'google',
  maxResults: 10
});
```

**Multi-Engine Search**:
```typescript
const aggregated = await agent.multiSearch(
  'competitor analysis tools',
  ['google', 'bing', 'duckduckgo']
);
// Returns deduplicated results from all engines
```

#### 2. Click Elements (FREE)
Automate button clicks and navigation:
```typescript
await agent.clickElement({
  url: 'https://example.com/products',
  selector: '#view-details-btn',
  waitAfterClick: 2000  // Wait 2 seconds after click
});
```

#### 3. Fill Forms (FREE)
Automatically fill and submit forms:
```typescript
await agent.fillForm({
  url: 'https://example.com/signup',
  fields: {
    '#username': 'testuser',
    '#email': 'test@example.com',
    '#password': 'SecurePass123',
    '#terms-checkbox': true  // Checkbox
  },
  submitSelector: '#signup-button',
  waitAfterSubmit: 3000
});
```

**Supported Field Types**:
- Text inputs
- Textareas
- Select dropdowns
- Checkboxes
- Radio buttons

#### 4. Extract Data (FREE)
Extract structured data from web pages:
```typescript
const productData = await agent.extractData({
  url: 'https://example.com/product/123',
  selectors: {
    title: 'h1.product-name',
    price: '.price-current',
    rating: '.product-rating',
    reviews: '.review-count',
    availability: '.stock-status'
  },
  extractMultiple: {
    reviews: false,  // Extract single element
    features: true   // Extract all matching elements
  },
  takeScreenshot: true,
  fullPageScreenshot: false
});
```

#### 5. Extract with Fallback (FREE)
Use multiple selector strategies for reliability:
```typescript
const reliableExtraction = await agent.extractWithFallback(
  'https://amazon.com/dp/B08L5VN58M',
  {
    price: [
      '[data-testid="price-whole"]',    // Best
      '[aria-label*="price"]',           // Good
      '#priceblock_ourprice',            // Okay
      '.a-price .a-offscreen'            // Fallback
    ],
    title: [
      '#productTitle',
      'h1.product-title',
      '.product-name'
    ]
  }
);
// Tries each selector in order until one works
```

#### 6. Navigate & Screenshot (FREE)
Simple navigation and screenshots:
```typescript
// Navigate
const page = await agent.navigate('https://example.com');
console.log(page.url, page.title);

// Screenshot
const screenshot = await agent.screenshot(
  'https://example.com',
  { fullPage: true, path: './screenshot.png' }
);
```

### Browser Manager Features

The `BrowserManager` class provides:
- **Page Pooling**: Reuse browser pages for performance
- **Automatic Retry**: Built-in retry logic with exponential backoff
- **Error Handling**: Graceful degradation on failures
- **Resource Management**: Automatic cleanup of browser resources
- **User Agent Spoofing**: Avoid bot detection
- **Network Interception**: Modify requests/responses (advanced)

### Selector Strategies

Agent #17 follows best practices for reliable web scraping:

**Recommended Selector Hierarchy**:
1. **data-testid** (most reliable, rarely changes)
2. **aria-label** (accessible, semantic, stable)
3. **id** (unique but may change)
4. **class + structure** (use as fallback only)

**Example**:
```typescript
// Good: Multiple fallbacks
const priceSelectors = [
  '[data-testid="price"]',
  '[aria-label*="price"]',
  '#product-price',
  '.price-value'
];

// Bad: Single brittle selector
const badSelector = '.container > div:nth-child(3) > span.text-lg';
```

### Error Handling

All tools include automatic retry with exponential backoff:

```typescript
// Automatically retries up to 3 times
const result = await agent.search({
  query: 'test query',
  searchEngine: 'google'
});

// Custom retry configuration via utility
import { withRetry } from './src/utils/retry.js';

await withRetry(
  async () => {
    // Your code here
  },
  maxRetries: 5,
  baseDelay: 2000
);
```

### Performance Optimization

**Page Pooling**:
```typescript
const manager = new BrowserManager({ maxPages: 10 });

// Pages are automatically reused
const page1 = await manager.getPage();
await manager.releasePage(page1);  // Returns to pool

const page2 = await manager.getPage();  // Reuses page1
```

**Parallel Execution**:
```typescript
// Run multiple searches in parallel
const [google, bing, duck] = await Promise.all([
  agent.search({ query: 'test', searchEngine: 'google' }),
  agent.search({ query: 'test', searchEngine: 'bing' }),
  agent.search({ query: 'test', searchEngine: 'duckduckgo' })
]);
```

### Use Cases

**1. Competitor Price Tracking**:
```typescript
const competitors = ['amazon.com', 'bestbuy.com', 'walmart.com'];

for (const site of competitors) {
  const price = await agent.extractWithFallback(
    `https://${site}/product/${productId}`,
    {
      price: [
        '[data-testid="price"]',
        '.product-price',
        '#price'
      ]
    }
  );
  console.log(`${site}: ${price.data.extracted.price}`);
}
```

**2. Market Research**:
```typescript
// Search multiple engines for comprehensive results
const research = await agent.multiSearch(
  'AI coding assistants comparison',
  ['google', 'bing', 'duckduckgo']
);

// Extract details from top results
for (const result of research.data.results.slice(0, 5)) {
  const details = await agent.extractData({
    url: result.url,
    selectors: {
      mainContent: 'article',
      publishDate: 'time',
      author: '.author-name'
    }
  });
}
```

**3. Form Automation**:
```typescript
// Automate repetitive form submissions
const testData = [
  { name: 'User 1', email: 'user1@test.com' },
  { name: 'User 2', email: 'user2@test.com' }
];

for (const data of testData) {
  await agent.fillForm({
    url: 'https://example.com/signup',
    fields: {
      '#name': data.name,
      '#email': data.email
    },
    submitSelector: '#submit'
  });
}
```

### Integration with Project Prompts

The browser capabilities are designed to be included in generated project prompts:

```typescript
// Agent #17 can now generate prompts that include:
// - Web scraping with fallback selectors
// - Multi-engine search capabilities
// - Form automation for testing
// - Data extraction pipelines
// - Screenshot comparison tools

// Example: Generated prompt includes browser automation
const prompt = await generatePrompt({
  template: 'competitor-tracker',
  includeBrowserTools: true,  // NEW!
  searchEngines: ['google', 'bing'],
  extractionStrategies: ['fallback', 'multi-selector']
});
```

### Security Considerations

**User Agent Rotation**:
```typescript
const manager = new BrowserManager({
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
});
```

**Rate Limiting**:
```typescript
// Add delays between requests
await agent.search({ query: 'query 1' });
await new Promise(resolve => setTimeout(resolve, 2000));
await agent.search({ query: 'query 2' });
```

**Headless vs Headed**:
```typescript
// Development: headed mode
const devAgent = new Agent17({ headless: false });

// Production: headless mode (faster, uses less resources)
const prodAgent = new Agent17({ headless: true });
```

### Troubleshooting

**Issue: Selector not found**
```typescript
// Solution: Use fallback selectors
await agent.extractWithFallback(url, {
  price: ['#price', '.product-price', '[data-price]']
});
```

**Issue: Page load timeout**
```typescript
// Solution: Increase timeout
const manager = new BrowserManager({ timeout: 60000 });
```

**Issue: Bot detection**
```typescript
// Solution: Use realistic user agent and delays
const manager = new BrowserManager({
  userAgent: 'Mozilla/5.0 ...',  // Real browser UA
});
await page.waitForTimeout(Math.random() * 2000 + 1000);
```

### Advanced Features (Future)

Coming soon:
- [ ] JavaScript execution in page context
- [ ] Cookie management
- [ ] Network request interception
- [ ] Proxy support
- [ ] Captcha solving integration (BYOK)
- [ ] PDF generation
- [ ] Video recording

---

## API Reference

### Agent17 Class

```typescript
class Agent17 {
  constructor(config?: {
    headless?: boolean;
    logLevel?: 'info' | 'warn' | 'error' | 'debug';
  });

  // Initialization
  async initialize(): Promise<void>;
  async close(): Promise<void>;

  // Search Tools
  async search(input: SearchInput): Promise<ToolResult>;
  async multiSearch(query: string, engines?: string[]): Promise<ToolResult>;

  // Interaction Tools
  async clickElement(input: ClickElementInput): Promise<ToolResult>;
  async fillForm(input: FillFormInput): Promise<ToolResult>;

  // Extraction Tools
  async extractData(input: ExtractDataInput): Promise<ToolResult>;
  async extractWithFallback(url: string, selectors: Record<string, string[]>): Promise<ToolResult>;

  // Navigation Tools
  async navigate(url: string): Promise<{ success: boolean; url: string; title: string }>;
  async screenshot(url: string, options?: ScreenshotOptions): Promise<Buffer>;
}
```

### Type Definitions

See `src/types/index.ts` for complete type definitions including:
- `ClickElementInput`
- `FillFormInput`
- `SearchInput`
- `ExtractDataInput`
- `ToolResult`
- `SearchResult`
- And more...

