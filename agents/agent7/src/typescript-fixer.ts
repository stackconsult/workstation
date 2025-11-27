#!/usr/bin/env node
/**
 * Agent 7: TypeScript Error Fixer
 * 
 * Automatically fixes common TypeScript compilation errors.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface TypeScriptError {
  file: string;
  line: number;
  column: number;
  message: string;
  code: string;
}

class TypeScriptFixer {
  private projectRoot: string;
  private fixedCount: number = 0;

  constructor() {
    this.projectRoot = path.resolve(__dirname, '../../..');
  }

  /**
   * Get all TypeScript errors
   */
  private getTypeScriptErrors(): TypeScriptError[] {
    const errors: TypeScriptError[] = [];
    
    try {
      execSync('npx tsc --noEmit --pretty false', {
        cwd: this.projectRoot,
        encoding: 'utf-8',
        stdio: 'pipe'
      });
    } catch (error: unknown) {
      if (error && typeof error === 'object') {
        const errObj = error as { stdout?: string; stderr?: string };
        const output = (errObj.stdout || errObj.stderr || '').toString();
        const lines = output.split('\n');
        
        for (const line of lines) {
          const match = line.match(/^(.+)\((\d+),(\d+)\):\s+error\s+(TS\d+):\s+(.+)$/);
          if (match) {
            errors.push({
              file: match[1],
              line: parseInt(match[2], 10),
              column: parseInt(match[3], 10),
              code: match[4],
              message: match[5]
            });
          }
        }
      }
    }
    
    return errors;
  }

  /**
   * Fix missing commas in object literals
   */
  private fixMissingCommas(filePath: string, line: number): boolean {
    try {
      const fullPath = path.join(this.projectRoot, filePath);
      const content = fs.readFileSync(fullPath, 'utf-8');
      const lines = content.split('\n');
      
      // Check if the error is about a missing comma
      const errorLine = lines[line - 1];
      if (!errorLine) return false;
      
      // Simple heuristic: if the line ends with a property and next line starts with another property
      // This is a simplified fix - real-world scenarios might need more sophisticated parsing
      const nextLine = lines[line];
      if (nextLine && /^\s*\w+:/.test(nextLine) && !/[,;]$/.test(errorLine.trim())) {
        lines[line - 1] = errorLine + ',';
        fs.writeFileSync(fullPath, lines.join('\n'));
        console.log(`✅ Fixed missing comma in ${filePath}:${line}`);
        return true;
      }
    } catch {
      console.warn(`⚠️  Could not fix ${filePath}:${line}`);
    }
    
    return false;
  }

  /**
   * Fix implicit any types by adding explicit type annotations
   */
  private fixImplicitAny(filePath: string, line: number, message: string): boolean {
    try {
      const fullPath = path.join(this.projectRoot, filePath);
      const content = fs.readFileSync(fullPath, 'utf-8');
      const lines = content.split('\n');
      
      const errorLine = lines[line - 1];
      if (!errorLine) return false;
      
      // Extract parameter name from error message
      const paramMatch = message.match(/Parameter '(\w+)' implicitly has an 'any' type/);
      if (paramMatch) {
        const paramName = paramMatch[1];
        // Add ': any' type annotation (conservative fix)
        const updatedLine = errorLine.replace(
          new RegExp(`(${paramName})([,\\)])`),
          `$1: any$2`
        );
        
        if (updatedLine !== errorLine) {
          lines[line - 1] = updatedLine;
          fs.writeFileSync(fullPath, lines.join('\n'));
          console.log(`✅ Fixed implicit 'any' for parameter '${paramName}' in ${filePath}:${line}`);
          return true;
        }
      }
    } catch {
      console.warn(`⚠️  Could not fix implicit 'any' in ${filePath}:${line}`);
    }
    
    return false;
  }

  /**
   * Attempt to fix TypeScript errors automatically
   */
  public async fixErrors(): Promise<void> {
    console.log('🔧 Starting automatic TypeScript error fixing...\n');
    
    const errors = this.getTypeScriptErrors();
    
    if (errors.length === 0) {
      console.log('✅ No TypeScript errors to fix!');
      return;
    }
    
    console.log(`Found ${errors.length} TypeScript errors. Attempting to fix...\n`);
    
    for (const error of errors) {
      console.log(`Processing ${error.code} in ${error.file}:${error.line}`);
      
      let fixed = false;
      
      // Try different fix strategies based on error code
      switch (error.code) {
        case 'TS1005':
          // Missing comma or semicolon
          if (error.message.includes("',' expected")) {
            fixed = this.fixMissingCommas(error.file, error.line);
          }
          break;
          
        case 'TS7006':
          // Implicit 'any' type
          fixed = this.fixImplicitAny(error.file, error.line, error.message);
          break;
          
        default:
          console.log(`  ℹ️  No automatic fix available for ${error.code}`);
      }
      
      if (fixed) {
        this.fixedCount++;
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`  Total errors found: ${errors.length}`);
    console.log(`  Errors fixed: ${this.fixedCount}`);
    console.log(`  Errors remaining: ${errors.length - this.fixedCount}`);
    
    if (this.fixedCount > 0) {
      console.log('\n🔍 Re-checking for remaining errors...');
      const remainingErrors = this.getTypeScriptErrors();
      console.log(`  Remaining errors: ${remainingErrors.length}`);
      
      if (remainingErrors.length === 0) {
        console.log('\n✅ All TypeScript errors fixed successfully!');
      } else {
        console.log('\n⚠️  Some errors require manual intervention.');
      }
    }
  }
}

// Main execution
if (require.main === module) {
  const fixer = new TypeScriptFixer();
  fixer.fixErrors().catch((error: Error) => {
    console.error('❌ Error running TypeScript fixer:', error);
    process.exit(1);
  });
}

export { TypeScriptFixer };
