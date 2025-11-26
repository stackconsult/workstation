# Handoff to Agent#17: Enterprise-Grade Production Code Implementation

## Context

This repository requires replacement of mock/pseudo code with enterprise-grade production implementations. All dependencies have been installed and the build is passing. This document provides detailed instructions for implementing production-quality code.

## Current State

✅ **Build Status:** Passing  
✅ **Dependencies:** All required packages installed  
✅ **TypeScript:** No compilation errors  
⚠️ **Implementation:** Mock code needs replacement  

## Installed Dependencies

The following production-ready packages have been installed:

```json
{
  "dependencies": {
    "@googleapis/gmail": "latest",
    "nodemailer": "latest",
    "imap-simple": "latest",
    "mailparser": "latest",
    "rss-parser": "latest",
    "systeminformation": "latest"
  },
  "devDependencies": {
    "@types/nodemailer": "latest",
    "@types/mailparser": "latest"
  }
}
```

## Implementation Tasks

### Task 1: Email Agent - Gmail Integration (PRIORITY 1)
**File:** `src/automation/agents/integration/email.ts`

#### Current State (Mock)
```typescript
private async connectGmail(): Promise<void> {
    // Placeholder implementation
    this.connection = {
        provider: 'gmail',
        email: this.config.email
    };
}
```

#### Required Implementation
1. **OAuth2 Authentication**
   - Integrate with Google OAuth2 flow
   - Use existing JWT system for token management
   - Store refresh tokens securely
   - Handle token expiration and refresh

2. **Gmail API Integration**
   ```typescript
   import { gmail_v1, google } from '@googleapis/gmail';
   
   private async connectGmail(): Promise<void> {
       const oauth2Client = new google.auth.OAuth2(
           process.env.GMAIL_CLIENT_ID,
           process.env.GMAIL_CLIENT_SECRET,
           process.env.GMAIL_REDIRECT_URI
       );
       
       // Set credentials from stored tokens
       oauth2Client.setCredentials({
           refresh_token: this.config.refreshToken
       });
       
       this.connection = google.gmail({
           version: 'v1',
           auth: oauth2Client
       });
       
       // Verify connection
       await this.connection.users.getProfile({ userId: 'me' });
   }
   ```

3. **Send Email Implementation**
   - Replace mock `sendEmail` with real Gmail API calls
   - Support attachments
   - Handle HTML and plain text
   - Implement retry logic

4. **Receive Email Implementation**
   - Replace mock `getUnreadEmails` with real Gmail API
   - Support filtering by date, folder, sender
   - Parse email content properly
   - Handle attachments

#### Environment Variables Required
```env
GMAIL_CLIENT_ID=your_client_id
GMAIL_CLIENT_SECRET=your_client_secret
GMAIL_REDIRECT_URI=http://localhost:3000/auth/google/callback
```

---

### Task 2: Email Agent - IMAP/SMTP Integration (PRIORITY 1)
**File:** `src/automation/agents/integration/email.ts`

#### Required Implementation
1. **IMAP Connection**
   ```typescript
   import imaps from 'imap-simple';
   import { simpleParser } from 'mailparser';
   
   private async connectCustom(): Promise<void> {
       const config = {
           imap: {
               user: this.config.email,
               password: this.config.password,
               host: this.config.imapHost,
               port: this.config.imapPort || 993,
               tls: true,
               authTimeout: 3000
           }
       };
       
       this.connection = await imaps.connect(config);
   }
   ```

2. **SMTP Sending**
   ```typescript
   import nodemailer from 'nodemailer';
   
   async sendEmail(params: {...}): Promise<{ messageId: string }> {
       const transporter = nodemailer.createTransporter({
           host: this.config.smtpHost,
           port: this.config.smtpPort || 587,
           secure: this.config.smtpPort === 465,
           auth: {
               user: this.config.email,
               pass: this.config.password
           }
       });
       
       const info = await transporter.sendMail({
           from: this.config.email,
           to: params.to,
           subject: params.subject,
           text: params.body,
           html: params.html,
           attachments: params.attachments
       });
       
       return { messageId: info.messageId };
   }
   ```

3. **IMAP Email Fetching**
   - Fetch unread messages
   - Parse email content with mailparser
   - Extract attachments
   - Mark as read/unread

---

### Task 3: RSS Feed Parser (PRIORITY 2)
**File:** `src/automation/agents/data/rss.ts`

#### Current State (Mock)
```typescript
const mockFeed = {
    title: 'Example Feed',
    description: 'Example RSS feed',
    items: [/* mock data */]
};
```

#### Required Implementation
```typescript
import Parser from 'rss-parser';

async fetchFeed(params: {
    url: string;
    maxItems?: number;
}): Promise<{
    title: string;
    description: string;
    items: RssItem[];
}> {
    logger.info('Fetching RSS feed', { url: params.url });
    
    const parser = new Parser({
        customFields: {
            item: [
                ['media:content', 'media'],
                ['media:thumbnail', 'thumbnail']
            ]
        }
    });
    
    try {
        const feed = await parser.parseURL(params.url);
        
        const maxItems = params.maxItems || 20;
        const items: RssItem[] = feed.items.slice(0, maxItems).map(item => ({
            title: item.title || '',
            link: item.link || '',
            content: item.content || item['content:encoded'] || '',
            contentSnippet: item.contentSnippet || '',
            pubDate: item.pubDate || new Date().toISOString(),
            categories: item.categories || []
        }));
        
        return {
            title: feed.title || '',
            description: feed.description || '',
            items
        };
    } catch (error) {
        logger.error('Failed to fetch RSS feed', { url: params.url, error });
        throw new Error(`RSS feed fetch failed: ${(error as Error).message}`);
    }
}
```

#### Features to Add
- Support for RSS 2.0, RSS 1.0, and Atom feeds
- Handle invalid/malformed feeds gracefully
- Add caching to avoid excessive requests
- Support authentication for protected feeds

---

### Task 4: System Metrics Monitoring (PRIORITY 3)
**File:** `src/middleware/rate-limiter.ts`

#### Current State (Mock)
```typescript
private updateLoad(): void {
    this.currentLoad = Math.random(); // Mock load
}
```

#### Required Implementation
```typescript
import * as si from 'systeminformation';

private async updateLoad(): Promise<void> {
    try {
        // Get CPU load
        const cpu = await si.currentLoad();
        const cpuLoad = cpu.currentLoad / 100; // Normalize to 0-1
        
        // Get memory usage
        const mem = await si.mem();
        const memLoad = mem.used / mem.total;
        
        // Get network stats (optional)
        const netStats = await si.networkStats();
        
        // Calculate weighted load
        // 50% CPU, 30% Memory, 20% Network
        this.currentLoad = (cpuLoad * 0.5) + (memLoad * 0.3);
        
        // Log metrics for monitoring
        logger.debug('System metrics updated', {
            cpuLoad: (cpuLoad * 100).toFixed(2) + '%',
            memLoad: (memLoad * 100).toFixed(2) + '%',
            currentLoad: (this.currentLoad * 100).toFixed(2) + '%'
        });
    } catch (error) {
        logger.error('Failed to update system metrics', { error });
        // Fallback to conservative estimate
        this.currentLoad = 0.5;
    }
}
```

#### Features to Add
- Configurable metric weights
- Historical load tracking
- Alert thresholds
- Integration with monitoring systems (Prometheus, Datadog, etc.)

---

### Task 5: Email Verification Endpoint (PRIORITY 4)
**File:** `src/routes/auth.ts`

#### Current State (Mock)
```typescript
router.get('/verify/:token', async (req: Request, res: Response) => {
  // TODO: Implement email verification logic
  res.json({
    success: true,
    message: 'Email verification endpoint (not yet implemented)'
  });
});
```

#### Required Implementation

1. **Token Generation (in registration endpoint)**
   ```typescript
   import crypto from 'crypto';
   import { sendVerificationEmail } from '../services/email';
   
   // During user registration
   const verificationToken = crypto.randomBytes(32).toString('hex');
   const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
   
   // Store in database (pseudo-code)
   await db.users.update({
       email,
       verificationToken,
       tokenExpiry,
       verified: false
   });
   
   // Send verification email
   await sendVerificationEmail({
       to: email,
       token: verificationToken
   });
   ```

2. **Verification Endpoint Implementation**
   ```typescript
   router.get('/verify/:token', async (req: Request, res: Response) => {
       try {
           const { token } = req.params;
           
           // Find user with token
           const user = await db.users.findOne({ verificationToken: token });
           
           if (!user) {
               return res.status(404).json({
                   success: false,
                   error: 'Invalid or expired verification token'
               });
           }
           
           // Check expiry
           if (new Date() > user.tokenExpiry) {
               return res.status(400).json({
                   success: false,
                   error: 'Verification token has expired'
               });
           }
           
           // Mark as verified
           await db.users.update({
               email: user.email,
               verified: true,
               verificationToken: null,
               tokenExpiry: null
           });
           
           res.json({
               success: true,
               message: 'Email verified successfully'
           });
       } catch (error) {
           logger.error('Email verification failed', { error });
           res.status(500).json({
               success: false,
               error: 'Verification failed'
           });
       }
   });
   ```

3. **Email Template**
   - Create HTML email template for verification
   - Include verification link with token
   - Add branding and styling

---

### Task 6: Competitor Research (PRIORITY 5)
**File:** `src/services/competitorResearch.ts`

#### Market Position Analysis
```typescript
private async analyzeMarketPosition(
    name: string, 
    website: string
): Promise<CompetitorProfile['marketPosition']> {
    try {
        // Option 1: Use external APIs (if available)
        // const similarWebData = await this.fetchSimilarWebData(website);
        // const crunchbaseData = await this.fetchCrunchbaseData(name);
        
        // Option 2: Web scraping approach
        const page = await this.browser!.newPage();
        await page.goto(website);
        
        // Scrape meta tags, about pages, etc.
        const marketData = await page.evaluate(() => {
            // Extract market information from page
            const category = document.querySelector('meta[name="category"]')?.getAttribute('content');
            const description = document.querySelector('meta[name="description"]')?.getAttribute('content');
            
            return { category, description };
        });
        
        await page.close();
        
        return {
            marketShare: null, // Requires external data
            ranking: null,     // Requires external data
            category: marketData.category || 'Technology',
            subcategories: [],
            geographicReach: ['USA'], // Default
            targetMarket: {
                b2b: true,
                b2c: false,
                b2g: false,
                segments: []
            }
        };
    } catch (error) {
        logger.error('Market position analysis failed', { error });
        return this.getDefaultMarketPosition();
    }
}
```

#### Tech Stack Detection
```typescript
private async detectTechStack(website: string): Promise<CompetitorProfile['technology']> {
    try {
        const page = await this.browser!.newPage();
        await page.goto(website);
        
        const techStack = await page.evaluate(() => {
            const detectedTech = {
                frontend: [] as string[],
                backend: [] as string[],
                infrastructure: [] as string[],
                security: [] as string[],
                integrations: [] as string[]
            };
            
            // Detect frontend frameworks
            if ((window as any).React) detectedTech.frontend.push('React');
            if ((window as any).Vue) detectedTech.frontend.push('Vue.js');
            if ((window as any).angular) detectedTech.frontend.push('Angular');
            
            // Detect analytics/tracking
            if ((window as any).ga) detectedTech.integrations.push('Google Analytics');
            if ((window as any).dataLayer) detectedTech.integrations.push('Google Tag Manager');
            
            // Check HTTP headers for server info
            // This requires network inspection
            
            return detectedTech;
        });
        
        await page.close();
        return techStack;
    } catch (error) {
        logger.error('Tech stack detection failed', { error });
        return this.getDefaultTechStack();
    }
}
```

---

## Quality Standards

### Code Quality
- ✅ Full TypeScript type safety
- ✅ Comprehensive error handling
- ✅ Proper logging at all levels
- ✅ Input validation
- ✅ Security best practices

### Testing
- ✅ Unit tests for all new code
- ✅ Integration tests for external services
- ✅ Mock external dependencies in tests
- ✅ Test error scenarios

### Documentation
- ✅ JSDoc comments for all public methods
- ✅ README updates for new features
- ✅ API documentation updates
- ✅ Configuration examples

### Security
- ✅ Secrets in environment variables
- ✅ Input sanitization
- ✅ Rate limiting
- ✅ Authentication/authorization
- ✅ Secure credential storage

---

## Testing Checklist

After implementation, verify:

- [ ] All TypeScript compilation errors resolved
- [ ] `npm run build` succeeds
- [ ] `npm run lint` passes
- [ ] `npm test` passes
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Security audit passed
- [ ] Documentation updated

---

## Deployment Notes

### Environment Variables
Ensure these are set in production:

```env
# Gmail API (if using Gmail)
GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=
GMAIL_REDIRECT_URI=

# SMTP/IMAP (for custom email)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
IMAP_HOST=
IMAP_PORT=

# Database (for email verification)
DATABASE_URL=

# External APIs (optional)
CRUNCHBASE_API_KEY=
SIMILARWEB_API_KEY=
```

---

## Success Criteria

Implementation is complete when:

1. ✅ All mock implementations replaced with production code
2. ✅ All dependencies properly integrated
3. ✅ Full test coverage (>80%)
4. ✅ No security vulnerabilities
5. ✅ Documentation complete
6. ✅ Code review approved
7. ✅ Performance benchmarks met
8. ✅ Error handling comprehensive

---

## Support & References

### Documentation Links
- [Gmail API Docs](https://developers.google.com/gmail/api)
- [Nodemailer Docs](https://nodemailer.com/)
- [IMAP Simple Docs](https://www.npmjs.com/package/imap-simple)
- [RSS Parser Docs](https://www.npmjs.com/package/rss-parser)
- [SystemInformation Docs](https://systeminformation.io/)

### Code Examples
- See `/examples` directory for reference implementations
- Review existing agents for patterns and conventions
- Follow repository coding standards

---

**Agent#17: You are authorized to make all necessary changes to implement enterprise-grade production code. Focus on quality, security, and maintainability.**
