#!/usr/bin/env node

/**
 * Test script for Chrome Extension build with Playwright features
 * Verifies that all required files exist and Playwright integration is complete
 */

const fs = require('fs');
const path = require('path');

const EXTENSION_DIR = path.join(__dirname, '../build/chrome-extension');

// Required files for the Chrome extension
const REQUIRED_FILES = [
  'manifest.json',
  'background.js',
  'content.js',
  'popup/index.html',
  'popup/script.js',
  'icons/icon16.png',
  'icons/icon48.png',
  'icons/icon128.png',
  // Playwright modules (Phase 1-8)
  'playwright/auto-wait.js',
  'playwright/network.js',
  'playwright/retry.js',
  'playwright/execution.js',
  // Agentic modules (Phase 9)
  'playwright/self-healing.js',
  'playwright/form-filling.js',
  'playwright/trace-recorder.js',
  'playwright/agentic-network.js',
  'playwright/context-learning.js'
];

console.log('🧪 Testing Chrome Extension Build with Playwright Features\n');

let allTestsPassed = true;

// Test 1: Check if build directory exists
if (!fs.existsSync(EXTENSION_DIR)) {
  console.error('❌ Build directory does not exist:', EXTENSION_DIR);
  console.error('   Run: npm run build:chrome');
  process.exit(1);
}

console.log('✅ Build directory exists');

// Test 2: Check for required files
console.log('\n📁 Checking required files...');
REQUIRED_FILES.forEach((file) => {
  const filePath = path.join(EXTENSION_DIR, file);
  if (fs.existsSync(filePath)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.error(`  ❌ ${file} - NOT FOUND`);
    allTestsPassed = false;
  }
});

// Test 3: Validate manifest.json
console.log('\n📋 Validating manifest.json...');
try {
  const manifestPath = path.join(EXTENSION_DIR, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  
  const requiredFields = ['manifest_version', 'name', 'version', 'permissions', 'action'];
  requiredFields.forEach((field) => {
    if (manifest[field]) {
      console.log(`  ✅ ${field}: ${typeof manifest[field] === 'object' ? 'Present' : manifest[field]}`);
    } else {
      console.error(`  ❌ Missing field: ${field}`);
      allTestsPassed = false;
    }
  });
  
  // Check for Playwright web accessible resources
  if (manifest.web_accessible_resources && 
      manifest.web_accessible_resources[0] && 
      manifest.web_accessible_resources[0].resources) {
    const resources = manifest.web_accessible_resources[0].resources;
    const playwrightResources = resources.filter(r => r.includes('playwright'));
    console.log(`  ✅ Playwright resources: ${playwrightResources.length} modules exposed`);
    playwrightResources.forEach(res => console.log(`     - ${res}`));
  } else {
    console.error('  ⚠️  No web accessible resources found');
  }
  
  // Check manifest_version
  if (manifest.manifest_version !== 3) {
    console.error('  ❌ manifest_version must be 3');
    allTestsPassed = false;
  } else {
    console.log('  ✅ Manifest v3 compliance');
  }
} catch (error) {
  console.error('  ❌ Invalid manifest.json:', error.message);
  allTestsPassed = false;
}

// Test 4: Validate Playwright modules
console.log('\n🎭 Validating Playwright modules...');
const playwrightModules = [
  { file: 'playwright/auto-wait.js', exportClass: 'PlaywrightAutoWait' },
  { file: 'playwright/network.js', exportClass: 'PlaywrightNetworkMonitor' },
  { file: 'playwright/retry.js', exportClass: 'PlaywrightRetryManager' },
  { file: 'playwright/execution.js', exportClass: 'PlaywrightExecution' },
  { file: 'playwright/self-healing.js', exportClass: 'SelfHealingSelectors' },
  { file: 'playwright/form-filling.js', exportClass: 'FormFillingAgent' },
  { file: 'playwright/trace-recorder.js', exportClass: 'TraceRecorder' },
  { file: 'playwright/agentic-network.js', exportClass: 'AgenticNetworkMonitor' },
  { file: 'playwright/context-learning.js', exportClass: 'AgenticContextLearner' }
];

playwrightModules.forEach(({ file, exportClass }) => {
  const filePath = path.join(EXTENSION_DIR, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes(`export class ${exportClass}`)) {
      console.log(`  ✅ ${file} exports ${exportClass}`);
    } else {
      console.error(`  ❌ ${file} missing export class ${exportClass}`);
      allTestsPassed = false;
    }
  }
});

// Test 5: Check file sizes
console.log('\n📊 Extension size analysis...');
let totalSize = 0;
function getDirectorySize(dir) {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      getDirectorySize(filePath);
    } else {
      totalSize += stat.size;
    }
  });
}

getDirectorySize(EXTENSION_DIR);
const sizeInKB = (totalSize / 1024).toFixed(2);
console.log(`  📦 Total size: ${sizeInKB} KB`);

if (totalSize > 10 * 1024 * 1024) { // 10MB
  console.error('  ⚠️  Extension size exceeds 10MB');
  allTestsPassed = false;
} else {
  console.log('  ✅ Size within Chrome Web Store limits');
}

// Test 6: Check for Playwright features in code
console.log('\n✨ Checking Playwright features integration...');
const backgroundPath = path.join(EXTENSION_DIR, 'background.js');
const contentPath = path.join(EXTENSION_DIR, 'content.js');

const backgroundContent = fs.readFileSync(backgroundPath, 'utf8');
const contentContent = fs.readFileSync(contentPath, 'utf8');

const features = [
  { name: 'PlaywrightExecution import', check: () => backgroundContent.includes('PlaywrightExecution') },
  { name: 'PlaywrightRetryManager import', check: () => backgroundContent.includes('PlaywrightRetryManager') },
  { name: 'PlaywrightAutoWait in content', check: () => contentContent.includes('PlaywrightAutoWait') },
  { name: 'PlaywrightNetworkMonitor in content', check: () => contentContent.includes('PlaywrightNetworkMonitor') },
  { name: 'getSelectorStrategies usage', check: () => contentContent.includes('getSelectorStrategies') },
  { name: 'SelfHealingSelectors in content', check: () => contentContent.includes('SelfHealingSelectors') },
  { name: 'FormFillingAgent in content', check: () => contentContent.includes('FormFillingAgent') },
  { name: 'TraceRecorder in content', check: () => contentContent.includes('TraceRecorder') },
  { name: 'AgenticNetworkMonitor in content', check: () => contentContent.includes('AgenticNetworkMonitor') },
  { name: 'AgenticContextLearner in content', check: () => contentContent.includes('AgenticContextLearner') }
];

features.forEach(({ name, check }) => {
  if (check()) {
    console.log(`  ✅ ${name}`);
  } else {
    console.error(`  ❌ ${name} - Not integrated`);
    allTestsPassed = false;
  }
});

// Final summary
console.log('\n' + '='.repeat(60));
if (allTestsPassed) {
  console.log('✅ All tests passed! Chrome extension is ready.');
  console.log('\n📝 Next steps:');
  console.log('   1. Open Chrome and go to chrome://extensions/');
  console.log('   2. Enable "Developer mode"');
  console.log('   3. Click "Load unpacked"');
  console.log('   4. Select: build/chrome-extension/');
  console.log('\n🎭 Playwright Features:');
  console.log('   ✨ Auto-waiting for elements');
  console.log('   ✨ Multi-strategy selectors (8 strategies)');
  console.log('   ✨ Self-healing workflows');
  console.log('   ✨ Network monitoring with recovery');
  console.log('   ✨ Automatic retries with exponential backoff');
  console.log('   ✨ Form filling with LLM integration');
  console.log('   ✨ Trace recording & analysis');
  console.log('   ✨ Agentic network error recovery');
  console.log('   ✨ Context learning (learns from experience)');
  process.exit(0);
} else {
  console.error('❌ Some tests failed. Please fix the issues above.');
  process.exit(1);
}
