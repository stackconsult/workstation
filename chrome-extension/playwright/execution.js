/**
 * Playwright Execution Engine
 * Enhanced workflow execution with auto-waiting and retry capabilities
 */

import { PlaywrightAutoWait } from './auto-wait.js';
import { PlaywrightRetryManager } from './retry.js';

export class PlaywrightExecution {
  constructor() {
    this.executionQueue = new Map();
    this.retryManager = new PlaywrightRetryManager();
    this.isProcessing = false;
  }

  /**
   * Execute a workflow with retry capabilities
   * @param {Object} workflow - Workflow to execute
   * @param {number} tabId - Tab ID to execute in
   * @param {Function} callback - Callback function
   * @returns {string} Execution ID
   */
  async executeWorkflow(workflow, tabId, callback) {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.executionQueue.set(executionId, {
      workflow,
      tabId,
      callback,
      retryCount: 0,
      startTime: Date.now(),
      status: 'queued'
    });

    console.log(`📋 Workflow queued: ${executionId}`);

    // Process queue (non-blocking)
    this.processQueue().catch(error => {
      console.error('Queue processing error:', error);
    });

    return executionId;
  }

  /**
   * Process the execution queue
   * @returns {Promise<void>}
   */
  async processQueue() {
    if (this.isProcessing) return;

    this.isProcessing = true;

    while (this.executionQueue.size > 0) {
      const [executionId, execution] = this.executionQueue.entries().next().value;
      this.executionQueue.delete(executionId);

      execution.status = 'running';

      try {
        console.log(`▶️ Executing workflow: ${executionId} (attempt ${execution.retryCount + 1})`);

        const result = await this.executeWorkflowSteps(execution.workflow, execution.tabId);

        execution.status = 'completed';

        console.log(`✅ Workflow completed: ${executionId}`);

        if (execution.callback) {
          execution.callback({ success: true, result, executionId });
        }

      } catch (error) {
        console.error(`❌ Workflow failed: ${executionId}`, error);

        execution.status = 'failed';

        // Handle retry
        const retryResult = await this.retryManager.handleRetry(
          executionId,
          execution.workflow,
          error,
          execution
        );

        if (retryResult.shouldRetry) {
          console.log(`🔄 Retrying execution: ${executionId} after ${retryResult.delay}ms`);

          // Wait before retry
          await this.sleep(retryResult.delay);

          // Re-queue with updated parameters
          this.executionQueue.set(executionId, {
            ...execution,
            ...retryResult.newParams,
            retryCount: execution.retryCount + 1,
            status: 'queued'
          });

        } else {
          console.log(`🛑 Retry limit reached for execution: ${executionId}`);

          if (execution.callback) {
            execution.callback({
              success: false,
              error: error.message,
              executionId,
              reason: retryResult.reason
            });
          }
        }
      }
    }

    this.isProcessing = false;
  }

  /**
   * Execute workflow steps sequentially
   * @param {Object} workflow - Workflow definition
   * @param {number} tabId - Tab ID
   * @returns {Promise<Array>} Results array
   */
  async executeWorkflowSteps(workflow, tabId) {
    const results = [];

    if (!workflow.definition || !workflow.definition.tasks) {
      throw new Error('Invalid workflow: missing definition or tasks');
    }

    for (const step of workflow.definition.tasks) {
      console.log(`📍 Executing step: ${step.action}`);

      try {
        const result = await this.executeStep(step, tabId);
        results.push({ step: step.action, success: true, result });
      } catch (error) {
        throw new Error(`Step "${step.action}" failed: ${error.message}`);
      }
    }

    return results;
  }

  /**
   * Execute a single workflow step
   * @param {Object} step - Step definition
   * @param {number} tabId - Tab ID
   * @returns {Promise<Object>} Step result
   */
  async executeStep(step, tabId) {
    switch (step.action) {
      case 'navigate':
        return this.executeNavigate(step, tabId);
      case 'click':
        return this.executeClick(step, tabId);
      case 'type':
        return this.executeType(step, tabId);
      case 'screenshot':
        return this.executeScreenshot(step, tabId);
      case 'wait':
        return this.executeWait(step, tabId);
      default:
        throw new Error(`Unsupported action: ${step.action}`);
    }
  }

  /**
   * Execute navigate action
   * @param {Object} step - Step definition
   * @param {number} tabId - Tab ID
   * @returns {Promise<Object>} Result
   */
  async executeNavigate(step, tabId) {
    const url = this.resolveVariables(step.parameters.url, step.variables || {});

    return new Promise((resolve, reject) => {
      chrome.tabs.update(tabId, { url }, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          // Wait for page load
          setTimeout(() => {
            resolve({ success: true, url });
          }, 1000);
        }
      });
    });
  }

  /**
   * Execute click action with auto-waiting
   * @param {Object} step - Step definition
   * @param {number} tabId - Tab ID
   * @returns {Promise<Object>} Result
   */
  async executeClick(step, tabId) {
    const selector = this.resolveVariables(step.parameters.selector, step.variables || {});

    const result = await chrome.scripting.executeScript({
      target: { tabId },
      func: async (selector, timeout) => {
        // Import auto-wait functionality inline
        const waitForElement = async (sel, maxTimeout) => {
          const startTime = Date.now();
          while (Date.now() - startTime < maxTimeout) {
            const element = document.querySelector(sel);
            if (element) {
              const rect = element.getBoundingClientRect();
              const style = window.getComputedStyle(element);
              if (rect.width > 0 && rect.height > 0 && style.visibility === 'visible' && style.display !== 'none') {
                return element;
              }
            }
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          throw new Error(`Element "${sel}" not found within ${maxTimeout}ms`);
        };

        try {
          const element = await waitForElement(selector, timeout);
          element.click();
          return { success: true, selector };
        } catch (error) {
          return { success: false, error: error.message };
        }
      },
      args: [selector, step.parameters.timeout || 5000]
    });

    if (result && result[0] && result[0].result.success) {
      return result[0].result;
    } else {
      throw new Error(result[0]?.result?.error || 'Click failed');
    }
  }

  /**
   * Execute type action with auto-waiting
   * @param {Object} step - Step definition
   * @param {number} tabId - Tab ID
   * @returns {Promise<Object>} Result
   */
  async executeType(step, tabId) {
    const selector = this.resolveVariables(step.parameters.selector, step.variables || {});
    const text = this.resolveVariables(step.parameters.text, step.variables || {});

    const result = await chrome.scripting.executeScript({
      target: { tabId },
      func: async (selector, text, timeout) => {
        // Import auto-wait functionality inline
        const waitForElement = async (sel, maxTimeout) => {
          const startTime = Date.now();
          while (Date.now() - startTime < maxTimeout) {
            const element = document.querySelector(sel);
            if (element) {
              const rect = element.getBoundingClientRect();
              const style = window.getComputedStyle(element);
              if (rect.width > 0 && rect.height > 0 && style.visibility === 'visible' && style.display !== 'none') {
                return element;
              }
            }
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          throw new Error(`Element "${sel}" not found within ${maxTimeout}ms`);
        };

        try {
          const element = await waitForElement(selector, timeout);
          element.value = text;
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
          return { success: true, selector, text };
        } catch (error) {
          return { success: false, error: error.message };
        }
      },
      args: [selector, text, step.parameters.timeout || 5000]
    });

    if (result && result[0] && result[0].result.success) {
      return result[0].result;
    } else {
      throw new Error(result[0]?.result?.error || 'Type failed');
    }
  }

  /**
   * Execute screenshot action
   * @param {Object} step - Step definition
   * @param {number} tabId - Tab ID
   * @returns {Promise<Object>} Result
   */
  async executeScreenshot(step, tabId) {
    try {
      const dataUrl = await chrome.tabs.captureVisibleTab(null, {
        format: 'png',
        quality: 100
      });
      return { success: true, screenshot: dataUrl };
    } catch (error) {
      throw new Error(`Screenshot failed: ${error.message}`);
    }
  }

  /**
   * Execute wait action
   * @param {Object} step - Step definition
   * @param {number} tabId - Tab ID
   * @returns {Promise<Object>} Result
   */
  async executeWait(step, tabId) {
    const duration = step.parameters.duration || 1000;
    await this.sleep(duration);
    return { success: true, duration };
  }

  /**
   * Resolve variables in a value
   * @param {*} value - Value to resolve
   * @param {Object} variables - Variables object
   * @returns {*} Resolved value
   */
  resolveVariables(value, variables) {
    if (typeof value !== 'string') return value;

    return value.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      return variables[varName] !== undefined ? variables[varName] : match;
    });
  }

  /**
   * Sleep for specified milliseconds
   * @param {number} ms - Milliseconds
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get execution status
   * @param {string} executionId - Execution ID
   * @returns {Object|null} Execution status
   */
  getExecutionStatus(executionId) {
    return this.executionQueue.get(executionId) || null;
  }

  /**
   * Cancel an execution
   * @param {string} executionId - Execution ID
   * @returns {boolean} Success status
   */
  cancelExecution(executionId) {
    if (this.executionQueue.has(executionId)) {
      this.executionQueue.delete(executionId);
      console.log(`🚫 Execution cancelled: ${executionId}`);
      return true;
    }
    return false;
  }
}
