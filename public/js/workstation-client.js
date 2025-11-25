/**
 * Workflow Builder API Client
 * Provides a JavaScript client for interacting with the Workstation backend
 * Can be used standalone or integrated into the workflow builder
 */

class WorkstationClient {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || 'http://localhost:3000';
    this.token = options.token || null;
    this.onError = options.onError || console.error;
    this.onSuccess = options.onSuccess || console.log;
  }

  /**
   * Set authentication token
   */
  setToken(token) {
    this.token = token;
  }

  /**
   * Get authentication headers
   */
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  /**
   * Make API request
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...(options.headers || {})
      }
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      this.onError(error);
      throw error;
    }
  }

  // ======================
  // WORKFLOW METHODS
  // ======================

  /**
   * Create a new workflow
   */
  async createWorkflow(workflow) {
    return this.request('/api/v2/workflows', {
      method: 'POST',
      body: JSON.stringify(workflow)
    });
  }

  /**
   * List all workflows
   */
  async listWorkflows(params = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = `/api/v2/workflows${query ? '?' + query : ''}`;
    return this.request(endpoint);
  }

  /**
   * Get a specific workflow
   */
  async getWorkflow(workflowId) {
    return this.request(`/api/v2/workflows/${workflowId}`);
  }

  /**
   * Update a workflow
   */
  async updateWorkflow(workflowId, updates) {
    return this.request(`/api/v2/workflows/${workflowId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  /**
   * Delete a workflow
   */
  async deleteWorkflow(workflowId) {
    return this.request(`/api/v2/workflows/${workflowId}`, {
      method: 'DELETE'
    });
  }

  // ======================
  // EXECUTION METHODS
  // ======================

  /**
   * Execute a workflow
   */
  async executeWorkflow(workflowId, variables = {}) {
    return this.request(`/api/v2/workflows/${workflowId}/execute`, {
      method: 'POST',
      body: JSON.stringify({ variables })
    });
  }

  /**
   * Get execution status
   */
  async getExecutionStatus(executionId) {
    return this.request(`/api/v2/executions/${executionId}/status`);
  }

  /**
   * Get execution details
   */
  async getExecution(executionId) {
    return this.request(`/api/v2/executions/${executionId}`);
  }

  /**
   * Get execution tasks
   */
  async getExecutionTasks(executionId) {
    return this.request(`/api/v2/executions/${executionId}/tasks`);
  }

  /**
   * Get execution logs
   */
  async getExecutionLogs(executionId) {
    return this.request(`/api/v2/executions/${executionId}/logs`);
  }

  /**
   * Poll execution status until completion
   */
  async pollExecutionStatus(executionId, options = {}) {
    const interval = options.interval || 1000;
    const maxAttempts = options.maxAttempts || 120;
    const onProgress = options.onProgress || (() => {});

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const result = await this.getExecutionStatus(executionId);
      const status = result.data.status;

      onProgress(result.data);

      if (status === 'completed' || status === 'failed') {
        return result;
      }

      await new Promise(resolve => setTimeout(resolve, interval));
    }

    throw new Error('Execution polling timeout');
  }

  // ======================
  // TEMPLATE METHODS
  // ======================

  /**
   * List workflow templates
   */
  async listTemplates(params = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = `/api/v2/templates${query ? '?' + query : ''}`;
    return this.request(endpoint);
  }

  /**
   * Get a specific template
   */
  async getTemplate(templateId) {
    return this.request(`/api/v2/templates/${templateId}`);
  }

  /**
   * Clone a template
   */
  async cloneTemplate(templateId, name) {
    return this.request(`/api/workflow-templates/${templateId}/clone`, {
      method: 'POST',
      body: JSON.stringify({ name })
    });
  }

  // ======================
  // AUTHENTICATION METHODS
  // ======================

  /**
   * Login
   */
  async login(username, password) {
    const result = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });

    if (result.data && result.data.token) {
      this.setToken(result.data.token);
    }

    return result;
  }

  /**
   * Get demo token
   */
  async getDemoToken() {
    const result = await this.request('/api/auth/demo-token');
    
    if (result.data && result.data.token) {
      this.setToken(result.data.token);
    }

    return result;
  }

  // ======================
  // HEALTH CHECK
  // ======================

  /**
   * Check backend health
   */
  async checkHealth() {
    return this.request('/health');
  }

  /**
   * Ping backend to verify connectivity
   */
  async ping() {
    try {
      await this.checkHealth();
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Export for use in browser or Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WorkstationClient;
}
if (typeof window !== 'undefined') {
  window.WorkstationClient = WorkstationClient;
}
