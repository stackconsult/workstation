/**
 * GitHub Organization Dashboard Audit Script (Simplified)
 * 
 * Navigates to https://github.com/orgs/creditXcredit/dashboard and extracts relevant information
 */

import { BrowserAgent } from '../src/automation/agents/core/browser';
import * as fs from 'fs';
import * as path from 'path';

interface AuditReport {
  timestamp: string;
  url: string;
  pageTitle: string;
  currentUrl: string;
  screenshots: string[];
  pageContent: string;
  success: boolean;
  error?: string;
}

async function auditGitHubOrganization(): Promise<AuditReport> {
  const browser = new BrowserAgent({ 
    headless: true, // Run in headless mode in CI
    timeout: 60000 
  });

  const report: AuditReport = {
    timestamp: new Date().toISOString(),
    url: 'https://github.com/orgs/creditXcredit/dashboard',
    pageTitle: '',
    currentUrl: '',
    screenshots: [],
    pageContent: '',
    success: false
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

    // Get current URL (might be redirected to login)
    report.currentUrl = browser.getCurrentUrl();
    console.log(`Current URL: ${report.currentUrl}`);

    // Get page content
    console.log('Extracting page content...');
    const content = await browser.getContent();
    report.pageContent = content;

    // Check if we're on the login page
    if (report.currentUrl.includes('/login') || content.includes('Sign in to GitHub')) {
      console.log('⚠️  Redirected to login page - authentication required');
      report.error = 'Authentication required - redirected to login page';
    } else {
      console.log('✓ Successfully accessed organization dashboard');
      report.success = true;
    }

    // Take screenshots
    console.log('Capturing screenshots...');
    const screenshotsDir = path.join(process.cwd(), 'audit-screenshots');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    const fullPageScreenshot = path.join(screenshotsDir, `github-org-dashboard-full-${Date.now()}.png`);
    await browser.screenshot({ path: fullPageScreenshot, fullPage: true });
    report.screenshots.push(fullPageScreenshot);
    console.log(`Screenshot saved: ${fullPageScreenshot}`);

    const visibleScreenshot = path.join(screenshotsDir, `github-org-dashboard-visible-${Date.now()}.png`);
    await browser.screenshot({ path: visibleScreenshot, fullPage: false });
    report.screenshots.push(visibleScreenshot);
    console.log(`Visible screenshot saved: ${visibleScreenshot}`);

    console.log('\n=== AUDIT COMPLETE ===\n');

  } catch (error) {
    console.error('Error during audit:', error);
    report.error = error instanceof Error ? error.message : String(error);
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

    // Extract and save content analysis
    if (report.pageContent) {
      analyzePageContent(report.pageContent, reportsDir);
    }

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
})();

function generateSummaryMarkdown(report: AuditReport): string {
  let markdown = `# GitHub Organization Dashboard Audit Report\n\n`;
  markdown += `**Organization:** creditXcredit\n`;
  markdown += `**Target URL:** ${report.url}\n`;
  markdown += `**Actual URL:** ${report.currentUrl}\n`;
  markdown += `**Timestamp:** ${report.timestamp}\n`;
  markdown += `**Status:** ${report.success ? '✓ Success' : '✗ Failed'}\n\n`;

  if (report.error) {
    markdown += `## Error\n\n`;
    markdown += `${report.error}\n\n`;
  }

  markdown += `## Screenshots\n\n`;
  report.screenshots.forEach((screenshot, index) => {
    markdown += `${index + 1}. \`${screenshot}\`\n`;
  });

  markdown += `\n## Page Information\n\n`;
  markdown += `- **Current URL:** ${report.currentUrl}\n`;
  markdown += `- **Page Size:** ${report.pageContent.length} characters\n`;

  if (report.currentUrl.includes('/login')) {
    markdown += `\n## Authentication Required\n\n`;
    markdown += `The GitHub organization dashboard requires authentication. `;
    markdown += `To access the dashboard, you need to:\n\n`;
    markdown += `1. Be logged into GitHub\n`;
    markdown += `2. Have access to the creditXcredit organization\n`;
    markdown += `3. Provide authentication credentials or use a GitHub token\n\n`;
    markdown += `### Next Steps\n\n`;
    markdown += `- Use GitHub API with authentication token instead\n`;
    markdown += `- Or provide GitHub credentials for automated login\n`;
    markdown += `- Or manually review the dashboard and export data\n`;
  }

  return markdown;
}

function analyzePageContent(content: string, outputDir: string): void {
  console.log('\nAnalyzing page content...');
  
  const analysis: any = {
    timestamp: new Date().toISOString(),
    contentLength: content.length,
    containsLogin: content.includes('Sign in to GitHub'),
    containsOrganization: content.includes('creditXcredit'),
    containsDashboard: content.includes('dashboard'),
    links: extractLinks(content),
    forms: extractForms(content),
  };

  // Save analysis
  const analysisPath = path.join(outputDir, `content-analysis-${Date.now()}.json`);
  fs.writeFileSync(analysisPath, JSON.stringify(analysis, null, 2));
  console.log(`Content analysis saved to: ${analysisPath}`);

  // Save full HTML for manual inspection
  const htmlPath = path.join(outputDir, `page-content-${Date.now()}.html`);
  fs.writeFileSync(htmlPath, content);
  console.log(`Full HTML saved to: ${htmlPath}`);
}

function extractLinks(content: string): string[] {
  const linkRegex = /href="([^"]+)"/g;
  const links: string[] = [];
  let match;
  
  while ((match = linkRegex.exec(content)) !== null) {
    if (match[1].includes('creditXcredit')) {
      links.push(match[1]);
    }
  }
  
  return [...new Set(links)]; // Remove duplicates
}

function extractForms(content: string): any[] {
  const forms: any[] = [];
  const formRegex = /<form[^>]*>(.*?)<\/form>/gs;
  let match;
  
  while ((match = formRegex.exec(content)) !== null) {
    forms.push({
      html: match[0].substring(0, 200) + '...', // First 200 chars
      hasPassword: match[0].includes('type="password"'),
      hasSubmit: match[0].includes('type="submit"'),
    });
  }
  
  return forms;
}
