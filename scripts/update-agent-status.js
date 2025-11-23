#!/usr/bin/env node

/**
 * Agent Status Auto-Updater
 * 
 * Fetches agent and container health data from the API and dynamically
 * injects stats into README.md and ROADMAP_PROGRESS.md.
 * 
 * Features:
 * - Fetch data from /api/agents/system/overview
 * - Generate formatted markdown tables
 * - Safely inject into markdown files
 * - Error handling and rollback
 * - Logging for debugging
 * 
 * Usage:
 *   node scripts/update-agent-status.js [options]
 * 
 * Options:
 *   --dry-run    Show what would be updated without making changes
 *   --verbose    Show detailed logging
 *   --url <url>  Override API URL (default: http://localhost:3000)
 */

const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { injectContent, hasMarkers, addMarkers } = require('./lib/markdown-injector');

// Configuration
const CONFIG = {
  apiUrl: process.env.API_URL || 'http://localhost:3000',
  apiEndpoint: '/api/agents/system/overview',
  files: [
    {
      path: path.join(__dirname, '../README.md'),
      markers: {
        start: '<!-- AUTO-GENERATED-CONTENT:START (AGENT_STATUS) -->',
        end: '<!-- AUTO-GENERATED-CONTENT:END -->'
      }
    },
    {
      path: path.join(__dirname, '../ROADMAP_PROGRESS.md'),
      markers: {
        start: '<!-- AUTO-GENERATED-CONTENT:START (AGENT_STATUS) -->',
        end: '<!-- AUTO-GENERATED-CONTENT:END -->'
      }
    }
  ],
  timeout: 10000,
  retries: 3,
  retryDelay: 2000
};

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isVerbose = args.includes('--verbose');
const urlIndex = args.indexOf('--url');
if (urlIndex !== -1 && args[urlIndex + 1]) {
  CONFIG.apiUrl = args[urlIndex + 1];
}

// Logger
const logger = {
  info: (...args) => console.log('ℹ️ ', ...args),
  success: (...args) => console.log('✅', ...args),
  warn: (...args) => console.warn('⚠️ ', ...args),
  error: (...args) => console.error('❌', ...args),
  verbose: (...args) => isVerbose && console.log('🔍', ...args),
  debug: (...args) => isVerbose && console.log('🐛', ...args)
};

/**
 * Fetch agent status from API
 * 
 * @returns {Promise<Object>} - Agent status data
 */
async function fetchAgentStatus() {
  const url = `${CONFIG.apiUrl}${CONFIG.apiEndpoint}`;
  logger.verbose(`Fetching agent status from: ${url}`);

  let lastError = null;
  
  for (let attempt = 1; attempt <= CONFIG.retries; attempt++) {
    try {
      logger.debug(`Attempt ${attempt}/${CONFIG.retries}`);
      
      const response = await axios.get(url, {
        timeout: CONFIG.timeout,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Agent-Status-Updater/1.0'
        }
      });

      if (response.status !== 200) {
        throw new Error(`API returned status ${response.status}`);
      }

      if (!response.data) {
        throw new Error('API returned empty response');
      }

      logger.verbose(`Received data: ${JSON.stringify(response.data, null, 2).substring(0, 200)}...`);
      return response.data;

    } catch (error) {
      lastError = error;
      logger.warn(`Attempt ${attempt} failed: ${error.message}`);
      
      if (attempt < CONFIG.retries) {
        logger.verbose(`Retrying in ${CONFIG.retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, CONFIG.retryDelay));
      }
    }
  }

  throw new Error(`Failed to fetch agent status after ${CONFIG.retries} attempts: ${lastError.message}`);
}

/**
 * Generate markdown table from agent data
 * 
 * @param {Object} data - Agent status data
 * @returns {string} - Formatted markdown table
 */
function generateMarkdownTable(data) {
  const { agents = [], containers = [], summary = {} } = data;

  let markdown = '\n';
  
  // Summary section
  markdown += `### 📊 System Overview\n\n`;
  markdown += `**Last Updated**: ${new Date().toISOString()}\n\n`;
  markdown += `| Metric | Value |\n`;
  markdown += `|--------|-------|\n`;
  markdown += `| Total Agents | ${summary.totalAgents || agents.length} |\n`;
  markdown += `| Active Agents | ${summary.activeAgents || agents.filter(a => a.status === 'active').length} |\n`;
  markdown += `| Total Containers | ${summary.totalContainers || containers.length} |\n`;
  markdown += `| Healthy Containers | ${summary.healthyContainers || containers.filter(c => c.health === 'healthy').length} |\n`;
  markdown += `| System Health | ${summary.overallHealth || calculateOverallHealth(agents, containers)} |\n\n`;

  // Agents table
  if (agents.length > 0) {
    markdown += `### 🤖 Agent Status\n\n`;
    markdown += `| Agent ID | Name | Status | Version | Last Seen |\n`;
    markdown += `|----------|------|--------|---------|----------|\n`;
    
    for (const agent of agents.sort((a, b) => parseInt(a.id) - parseInt(b.id))) {
      const statusEmoji = agent.status === 'active' ? '✅' : 
                          agent.status === 'inactive' ? '⏸️' : '❌';
      const lastSeen = agent.lastSeen ? new Date(agent.lastSeen).toLocaleDateString() : 'Never';
      
      markdown += `| ${agent.id} | ${agent.name} | ${statusEmoji} ${agent.status} | ${agent.version || 'N/A'} | ${lastSeen} |\n`;
    }
    markdown += '\n';
  }

  // Containers table
  if (containers.length > 0) {
    markdown += `### 🐳 Container Status\n\n`;
    markdown += `| Container | Port | Status | Health | Uptime |\n`;
    markdown += `|-----------|------|--------|--------|---------|\n`;
    
    for (const container of containers.sort((a, b) => parseInt(a.port) - parseInt(b.port))) {
      const healthEmoji = container.health === 'healthy' ? '🟢' : 
                          container.health === 'degraded' ? '🟡' : '🔴';
      const statusEmoji = container.status === 'running' ? '▶️' : 
                          container.status === 'stopped' ? '⏹️' : '⏸️';
      
      markdown += `| ${container.name} | ${container.port} | ${statusEmoji} ${container.status} | ${healthEmoji} ${container.health} | ${container.uptime || 'N/A'} |\n`;
    }
    markdown += '\n';
  }

  return markdown;
}

/**
 * Calculate overall health score
 * 
 * @param {Array} agents - Agent data
 * @param {Array} containers - Container data
 * @returns {string} - Health status
 */
function calculateOverallHealth(agents, containers) {
  const totalAgents = agents.length;
  const activeAgents = agents.filter(a => a.status === 'active').length;
  const totalContainers = containers.length;
  const healthyContainers = containers.filter(c => c.health === 'healthy').length;

  const agentHealthScore = totalAgents > 0 ? (activeAgents / totalAgents) : 1;
  const containerHealthScore = totalContainers > 0 ? (healthyContainers / totalContainers) : 1;
  
  const overallScore = (agentHealthScore + containerHealthScore) / 2;

  if (overallScore >= 0.9) return '🟢 Excellent';
  if (overallScore >= 0.7) return '🟡 Good';
  if (overallScore >= 0.5) return '🟠 Fair';
  return '🔴 Poor';
}

/**
 * Update markdown files with agent status
 * 
 * @param {Object} data - Agent status data
 * @returns {Promise<Array>} - Results for each file
 */
async function updateMarkdownFiles(data) {
  const results = [];
  const markdownContent = generateMarkdownTable(data);

  logger.verbose('Generated markdown content:');
  logger.verbose(markdownContent);

  for (const fileConfig of CONFIG.files) {
    try {
      const { path: filePath, markers } = fileConfig;
      
      logger.info(`Processing ${path.basename(filePath)}...`);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        logger.warn(`File not found: ${filePath}`);
        results.push({
          file: filePath,
          success: false,
          error: 'File not found'
        });
        continue;
      }

      // Check if markers exist
      if (!hasMarkers(filePath, markers)) {
        logger.warn(`Markers not found in ${path.basename(filePath)}`);
        logger.info(`Attempting to add markers...`);
        
        const addResult = await addMarkers(filePath, 'Agent Status', markers);
        
        if (!addResult.success) {
          logger.error(`Failed to add markers: ${addResult.error}`);
          results.push({
            file: filePath,
            success: false,
            error: addResult.error
          });
          continue;
        }
        
        logger.success(`Markers added to ${path.basename(filePath)}`);
      }

      // Perform dry run check
      if (isDryRun) {
        logger.info(`[DRY RUN] Would update ${path.basename(filePath)}`);
        results.push({
          file: filePath,
          success: true,
          dryRun: true
        });
        continue;
      }

      // Inject content
      const result = await injectContent(filePath, markdownContent, {
        ...markers,
        createBackup: true,
        validateContent: true
      });

      if (result.success) {
        logger.success(`Updated ${path.basename(filePath)}`);
        if (result.backupPath) {
          logger.verbose(`Backup created: ${result.backupPath}`);
        }
      } else {
        logger.error(`Failed to update ${path.basename(filePath)}: ${result.error}`);
      }

      results.push({
        file: filePath,
        success: result.success,
        error: result.error,
        backupPath: result.backupPath
      });

    } catch (error) {
      logger.error(`Error processing ${fileConfig.path}: ${error.message}`);
      results.push({
        file: fileConfig.path,
        success: false,
        error: error.message
      });
    }
  }

  return results;
}

/**
 * Main execution function
 */
async function main() {
  logger.info('🚀 Agent Status Auto-Updater');
  logger.info(`API URL: ${CONFIG.apiUrl}${CONFIG.apiEndpoint}`);
  
  if (isDryRun) {
    logger.info('Running in DRY RUN mode - no files will be modified');
  }

  try {
    // Fetch agent status
    logger.info('Fetching agent status...');
    const data = await fetchAgentStatus();
    logger.success('Agent status fetched successfully');

    // Update markdown files
    logger.info('Updating markdown files...');
    const results = await updateMarkdownFiles(data);

    // Report results
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    logger.info('\n📊 Update Summary:');
    logger.info(`  ✅ Successful: ${successCount}`);
    logger.info(`  ❌ Failed: ${failCount}`);
    logger.info(`  📁 Total files: ${results.length}`);

    if (failCount > 0) {
      logger.error('\n❌ Some updates failed. Check logs above for details.');
      process.exit(1);
    }

    logger.success('\n✅ All updates completed successfully!');
    process.exit(0);

  } catch (error) {
    logger.error('\n❌ Fatal error:', error.message);
    logger.debug('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = {
  fetchAgentStatus,
  generateMarkdownTable,
  updateMarkdownFiles,
  calculateOverallHealth
};
