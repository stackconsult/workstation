#!/usr/bin/env node

/**
 * Test script for Chrome Extension build
 * Verifies that all required files exist in the build directory
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Chrome Extension build...\n');

const buildDir = path.join(process.cwd(), 'build', 'chrome-extension');

// Check if build directory exists
if (!fs.existsSync(buildDir)) {
  console.error('❌ Build directory does not exist');
  console.error(`   Expected: ${buildDir}`);
  console.error('   Run: npm run build:chrome');
  process.exit(1);
}

// Required files for Chrome Extension
const requiredFiles = [
  'manifest.json',
  'background.js',
  'popup/index.html',
  'popup/script.js',
  'content.js',
  'icons/icon16.png',
  'icons/icon48.png',
  'icons/icon128.png'
];

let allFilesExist = true;
let fileCount = 0;

console.log('Checking required files:');
requiredFiles.forEach(file => {
  const filePath = path.join(buildDir, file);
  const exists = fs.existsSync(filePath);
  
  if (exists) {
    const stats = fs.statSync(filePath);
    console.log(`✅ ${file} (${stats.size} bytes)`);
    fileCount++;
  } else {
    console.error(`❌ Missing required file: ${file}`);
    allFilesExist = false;
  }
});

console.log(`\n📊 Summary: ${fileCount}/${requiredFiles.length} files found`);

if (!allFilesExist) {
  console.error('\n❌ Chrome extension build validation failed');
  console.error('   Some required files are missing');
  process.exit(1);
}

// Validate manifest.json
console.log('\n🔍 Validating manifest.json...');
try {
  const manifestPath = path.join(buildDir, 'manifest.json');
  const manifestContent = fs.readFileSync(manifestPath, 'utf8');
  const manifest = JSON.parse(manifestContent);
  
  // Check required manifest fields
  const requiredFields = ['manifest_version', 'name', 'version', 'description'];
  const missingFields = requiredFields.filter(field => !manifest[field]);
  
  if (missingFields.length > 0) {
    console.error(`❌ Manifest missing required fields: ${missingFields.join(', ')}`);
    process.exit(1);
  }
  
  // Verify manifest version 3
  if (manifest.manifest_version !== 3) {
    console.error('❌ Manifest must use version 3');
    process.exit(1);
  }
  
  console.log('✅ Manifest is valid');
  console.log(`   - Name: ${manifest.name}`);
  console.log(`   - Version: ${manifest.version}`);
  console.log(`   - Manifest Version: ${manifest.manifest_version}`);
  
} catch (error) {
  console.error('❌ Failed to validate manifest.json:', error.message);
  process.exit(1);
}

// Check file sizes
console.log('\n📦 Build artifacts:');
const getDirectorySize = (dirPath) => {
  let totalSize = 0;
  const files = fs.readdirSync(dirPath);
  
  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory()) {
      totalSize += getDirectorySize(filePath);
    } else {
      totalSize += stats.size;
    }
  });
  
  return totalSize;
};

const totalSize = getDirectorySize(buildDir);
const sizeInKB = (totalSize / 1024).toFixed(2);
console.log(`   Total size: ${sizeInKB} KB`);

if (totalSize === 0) {
  console.error('❌ Build directory is empty');
  process.exit(1);
}

console.log('\n✅ Chrome extension build is valid and ready to load!');
console.log('\n📝 Next steps:');
console.log('   1. Open Chrome and navigate to chrome://extensions/');
console.log('   2. Enable "Developer mode" (toggle in top right)');
console.log('   3. Click "Load unpacked"');
console.log(`   4. Select the directory: ${buildDir}`);
console.log('   5. Start the Workstation backend: npm run dev');
console.log('   6. Click the extension icon to open the popup');

process.exit(0);
