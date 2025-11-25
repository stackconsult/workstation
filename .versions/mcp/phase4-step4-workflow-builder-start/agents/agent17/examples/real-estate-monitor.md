# 🏠 Agent Prompt: Build Real Estate Property Monitor

## INSTRUCTIONS FOR GITHUB CODING AGENT

### YOUR ROLE & CONTEXT

You are Agent #17, an autonomous GitHub Coding Agent operating within this repository. You have access to:
- This repository's file system
- Ability to create/modify files directly in the repo
- GitHub Actions execution environment (Ubuntu runner)
- Node.js 20 runtime
- Playwright for headless browser automation

### YOUR TASK

Build a complete, production-ready **Real Estate Property Monitor** that:
1. Scrapes property listings from Zillow and Redfin
2. Tracks new listings and price changes
3. Stores data in SQLite database (file-based, committed to repo)
4. Sends instant SMS/email alerts for matches
5. Runs automatically every 2 hours via GitHub Actions
6. Works with FREE tools by default, BYOK for premium features

---

## TECHNICAL SPECIFICATION

### Project Structure

Create all files in: `./projects/real-estate-monitor/`

```
projects/real-estate-monitor/
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
├── README.md
├── src/
│   ├── index.ts                 # Main entry point
│   ├── types/
│   │   └── index.ts             # TypeScript interfaces
│   ├── scrapers/
│   │   ├── base-scraper.ts      # Abstract scraper class
│   │   ├── zillow.ts            # Zillow-specific scraper
│   │   └── redfin.ts            # Redfin-specific scraper
│   ├── services/
│   │   ├── database.ts          # SQLite integration
│   │   ├── notifier.ts          # SMS + Email alerts
│   │   └── price-tracker.ts    # Price change detection
│   └── utils/
│       ├── logger.ts            # Structured logging
│       └── retry.ts             # Exponential backoff
├── data/
│   ├── search-config.json       # User search criteria
│   ├── properties.db            # SQLite database
│   └── .gitkeep
├── tests/
│   ├── scrapers.test.ts
│   └── services.test.ts
└── .github/
    └── workflows/
        └── monitor-properties.yml
```

---

## DATA MODELS

### TypeScript Interfaces

**File: `src/types/index.ts`**

```typescript
export interface Property {
  id: string;                    // Unique identifier (site-specific)
  source: 'zillow' | 'redfin';
  url: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number | null;
  propertyType: string;          // 'house', 'condo', 'townhouse', etc.
  listingDate: Date;
  lastSeenDate: Date;
  imageUrl: string | null;
  description: string | null;
  status: 'active' | 'pending' | 'sold';
  priceHistory: PriceChange[];
}

export interface PriceChange {
  date: Date;
  oldPrice: number;
  newPrice: number;
  changePercent: number;
}

export interface SearchCriteria {
  name: string;
  location: string;              // "Seattle, WA" or "98101"
  minPrice?: number;
  maxPrice?: number;
  propertyType?: string[];       // ['house', 'condo']
  minBeds?: number;
  minBaths?: number;
  maxDistance?: number;          // miles from location
}

export interface NotificationConfig {
  email?: string;
  sms?: string;                  // Phone number
  alertOn: ('new_listing' | 'price_drop' | 'price_increase')[];
}

export interface SearchConfig {
  searches: SearchCriteria[];
  notifications: NotificationConfig;
}
```

---

## IMPLEMENTATION REQUIREMENTS

### 1. Package.json

```json
{
  "name": "real-estate-monitor",
  "version": "1.0.0",
  "description": "Automated real estate property monitoring with Zillow and Redfin",
  "main": "dist/index.js",
  "scripts": {
    "start": "node dist/index.js",
    "build": "tsc",
    "dev": "ts-node src/index.ts",
    "test": "jest",
    "lint": "eslint src --ext .ts"
  },
  "dependencies": {
    "playwright": "^1.40.0",
    "better-sqlite3": "^9.2.0",
    "nodemailer": "^6.9.0",
    "twilio": "^4.19.0",
    "dotenv": "^16.3.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/better-sqlite3": "^7.6.0",
    "@types/nodemailer": "^6.4.0",
    "typescript": "^5.3.0",
    "ts-node": "^10.9.0",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.0",
    "ts-jest": "^29.1.0",
    "eslint": "^8.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0"
  }
}
```

### 2. TypeScript Configuration

**File: `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### 3. Database Service

**File: `src/services/database.ts`**

```typescript
import Database from 'better-sqlite3';
import path from 'path';
import { Property, PriceChange } from '../types/index.js';

export class PropertyDatabase {
  private db: Database.Database;

  constructor(dbPath: string = './data/properties.db') {
    this.db = new Database(dbPath);
    this.initializeSchema();
  }

  private initializeSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS properties (
        id TEXT PRIMARY KEY,
        source TEXT NOT NULL,
        url TEXT NOT NULL,
        address TEXT NOT NULL,
        city TEXT NOT NULL,
        state TEXT NOT NULL,
        zipCode TEXT,
        price REAL NOT NULL,
        bedrooms INTEGER,
        bathrooms INTEGER,
        squareFeet INTEGER,
        propertyType TEXT,
        listingDate TEXT NOT NULL,
        lastSeenDate TEXT NOT NULL,
        imageUrl TEXT,
        description TEXT,
        status TEXT DEFAULT 'active'
      );

      CREATE TABLE IF NOT EXISTS price_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        propertyId TEXT NOT NULL,
        date TEXT NOT NULL,
        oldPrice REAL NOT NULL,
        newPrice REAL NOT NULL,
        changePercent REAL NOT NULL,
        FOREIGN KEY (propertyId) REFERENCES properties(id)
      );

      CREATE INDEX IF NOT EXISTS idx_properties_source ON properties(source);
      CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
      CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);
      CREATE INDEX IF NOT EXISTS idx_price_history_property ON price_history(propertyId);
    `);
  }

  saveProperty(property: Property): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO properties (
        id, source, url, address, city, state, zipCode, price,
        bedrooms, bathrooms, squareFeet, propertyType, listingDate,
        lastSeenDate, imageUrl, description, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      property.id,
      property.source,
      property.url,
      property.address,
      property.city,
      property.state,
      property.zipCode,
      property.price,
      property.bedrooms,
      property.bathrooms,
      property.squareFeet,
      property.propertyType,
      property.listingDate.toISOString(),
      property.lastSeenDate.toISOString(),
      property.imageUrl,
      property.description,
      property.status
    );
  }

  getProperty(id: string): Property | null {
    const stmt = this.db.prepare('SELECT * FROM properties WHERE id = ?');
    const row = stmt.get(id) as any;
    
    if (!row) return null;

    return this.rowToProperty(row);
  }

  getAllProperties(): Property[] {
    const stmt = this.db.prepare('SELECT * FROM properties ORDER BY price DESC');
    const rows = stmt.all() as any[];
    return rows.map(row => this.rowToProperty(row));
  }

  savePriceChange(propertyId: string, change: PriceChange): void {
    const stmt = this.db.prepare(`
      INSERT INTO price_history (propertyId, date, oldPrice, newPrice, changePercent)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(
      propertyId,
      change.date.toISOString(),
      change.oldPrice,
      change.newPrice,
      change.changePercent
    );
  }

  getPriceHistory(propertyId: string): PriceChange[] {
    const stmt = this.db.prepare(`
      SELECT * FROM price_history
      WHERE propertyId = ?
      ORDER BY date DESC
    `);
    
    const rows = stmt.all(propertyId) as any[];
    
    return rows.map(row => ({
      date: new Date(row.date),
      oldPrice: row.oldPrice,
      newPrice: row.newPrice,
      changePercent: row.changePercent
    }));
  }

  private rowToProperty(row: any): Property {
    return {
      id: row.id,
      source: row.source,
      url: row.url,
      address: row.address,
      city: row.city,
      state: row.state,
      zipCode: row.zipCode,
      price: row.price,
      bedrooms: row.bedrooms,
      bathrooms: row.bathrooms,
      squareFeet: row.squareFeet,
      propertyType: row.propertyType,
      listingDate: new Date(row.listingDate),
      lastSeenDate: new Date(row.lastSeenDate),
      imageUrl: row.imageUrl,
      description: row.description,
      status: row.status,
      priceHistory: this.getPriceHistory(row.id)
    };
  }

  close(): void {
    this.db.close();
  }
}
```

### 4. Notification Service

**File: `src/services/notifier.ts`**

```typescript
import nodemailer from 'nodemailer';
import twilio from 'twilio';
import { Property, NotificationConfig } from '../types/index.js';
import { log } from '../utils/logger.js';

export class Notifier {
  private emailTransporter?: nodemailer.Transporter;
  private twilioClient?: twilio.Twilio;
  private config: NotificationConfig;

  constructor(config: NotificationConfig) {
    this.config = config;
    this.initializeEmail();
    this.initializeTwilio();
  }

  private initializeEmail(): void {
    // FREE: Gmail SMTP (no cost)
    if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
      this.emailTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_PASS
        }
      });
      log('info', 'Email notifier initialized (Gmail SMTP - FREE)');
    } else {
      log('warn', 'Gmail credentials not found. Email alerts disabled.');
    }
  }

  private initializeTwilio(): void {
    // BYOK: Twilio SMS ($15 free trial, then user provides key)
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      this.twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
      log('info', 'SMS notifier initialized (Twilio BYOK)');
    } else {
      log('info', 'Twilio credentials not found. SMS alerts disabled (BYOK optional).');
    }
  }

  async notifyNewListing(property: Property): Promise<void> {
    const subject = `🏠 New Listing: ${property.address}`;
    const message = this.formatPropertyMessage(property, 'new_listing');

    await this.sendEmail(subject, message);
    await this.sendSMS(message);
  }

  async notifyPriceChange(property: Property, oldPrice: number): Promise<void> {
    const priceDiff = property.price - oldPrice;
    const percentChange = ((priceDiff / oldPrice) * 100).toFixed(2);
    const emoji = priceDiff < 0 ? '📉' : '📈';
    
    const subject = `${emoji} Price ${priceDiff < 0 ? 'Drop' : 'Increase'}: ${property.address}`;
    const message = this.formatPropertyMessage(property, 'price_change', {
      oldPrice,
      newPrice: property.price,
      change: priceDiff,
      percentChange
    });

    await this.sendEmail(subject, message);
    await this.sendSMS(message);
  }

  private formatPropertyMessage(
    property: Property, 
    type: 'new_listing' | 'price_change',
    priceInfo?: { oldPrice: number; newPrice: number; change: number; percentChange: string }
  ): string {
    let message = `Property: ${property.address}\n`;
    message += `City: ${property.city}, ${property.state}\n`;
    message += `Beds: ${property.bedrooms} | Baths: ${property.bathrooms}\n`;
    
    if (type === 'new_listing') {
      message += `Price: $${property.price.toLocaleString()}\n`;
    } else if (priceInfo) {
      message += `Old Price: $${priceInfo.oldPrice.toLocaleString()}\n`;
      message += `New Price: $${priceInfo.newPrice.toLocaleString()}\n`;
      message += `Change: $${priceInfo.change.toLocaleString()} (${priceInfo.percentChange}%)\n`;
    }
    
    message += `\nView: ${property.url}`;
    
    return message;
  }

  private async sendEmail(subject: string, message: string): Promise<void> {
    if (!this.emailTransporter || !this.config.email) {
      return;
    }

    try {
      await this.emailTransporter.sendMail({
        from: process.env.GMAIL_USER,
        to: this.config.email,
        subject,
        text: message,
        html: message.replace(/\n/g, '<br>')
      });
      log('info', 'Email sent successfully (FREE)');
    } catch (error) {
      log('error', 'Email send failed', { error });
    }
  }

  private async sendSMS(message: string): Promise<void> {
    if (!this.twilioClient || !this.config.sms) {
      return;
    }

    try {
      await this.twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: this.config.sms
      });
      log('info', 'SMS sent successfully (BYOK - Twilio)');
    } catch (error) {
      log('error', 'SMS send failed', { error });
    }
  }
}
```

### 5. Zillow Scraper

**File: `src/scrapers/zillow.ts`**

```typescript
import { chromium, Page } from 'playwright';
import { Property, SearchCriteria } from '../types/index.js';
import { withRetry } from '../utils/retry.js';
import { log } from '../utils/logger.js';

export class ZillowScraper {
  async searchProperties(criteria: SearchCriteria): Promise<Property[]> {
    return await withRetry(async () => {
      const browser = await chromium.launch({ headless: true });
      const page = await browser.newPage();

      try {
        const searchUrl = this.buildSearchUrl(criteria);
        log('info', 'Scraping Zillow', { url: searchUrl });

        await page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForSelector('.search-results', { timeout: 10000 });

        const properties = await this.extractProperties(page, criteria);
        
        log('info', `Found ${properties.length} properties on Zillow`);
        return properties;
      } finally {
        await browser.close();
      }
    });
  }

  private buildSearchUrl(criteria: SearchCriteria): string {
    const base = 'https://www.zillow.com/homes';
    const location = encodeURIComponent(criteria.location);
    let url = `${base}/${location}_rb`;

    const params: string[] = [];
    if (criteria.minPrice) params.push(`price=${criteria.minPrice}`);
    if (criteria.maxPrice) params.push(`price=${criteria.maxPrice}`);
    if (criteria.minBeds) params.push(`beds=${criteria.minBeds}`);
    if (criteria.minBaths) params.push(`baths=${criteria.minBaths}`);

    if (params.length > 0) {
      url += `/?' + params.join('&');
    }

    return url;
  }

  private async extractProperties(page: Page, criteria: SearchCriteria): Promise<Property[]> {
    const propertyCards = await page.$$('.property-card');
    const properties: Property[] = [];

    for (const card of propertyCards) {
      try {
        const property = await this.extractPropertyFromCard(card, page);
        if (property) {
          properties.push(property);
        }
      } catch (error) {
        log('error', 'Failed to extract property', { error });
      }
    }

    return properties;
  }

  private async extractPropertyFromCard(card: any, page: Page): Promise<Property | null> {
    // Selector hierarchy: data-testid → aria-label → class
    const addressSelectors = ['[data-testid="property-address"]', '.address', 'address'];
    const priceSelectors = ['[data-testid="property-price"]', '.price', '[aria-label*="price"]'];
    const bedsSelectors = ['[data-testid="beds"]', '.beds'];
    const bathsSelectors = ['[data-testid="baths"]', '.baths'];

    try {
      const address = await this.getTextFromSelectors(card, addressSelectors);
      const priceText = await this.getTextFromSelectors(card, priceSelectors);
      const bedsText = await this.getTextFromSelectors(card, bedsSelectors);
      const bathsText = await this.getTextFromSelectors(card, bathsSelectors);
      const url = await card.$eval('a', (el: HTMLAnchorElement) => el.href);

      if (!address || !priceText || !url) {
        return null;
      }

      const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
      const bedrooms = parseInt(bedsText?.match(/\d+/)?.[0] || '0', 10);
      const bathrooms = parseInt(bathsText?.match(/\d+/)?.[0] || '0', 10);

      const property: Property = {
        id: `zillow-${this.extractIdFromUrl(url)}`,
        source: 'zillow',
        url,
        address,
        city: '', // Extract from address
        state: '', // Extract from address
        zipCode: '',
        price,
        bedrooms,
        bathrooms,
        squareFeet: null,
        propertyType: 'house',
        listingDate: new Date(),
        lastSeenDate: new Date(),
        imageUrl: null,
        description: null,
        status: 'active',
        priceHistory: []
      };

      return property;
    } catch (error) {
      return null;
    }
  }

  private async getTextFromSelectors(element: any, selectors: string[]): Promise<string | null> {
    for (const selector of selectors) {
      try {
        const text = await element.$eval(selector, (el: HTMLElement) => el.textContent?.trim());
        if (text) return text;
      } catch {
        continue;
      }
    }
    return null;
  }

  private extractIdFromUrl(url: string): string {
    const match = url.match(/\/(\d+)_zpid/);
    return match ? match[1] : url;
  }
}
```

### 6. Main Entry Point

**File: `src/index.ts`**

```typescript
import { readFileSync } from 'fs';
import { PropertyDatabase } from './services/database.js';
import { Notifier } from './services/notifier.js';
import { ZillowScraper } from './scrapers/zillow.js';
import { SearchConfig } from './types/index.js';
import { log } from './utils/logger.js';

async function main() {
  log('info', '🏠 Starting Real Estate Monitor');

  // Load configuration
  const config: SearchConfig = JSON.parse(
    readFileSync('./data/search-config.json', 'utf-8')
  );

  // Initialize services
  const db = new PropertyDatabase();
  const notifier = new Notifier(config.notifications);
  const zillowScraper = new ZillowScraper();

  try {
    // Search each criteria
    for (const search of config.searches) {
      log('info', `Searching: ${search.name}`);
      
      const properties = await zillowScraper.searchProperties(search);
      
      for (const property of properties) {
        const existing = db.getProperty(property.id);
        
        if (!existing) {
          // New listing
          log('info', `New listing found: ${property.address}`);
          db.saveProperty(property);
          
          if (config.notifications.alertOn.includes('new_listing')) {
            await notifier.notifyNewListing(property);
          }
        } else if (existing.price !== property.price) {
          // Price change
          log('info', `Price change: ${property.address}`);
          
          const priceChange = {
            date: new Date(),
            oldPrice: existing.price,
            newPrice: property.price,
            changePercent: ((property.price - existing.price) / existing.price) * 100
          };
          
          db.savePriceChange(property.id, priceChange);
          property.lastSeenDate = new Date();
          db.saveProperty(property);
          
          const shouldAlert = 
            (priceChange.changePercent < 0 && config.notifications.alertOn.includes('price_drop')) ||
            (priceChange.changePercent > 0 && config.notifications.alertOn.includes('price_increase'));
          
          if (shouldAlert) {
            await notifier.notifyPriceChange(property, existing.price);
          }
        } else {
          // Update last seen
          property.lastSeenDate = new Date();
          db.saveProperty(property);
        }
      }
    }
    
    log('info', '✅ Real Estate Monitor completed successfully');
  } catch (error) {
    log('error', 'Monitor failed', { error });
    throw error;
  } finally {
    db.close();
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
```

### 7. Search Configuration

**File: `data/search-config.json`**

```json
{
  "searches": [
    {
      "name": "Downtown Condos",
      "location": "Seattle, WA",
      "minPrice": 400000,
      "maxPrice": 600000,
      "propertyType": ["condo"],
      "minBeds": 2,
      "minBaths": 2
    },
    {
      "name": "Suburban Houses",
      "location": "Bellevue, WA",
      "minPrice": 600000,
      "maxPrice": 900000,
      "propertyType": ["house"],
      "minBeds": 3,
      "minBaths": 2
    }
  ],
  "notifications": {
    "email": "your-email@gmail.com",
    "sms": "+1234567890",
    "alertOn": ["new_listing", "price_drop"]
  }
}
```

### 8. GitHub Actions Workflow

**File: `.github/workflows/monitor-properties.yml`**

```yaml
name: Monitor Real Estate Properties

on:
  schedule:
    - cron: '0 */2 * * *'  # Every 2 hours
  workflow_dispatch:        # Manual trigger

jobs:
  monitor:
    runs-on: ubuntu-latest
    timeout-minutes: 30

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: |
          cd projects/real-estate-monitor
          npm ci

      - name: Install Playwright browsers
        run: |
          cd projects/real-estate-monitor
          npx playwright install chromium

      - name: Run property monitor
        env:
          # FREE - Gmail SMTP (no cost)
          GMAIL_USER: ${{ secrets.GMAIL_USER }}
          GMAIL_PASS: ${{ secrets.GMAIL_PASS }}
          
          # BYOK - Twilio SMS (optional, $15 free trial then BYOK)
          TWILIO_ACCOUNT_SID: ${{ secrets.TWILIO_ACCOUNT_SID }}
          TWILIO_AUTH_TOKEN: ${{ secrets.TWILIO_AUTH_TOKEN }}
          TWILIO_PHONE_NUMBER: ${{ secrets.TWILIO_PHONE_NUMBER }}
        run: |
          cd projects/real-estate-monitor
          npm start

      - name: Commit updated database
        run: |
          git config user.name github-actions
          git config user.email github-actions@github.com
          git add projects/real-estate-monitor/data/properties.db
          git diff --quiet && git diff --staged --quiet || \
            git commit -m "Update property data $(date +'%Y-%m-%d %H:%M')"
          git push

      - name: Upload artifacts on failure
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: error-logs
          path: projects/real-estate-monitor/logs/
```

---

## TESTING REQUIREMENTS

### Unit Tests

**File: `tests/scrapers.test.ts`**

```typescript
import { ZillowScraper } from '../src/scrapers/zillow';
import { SearchCriteria } from '../src/types';

describe('ZillowScraper', () => {
  let scraper: ZillowScraper;

  beforeEach(() => {
    scraper = new ZillowScraper();
  });

  it('should search properties successfully', async () => {
    const criteria: SearchCriteria = {
      name: 'Test Search',
      location: 'Seattle, WA',
      minPrice: 400000,
      maxPrice: 600000,
      minBeds: 2
    };

    const properties = await scraper.searchProperties(criteria);
    
    expect(properties).toBeDefined();
    expect(Array.isArray(properties)).toBe(true);
    
    if (properties.length > 0) {
      expect(properties[0]).toHaveProperty('address');
      expect(properties[0]).toHaveProperty('price');
      expect(properties[0]).toHaveProperty('source', 'zillow');
    }
  }, 60000); // 60 second timeout for actual scraping

  it('should handle empty results gracefully', async () => {
    const criteria: SearchCriteria = {
      name: 'No Results',
      location: 'Invalid Location 99999',
      minPrice: 99999999
    };

    const properties = await scraper.searchProperties(criteria);
    expect(properties).toBeDefined();
    expect(properties.length).toBe(0);
  });
});
```

**Coverage Target**: 80%+

---

## ENVIRONMENT CONFIGURATION

### .env.example

```env
# FREE - Gmail SMTP (no API key cost)
GMAIL_USER=your-email@gmail.com
GMAIL_PASS=your-app-specific-password

# BYOK - Twilio SMS (optional, $15 free trial then bring your own key)
# TWILIO_ACCOUNT_SID=your-account-sid
# TWILIO_AUTH_TOKEN=your-auth-token
# TWILIO_PHONE_NUMBER=+1234567890

# Optional - Other notification services
# SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
# SENDGRID_API_KEY=SG.your-api-key
```

---

## README REQUIREMENTS

Create comprehensive `README.md` with:

1. **Project Overview**
   - What it does
   - Key features
   - FREE vs BYOK breakdown

2. **Installation**
   ```bash
   cd projects/real-estate-monitor
   npm install
   npx playwright install chromium
   ```

3. **Configuration**
   - How to edit `data/search-config.json`
   - How to set up Gmail SMTP (FREE)
   - How to set up Twilio SMS (optional BYOK)

4. **Usage**
   - Local development: `npm run dev`
   - Production build: `npm run build && npm start`
   - GitHub Actions: Automatic every 2 hours

5. **Features**
   - New listing detection
   - Price change tracking
   - Email alerts (FREE via Gmail)
   - SMS alerts (BYOK via Twilio)
   - SQLite persistence

6. **Architecture**
   - Component diagram
   - Data flow
   - Selector strategies

7. **Testing**
   ```bash
   npm test
   ```

8. **Troubleshooting**
   - Common errors
   - Selector debugging
   - Rate limit handling

---

## QUALITY GATES

Before committing, ensure:
- ✅ TypeScript compiles without errors
- ✅ ESLint passes with 0 errors
- ✅ Tests pass with 80%+ coverage
- ✅ README is comprehensive
- ✅ .env.example is complete
- ✅ Free alternatives documented for all BYOK features
- ✅ GitHub Actions workflow tested

---

## IMPLEMENTATION CHECKLIST

- [ ] Create project structure in `./projects/real-estate-monitor/`
- [ ] Implement TypeScript types
- [ ] Build database service (SQLite)
- [ ] Build notification service (email + SMS)
- [ ] Build Zillow scraper with fallback selectors
- [ ] Build Redfin scraper (similar to Zillow)
- [ ] Implement price tracking logic
- [ ] Create main entry point
- [ ] Write comprehensive tests (80%+ coverage)
- [ ] Create GitHub Actions workflow
- [ ] Generate README with setup instructions
- [ ] Add .env.example
- [ ] Document FREE vs BYOK options
- [ ] Test locally
- [ ] Validate GitHub Actions workflow
- [ ] Create branch: `copilot/agent17-build-real-estate-monitor`
- [ ] Commit all files
- [ ] Open PR with full description

---

## SUCCESS CRITERIA

Your implementation is complete when:

1. ✅ All files created in correct locations
2. ✅ TypeScript compiles successfully
3. ✅ Tests pass with 80%+ coverage
4. ✅ ESLint passes with 0 errors
5. ✅ Zillow scraper works with real data
6. ✅ Database stores and retrieves properties
7. ✅ Email notifications work (FREE via Gmail)
8. ✅ SMS notifications work (BYOK via Twilio, optional)
9. ✅ GitHub Actions workflow runs successfully
10. ✅ Database commits to repository after each run
11. ✅ README has complete setup instructions
12. ✅ All FREE alternatives documented

---

## FREE vs BYOK BREAKDOWN

### FREE (No Cost)
- ✅ Playwright browser automation
- ✅ SQLite database
- ✅ GitHub Actions (2,000 minutes/month free)
- ✅ Gmail SMTP for email alerts
- ✅ TypeScript, Jest, ESLint

### BYOK (Bring Your Own Key - Optional)
- Twilio SMS alerts ($15 free trial, then ~$0.0075/SMS)
- SendGrid email service (alternative to Gmail)
- Slack notifications (free tier available)

**Key Point**: Project works 100% with FREE tools. BYOK is purely optional for premium features.

---

## WEB DASHBOARD & DATA VISUALIZATION

### Overview

Build a complete web dashboard for users to view, filter, and export property data. This is a PRODUCTION web application, not an example.

###Project Structure Update

Add these files to the project:

```
projects/real-estate-monitor/
├── src/
│   ├── server.ts               # NEW - Express web server
│   ├── api/                    # NEW - REST API routes
│   │   ├── properties.ts       # Property listings API
│   │   ├── alerts.ts           # Alert management API
│   │   └── export.ts           # Data export API
├── views/                      # NEW - EJS templates
│   ├── dashboard.ejs           # Main dashboard
│   ├── property-detail.ejs     # Property details page
│   └── partials/
│       ├── header.ejs
│       ├── nav.ejs
│       └── footer.ejs
├── public/                     # NEW - Static assets
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   ├── dashboard.js        # Dashboard interactions
│   │   ├── charts.js           # Chart.js integration
│   │   └── realtime.js         # WebSocket client
│   └── images/
├── Dockerfile                  # NEW - Container image
└── docker-compose.yml          # NEW - Container orchestration
```

### 1. Web Server Implementation

**File: `src/server.ts`**

```typescript
import express from 'express';
import path from 'path';
import { Server } from 'socket.io';
import http from 'http';
import { fileURLToPath } from 'url';
import { DatabaseService } from './services/database.js';
import { propertiesRouter } from './api/properties.js';
import { alertsRouter } from './api/alerts.js';
import { exportRouter } from './api/export.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const db = new DatabaseService();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Routes
app.get('/', async (req, res) => {
  try {
    const properties = await db.getRecentProperties(50);
    const stats = await db.getStats();
    res.render('dashboard', { properties, stats });
  } catch (error) {
    res.status(500).send('Error loading dashboard');
  }
});

app.get('/property/:id', async (req, res) => {
  try {
    const property = await db.getPropertyById(req.params.id);
    const priceHistory = await db.getPriceHistory(req.params.id);
    
    if (!property) {
      return res.status(404).send('Property not found');
    }
    
    res.render('property-detail', { property, priceHistory });
  } catch (error) {
    res.status(500).send('Error loading property');
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/properties', propertiesRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/export', exportRouter);

// WebSocket for real-time updates
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Broadcast new properties to all connected clients
export function broadcastNewProperty(property: Property) {
  io.emit('new-property', property);
}

// Broadcast price changes to all connected clients
export function broadcastPriceChange(change: { propertyId: string; oldPrice: number; newPrice: number; changePercent: number; address: string }) {
  io.emit('price-change', change);
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🌐 Dashboard running on http://localhost:${PORT}`);
});
```

### 2. API Endpoints

**File: `src/api/properties.ts`**

```typescript
import express from 'express';
import { DatabaseService } from '../services/database.js';

export const propertiesRouter = express.Router();
const db = new DatabaseService();

// GET /api/properties - List properties with filters
propertiesRouter.get('/', async (req, res) => {
  try {
    const filters = {
      minPrice: req.query.minPrice ? parseInt(req.query.minPrice as string) : undefined,
      maxPrice: req.query.maxPrice ? parseInt(req.query.maxPrice as string) : undefined,
      city: req.query.city as string,
      propertyType: req.query.propertyType as string,
      minBeds: req.query.minBeds ? parseInt(req.query.minBeds as string) : undefined,
      minBaths: req.query.minBaths ? parseFloat(req.query.minBaths as string) : undefined,
      source: req.query.source as 'zillow' | 'redfin',
    };
    
    const properties = await db.getProperties(filters);
    res.json({ success: true, data: properties, count: properties.length });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// GET /api/properties/:id - Get single property with history
propertiesRouter.get('/:id', async (req, res) => {
  try {
    const property = await db.getPropertyById(req.params.id);
    const priceHistory = await db.getPriceHistory(req.params.id);
    
    if (!property) {
      return res.status(404).json({ success: false, error: 'Property not found' });
    }
    
    res.json({ success: true, data: { ...property, priceHistory } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// GET /api/properties/stats - Get statistics
propertiesRouter.get('/stats', async (req, res) => {
  try {
    const stats = await db.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});
```

**File: `src/api/export.ts`**

```typescript
import express from 'express';
import { DatabaseService } from '../services/database.js';
import { Parser } from 'json2csv';
import ExcelJS from 'exceljs';

export const exportRouter = express.Router();
const db = new DatabaseService();

// GET /api/export/csv - Export as CSV
exportRouter.get('/csv', async (req, res) => {
  try {
    const properties = await db.getAllProperties();
    const parser = new Parser({
      fields: ['id', 'source', 'address', 'city', 'state', 'price', 'bedrooms', 'bathrooms', 'squareFeet', 'propertyType', 'listingDate', 'url']
    });
    const csv = parser.parse(properties);
    
    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', `attachment; filename="properties-${Date.now()}.csv"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// GET /api/export/json - Export as JSON
exportRouter.get('/json', async (req, res) => {
  try {
    const properties = await db.getAllProperties();
    
    res.header('Content-Type', 'application/json');
    res.header('Content-Disposition', `attachment; filename="properties-${Date.now()}.json"`);
    res.json(properties);
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// GET /api/export/excel - Export as Excel
exportRouter.get('/excel', async (req, res) => {
  try {
    const properties = await db.getAllProperties();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Properties');
    
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 20 },
      { header: 'Source', key: 'source', width: 10 },
      { header: 'Address', key: 'address', width: 40 },
      { header: 'City', key: 'city', width: 20 },
      { header: 'State', key: 'state', width: 10 },
      { header: 'Price', key: 'price', width: 15 },
      { header: 'Beds', key: 'bedrooms', width: 10 },
      { header: 'Baths', key: 'bathrooms', width: 10 },
      { header: 'Sq Ft', key: 'squareFeet', width: 15 },
      { header: 'Type', key: 'propertyType', width: 15 },
      { header: 'URL', key: 'url', width: 50 },
    ];
    
    properties.forEach(property => {
      worksheet.addRow(property);
    });
    
    res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.header('Content-Disposition', `attachment; filename="properties-${Date.now()}.xlsx"`);
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});
```

**File: `src/api/alerts.ts`**

```typescript
import express from 'express';
import { DatabaseService } from '../services/database.js';

export const alertsRouter = express.Router();
const db = new DatabaseService();

// POST /api/alerts - Create new alert
alertsRouter.post('/', async (req, res) => {
  try {
    const { email, phone, criteria } = req.body;
    
    if (!email && !phone) {
      return res.status(400).json({ success: false, error: 'Email or phone required' });
    }
    
    const alertId = await db.createAlert({ email, phone, criteria });
    res.json({ success: true, data: { alertId } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// GET /api/alerts - List all alerts
alertsRouter.get('/', async (req, res) => {
  try {
    const alerts = await db.getAlerts();
    res.json({ success: true, data: alerts });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// DELETE /api/alerts/:id - Delete alert
alertsRouter.delete('/:id', async (req, res) => {
  try {
    await db.deleteAlert(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});
```

### 3. Dashboard UI

**File: `views/dashboard.ejs`**

```html
<!DOCTYPE html>
<html lang="en" class="h-full">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Real Estate Property Monitor</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <script src="/socket.io/socket.io.js"></script>
</head>
<body class="h-full bg-gray-100 dark:bg-gray-900">
  <div class="min-h-full">
    <!-- Navigation -->
    <nav class="bg-white dark:bg-gray-800 shadow">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="flex h-16 justify-between">
          <div class="flex">
            <div class="flex flex-shrink-0 items-center">
              <h1 class="text-2xl font-bold text-gray-900 dark:text-white">🏠 Real Estate Monitor</h1>
            </div>
          </div>
          <div class="flex items-center space-x-4">
            <button id="darkModeToggle" class="p-2 rounded-md text-gray-400 hover:text-gray-500">
              <span class="sr-only">Toggle dark mode</span>
              🌙
            </button>
            <button id="notificationToggle" class="p-2 rounded-md text-gray-400 hover:text-gray-500">
              <span class="sr-only">Enable notifications</span>
              🔔
            </button>
          </div>
        </div>
      </div>
    </nav>
    
    <main class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <!-- Statistics Cards -->
      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div class="px-4 py-5 sm:p-6">
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Properties</dt>
            <dd class="mt-1 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white"><%= stats.total %></dd>
          </div>
        </div>
        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div class="px-4 py-5 sm:p-6">
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">New This Week</dt>
            <dd class="mt-1 text-3xl font-semibold tracking-tight text-green-600"><%= stats.newThisWeek %></dd>
          </div>
        </div>
        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div class="px-4 py-5 sm:p-6">
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Price Drops</dt>
            <dd class="mt-1 text-3xl font-semibold tracking-tight text-blue-600"><%= stats.priceDrops %></dd>
          </div>
        </div>
        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div class="px-4 py-5 sm:p-6">
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Avg Price</dt>
            <dd class="mt-1 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">$<%= Math.round(stats.avgPrice).toLocaleString() %></dd>
          </div>
        </div>
      </div>
      
      <!-- Filters -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-8">
        <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Filters</h2>
        <form id="filterForm" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <input type="number" placeholder="Min Price" name="minPrice" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-2">
          <input type="number" placeholder="Max Price" name="maxPrice" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-2">
          <input type="text" placeholder="City" name="city" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-2">
          <select name="propertyType" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-2">
            <option value="">All Types</option>
            <option value="house">House</option>
            <option value="condo">Condo</option>
            <option value="townhouse">Townhouse</option>
            <option value="apartment">Apartment</option>
          </select>
          <button type="submit" class="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            Apply Filters
          </button>
        </form>
      </div>
      
      <!-- Price Trends Chart -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-8">
        <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Price Trends (Last 30 Days)</h2>
        <canvas id="priceTrendChart" class="w-full" height="100"></canvas>
      </div>
      
      <!-- Export Buttons -->
      <div class="mb-6 flex flex-wrap gap-4">
        <a href="/api/export/csv" class="inline-flex items-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">
          📄 Export CSV
        </a>
        <a href="/api/export/json" class="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
          📦 Export JSON
        </a>
        <a href="/api/export/excel" class="inline-flex items-center rounded-md border border-transparent bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2">
          📊 Export Excel
        </a>
      </div>
      
      <!-- Property Listings Grid -->
      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" id="propertiesGrid">
        <% properties.forEach(property => { %>
          <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg property-card hover:shadow-lg transition-shadow" data-id="<%= property.id %>">
            <% if (property.imageUrl) { %>
              <img src="<%= property.imageUrl %>" alt="<%= property.address %>" class="w-full h-48 object-cover">
            <% } else { %>
              <div class="w-full h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <span class="text-gray-400 text-4xl">🏠</span>
              </div>
            <% } %>
            <div class="px-4 py-5 sm:p-6">
              <div class="flex justify-between items-start mb-2">
                <h3 class="text-2xl font-bold text-gray-900 dark:text-white">$<%= property.price.toLocaleString() %></h3>
                <span class="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"><%= property.source %></span>
              </div>
              <p class="text-sm font-medium text-gray-900 dark:text-white mb-1"><%= property.address %></p>
              <p class="text-sm text-gray-500 dark:text-gray-400 mb-4"><%= property.city %>, <%= property.state %> <%= property.zipCode %></p>
              <div class="flex space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                <span><%= property.bedrooms %> beds</span>
                <span>•</span>
                <span><%= property.bathrooms %> baths</span>
                <% if (property.squareFeet) { %>
                  <span>•</span>
                  <span><%= property.squareFeet.toLocaleString() %> sq ft</span>
                <% } %>
              </div>
              <a href="/property/<%= property.id %>" class="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View Details →
              </a>
            </div>
          </div>
        <% }); %>
      </div>
      
      <% if (properties.length === 0) { %>
        <div class="text-center py-12">
          <p class="text-gray-500 dark:text-gray-400">No properties found. The scraper will run automatically every 2 hours.</p>
        </div>
      <% } %>
    </main>
  </div>
  
  <script src="/js/dashboard.js"></script>
  <script src="/js/charts.js"></script>
  <script src="/js/realtime.js"></script>
</body>
</html>
```

### 4. Client-Side JavaScript

**File: `public/js/realtime.js`**

```javascript
// Real-time updates via WebSocket
const socket = io();

socket.on('connect', () => {
  console.log('Connected to server');
  showToast('Connected', 'Real-time updates enabled', 'success');
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
  showToast('Disconnected', 'Real-time updates paused', 'warning');
});

socket.on('new-property', (property) => {
  console.log('New property:', property);
  showToast('New Property', `${property.address} - $${property.price.toLocaleString()}`, 'info');
  addPropertyToGrid(property);
  
  // Browser notification
  if (Notification.permission === 'granted') {
    new Notification('New Property Available', {
      body: `${property.address} - $${property.price.toLocaleString()}`,
      icon: property.imageUrl || '/images/home-icon.png'
    });
  }
});

socket.on('price-change', (change) => {
  console.log('Price change:', change);
  const percentChange = Math.abs(change.changePercent).toFixed(1);
  const direction = change.changePercent < 0 ? 'dropped' : 'increased';
  
  showToast(
    'Price Change!',
    `${change.address} ${direction} ${percentChange}% to $${change.newPrice.toLocaleString()}`,
    change.changePercent < 0 ? 'success' : 'info'
  );
  
  updatePropertyCard(change.propertyId, change.newPrice);
  
  // Browser notification for price drops
  if (change.changePercent < 0 && Notification.permission === 'granted') {
    new Notification('Price Drop Alert!', {
      body: `${change.address} dropped ${percentChange}% to $${change.newPrice.toLocaleString()}`,
      icon: '/images/price-drop-icon.png'
    });
  }
});

function showToast(title, message, type = 'info') {
  const colors = {
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    error: 'bg-red-600',
    info: 'bg-blue-600'
  };
  
  const toast = document.createElement('div');
  toast.className = `fixed top-4 right-4 ${colors[type]} text-white px-6 py-4 rounded-lg shadow-lg z-50 animate-slide-in max-w-sm`;
  toast.innerHTML = `
    <div class="flex items-start">
      <div class="flex-1">
        <p class="font-bold">${title}</p>
        <p class="text-sm mt-1">${message}</p>
      </div>
      <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
        ✕
      </button>
    </div>
  `;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 5000);
}

function addPropertyToGrid(property) {
  const grid = document.getElementById('propertiesGrid');
  const card = createPropertyCard(property);
  grid.insertBefore(card, grid.firstChild);
  card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function createPropertyCard(property) {
  const card = document.createElement('div');
  card.className = 'bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg property-card hover:shadow-lg transition-shadow animate-fade-in';
  card.dataset.id = property.id;
  
  card.innerHTML = `
    ${property.imageUrl ? 
      `<img src="${property.imageUrl}" alt="${property.address}" class="w-full h-48 object-cover">` :
      `<div class="w-full h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
        <span class="text-gray-400 text-4xl">🏠</span>
      </div>`
    }
    <div class="px-4 py-5 sm:p-6">
      <div class="flex justify-between items-start mb-2">
        <h3 class="text-2xl font-bold text-gray-900 dark:text-white">$${property.price.toLocaleString()}</h3>
        <span class="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">${property.source}</span>
      </div>
      <p class="text-sm font-medium text-gray-900 dark:text-white mb-1">${property.address}</p>
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">${property.city}, ${property.state} ${property.zipCode}</p>
      <div class="flex space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
        <span>${property.bedrooms} beds</span>
        <span>•</span>
        <span>${property.bathrooms} baths</span>
        ${property.squareFeet ? `<span>•</span><span>${property.squareFeet.toLocaleString()} sq ft</span>` : ''}
      </div>
      <a href="/property/${property.id}" class="text-blue-600 hover:text-blue-700 text-sm font-medium">
        View Details →
      </a>
    </div>
  `;
  
  return card;
}

function updatePropertyCard(propertyId, newPrice) {
  const card = document.querySelector(`[data-id="${propertyId}"]`);
  if (card) {
    const priceElement = card.querySelector('h3');
    priceElement.textContent = `$${newPrice.toLocaleString()}`;
    priceElement.classList.add('animate-pulse');
    setTimeout(() => priceElement.classList.remove('animate-pulse'), 2000);
  }
}

// Request notification permission
document.getElementById('notificationToggle')?.addEventListener('click', () => {
  if ('Notification' in window) {
    if (Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          showToast('Notifications Enabled', 'You will receive alerts for new properties and price changes', 'success');
        }
      });
    } else if (Notification.permission === 'granted') {
      showToast('Notifications Already Enabled', 'You are receiving property alerts', 'info');
    } else {
      showToast('Notifications Blocked', 'Please enable notifications in your browser settings', 'warning');
    }
  }
});
```

**File: `public/js/charts.js`**

```javascript
// Price trends chart using Chart.js
document.addEventListener('DOMContentLoaded', () => {
  const ctx = document.getElementById('priceTrendChart');
  if (!ctx) return;
  
  // Fetch price trend data
  fetch('/api/properties?limit=100')
    .then(res => res.json())
    .then(data => {
      const properties = data.data;
      
      // Group by date and calculate average price
      const pricesByDate = {};
      properties.forEach(prop => {
        const date = new Date(prop.listingDate).toLocaleDateString();
        if (!pricesByDate[date]) {
          pricesByDate[date] = { total: 0, count: 0 };
        }
        pricesByDate[date].total += prop.price;
        pricesByDate[date].count += 1;
      });
      
      const labels = Object.keys(pricesByDate).sort();
      const avgPrices = labels.map(date => 
        Math.round(pricesByDate[date].total / pricesByDate[date].count)
      );
      
      new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Average Price',
            data: avgPrices,
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: 'top'
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `Avg Price: $${context.parsed.y.toLocaleString()}`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: false,
              ticks: {
                callback: function(value) {
                  return '$' + value.toLocaleString();
                }
              }
            }
          }
        }
      });
    });
});
```

**File: `public/js/dashboard.js`**

```javascript
// Filter form handling
document.getElementById('filterForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const params = new URLSearchParams();
  
  for (const [key, value] of formData.entries()) {
    if (value) params.append(key, value);
  }
  
  try {
    const response = await fetch(`/api/properties?${params}`);
    const data = await response.json();
    
    if (data.success) {
      updatePropertiesGrid(data.data);
      showToast('Filters Applied', `Found ${data.count} properties`, 'success');
    }
  } catch (error) {
    showToast('Error', 'Failed to filter properties', 'error');
  }
});

function updatePropertiesGrid(properties) {
  const grid = document.getElementById('propertiesGrid');
  grid.innerHTML = '';
  
  if (properties.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full text-center py-12">
        <p class="text-gray-500 dark:text-gray-400">No properties match your filters.</p>
      </div>
    `;
    return;
  }
  
  properties.forEach(property => {
    grid.appendChild(createPropertyCard(property));
  });
}

// Dark mode toggle
document.getElementById('darkModeToggle')?.addEventListener('click', () => {
  document.documentElement.classList.toggle('dark');
  const isDark = document.documentElement.classList.contains('dark');
  localStorage.setItem('darkMode', isDark);
  document.getElementById('darkModeToggle').textContent = isDark ? '☀️' : '🌙';
});

// Load dark mode preference
if (localStorage.getItem('darkMode') === 'true') {
  document.documentElement.classList.add('dark');
  document.getElementById('darkModeToggle').textContent = '☀️';
}
```

### 5. Docker Containerization

**File: `Dockerfile`**

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Tell Playwright to skip download (we installed chromium above)
ENV PLAYWRIGHT_SKIP_CHROMIUM_DOWNLOAD=true
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Install Node dependencies
COPY package*.json ./
RUN npm ci --production

# Copy application code
COPY . .

# Build TypeScript
RUN npm run build

# Expose web server port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Create startup script
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'node dist/server.js &' >> /app/start.sh && \
    echo 'while true; do' >> /app/start.sh && \
    echo '  node dist/index.js' >> /app/start.sh && \
    echo '  sleep 7200' >> /app/start.sh && \
    echo 'done' >> /app/start.sh && \
    chmod +x /app/start.sh

CMD ["/app/start.sh"]
```

**File: `docker-compose.yml`**

```yaml
version: '3.8'

services:
  real-estate-monitor:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - GMAIL_USER=${GMAIL_USER}
      - GMAIL_APP_PASSWORD=${GMAIL_APP_PASSWORD}
      - TWILIO_ACCOUNT_SID=${TWILIO_ACCOUNT_SID}
      - TWILIO_AUTH_TOKEN=${TWILIO_AUTH_TOKEN}
      - TWILIO_PHONE_NUMBER=${TWILIO_PHONE_NUMBER}
      - ALERT_EMAIL=${ALERT_EMAIL}
      - ALERT_PHONE=${ALERT_PHONE}
    volumes:
      - ./data:/app/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

### 6. Updated package.json

Add these dependencies:

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "ejs": "^3.1.9",
    "socket.io": "^4.6.1",
    "json2csv": "^6.0.0-alpha.2",
    "exceljs": "^4.3.0"
  },
  "scripts": {
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:scraper\"",
    "dev:server": "tsx watch src/server.ts",
    "dev:scraper": "tsx watch src/index.ts",
    "start": "node dist/server.js & node dist/index.js"
  }
}
```

### 7. Updated Database Service

Add these methods to `src/services/database.ts`:

```typescript
async getRecentProperties(limit: number = 50): Promise<Property[]> {
  return this.db.all(
    'SELECT * FROM properties ORDER BY listingDate DESC LIMIT ?',
    [limit]
  );
}

async getStats(): Promise<{ total: number; newThisWeek: number; priceDrops: number; avgPrice: number }> {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  
  const [total, newThisWeek, priceDrops, avgPrice] = await Promise.all([
    this.db.get('SELECT COUNT(*) as count FROM properties'),
    this.db.get('SELECT COUNT(*) as count FROM properties WHERE listingDate >= ?', [weekAgo]),
    this.db.get('SELECT COUNT(*) as count FROM price_changes WHERE changePercent < 0 AND date >= ?', [weekAgo]),
    this.db.get('SELECT AVG(price) as avg FROM properties WHERE status = "active"')
  ]);
  
  return {
    total: total.count,
    newThisWeek: newThisWeek.count,
    priceDrops: priceDrops.count,
    avgPrice: avgPrice.avg || 0
  };
}

async getAllProperties(): Promise<Property[]> {
  return this.db.all('SELECT * FROM properties ORDER BY listingDate DESC');
}

async getProperties(filters: any): Promise<Property[]> {
  let query = 'SELECT * FROM properties WHERE 1=1';
  const params: any[] = [];
  
  if (filters.minPrice) {
    query += ' AND price >= ?';
    params.push(filters.minPrice);
  }
  if (filters.maxPrice) {
    query += ' AND price <= ?';
    params.push(filters.maxPrice);
  }
  if (filters.city) {
    query += ' AND city LIKE ?';
    params.push(`%${filters.city}%`);
  }
  if (filters.propertyType) {
    query += ' AND propertyType = ?';
    params.push(filters.propertyType);
  }
  if (filters.minBeds) {
    query += ' AND bedrooms >= ?';
    params.push(filters.minBeds);
  }
  if (filters.minBaths) {
    query += ' AND bathrooms >= ?';
    params.push(filters.minBaths);
  }
  if (filters.source) {
    query += ' AND source = ?';
    params.push(filters.source);
  }
  
  query += ' ORDER BY listingDate DESC';
  
  return this.db.all(query, params);
}
```

---

## UX/UI REQUIREMENTS

### User Experience Goals

1. **Immediate Value**: Dashboard shows data instantly after first scrape
2. **Real-time Updates**: WebSocket notifications for new properties
3. **Easy Filtering**: One-click filters for price, location, type
4. **Export Options**: CSV, JSON, Excel downloads
5. **Mobile-Friendly**: Responsive design works on all devices
6. **Dark Mode**: User preference for light/dark theme
7. **Browser Notifications**: Optional desktop alerts

### Accessibility

- Semantic HTML elements
- ARIA labels for screen readers
- Keyboard navigation support
- High contrast colors
- Focus indicators

### Performance

- Lazy load property images
- Paginate large result sets
- Cache API responses
- WebSocket for updates (no polling)
- Optimized database queries

---

## DEPLOYMENT OPTIONS

### Local Development
```bash
npm run dev
# Opens dashboard at http://localhost:3000
```

### Docker Container
```bash
docker-compose up -d
# Dashboard runs on port 3000
# Scraper runs every 2 hours automatically
```

### Cloud Deployment
```bash
# Deploy to Railway, Heroku, or AWS
# Dashboard accessible via public URL
# GitHub Actions trigger scraper every 2 hours
```

---

## NOTES

- Use fallback selector strategies for reliability
- Implement exponential backoff retry logic
- Handle rate limiting gracefully
- Log all operations for debugging
- Commit database after each successful run
- Follow free-first philosophy throughout
- Document all BYOK alternatives
- **Always include web dashboard for user interaction**
- **Export functionality is mandatory, not optional**
- **Real-time updates enhance UX significantly**
- **Containerization allows easy deployment**

---

**This specification is complete, production-ready, and includes full UI/UX implementation. No pseudo code or examples - all code is ready for immediate deployment by Agent #17.**
