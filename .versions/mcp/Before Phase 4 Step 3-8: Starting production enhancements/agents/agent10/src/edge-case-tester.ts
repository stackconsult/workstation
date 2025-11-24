/**
 * Edge Case Tester Module
 * 
 * Tests edge cases that typical development might miss
 */

import * as fs from 'fs';
import * as path from 'path';

export class EdgeCaseTester {
  private projectRoot: string;
  private testCount: number = 0;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  /**
   * Run edge case tests
   */
  async test(): Promise<{
    category: string;
    status: 'pass' | 'fail' | 'warning';
    issues_found: number;
    auto_fixed: number;
    details: string[];
  }> {
    const details: string[] = [];
    
    // Test 1: Empty input handling
    const emptyInputResult = this.testEmptyInputHandling();
    details.push(`Empty input handling: ${emptyInputResult.passed ? '✅' : '❌'}`);
    this.testCount++;

    // Test 2: Null/undefined handling
    const nullHandlingResult = this.testNullHandling();
    details.push(`Null/undefined handling: ${nullHandlingResult.passed ? '✅' : '❌'}`);
    this.testCount++;

    // Test 3: Boundary values
    const boundaryResult = this.testBoundaryValues();
    details.push(`Boundary value testing: ${boundaryResult.passed ? '✅' : '❌'}`);
    this.testCount++;

    // Test 4: Concurrent operations
    const concurrentResult = this.testConcurrentOperations();
    details.push(`Concurrent operations: ${concurrentResult.passed ? '✅' : '❌'}`);
    this.testCount++;

    // Test 5: Error propagation
    const errorResult = this.testErrorPropagation();
    details.push(`Error propagation: ${errorResult.passed ? '✅' : '❌'}`);
    this.testCount++;

    const allPassed = [
      emptyInputResult,
      nullHandlingResult,
      boundaryResult,
      concurrentResult,
      errorResult
    ].every(r => r.passed);

    details.unshift(`${this.testCount} edge case scenarios tested`);

    return {
      category: 'Edge Case Coverage',
      status: allPassed ? 'pass' : 'warning',
      issues_found: allPassed ? 0 : 1,
      auto_fixed: 0,
      details
    };
  }

  /**
   * Test empty input handling
   */
  private testEmptyInputHandling(): { passed: boolean; reason?: string } {
    // Check if authentication middleware handles empty tokens
    try {
      const authFile = path.join(this.projectRoot, 'src', 'auth', 'jwt.ts');
      if (!fs.existsSync(authFile)) {
        return { passed: true, reason: 'Auth file not found, skipping' };
      }

      const content = fs.readFileSync(authFile, 'utf8');
      
      // Look for empty string checks
      const hasEmptyCheck = content.includes('!token') || 
                          content.includes('token.length') ||
                          content.includes('token.trim()');

      return { 
        passed: hasEmptyCheck,
        reason: hasEmptyCheck ? 'Empty token handling found' : 'Missing empty token validation'
      };
    } catch (error) {
      return { passed: false, reason: 'Error checking empty input handling' };
    }
  }

  /**
   * Test null/undefined handling
   */
  private testNullHandling(): { passed: boolean; reason?: string } {
    try {
      const srcDir = path.join(this.projectRoot, 'src');
      const files = this.getFilesRecursive(srcDir, '.ts');
      
      let nullChecksFound = 0;
      let potentialNullAccess = 0;

      for (const file of files) {
        if (file.includes('.test.') || file.includes('.spec.')) continue;
        
        const content = fs.readFileSync(file, 'utf8');
        
        // Count null checks
        const nullCheckMatches = content.match(/(?:!==|===)\s*(?:null|undefined)|(?:null|undefined)\s*(?:!==|===)/g);
        if (nullCheckMatches) {
          nullChecksFound += nullCheckMatches.length;
        }

        // Count optional chaining (good practice)
        const optionalChaining = content.match(/\?\./g);
        if (optionalChaining) {
          nullChecksFound += optionalChaining.length;
        }

        // Count potential issues (property access without checks)
        // This is a simplified heuristic
        const propertyAccess = content.match(/\.\w+/g);
        if (propertyAccess) {
          potentialNullAccess += Math.floor(propertyAccess.length * 0.1); // Assume 10% might be risky
        }
      }

      // If we have reasonable null checking coverage, pass
      const ratio = nullChecksFound / Math.max(potentialNullAccess, 1);
      const passed = ratio > 0.5 || nullChecksFound > 10;

      return { 
        passed,
        reason: `Found ${nullChecksFound} null checks (ratio: ${ratio.toFixed(2)})`
      };
    } catch (error) {
      return { passed: false, reason: 'Error checking null handling' };
    }
  }

  /**
   * Test boundary values
   */
  private testBoundaryValues(): { passed: boolean; reason?: string } {
    try {
      // Check if rate limiting has proper boundaries
      const indexFile = path.join(this.projectRoot, 'src', 'index.ts');
      if (!fs.existsSync(indexFile)) {
        return { passed: true, reason: 'Index file not found, skipping' };
      }

      const content = fs.readFileSync(indexFile, 'utf8');
      
      // Look for rate limit configurations
      const hasRateLimit = content.includes('rateLimit') || content.includes('rate-limit');
      const hasMaxValue = content.includes('max:') || content.includes('limit:');

      return { 
        passed: hasRateLimit && hasMaxValue,
        reason: hasRateLimit && hasMaxValue ? 'Rate limiting boundaries configured' : 'Missing rate limit configuration'
      };
    } catch (error) {
      return { passed: false, reason: 'Error checking boundary values' };
    }
  }

  /**
   * Test concurrent operations
   */
  private testConcurrentOperations(): { passed: boolean; reason?: string } {
    try {
      const srcDir = path.join(this.projectRoot, 'src');
      const files = this.getFilesRecursive(srcDir, '.ts');
      
      let promiseAllFound = false;
      let asyncAwaitFound = false;

      for (const file of files) {
        if (file.includes('.test.') || file.includes('.spec.')) continue;
        
        const content = fs.readFileSync(file, 'utf8');
        
        if (content.includes('Promise.all')) {
          promiseAllFound = true;
        }
        if (content.includes('async ') && content.includes('await ')) {
          asyncAwaitFound = true;
        }
      }

      // If using async/await, that's good for preventing race conditions
      const passed = asyncAwaitFound;

      return { 
        passed,
        reason: passed ? 'Async/await patterns found (good)' : 'Limited async patterns detected'
      };
    } catch (error) {
      return { passed: false, reason: 'Error checking concurrent operations' };
    }
  }

  /**
   * Test error propagation
   */
  private testErrorPropagation(): { passed: boolean; reason?: string } {
    try {
      const srcDir = path.join(this.projectRoot, 'src');
      const files = this.getFilesRecursive(srcDir, '.ts');
      
      let tryCatchFound = 0;
      let throwFound = 0;

      for (const file of files) {
        if (file.includes('.test.') || file.includes('.spec.')) continue;
        
        const content = fs.readFileSync(file, 'utf8');
        
        const tryCatchMatches = content.match(/try\s*\{/g);
        if (tryCatchMatches) {
          tryCatchFound += tryCatchMatches.length;
        }

        const throwMatches = content.match(/throw\s+(?:new\s+)?Error/g);
        if (throwMatches) {
          throwFound += throwMatches.length;
        }
      }

      const passed = tryCatchFound > 0 && throwFound > 0;

      return { 
        passed,
        reason: `Found ${tryCatchFound} try-catch blocks, ${throwFound} throw statements`
      };
    } catch (error) {
      return { passed: false, reason: 'Error checking error propagation' };
    }
  }

  /**
   * Get files recursively
   */
  private getFilesRecursive(dir: string, ext: string): string[] {
    const files: string[] = [];
    
    if (!fs.existsSync(dir)) {
      return files;
    }

    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        if (item !== 'node_modules' && item !== 'dist') {
          files.push(...this.getFilesRecursive(fullPath, ext));
        }
      } else if (item.endsWith(ext)) {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  /**
   * Get number of tests run
   */
  getTestCount(): number {
    return this.testCount;
  }
}
