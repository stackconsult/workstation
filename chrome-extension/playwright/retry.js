/**
 * Playwright Retry Manager
 * Intelligent retry strategies for self-healing workflows
 */

export class PlaywrightRetryManager {
  constructor() {
    this.maxRetries = 3;
    this.baseDelay = 1000; // 1 second
    this.errorStrategies = {
      'ELEMENT_NOT_FOUND': this.handleElementNotFound.bind(this),
      'TIMEOUT': this.handleTimeout.bind(this),
      'NETWORK_ERROR': this.handleNetworkError.bind(this),
      'ELEMENT_NOT_ACTIONABLE': this.handleElementNotActionable.bind(this),
      'DEFAULT': this.handleDefault.bind(this)
    };
  }

  /**
   * Handle retry logic for a failed execution
   * @param {string} executionId - Unique execution identifier
   * @param {Object} workflow - The workflow that failed
   * @param {Error} error - The error that occurred
   * @param {Object} execution - Execution context
   * @returns {Promise<Object>} Retry decision
   */
  async handleRetry(executionId, workflow, error, execution) {
    const errorType = this.determineErrorType(error);
    const strategy = this.errorStrategies[errorType] || this.errorStrategies.DEFAULT;

    console.log(`🔄 Retry strategy: ${errorType} for execution ${executionId}`);

    return strategy(executionId, workflow, error, execution);
  }

  /**
   * Determine error type from error message
   * @param {Error} error - The error
   * @returns {string} Error type
   */
  determineErrorType(error) {
    if (!error || !error.message) return 'DEFAULT';

    const msg = error.message.toLowerCase();

    if (msg.includes('element') && (msg.includes('not found') || msg.includes('not exist'))) {
      return 'ELEMENT_NOT_FOUND';
    }

    if (msg.includes('timeout') || msg.includes('timed out')) {
      return 'TIMEOUT';
    }

    if (msg.includes('network') || msg.includes('fetch') || msg.includes('connection')) {
      return 'NETWORK_ERROR';
    }

    if (msg.includes('not actionable') || msg.includes('disabled') || msg.includes('covered')) {
      return 'ELEMENT_NOT_ACTIONABLE';
    }

    return 'DEFAULT';
  }

  /**
   * Handle element not found errors
   * @param {string} executionId - Execution ID
   * @param {Object} workflow - Workflow
   * @param {Error} error - Error
   * @param {Object} execution - Execution context
   * @returns {Promise<Object>} Retry decision
   */
  async handleElementNotFound(executionId, workflow, error, execution) {
    if (execution.retryCount >= this.maxRetries) {
      return {
        shouldRetry: false,
        reason: `Maximum retries (${this.maxRetries}) reached`
      };
    }

    console.log(`🔍 Attempting to find alternative selectors...`);

    // Try to find the failing step
    const currentStep = workflow.definition?.tasks?.find(
      step => (step.action === 'click' || step.action === 'type') &&
              error.message.includes(step.parameters?.selector)
    );

    if (currentStep && currentStep.alternativeSelectors) {
      // Try next alternative selector
      const nextSelector = currentStep.alternativeSelectors[execution.retryCount];
      if (nextSelector) {
        console.log(`✨ Trying alternative selector: ${nextSelector}`);
        return {
          shouldRetry: true,
          delay: this.calculateDelay(execution.retryCount),
          newParams: {
            ...execution,
            workflow: this.updateWorkflowSelector(workflow, currentStep, nextSelector)
          }
        };
      }
    }

    // If no alternative selectors, just retry with longer timeout
    return {
      shouldRetry: true,
      delay: this.calculateDelay(execution.retryCount) * 2,
      newParams: execution
    };
  }

  /**
   * Handle timeout errors
   * @param {string} executionId - Execution ID
   * @param {Object} workflow - Workflow
   * @param {Error} error - Error
   * @param {Object} execution - Execution context
   * @returns {Promise<Object>} Retry decision
   */
  async handleTimeout(executionId, workflow, error, execution) {
    if (execution.retryCount >= this.maxRetries) {
      return {
        shouldRetry: false,
        reason: `Maximum retries (${this.maxRetries}) reached`
      };
    }

    console.log(`⏰ Increasing timeout for retry...`);

    // Increase timeouts in the workflow
    const newWorkflow = JSON.parse(JSON.stringify(workflow));
    if (newWorkflow.definition && newWorkflow.definition.tasks) {
      newWorkflow.definition.tasks = newWorkflow.definition.tasks.map(step => {
        if (step.parameters && typeof step.parameters.timeout === 'number') {
          return {
            ...step,
            parameters: {
              ...step.parameters,
              timeout: step.parameters.timeout * 1.5
            }
          };
        }
        return step;
      });
    }

    return {
      shouldRetry: true,
      delay: this.calculateDelay(execution.retryCount),
      newParams: {
        ...execution,
        workflow: newWorkflow
      }
    };
  }

  /**
   * Handle network errors
   * @param {string} executionId - Execution ID
   * @param {Object} workflow - Workflow
   * @param {Error} error - Error
   * @param {Object} execution - Execution context
   * @returns {Promise<Object>} Retry decision
   */
  async handleNetworkError(executionId, workflow, error, execution) {
    if (execution.retryCount >= this.maxRetries) {
      return {
        shouldRetry: false,
        reason: `Maximum retries (${this.maxRetries}) reached`
      };
    }

    console.log(`🌐 Network error detected, waiting longer before retry...`);

    // Wait longer for network errors (exponential backoff with higher multiplier)
    return {
      shouldRetry: true,
      delay: this.calculateDelay(execution.retryCount) * 3,
      newParams: execution
    };
  }

  /**
   * Handle element not actionable errors
   * @param {string} executionId - Execution ID
   * @param {Object} workflow - Workflow
   * @param {Error} error - Error
   * @param {Object} execution - Execution context
   * @returns {Promise<Object>} Retry decision
   */
  async handleElementNotActionable(executionId, workflow, error, execution) {
    if (execution.retryCount >= this.maxRetries) {
      return {
        shouldRetry: false,
        reason: `Maximum retries (${this.maxRetries}) reached`
      };
    }

    console.log(`🚫 Element not actionable, waiting for page to settle...`);

    // Wait for page to settle and retry
    return {
      shouldRetry: true,
      delay: this.calculateDelay(execution.retryCount) * 2,
      newParams: execution
    };
  }

  /**
   * Default retry handler
   * @param {string} executionId - Execution ID
   * @param {Object} workflow - Workflow
   * @param {Error} error - Error
   * @param {Object} execution - Execution context
   * @returns {Promise<Object>} Retry decision
   */
  async handleDefault(executionId, workflow, error, execution) {
    if (execution.retryCount >= this.maxRetries) {
      return {
        shouldRetry: false,
        reason: `Maximum retries (${this.maxRetries}) reached`
      };
    }

    console.log(`🔄 Generic retry for unknown error...`);

    return {
      shouldRetry: true,
      delay: this.calculateDelay(execution.retryCount),
      newParams: execution
    };
  }

  /**
   * Calculate exponential backoff delay
   * @param {number} retryCount - Current retry count
   * @returns {number} Delay in milliseconds
   */
  calculateDelay(retryCount) {
    return this.baseDelay * Math.pow(2, retryCount);
  }

  /**
   * Update workflow with new selector
   * @param {Object} workflow - Original workflow
   * @param {Object} step - Step to update
   * @param {string} newSelector - New selector
   * @returns {Object} Updated workflow
   */
  updateWorkflowSelector(workflow, step, newSelector) {
    const newWorkflow = JSON.parse(JSON.stringify(workflow));

    if (newWorkflow.definition && newWorkflow.definition.tasks) {
      newWorkflow.definition.tasks = newWorkflow.definition.tasks.map(task => {
        if (task === step || (task.id && task.id === step.id)) {
          return {
            ...task,
            parameters: {
              ...task.parameters,
              selector: newSelector
            }
          };
        }
        return task;
      });
    }

    return newWorkflow;
  }

  /**
   * Set maximum retries
   * @param {number} max - Maximum retry count
   */
  setMaxRetries(max) {
    this.maxRetries = max;
  }

  /**
   * Set base delay for exponential backoff
   * @param {number} delay - Base delay in milliseconds
   */
  setBaseDelay(delay) {
    this.baseDelay = delay;
  }

  /**
   * Get retry statistics
   * @returns {Object} Statistics
   */
  getStatistics() {
    return {
      maxRetries: this.maxRetries,
      baseDelay: this.baseDelay,
      supportedStrategies: Object.keys(this.errorStrategies)
    };
  }
}
