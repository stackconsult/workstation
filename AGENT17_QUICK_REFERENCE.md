# Agent 17 Quick Reference

## 🚀 Quick Start

```bash
# Install dependencies
cd agents/agent17 && npm install

# Run tests
npm test

# Build
npm run build

# Run a demo (example)
node dist/index.js
```

## 📋 Common Commands

### From Repository Root
```bash
npm run agent17:build      # Build agent17
npm run agent17:test       # Run tests
npm run agent17:generate   # Generate projects
```

### From agents/agent17/
```bash
npm install               # Install dependencies
npm test                  # Run tests with coverage
npm run build            # Compile TypeScript
npm run dev              # Watch mode
npm run lint             # Lint code (currently skipped)
```

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Run Specific Tests
```bash
npm test -- logger.test        # Test logger only
npm test -- --coverage        # With coverage report
npm test -- --watch          # Watch mode
```

### Coverage Thresholds
- Statements: 80% ✅ (Current: 84.68%)
- Functions: 80% ✅ (Current: 80.32%)
- Branches: 80% ⚠️  (Current: 58.42%)

## 📦 API Usage

### Initialize Agent
```typescript
import Agent17 from '@workstation/agent17';

const agent = new Agent17({
  headless: true,        // Run browser in headless mode
  logLevel: 'info'       // 'info' | 'warn' | 'error' | 'debug'
});

await agent.initialize();
```

### Web Search
```typescript
// Single engine search
const results = await agent.search({
  query: 'AI agents',
  searchEngine: 'google',  // 'google' | 'bing' | 'duckduckgo'
  maxResults: 10
});

// Multi-engine search
const multiResults = await agent.multiSearch(
  'AI agents',
  ['google', 'bing', 'duckduckgo']
);
```

### Click Elements
```typescript
await agent.clickElement({
  url: 'https://example.com',
  selector: 'button#submit',
  waitAfterClick: 2000    // Optional delay in ms
});
```

### Fill Forms
```typescript
await agent.fillForm({
  url: 'https://example.com/form',
  fields: {
    name: 'John Doe',
    email: 'john@example.com',
    subscribe: true
  },
  submitSelector: 'button[type="submit"]',  // Optional
  waitAfterSubmit: 3000                     // Optional
});
```

### Extract Data
```typescript
// Simple extraction
const data = await agent.extractData({
  url: 'https://example.com/product',
  selectors: {
    title: 'h1.product-title',
    price: '.price',
    description: '.description'
  },
  takeScreenshot: true    // Optional
});

// With fallback selectors
const dataWithFallback = await agent.extractWithFallback(
  'https://example.com/product',
  {
    title: ['h1', '.title', '#product-name'],
    price: ['.price', 'span.cost', '#item-price']
  }
);
```

### Navigate & Screenshot
```typescript
// Navigate to URL
const page = await agent.navigate('https://example.com');
console.log(page.url, page.title);

// Take screenshot
const screenshot = await agent.screenshot('https://example.com', {
  fullPage: true,
  path: '/tmp/screenshot.png'
});
```

### Cleanup
```typescript
await agent.close();
```

## 🏗️ Project Structure

```
agents/agent17/
├── src/
│   ├── index.ts              # Main Agent17 class
│   ├── browser/
│   │   └── manager.ts        # Browser lifecycle management
│   ├── tools/
│   │   ├── search.ts         # Web search
│   │   ├── click-element.ts  # Element clicking
│   │   ├── fill-form.ts      # Form automation
│   │   └── extract-data.ts   # Data extraction
│   ├── utils/
│   │   ├── logger.ts         # Logging utility
│   │   └── retry.ts          # Retry logic
│   └── types/
│       └── index.ts          # TypeScript types
├── tests/
│   ├── unit/                 # Unit tests
│   └── integration/          # Integration tests
├── dist/                     # Compiled output
├── package.json
├── tsconfig.json
└── jest.config.js
```

## ⚙️ Configuration

### Browser Options
```typescript
{
  headless: true,           // Run browser without UI
  maxPages: 5,              // Max concurrent pages
  timeout: 30000,           // Default timeout (ms)
  userAgent: '...'          // Custom user agent
}
```

### Log Levels
- `debug`: All messages including debug info
- `info`: Informational messages and above
- `warn`: Warnings and errors only
- `error`: Errors only

## 🔧 Troubleshooting

### Playwright Browser Not Found
```bash
npx playwright install chromium
```

### Tests Failing
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
npm test
```

### Build Errors
```bash
# Clean build
rm -rf dist
npm run build
```

### Memory Issues
```typescript
// Reduce max pages
const agent = new Agent17({ maxPages: 2 });

// Close agent frequently
await agent.close();
```

## 🔄 CI/CD Workflows

### Test Workflow
**File**: `.github/workflows/agent17-test.yml`  
**Triggers**: Push, PR, Manual  
**Actions**: Test, Build, Lint, Coverage

### Weekly Execution
**File**: `.github/workflows/agent17-weekly.yml`  
**Schedule**: Every Saturday 9 AM UTC  
**Modes**: dry-run, production

## 📊 Test Coverage

Current coverage (as of Nov 17, 2025):
```
Total Tests:      127 passing
Statement Coverage: 84.68%
Function Coverage:  80.32%
Branch Coverage:    58.42%
```

### Coverage by Module
- ✅ index.ts: 100%
- ✅ browser/manager.ts: 83.75%
- ✅ tools/click-element.ts: 100%
- ✅ tools/search.ts: 93.93%
- ✅ utils/logger.ts: 100%
- ✅ utils/retry.ts: 96.29%
- ⚠️  tools/fill-form.ts: 68.57%
- ⚠️  tools/extract-data.ts: 61.90%

## 🐛 Known Issues

1. **ESLint Configuration**: Temporarily disabled
   - Use TypeScript compiler for type checking
   - `npm run build` catches errors

2. **Branch Coverage**: Below 80% threshold
   - Statement and function coverage excellent
   - Non-critical for production use

3. **Jest Vulnerabilities**: 18 moderate in dev dependencies
   - Only affects test environment
   - No production impact

## 📚 Additional Resources

- [Full README](agents/agent17/README.md)
- [Implementation Complete](AGENT17_IMPLEMENTATION_COMPLETE.md)
- [Integration Recommendations](AGENT17_INTEGRATION_RECOMMENDATIONS.md)
- [Agent Specification](.github/agents/agent17-project-builder.agent.md)
- [Playwright Docs](https://playwright.dev/)

## 🆘 Getting Help

1. Check the [README](agents/agent17/README.md) for detailed documentation
2. Review [test examples](agents/agent17/tests/) for usage patterns
3. Check GitHub Actions logs for CI/CD issues
4. Open an issue in the repository

## 🎯 Best Practices

### Do's ✅
- Always close the agent after use
- Use retry logic for unreliable operations
- Leverage fallback selectors for scraping
- Handle errors gracefully
- Test in headless mode before production
- Use environment variables for secrets

### Don'ts ❌
- Don't hardcode sensitive data
- Don't skip error handling
- Don't ignore timeout configurations
- Don't run too many concurrent pages
- Don't forget to clean up resources
- Don't commit `.env` files

---

**Last Updated**: November 17, 2025  
**Version**: 1.0.0  
**Status**: ✅ OPERATIONAL
