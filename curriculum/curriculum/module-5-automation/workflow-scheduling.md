# Workflow Scheduling

## Overview

Learn to schedule and automate workflows using multiple scheduling approaches: node-cron for in-process scheduling, GitHub Actions for cloud-based workflows, and system-level cron for maximum reliability. This guide covers everything from simple daily tasks to complex multi-step orchestrations.

## Table of Contents

1. [Scheduling Fundamentals](#scheduling-fundamentals)
2. [Node-Cron Implementation](#node-cron-implementation)
3. [GitHub Actions Scheduling](#github-actions-scheduling)
4. [System Cron Integration](#system-cron-integration)
5. [Advanced Scheduling Patterns](#advanced-scheduling-patterns)
6. [Error Handling and Retries](#error-handling-and-retries)
7. [Monitoring and Observability](#monitoring-and-observability)
8. [Production Best Practices](#production-best-practices)

## Scheduling Fundamentals

### Understanding Cron Syntax

Cron expressions define when tasks should run:

```
 ┌───────────── minute (0 - 59)
 │ ┌───────────── hour (0 - 23)
 │ │ ┌───────────── day of month (1 - 31)
 │ │ │ ┌───────────── month (1 - 12)
 │ │ │ │ ┌───────────── day of week (0 - 6) (Sunday=0)
 │ │ │ │ │
 * * * * *
```

**Common Examples:**
```bash
# Every minute
* * * * *

# Every 5 minutes
*/5 * * * *

# Every hour at minute 0
0 * * * *

# Every day at 2:00 AM
0 2 * * *

# Every Monday at 9:00 AM
0 9 * * 1

# First day of every month at midnight
0 0 1 * *

# Every 15 minutes during business hours (9 AM - 5 PM, Mon-Fri)
*/15 9-17 * * 1-5

# Twice daily (9 AM and 6 PM)
0 9,18 * * *
```

### Choosing the Right Scheduling Approach

| Approach | Best For | Pros | Cons |
|----------|----------|------|------|
| **node-cron** | Simple in-app tasks | Easy setup, no external deps | Requires app running, single instance |
| **GitHub Actions** | CI/CD, cloud workflows | Managed infrastructure, free tier | Limited to 1 hour max runtime |
| **System Cron** | Mission-critical tasks | OS-level reliability | Requires server access, manual setup |

**Decision Matrix:**

```typescript
interface SchedulingDecision {
  taskType: string;
  frequency: string;
  reliability: 'high' | 'medium' | 'low';
  duration: string;
  recommendation: string;
}

const decisions: SchedulingDecision[] = [
  {
    taskType: 'Health checks',
    frequency: 'Every 5 minutes',
    reliability: 'high',
    duration: '< 1 second',
    recommendation: 'node-cron (in-process, fast)'
  },
  {
    taskType: 'Daily reports',
    frequency: 'Once per day',
    reliability: 'medium',
    duration: '5-10 minutes',
    recommendation: 'GitHub Actions (managed, reliable)'
  },
  {
    taskType: 'Weekly backups',
    frequency: 'Once per week',
    reliability: 'high',
    duration: '30+ minutes',
    recommendation: 'System cron (mission-critical)'
  },
  {
    taskType: 'Real-time processing',
    frequency: 'Continuous',
    reliability: 'high',
    duration: 'Variable',
    recommendation: 'Event-driven (not cron-based)'
  }
];
```

## Node-Cron Implementation

### Installation and Setup

```bash
# Install node-cron with TypeScript types
npm install node-cron @types/node-cron

# Install dependencies for our example
npm install winston axios
```

### Basic Scheduler Implementation

Create `src/automation/scheduler.ts`:

```typescript
import cron from 'node-cron';
import { logger } from '../utils/logger';
import { sendSlackNotification } from '../services/slack';

/**
 * Centralized scheduler for all automated workflows
 */
class WorkflowScheduler {
  private tasks: Map<string, cron.ScheduledTask> = new Map();

  /**
   * Register a new scheduled task
   */
  registerTask(
    name: string,
    schedule: string,
    handler: () => Promise<void>,
    options: cron.ScheduleOptions = {}
  ): void {
    logger.info(`Registering scheduled task: ${name}`, { schedule });

    const task = cron.schedule(schedule, async () => {
      const startTime = Date.now();
      logger.info(`Starting scheduled task: ${name}`);

      try {
        await handler();
        const duration = Date.now() - startTime;
        logger.info(`Completed scheduled task: ${name}`, { duration });
      } catch (error) {
        const duration = Date.now() - startTime;
        logger.error(`Failed scheduled task: ${name}`, {
          error: error instanceof Error ? error.message : 'Unknown error',
          duration
        });
        
        // Send alert for critical tasks
        if (options.critical) {
          await sendSlackNotification(
            `🚨 Critical task failed: ${name}\nError: ${error instanceof Error ? error.message : 'Unknown'}`
          );
        }
      }
    }, {
      scheduled: false, // Start manually
      timezone: options.timezone || 'America/Denver',
      ...options
    });

    this.tasks.set(name, task);
  }

  /**
   * Start a specific task
   */
  startTask(name: string): void {
    const task = this.tasks.get(name);
    if (task) {
      task.start();
      logger.info(`Started scheduled task: ${name}`);
    } else {
      logger.warn(`Task not found: ${name}`);
    }
  }

  /**
   * Start all registered tasks
   */
  startAll(): void {
    logger.info(`Starting all scheduled tasks (${this.tasks.size} tasks)`);
    this.tasks.forEach((task, name) => {
      task.start();
      logger.info(`Started: ${name}`);
    });
  }

  /**
   * Stop a specific task
   */
  stopTask(name: string): void {
    const task = this.tasks.get(name);
    if (task) {
      task.stop();
      logger.info(`Stopped scheduled task: ${name}`);
    }
  }

  /**
   * Stop all tasks
   */
  stopAll(): void {
    logger.info('Stopping all scheduled tasks');
    this.tasks.forEach((task, name) => {
      task.stop();
      logger.info(`Stopped: ${name}`);
    });
  }

  /**
   * Get status of all tasks
   */
  getStatus(): Array<{ name: string; running: boolean }> {
    return Array.from(this.tasks.entries()).map(([name, task]) => ({
      name,
      running: task.getStatus() === 'running'
    }));
  }
}

// Singleton instance
export const scheduler = new WorkflowScheduler();

// Register default workflows
export function registerDefaultWorkflows(): void {
  // Health check every 5 minutes
  scheduler.registerTask(
    'health-check',
    '*/5 * * * *',
    async () => {
      // Implementation in next section
    },
    { timezone: 'America/Denver' }
  );

  // Daily report at 9 AM
  scheduler.registerTask(
    'daily-report',
    '0 9 * * *',
    async () => {
      logger.info('Generating daily report');
      // Report generation logic
    },
    { timezone: 'America/Denver', critical: true }
  );

  // Weekly cleanup every Sunday at 2 AM
  scheduler.registerTask(
    'weekly-cleanup',
    '0 2 * * 0',
    async () => {
      logger.info('Running weekly cleanup');
      // Cleanup logic
    },
    { timezone: 'America/Denver' }
  );

  // Hourly metrics collection
  scheduler.registerTask(
    'metrics-collection',
    '0 * * * *',
    async () => {
      logger.info('Collecting metrics');
      // Metrics collection logic
    }
  );
}
```

### Real-World Workflow Examples

#### Example 1: Lead Enrichment Workflow

```typescript
// src/automation/workflows/lead-enrichment.ts
import { scheduler } from '../scheduler';
import { logger } from '../../utils/logger';
import { sendSlackNotification } from '../../services/slack';
import axios from 'axios';

interface Lead {
  email: string;
  name?: string;
  company?: string;
  enriched: boolean;
}

export function registerLeadEnrichmentWorkflow(): void {
  scheduler.registerTask(
    'lead-enrichment',
    '0 2 * * *', // Every night at 2 AM
    async () => {
      logger.info('Starting lead enrichment workflow');

      // Fetch unenriched leads
      const leads = await fetchUnenrichedLeads();
      logger.info(`Found ${leads.length} leads to enrich`);

      let enriched = 0;
      let failed = 0;

      for (const lead of leads) {
        try {
          // Enrich lead with external API
          const enrichedData = await enrichLead(lead);
          await saveEnrichedLead(enrichedData);
          enriched++;
        } catch (error) {
          logger.error('Failed to enrich lead', { lead, error });
          failed++;
        }
      }

      // Send summary to Slack
      await sendSlackNotification(
        `📊 Lead Enrichment Complete\n` +
        `✅ Enriched: ${enriched}\n` +
        `❌ Failed: ${failed}\n` +
        `📧 Total Processed: ${leads.length}`
      );

      logger.info('Lead enrichment workflow complete', {
        enriched,
        failed,
        total: leads.length
      });
    },
    {
      timezone: 'America/Denver',
      critical: true
    }
  );
}

async function fetchUnenrichedLeads(): Promise<Lead[]> {
  // Fetch from your database or CRM
  return [
    { email: 'john@example.com', enriched: false },
    { email: 'jane@example.com', enriched: false }
  ];
}

async function enrichLead(lead: Lead): Promise<Lead> {
  // Call enrichment API (e.g., Clearbit, Hunter.io)
  const response = await axios.get(
    `https://api.clearbit.com/v2/people/find?email=${lead.email}`,
    {
      headers: { Authorization: `Bearer ${process.env.CLEARBIT_API_KEY}` }
    }
  );

  return {
    ...lead,
    name: response.data.name.fullName,
    company: response.data.employment.name,
    enriched: true
  };
}

async function saveEnrichedLead(lead: Lead): Promise<void> {
  // Save to database
  logger.info('Saved enriched lead', { email: lead.email });
}
```

#### Example 2: Social Media Posting Workflow

```typescript
// src/automation/workflows/social-media-posting.ts
import { scheduler } from '../scheduler';
import { logger } from '../../utils/logger';
import { sendSlackNotification } from '../../services/slack';

interface Post {
  id: string;
  content: string;
  platforms: string[];
  scheduledFor: Date;
}

export function registerSocialMediaWorkflow(): void {
  // Post 3 times daily: 9 AM, 2 PM, 6 PM
  const postTimes = ['0 9 * * *', '0 14 * * *', '0 18 * * *'];

  postTimes.forEach((schedule, index) => {
    scheduler.registerTask(
      `social-media-post-${index + 1}`,
      schedule,
      async () => {
        logger.info(`Starting social media post #${index + 1}`);

        // Get scheduled posts for this time slot
        const posts = await getScheduledPosts(new Date());

        for (const post of posts) {
          try {
            // Post to each platform
            const results = await publishToAllPlatforms(post);

            // Notify client in Slack
            await sendSlackNotification(
              `✅ Posted to social media\n` +
              `📝 Content: ${post.content.substring(0, 100)}...\n` +
              `🌐 Platforms: ${post.platforms.join(', ')}\n` +
              `🔗 Results: ${results.join(', ')}`
            );

            logger.info('Social media post successful', {
              postId: post.id,
              platforms: post.platforms
            });
          } catch (error) {
            logger.error('Social media post failed', { post, error });
            await sendSlackNotification(
              `🚨 Failed to post to social media\n` +
              `Post ID: ${post.id}\n` +
              `Error: ${error instanceof Error ? error.message : 'Unknown'}`
            );
          }
        }
      },
      {
        timezone: 'America/Denver',
        critical: true
      }
    );
  });
}

async function getScheduledPosts(time: Date): Promise<Post[]> {
  // Fetch from your content calendar database
  return [];
}

async function publishToAllPlatforms(post: Post): Promise<string[]> {
  const results: string[] = [];

  for (const platform of post.platforms) {
    switch (platform) {
      case 'twitter':
        const tweetId = await postToTwitter(post.content);
        results.push(`Twitter: ${tweetId}`);
        break;
      case 'linkedin':
        const linkedInId = await postToLinkedIn(post.content);
        results.push(`LinkedIn: ${linkedInId}`);
        break;
      case 'facebook':
        const fbId = await postToFacebook(post.content);
        results.push(`Facebook: ${fbId}`);
        break;
    }
  }

  return results;
}

async function postToTwitter(content: string): Promise<string> {
  // Twitter API implementation
  return 'tweet-id-123';
}

async function postToLinkedIn(content: string): Promise<string> {
  // LinkedIn API implementation
  return 'linkedin-post-456';
}

async function postToFacebook(content: string): Promise<string> {
  // Facebook API implementation
  return 'fb-post-789';
}
```

#### Example 3: Data Backup Workflow

```typescript
// src/automation/workflows/data-backup.ts
import { scheduler } from '../scheduler';
import { logger } from '../../utils/logger';
import { sendSlackNotification } from '../../services/slack';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export function registerDataBackupWorkflow(): void {
  // Daily backup at 3 AM
  scheduler.registerTask(
    'daily-database-backup',
    '0 3 * * *',
    async () => {
      logger.info('Starting database backup');

      const timestamp = new Date().toISOString().split('T')[0];
      const backupFile = `/tmp/backup-${timestamp}.sql`;

      try {
        // Create database backup
        await execAsync(
          `sqlite3 ./src/automation/db/agents.db .dump > ${backupFile}`
        );

        // Upload to cloud storage (e.g., S3, Google Cloud Storage)
        await uploadToCloudStorage(backupFile);

        // Clean up old backups (keep last 30 days)
        await cleanupOldBackups(30);

        await sendSlackNotification(
          `✅ Database Backup Complete\n` +
          `📁 File: ${backupFile}\n` +
          `📅 Date: ${timestamp}\n` +
          `☁️ Uploaded to cloud storage`
        );

        logger.info('Database backup complete', { backupFile });
      } catch (error) {
        logger.error('Database backup failed', { error });
        await sendSlackNotification(
          `🚨 Database Backup Failed\n` +
          `Error: ${error instanceof Error ? error.message : 'Unknown'}\n` +
          `⚠️ Manual intervention required`
        );
        throw error;
      }
    },
    {
      timezone: 'America/Denver',
      critical: true
    }
  );
}

async function uploadToCloudStorage(filePath: string): Promise<void> {
  // AWS S3, Google Cloud Storage, etc.
  logger.info('Uploading backup to cloud storage', { filePath });
}

async function cleanupOldBackups(daysToKeep: number): Promise<void> {
  logger.info('Cleaning up old backups', { daysToKeep });
  // Delete backups older than daysToKeep
}
```

### Integration with Express App

Add scheduler to your main application:

```typescript
// src/index.ts
import express from 'express';
import { scheduler, registerDefaultWorkflows } from './automation/scheduler';
import { registerLeadEnrichmentWorkflow } from './automation/workflows/lead-enrichment';
import { registerSocialMediaWorkflow } from './automation/workflows/social-media-posting';
import { registerDataBackupWorkflow } from './automation/workflows/data-backup';
import { logger } from './utils/logger';

const app = express();
const PORT = process.env.PORT || 3000;

// Register all workflows
registerDefaultWorkflows();
registerLeadEnrichmentWorkflow();
registerSocialMediaWorkflow();
registerDataBackupWorkflow();

// Start scheduler when app starts
const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  
  // Start all scheduled tasks
  scheduler.startAll();
  logger.info('All scheduled workflows started');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  // Stop all scheduled tasks
  scheduler.stopAll();
  
  // Close server
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

// API endpoint to check scheduler status
app.get('/api/scheduler/status', (req, res) => {
  const status = scheduler.getStatus();
  res.json({
    message: 'Scheduler status',
    tasks: status,
    activeCount: status.filter(t => t.running).length,
    totalCount: status.length
  });
});

// API endpoint to manually trigger a task
app.post('/api/scheduler/trigger/:taskName', async (req, res) => {
  const { taskName } = req.params;
  
  try {
    // Trigger task manually (implementation depends on your needs)
    res.json({
      message: 'Task triggered',
      taskName
    });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to trigger task'
    });
  }
});
```

## GitHub Actions Scheduling

### Basic Workflow Setup

Create `.github/workflows/scheduled-workflow.yml`:

```yaml
name: Scheduled Workflow

on:
  schedule:
    # Run every day at 9 AM UTC (2 AM MST)
    - cron: '0 9 * * *'
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to run against'
        required: false
        default: 'production'
        type: choice
        options:
          - development
          - staging
          - production

jobs:
  execute:
    name: Execute Scheduled Workflow
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build

      - name: Run scheduled task
        env:
          JWT_SECRET: ${{ secrets.JWT_SECRET }}
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
          ENVIRONMENT: ${{ github.event.inputs.environment || 'production' }}
        run: |
          node dist/automation/workflows/scheduled-task.js

      - name: Send Slack notification on success
        if: success()
        uses: slackapi/slack-github-action@v1
        with:
          webhook: ${{ secrets.SLACK_WEBHOOK_URL }}
          payload: |
            {
              "text": "✅ Scheduled workflow completed successfully",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*Scheduled Workflow Complete*\n\n✅ Status: Success\n🕐 Time: ${{ github.event.repository.updated_at }}\n🌐 Environment: ${{ github.event.inputs.environment || 'production' }}"
                  }
                }
              ]
            }

      - name: Send Slack notification on failure
        if: failure()
        uses: slackapi/slack-github-action@v1
        with:
          webhook: ${{ secrets.SLACK_WEBHOOK_URL }}
          payload: |
            {
              "text": "🚨 Scheduled workflow failed",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*Scheduled Workflow Failed*\n\n❌ Status: Failed\n🕐 Time: ${{ github.event.repository.updated_at }}\n🔗 <${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}|View Run>"
                  }
                }
              ]
            }
```

### Multi-Agent Weekly Cycle

Reference the existing agent17-weekly.yml pattern:

```yaml
name: Weekly Agent Cycle

on:
  schedule:
    # Run every Saturday at 2 AM MST (9 AM UTC)
    - cron: '0 9 * * 6'
  workflow_dispatch:

jobs:
  agent-7-security:
    name: Agent 7 - Security Assessment
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - name: Run security scan
        run: npm run agent7:weekly

  agent-8-assessment:
    name: Agent 8 - System Assessment
    runs-on: ubuntu-latest
    needs: agent-7-security
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - name: Run assessment
        run: npm run agent8:weekly

  agent-9-optimization:
    name: Agent 9 - Performance Optimization
    runs-on: ubuntu-latest
    needs: agent-8-assessment
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - name: Run optimization
        run: npm run agent9:weekly

  notify-completion:
    name: Send Completion Notification
    runs-on: ubuntu-latest
    needs: [agent-7-security, agent-8-assessment, agent-9-optimization]
    if: always()
    steps:
      - name: Send Slack notification
        uses: slackapi/slack-github-action@v1
        with:
          webhook: ${{ secrets.SLACK_WEBHOOK_URL }}
          payload: |
            {
              "text": "🤖 Weekly agent cycle complete",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*Weekly Agent Cycle Complete*\n\n✅ Agent 7: ${{ needs.agent-7-security.result }}\n✅ Agent 8: ${{ needs.agent-8-assessment.result }}\n✅ Agent 9: ${{ needs.agent-9-optimization.result }}"
                  }
                }
              ]
            }
```

## System Cron Integration

### Setup on Ubuntu/Debian

```bash
# Edit crontab
crontab -e

# Add your scheduled tasks
# Daily backup at 3 AM
0 3 * * * /usr/bin/node /path/to/workstation/dist/automation/workflows/backup.js >> /var/log/workstation/backup.log 2>&1

# Hourly health check
0 * * * * curl -fsS --retry 3 https://your-app.railway.app/health >> /var/log/workstation/health.log 2>&1

# Weekly cleanup every Sunday at 2 AM
0 2 * * 0 /usr/bin/node /path/to/workstation/dist/automation/workflows/cleanup.js >> /var/log/workstation/cleanup.log 2>&1
```

### Wrapper Script for Better Error Handling

Create `/usr/local/bin/workstation-cron.sh`:

```bash
#!/bin/bash

# Workstation Cron Wrapper Script
# Provides error handling and logging for cron jobs

set -euo pipefail

WORKSTATION_DIR="/path/to/workstation"
LOG_DIR="/var/log/workstation"
TASK_NAME="$1"
SLACK_WEBHOOK_URL="your-slack-webhook-url"

# Ensure log directory exists
mkdir -p "$LOG_DIR"

# Log file for this task
LOG_FILE="$LOG_DIR/${TASK_NAME}.log"

# Function to send Slack notification
send_slack_notification() {
  local message="$1"
  local emoji="$2"
  
  curl -X POST "$SLACK_WEBHOOK_URL" \
    -H 'Content-Type: application/json' \
    -d "{\"text\":\"${emoji} ${message}\"}" \
    || echo "Failed to send Slack notification"
}

# Start execution
echo "[$(date)] Starting task: $TASK_NAME" >> "$LOG_FILE"

# Execute task
if cd "$WORKSTATION_DIR" && node "dist/automation/workflows/${TASK_NAME}.js" >> "$LOG_FILE" 2>&1; then
  echo "[$(date)] Task completed successfully: $TASK_NAME" >> "$LOG_FILE"
  send_slack_notification "Task completed: $TASK_NAME" "✅"
  exit 0
else
  echo "[$(date)] Task failed: $TASK_NAME" >> "$LOG_FILE"
  send_slack_notification "Task failed: $TASK_NAME - Check logs at $LOG_FILE" "🚨"
  exit 1
fi
```

Make it executable:

```bash
chmod +x /usr/local/bin/workstation-cron.sh
```

Update crontab to use wrapper:

```bash
# Daily backup at 3 AM
0 3 * * * /usr/local/bin/workstation-cron.sh backup

# Hourly metrics collection
0 * * * * /usr/local/bin/workstation-cron.sh metrics-collection

# Weekly cleanup
0 2 * * 0 /usr/local/bin/workstation-cron.sh cleanup
```

## Advanced Scheduling Patterns

### Dynamic Schedule Adjustment

```typescript
// src/automation/dynamic-scheduler.ts
import { scheduler } from './scheduler';
import { logger } from '../utils/logger';

interface ScheduleConfig {
  taskName: string;
  schedule: string;
  enabled: boolean;
  timezone: string;
}

/**
 * Load schedule configuration from database or config file
 */
export async function loadScheduleConfig(): Promise<ScheduleConfig[]> {
  // Load from database, config file, or environment variables
  return [
    {
      taskName: 'lead-enrichment',
      schedule: process.env.LEAD_ENRICHMENT_SCHEDULE || '0 2 * * *',
      enabled: process.env.LEAD_ENRICHMENT_ENABLED !== 'false',
      timezone: process.env.TIMEZONE || 'America/Denver'
    },
    {
      taskName: 'social-media-post-1',
      schedule: process.env.SOCIAL_POST_1_SCHEDULE || '0 9 * * *',
      enabled: true,
      timezone: process.env.TIMEZONE || 'America/Denver'
    }
  ];
}

/**
 * Apply dynamic schedule configuration
 */
export async function applyDynamicSchedules(): Promise<void> {
  const configs = await loadScheduleConfig();

  for (const config of configs) {
    if (config.enabled) {
      logger.info('Applying schedule', { config });
      // Scheduler will pick up the configuration
    } else {
      logger.info('Skipping disabled task', { taskName: config.taskName });
      scheduler.stopTask(config.taskName);
    }
  }
}

/**
 * API endpoint to update schedules without redeployment
 */
export async function updateSchedule(
  taskName: string,
  newSchedule: string
): Promise<void> {
  logger.info('Updating schedule', { taskName, newSchedule });

  // Validate cron syntax
  if (!isValidCronExpression(newSchedule)) {
    throw new Error('Invalid cron expression');
  }

  // Stop existing task
  scheduler.stopTask(taskName);

  // Update configuration in database
  await saveScheduleConfig(taskName, newSchedule);

  // Restart with new schedule
  await applyDynamicSchedules();

  logger.info('Schedule updated successfully', { taskName, newSchedule });
}

function isValidCronExpression(expression: string): boolean {
  // Basic validation (use a library like cron-parser for production)
  const parts = expression.split(' ');
  return parts.length === 5 || parts.length === 6;
}

async function saveScheduleConfig(
  taskName: string,
  schedule: string
): Promise<void> {
  // Save to database or config file
  logger.info('Saving schedule config', { taskName, schedule });
}
```

### Conditional Scheduling

```typescript
// src/automation/conditional-scheduler.ts
import { scheduler } from './scheduler';
import { logger } from '../utils/logger';

interface Condition {
  type: 'time' | 'metric' | 'event' | 'api';
  check: () => Promise<boolean>;
}

/**
 * Schedule task only if conditions are met
 */
export function registerConditionalTask(
  name: string,
  schedule: string,
  conditions: Condition[],
  handler: () => Promise<void>
): void {
  scheduler.registerTask(
    name,
    schedule,
    async () => {
      logger.info('Checking conditions for task', { name });

      // Check all conditions
      for (const condition of conditions) {
        const met = await condition.check();
        if (!met) {
          logger.info('Condition not met, skipping task', {
            name,
            conditionType: condition.type
          });
          return;
        }
      }

      // All conditions met, execute task
      logger.info('All conditions met, executing task', { name });
      await handler();
    }
  );
}

// Example: Run only during business hours
export function registerBusinessHoursTask(): void {
  registerConditionalTask(
    'business-hours-task',
    '*/15 * * * *', // Check every 15 minutes
    [
      {
        type: 'time',
        check: async () => {
          const now = new Date();
          const hour = now.getHours();
          const day = now.getDay();
          
          // Monday-Friday, 9 AM - 5 PM
          return day >= 1 && day <= 5 && hour >= 9 && hour < 17;
        }
      }
    ],
    async () => {
      logger.info('Executing business hours task');
      // Task logic here
    }
  );
}

// Example: Run only if API rate limit not exceeded
export function registerRateLimitedTask(): void {
  registerConditionalTask(
    'rate-limited-task',
    '*/5 * * * *',
    [
      {
        type: 'api',
        check: async () => {
          const currentUsage = await checkAPIRateLimit();
          return currentUsage < 0.8; // Only run if under 80% of rate limit
        }
      }
    ],
    async () => {
      logger.info('Executing rate-limited task');
      // Task logic here
    }
  );
}

async function checkAPIRateLimit(): Promise<number> {
  // Check current API usage
  return 0.5; // Example: 50% of rate limit used
}
```

## Error Handling and Retries

### Retry Logic

```typescript
// src/automation/retry.ts
import { logger } from '../utils/logger';

interface RetryOptions {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2
  }
): Promise<T> {
  let lastError: Error | undefined;
  let delay = options.initialDelay;

  for (let attempt = 1; attempt <= options.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (attempt === options.maxRetries) {
        logger.error('Max retries exceeded', {
          attempts: attempt,
          error: lastError.message
        });
        break;
      }

      logger.warn('Retry attempt failed, waiting before retry', {
        attempt,
        maxRetries: options.maxRetries,
        delay,
        error: lastError.message
      });

      await sleep(delay);
      delay = Math.min(delay * options.backoffMultiplier, options.maxDelay);
    }
  }

  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Usage example
export async function reliableAPICall(): Promise<any> {
  return retry(
    async () => {
      const response = await fetch('https://api.example.com/data');
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      return response.json();
    },
    {
      maxRetries: 5,
      initialDelay: 1000,
      maxDelay: 60000,
      backoffMultiplier: 2
    }
  );
}
```

## Production Best Practices

### 1. Use Environment Variables for Schedules

```typescript
// .env.example
TIMEZONE=America/Denver
LEAD_ENRICHMENT_SCHEDULE=0 2 * * *
SOCIAL_POST_SCHEDULE_1=0 9 * * *
SOCIAL_POST_SCHEDULE_2=0 14 * * *
SOCIAL_POST_SCHEDULE_3=0 18 * * *
BACKUP_SCHEDULE=0 3 * * *
HEALTH_CHECK_SCHEDULE=*/5 * * * *
```

### 2. Implement Circuit Breakers

```typescript
// src/automation/circuit-breaker.ts
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime >= this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
      logger.error('Circuit breaker opened', {
        failures: this.failures,
        threshold: this.threshold
      });
    }
  }
}
```

### 3. Monitor Execution Duration

```typescript
// src/automation/monitoring.ts
import { logger } from '../utils/logger';

export function monitorExecution<T>(
  taskName: string,
  fn: () => Promise<T>,
  warningThreshold: number = 60000
): Promise<T> {
  const startTime = Date.now();

  return fn()
    .then(result => {
      const duration = Date.now() - startTime;
      
      if (duration > warningThreshold) {
        logger.warn('Task execution exceeded threshold', {
          taskName,
          duration,
          threshold: warningThreshold
        });
      } else {
        logger.info('Task completed', { taskName, duration });
      }

      return result;
    })
    .catch(error => {
      const duration = Date.now() - startTime;
      logger.error('Task failed', {
        taskName,
        duration,
        error: error instanceof Error ? error.message : 'Unknown'
      });
      throw error;
    });
}
```

## Testing Scheduled Workflows

### Manual Testing

```bash
# Test cron syntax
npm install -g crontab-parser

# Parse and validate
echo "0 9 * * *" | crontab-parser

# Test workflow manually
npm run build
node dist/automation/workflows/lead-enrichment.js
```

### Integration Test

```typescript
// tests/automation/scheduler.test.ts
import { scheduler } from '../../src/automation/scheduler';
import { logger } from '../../src/utils/logger';

describe('Scheduler', () => {
  afterAll(() => {
    scheduler.stopAll();
  });

  it('should register and start a task', async () => {
    let executed = false;

    scheduler.registerTask(
      'test-task',
      '* * * * * *', // Every second
      async () => {
        executed = true;
      }
    );

    scheduler.startTask('test-task');

    // Wait for task to execute
    await new Promise(resolve => setTimeout(resolve, 1500));

    expect(executed).toBe(true);
  });

  it('should handle task failures gracefully', async () => {
    const errors: any[] = [];
    const originalError = logger.error;
    logger.error = (...args) => errors.push(args);

    scheduler.registerTask(
      'failing-task',
      '* * * * * *',
      async () => {
        throw new Error('Test error');
      }
    );

    scheduler.startTask('failing-task');

    await new Promise(resolve => setTimeout(resolve, 1500));

    expect(errors.length).toBeGreaterThan(0);

    logger.error = originalError;
  });
});
```

## Summary

You've learned:
- ✅ Cron syntax and scheduling fundamentals
- ✅ Node-cron implementation with TypeScript
- ✅ GitHub Actions scheduled workflows
- ✅ System-level cron integration
- ✅ Real-world workflow examples (lead enrichment, social media, backups)
- ✅ Error handling and retry logic
- ✅ Production best practices

**Next**: Continue to [slack-integration.md](./slack-integration.md) to add real-time notifications.
