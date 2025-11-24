#!/usr/bin/env node

/**
 * Build Downloads Script
 * 
 * Creates distributable zip files for:
 * 1. Chrome Extension
 * 2. Workflow Builder
 * 
 * Output: public/downloads/*.zip
 */

const fs = require('fs');
const path = require('path');
const { execSync, execFileSync } = require('child_process');

const DOWNLOADS_DIR = path.join(__dirname, '..', 'public', 'downloads');
const CHROME_EXT_SRC = path.join(__dirname, '..', 'chrome-extension');
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const TEMP_DIR = path.join(__dirname, '..', '.build-temp');

/**
 * Execute command and log output
 */
function exec(command, options = {}) {
  console.log(`▶ ${command}`);
  try {
    execSync(command, { 
      stdio: 'inherit',
      ...options 
    });
  } catch (error) {
    console.error(`❌ Command failed: ${command}`);
    throw error;
  }
}

/**
 * Ensure directory exists
 */
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
}

/**
 * Clean directory
 */
function cleanDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
    console.log(`🧹 Cleaned directory: ${dir}`);
  }
}

/**
 * Build Chrome Extension zip
 */
function buildChromeExtension() {
  console.log('\n📦 Building Chrome Extension...');
  
  const outputZip = path.join(DOWNLOADS_DIR, 'chrome-extension.zip');
  
  // Check if zip command is available
  try {
    execSync('which zip', { stdio: 'ignore' });
  } catch (error) {
    console.warn('⚠️  zip command not found, trying alternative method...');
    // Fallback: copy files to build directory
    const buildDir = path.join(__dirname, '..', 'build', 'chrome-extension');
    ensureDir(buildDir);
    exec(`cp -r ${CHROME_EXT_SRC}/* ${buildDir}/`);
    console.log(`✅ Chrome extension copied to: ${buildDir}`);
    console.log('⚠️  Please install zip utility to create chrome-extension.zip');
    return;
  }
  
  // Create zip file
  const cwd = path.dirname(CHROME_EXT_SRC);
  const dirName = path.basename(CHROME_EXT_SRC);
  
  // Remove old zip if exists
  if (fs.existsSync(outputZip)) {
    fs.unlinkSync(outputZip);
  }
  
  // Use execFileSync to avoid shell interpolation issues
  const zipArgs = [
    '-r',
    outputZip,
    dirName,
    '-x',
    '*.git*',
    '*node_modules*',
    '*.DS_Store'
  ];
  console.log(`▶ zip ${zipArgs.join(' ')}`);
  execFileSync('zip', zipArgs, { cwd: cwd, stdio: 'inherit' });
  
  const stats = fs.statSync(outputZip);
  console.log(`✅ Chrome extension built: ${outputZip} (${(stats.size / 1024).toFixed(2)} KB)`);
}

/**
 * Build Workflow Builder zip
 */
function buildWorkflowBuilder() {
  console.log('\n📦 Building Workflow Builder...');
  
  const outputZip = path.join(DOWNLOADS_DIR, 'workflow-builder.zip');
  const tempWorkflowDir = path.join(TEMP_DIR, 'workflow-builder');
  
  // Create temp directory
  cleanDir(tempWorkflowDir);
  ensureDir(tempWorkflowDir);
  
  // Copy workflow builder files
  const workflowHtml = path.join(PUBLIC_DIR, 'workflow-builder.html');
  const cssDir = path.join(PUBLIC_DIR, 'css');
  const jsDir = path.join(PUBLIC_DIR, 'js');
  
  // Copy HTML
  exec(`cp ${workflowHtml} ${tempWorkflowDir}/`);
  
  // Copy CSS if exists
  if (fs.existsSync(cssDir)) {
    exec(`cp -r ${cssDir} ${tempWorkflowDir}/`);
  }
  
  // Copy JS if exists
  if (fs.existsSync(jsDir)) {
    exec(`cp -r ${jsDir} ${tempWorkflowDir}/`);
  }
  
  // Create README
  const readmeContent = `# Workflow Builder

Standalone workflow builder for Workstation AI Agent.

## Installation

1. Extract this zip file
2. Open workflow-builder.html in your browser
3. Start building automation workflows!

## Features

- Visual workflow designer
- Drag-and-drop interface
- Export workflows as JSON
- Import existing workflows
- Real-time validation

## Requirements

- Modern web browser (Chrome, Firefox, Edge, Safari)
- No server installation needed
- Works offline

## Support

For issues and documentation, visit:
https://github.com/creditXcredit/workstation
`;
  
  fs.writeFileSync(path.join(tempWorkflowDir, 'README.md'), readmeContent);
  
  // Check if zip is available
  try {
    execSync('which zip', { stdio: 'ignore' });
  } catch (error) {
    console.log(`✅ Workflow builder files prepared in: ${tempWorkflowDir}`);
    console.log('⚠️  Please install zip utility to create workflow-builder.zip');
    return;
  }
  
  // Remove old zip if exists
  if (fs.existsSync(outputZip)) {
    fs.unlinkSync(outputZip);
  }
  
  // Create zip
  const cwd = path.dirname(tempWorkflowDir);
  const dirName = path.basename(tempWorkflowDir);
  exec(`cd ${cwd} && zip -r ${outputZip} ${dirName}`);
  
  const stats = fs.statSync(outputZip);
  console.log(`✅ Workflow builder built: ${outputZip} (${(stats.size / 1024).toFixed(2)} KB)`);
  
  // Cleanup temp
  cleanDir(tempWorkflowDir);
}

/**
 * Main build process
 */
function main() {
  console.log('🚀 Starting download builds...\n');
  
  // Ensure downloads directory exists
  ensureDir(DOWNLOADS_DIR);
  
  try {
    // Build Chrome Extension
    buildChromeExtension();
    
    // Build Workflow Builder
    buildWorkflowBuilder();
    
    // Generate manifest
    console.log('\n📋 Generating manifest...');
    exec('node scripts/generate-manifest.js');
    
    console.log('\n✅ All downloads built successfully!');
    console.log(`📂 Output directory: ${DOWNLOADS_DIR}`);
    console.log('\n📦 Available downloads:');
    
    const files = fs.readdirSync(DOWNLOADS_DIR);
    files.forEach(file => {
      if (file.endsWith('.zip')) {
        const filePath = path.join(DOWNLOADS_DIR, file);
        const stats = fs.statSync(filePath);
        console.log(`   - ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
      }
    });
    
    console.log('\n✅ Build complete! Downloads are ready for serving.');
    
  } catch (error) {
    console.error('\n❌ Build failed:', error.message);
    process.exit(1);
  } finally {
    // Cleanup temp directory
    cleanDir(TEMP_DIR);
  }
}

// Execute
main();
