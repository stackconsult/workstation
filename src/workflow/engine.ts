import { Workflow, WorkflowStep } from '@/types';

export class WorkflowEngine {
  private workflows: Map<string, Workflow> = new Map();

  /**
   * Register a new workflow
   */
  registerWorkflow(workflow: Workflow): void {
    this.workflows.set(workflow.id, workflow);
  }

  /**
   * Get a workflow by ID
   */
  getWorkflow(id: string): Workflow | null {
    return this.workflows.get(id) || null;
  }

  /**
   * Get all registered workflows
   */
  getAllWorkflows(): Workflow[] {
    return Array.from(this.workflows.values());
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(
    workflowId: string,
    context: Record<string, any>
  ): Promise<any> {
    const workflow = this.getWorkflow(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const executionContext = { ...context };
    let currentStepId = workflow.initialStep;
    const results: Record<string, any> = {};

    while (currentStepId) {
      const step = workflow.steps.find((s) => s.id === currentStepId);
      if (!step) {
        throw new Error(`Step not found: ${currentStepId}`);
      }

      try {
        const stepResult = await this.executeStep(step, executionContext);
        results[currentStepId] = stepResult;

        // Update context with step results
        executionContext[`step_${currentStepId}`] = stepResult;

        // Determine next step
        if (step.nextSteps && step.nextSteps.length > 0) {
          currentStepId = step.nextSteps[0];
        } else if (step.onSuccess) {
          currentStepId = step.onSuccess;
        } else {
          currentStepId = ''; // End of workflow
        }
      } catch (error) {
        results[currentStepId] = { error: error instanceof Error ? error.message : String(error) };

        if (step.onError) {
          currentStepId = step.onError;
        } else {
          throw error;
        }
      }
    }

    return results;
  }

  /**
   * Execute a single workflow step
   */
  private async executeStep(
    step: WorkflowStep,
    context: Record<string, any>
  ): Promise<any> {
    // Different step types
    switch (step.type) {
      case 'navigate':
        return this.executeNavigateStep(step, context);

      case 'extract':
        return this.executeExtractStep(step, context);

      case 'action':
        return this.executeActionStep(step, context);

      case 'analyze':
        return this.executeAnalyzeStep(step, context);

      case 'condition':
        return this.executeConditionStep(step, context);

      case 'loop':
        return this.executeLoopStep(step, context);

      case 'custom':
        return this.executeCustomStep(step, context);

      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  }

  private async executeNavigateStep(
    step: WorkflowStep,
    context: Record<string, any>
  ): Promise<any> {
    const url = this.resolveValue(step.config.url, context);
    
    // Send message to background to navigate
    const response = await chrome.runtime.sendMessage({
      type: 'SUBMIT_TASK',
      task: {
        type: 'navigate',
        description: `Navigate to ${url}`,
        priority: 'high',
        input: { url },
      },
    });

    return response;
  }

  private async executeExtractStep(
    step: WorkflowStep,
    context: Record<string, any>
  ): Promise<any> {
    const selector = this.resolveValue(step.config.selector, context);
    const extractType = step.config.extractType || 'text';

    const response = await chrome.runtime.sendMessage({
      type: 'SUBMIT_TASK',
      task: {
        type: 'extract',
        description: `Extract ${extractType} from ${selector}`,
        priority: 'high',
        input: { selector, extractType },
      },
    });

    return response;
  }

  private async executeActionStep(
    step: WorkflowStep,
    context: Record<string, any>
  ): Promise<any> {
    const action = step.config.action;
    const params = this.resolveValue(step.config.params, context);

    const response = await chrome.runtime.sendMessage({
      type: 'SUBMIT_TASK',
      task: {
        type: 'execute',
        description: `Execute ${action}`,
        priority: 'high',
        input: { action, ...params },
      },
    });

    return response;
  }

  private async executeAnalyzeStep(
    step: WorkflowStep,
    context: Record<string, any>
  ): Promise<any> {
    const data = this.resolveValue(step.config.data, context);
    const analysisType = step.config.analysisType || 'general';

    const response = await chrome.runtime.sendMessage({
      type: 'SUBMIT_TASK',
      task: {
        type: 'analyze',
        description: `Analyze data: ${analysisType}`,
        priority: 'high',
        input: { data, analysisType },
      },
    });

    return response;
  }

  private async executeConditionStep(
    step: WorkflowStep,
    context: Record<string, any>
  ): Promise<any> {
    const condition = step.config.condition;
    const leftValue = this.resolveValue(condition.left, context);
    const rightValue = this.resolveValue(condition.right, context);
    const operator = condition.operator;

    let result = false;

    switch (operator) {
      case '==':
        result = leftValue == rightValue;
        break;
      case '===':
        result = leftValue === rightValue;
        break;
      case '!=':
        result = leftValue != rightValue;
        break;
      case '>':
        result = leftValue > rightValue;
        break;
      case '<':
        result = leftValue < rightValue;
        break;
      case '>=':
        result = leftValue >= rightValue;
        break;
      case '<=':
        result = leftValue <= rightValue;
        break;
      case 'contains':
        result = String(leftValue).includes(String(rightValue));
        break;
      default:
        throw new Error(`Unknown operator: ${operator}`);
    }

    return { result, leftValue, rightValue };
  }

  private async executeLoopStep(
    step: WorkflowStep,
    context: Record<string, any>
  ): Promise<any> {
    const items = this.resolveValue(step.config.items, context);
    const subStepId = step.config.subStep;
    const results = [];

    if (!Array.isArray(items)) {
      throw new Error('Loop items must be an array');
    }

    for (const item of items) {
      const itemContext = { ...context, loopItem: item };
      const subStep = { ...step, id: subStepId };
      const result = await this.executeStep(subStep, itemContext);
      results.push(result);
    }

    return results;
  }

  private async executeCustomStep(
    step: WorkflowStep,
    context: Record<string, any>
  ): Promise<any> {
    // Custom step allows for user-defined functionality
    const handler = step.config.handler;
    
    if (typeof handler === 'function') {
      return await handler(context);
    }

    throw new Error('Custom step requires a handler function');
  }

  /**
   * Resolve a value that might contain context variables
   */
  private resolveValue(value: any, context: Record<string, any>): any {
    if (typeof value === 'string' && value.startsWith('$')) {
      // Variable reference like $variableName
      const varName = value.substring(1);
      return context[varName];
    }

    if (typeof value === 'object' && value !== null) {
      // Recursively resolve object properties
      const resolved: Record<string, any> = {};
      for (const [key, val] of Object.entries(value)) {
        resolved[key] = this.resolveValue(val, context);
      }
      return resolved;
    }

    return value;
  }

  /**
   * Save a workflow to storage
   */
  async saveWorkflow(workflow: Workflow): Promise<void> {
    this.registerWorkflow(workflow);
    
    const stored = await chrome.storage.local.get('workflows');
    const workflows = stored.workflows || {};
    workflows[workflow.id] = workflow;
    
    await chrome.storage.local.set({ workflows });
  }

  /**
   * Load workflows from storage
   */
  async loadWorkflows(): Promise<void> {
    const stored = await chrome.storage.local.get('workflows');
    const workflows = stored.workflows || {};
    
    for (const [_id, workflow] of Object.entries(workflows)) {
      this.registerWorkflow(workflow as Workflow);
    }
  }

  /**
   * Delete a workflow
   */
  async deleteWorkflow(workflowId: string): Promise<void> {
    this.workflows.delete(workflowId);
    
    const stored = await chrome.storage.local.get('workflows');
    const workflows = stored.workflows || {};
    delete workflows[workflowId];
    
    await chrome.storage.local.set({ workflows });
  }
}

// Singleton instance
let workflowEngineInstance: WorkflowEngine | null = null;

export function getWorkflowEngine(): WorkflowEngine {
  if (!workflowEngineInstance) {
    workflowEngineInstance = new WorkflowEngine();
  }
  return workflowEngineInstance;
}
