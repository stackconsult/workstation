#!/usr/bin/env node

/**
 * Generate manifest.json for downloads directory
 * 
 * This script:
 * 1. Reads package.json for version info
 * 2. Scans public/downloads/ for zip files
 * 3. Generates checksums for each file
 * 4. Creates manifest.json with metadata
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DOWNLOADS_DIR = path.join(__dirname, '..', 'public', 'downloads');
const MANIFEST_PATH = path.join(DOWNLOADS_DIR, 'manifest.json');
const PACKAGE_JSON_PATH = path.join(__dirname, '..', 'package.json');

/**
 * Calculate SHA256 checksum for a file
 */
function calculateChecksum(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

/**
 * Get file size in bytes
 */
function getFileSize(filePath) {
  const stats = fs.statSync(filePath);
  return stats.size;
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Generate manifest for downloads
 */
function generateManifest() {
  console.log('🔍 Generating downloads manifest...');
  
  // Read package.json
  const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf8'));
  const version = packageJson.version;
  
  // Find all zip files
  const files = fs.readdirSync(DOWNLOADS_DIR);
  const zipFiles = files.filter(file => file.endsWith('.zip'));
  
  console.log(`📦 Found ${zipFiles.length} zip file(s)`);
  
  // Generate download entries
  const downloads = zipFiles.map(filename => {
    const filePath = path.join(DOWNLOADS_DIR, filename);
    const size = getFileSize(filePath);
    const checksum = calculateChecksum(filePath);
    
    // Determine description based on filename
    let description = '';
    if (filename === 'chrome-extension.zip') {
      description = 'Workstation AI Agent Chrome Extension - Browser automation with natural language';
    } else if (filename === 'workflow-builder.zip') {
      description = 'Workflow Builder - Visual automation workflow designer';
    } else {
      description = `Build artifact: ${filename}`;
    }
    
    console.log(`  ✅ ${filename}: ${formatBytes(size)} (${checksum.substring(0, 16)}...)`);
    
    return {
      name: filename,
      description,
      size,
      sizeFormatted: formatBytes(size),
      checksum,
      url: `/downloads/${filename}`,
      version
    };
  });
  
  // Create manifest object
  const manifest = {
    generated: new Date().toISOString(),
    version,
    repository: packageJson.repository?.url || 'https://github.com/creditXcredit/workstation',
    downloads
  };
  
  // Write manifest.json
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log(`✅ Manifest generated: ${MANIFEST_PATH}`);
  console.log(`📋 Total downloads: ${downloads.length}`);
  
  return manifest;
}

// Main execution
try {
  const manifest = generateManifest();
  
  // Display summary
  console.log('\n📊 Manifest Summary:');
  console.log(`   Version: ${manifest.version}`);
  console.log(`   Generated: ${manifest.generated}`);
  console.log(`   Downloads: ${manifest.downloads.length}`);
  
  process.exit(0);
} catch (error) {
  console.error('❌ Error generating manifest:', error.message);
  console.error(error.stack);
  process.exit(1);
}
