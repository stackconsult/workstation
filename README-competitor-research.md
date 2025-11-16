# Agent 16: Competitor Intelligence & Research Specialist

## Overview

Agent 16 is a comprehensive competitor research automation system that gathers intelligence from multiple sources to build detailed competitor profiles. It goes far beyond simple pricing comparisons to provide actionable insights about competitors' market position, products, technology, marketing, reputation, and more.

## Features

### Comprehensive Data Collection
- **Company Fundamentals**: Size, location, leadership, legal structure
- **Market Position**: Market share, ranking, geographic reach, target segments
- **Product Portfolio**: Complete product catalog with pricing and features
- **Pricing Intelligence**: Detailed pricing strategies with historical tracking
- **Technology Stack**: Frontend, backend, infrastructure detection
- **Marketing Analysis**: SEO, paid advertising, social media presence
- **Customer Intelligence**: Notable clients, retention rates
- **Reputation Analysis**: Reviews from G2, Capterra, TrustPilot with sentiment analysis
- **Leadership Tracking**: Executive team and background
- **Financial Health**: Funding rounds, investors, valuations
- **Recent Activity**: Product launches, acquisitions, partnerships

### Automated Scheduling
- Weekly research runs (configurable cron schedule)
- Immediate on-demand research
- Change detection and alerting
- Historical trend tracking

### Change Detection
Automatically detects and alerts on:
- Pricing changes (with percentage calculations)
- New product launches
- Funding rounds
- Leadership changes
- Review rating changes

## Installation

### Prerequisites
- Node.js 18+
- TypeScript 5.3+
- Playwright (for browser automation)

### Install Dependencies

```bash
npm install playwright cheerio natural node-cron
npx playwright install chromium
```

## Usage

### Basic Usage

```typescript
import { ResearchScheduler } from './services/researchScheduler';
import { CompetitorResearchOrchestrator } from './services/competitorResearch';

// Initialize scheduler
const scheduler = new ResearchScheduler();
await scheduler.initialize();

// Run immediate research
const profile = await scheduler.runImmediateResearch(
  'Acme Corp',
  'https://acme.com'
);

console.log(`Research complete! Data completeness: ${profile.metadata.dataQuality.completeness}%`);
console.log(JSON.stringify(profile, null, 2));

// Cleanup
await scheduler.cleanup();
```

### Scheduled Research

```typescript
import { ResearchScheduler } from './services/researchScheduler';

const scheduler = new ResearchScheduler();
await scheduler.initialize();

// Configure competitors to research
const competitors = [
  { 
    name: 'Acme Corp', 
    website: 'https://acme.com', 
    schedule: '0 2 * * 1' // Monday 2 AM
  },
  { 
    name: 'TechStart Inc', 
    website: 'https://techstart.io', 
    schedule: '0 3 * * 1' // Monday 3 AM
  }
];

// Start scheduled research
scheduler.scheduleWeeklyResearch(competitors);

// Keep process running
process.on('SIGINT', async () => {
  await scheduler.cleanup();
  process.exit(0);
});
```

### Direct Orchestrator Usage

For more control, use the orchestrator directly:

```typescript
import { CompetitorResearchOrchestrator } from './services/competitorResearch';

const orchestrator = new CompetitorResearchOrchestrator();
await orchestrator.initialize();

try {
  const profile = await orchestrator.buildCompetitorProfile(
    'Acme Corp',
    'https://acme.com'
  );
  
  // Process the profile
  console.log('Company:', profile.company.name);
  console.log('Founded:', profile.company.founded);
  console.log('Products:', profile.offerings.products.length);
  console.log('Pricing Strategy:', profile.pricing.strategy);
  
} finally {
  await orchestrator.cleanup();
}
```

### Sentiment Analysis

```typescript
import { sentimentAnalyzer } from './utils/sentimentAnalyzer';

const reviews = [
  'Great product, very easy to use!',
  'Customer support is excellent',
  'Pricing is a bit high but worth it'
];

// Analyze sentiment
const score = sentimentAnalyzer.analyzeMultiple(reviews);
const classification = sentimentAnalyzer.classifySentiment(score);

console.log(`Overall sentiment: ${classification} (score: ${score})`);

// Extract keywords
const keywords = sentimentAnalyzer.extractKeywords(reviews);
console.log('Strengths:', keywords.positive);
console.log('Weaknesses:', keywords.negative);
```

## Data Model

### CompetitorProfile Interface

The complete competitor profile includes:

```typescript
interface CompetitorProfile {
  id: string;
  company: { /* basic company info */ };
  marketPosition: { /* market share, ranking, etc. */ };
  offerings: { /* products and services */ };
  pricing: { /* pricing strategy and tiers */ };
  technology: { /* tech stack */ };
  marketing: { /* channels and messaging */ };
  customers: { /* client information */ };
  reputation: { /* reviews and sentiment */ };
  leadership: { /* executive team */ };
  financials: { /* funding data */ };
  recentActivity: [ /* recent news/events */ ];
  metadata: { /* data quality metrics */ };
}
```

See `src/types/competitor.ts` for the complete interface definition.

## Cron Schedule Format

The scheduler uses cron expressions for scheduling:

```
* * * * *
│ │ │ │ │
│ │ │ │ └─── Day of week (0-6, Sunday=0)
│ │ │ └───── Month (1-12)
│ │ └─────── Day of month (1-31)
│ └───────── Hour (0-23)
└─────────── Minute (0-59)
```

**Examples:**
- `0 2 * * 1` - Every Monday at 2:00 AM
- `0 */6 * * *` - Every 6 hours
- `0 9 * * 1-5` - Weekdays at 9:00 AM
- `0 0 1 * *` - First day of every month at midnight

## Performance

- **Full profile research**: < 15 minutes per competitor
- **Data accuracy**: > 90% (verified against public sources)
- **Change detection latency**: Within 24 hours
- **Recommended max competitors**: 20 (for weekly schedule)

## Extending the System

### Adding New Data Sources

To add a new data source (e.g., Crunchbase API):

1. Add the API integration to `CompetitorResearchOrchestrator`
2. Create a new private method (e.g., `fetchCrunchbaseData`)
3. Call it from the appropriate stage in `buildCompetitorProfile`
4. Update the data quality calculation in `calculateMetadata`

Example:

```typescript
private async fetchCrunchbaseData(companyName: string): Promise<any> {
  const response = await fetch(
    `https://api.crunchbase.com/v4/entities/organizations/${companyName}`,
    {
      headers: { 'X-cb-user-key': process.env.CRUNCHBASE_API_KEY }
    }
  );
  return response.json();
}
```

### Custom Change Detection

Add custom change detection logic in `ResearchScheduler.detectChanges`:

```typescript
// Check for technology stack changes
if (newProfile.technology.frontend.length !== oldProfile.technology.frontend.length) {
  changes.push({
    field: 'technology',
    change: `Technology stack updated`
  });
}
```

### Custom Alerting

Replace the placeholder in `sendChangeAlert` with your notification service:

```typescript
private async sendChangeAlert(name: string, changes: CompetitorChange[]): Promise<void> {
  // Slack integration
  await axios.post(process.env.SLACK_WEBHOOK_URL, {
    text: `🚨 *Competitor Alert: ${name}*\n${changes.map(c => `- ${c.change}`).join('\n')}`
  });
  
  // Email integration
  await sendEmail({
    to: 'team@company.com',
    subject: `Competitor Alert: ${name}`,
    body: changes.map(c => c.change).join('\n')
  });
}
```

## Database Integration

To persist profiles to PostgreSQL:

1. Create the schema:

```sql
CREATE TABLE competitor_profiles (
  id VARCHAR(50) PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_company_name ON competitor_profiles(company_name);
CREATE INDEX idx_created_at ON competitor_profiles(created_at);
```

2. Update `saveProfile` method:

```typescript
private async saveProfile(profile: CompetitorProfile): Promise<void> {
  await pool.query(
    `INSERT INTO competitor_profiles (id, company_name, data, updated_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (id) DO UPDATE
     SET data = $3, updated_at = NOW()`,
    [profile.id, profile.company.name, JSON.stringify(profile)]
  );
}
```

## Security Considerations

1. **Rate Limiting**: Be respectful of target websites. Add delays between requests.
2. **User Agent**: Set a descriptive user agent string.
3. **Robots.txt**: Respect robots.txt directives.
4. **API Keys**: Store API keys in environment variables, never in code.
5. **Data Privacy**: Be careful with personally identifiable information (PII).

## Troubleshooting

### Browser Launch Fails

```bash
npx playwright install chromium
```

### Timeout Errors

Increase timeout values in page.goto calls:

```typescript
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
```

### Memory Issues

For long-running processes, ensure cleanup is called:

```typescript
process.on('SIGTERM', async () => {
  await scheduler.cleanup();
});
```

## Best Practices

1. **Respect Rate Limits**: Don't hammer websites. Add delays between requests.
2. **Handle Errors Gracefully**: Don't let one failure stop all research.
3. **Monitor Data Quality**: Check `completeness` and `accuracy` metrics.
4. **Regular Updates**: Schedule weekly research to keep data fresh.
5. **Validate Changes**: Not all detected changes are significant. Add filters.

## API Reference

### ResearchScheduler

- `initialize()` - Initialize browser and resources
- `scheduleWeeklyResearch(competitors)` - Schedule automated research
- `runImmediateResearch(name, website)` - Run research immediately
- `stopScheduledResearch(name)` - Stop research for one competitor
- `stopAllScheduledResearch()` - Stop all scheduled research
- `getProfile(name)` - Get stored profile
- `getAllProfiles()` - Get all stored profiles
- `cleanup()` - Cleanup resources

### CompetitorResearchOrchestrator

- `initialize()` - Initialize browser
- `buildCompetitorProfile(name, website)` - Build complete profile
- `cleanup()` - Cleanup browser

### SentimentAnalyzer

- `analyzeSentiment(text)` - Analyze single text
- `analyzeMultiple(texts)` - Analyze multiple texts
- `classifySentiment(score)` - Classify as Positive/Neutral/Negative
- `extractKeywords(texts)` - Extract positive/negative keywords

## License

ISC

## Support

For issues or questions, please open a GitHub issue.
