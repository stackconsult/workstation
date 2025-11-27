#!/usr/bin/env node
/**
 * Agent 7: Security Scanner
 * 
 * Main security scanning engine that coordinates TypeScript error detection
 * and CVE vulnerability scanning.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface ScanResult {
  timestamp: string;
  agent: number;
  name: string;
  typescriptErrors: TypeScriptError[];
  securityVulnerabilities: SecurityVulnerability[];
  summary: {
    totalTypeScriptErrors: number;
    totalCVEs: number;
    criticalCVEs: number;
    highCVEs: number;
    mediumCVEs: number;
    lowCVEs: number;
  };
}

interface TypeScriptError {
  file: string;
  line: number;
  column: number;
  message: string;
  code: string;
}

interface SecurityVulnerability {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  package: string;
  currentVersion: string;
  fixedVersion: string;
  title: string;
  url: string;
}

class SecurityScanner {
  private projectRoot: string;
  private reportDir: string;
  private timestamp: string;

  constructor() {
    this.projectRoot = path.resolve(__dirname, '../../..');
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.reportDir = path.join(__dirname, '../reports', this.timestamp);
    
    // Ensure report directory exists
    if (!fs.existsSync(this.reportDir)) {
      fs.mkdirSync(this.reportDir, { recursive: true });
    }
  }

  /**
   * Scan for TypeScript compilation errors
   */
  public scanTypeScriptErrors(): TypeScriptError[] {
    console.log('🔍 Scanning for TypeScript errors...');
    
    const errors: TypeScriptError[] = [];
    
    try {
      // Run TypeScript compiler with --noEmit to check for errors
      execSync('npx tsc --noEmit --pretty false', {
        cwd: this.projectRoot,
        encoding: 'utf-8',
        stdio: 'pipe'
      });
      
      console.log('✅ No TypeScript errors found!');
    } catch (error: unknown) {
      if (error && typeof error === 'object') {
        const errObj = error as { stdout?: string; stderr?: string };
        const output = (errObj.stdout || errObj.stderr || '').toString();
        const lines = output.split('\n');
        
        for (const line of lines) {
          // Parse TypeScript error format: file.ts(line,col): error TSxxxx: message
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
        
        console.log(`⚠️  Found ${errors.length} TypeScript errors`);
      }
    }
    
    return errors;
  }

  /**
   * Scan for security vulnerabilities using npm audit
   */
  public scanSecurityVulnerabilities(): SecurityVulnerability[] {
    console.log('🔍 Scanning for security vulnerabilities...');
    
    const vulnerabilities: SecurityVulnerability[] = [];
    
    try {
      // Run npm audit with JSON output
      const result = execSync('npm audit --json', {
        cwd: this.projectRoot,
        encoding: 'utf-8',
        stdio: 'pipe'
      });
      
      const auditData = JSON.parse(result);
      
      // Parse vulnerabilities from npm audit output
      if (auditData.vulnerabilities) {
        for (const [pkgName, vulnData] of Object.entries(auditData.vulnerabilities)) {
          const vData = vulnData as {
            severity: string;
            via: Array<{ title: string; url: string; source?: number }>;
            range: string;
            fixAvailable?: { version: string };
          };
          
          for (const via of vData.via) {
            if (typeof via === 'object' && via.title) {
              vulnerabilities.push({
                id: `CVE-${via.source || 'UNKNOWN'}`,
                severity: vData.severity as 'critical' | 'high' | 'medium' | 'low',
                package: pkgName,
                currentVersion: vData.range,
                fixedVersion: vData.fixAvailable?.version || 'N/A',
                title: via.title,
                url: via.url || ''
              });
            }
          }
        }
      }
      
      console.log(`Found ${vulnerabilities.length} security vulnerabilities`);
    } catch (error: unknown) {
      if (error && typeof error === 'object') {
        const errObj = error as { stdout?: string; stderr?: string };
        const output = (errObj.stdout || errObj.stderr || '').toString();
        
        try {
          const auditData = JSON.parse(output);
          
          if (auditData.vulnerabilities) {
            for (const [pkgName, vulnData] of Object.entries(auditData.vulnerabilities)) {
              const vData = vulnData as {
                severity: string;
                via: Array<{ title: string; url: string; source?: number }>;
                range: string;
                fixAvailable?: { version: string };
              };
              
              for (const via of vData.via) {
                if (typeof via === 'object' && via.title) {
                  vulnerabilities.push({
                    id: `CVE-${via.source || 'UNKNOWN'}`,
                    severity: vData.severity as 'critical' | 'high' | 'medium' | 'low',
                    package: pkgName,
                    currentVersion: vData.range,
                    fixedVersion: vData.fixAvailable?.version || 'N/A',
                    title: via.title,
                    url: via.url || ''
                  });
                }
              }
            }
          }
        } catch {
          console.warn('⚠️  Could not parse npm audit output');
        }
      }
    }
    
    if (vulnerabilities.length === 0) {
      console.log('✅ No security vulnerabilities found!');
    } else {
      console.log(`⚠️  Found ${vulnerabilities.length} security vulnerabilities`);
    }
    
    return vulnerabilities;
  }

  /**
   * Generate security report
   */
  public generateReport(result: ScanResult): void {
    console.log('📝 Generating security report...');
    
    const reportPath = path.join(this.reportDir, 'SECURITY_REPORT.md');
    
    let report = `# Security Scan Report\n\n`;
    report += `**Generated:** ${new Date().toISOString()}\n`;
    report += `**Agent:** Agent 7 - Security & Penetration Testing\n\n`;
    
    report += `## Executive Summary\n\n`;
    report += `- Total TypeScript Errors: ${result.summary.totalTypeScriptErrors}\n`;
    report += `- Total Security Vulnerabilities: ${result.summary.totalCVEs}\n`;
    report += `  - Critical: ${result.summary.criticalCVEs}\n`;
    report += `  - High: ${result.summary.highCVEs}\n`;
    report += `  - Medium: ${result.summary.mediumCVEs}\n`;
    report += `  - Low: ${result.summary.lowCVEs}\n\n`;
    
    if (result.typescriptErrors.length > 0) {
      report += `## TypeScript Errors (${result.typescriptErrors.length})\n\n`;
      for (const error of result.typescriptErrors) {
        report += `### ${error.code}\n`;
        report += `**File:** ${error.file}:${error.line}:${error.column}\n`;
        report += `**Message:** ${error.message}\n\n`;
      }
    }
    
    if (result.securityVulnerabilities.length > 0) {
      report += `## Security Vulnerabilities (${result.securityVulnerabilities.length})\n\n`;
      
      const bySeverity = {
        critical: result.securityVulnerabilities.filter(v => v.severity === 'critical'),
        high: result.securityVulnerabilities.filter(v => v.severity === 'high'),
        medium: result.securityVulnerabilities.filter(v => v.severity === 'medium'),
        low: result.securityVulnerabilities.filter(v => v.severity === 'low')
      };
      
      for (const [severity, vulns] of Object.entries(bySeverity)) {
        if (vulns.length > 0) {
          report += `### ${severity.toUpperCase()} Severity (${vulns.length})\n\n`;
          for (const vuln of vulns) {
            report += `#### ${vuln.id}: ${vuln.title}\n`;
            report += `**Package:** ${vuln.package}\n`;
            report += `**Current Version:** ${vuln.currentVersion}\n`;
            report += `**Fixed Version:** ${vuln.fixedVersion}\n`;
            report += `**URL:** ${vuln.url}\n\n`;
          }
        }
      }
    }
    
    if (result.typescriptErrors.length === 0 && result.securityVulnerabilities.length === 0) {
      report += `## Status\n\n`;
      report += `✅ **All Clear!** No TypeScript errors or security vulnerabilities found.\n\n`;
    }
    
    fs.writeFileSync(reportPath, report);
    console.log(`✅ Report generated: ${reportPath}`);
  }

  /**
   * Create handoff artifact for next agent
   */
  public createHandoffArtifact(result: ScanResult): void {
    console.log('📦 Creating handoff artifact...');
    
    const handoffPath = path.join(this.projectRoot, '.agent7-handoff.json');
    const handoff = {
      agent: 7,
      name: 'Security & Penetration Testing',
      timestamp: result.timestamp,
      status: 'success',
      report_path: path.join(this.reportDir, 'SECURITY_REPORT.md'),
      findings: {
        typescriptErrors: result.summary.totalTypeScriptErrors,
        critical: result.summary.criticalCVEs,
        high: result.summary.highCVEs,
        medium: result.summary.mediumCVEs,
        low: result.summary.lowCVEs
      },
      next_agent: 8
    };
    
    fs.writeFileSync(handoffPath, JSON.stringify(handoff, null, 2));
    console.log(`✅ Handoff artifact created: ${handoffPath}`);
  }

  /**
   * Run full security scan
   */
  public async run(): Promise<void> {
    console.log('🚀 Starting Agent 7: Security Scanner\n');
    
    const typescriptErrors = this.scanTypeScriptErrors();
    const securityVulnerabilities = this.scanSecurityVulnerabilities();
    
    const result: ScanResult = {
      timestamp: new Date().toISOString(),
      agent: 7,
      name: 'Security & Penetration Testing',
      typescriptErrors,
      securityVulnerabilities,
      summary: {
        totalTypeScriptErrors: typescriptErrors.length,
        totalCVEs: securityVulnerabilities.length,
        criticalCVEs: securityVulnerabilities.filter(v => v.severity === 'critical').length,
        highCVEs: securityVulnerabilities.filter(v => v.severity === 'high').length,
        mediumCVEs: securityVulnerabilities.filter(v => v.severity === 'medium').length,
        lowCVEs: securityVulnerabilities.filter(v => v.severity === 'low').length
      }
    };
    
    this.generateReport(result);
    this.createHandoffArtifact(result);
    
    console.log('\n✅ Agent 7 execution completed successfully!');
  }
}

// Main execution
if (require.main === module) {
  const scanner = new SecurityScanner();
  scanner.run().catch((error: Error) => {
    console.error('❌ Error running security scanner:', error);
    process.exit(1);
  });
}

export { SecurityScanner, ScanResult, TypeScriptError, SecurityVulnerability };
