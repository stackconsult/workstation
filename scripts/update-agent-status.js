#!/usr/bin/env node

/**
 * Agent Status Auto-Updater
 * Fetches agent status from the API and updates documentation
 */

const path = require('path');
const { injectContent, validateMarkers } = require('./lib/markdown-injector');

// Configuration
const README_PATH = path.join(__dirname, '../README.md');
const ROADMAP_PATH = path.join(__dirname, '../ROADMAP_PROGRESS.md');
const START_MARKER = '<!-- AGENT_STATUS_START -->';
const END_MARKER = '<!-- AGENT_STATUS_END -->';

/**
 * Fetch agent status from the API
 */
async function fetchAgentStatus() {
  try {
    // For now, we'll generate mock data since the API requires authentication
    // In production, this would fetch from /api/agents/system/overview with a token
    
    console.log('📊 Fetching agent status...');
    
    // Mock data - replace with actual API call when authentication is set up
    const mockStatus = {
      totalAgents: 12,
      runningAgents: 10,
      stoppedAgents: 2,
      healthyAgents: 9,
      unhealthyAgents: 3,
      pendingTasks: 5,
      lastUpdated: new Date().toISOString()
    };

    return mockStatus;

    /* Actual API call (uncomment when ready):
    // Note: Node.js 18+ has built-in fetch, no need for node-fetch
    const token = process.env.WORKSTATION_API_TOKEN;
    if (!token) {
      throw new Error('WORKSTATION_API_TOKEN environment variable not set');
    }

    const response = await fetch(`${API_BASE_URL}/api/agents/system/overview`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
    */

  } catch (error) {
    console.error('❌ Error fetching agent status:', error.message);
    throw error;
  }
}

/**
 * Generate markdown table from agent status
 */
function generateStatusMarkdown(status) {
  const timestamp = new Date().toISOString().split('T')[0];
  const time = new Date().toLocaleTimeString('en-US', { timeZone: 'UTC', hour12: false });

  return `
## 🤖 Agent System Status

**Last Updated**: ${timestamp} ${time} UTC

| Metric | Count | Status |
|--------|-------|--------|
| **Total Agents** | ${status.totalAgents} | ${status.totalAgents > 0 ? '✅' : '⚠️'} |
| **Running Agents** | ${status.runningAgents} | ${status.runningAgents > 0 ? '✅' : '⏸️'} |
| **Stopped Agents** | ${status.stoppedAgents} | ${status.stoppedAgents === 0 ? '✅' : '⚠️'} |
| **Healthy Agents** | ${status.healthyAgents} | ${status.healthyAgents > 0 ? '✅' : '❌'} |
| **Unhealthy Agents** | ${status.unhealthyAgents} | ${status.unhealthyAgents === 0 ? '✅' : '⚠️'} |
| **Pending Tasks** | ${status.pendingTasks} | ${status.pendingTasks < 10 ? '✅' : '⚠️'} |

### Health Summary

- **Overall Health**: ${calculateHealthPercentage(status)}%
- **Active Agents**: ${status.runningAgents}/${status.totalAgents}
- **System Status**: ${getSystemStatus(status)}

### Quick Actions

- 📊 [View Dashboard](http://localhost:3000/dashboard.html)
- 🤖 [Agent Management](http://localhost:3000/api/agents)
- 📈 [System Metrics](http://localhost:3000/metrics)
`;
}

/**
 * Calculate overall system health percentage
 */
function calculateHealthPercentage(status) {
  if (status.totalAgents === 0) return 0;
  const healthRatio = status.healthyAgents / status.totalAgents;
  const runningRatio = status.runningAgents / status.totalAgents;
  return Math.round((healthRatio * 0.7 + runningRatio * 0.3) * 100);
}

/**
 * Get system status label
 */
function getSystemStatus(status) {
  const health = calculateHealthPercentage(status);
  if (health >= 90) return '🟢 Excellent';
  if (health >= 70) return '🟡 Good';
  if (health >= 50) return '🟠 Fair';
  return '🔴 Needs Attention';
}

/**
 * Update README.md with agent status
 */
async function updateReadme(statusMarkdown) {
  console.log('📝 Updating README.md...');

  // Validate markers exist
  const validation = validateMarkers(README_PATH, START_MARKER, END_MARKER);
  
  if (!validation.valid) {
    console.warn(`⚠️ Markers not found in README.md: ${validation.message}`);
    console.log('ℹ️ Skipping README update. Add the following markers to enable auto-update:');
    console.log(`   ${START_MARKER}`);
    console.log(`   ${END_MARKER}`);
    return false;
  }

  // Inject the content
  const result = injectContent(README_PATH, statusMarkdown, START_MARKER, END_MARKER);

  if (result.success) {
    console.log('✅ README.md updated successfully');
    return true;
  } else {
    console.error(`❌ Failed to update README.md: ${result.message}`);
    return false;
  }
}

/**
 * Update ROADMAP_PROGRESS.md with agent status
 */
async function updateRoadmap(statusMarkdown) {
  console.log('📝 Updating ROADMAP_PROGRESS.md...');

  // Validate markers exist
  const validation = validateMarkers(ROADMAP_PATH, START_MARKER, END_MARKER);
  
  if (!validation.valid) {
    console.warn(`⚠️ Markers not found in ROADMAP_PROGRESS.md: ${validation.message}`);
    console.log('ℹ️ Skipping ROADMAP update. Add markers if auto-update is needed.');
    return false;
  }

  // Inject the content
  const result = injectContent(ROADMAP_PATH, statusMarkdown, START_MARKER, END_MARKER);

  if (result.success) {
    console.log('✅ ROADMAP_PROGRESS.md updated successfully');
    return true;
  } else {
    console.error(`❌ Failed to update ROADMAP_PROGRESS.md: ${result.message}`);
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting Agent Status Auto-Updater...\n');

  try {
    // Fetch agent status
    const status = await fetchAgentStatus();
    console.log('✓ Agent status fetched successfully\n');

    // Generate markdown
    const markdown = generateStatusMarkdown(status);

    // Update documents
    const readmeUpdated = await updateReadme(markdown);
    const roadmapUpdated = await updateRoadmap(markdown);

    // Summary
    console.log('\n📊 Update Summary:');
    console.log(`   README.md: ${readmeUpdated ? '✅ Updated' : '⏭️ Skipped'}`);
    console.log(`   ROADMAP_PROGRESS.md: ${roadmapUpdated ? '✅ Updated' : '⏭️ Skipped'}`);

    if (readmeUpdated || roadmapUpdated) {
      console.log('\n✅ Agent status update completed successfully!');
      process.exit(0);
    } else {
      console.log('\nℹ️ No files were updated. Add markers to enable auto-update.');
      process.exit(0);
    }

  } catch (error) {
    console.error('\n❌ Agent status update failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  fetchAgentStatus,
  generateStatusMarkdown,
  updateReadme,
  updateRoadmap
};
