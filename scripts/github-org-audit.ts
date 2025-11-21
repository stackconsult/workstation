/**
 * GitHub Organization Dashboard Audit Script
 * 
 * Navigates to https://github.com/orgs/creditXcredit/dashboard and extracts:
 * - Activity feed items (commits, PRs, issues, releases)
 * - Repository names
 * - Timestamps and activity types
 * - Dashboard metrics
 * - Screenshots for documentation
 */

import { BrowserAgent } from '../src/automation/agents/core/browser';
import * as fs from 'fs';
import * as path from 'path';

interface ActivityItem {
  type: string;
  repository?: string;
  title?: string;
  timestamp?: string;
  author?: string;
  url?: string;
}

interface DashboardMetrics {
  totalRepositories?: number;
  activityCount?: number;
  organizationName: string;
}

interface AuditReport {
  timestamp: string;
  url: string;
  metrics: DashboardMetrics;
  activities: ActivityItem[];
  repositories: string[];
  screenshots: string[];
  rawData?: any;
}

async function auditGitHubOrganization(): Promise<AuditReport> {
  const browser = new BrowserAgent({ 
    headless: false, // Set to false to see what's happening
    timeout: 60000 
  });

  const report: AuditReport = {
    timestamp: new Date().toISOString(),
    url: 'https://github.com/orgs/creditXcredit/dashboard',
    metrics: {
      organizationName: 'creditXcredit'
    },
    activities: [],
    repositories: [],
    screenshots: []
  };

  try {
    console.log('Initializing browser...');
    await browser.initialize();

    console.log('Navigating to GitHub organization dashboard...');
    await browser.navigate({ 
      url: 'https://github.com/orgs/creditXcredit/dashboard',
      waitUntil: 'networkidle'
    });

    // Wait for the page to load
    console.log('Waiting for page content...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Take full page screenshot
    console.log('Capturing full page screenshot...');
    const screenshotsDir = path.join(process.cwd(), 'audit-screenshots');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    const fullPageScreenshot = path.join(screenshotsDir, `github-org-dashboard-full-${Date.now()}.png`);
    await browser.screenshot({ path: fullPageScreenshot, fullPage: true });
    report.screenshots.push(fullPageScreenshot);
    console.log(`Screenshot saved: ${fullPageScreenshot}`);

    // Extract activity feed items
    console.log('Extracting activity feed...');
    const activities: any = await browser.evaluate(`
      (() => {
        const items = [];
        
        // Try multiple selectors for activity items
        const activitySelectors = [
          '.news .alert',
          '[data-hpc] .Box-row',
          '.dashboard-feed-item',
          '.js-all-activity-header ~ div',
          'article',
          '.TimelineItem'
        ];

        let activityElements = null;
        for (const selector of activitySelectors) {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            activityElements = elements;
            break;
          }
        }

        if (activityElements && activityElements.length > 0) {
          activityElements.forEach((item, index) => {
          const activity = {
            index,
            html: item.innerHTML.substring(0, 500) // First 500 chars
          };

          // Try to extract repository name
          const repoLink = item.querySelector('a[href*="/creditXcredit/"]');
          if (repoLink) {
            activity.repository = repoLink.getAttribute('href');
            activity.repositoryText = repoLink.textContent?.trim();
          }

          // Try to extract timestamp
          const timeElement = item.querySelector('relative-time, time, .f6');
          if (timeElement) {
            activity.timestamp = timeElement.getAttribute('datetime') || 
                                timeElement.getAttribute('title') ||
                                timeElement.textContent?.trim();
          }

          // Try to extract activity type
          const actionText = item.textContent?.toLowerCase() || '';
          if (actionText.includes('opened') && actionText.includes('pull request')) {
            activity.type = 'pull_request_opened';
          } else if (actionText.includes('merged')) {
            activity.type = 'pull_request_merged';
          } else if (actionText.includes('closed') && actionText.includes('issue')) {
            activity.type = 'issue_closed';
          } else if (actionText.includes('opened') && actionText.includes('issue')) {
            activity.type = 'issue_opened';
          } else if (actionText.includes('pushed to')) {
            activity.type = 'push';
          } else if (actionText.includes('created')) {
            activity.type = 'created';
          } else if (actionText.includes('released')) {
            activity.type = 'release';
          } else {
            activity.type = 'unknown';
          }

          // Extract title/description
          const titleElement = item.querySelector('a[href*="/pull/"], a[href*="/issues/"], .Link--primary');
          if (titleElement) {
            activity.title = titleElement.textContent?.trim();
            activity.url = titleElement.getAttribute('href');
          }

          items.push(activity);
        });
      }

      return items;
    })()
    `);

    report.activities = activities as ActivityItem[];
    console.log(`Found ${activities.length} activity items`);

    // Extract unique repository names
    console.log('Extracting repository names...');
    const repositories: any = await browser.evaluate(() => {
      const repos = new Set<string>();
      
      // Find all links to creditXcredit repositories
      const repoLinks = (document as any).querySelectorAll('a[href*="/creditXcredit/"]');
      repoLinks.forEach((link: any) => {
        const href = link.getAttribute('href') || '';
        const match = href.match(/\/creditXcredit\/([^\/\?#]+)/);
        if (match && match[1]) {
          repos.add(match[1]);
        }
      });

      return Array.from(repos);
    });

    report.repositories = repositories as string[];
    console.log(`Found ${repositories.length} unique repositories:`, repositories);

    // Extract metrics
    console.log('Extracting dashboard metrics...');
    const metrics: any = await browser.evaluate(() => {
      const data: any = {};

      // Try to find repository count
      const repoCountElements = (document as any).querySelectorAll('[data-tab-item*="repositories"], .Counter');
      repoCountElements.forEach((el: any) => {
        const text = el.textContent?.trim();
        if (text && /^\d+$/.test(text)) {
          data.totalRepositories = parseInt(text, 10);
        }
      });

      // Count activity items
      const activityCount = (document as any).querySelectorAll('.news .alert, [data-hpc] .Box-row, .TimelineItem').length;
      if (activityCount > 0) {
        data.activityCount = activityCount;
      }

      return data;
    });

    report.metrics = { ...report.metrics, ...metrics };
    console.log('Metrics extracted:', metrics);

    // Get page content for additional analysis
    console.log('Extracting raw page data...');
    const pageTitle = await browser.evaluate(() => (document as any).title);
    const pageUrl = browser.getCurrentUrl();

    report.rawData = {
      pageTitle,
      currentUrl: pageUrl,
      timestamp: new Date().toISOString()
    };

    // Take a screenshot of the visible area
    const visibleScreenshot = path.join(screenshotsDir, `github-org-dashboard-visible-${Date.now()}.png`);
    await browser.screenshot({ path: visibleScreenshot, fullPage: false });
    report.screenshots.push(visibleScreenshot);
    console.log(`Visible screenshot saved: ${visibleScreenshot}`);

    console.log('\n=== AUDIT COMPLETE ===\n');

  } catch (error) {
    console.error('Error during audit:', error);
    throw error;
  } finally {
    console.log('Cleaning up browser...');
    await browser.cleanup();
  }

  return report;
}

// Main execution
(async () => {
  try {
    console.log('Starting GitHub Organization Dashboard Audit...\n');
    
    const report = await auditGitHubOrganization();

    // Save report to file
    const reportsDir = path.join(process.cwd(), 'audit-reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const reportPath = path.join(reportsDir, `github-org-audit-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\nFull report saved to: ${reportPath}`);

    // Create a readable summary
    const summaryPath = path.join(reportsDir, `github-org-audit-summary-${Date.now()}.md`);
    const summary = generateSummaryMarkdown(report);
    fs.writeFileSync(summaryPath, summary);
    console.log(`Summary saved to: ${summaryPath}`);

    // Print summary to console
    console.log('\n=== AUDIT SUMMARY ===\n');
    console.log(summary);

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
})();

function generateSummaryMarkdown(report: AuditReport): string {
  let markdown = `# GitHub Organization Dashboard Audit Report\n\n`;
  markdown += `**Organization:** ${report.metrics.organizationName}\n`;
  markdown += `**URL:** ${report.url}\n`;
  markdown += `**Timestamp:** ${report.timestamp}\n\n`;

  markdown += `## Metrics\n\n`;
  markdown += `- Total Repositories: ${report.metrics.totalRepositories || 'N/A'}\n`;
  markdown += `- Activity Items Found: ${report.activities.length}\n`;
  markdown += `- Unique Repositories Mentioned: ${report.repositories.length}\n\n`;

  markdown += `## Repositories\n\n`;
  if (report.repositories.length > 0) {
    report.repositories.forEach(repo => {
      markdown += `- ${repo}\n`;
    });
  } else {
    markdown += `No repositories found in activity feed.\n`;
  }
  markdown += `\n`;

  markdown += `## Recent Activity\n\n`;
  if (report.activities.length > 0) {
    report.activities.slice(0, 20).forEach((activity, index) => {
      markdown += `### Activity ${index + 1}\n`;
      markdown += `- **Type:** ${activity.type}\n`;
      if (activity.repository) markdown += `- **Repository:** ${activity.repository}\n`;
      if (activity.title) markdown += `- **Title:** ${activity.title}\n`;
      if (activity.timestamp) markdown += `- **Timestamp:** ${activity.timestamp}\n`;
      if (activity.author) markdown += `- **Author:** ${activity.author}\n`;
      if (activity.url) markdown += `- **URL:** ${activity.url}\n`;
      markdown += `\n`;
    });
  } else {
    markdown += `No activity items found.\n`;
  }

  markdown += `## Screenshots\n\n`;
  report.screenshots.forEach((screenshot, index) => {
    markdown += `${index + 1}. \`${screenshot}\`\n`;
  });

  markdown += `\n## Raw Data\n\n`;
  if (report.rawData) {
    markdown += `\`\`\`json\n${JSON.stringify(report.rawData, null, 2)}\n\`\`\`\n`;
  }

  return markdown;
}
