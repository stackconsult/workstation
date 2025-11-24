# 🤖 Agent Prompt: Build Competitor Price Tracker

## COPY THIS ENTIRE SECTION TO GITHUB COPILOT CHAT

```
@workspace I need you to build a complete Competitor Price Tracking System.

## 🎯 PROJECT OVERVIEW

**Purpose:** Automatically monitor competitor pricing across multiple e-commerce sites and detect price changes.

**Business Value:**
- Track 10+ competitors simultaneously
- Get instant alerts on price drops &gt; 5%
- Export data for analysis (CSV/JSON)
- Run automatically every 6 hours via GitHub Actions
- Zero cost for basic functionality (free tier only)

---

## 📋 TECHNICAL REQUIREMENTS

### 1. Technology Stack

**FREE TIER (Default - No API Keys Required):**
- **Playwright (v1.40+)** - Browser automation (FREE)
- **TypeScript (v5.3+)** - Strict mode for type safety (FREE)
- **Node.js 18+** - Runtime environment (FREE)
- **SQLite** - Price history database (FREE)
- **node-cron** - Task scheduling (FREE)
- **csv-writer** - Data exports (FREE)
- **Jest (v29.7+)** - Testing framework (FREE)
- **GitHub Actions** - CI/CD automation (FREE for public repos)

**BYOK TIER (Optional - Bring Your Own Key):**
- **SendGrid** - Email notifications (user provides SENDGRID_API_KEY)
  - *FREE ALTERNATIVE:* nodemailer with Gmail SMTP (no API key needed)
- **Slack** - Team notifications (user provides SLACK_WEBHOOK_URL)
  - *FREE ALTERNATIVE:* GitHub issue comments
- **Twilio** - SMS alerts (user provides TWILIO credentials)
  - *FREE ALTERNATIVE:* Email or Slack webhooks

### 2. Project Structure

```
competitor-tracker/
├── src/
│   ├── scrapers/
│   │   ├── amazon.ts          # Amazon-specific scraper
│   │   ├── bestbuy.ts         # Best Buy scraper
│   │   ├── walmart.ts         # Walmart scraper
│   │   ├── target.ts          # Target scraper
│   │   └── base.ts            # Base scraper class
│   ├── services/
│   │   ├── database.ts        # SQLite operations (FREE)
│   │   ├── notifier.ts        # Notifications (FREE + optional BYOK)
│   │   └── reporter.ts        # Generate reports
│   ├── utils/
│   │   ├── selectors.ts       # CSS selectors for scraping
│   │   ├── retry.ts           # Retry logic with backoff
│   │   └── logger.ts          # Structured logging
│   ├── types/
│   │   └── index.ts           # TypeScript interfaces
│   └── index.ts               # Main orchestrator
├── tests/
│   ├── scrapers/
│   │   └── amazon.test.ts     # Test each scraper
│   └── integration/
│       └── full-flow.test.ts  # End-to-end tests
├── data/
│   ├── competitors.json       # Products to track
│   ├── price-history.db       # SQLite database
│   └── exports/               # CSV exports directory
├── .github/
│   └── workflows/
│       ├── scrape-schedule.yml   # Runs every 6 hours
│       └── manual-scrape.yml     # Manual trigger
├── .env.example               # Template (no secrets)
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

### 3. Core Data Models

```typescript
interface ProductData {
  competitor: string;
  productName: string;
  productId: string;
  currentPrice: number;
  currency: string;
  availability: 'in_stock' | 'out_of_stock' | 'preorder';
  shippingCost: number | null;
  rating: number | null;
  reviewCount: number | null;
  lastUpdated: Date;
  previousPrice: number | null;
  priceChange: number | null;
  priceChangePercent: number | null;
}

interface NotificationConfig {
  email?: {
    enabled: boolean;
    useByok: boolean;  // true = SendGrid BYOK, false = free Gmail SMTP
    recipients: string[];
  };
  slack?: {
    enabled: boolean;
    webhookUrl?: string;  // Optional BYOK
  };
  github?: {
    enabled: boolean;  // FREE - create issues on price drops
  };
}
```

### 4. Selector Strategy (CRITICAL FOR RELIABILITY)

**Hierarchy (Try in Order):**
1. `data-testid` (most reliable)
2. `aria-label` (accessible, stable)
3. `id` (unique but can change)
4. `class + structure` (fallback only)

**Example Implementation:**
```typescript
// src/scrapers/amazon.ts
async function getPrice(page: Page): Promise<number | null> {
  const selectors = [
    '[data-testid="price-whole"]',           // Best
    '[aria-label*="price"]',                  // Good
    '#priceblock_ourprice',                   // Okay
    '.a-price .a-offscreen',                  // Fallback
  ];
  
  for (const selector of selectors) {
    try {
      const element = page.locator(selector);
      if (await element.count() > 0) {
        const text = await element.textContent();
        return parsePrice(text);
      }
    } catch (e) {
      continue;
    }
  }
  
  return null;  // Gracefully fail
}
```

### 5. Error Handling & Resilience

**Retry Logic with Exponential Backoff:**
```typescript
// src/utils/retry.ts
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`Retry ${attempt + 1}/${maxRetries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
}
```

**Graceful Degradation:**
```typescript
// src/index.ts
async function scrapeAll(competitors: Competitor[]): Promise<ProductData[]> {
  const results: ProductData[] = [];
  
  for (const competitor of competitors) {
    try {
      const data = await retryWithBackoff(() => scrape(competitor));
      results.push(data);
    } catch (error) {
      console.error(`Failed to scrape ${competitor.name}:`, error);
      // Continue with other competitors instead of crashing
      await logError({ competitor, error: error.message });
    }
  }
  
  return results;  // Return partial results if some fail
}
```

### 6. Data Storage (SQLite - FREE)

**Schema:**
```sql
CREATE TABLE price_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  competitor TEXT NOT NULL,
  product_id TEXT NOT NULL,
  product_name TEXT,
  price REAL NOT NULL,
  currency TEXT DEFAULT 'USD',
  availability TEXT,
  rating REAL,
  review_count INTEGER,
  scraped_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(competitor, product_id, scraped_at)
);

CREATE INDEX idx_price_lookup 
  ON price_history(competitor, product_id, scraped_at DESC);
```

**Implementation:**
```typescript
// src/services/database.ts
import sqlite3 from 'sqlite3';

export class PriceDatabase {
  private db: sqlite3.Database;
  
  async savePrice(data: ProductData): Promise<void> {
    await this.db.run(
      `INSERT INTO price_history 
       (competitor, product_id, product_name, price, availability)
       VALUES (?, ?, ?, ?, ?)`,
      [data.competitor, data.productId, data.productName, data.currentPrice, data.availability]
    );
  }
  
  async getPriceHistory(competitor: string, productId: string): Promise<ProductData[]> {
    return await this.db.all(
      `SELECT * FROM price_history 
       WHERE competitor = ? AND product_id = ?
       ORDER BY scraped_at DESC
       LIMIT 30`,
      [competitor, productId]
    );
  }
}
```

### 7. Notification System (FREE + Optional BYOK)

**FREE: Console Logging (Always Included)**
```typescript
// src/services/notifier.ts
function logPriceChange(change: PriceChange): void {
  console.log(`
🚨 PRICE ALERT!
Product: ${change.productName}
Competitor: ${change.competitor}
Old Price: $${change.oldPrice}
New Price: $${change.newPrice}
Savings: ${change.percentChange}% ($${change.dollarChange})
  `);
}
```

**FREE: GitHub Issues (No API Key Needed)**
```typescript
async function createGitHubIssue(change: PriceChange): Promise<void> {
  // Uses GITHUB_TOKEN from Actions (free, automatic)
  await fetch('https://api.github.com/repos/user/repo/issues', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: `Price Drop: ${change.productName}`,
      body: `Price changed from $${change.oldPrice} to $${change.newPrice}`
    })
  });
}
```

**FREE ALTERNATIVE: Gmail SMTP (No API Key)**
```typescript
import nodemailer from 'nodemailer';

async function sendGmailAlert(change: PriceChange): Promise<void> {
  // Use Gmail with app password (no API key required)
  const transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,      // Your Gmail address
      pass: process.env.GMAIL_APP_PASS   // App password (not account password)
    }
  });
  
  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to: 'alerts@example.com',
    subject: `Price Drop: ${change.productName}`,
    text: `Price: $${change.oldPrice} → $${change.newPrice}`
  });
}
```

**BYOK: SendGrid (Optional - User Provides Key)**
```typescript
async function sendSendGridAlert(change: PriceChange): Promise<void> {
  if (!process.env.SENDGRID_API_KEY) {
    console.log('SendGrid not configured, using free Gmail alternative');
    return sendGmailAlert(change);  // Fallback to free option
  }
  
  // Use user's SendGrid API key
  await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: 'alerts@example.com' }] }],
      from: { email: 'noreply@example.com' },
      subject: `Price Drop: ${change.productName}`,
      content: [{ type: 'text/plain', value: `Price: $${change.oldPrice} → $${change.newPrice}` }]
    })
  });
}
```

### 8. GitHub Actions Workflow (FREE)

**File: `.github/workflows/scrape-schedule.yml`**
```yaml
name: Scheduled Price Scraping

on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours (FREE)
  workflow_dispatch:        # Manual trigger

jobs:
  scrape:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install Playwright browsers
        run: npx playwright install chromium
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Run scraper
        env:
          # Optional BYOK services (user adds as secrets)
          SENDGRID_API_KEY: ${{ secrets.SENDGRID_API_KEY }}
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
          # FREE alternatives (no secrets needed)
          GMAIL_USER: ${{ secrets.GMAIL_USER }}
          GMAIL_APP_PASS: ${{ secrets.GMAIL_APP_PASS }}
        run: npm run scrape
      
      - name: Upload price database (FREE)
        uses: actions/upload-artifact@v3
        with:
          name: price-history
          path: data/price-history.db
          retention-days: 90  # Keep 90 days of history
      
      - name: Commit CSV exports
        run: |
          git config user.name github-actions
          git config user.email github-actions@github.com
          git add data/exports/*.csv
          git diff --quiet && git diff --staged --quiet || \
            git commit -m "Update price data $(date +'%Y-%m-%d %H:%M')"
          git push
```

### 9. Testing Requirements (80%+ Coverage Mandatory)

```typescript
// tests/scrapers/amazon.test.ts
describe('Amazon Scraper', () => {
  it('should extract complete product data', async () => {
    const data = await scrapeAmazon('B08L5VN58M');
    
    expect(data).toMatchObject({
      competitor: 'Amazon',
      productName: expect.any(String),
      currentPrice: expect.any(Number),
      availability: expect.stringMatching(/in_stock|out_of_stock/),
      rating: expect.any(Number),
      reviewCount: expect.any(Number)
    });
  });
  
  it('should handle 404 gracefully', async () => {
    const data = await scrapeAmazon('INVALID_ASIN');
    expect(data).toBeNull();
  });
  
  it('should retry on network failure', async () => {
    const spy = jest.spyOn(global, 'fetch')
      .mockRejectedValueOnce(new Error('Network'))
      .mockResolvedValueOnce({ ok: true });
    
    await scrapeAmazon('B08L5VN58M');
    
    expect(spy).toHaveBeenCalledTimes(2);  // Retried once
  });
  
  it('should detect price changes', async () => {
    // Mock database with old price
    await db.savePrice({ productId: '123', price: 100 });
    
    // Scrape new price
    const data = await scrapeAmazon('123');
    const change = await detectPriceChange(data);
    
    expect(change).toMatchObject({
      oldPrice: 100,
      newPrice: expect.any(Number),
      percentChange: expect.any(Number)
    });
  });
});

// tests/integration/full-flow.test.ts
describe('Full Scraping Flow', () => {
  it('should scrape all competitors and save to database', async () => {
    const results = await scrapeAll(testCompetitors);
    
    expect(results.length).toBe(testCompetitors.length);
    
    // Verify saved to database
    const history = await db.getPriceHistory('Amazon', 'B08L5VN58M');
    expect(history.length).toBeGreaterThan(0);
  });
  
  it('should send notifications on price drops', async () => {
    const spy = jest.spyOn(notifier, 'notify');
    
    await scrapeAll(testCompetitors);
    
    expect(spy).toHaveBeenCalled();
  });
  
  it('should export to CSV', async () => {
    await scrapeAll(testCompetitors);
    await exportToCSV('data/exports/prices.csv');
    
    const csvContent = fs.readFileSync('data/exports/prices.csv', 'utf8');
    expect(csvContent).toContain('Amazon');
    expect(csvContent).toContain('Best Buy');
  });
});
```

### 10. Configuration File

**File: `data/competitors.json`**
```json
{
  "products": [
    {
      "category": "Headphones",
      "ourProduct": "Premium Wireless Headphones",
      "competitors": [
        {
          "name": "Amazon",
          "productId": "B08L5VN58M",
          "url": "https://amazon.com/dp/B08L5VN58M"
        },
        {
          "name": "Best Buy",
          "productId": "6428323",
          "url": "https://www.bestbuy.com/site/6428323.p"
        },
        {
          "name": "Walmart",
          "productId": "553717544",
          "url": "https://www.walmart.com/ip/553717544"
        }
      ]
    }
  ]
}
```

### 11. Environment Configuration

**File: `.env.example`**
```env
# REQUIRED (FREE - No API Keys)
NODE_ENV=development
LOG_LEVEL=info

# OPTIONAL: Gmail SMTP (FREE - No API Key, Just App Password)
# Setup: https://support.google.com/accounts/answer/185833
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASS=your-16-char-app-password

# OPTIONAL: BYOK Services (User Provides Own Keys)
# SendGrid Email (https://sendgrid.com - $15/month for 40k emails)
# SENDGRID_API_KEY=SG.your-api-key-here

# Slack Webhooks (https://api.slack.com/messaging/webhooks - FREE)
# SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Twilio SMS (https://www.twilio.com - Pay as you go)
# TWILIO_ACCOUNT_SID=AC...
# TWILIO_AUTH_TOKEN=...
# TWILIO_PHONE_NUMBER=+1234567890

# GitHub (FREE - Automatically available in GitHub Actions)
# GITHUB_TOKEN=automatically-provided-by-actions
```

---

## ✅ ACCEPTANCE CRITERIA

Your implementation is complete when:

1. ✅ All 4+ competitor scrapers work (Amazon, Best Buy, Walmart, Target)
2. ✅ Price history stored in SQLite (FREE)
3. ✅ GitHub Actions runs successfully every 6 hours (FREE)
4. ✅ Notifications work (FREE console + GitHub issues + optional BYOK)
5. ✅ CSV exports generated in `data/exports/`
6. ✅ Test coverage > 80%
7. ✅ No crashes - graceful degradation on errors
8. ✅ README has complete setup instructions (FREE + BYOK)
9. ✅ Can add new competitors by editing JSON (no code changes)
10. ✅ **Works perfectly without any API keys** (BYOK is optional)
11. ✅ Free alternatives documented for all BYOK services
12. ✅ Security: No hardcoded secrets, .env.example provided

---

## 🚀 ADDITIONAL FEATURES (Optional)

If you have time, add:
- Web dashboard showing price trends (FREE - React + GitHub Pages)
- Price prediction using historical data (FREE - simple linear regression)
- Multi-currency support (FREE - exchange rate APIs)
- Mobile app notifications (BYOK - Firebase Cloud Messaging)
- Integration with Google Sheets (FREE - Google Sheets API)
- Telegram bot for alerts (FREE - Telegram Bot API)

---

## 📚 README REQUIREMENTS

Your README.md must include:

1. **Quick Start** (&lt; 5 minutes setup)
2. **Features Overview** (FREE vs BYOK clearly marked)
3. **Technology Stack** (List all FREE tools first)
4. **Installation Instructions**
   - `npm install` (FREE)
   - Setup Playwright browsers (FREE)
5. **Configuration Guide**
   - FREE: Gmail SMTP setup (no API key)
   - FREE: GitHub issues setup (automatic)
   - BYOK: SendGrid setup (optional)
   - BYOK: Slack webhooks (optional)
6. **Usage Examples**
   - Running manually
   - Automated via GitHub Actions
7. **Testing Instructions**
   - `npm test` (must pass 80%+)
8. **Adding New Competitors** (edit JSON, no coding)
9. **Troubleshooting Guide**
   - Common selector issues
   - Rate limiting solutions
   - Network errors
10. **FREE vs BYOK Comparison Table**

Example table:
| Feature | FREE Option | BYOK Option |
|---------|-------------|-------------|
| Email Alerts | Gmail SMTP | SendGrid API |
| Team Notifications | GitHub Issues | Slack Webhooks |
| SMS Alerts | Not available | Twilio |
| Storage | SQLite + Git | AWS S3 |
| Hosting | GitHub Actions | AWS Lambda |

---

## 🎯 OUTPUT

When done, provide:
1. Complete project in `./competitor-tracker/` directory
2. Working GitHub Actions workflow
3. README with FREE vs BYOK comparison
4. Test results showing 80%+ coverage
5. Example CSV export file
6. `.env.example` with all options (FREE + BYOK)
7. Documentation showing FREE alternatives work without any API keys
```

## 🎬 HOW TO USE THIS PROMPT

1. **Open VS Code** with GitHub Copilot installed
2. **Open Copilot Chat** (Ctrl+Shift+I or Cmd+Shift+I)
3. **Copy the ENTIRE prompt** above (everything in the code block)
4. **Paste into Copilot Chat**
5. **Press Enter**
6. **Watch AI build** the complete project (2-3 minutes)
7. **Review generated code**
8. **Run tests:** `npm test` (should pass with 80%+ coverage)
9. **Test FREE features:** Works without any API keys!
10. **Optional:** Add BYOK services later if needed

---

## 💡 What You're Learning (Without Coding)

By using this agent-generated prompt, you understand:
- **Free-first philosophy** - Always build with free tools first
- **BYOK pattern** - Optional premium features, user provides keys
- **Selector strategies** - Reliable web scraping techniques
- **Error handling** - Retry logic, graceful degradation
- **Data persistence** - SQLite for history (FREE)
- **Automation** - GitHub Actions cron jobs (FREE)
- **Notifications** - Multiple options (FREE + BYOK)
- **Testing** - Comprehensive coverage (80%+)
- **Security** - No hardcoded secrets, .env management

**Even though you didn't write the code, you can:**
- Add new competitors (edit `data/competitors.json`)
- Change scraping frequency (edit `.github/workflows/scrape-schedule.yml`)
- Customize alerts (choose FREE or BYOK options)
- Switch notification methods (Gmail → SendGrid when needed)
- Understand WHY each part exists

---

## 🔧 Customization Examples (No Coding Required)

### Add a New Competitor
Edit `data/competitors.json`:
```json
{
  "name": "Newegg",
  "productId": "N82E16826138430",
  "url": "https://www.newegg.com/p/N82E16826138430"
}
```

Then tell AI:
```
@workspace Add Newegg scraper to src/scrapers/newegg.ts following the same pattern as amazon.ts
```

### Switch from FREE Gmail to BYOK SendGrid
1. Get SendGrid API key
2. Add to `.env`: `SENDGRID_API_KEY=SG.your-key`
3. Update `src/services/notifier.ts`:
```typescript
const useByok = !!process.env.SENDGRID_API_KEY;
if (useByok) {
  await sendSendGridAlert(change);  // BYOK
} else {
  await sendGmailAlert(change);     // FREE fallback
}
```

### Change Alert Threshold (5% → 10%)
Tell AI:
```
@workspace Change price alert threshold from 5% to 10% in src/services/notifier.ts
```

---

This is **the most detailed, FREE-first agent prompt possible**. The AI will build a production-ready competitor tracking system in minutes that works perfectly without any API keys. BYOK services are purely optional enhancements!
