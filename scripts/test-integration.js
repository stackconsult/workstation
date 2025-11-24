/**
 * Integration Test for Chrome Extension and Workflow Builder
 * Tests the complete flow: Build -> Deploy -> Verify
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(title) {
  log('\n' + '='.repeat(60), 'blue');
  log(`  ${title}`, 'bright');
  log('='.repeat(60) + '\n', 'blue');
}

function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    log(`✅ ${description}: ${filePath} (${sizeKB} KB)`, 'green');
    return true;
  } else {
    log(`❌ ${description}: ${filePath} NOT FOUND`, 'red');
    return false;
  }
}

function runCommand(command, description) {
  log(`\n🔧 ${description}...`, 'yellow');
  try {
    execSync(command, { stdio: 'inherit' });
    log(`✅ ${description} completed`, 'green');
    return true;
  } catch (error) {
    log(`❌ ${description} failed`, 'red');
    return false;
  }
}

async function main() {
  header('Chrome Extension & Workflow Builder Integration Test');

  let passed = 0;
  let failed = 0;

  // Step 1: Check prerequisites
  header('Step 1: Prerequisites Check');

  const prereqs = [
    { cmd: 'node --version', name: 'Node.js' },
    { cmd: 'npm --version', name: 'npm' },
    { cmd: 'zip --version', name: 'zip utility' }
  ];

  for (const prereq of prereqs) {
    try {
      const version = execSync(prereq.cmd, { encoding: 'utf-8' }).trim();
      log(`✅ ${prereq.name}: ${version}`, 'green');
      passed++;
    } catch (error) {
      log(`❌ ${prereq.name} not found`, 'red');
      failed++;
    }
  }

  // Step 2: Check source files exist
  header('Step 2: Source Files Check');

  const sourceFiles = [
    'chrome-extension/manifest.json',
    'chrome-extension/popup/index.html',
    'chrome-extension/popup/script.js',
    'chrome-extension/background.js',
    'chrome-extension/content.js',
    'public/workflow-builder.html',
    'src/routes/automation.ts',
    'src/routes/workflows.ts'
  ];

  for (const file of sourceFiles) {
    if (checkFile(file, path.basename(file))) {
      passed++;
    } else {
      failed++;
    }
  }

  // Step 3: Check deployment scripts exist
  header('Step 3: Deployment Scripts Check');

  const scripts = [
    'scripts/deploy-chrome-extension.sh',
    'scripts/deploy-workflow-builder.sh',
    'scripts/deploy-all.sh'
  ];

  for (const script of scripts) {
    if (checkFile(script, path.basename(script))) {
      // Check if executable
      try {
        fs.accessSync(script, fs.constants.X_OK);
        log(`  ✅ Script is executable`, 'green');
        passed++;
      } catch (error) {
        log(`  ⚠️  Script is not executable, fixing...`, 'yellow');
        execSync(`chmod +x ${script}`);
        log(`  ✅ Script is now executable`, 'green');
        passed++;
      }
    } else {
      failed++;
    }
  }

  // Step 4: Build project
  header('Step 4: Build Project');

  if (runCommand('npm run build', 'Building project')) {
    passed++;
  } else {
    failed++;
  }

  // Step 5: Deploy Chrome Extension
  header('Step 5: Deploy Chrome Extension');

  if (runCommand('./scripts/deploy-chrome-extension.sh', 'Deploying Chrome Extension')) {
    passed++;
    
    // Verify deployment outputs
    const chromeOutputs = [
      'build/chrome-extension/manifest.json',
      'build/chrome-extension/popup/index.html',
      'public/downloads/CHROME_EXTENSION_INSTALL.md'
    ];

    for (const output of chromeOutputs) {
      if (checkFile(output, path.basename(output))) {
        passed++;
      } else {
        failed++;
      }
    }
  } else {
    failed++;
  }

  // Step 6: Deploy Workflow Builder
  header('Step 6: Deploy Workflow Builder');

  if (runCommand('./scripts/deploy-workflow-builder.sh', 'Deploying Workflow Builder')) {
    passed++;
    
    // Verify deployment outputs
    const builderOutputs = [
      'build/workflow-builder/workflow-builder.html',
      'build/workflow-builder/README.md'
    ];

    for (const output of builderOutputs) {
      if (checkFile(output, path.basename(output))) {
        passed++;
      } else {
        failed++;
      }
    }
  } else {
    failed++;
  }

  // Step 7: Check API client
  header('Step 7: API Client Check');

  if (checkFile('public/js/workstation-client.js', 'Workstation API Client')) {
    passed++;
    
    // Check if it's valid JavaScript
    try {
      const clientCode = fs.readFileSync('public/js/workstation-client.js', 'utf-8');
      if (clientCode.includes('class WorkstationClient') && clientCode.includes('createWorkflow')) {
        log('  ✅ API client contains required methods', 'green');
        passed++;
      } else {
        log('  ❌ API client missing required methods', 'red');
        failed++;
      }
    } catch (error) {
      log('  ❌ Failed to read API client', 'red');
      failed++;
    }
  } else {
    failed++;
  }

  // Step 8: Final verification
  header('Step 8: Final Verification');

  const finalChecks = [
    'public/downloads/manifest.json',
    'public/downloads/INSTALLATION_GUIDE.md',
    'public/downloads/QUICK_REFERENCE.md'
  ];

  for (const check of finalChecks) {
    if (checkFile(check, path.basename(check))) {
      passed++;
    } else {
      failed++;
    }
  }

  // Summary
  header('Test Summary');

  const total = passed + failed;
  const percentage = ((passed / total) * 100).toFixed(1);

  log(`Total Tests: ${total}`, 'bright');
  log(`Passed: ${passed}`, 'green');
  log(`Failed: ${failed}`, failed > 0 ? 'red' : 'green');
  log(`Success Rate: ${percentage}%`, percentage >= 90 ? 'green' : 'yellow');

  if (failed === 0) {
    log('\n🎉 All tests passed! Chrome Extension and Workflow Builder are ready to use.', 'green');
    log('\nQuick Start:', 'bright');
    log('  1. Load Chrome extension: chrome://extensions/ -> Load unpacked -> build/chrome-extension/', 'blue');
    log('  2. Start backend: npm start', 'blue');
    log('  3. Open workflow builder: http://localhost:3000/workflow-builder.html', 'blue');
    return 0;
  } else {
    log('\n⚠️  Some tests failed. Please review the errors above.', 'yellow');
    return 1;
  }
}

// Run tests
main().then(code => process.exit(code)).catch(error => {
  console.error('Test failed with error:', error);
  process.exit(1);
});
