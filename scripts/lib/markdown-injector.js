/**
 * Markdown Injector Utility
 * 
 * Safely injects content into markdown files between designated markers.
 * Provides rollback functionality on errors.
 * 
 * Features:
 * - Find and replace content between markers
 * - Backup original file before changes
 * - Rollback on errors
 * - Validation of injected content
 */

const fs = require('fs');
const path = require('path');

/**
 * Default markers for auto-generated content
 */
const DEFAULT_MARKERS = {
  start: '<!-- AUTO-GENERATED-CONTENT:START (AGENT_STATUS) -->',
  end: '<!-- AUTO-GENERATED-CONTENT:END -->'
};

/**
 * Inject content into markdown file between markers
 * 
 * @param {string} filePath - Path to markdown file
 * @param {string} content - Content to inject
 * @param {Object} options - Configuration options
 * @param {string} options.startMarker - Start marker (optional)
 * @param {string} options.endMarker - End marker (optional)
 * @param {boolean} options.createBackup - Whether to create backup (default: true)
 * @param {boolean} options.validateContent - Whether to validate content (default: true)
 * @returns {Promise<Object>} - Result object with success status and details
 */
async function injectContent(filePath, content, options = {}) {
  const {
    startMarker = DEFAULT_MARKERS.start,
    endMarker = DEFAULT_MARKERS.end,
    createBackup = true,
    validateContent = true
  } = options;

  const result = {
    success: false,
    filePath,
    backupPath: null,
    message: '',
    error: null
  };

  try {
    // Validate inputs
    if (!filePath || typeof filePath !== 'string') {
      throw new Error('Invalid file path provided');
    }

    if (!content || typeof content !== 'string') {
      throw new Error('Invalid content provided');
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Read original file
    const originalContent = fs.readFileSync(filePath, 'utf8');

    // Validate content if requested
    if (validateContent) {
      validateMarkdownContent(content);
    }

    // Create backup if requested
    if (createBackup) {
      result.backupPath = await createFileBackup(filePath);
    }

    // Find marker positions
    const startIndex = originalContent.indexOf(startMarker);
    const endIndex = originalContent.indexOf(endMarker);

    if (startIndex === -1 || endIndex === -1) {
      throw new Error(`Markers not found in file: ${filePath}\nLooking for:\n  Start: ${startMarker}\n  End: ${endMarker}`);
    }

    if (startIndex >= endIndex) {
      throw new Error('Invalid marker order: start marker must come before end marker');
    }

    // Build new content
    const beforeMarkers = originalContent.substring(0, startIndex + startMarker.length);
    const afterMarkers = originalContent.substring(endIndex);
    const newContent = `${beforeMarkers}\n${content}\n${afterMarkers}`;

    // Write new content
    fs.writeFileSync(filePath, newContent, 'utf8');

    result.success = true;
    result.message = `Successfully injected content into ${path.basename(filePath)}`;
    
    return result;

  } catch (error) {
    result.error = error.message;
    result.message = `Failed to inject content: ${error.message}`;

    // Rollback if backup exists
    if (result.backupPath && fs.existsSync(result.backupPath)) {
      try {
        await rollback(filePath, result.backupPath);
        result.message += ' (Changes rolled back)';
      } catch (rollbackError) {
        result.message += ` (Rollback failed: ${rollbackError.message})`;
      }
    }

    return result;
  }
}

/**
 * Create backup of a file
 * 
 * @param {string} filePath - Path to file to backup
 * @returns {Promise<string>} - Path to backup file
 */
async function createFileBackup(filePath) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(path.dirname(filePath), '.backups');
  const backupName = `${path.basename(filePath)}.${timestamp}.backup`;
  const backupPath = path.join(backupDir, backupName);

  // Create backup directory if it doesn't exist
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // Copy file to backup
  fs.copyFileSync(filePath, backupPath);

  return backupPath;
}

/**
 * Rollback file to backup version
 * 
 * @param {string} filePath - Path to file to rollback
 * @param {string} backupPath - Path to backup file
 * @returns {Promise<void>}
 */
async function rollback(filePath, backupPath) {
  if (!fs.existsSync(backupPath)) {
    throw new Error(`Backup file not found: ${backupPath}`);
  }

  fs.copyFileSync(backupPath, filePath);
}

/**
 * Validate markdown content
 * 
 * @param {string} content - Content to validate
 * @throws {Error} - If content is invalid
 */
function validateMarkdownContent(content) {
  // Check for null or undefined
  if (content == null) {
    throw new Error('Content is null or undefined');
  }

  // Check for empty content
  if (content.trim().length === 0) {
    throw new Error('Content is empty');
  }

  // Warn about potentially dangerous content
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(content)) {
      console.warn('Warning: Content may contain potentially dangerous patterns');
      break;
    }
  }

  return true;
}

/**
 * Check if markers exist in file
 * 
 * @param {string} filePath - Path to markdown file
 * @param {Object} options - Configuration options
 * @returns {boolean} - True if markers exist
 */
function hasMarkers(filePath, options = {}) {
  const {
    startMarker = DEFAULT_MARKERS.start,
    endMarker = DEFAULT_MARKERS.end
  } = options;

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.includes(startMarker) && content.includes(endMarker);
  } catch (error) {
    return false;
  }
}

/**
 * Add markers to file if they don't exist
 * 
 * @param {string} filePath - Path to markdown file
 * @param {string} section - Section name to add markers to
 * @param {Object} options - Configuration options
 * @returns {Promise<Object>} - Result object
 */
async function addMarkers(filePath, section, options = {}) {
  const {
    startMarker = DEFAULT_MARKERS.start,
    endMarker = DEFAULT_MARKERS.end
  } = options;

  const result = {
    success: false,
    message: '',
    error: null
  };

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if markers already exist
    if (content.includes(startMarker)) {
      result.message = 'Markers already exist';
      result.success = true;
      return result;
    }

    // Find section header
    const sectionRegex = new RegExp(`^#{1,6}\\s+${section}`, 'im');
    const match = content.match(sectionRegex);

    if (!match) {
      throw new Error(`Section "${section}" not found in ${filePath}`);
    }

    const sectionStart = content.indexOf(match[0]);
    const nextSectionRegex = /^#{1,6}\s+/gm;
    nextSectionRegex.lastIndex = sectionStart + match[0].length;
    const nextMatch = nextSectionRegex.exec(content);
    
    const insertPosition = nextMatch ? nextMatch.index : content.length;
    
    // Insert markers
    const beforeSection = content.substring(0, insertPosition);
    const afterSection = content.substring(insertPosition);
    const newContent = `${beforeSection}\n\n${startMarker}\n<!-- Content will be auto-generated here -->\n${endMarker}\n\n${afterSection}`;

    fs.writeFileSync(filePath, newContent, 'utf8');

    result.success = true;
    result.message = `Markers added to ${path.basename(filePath)}`;
    
    return result;

  } catch (error) {
    result.error = error.message;
    result.message = `Failed to add markers: ${error.message}`;
    return result;
  }
}

/**
 * List all backups for a file
 * 
 * @param {string} filePath - Path to file
 * @returns {Array<Object>} - Array of backup info objects
 */
function listBackups(filePath) {
  const backupDir = path.join(path.dirname(filePath), '.backups');
  const fileName = path.basename(filePath);

  if (!fs.existsSync(backupDir)) {
    return [];
  }

  const files = fs.readdirSync(backupDir);
  const backups = files
    .filter(file => file.startsWith(fileName))
    .map(file => {
      const backupPath = path.join(backupDir, file);
      const stats = fs.statSync(backupPath);
      return {
        path: backupPath,
        name: file,
        created: stats.mtime,
        size: stats.size
      };
    })
    .sort((a, b) => b.created - a.created);

  return backups;
}

/**
 * Clean up old backups, keeping only the most recent N
 * 
 * @param {string} filePath - Path to file
 * @param {number} keepCount - Number of backups to keep (default: 10)
 * @returns {number} - Number of backups deleted
 */
function cleanupBackups(filePath, keepCount = 10) {
  const backups = listBackups(filePath);
  
  if (backups.length <= keepCount) {
    return 0;
  }

  const toDelete = backups.slice(keepCount);
  let deleted = 0;

  for (const backup of toDelete) {
    try {
      fs.unlinkSync(backup.path);
      deleted++;
    } catch (error) {
      console.error(`Failed to delete backup ${backup.name}:`, error.message);
    }
  }

  return deleted;
}

module.exports = {
  injectContent,
  createFileBackup,
  rollback,
  validateMarkdownContent,
  hasMarkers,
  addMarkers,
  listBackups,
  cleanupBackups,
  DEFAULT_MARKERS
};
