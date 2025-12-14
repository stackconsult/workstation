#!/usr/bin/env node

/**
 * Generate Secure Secrets for WorkStation
 * 
 * This script generates cryptographically secure random secrets for:
 * - JWT_SECRET (64 characters, 256-bit)
 * - SESSION_SECRET (64 characters, 256-bit)
 * - ENCRYPTION_KEY (64 characters, 256-bit)
 * 
 * Usage:
 *   node scripts/generate-secrets.js           # Display secrets only
 *   node scripts/generate-secrets.js --write   # Write to .env file
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * Generate a cryptographically secure random secret
 * @param {number} bytes - Number of random bytes to generate (default: 32)
 * @returns {string} - Hex-encoded string (length = bytes * 2)
 * 
 * Example: generateSecret(32) produces 64 hex characters (32 bytes * 2 = 64 chars)
 * This provides 256-bit security (32 bytes = 256 bits)
 */
function generateSecret(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

// Read existing .env.example as template
function readEnvExample() {
  const envExamplePath = path.join(__dirname, '..', '.env.example');
  
  if (!fs.existsSync(envExamplePath)) {
    console.error('❌ Error: .env.example file not found');
    console.error('   Expected: .env.example in the repository root');
    console.error(`   Full path checked: ${envExamplePath}`);
    console.error('   This file is required as a template for generating .env');
    process.exit(1);
  }
  
  return fs.readFileSync(envExamplePath, 'utf8');
}

// Replace placeholder secrets with real ones
function generateEnvFile(template) {
  const jwtSecret = generateSecret(32);      // 64 hex chars = 256 bits
  const sessionSecret = generateSecret(32);  // 64 hex chars = 256 bits
  const encryptionKey = generateSecret(32);  // 64 hex chars = 256 bits
  
  // Replace placeholder values with generated secrets
  let envContent = template
    .replace(
      /JWT_SECRET=.*/,
      `JWT_SECRET=${jwtSecret}`
    )
    .replace(
      /SESSION_SECRET=.*/,
      `SESSION_SECRET=${sessionSecret}`
    )
    .replace(
      /ENCRYPTION_KEY=.*/,
      `ENCRYPTION_KEY=${encryptionKey}`
    );
  
  return {
    content: envContent,
    secrets: {
      JWT_SECRET: jwtSecret,
      SESSION_SECRET: sessionSecret,
      ENCRYPTION_KEY: encryptionKey
    }
  };
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  const shouldWrite = args.includes('--write');
  
  console.log('🔐 WorkStation Secret Generator\n');
  console.log('Generating cryptographically secure secrets...\n');
  
  const template = readEnvExample();
  const { content, secrets } = generateEnvFile(template);
  
  // Display generated secrets
  console.log('✅ Generated Secrets (each 64 characters, 256-bit security):');
  console.log(`   JWT_SECRET=${secrets.JWT_SECRET.substring(0, 16)}... (${secrets.JWT_SECRET.length} chars)`);
  console.log(`   SESSION_SECRET=${secrets.SESSION_SECRET.substring(0, 16)}... (${secrets.SESSION_SECRET.length} chars)`);
  console.log(`   ENCRYPTION_KEY=${secrets.ENCRYPTION_KEY.substring(0, 16)}... (${secrets.ENCRYPTION_KEY.length} chars)`);
  console.log('');
  
  if (shouldWrite) {
    const envPath = path.join(__dirname, '..', '.env');
    
    // Check if .env already exists
    if (fs.existsSync(envPath)) {
      console.log('⚠️  Warning: .env file already exists!');
      
      // Create timestamped backup to avoid overwriting previous backups
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const backupPath = path.join(__dirname, '..', `.env.backup.${timestamp}`);
      fs.copyFileSync(envPath, backupPath);
      console.log(`   ✅ Backup created: .env.backup.${timestamp}\n`);
      
      // Also create/update .env.backup (latest backup)
      const latestBackupPath = path.join(__dirname, '..', '.env.backup');
      fs.copyFileSync(envPath, latestBackupPath);
    }
    
    // Write new .env file
    fs.writeFileSync(envPath, content, 'utf8');
    console.log('✅ .env file created successfully!');
    console.log(`   Location: ${envPath}\n`);
    
    console.log('📝 Next Steps:');
    console.log('   1. Review and customize .env file (especially DATABASE_URL, PORT, etc.)');
    console.log('   2. NEVER commit .env file to version control');
    console.log('   3. Run: npm start\n');
  } else {
    console.log('ℹ️  Secrets displayed only (not written to file)');
    console.log('   To create .env file with these secrets, run:');
    console.log('   npm run generate-secrets\n');
    
    console.log('📝 Manual Setup:');
    console.log('   1. Copy .env.example to .env: cp .env.example .env');
    console.log('   2. Replace the three placeholder secrets above');
    console.log('   3. Review and customize other variables\n');
  }
  
  console.log('🔒 Security Notes:');
  console.log('   • Each secret is unique and cryptographically random');
  console.log('   • Never use the same secret for JWT_SECRET and SESSION_SECRET');
  console.log('   • Never commit secrets to version control');
  console.log('   • Rotate secrets periodically in production');
  console.log('   • Use environment variables in production deployment\n');
}

// Run the script
main();
