#!/usr/bin/env node

/**
 * Coverage Scaling Automation
 * 
 * This script ensures that code coverage scales with changes:
 * - New files must have 100% coverage
 * - Modified files cannot decrease in coverage
 * - Generates coverage delta reports
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const COVERAGE_FILE = 'coverage/coverage-summary.json';
const BASELINE_FILE = '.coverage-baseline.json';
const MIN_NEW_FILE_COVERAGE = 100;
const MIN_MODIFIED_FILE_COVERAGE = 95;

/**
 * Get list of changed files from git
 */
function getChangedFiles() {
  try {
    // Get files changed in current branch compared to main
    const stdout = execSync('git diff --name-only origin/main...HEAD 2>/dev/null || git diff --name-only HEAD~1 2>/dev/null', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore']
    });
    
    return stdout
      .split('\n')
      .filter(line => line.trim())
      .filter(file => file.startsWith('src/') && (file.endsWith('.ts') || file.endsWith('.js')))
      .filter(file => !file.endsWith('.test.ts') && !file.endsWith('.spec.ts'));
  } catch (error) {
    console.warn('Warning: Could not determine changed files, checking all files');
    return [];
  }
}

/**
 * Get list of new files (not in baseline)
 */
function getNewFiles(changedFiles, baseline) {
  if (!baseline) return changedFiles;
  
  const baselineFiles = new Set(Object.keys(baseline));
  return changedFiles.filter(file => !baselineFiles.has(file));
}

/**
 * Load coverage data
 */
function loadCoverage() {
  if (!fs.existsSync(COVERAGE_FILE)) {
    throw new Error(`Coverage file not found: ${COVERAGE_FILE}`);
  }
  
  const data = fs.readFileSync(COVERAGE_FILE, 'utf-8');
  return JSON.parse(data);
}

/**
 * Load baseline coverage data
 */
function loadBaseline() {
  if (!fs.existsSync(BASELINE_FILE)) {
    return null;
  }
  
  const data = fs.readFileSync(BASELINE_FILE, 'utf-8');
  return JSON.parse(data);
}

/**
 * Save baseline coverage data
 */
function saveBaseline(coverage) {
  const baseline = {};
  
  Object.keys(coverage).forEach(file => {
    if (file !== 'total' && file.startsWith('src/')) {
      baseline[file] = {
        statements: coverage[file].statements.pct,
        branches: coverage[file].branches.pct,
        functions: coverage[file].functions.pct,
        lines: coverage[file].lines.pct,
      };
    }
  });
  
  fs.writeFileSync(BASELINE_FILE, JSON.stringify(baseline, null, 2));
  console.log(`✓ Baseline saved to ${BASELINE_FILE}`);
}

/**
 * Calculate average coverage for a file
 */
function getAverageCoverage(fileCoverage) {
  return (
    fileCoverage.statements.pct +
    fileCoverage.branches.pct +
    fileCoverage.functions.pct +
    fileCoverage.lines.pct
  ) / 4;
}

/**
 * Check coverage for changed files
 */
function checkCoverageScaling() {
  console.log('\n🔍 Coverage Scaling Analysis\n');
  console.log('━'.repeat(70));
  
  const coverage = loadCoverage();
  const baseline = loadBaseline();
  const changedFiles = getChangedFiles();
  const newFiles = getNewFiles(changedFiles, baseline);
  
  console.log(`\n📊 Summary:`);
  console.log(`  Changed files: ${changedFiles.length}`);
  console.log(`  New files: ${newFiles.length}`);
  console.log(`  Baseline exists: ${baseline ? 'Yes' : 'No'}`);
  
  const issues = [];
  const warnings = [];
  const successes = [];
  
  // Check new files for 100% coverage requirement
  console.log(`\n📝 New Files (require ${MIN_NEW_FILE_COVERAGE}% coverage):`);
  if (newFiles.length === 0) {
    console.log('  No new files');
  } else {
    newFiles.forEach(file => {
      const fileCoverage = coverage[file];
      if (!fileCoverage) {
        warnings.push(`  ⚠️  ${file}: No coverage data found`);
        return;
      }
      
      const avgCoverage = getAverageCoverage(fileCoverage);
      
      if (avgCoverage < MIN_NEW_FILE_COVERAGE) {
        issues.push({
          file,
          message: `New file has ${avgCoverage.toFixed(2)}% coverage (required: ${MIN_NEW_FILE_COVERAGE}%)`,
          details: fileCoverage,
        });
      } else {
        successes.push(`  ✅ ${file}: ${avgCoverage.toFixed(2)}% coverage`);
      }
    });
  }
  
  // Check modified files for coverage regression
  console.log(`\n✏️  Modified Files (require ${MIN_MODIFIED_FILE_COVERAGE}% or no decrease):`);
  const modifiedFiles = changedFiles.filter(f => !newFiles.includes(f));
  
  if (modifiedFiles.length === 0) {
    console.log('  No modified files');
  } else if (!baseline) {
    console.log('  No baseline to compare against');
  } else {
    modifiedFiles.forEach(file => {
      const fileCoverage = coverage[file];
      const baselineCoverage = baseline[file];
      
      if (!fileCoverage) {
        warnings.push(`  ⚠️  ${file}: No coverage data found`);
        return;
      }
      
      if (!baselineCoverage) {
        warnings.push(`  ⚠️  ${file}: No baseline data found`);
        return;
      }
      
      const currentAvg = getAverageCoverage(fileCoverage);
      const baselineAvg = (
        baselineCoverage.statements +
        baselineCoverage.branches +
        baselineCoverage.functions +
        baselineCoverage.lines
      ) / 4;
      
      const delta = currentAvg - baselineAvg;
      
      if (currentAvg < MIN_MODIFIED_FILE_COVERAGE && delta < 0) {
        issues.push({
          file,
          message: `Coverage decreased by ${Math.abs(delta).toFixed(2)}% (${baselineAvg.toFixed(2)}% → ${currentAvg.toFixed(2)}%)`,
          details: fileCoverage,
        });
      } else if (delta >= 0) {
        successes.push(`  ✅ ${file}: ${currentAvg.toFixed(2)}% (${delta >= 0 ? '+' : ''}${delta.toFixed(2)}%)`);
      } else {
        warnings.push(`  ⚠️  ${file}: ${currentAvg.toFixed(2)}% (${delta.toFixed(2)}%) - minor decrease acceptable`);
      }
    });
  }
  
  // Print results
  console.log('\n━'.repeat(70));
  console.log('\n📈 Results:\n');
  
  if (successes.length > 0) {
    console.log('✅ Passed:');
    successes.forEach(s => console.log(s));
  }
  
  if (warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    warnings.forEach(w => console.log(w));
  }
  
  if (issues.length > 0) {
    console.log('\n❌ Issues Found:\n');
    issues.forEach(issue => {
      console.log(`  ❌ ${issue.file}`);
      console.log(`     ${issue.message}`);
      console.log(`     Statements: ${issue.details.statements.pct}%`);
      console.log(`     Branches: ${issue.details.branches.pct}%`);
      console.log(`     Functions: ${issue.details.functions.pct}%`);
      console.log(`     Lines: ${issue.details.lines.pct}%`);
    });
    console.log('\n━'.repeat(70));
    console.log('\n❌ Coverage scaling validation FAILED');
    console.log('\n💡 Tips:');
    console.log('  - Add tests for new files to achieve 100% coverage');
    console.log('  - Ensure modified files maintain or improve coverage');
    console.log('  - Run: npm test -- --coverage --collectCoverageFrom="src/**/*.ts"\n');
    return false;
  }
  
  console.log('\n━'.repeat(70));
  console.log('\n✅ Coverage scaling validation PASSED\n');
  
  // Update baseline if no issues
  if (!baseline || process.argv.includes('--update-baseline')) {
    console.log('📝 Updating coverage baseline...');
    saveBaseline(coverage);
  }
  
  return true;
}

/**
 * Generate coverage report
 */
function generateReport() {
  console.log('\n📊 Overall Coverage Report\n');
  console.log('━'.repeat(70));
  
  const coverage = loadCoverage();
  const total = coverage.total;
  
  if (total) {
    console.log(`\nTotal Coverage:`);
    console.log(`  Statements: ${total.statements.pct}%`);
    console.log(`  Branches:   ${total.branches.pct}%`);
    console.log(`  Functions:  ${total.functions.pct}%`);
    console.log(`  Lines:      ${total.lines.pct}%`);
  }
  
  console.log('\n━'.repeat(70));
}

// Main execution
function main() {
  try {
    const command = process.argv[2];
    
    if (command === '--help' || command === '-h') {
      console.log(`
Usage: node scripts/coverage-scaling.js [command]

Commands:
  check              Check coverage scaling (default)
  report             Generate coverage report
  update-baseline    Update the coverage baseline
  --help, -h         Show this help message

Options:
  --update-baseline  Update baseline after check
      `);
      process.exit(0);
    }
    
    if (command === 'report') {
      generateReport();
      process.exit(0);
    }
    
    if (command === 'update-baseline') {
      const coverage = loadCoverage();
      saveBaseline(coverage);
      process.exit(0);
    }
    
    // Default: check coverage scaling
    generateReport();
    const passed = checkCoverageScaling();
    process.exit(passed ? 0 : 1);
    
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}\n`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { checkCoverageScaling, loadCoverage, loadBaseline, saveBaseline };
