#!/usr/bin/env node

/**
 * Markdown Injector Library
 * Safely injects content between markers in markdown files
 */

const fs = require('fs');

/**
 * Inject content between markers in a markdown file
 * @param {string} filePath - Path to the markdown file
 * @param {string} content - Content to inject
 * @param {string} startMarker - Start marker (e.g., <!-- AGENT_STATUS_START -->)
 * @param {string} endMarker - End marker (e.g., <!-- AGENT_STATUS_END -->)
 * @param {boolean} createBackup - Whether to create a backup before modification
 * @returns {Object} Result object with success status and message
 */
function injectContent(filePath, content, startMarker, endMarker, createBackup = true) {
  try {
    // Validate inputs
    if (!filePath || !content || !startMarker || !endMarker) {
      throw new Error('Missing required parameters');
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Read the file
    const originalContent = fs.readFileSync(filePath, 'utf-8');

    // Create backup if requested
    if (createBackup) {
      const timestamp = Date.now();
      const backupPath = `${filePath}.backup-${timestamp}`;
      fs.writeFileSync(backupPath, originalContent, 'utf-8');
      console.log(`✓ Backup created: ${backupPath}`);
    }

    // Find marker positions
    const startIndex = originalContent.indexOf(startMarker);
    const endIndex = originalContent.indexOf(endMarker);

    if (startIndex === -1) {
      throw new Error(`Start marker not found: ${startMarker}`);
    }

    if (endIndex === -1) {
      throw new Error(`End marker not found: ${endMarker}`);
    }

    if (startIndex >= endIndex) {
      throw new Error('Start marker must come before end marker');
    }

    // Build new content
    const before = originalContent.substring(0, startIndex + startMarker.length);
    const after = originalContent.substring(endIndex);
    const newContent = `${before}\n${content}\n${after}`;

    // Validate the new content has both markers
    if (!newContent.includes(startMarker) || !newContent.includes(endMarker)) {
      throw new Error('Validation failed: markers not preserved');
    }

    // Write the new content
    fs.writeFileSync(filePath, newContent, 'utf-8');

    return {
      success: true,
      message: `Successfully injected content into ${filePath}`,
      backupCreated: createBackup
    };

  } catch (error) {
    return {
      success: false,
      message: `Error injecting content: ${error.message}`,
      error: error
    };
  }
}

/**
 * Rollback to backup file
 * @param {string} filePath - Path to the file to rollback
 * @param {number} timestamp - Optional timestamp of the backup to restore
 * @returns {Object} Result object
 */
function rollback(filePath, timestamp) {
  try {
    let backupPath;
    
    if (timestamp) {
      backupPath = `${filePath}.backup-${timestamp}`;
    } else {
      // Find the most recent backup
      const dir = require('path').dirname(filePath);
      const basename = require('path').basename(filePath);
      const files = fs.readdirSync(dir);
      const backups = files
        .filter(f => f.startsWith(basename + '.backup-'))
        .sort()
        .reverse();
      
      if (backups.length === 0) {
        throw new Error('No backup files found');
      }
      
      backupPath = require('path').join(dir, backups[0]);
    }

    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup file not found: ${backupPath}`);
    }

    const backupContent = fs.readFileSync(backupPath, 'utf-8');
    fs.writeFileSync(filePath, backupContent, 'utf-8');
    
    // Remove backup after successful rollback
    fs.unlinkSync(backupPath);

    return {
      success: true,
      message: `Successfully rolled back ${filePath}`
    };

  } catch (error) {
    return {
      success: false,
      message: `Error during rollback: ${error.message}`,
      error: error
    };
  }
}

/**
 * Validate that a file has required markers
 * @param {string} filePath - Path to the file
 * @param {string} startMarker - Start marker
 * @param {string} endMarker - End marker
 * @returns {Object} Validation result
 */
function validateMarkers(filePath, startMarker, endMarker) {
  try {
    if (!fs.existsSync(filePath)) {
      return {
        valid: false,
        message: `File not found: ${filePath}`
      };
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const hasStart = content.includes(startMarker);
    const hasEnd = content.includes(endMarker);

    if (!hasStart && !hasEnd) {
      return {
        valid: false,
        message: `Both markers missing in ${filePath}`
      };
    }

    if (!hasStart) {
      return {
        valid: false,
        message: `Start marker missing: ${startMarker}`
      };
    }

    if (!hasEnd) {
      return {
        valid: false,
        message: `End marker missing: ${endMarker}`
      };
    }

    // Check order
    const startIndex = content.indexOf(startMarker);
    const endIndex = content.indexOf(endMarker);

    if (startIndex >= endIndex) {
      return {
        valid: false,
        message: 'Start marker must come before end marker'
      };
    }

    return {
      valid: true,
      message: 'Markers are valid'
    };

  } catch (error) {
    return {
      valid: false,
      message: `Error validating markers: ${error.message}`,
      error: error
    };
  }
}

module.exports = {
  injectContent,
  rollback,
  validateMarkers
};
