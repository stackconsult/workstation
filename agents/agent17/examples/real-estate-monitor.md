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

## NOTES

- Use fallback selector strategies for reliability
- Implement exponential backoff retry logic
- Handle rate limiting gracefully
- Log all operations for debugging
- Commit database after each successful run
- Follow free-first philosophy throughout
- Document all BYOK alternatives

---

**This specification is complete and ready for autonomous implementation by Agent #17.**
