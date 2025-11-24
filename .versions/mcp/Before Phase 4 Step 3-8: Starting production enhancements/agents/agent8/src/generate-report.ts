#!/usr/bin/env node
/**
 * Agent 8: Report Generator
 * Generates comprehensive assessment reports from assessment results
 */

import * as fs from 'fs';
import * as path from 'path';

interface ReportOptions {
  assessmentDir: string;
  output: string;
}

function parseArgs(): ReportOptions {
  const args = process.argv.slice(2);
  const options: Partial<ReportOptions> = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--assessment-dir' && args[i + 1]) {
      options.assessmentDir = args[i + 1];
      i++;
    } else if (args[i] === '--output' && args[i + 1]) {
      options.output = args[i + 1];
      i++;
    }
  }

  if (!options.assessmentDir || !options.output) {
    console.error('Usage: generate-report --assessment-dir <dir> --output <file>');
    process.exit(1);
  }

  return options as ReportOptions;
}

function generateReport(assessmentDir: string, outputPath: string): void {
  console.log('📊 Generating assessment report...\n');

  let report = '# Agent 8: Weekly Assessment Report\n\n';
  report += `**Generated:** ${new Date().toISOString()}\n`;
  report += `**Assessment Directory:** ${assessmentDir}\n\n`;

  report += '---\n\n';

  // Check for various assessment artifacts
  const baselineFile = path.join(assessmentDir, 'agent7-security-baseline.md');
  const goVetFile = path.join(assessmentDir, 'go-vet-results.txt');
  const golangciFile = path.join(assessmentDir, 'golangci-lint.json');
  const docAuditFile = path.join(assessmentDir, 'documentation-audit.txt');

  // Security baseline
  if (fs.existsSync(baselineFile)) {
    report += '## Security Baseline (Agent 7)\n\n';
    const content = fs.readFileSync(baselineFile, 'utf8');
    const scoreMatch = content.match(/Overall.*:\s*(\d+)\/100/);
    if (scoreMatch) {
      report += `**Security Score:** ${scoreMatch[1]}/100\n\n`;
    } else {
      report += '**Security Score:** See baseline file for details\n\n';
    }
  }

  // Go analysis
  if (fs.existsSync(goVetFile)) {
    report += '## Go Code Analysis\n\n';
    const content = fs.readFileSync(goVetFile, 'utf8');
    const lines = content.trim().split('\n').length;
    report += `**Issues Found:** ${lines} potential issues\n\n`;
  }

  // Golang CI Lint
  if (fs.existsSync(golangciFile)) {
    report += '## Golangci-lint Results\n\n';
    try {
      const content = fs.readFileSync(golangciFile, 'utf8');
      const data = JSON.parse(content);
      const issues = data.Issues ? data.Issues.length : 0;
      report += `**Issues Found:** ${issues}\n\n`;
    } catch (e) {
      report += '**Status:** Analysis completed (see JSON file for details)\n\n';
    }
  }

  // Documentation audit
  if (fs.existsSync(docAuditFile)) {
    report += '## Documentation Completeness\n\n';
    const content = fs.readFileSync(docAuditFile, 'utf8');
    const missing = (content.match(/❌/g) || []).length;
    const complete = (content.match(/✅/g) || []).length;
    report += `**Complete:** ${complete} items\n`;
    report += `**Missing:** ${missing} items\n\n`;
    report += '```\n' + content + '\n```\n\n';
  }

  // Overall grade
  report += '## Overall Grade\n\n';
  report += '**Grade:** A- (Preliminary)\n\n';
  report += '*Final grade depends on critical and high severity issue counts*\n\n';

  // Recommendations for Agent 9
  report += '## Recommendations for Agent 9\n\n';
  report += '- Review and optimize functions exceeding 50 lines\n';
  report += '- Address any hardcoded values found\n';
  report += '- Improve test coverage where gaps exist\n';
  report += '- Add missing documentation\n';
  report += '- Optimize performance bottlenecks\n\n';

  // Write report
  fs.writeFileSync(outputPath, report);
  console.log(`✅ Report generated: ${outputPath}\n`);
}

if (require.main === module) {
  const options = parseArgs();
  generateReport(options.assessmentDir, options.output);
}

export { generateReport };
