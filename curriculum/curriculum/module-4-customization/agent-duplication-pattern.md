# Agent Duplication Pattern

## Overview

The fastest way to create a custom agent is to duplicate an existing one and modify it. This pattern reduces boilerplate, ensures compatibility with the agent registry, and provides a battle-tested foundation.

**Time to First Custom Agent**: 30-60 minutes

## When to Use Duplication

### ✅ Good Use Cases

- **Specialized Browser Actions**: Need screenshot with custom watermark
- **API Wrappers**: Similar HTTP patterns to existing integrations
- **Data Transformers**: Parse different formats with same structure
- **Multi-Tenant Variations**: Same agent, different configurations per client

### ❌ When to Build from Scratch

- **Completely New Capability**: WebSocket server, ML model integration
- **Different Execution Model**: Long-running daemons vs. one-shot tasks
- **Complex State Management**: Multi-step protocols with persistence

## Step-by-Step Duplication Process

### Step 1: Choose Source Agent

Start with the agent closest to your requirements:

```bash
# View available agents
ls -la src/automation/agents/core/

# Common starting points:
# - browser.ts (for web interactions)
# - http.ts (for API calls - if exists)
# - data.ts (for transformations - if exists)
```

**Decision Matrix:**

| Need | Start With | Complexity |
|------|------------|------------|
| Web scraping variant | browser.ts | Low |
| REST API client | browser.ts (http pattern) | Low |
| Database operations | Create new | Medium |
| Real-time streams | Create new | High |

### Step 2: Copy and Rename

```bash
# Example: Create LinkedIn scraper from browser agent
cd src/automation/agents
mkdir -p custom
cp core/browser.ts custom/linkedin-scraper.ts

# Update the file
```

### Step 3: Modify Class Definition

```typescript
// Before (browser.ts)
export class BrowserAgent {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private config: BrowserAgentConfig;

  constructor(config: BrowserAgentConfig = {}) {
    this.config = {
      headless: config.headless !== false,
      timeout: config.timeout || 30000,
      viewport: config.viewport || { width: 1280, height: 720 },
      ...config
    };
  }
}

// After (linkedin-scraper.ts)
export interface LinkedInScraperConfig extends BrowserAgentConfig {
  loginEmail?: string;
  loginPassword?: string;
  rateLimitDelay?: number;
}

export class LinkedInScraperAgent {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private config: LinkedInScraperConfig;
  private isLoggedIn: boolean = false;

  constructor(config: LinkedInScraperConfig = {}) {
    this.config = {
      headless: config.headless !== false,
      timeout: config.timeout || 30000,
      viewport: config.viewport || { width: 1280, height: 720 },
      rateLimitDelay: config.rateLimitDelay || 2000,
      loginEmail: config.loginEmail || process.env.LINKEDIN_EMAIL,
      loginPassword: config.loginPassword || process.env.LINKEDIN_PASSWORD,
      ...config
    };
  }

  /**
   * Initialize and login to LinkedIn
   */
  async initialize(): Promise<void> {
    await super.initialize(); // Keep parent initialization
    
    if (this.config.loginEmail && this.config.loginPassword) {
      await this.login();
    }
  }

  /**
   * LinkedIn-specific login method
   */
  private async login(): Promise<void> {
    if (!this.page) throw new Error('Browser not initialized');
    
    try {
      await this.page.goto('https://www.linkedin.com/login');
      await this.page.fill('#username', this.config.loginEmail!);
      await this.page.fill('#password', this.config.loginPassword!);
      await this.page.click('[type="submit"]');
      await this.page.waitForNavigation();
      
      this.isLoggedIn = true;
      logger.info('LinkedIn login successful');
    } catch (error) {
      logger.error('LinkedIn login failed', { error });
      throw error;
    }
  }

  /**
   * Scrape profile data (new action)
   */
  async scrapeProfile(profileUrl: string): Promise<ProfileData> {
    if (!this.page) throw new Error('Browser not initialized');
    if (!this.isLoggedIn) throw new Error('Not logged in to LinkedIn');
    
    await this.page.goto(profileUrl);
    
    // Wait for rate limit
    await new Promise(resolve => setTimeout(resolve, this.config.rateLimitDelay));
    
    // Extract profile data
    const profileData = await this.page.evaluate(() => {
      return {
        name: document.querySelector('.pv-text-details__left-panel h1')?.textContent?.trim(),
        headline: document.querySelector('.pv-text-details__left-panel .text-body-medium')?.textContent?.trim(),
        location: document.querySelector('.pv-text-details__left-panel span.text-body-small')?.textContent?.trim(),
        about: document.querySelector('.display-flex.ph5.pv3 > div > span')?.textContent?.trim(),
        // Add more selectors as needed
      };
    });
    
    logger.info('Profile scraped', { profileUrl });
    return profileData as ProfileData;
  }
}

interface ProfileData {
  name?: string;
  headline?: string;
  location?: string;
  about?: string;
}
```

### Step 4: Update Action Methods

Keep useful parent methods, add new ones:

```typescript
export class LinkedInScraperAgent extends BrowserAgent {
  // ✅ Keep these from BrowserAgent
  // - navigate()
  // - click()
  // - type()
  // - screenshot()
  
  // ✅ Add specialized actions
  
  /**
   * Search for profiles by keyword
   */
  async searchProfiles(params: SearchParams): Promise<ProfileSearchResult[]> {
    if (!this.page) throw new Error('Browser not initialized');
    if (!this.isLoggedIn) throw new Error('Not logged in');
    
    const searchUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(params.keywords)}`;
    await this.page.goto(searchUrl);
    
    // Wait for results
    await this.page.waitForSelector('.reusable-search__result-container');
    
    // Extract search results
    const results = await this.page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.reusable-search__result-container'));
      return items.map(item => ({
        name: item.querySelector('.entity-result__title-text')?.textContent?.trim(),
        headline: item.querySelector('.entity-result__primary-subtitle')?.textContent?.trim(),
        profileUrl: item.querySelector('a.app-aware-link')?.getAttribute('href'),
      }));
    });
    
    return results as ProfileSearchResult[];
  }
  
  /**
   * Send connection request
   */
  async sendConnectionRequest(params: ConnectionParams): Promise<void> {
    if (!this.page) throw new Error('Browser not initialized');
    if (!this.isLoggedIn) throw new Error('Not logged in');
    
    await this.page.goto(params.profileUrl);
    
    // Click "Connect" button
    const connectButton = await this.page.$('button:has-text("Connect")');
    if (connectButton) {
      await connectButton.click();
      
      // Add note if provided
      if (params.note) {
        await this.page.click('button:has-text("Add a note")');
        await this.page.fill('textarea', params.note);
      }
      
      await this.page.click('button:has-text("Send")');
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, this.config.rateLimitDelay));
      
      logger.info('Connection request sent', { profileUrl: params.profileUrl });
    }
  }
}

interface SearchParams {
  keywords: string;
  location?: string;
  industry?: string;
}

interface ProfileSearchResult {
  name?: string;
  headline?: string;
  profileUrl?: string;
}

interface ConnectionParams {
  profileUrl: string;
  note?: string;
}
```

### Step 5: Register Custom Agent

Update the agent registry to include your new agent:

```typescript
// src/automation/agents/custom/index.ts
export { LinkedInScraperAgent } from './linkedin-scraper';

// src/automation/agents/core/registry.ts
import { LinkedInScraperAgent } from '../custom/linkedin-scraper';

export class AgentRegistry {
  private registerDefaultAgents(): void {
    // Existing agents...
    
    // Register LinkedIn scraper
    this.registerCapability({
      agent_type: 'linkedin',
      actions: [
        'navigate',
        'scrapeProfile',
        'searchProfiles',
        'sendConnectionRequest'
      ],
      description: 'LinkedIn profile scraping and automation'
    });
    
    logger.info('LinkedIn scraper agent registered');
  }
  
  async getAgent(agentType: string, action: string): Promise<AgentAction | null> {
    const key = `${agentType}:${action}`;
    
    if (this.agents.has(key)) {
      return this.agents.get(key)!;
    }
    
    // Add LinkedIn agent handling
    if (agentType === 'linkedin') {
      const linkedInAgent = new LinkedInScraperAgent();
      await linkedInAgent.initialize();
      
      const actionWrapper: AgentAction = {
        execute: async (params: Record<string, unknown>) => {
          switch (action) {
            case 'scrapeProfile': {
              const profile = await linkedInAgent.scrapeProfile(params.profileUrl as string);
              return { success: true, profile };
            }
            
            case 'searchProfiles': {
              const results = await linkedInAgent.searchProfiles(params as SearchParams);
              return { success: true, results };
            }
            
            case 'sendConnectionRequest': {
              await linkedInAgent.sendConnectionRequest(params as ConnectionParams);
              return { success: true };
            }
            
            default:
              throw new Error(`Unknown action: ${action}`);
          }
        }
      };
      
      this.agents.set(key, actionWrapper);
      return actionWrapper;
    }
    
    // ... rest of agent handling
  }
}
```

### Step 6: Add Environment Configuration

```bash
# .env
LINKEDIN_EMAIL=your.email@example.com
LINKEDIN_PASSWORD=your_secure_password

# .env.example (for documentation)
LINKEDIN_EMAIL=your.email@example.com
LINKEDIN_PASSWORD=your_password
```

### Step 7: Create Tests

```typescript
// tests/agents/custom/linkedin-scraper.test.ts
import { LinkedInScraperAgent } from '../../../src/automation/agents/custom/linkedin-scraper';

describe('LinkedInScraperAgent', () => {
  let agent: LinkedInScraperAgent;
  
  beforeEach(async () => {
    agent = new LinkedInScraperAgent({
      headless: true,
      loginEmail: process.env.LINKEDIN_EMAIL,
      loginPassword: process.env.LINKEDIN_PASSWORD
    });
    await agent.initialize();
  });
  
  afterEach(async () => {
    await agent.cleanup();
  });
  
  describe('scrapeProfile', () => {
    it('should scrape public profile data', async () => {
      const profile = await agent.scrapeProfile('https://www.linkedin.com/in/example');
      
      expect(profile).toHaveProperty('name');
      expect(profile).toHaveProperty('headline');
      expect(profile.name).toBeTruthy();
    }, 30000); // Longer timeout for network requests
  });
  
  describe('searchProfiles', () => {
    it('should search profiles by keyword', async () => {
      const results = await agent.searchProfiles({
        keywords: 'software engineer',
        location: 'San Francisco'
      });
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toHaveProperty('name');
      expect(results[0]).toHaveProperty('profileUrl');
    }, 30000);
  });
  
  describe('error handling', () => {
    it('should throw error when not logged in', async () => {
      const noAuthAgent = new LinkedInScraperAgent({ headless: true });
      await noAuthAgent.initialize();
      
      await expect(
        noAuthAgent.scrapeProfile('https://www.linkedin.com/in/example')
      ).rejects.toThrow('Not logged in');
      
      await noAuthAgent.cleanup();
    });
  });
});
```

### Step 8: Use in Workflow

```json
{
  "name": "Lead Enrichment with LinkedIn",
  "description": "Enrich leads by scraping LinkedIn profiles",
  "definition": {
    "tasks": [
      {
        "name": "search_linkedin",
        "agent_type": "linkedin",
        "action": "searchProfiles",
        "parameters": {
          "keywords": "{{input.jobTitle}} {{input.company}}",
          "location": "{{input.location}}"
        }
      },
      {
        "name": "scrape_top_profile",
        "agent_type": "linkedin",
        "action": "scrapeProfile",
        "parameters": {
          "profileUrl": "{{tasks.search_linkedin.results[0].profileUrl}}"
        }
      },
      {
        "name": "notify_team",
        "agent_type": "slack",
        "action": "postMessage",
        "parameters": {
          "channel": "#sales",
          "text": "Found profile: {{tasks.scrape_top_profile.profile.name}} - {{tasks.scrape_top_profile.profile.headline}}"
        }
      }
    ]
  }
}
```

## Real-World Examples

### Example 1: Multi-Provider Email Agent

```typescript
// Duplicate email sender for different providers
export class SendGridAgent extends EmailAgent {
  constructor(config: SendGridConfig) {
    super(config);
    this.client = sendgrid.client(config.apiKey);
  }
  
  async sendEmail(params: EmailParams): Promise<EmailResult> {
    const msg = {
      to: params.to,
      from: params.from || this.config.defaultFrom,
      subject: params.subject,
      html: params.html || params.text
    };
    
    const response = await this.client.send(msg);
    return {
      success: true,
      messageId: response[0].headers['x-message-id']
    };
  }
}

export class MailgunAgent extends EmailAgent {
  constructor(config: MailgunConfig) {
    super(config);
    this.client = mailgun({
      apiKey: config.apiKey,
      domain: config.domain
    });
  }
  
  async sendEmail(params: EmailParams): Promise<EmailResult> {
    const response = await this.client.messages().send({
      from: params.from || this.config.defaultFrom,
      to: params.to,
      subject: params.subject,
      html: params.html || params.text
    });
    
    return {
      success: true,
      messageId: response.id
    };
  }
}
```

**Usage:** Deploy same workflow to different clients with different email providers.

### Example 2: Region-Specific Scraper

```typescript
// Duplicate browser agent for different regional sites
export class AmazonUSAgent extends AmazonScraperAgent {
  constructor(config: AmazonScraperConfig) {
    super({
      ...config,
      baseUrl: 'https://www.amazon.com',
      currency: 'USD',
      locale: 'en-US'
    });
  }
}

export class AmazonUKAgent extends AmazonScraperAgent {
  constructor(config: AmazonScraperConfig) {
    super({
      ...config,
      baseUrl: 'https://www.amazon.co.uk',
      currency: 'GBP',
      locale: 'en-GB'
    });
  }
  
  // Override price parsing for UK format
  protected parsePrice(priceText: string): number {
    return parseFloat(priceText.replace('£', '').replace(',', ''));
  }
}
```

**Usage:** Single workflow monitors pricing across regions.

### Example 3: Client-Branded Agents

```typescript
// Duplicate notification agent with client branding
export class SlackNotificationAgent {
  constructor(protected config: SlackConfig) {}
  
  async postMessage(params: MessageParams): Promise<void> {
    await this.client.chat.postMessage({
      channel: params.channel,
      text: params.text,
      username: this.config.botName,
      icon_url: this.config.iconUrl
    });
  }
}

// Client A
export class ClientANotificationAgent extends SlackNotificationAgent {
  constructor() {
    super({
      token: process.env.CLIENT_A_SLACK_TOKEN,
      botName: 'Client A Assistant',
      iconUrl: 'https://cdn.example.com/client-a-logo.png'
    });
  }
}

// Client B
export class ClientBNotificationAgent extends SlackNotificationAgent {
  constructor() {
    super({
      token: process.env.CLIENT_B_SLACK_TOKEN,
      botName: 'Client B Bot',
      iconUrl: 'https://cdn.example.com/client-b-logo.png'
    });
  }
}
```

**Usage:** White-label agents for multi-tenant deployments.

## Modification Checklist

Use this checklist when duplicating agents:

### Code Changes
- [ ] Copy source agent file to `src/automation/agents/custom/`
- [ ] Rename class to reflect new purpose
- [ ] Update interface names and types
- [ ] Add/modify configuration options
- [ ] Implement new action methods
- [ ] Update error messages and logging
- [ ] Add input validation for new parameters

### Integration
- [ ] Export agent from `custom/index.ts`
- [ ] Register in `AgentRegistry`
- [ ] Add agent type to workflow schema types
- [ ] Update action routing in registry

### Configuration
- [ ] Add environment variables to `.env`
- [ ] Document variables in `.env.example`
- [ ] Add configuration validation in constructor
- [ ] Set sensible defaults

### Testing
- [ ] Create test file in `tests/agents/custom/`
- [ ] Test initialization and cleanup
- [ ] Test each action method
- [ ] Test error conditions
- [ ] Test with real workflows

### Documentation
- [ ] Add JSDoc comments to public methods
- [ ] Document configuration options
- [ ] Add usage examples in comments
- [ ] Update agent registry documentation

## Common Pitfalls

### ❌ Forgetting to Update Registry

```typescript
// Agent works in isolation but fails in workflows
const agent = new CustomAgent();
await agent.doSomething(); // ✅ Works

// But workflow fails:
// Error: Agent type 'custom' not found
```

**Fix:** Always register in `AgentRegistry.registerDefaultAgents()`

### ❌ Hardcoding Configuration

```typescript
// ❌ DON'T
export class CustomAgent {
  private apiKey = 'sk_live_abc123'; // Committed to git!
}

// ✅ DO
export class CustomAgent {
  private apiKey: string;
  
  constructor(config: CustomConfig) {
    this.apiKey = config.apiKey || process.env.CUSTOM_API_KEY!;
    if (!this.apiKey) throw new Error('API key required');
  }
}
```

### ❌ Ignoring Cleanup

```typescript
// ❌ Resource leak
export class CustomAgent {
  private connection: DatabaseConnection;
  
  async initialize(): Promise<void> {
    this.connection = await connectToDatabase();
  }
  
  // Missing cleanup() method
}

// ✅ Proper cleanup
export class CustomAgent {
  private connection: DatabaseConnection;
  
  async initialize(): Promise<void> {
    this.connection = await connectToDatabase();
  }
  
  async cleanup(): Promise<void> {
    if (this.connection) {
      await this.connection.close();
    }
  }
}
```

### ❌ Inconsistent Error Handling

```typescript
// ❌ Throws raw errors
async execute(action: string, params: any): Promise<any> {
  return await this.apiClient.request(params); // Can throw
}

// ✅ Returns structured response
async execute(action: string, params: any): Promise<AgentResponse> {
  try {
    const result = await this.apiClient.request(params);
    return { success: true, data: result };
  } catch (error) {
    logger.error('Agent action failed', { action, error });
    return {
      success: false,
      error: error.message,
      retryable: this.isRetryable(error)
    };
  }
}
```

## Performance Considerations

### Resource Reuse

```typescript
// ✅ Reuse expensive resources
export class CustomAgent {
  private static browserPool: Browser[] = [];
  
  async initialize(): Promise<void> {
    // Try to reuse from pool
    this.browser = CustomAgent.browserPool.pop() || await chromium.launch();
  }
  
  async cleanup(): Promise<void> {
    // Return to pool instead of closing
    if (this.browser && CustomAgent.browserPool.length < 5) {
      CustomAgent.browserPool.push(this.browser);
    } else if (this.browser) {
      await this.browser.close();
    }
  }
}
```

### Lazy Initialization

```typescript
// ✅ Initialize only when needed
export class CustomAgent {
  private apiClient?: ApiClient;
  
  private async getClient(): Promise<ApiClient> {
    if (!this.apiClient) {
      this.apiClient = new ApiClient(this.config);
      await this.apiClient.connect();
    }
    return this.apiClient;
  }
  
  async execute(action: string, params: any): Promise<any> {
    const client = await this.getClient();
    return await client.request(action, params);
  }
}
```

## Next Steps

- [new-agent-creation.md](./new-agent-creation.md) - Build agents from scratch
- [external-integration-patterns.md](./external-integration-patterns.md) - Connect external systems
- [playbook-structure.md](./playbook-structure.md) - Create reusable workflows

---

> "We duplicated the browser agent 5 times for different scraping needs. Saved 40 hours vs. building from scratch." - Senior Developer
