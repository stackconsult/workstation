/**
 * Dynamic Agent Registry for Chrome Extension
 * Automatically discovers and manages all agents from /agents/ directory
 * Provides routing, status monitoring, and health checks
 */

class AgentRegistry {
  constructor() {
    this.agents = new Map();
    this.agentMetadata = new Map();
    this.healthStatus = new Map();
    this.communicationHandlers = new Map();
    this.initialized = false;
  }

  /**
   * Initialize agent registry by discovering all agents
   */
  async initialize(backendUrl) {
    if (this.initialized) {
      return { success: true, cached: true };
    }

    try {
      console.log('[AgentRegistry] Initializing agent discovery...');
      
      // Fetch agent list from backend
      const response = await fetch(`${backendUrl}/api/agents/discover`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        // Fallback to hardcoded agents if discovery fails
        this.initializeFallbackAgents();
        console.warn('[AgentRegistry] Using fallback agent list');
        this.initialized = true;
        return { success: true, mode: 'fallback', count: this.agents.size };
      }

      const data = await response.json();
      const agentList = data.agents || [];

      // Register each agent
      for (const agent of agentList) {
        this.registerAgent(agent);
      }

      this.initialized = true;
      console.log(`[AgentRegistry] Initialized with ${this.agents.size} agents`);
      
      return { 
        success: true, 
        mode: 'discovered',
        count: this.agents.size,
        agents: Array.from(this.agents.keys())
      };
    } catch (error) {
      console.error('[AgentRegistry] Initialization failed:', error);
      this.initializeFallbackAgents();
      this.initialized = true;
      return { 
        success: true, 
        mode: 'fallback', 
        count: this.agents.size,
        error: error.message 
      };
    }
  }

  /**
   * Register a single agent
   */
  registerAgent(agentConfig) {
    const agentId = agentConfig.id || agentConfig.name;
    
    this.agents.set(agentId, {
      id: agentId,
      name: agentConfig.name,
      type: agentConfig.type || 'generic',
      capabilities: agentConfig.capabilities || [],
      endpoints: agentConfig.endpoints || {},
      status: 'inactive',
      lastHealthCheck: null,
      registeredAt: Date.now()
    });

    this.agentMetadata.set(agentId, {
      description: agentConfig.description || '',
      version: agentConfig.version || '1.0.0',
      author: agentConfig.author || 'Workstation',
      tags: agentConfig.tags || [],
      priority: agentConfig.priority || 'normal'
    });

    this.healthStatus.set(agentId, {
      healthy: true,
      lastCheck: Date.now(),
      failureCount: 0,
      successCount: 0,
      avgResponseTime: 0
    });

    console.log(`[AgentRegistry] Registered agent: ${agentId}`);
  }

  /**
   * Initialize fallback agents when discovery fails
   */
  initializeFallbackAgents() {
    const fallbackAgents = [
      // Build Setup Agents (1-6)
      { id: 'agent1', name: 'TypeScript API Architect', type: 'build-setup', capabilities: ['typescript', 'api', 'jwt'] },
      { id: 'agent2', name: 'Go Backend & Browser Automation', type: 'build-setup', capabilities: ['go', 'browser', 'automation'] },
      { id: 'agent3', name: 'Navigation Helper', type: 'build-setup', capabilities: ['navigation', 'routing'] },
      { id: 'agent4', name: 'Branding & Visualization Agent', type: 'build-setup', capabilities: ['branding', 'design'] },
      { id: 'agent5', name: 'DevOps & Deployment Specialist', type: 'build-setup', capabilities: ['devops', 'deployment', 'ci-cd'] },
      { id: 'agent6', name: 'Documentation & Training', type: 'build-setup', capabilities: ['documentation', 'training'] },
      
      // Weekly Cycle Agents (7-12)
      { id: 'agent7', name: 'Memory Refresh Agent', type: 'weekly-cycle', capabilities: ['memory', 'state'] },
      { id: 'agent8', name: 'GitHub Metrics Collector', type: 'weekly-cycle', capabilities: ['github', 'metrics'] },
      { id: 'agent9', name: 'Dependency & Security Auditor', type: 'weekly-cycle', capabilities: ['security', 'dependencies'] },
      { id: 'agent10', name: 'Guard Rails Agent', type: 'weekly-cycle', capabilities: ['validation', 'guard-rails'] },
      { id: 'agent11', name: 'Progress Tracker', type: 'weekly-cycle', capabilities: ['progress', 'tracking'] },
      { id: 'agent12', name: 'Communication & Reporting', type: 'weekly-cycle', capabilities: ['reporting', 'communication'] },
      
      // Extended Agents (13-21)
      { id: 'agent13', name: 'Testing & QA Agent', type: 'extended', capabilities: ['testing', 'qa'] },
      { id: 'agent14', name: 'Performance Optimizer', type: 'extended', capabilities: ['performance', 'optimization'] },
      { id: 'agent15', name: 'Code Review Agent', type: 'extended', capabilities: ['code-review', 'quality'] },
      { id: 'agent16', name: 'Integration Specialist', type: 'extended', capabilities: ['integration', 'api'] },
      { id: 'agent17', name: 'Data Pipeline Agent', type: 'extended', capabilities: ['data', 'pipeline'] },
      { id: 'agent18', name: 'Monitoring & Alerts', type: 'extended', capabilities: ['monitoring', 'alerts'] },
      { id: 'agent19', name: 'Backup & Recovery', type: 'extended', capabilities: ['backup', 'recovery'] },
      { id: 'agent20', name: 'Compliance Agent', type: 'extended', capabilities: ['compliance', 'audit'] },
      { id: 'agent21', name: 'Innovation Agent', type: 'extended', capabilities: ['innovation', 'research'] },
      
      // Special Agents
      { id: 'mainpage', name: 'Mainpage Navigation Agent', type: 'special', capabilities: ['navigation', 'browser'] },
      { id: 'codepage', name: 'Code Editor Agent', type: 'special', capabilities: ['code', 'editing'] },
      { id: 'repo-agent', name: 'Repository Manager', type: 'special', capabilities: ['git', 'repository'] },
      { id: 'curriculum', name: 'Curriculum Learning Agent', type: 'special', capabilities: ['learning', 'education'] },
      { id: 'designer', name: 'Design Agent', type: 'special', capabilities: ['design', 'ui'] },
      { id: 'edugit-codeagent', name: 'EduGit Code Agent', type: 'special', capabilities: ['education', 'git', 'code'] },
      { id: 'repo-update-agent', name: 'Repository Update Agent', type: 'special', capabilities: ['updates', 'maintenance'] },
      { id: 'wiki-artist', name: 'Wiki Artist', type: 'special', capabilities: ['documentation', 'wiki'] },
      { id: 'wikibrarian', name: 'Wiki Librarian', type: 'special', capabilities: ['documentation', 'organization'] },
    ];

    for (const agent of fallbackAgents) {
      this.registerAgent(agent);
    }
  }

  /**
   * Route request to appropriate agent
   */
  async routeToAgent(agentId, action, params = {}) {
    if (!this.agents.has(agentId)) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    const agent = this.agents.get(agentId);
    const startTime = Date.now();

    try {
      // Update agent status
      agent.status = 'active';
      this.agents.set(agentId, agent);

      // Execute action
      const result = await this.executeAgentAction(agentId, action, params);

      // Update health metrics
      const responseTime = Date.now() - startTime;
      this.updateHealthStatus(agentId, true, responseTime);

      return {
        success: true,
        agentId,
        action,
        result,
        responseTime
      };
    } catch (error) {
      // Update health metrics
      const responseTime = Date.now() - startTime;
      this.updateHealthStatus(agentId, false, responseTime);

      throw error;
    } finally {
      // Reset agent status
      agent.status = 'inactive';
      this.agents.set(agentId, agent);
    }
  }

  /**
   * Execute agent action via backend API
   */
  async executeAgentAction(agentId, action, params) {
    const agent = this.agents.get(agentId);
    const endpoint = agent.endpoints[action] || `/api/agents/${agentId}/${action}`;

    // This will be handled by the API bridge
    return {
      agentId,
      action,
      params,
      endpoint,
      timestamp: Date.now()
    };
  }

  /**
   * Update agent health status
   */
  updateHealthStatus(agentId, success, responseTime) {
    const health = this.healthStatus.get(agentId);
    
    if (success) {
      health.successCount++;
      health.failureCount = 0; // Reset failure count on success
    } else {
      health.failureCount++;
    }

    // Update average response time
    health.avgResponseTime = 
      (health.avgResponseTime * health.successCount + responseTime) / 
      (health.successCount + 1);

    // Update health status
    health.healthy = health.failureCount < 3;
    health.lastCheck = Date.now();

    this.healthStatus.set(agentId, health);
  }

  /**
   * Get agent by ID
   */
  getAgent(agentId) {
    return this.agents.get(agentId);
  }

  /**
   * Get all agents
   */
  getAllAgents() {
    return Array.from(this.agents.values());
  }

  /**
   * Get agents by type
   */
  getAgentsByType(type) {
    return Array.from(this.agents.values()).filter(
      agent => agent.type === type
    );
  }

  /**
   * Get agents by capability
   */
  getAgentsByCapability(capability) {
    return Array.from(this.agents.values()).filter(
      agent => agent.capabilities.includes(capability)
    );
  }

  /**
   * Get agent health status
   */
  getAgentHealth(agentId) {
    return this.healthStatus.get(agentId);
  }

  /**
   * Get overall system health
   */
  getSystemHealth() {
    const totalAgents = this.agents.size;
    const healthyAgents = Array.from(this.healthStatus.values()).filter(
      h => h.healthy
    ).length;

    return {
      totalAgents,
      healthyAgents,
      unhealthyAgents: totalAgents - healthyAgents,
      healthPercentage: Math.round((healthyAgents / totalAgents) * 100),
      lastUpdate: Date.now()
    };
  }

  /**
   * Get agent statistics
   */
  getAgentStats(agentId) {
    const agent = this.agents.get(agentId);
    const metadata = this.agentMetadata.get(agentId);
    const health = this.healthStatus.get(agentId);

    if (!agent) {
      return null;
    }

    return {
      ...agent,
      ...metadata,
      health,
      uptime: Date.now() - agent.registeredAt
    };
  }

  /**
   * Search agents
   */
  searchAgents(query) {
    const lowerQuery = query.toLowerCase();
    
    return Array.from(this.agents.values()).filter(agent => {
      const metadata = this.agentMetadata.get(agent.id);
      return (
        agent.name.toLowerCase().includes(lowerQuery) ||
        agent.type.toLowerCase().includes(lowerQuery) ||
        agent.capabilities.some(c => c.toLowerCase().includes(lowerQuery)) ||
        metadata.description.toLowerCase().includes(lowerQuery) ||
        metadata.tags.some(t => t.toLowerCase().includes(lowerQuery))
      );
    });
  }

  /**
   * Register communication handler
   */
  registerCommunicationHandler(agentId, handler) {
    if (!this.communicationHandlers.has(agentId)) {
      this.communicationHandlers.set(agentId, []);
    }
    this.communicationHandlers.get(agentId).push(handler);
  }

  /**
   * Send message to agent
   */
  async sendMessage(agentId, message) {
    const handlers = this.communicationHandlers.get(agentId);
    if (handlers && handlers.length > 0) {
      for (const handler of handlers) {
        await handler(message);
      }
    }
  }

  /**
   * Get registry statistics
   */
  getStats() {
    return {
      totalAgents: this.agents.size,
      agentsByType: {
        'build-setup': this.getAgentsByType('build-setup').length,
        'weekly-cycle': this.getAgentsByType('weekly-cycle').length,
        'extended': this.getAgentsByType('extended').length,
        'special': this.getAgentsByType('special').length
      },
      systemHealth: this.getSystemHealth(),
      initialized: this.initialized
    };
  }
}

// Create singleton instance
const agentRegistry = new AgentRegistry();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = agentRegistry;
}
