/**
 * GitHub Organization Activity Audit via API
 * 
 * Uses GitHub REST API to gather organization activity data
 * This is an alternative to web scraping that doesn't require browser authentication
 */

import { Octokit } from '@octokit/rest';
import * as fs from 'fs';
import * as path from 'path';

interface ActivityItem {
  type: string;
  repository: string;
  actor: string;
  timestamp: string;
  details?: any;
}

interface OrganizationAuditReport {
  timestamp: string;
  organization: string;
  repositories: Array<{
    name: string;
    fullName: string;
    description: string | null;
    private: boolean;
    fork: boolean;
    createdAt: string;
    updatedAt: string;
    pushedAt: string | null;
    size: number;
    stars: number;
    watchers: number;
    forks: number;
    openIssues: number;
    defaultBranch: string;
    language: string | null;
    topics: string[];
  }>;
  recentActivity: ActivityItem[];
  metrics: {
    totalRepositories: number;
    totalPublicRepos: number;
    totalPrivateRepos: number;
    totalStars: number;
    totalForks: number;
    totalOpenIssues: number;
    mostActiveRepos: string[];
  };
}

async function auditOrganizationViaAPI(): Promise<OrganizationAuditReport> {
  // Check if GITHUB_TOKEN is available
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error('GITHUB_TOKEN environment variable is required');
  }

  const octokit = new Octokit({ auth: token });
  const org = 'creditXcredit';

  console.log(`Auditing organization: ${org}`);

  const report: OrganizationAuditReport = {
    timestamp: new Date().toISOString(),
    organization: org,
    repositories: [],
    recentActivity: [],
    metrics: {
      totalRepositories: 0,
      totalPublicRepos: 0,
      totalPrivateRepos: 0,
      totalStars: 0,
      totalForks: 0,
      totalOpenIssues: 0,
      mostActiveRepos: []
    }
  };

  try {
    // 1. Get all repositories in the organization
    console.log('Fetching repositories...');
    const repos = await octokit.paginate(octokit.rest.repos.listForOrg, {
      org,
      type: 'all',
      per_page: 100
    });

    console.log(`Found ${repos.length} repositories`);

    // Process repositories
    for (const repo of repos) {
      report.repositories.push({
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        private: repo.private,
        fork: repo.fork,
        createdAt: repo.created_at,
        updatedAt: repo.updated_at,
        pushedAt: repo.pushed_at,
        size: repo.size,
        stars: repo.stargazers_count || 0,
        watchers: repo.watchers_count || 0,
        forks: repo.forks_count || 0,
        openIssues: repo.open_issues_count || 0,
        defaultBranch: repo.default_branch,
        language: repo.language,
        topics: repo.topics || []
      });

      // Update metrics
      report.metrics.totalStars += repo.stargazers_count || 0;
      report.metrics.totalForks += repo.forks_count || 0;
      report.metrics.totalOpenIssues += repo.open_issues_count || 0;
      
      if (repo.private) {
        report.metrics.totalPrivateRepos++;
      } else {
        report.metrics.totalPublicRepos++;
      }
    }

    report.metrics.totalRepositories = repos.length;

    // 2. Get recent activity from public events
    console.log('Fetching recent organization events...');
    try {
      const events = await octokit.rest.activity.listPublicOrgEvents({
        org,
        per_page: 100
      });

      console.log(`Found ${events.data.length} recent events`);

      for (const event of events.data) {
        const activity: ActivityItem = {
          type: event.type,
          repository: event.repo.name,
          actor: event.actor.login,
          timestamp: event.created_at,
          details: {}
        };

        // Extract relevant details based on event type
        switch (event.type) {
          case 'PushEvent':
            activity.details = {
              commits: (event.payload as any).commits?.length || 0,
              ref: (event.payload as any).ref
            };
            break;
          case 'PullRequestEvent':
            activity.details = {
              action: (event.payload as any).action,
              title: (event.payload as any).pull_request?.title,
              number: (event.payload as any).pull_request?.number
            };
            break;
          case 'IssuesEvent':
            activity.details = {
              action: (event.payload as any).action,
              title: (event.payload as any).issue?.title,
              number: (event.payload as any).issue?.number
            };
            break;
          case 'ReleaseEvent':
            activity.details = {
              action: (event.payload as any).action,
              tagName: (event.payload as any).release?.tag_name,
              name: (event.payload as any).release?.name
            };
            break;
        }

        report.recentActivity.push(activity);
      }
    } catch (error) {
      console.warn('Could not fetch public events (may require org membership):', (error as Error).message);
    }

    // 3. Get most active repositories (by recent push time)
    const sortedByActivity = [...report.repositories]
      .filter(r => r.pushedAt)
      .sort((a, b) => new Date(b.pushedAt!).getTime() - new Date(a.pushedAt!).getTime())
      .slice(0, 10);

    report.metrics.mostActiveRepos = sortedByActivity.map(r => r.fullName);

    console.log('\n=== AUDIT COMPLETE ===');
    return report;

  } catch (error) {
    console.error('Error during API audit:', error);
    throw error;
  }
}

// Main execution
(async () => {
  try {
    console.log('Starting GitHub Organization API Audit...\n');
    
    const report = await auditOrganizationViaAPI();

    // Save report to file
    const reportsDir = path.join(process.cwd(), 'audit-reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const reportPath = path.join(reportsDir, `github-org-api-audit-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\nFull report saved to: ${reportPath}`);

    // Create a readable summary
    const summaryPath = path.join(reportsDir, `github-org-api-summary-${Date.now()}.md`);
    const summary = generateSummaryMarkdown(report);
    fs.writeFileSync(summaryPath, summary);
    console.log(`Summary saved to: ${summaryPath}`);

    // Print summary to console
    console.log('\n=== AUDIT SUMMARY ===\n');
    console.log(summary);

  } catch (error) {
    console.error('Fatal error:', error);
    if ((error as Error).message.includes('GITHUB_TOKEN')) {
      console.log('\nPlease set the GITHUB_TOKEN environment variable:');
      console.log('export GITHUB_TOKEN=your_github_token_here');
    }
    process.exit(1);
  }
})();

function generateSummaryMarkdown(report: OrganizationAuditReport): string {
  let markdown = `# GitHub Organization Activity Audit (API)\n\n`;
  markdown += `**Organization:** ${report.organization}\n`;
  markdown += `**Audit Timestamp:** ${report.timestamp}\n\n`;

  markdown += `## Summary Metrics\n\n`;
  markdown += `| Metric | Value |\n`;
  markdown += `|--------|-------|\n`;
  markdown += `| Total Repositories | ${report.metrics.totalRepositories} |\n`;
  markdown += `| Public Repositories | ${report.metrics.totalPublicRepos} |\n`;
  markdown += `| Private Repositories | ${report.metrics.totalPrivateRepos} |\n`;
  markdown += `| Total Stars | ${report.metrics.totalStars} |\n`;
  markdown += `| Total Forks | ${report.metrics.totalForks} |\n`;
  markdown += `| Total Open Issues | ${report.metrics.totalOpenIssues} |\n\n`;

  markdown += `## Repositories (${report.repositories.length})\n\n`;
  markdown += `| Repository | Private | Language | Stars | Forks | Issues | Last Push |\n`;
  markdown += `|------------|---------|----------|-------|-------|--------|----------|\n`;
  
  for (const repo of report.repositories.slice(0, 50)) {
    const lastPush = repo.pushedAt ? new Date(repo.pushedAt).toLocaleDateString() : 'N/A';
    markdown += `| ${repo.name} | ${repo.private ? '🔒' : '📖'} | ${repo.language || 'N/A'} | ${repo.stars} | ${repo.forks} | ${repo.openIssues} | ${lastPush} |\n`;
  }

  if (report.repositories.length > 50) {
    markdown += `\n*Showing first 50 of ${report.repositories.length} repositories*\n`;
  }

  markdown += `\n## Most Active Repositories\n\n`;
  report.metrics.mostActiveRepos.forEach((repo, index) => {
    markdown += `${index + 1}. ${repo}\n`;
  });

  markdown += `\n## Recent Activity (${report.recentActivity.length} events)\n\n`;
  
  if (report.recentActivity.length > 0) {
    const activityByType: Record<string, number> = {};
    for (const activity of report.recentActivity) {
      activityByType[activity.type] = (activityByType[activity.type] || 0) + 1;
    }

    markdown += `### Activity Breakdown\n\n`;
    markdown += `| Event Type | Count |\n`;
    markdown += `|------------|-------|\n`;
    Object.entries(activityByType)
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => {
        markdown += `| ${type} | ${count} |\n`;
      });

    markdown += `\n### Recent Events\n\n`;
    for (const activity of report.recentActivity.slice(0, 30)) {
      markdown += `- **${activity.type}** in \`${activity.repository}\` by @${activity.actor}\n`;
      markdown += `  - Time: ${new Date(activity.timestamp).toLocaleString()}\n`;
      if (activity.details && Object.keys(activity.details).length > 0) {
        markdown += `  - Details: ${JSON.stringify(activity.details)}\n`;
      }
      markdown += `\n`;
    }

    if (report.recentActivity.length > 30) {
      markdown += `*Showing first 30 of ${report.recentActivity.length} events*\n`;
    }
  } else {
    markdown += `No recent public events found. This may require organization membership to view.\n`;
  }

  markdown += `\n## Repository Details\n\n`;
  for (const repo of report.repositories) {
    markdown += `### ${repo.fullName}\n\n`;
    markdown += `- **Description:** ${repo.description || 'No description'}\n`;
    markdown += `- **Visibility:** ${repo.private ? 'Private 🔒' : 'Public 📖'}\n`;
    markdown += `- **Language:** ${repo.language || 'N/A'}\n`;
    markdown += `- **Stars:** ${repo.stars} | **Forks:** ${repo.forks} | **Open Issues:** ${repo.openIssues}\n`;
    markdown += `- **Created:** ${new Date(repo.createdAt).toLocaleDateString()}\n`;
    markdown += `- **Last Updated:** ${new Date(repo.updatedAt).toLocaleDateString()}\n`;
    if (repo.pushedAt) {
      markdown += `- **Last Push:** ${new Date(repo.pushedAt).toLocaleDateString()}\n`;
    }
    if (repo.topics && repo.topics.length > 0) {
      markdown += `- **Topics:** ${repo.topics.join(', ')}\n`;
    }
    markdown += `- **Default Branch:** ${repo.defaultBranch}\n`;
    markdown += `- **Size:** ${(repo.size / 1024).toFixed(2)} MB\n`;
    markdown += `\n`;
  }

  return markdown;
}
