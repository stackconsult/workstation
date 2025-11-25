/**
 * Timeout Validation Module
 * 
 * Validates that all async operations have proper timeout protection
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface TimeoutIssue {
  file: string;
  line: number;
  type: 'http' | 'database' | 'async';
  hasTimeout: boolean;
}

export class TimeoutValidator {
  private projectRoot: string;
  private issues: TimeoutIssue[] = [];
  private guardRailsAdded: Array<{
    type: string;
    location: string;
    description: string;
    reason: string;
  }> = [];

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  /**
   * Validate timeout protection
   */
  async validate(): Promise<{
    category: string;
    status: 'pass' | 'fail' | 'warning';
    issues_found: number;
    auto_fixed: number;
    details: string[];
  }> {
    const srcDir = path.join(this.projectRoot, 'src');
    const files = await this.getTypeScriptFiles(srcDir);

    for (const file of files) {
      await this.checkFileForTimeouts(file);
    }

    const details: string[] = [];
    
    if (this.issues.length === 0) {
      details.push('All async operations have timeout protection');
      details.push('HTTP requests properly configured');
    } else {
      details.push(`Found ${this.issues.length} potential timeout issues`);
      this.issues.forEach(issue => {
        details.push(`  ${issue.file}:${issue.line} - ${issue.type} call without explicit timeout`);
      });
    }

    return {
      category: 'Timeout Protection',
      status: this.issues.length === 0 ? 'pass' : 'warning',
      issues_found: this.issues.length,
      auto_fixed: 0,
      details
    };
  }

  /**
   * Get all TypeScript files recursively
   */
  private async getTypeScriptFiles(dir: string): Promise<string[]> {
    const pattern = path.join(dir, '**', '*.ts');
    return glob(pattern, { 
      ignore: ['**/node_modules/**', '**/dist/**', '**/*.test.ts', '**/*.spec.ts']
    });
  }

  /**
   * Check a file for timeout issues
   */
  private async checkFileForTimeouts(file: string): Promise<void> {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check for HTTP calls (axios, fetch, http)
      if (line.match(/axios\.|fetch\(|\.get\(|\.post\(|\.put\(|\.delete\(/)) {
        const hasTimeout = this.checkForTimeout(lines, i);
        if (!hasTimeout) {
          // Only flag if not already in a request config with timeout
          const context = lines.slice(Math.max(0, i - 3), Math.min(lines.length, i + 3)).join('\n');
          if (!context.includes('timeout:') && !context.includes('timeout =')) {
            this.issues.push({
              file: path.relative(this.projectRoot, file),
              line: i + 1,
              type: 'http',
              hasTimeout: false
            });
          }
        }
      }

      // Check for database queries (if any)
      if (line.match(/\.query\(|\.execute\(/)) {
        const hasTimeout = this.checkForTimeout(lines, i);
        if (!hasTimeout) {
          this.issues.push({
            file: path.relative(this.projectRoot, file),
            line: i + 1,
            type: 'database',
            hasTimeout: false
          });
        }
      }

      // Check for Promise.race with timeout pattern (good practice)
      if (line.match(/Promise\.race\(/)) {
        const hasTimeout = this.checkForTimeout(lines, i);
        // This is actually a timeout implementation, so it's good
      }
    }
  }

  /**
   * Check if there's a timeout configuration near the call
   */
  private checkForTimeout(lines: string[], callLine: number): boolean {
    // Check 5 lines before and 10 lines after
    const start = Math.max(0, callLine - 5);
    const end = Math.min(lines.length, callLine + 10);
    const context = lines.slice(start, end).join('\n');

    // Look for timeout patterns
    const timeoutPatterns = [
      /timeout:/,
      /timeout\s*=/,
      /setTimeout/,
      /AbortSignal\.timeout/,
      /signal:/,
      /maxWaitTime/,
    ];

    return timeoutPatterns.some(pattern => pattern.test(context));
  }

  /**
   * Get guard rails that were added
   */
  getGuardRailsAdded(): Array<{
    type: string;
    location: string;
    description: string;
    reason: string;
  }> {
    return this.guardRailsAdded;
  }
}
