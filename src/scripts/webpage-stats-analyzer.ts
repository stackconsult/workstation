/**
 * Webpage Stats Analyzer
 *
 * This script navigates between the GitHub repository page and ghloc stats page,
 * extracts statistics from both, and compares them with actual repository metrics
 * to determine what the webpage stats should actually state.
 *
 * **Platform Requirements:**
 * This script requires a Unix-like environment (Linux, macOS, or WSL/Git Bash on Windows)
 * for the file counting functionality, as it uses shell commands like `find`, `wc`, and `awk`.
 *
 * Usage: ts-node src/scripts/webpage-stats-analyzer.ts
 *
 * Environment Variables:
 * - GITHUB_REPO_OWNER: Repository owner (default: 'creditXcredit')
 * - GITHUB_REPO_NAME: Repository name (default: 'workstation')
 */

import { chromium, Browser, Page } from "playwright";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { promisify } from "util";
import {
  exec as execCallback,
  execFile as execFileCallback,
} from "child_process";

const exec = promisify(execCallback);
const execFile = promisify(execFileCallback);
// Configuration constants
const GITHUB_REPO_OWNER = process.env.GITHUB_REPO_OWNER || "creditXcredit";
const GITHUB_REPO_NAME = process.env.GITHUB_REPO_NAME || "workstation";
const GITHUB_REPO_URL = `https://github.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}`;

const GHLOC_BASE_URL = "https://ghloc.vercel.app";
const GHLOC_FILTERS = "!ini$,!json$,!lock$,!md$,!txt$,!yml$,!yaml$";
const GHLOC_BRANCH = "main";
const GHLOC_URL = `${GHLOC_BASE_URL}/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}?branch=${GHLOC_BRANCH}&filter=${encodeURIComponent(GHLOC_FILTERS)}`;

// Use OS temp directory for cross-platform compatibility
const TEMP_DIR = os.tmpdir();
const SCREENSHOT_PATH = path.join(TEMP_DIR, "ghloc-screenshot.png");

interface GitHubStats {
  stars?: number;
  forks?: number;
  watchers?: number;
  openIssues?: number;
  description?: string;
  topics?: string[];
}

interface GhlocStats {
  totalLines?: number;
  codeLines?: number;
  files?: number;
  languages?: Record<string, { lines: number; percentage: number }>;
}

interface ActualStats {
  totalFiles: number;
  tsFiles: number;
  jsFiles: number;
  testFiles: number;
  markdownFiles: number;
  totalLines: number;
  codeLines: number;
  commentLines: number;
  blankLines: number;
}

interface ComparisonReport {
  githubStats: GitHubStats;
  ghlocStats: GhlocStats;
  actualStats: ActualStats;
  differences: string[];
  recommendations: string[];
}

/**
 * Navigate to GitHub repository page and extract stats
 */
async function extractGitHubStats(page: Page): Promise<GitHubStats> {
  console.log("📊 Navigating to GitHub repository page...");

  await page.goto(GITHUB_REPO_URL, { waitUntil: "networkidle" });

  const stats: GitHubStats = {};

  try {
    // Extract star count
    const starElement = await page.$(
      `a[href="/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/stargazers"] strong, #repo-stars-counter-star`,
    );
    if (starElement) {
      const starText = await starElement.textContent();
      stats.stars = parseInt(starText?.trim() || "0");
    }

    // Extract fork count
    const forkElement = await page.$(
      `a[href="/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/forks"] strong, #repo-network-counter`,
    );
    if (forkElement) {
      const forkText = await forkElement.textContent();
      stats.forks = parseInt(forkText?.trim() || "0");
    }

    // Extract description
    const descElement = await page.$("p.f4.my-3");
    if (descElement) {
      const text = await descElement.textContent();
      stats.description = text || undefined;
    }

    // Extract topics
    const topicElements = await page.$$('a[data-octo-click="topic_click"]');
    stats.topics = [];
    for (const topic of topicElements) {
      const text = await topic.textContent();
      if (text) {
        stats.topics.push(text.trim());
      }
    }

    console.log("✅ GitHub stats extracted:", stats);
  } catch (error) {
    console.error("❌ Error extracting GitHub stats:", error);
  }

  return stats;
}

/**
 * Navigate to ghloc page and extract stats
 */
async function extractGhlocStats(page: Page): Promise<GhlocStats> {
  console.log("📊 Navigating to ghloc stats page...");
  console.log(`URL: ${GHLOC_URL}`);

  const stats: GhlocStats = {};

  try {
    await page.goto(GHLOC_URL, { waitUntil: "networkidle", timeout: 60000 });

    // Wait for the page to fully load and render stats
    await page.waitForTimeout(5000);

    // Take a screenshot for debugging
    try {
      await page.screenshot({ path: SCREENSHOT_PATH, fullPage: true });
      console.log(`📸 Screenshot saved to ${SCREENSHOT_PATH}`);
    } catch {
      console.log("Note: Could not save screenshot");
    }

    // Get the full page text
    const pageText = await page.textContent("body");
    if (pageText) {
      console.log("📄 Page text preview:", pageText.substring(0, 500));
    }

    // Try multiple selector strategies

    // Strategy 1: Get all text from the page using Playwright's built-in method
    const allText = (await page.evaluate(
      "() => document.body.innerText",
    )) as string;

    console.log("📝 Extracted text:", allText.substring(0, 800));

    // Try to extract numbers from the page
    const lineMatches = allText.match(
      /(\d+(?:,\d+)*)\s*lines?(?:\s+of\s+code)?/i,
    );
    if (lineMatches && lineMatches[1]) {
      stats.totalLines = parseInt(lineMatches[1].replace(/,/g, ""));
      console.log(`Found lines: ${stats.totalLines}`);
    }

    // Try to get file count
    const fileMatches = allText.match(/(\d+(?:,\d+)*)\s*files?/i);
    if (fileMatches && fileMatches[1]) {
      stats.files = parseInt(fileMatches[1].replace(/,/g, ""));
      console.log(`Found files: ${stats.files}`);
    }

    // Try to extract language breakdown
    const langMatches = allText.matchAll(
      /(\w+):\s*(\d+(?:,\d+)*)\s*lines?\s*\((\d+\.?\d*)%\)/gi,
    );
    stats.languages = {};
    for (const match of langMatches) {
      const [, lang, lines, percent] = match;
      stats.languages[lang] = {
        lines: parseInt(lines.replace(/,/g, "")),
        percentage: parseFloat(percent),
      };
    }

    console.log("✅ ghloc stats extracted:", stats);
  } catch (error) {
    console.error("❌ Error extracting ghloc stats:", error);
  }

  return stats;
}

/**
 * Count actual repository statistics
 */
async function countActualStats(repoPath: string): Promise<ActualStats> {
  console.log("📊 Counting actual repository statistics...");

  const stats: ActualStats = {
    totalFiles: 0,
    tsFiles: 0,
    jsFiles: 0,
    testFiles: 0,
    markdownFiles: 0,
    totalLines: 0,
    codeLines: 0,
    commentLines: 0,
    blankLines: 0,
  };

  try {
    // Count TypeScript files
    // Use execFile to call 'find' and count .ts files
    const tsFindArgs = [`${repoPath}/src`, "-type", "f", "-name", "*.ts"];
    const tsFindResult = await execFile("find", tsFindArgs);
    const tsFilesList =
      tsFindResult.stdout.trim() === ""
        ? []
        : tsFindResult.stdout.trim().split("\n");
    stats.tsFiles = tsFilesList.length;

    // Count JavaScript files, excluding node_modules and dist
    const jsFindArgs = [
      `${repoPath}`,
      "-type",
      "f",
      "-name",
      "*.js",
      "!",
      "-path",
      "*/node_modules/*",
      "!",
      "-path",
      "*/dist/*",
    ];
    const jsFindResult = await execFile("find", jsFindArgs);
    const jsFilesList =
      jsFindResult.stdout.trim() === ""
        ? []
        : jsFindResult.stdout.trim().split("\n");
    stats.jsFiles = jsFilesList.length;

    // Count test files
    const testFindArgs = [
      `${repoPath}`,
      "-type",
      "f",
      "(",
      "-name",
      "*.test.ts",
      "-o",
      "-name",
      "*.spec.ts",
      "-o",
      "-name",
      "*.test.js",
      ")",
      "!",
      "-path",
      "*/node_modules/*",
    ];
    const testFindResult = await execFile("find", testFindArgs);
    const testFilesList =
      testFindResult.stdout.trim() === ""
        ? []
        : testFindResult.stdout.trim().split("\n");
    stats.testFiles = testFilesList.length;

    // Count markdown files
    const mdResult = await exec(
      `find ${repoPath} -type f -name "*.md" ! -path "*/node_modules/*" 2>/dev/null | wc -l`,
    );
    const mdCount = parseInt(mdResult.stdout.trim());
    stats.markdownFiles = isNaN(mdCount) ? 0 : mdCount;

    // Count total files (excluding node_modules, .git, dist)
    const totalResult = await exec(
      `find ${repoPath} -type f ! -path "*/node_modules/*" ! -path "*/.git/*" ! -path "*/dist/*" 2>/dev/null | wc -l`,
    );
    const totalCount = parseInt(totalResult.stdout.trim());
    stats.totalFiles = isNaN(totalCount) ? 0 : totalCount;

    // Count lines in TypeScript files
    try {
      // Find all .ts files under repoPath/src (non-recursive and safe)
      const { stdout: findOut } = await execFile("find", [
        `${repoPath}/src`,
        "-type",
        "f",
        "-name",
        "*.ts",
      ]);
      const tsFiles = findOut.split("\n").filter((f) => f.trim().length > 0);
      let totalLines = 0;
      for (const filePath of tsFiles) {
        try {
          const { stdout: wcOut } = await execFile("wc", ["-l", filePath]);
          const match = wcOut.match(/^\s*(\d+)/);
          if (match) {
            totalLines += parseInt(match[1]);
          }
        } catch {
          // skip files that error
        }
        stats.totalLines = totalLines;
      }
    } catch {
      console.log("Note: Could not count total lines");
    }

    console.log("✅ Actual stats counted:", stats);
  } catch (error) {
    console.error("❌ Error counting actual stats:", error);
  }

  return stats;
}

/**
 * Compare stats and generate recommendations
 */
function compareStats(
  githubStats: GitHubStats,
  ghlocStats: GhlocStats,
  actualStats: ActualStats,
): ComparisonReport {
  const differences: string[] = [];
  const recommendations: string[] = [];

  // Compare file counts
  if (
    ghlocStats.files &&
    ghlocStats.files !== actualStats.tsFiles + actualStats.jsFiles
  ) {
    differences.push(
      `ghloc reports ${ghlocStats.files} files, but actual code files: ${actualStats.tsFiles} TS + ${actualStats.jsFiles} JS = ${actualStats.tsFiles + actualStats.jsFiles}`,
    );
    recommendations.push(
      `Consider updating stats to reflect: ${actualStats.tsFiles} TypeScript files, ${actualStats.jsFiles} JavaScript files`,
    );
  }

  // Compare line counts
  if (
    ghlocStats.totalLines &&
    actualStats.totalLines &&
    ghlocStats.totalLines > 0
  ) {
    const difference = Math.abs(ghlocStats.totalLines - actualStats.totalLines);
    const percentDiff = (difference / ghlocStats.totalLines) * 100;

    if (percentDiff > 10) {
      differences.push(
        `ghloc reports ${ghlocStats.totalLines.toLocaleString()} lines, actual TypeScript: ${actualStats.totalLines.toLocaleString()} lines (${percentDiff.toFixed(1)}% difference)`,
      );
      recommendations.push(
        `Stats may be outdated. Consider using ${actualStats.totalLines.toLocaleString()} lines for TypeScript code`,
      );
    }
  }

  // File type breakdown
  recommendations.push(
    `Repository contains: ${actualStats.tsFiles} TypeScript files, ${actualStats.jsFiles} JavaScript files, ${actualStats.testFiles} test files, ${actualStats.markdownFiles} documentation files`,
  );

  // Total tracked files
  recommendations.push(
    `Total tracked files (excluding node_modules, .git, dist): ${actualStats.totalFiles}`,
  );

  return {
    githubStats,
    ghlocStats,
    actualStats,
    differences,
    recommendations,
  };
}

/**
 * Generate and save report
 */
function generateReport(report: ComparisonReport): string {
  const reportLines: string[] = [
    "# 📊 Webpage Stats Analysis Report",
    "",
    `**Generated**: ${new Date().toISOString()}`,
    `**Repository**: creditXcredit/workstation`,
    "",
    "---",
    "",
    "## GitHub Repository Stats",
    "",
    `- **Stars**: ${report.githubStats.stars || "N/A"}`,
    `- **Forks**: ${report.githubStats.forks || "N/A"}`,
    `- **Description**: ${report.githubStats.description || "N/A"}`,
    `- **Topics**: ${report.githubStats.topics?.join(", ") || "N/A"}`,
    "",
    "## ghloc Stats (Code Line Counter)",
    "",
    `- **Total Lines**: ${report.ghlocStats.totalLines?.toLocaleString() || "N/A"}`,
    `- **Files**: ${report.ghlocStats.files || "N/A"}`,
    "",
    "## Actual Repository Stats",
    "",
    `- **Total Tracked Files**: ${report.actualStats.totalFiles.toLocaleString()}`,
    `- **TypeScript Files**: ${report.actualStats.tsFiles}`,
    `- **JavaScript Files**: ${report.actualStats.jsFiles}`,
    `- **Test Files**: ${report.actualStats.testFiles}`,
    `- **Markdown Files**: ${report.actualStats.markdownFiles}`,
    `- **TypeScript Lines**: ${report.actualStats.totalLines.toLocaleString()}`,
    "",
    "## 🔍 Differences Detected",
    "",
  ];

  if (report.differences.length > 0) {
    report.differences.forEach((diff, index) => {
      reportLines.push(`${index + 1}. ${diff}`);
    });
  } else {
    reportLines.push("✅ No significant differences detected.");
  }

  reportLines.push("");
  reportLines.push("## 💡 Recommendations");
  reportLines.push("");

  report.recommendations.forEach((rec, index) => {
    reportLines.push(`${index + 1}. ${rec}`);
  });

  reportLines.push("");
  reportLines.push("---");
  reportLines.push("");
  reportLines.push("## 📝 Suggested Stats for README/Webpage");
  reportLines.push("");
  reportLines.push("```markdown");
  reportLines.push(
    `- **${report.actualStats.totalFiles.toLocaleString()}+ tracked files** across the entire repository`,
  );
  reportLines.push(
    `- **${report.actualStats.tsFiles}+ TypeScript source files** in src/`,
  );
  reportLines.push(
    `- **${report.actualStats.jsFiles} JavaScript files** (build/config scripts)`,
  );
  reportLines.push(
    `- **${report.actualStats.testFiles}+ test files** (.test.ts, .spec.ts)`,
  );
  reportLines.push(
    `- **${report.actualStats.markdownFiles}+ documentation files** (.md)`,
  );
  reportLines.push(
    `- **${report.actualStats.totalLines.toLocaleString()}+ lines of TypeScript code** in src/`,
  );
  reportLines.push("```");
  reportLines.push("");

  return reportLines.join("\n");
}

/**
 * Main execution
 */
async function main() {
  console.log("🚀 Starting Webpage Stats Analyzer...\n");

  let browser: Browser | null = null;

  try {
    // Launch browser
    console.log("🌐 Launching browser...");
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    });
    const page = await context.newPage();

    // Extract stats from GitHub
    const githubStats = await extractGitHubStats(page);

    // Wait a bit between requests
    await page.waitForTimeout(2000);

    // Extract stats from ghloc
    const ghlocStats = await extractGhlocStats(page);

    // Close browser
    await browser.close();
    browser = null;

    // Count actual stats
    // When running from src/scripts, go up 2 levels to reach repo root
    const repoPath = path.resolve(__dirname, "../..");
    console.log(`📁 Repository path: ${repoPath}`);
    const actualStats = await countActualStats(repoPath);

    // Compare and generate report
    console.log("\n📋 Generating comparison report...");
    const report = compareStats(githubStats, ghlocStats, actualStats);
    const reportText = generateReport(report);

    // Save report
    const reportPath = path.join(repoPath, "WEBPAGE_STATS_ANALYSIS.md");
    fs.writeFileSync(reportPath, reportText);

    console.log(`\n✅ Report saved to: ${reportPath}`);
    console.log("\n" + reportText);
  } catch (error) {
    console.error("❌ Error during analysis:", error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}

export {
  main,
  extractGitHubStats,
  extractGhlocStats,
  countActualStats,
  compareStats,
};
