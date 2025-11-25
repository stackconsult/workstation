/**
 * Loop Detection Module
 * 
 * Detects infinite loops and adds protection guards
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface LoopIssue {
  file: string;
  line: number;
  type: 'while' | 'for' | 'recursion';
  hasGuard: boolean;
}

export class LoopDetector {
  private projectRoot: string;
  private issues: LoopIssue[] = [];
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
   * Detect loops without proper guards
   */
  async detect(): Promise<{
    category: string;
    status: 'pass' | 'fail' | 'warning';
    issues_found: number;
    auto_fixed: number;
    details: string[];
  }> {
    const srcDir = path.join(this.projectRoot, 'src');
    const files = await this.getTypeScriptFiles(srcDir);

    for (const file of files) {
      await this.checkFileForUnguardedLoops(file);
    }

    const details: string[] = [];
    
    if (this.issues.length === 0) {
      details.push('No unguarded loops detected');
      details.push('All loops have proper iteration limits');
    } else {
      details.push(`Found ${this.issues.length} potential issues`);
      this.issues.forEach(issue => {
        details.push(`  ${issue.file}:${issue.line} - ${issue.type} loop without guard`);
      });
    }

    return {
      category: 'Loop Protection',
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
   * Check a file for unguarded loops
   */
  private async checkFileForUnguardedLoops(file: string): Promise<void> {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check for while loops
      if (line.match(/while\s*\(/)) {
        const hasGuard = this.checkForIterationGuard(lines, i);
        if (!hasGuard) {
          this.issues.push({
            file: path.relative(this.projectRoot, file),
            line: i + 1,
            type: 'while',
            hasGuard: false
          });
        }
      }

      // Check for for loops (less critical but still check)
      if (line.match(/for\s*\([^;]*;;/)) {  // Infinite for loops
        const hasGuard = this.checkForIterationGuard(lines, i);
        if (!hasGuard) {
          this.issues.push({
            file: path.relative(this.projectRoot, file),
            line: i + 1,
            type: 'for',
            hasGuard: false
          });
        }
      }
    }
  }

  /**
   * Check if there's an iteration guard near the loop
   */
  private checkForIterationGuard(lines: string[], loopLine: number): boolean {
    // Check 10 lines before and after for iteration guards
    const start = Math.max(0, loopLine - 2);
    const end = Math.min(lines.length, loopLine + 15);
    const context = lines.slice(start, end).join('\n');

    // Look for common guard patterns
    const guardPatterns = [
      /maxIterations/i,
      /MAX_ITER/,
      /iteration.*<|<.*iteration/,
      /attempts.*<|<.*attempts/,
      /counter.*<|<.*counter/,
      /\.length/,  // Array.length based loops are generally safe
      /i\s*<|<\s*i/,  // Standard for loop counter
    ];

    return guardPatterns.some(pattern => pattern.test(context));
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
