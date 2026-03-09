/**
 * Multi-Workflow Dependencies - Phase 4
 * Enables workflow chaining, data passing, and conditional triggers
 */

import { getDatabase, generateId, getCurrentTimestamp } from "../db/database";
import { Workflow, Execution } from "../db/models";
import { orchestrationEngine } from "./engine";
import { logger } from "../../utils/logger";

/**
 * Workflow chain configuration
 */
export interface WorkflowChain {
  id: string;
  name: string;
  workflows: ChainedWorkflow[];
  created_at: string;
  updated_at: string;
}

/**
 * Chained workflow with dependencies
 */
export interface ChainedWorkflow {
  workflow_id: string;
  order: number;
  depends_on: string[]; // IDs of workflows that must complete first
  condition?: ChainCondition; // Optional condition for execution
  data_mapping?: DataMapping; // Map outputs to inputs
}

/**
 * Condition for workflow execution
 */
export interface ChainCondition {
  type: "status" | "output" | "expression";
  field?: string; // For output conditions
  operator?: "equals" | "contains" | "greaterThan" | "lessThan";
  value?: unknown;
  expression?: string; // JavaScript expression for complex conditions
}

/**
 * Data mapping between workflows
 */
export interface DataMapping {
  mappings: Array<{
    from: string; // Path in source workflow output (e.g., 'workflow1.output.userId')
    to: string; // Variable name in target workflow (e.g., 'userId')
  }>;
}

/**
 * Workflow execution context
 */
export interface WorkflowContext {
  workflow_id: string;
  execution_id?: string;
  status?: "pending" | "running" | "completed" | "failed" | "skipped";
  output?: Record<string, unknown>;
  error?: string;
  started_at?: string;
  completed_at?: string;
}

/**
 * Chain execution result
 */
export interface ChainExecutionResult {
  chain_id: string;
  total_workflows: number;
  executed: number;
  skipped: number;
  failed: number;
  workflows: WorkflowContext[];
  total_duration: number;
}

/**
 * Workflow Dependencies Manager
 */
export class WorkflowDependenciesManager {
  /**
   * Create a workflow chain
   */
  async createChain(
    name: string,
    workflows: ChainedWorkflow[],
  ): Promise<WorkflowChain> {
    const db = getDatabase();

    // Validate workflows exist
    for (const cw of workflows) {
      const workflow = await db.get<Workflow>(
        "SELECT * FROM workflows WHERE id = ?",
        cw.workflow_id,
      );

      if (!workflow) {
        throw new Error(`Workflow not found: ${cw.workflow_id}`);
      }
    }

    // Validate no circular dependencies
    this.validateChain(workflows);

    const chain: WorkflowChain = {
      id: generateId(),
      name,
      workflows,
      created_at: getCurrentTimestamp(),
      updated_at: getCurrentTimestamp(),
    };

    // Store chain in database (using workflows table with special type)
    await db.run(
      `INSERT INTO workflows (id, name, description, definition, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      chain.id,
      chain.name,
      "Workflow Chain",
      JSON.stringify({ type: "chain", workflows: chain.workflows }),
      "active",
      chain.created_at,
      chain.updated_at,
    );

    logger.info("Workflow chain created", {
      chainId: chain.id,
      workflowCount: workflows.length,
    });

    return chain;
  }

  /**
   * Validate workflow chain has no circular dependencies
   */
  private validateChain(workflows: ChainedWorkflow[]): void {
    const graph = new Map<string, string[]>();

    workflows.forEach((wf) => {
      graph.set(wf.workflow_id, wf.depends_on || []);
    });

    const visited = new Set<string>();
    const recStack = new Set<string>();

    const hasCycle = (workflowId: string): boolean => {
      if (!visited.has(workflowId)) {
        visited.add(workflowId);
        recStack.add(workflowId);

        const deps = graph.get(workflowId) || [];
        for (const depId of deps) {
          if (!visited.has(depId) && hasCycle(depId)) {
            return true;
          } else if (recStack.has(depId)) {
            return true;
          }
        }
      }

      recStack.delete(workflowId);
      return false;
    };

    for (const wf of workflows) {
      if (hasCycle(wf.workflow_id)) {
        throw new Error("Circular dependency detected in workflow chain");
      }
    }
  }

  /**
   * Execute a workflow chain
   */
  async executeChain(
    chainId: string,
    initialVariables?: Record<string, unknown>,
  ): Promise<ChainExecutionResult> {
    const db = getDatabase();
    const startTime = Date.now();

    // Get chain definition
    const chainWorkflow = await db.get<Workflow>(
      "SELECT * FROM workflows WHERE id = ?",
      chainId,
    );

    if (!chainWorkflow) {
      throw new Error(`Workflow chain not found: ${chainId}`);
    }

    const definition =
      typeof chainWorkflow.definition === "string"
        ? JSON.parse(chainWorkflow.definition)
        : chainWorkflow.definition;

    if (definition.type !== "chain") {
      throw new Error("Workflow is not a chain");
    }

    const workflows: ChainedWorkflow[] = definition.workflows;
    const contexts = new Map<string, WorkflowContext>();
    const outputs = new Map<string, Record<string, unknown>>();

    // Initialize contexts
    workflows.forEach((wf) => {
      contexts.set(wf.workflow_id, {
        workflow_id: wf.workflow_id,
        status: "pending",
      });
    });

    let executed = 0;
    let skipped = 0;
    let failed = 0;

    // Execute workflows in dependency order
    const maxOrder = Math.max(...workflows.map((wf) => wf.order));

    for (let order = 0; order <= maxOrder; order++) {
      const orderWorkflows = workflows.filter((wf) => wf.order === order);

      // Execute workflows at this order level in parallel
      const promises = orderWorkflows.map(async (wf) => {
        const context = contexts.get(wf.workflow_id)!;

        // Check dependencies
        const depsCompleted = await this.checkDependencies(wf, contexts);
        if (!depsCompleted) {
          context.status = "skipped";
          context.error = "Dependencies not completed";
          skipped++;
          logger.warn("Workflow skipped due to dependencies", {
            workflowId: wf.workflow_id,
          });
          return;
        }

        // Check condition
        const conditionMet = await this.evaluateCondition(wf, outputs);
        if (!conditionMet) {
          context.status = "skipped";
          context.error = "Condition not met";
          skipped++;
          logger.info("Workflow skipped due to condition", {
            workflowId: wf.workflow_id,
          });
          return;
        }

        // Prepare variables with data from previous workflows
        const variables = this.prepareVariables(wf, outputs, initialVariables);

        // Execute workflow
        try {
          context.status = "running";
          context.started_at = getCurrentTimestamp();

          const execution = await orchestrationEngine.executeWorkflow({
            workflow_id: wf.workflow_id,
            trigger_type: "chain",
            variables,
          });

          context.execution_id = execution.id;

          // Wait for execution to complete (poll)
          await this.waitForExecution(execution.id);

          // Get execution result
          const result = await orchestrationEngine.getExecution(execution.id);

          if (result?.status === "completed") {
            context.status = "completed";
            context.output = result.output as Record<string, unknown>;
            context.completed_at = getCurrentTimestamp();
            outputs.set(wf.workflow_id, context.output || {});
            executed++;

            logger.info("Workflow in chain completed", {
              workflowId: wf.workflow_id,
            });
          } else {
            context.status = "failed";
            context.error = result?.error_message || "Execution failed";
            context.completed_at = getCurrentTimestamp();
            failed++;

            logger.error("Workflow in chain failed", {
              workflowId: wf.workflow_id,
              error: context.error,
            });
          }
        } catch (error) {
          context.status = "failed";
          context.error =
            error instanceof Error ? error.message : String(error);
          context.completed_at = getCurrentTimestamp();
          failed++;

          logger.error("Workflow execution error in chain", {
            workflowId: wf.workflow_id,
            error,
          });
        }
      });

      await Promise.all(promises);
    }

    const totalDuration = Date.now() - startTime;

    const result: ChainExecutionResult = {
      chain_id: chainId,
      total_workflows: workflows.length,
      executed,
      skipped,
      failed,
      workflows: Array.from(contexts.values()),
      total_duration: totalDuration,
    };

    logger.info("Workflow chain execution completed", {
      chainId,
      executed,
      skipped,
      failed,
      duration: totalDuration,
    });

    return result;
  }

  /**
   * Check if workflow dependencies are completed
   */
  private async checkDependencies(
    workflow: ChainedWorkflow,
    contexts: Map<string, WorkflowContext>,
  ): Promise<boolean> {
    if (!workflow.depends_on || workflow.depends_on.length === 0) {
      return true;
    }

    return workflow.depends_on.every((depId) => {
      const depContext = contexts.get(depId);
      return depContext && depContext.status === "completed";
    });
  }

  /**
   * Evaluate workflow execution condition
   */
  private async evaluateCondition(
    workflow: ChainedWorkflow,
    outputs: Map<string, Record<string, unknown>>,
  ): Promise<boolean> {
    if (!workflow.condition) {
      return true; // No condition, always execute
    }

    const condition = workflow.condition;

    try {
      switch (condition.type) {
        case "status": {
          // Check if dependent workflow has specific status
          const depId = workflow.depends_on?.[0];
          if (!depId) return true;

          const depOutput = outputs.get(depId);
          return depOutput !== undefined; // Completed successfully
        }

        case "output": {
          // Check output field value
          const depId = workflow.depends_on?.[0];
          if (!depId || !condition.field) return true;

          const depOutput = outputs.get(depId);
          if (!depOutput) return false;

          const fieldValue = this.getNestedValue(depOutput, condition.field);

          return this.compareValues(
            fieldValue,
            condition.operator!,
            condition.value,
          );
        }

        case "expression": {
          // Evaluate JavaScript expression
          if (!condition.expression) return true;

          // Build context for expression
          const context: Record<string, unknown> = {};
          outputs.forEach((output, workflowId) => {
            context[workflowId] = output;
          });

          // Evaluate expression safely
          const result = this.evaluateExpression(condition.expression, context);
          return Boolean(result);
        }

        default:
          return true;
      }
    } catch (error) {
      logger.error("Condition evaluation error", { error });
      return false;
    }
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split(".").reduce((current: any, key: string) => {
      return current?.[key];
    }, obj);
  }

  /**
   * Compare values based on operator
   */
  private compareValues(
    actual: unknown,
    operator: string,
    expected: unknown,
  ): boolean {
    switch (operator) {
      case "equals":
        return actual === expected;
      case "contains":
        return String(actual).includes(String(expected));
      case "greaterThan":
        return Number(actual) > Number(expected);
      case "lessThan":
        return Number(actual) < Number(expected);
      default:
        return false;
    }
  }

  /**
   * Safely evaluate JavaScript expression
   */
  private evaluateExpression(
    expression: string,
    context: Record<string, unknown>,
  ): unknown {
    try {
      // Create function with context variables
      const func = new Function(
        ...Object.keys(context),
        `return ${expression}`,
      );
      return func(...Object.values(context));
    } catch (error) {
      logger.error("Expression evaluation failed", { expression, error });
      return false;
    }
  }

  /**
   * Prepare variables for workflow execution
   */
  private prepareVariables(
    workflow: ChainedWorkflow,
    outputs: Map<string, Record<string, unknown>>,
    initialVariables?: Record<string, unknown>,
  ): Record<string, unknown> {
    const variables: Record<string, unknown> = { ...initialVariables };

    if (!workflow.data_mapping) {
      return variables;
    }

    // Apply data mappings
    workflow.data_mapping.mappings.forEach((mapping) => {
      const [workflowId, ...pathParts] = mapping.from.split(".");
      const output = outputs.get(workflowId);

      if (output) {
        const value = this.getNestedValue(output, pathParts.join("."));
        variables[mapping.to] = value;
      }
    });

    return variables;
  }

  /**
   * Wait for workflow execution to complete
   */
  private async waitForExecution(executionId: string): Promise<void> {
    const maxWait = 5 * 60 * 1000; // 5 minutes
    const pollInterval = 1000; // 1 second
    const startTime = Date.now();

    while (Date.now() - startTime < maxWait) {
      const execution = await orchestrationEngine.getExecution(executionId);

      if (
        execution &&
        (execution.status === "completed" || execution.status === "failed")
      ) {
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    throw new Error(`Execution timeout: ${executionId}`);
  }

  /**
   * Trigger workflow on completion of another
   */
  async triggerWorkflow(
    sourceExecutionId: string,
    targetWorkflowId: string,
    condition?: ChainCondition,
  ): Promise<Execution> {
    // Get source execution result
    const sourceExecution =
      await orchestrationEngine.getExecution(sourceExecutionId);

    if (!sourceExecution) {
      throw new Error(`Source execution not found: ${sourceExecutionId}`);
    }

    if (sourceExecution.status !== "completed") {
      throw new Error(
        `Source execution not completed: ${sourceExecution.status}`,
      );
    }

    // Check condition if provided
    if (condition) {
      const outputs = new Map<string, Record<string, unknown>>();
      outputs.set("source", sourceExecution.output as Record<string, unknown>);

      const conditionMet = await this.evaluateCondition(
        {
          workflow_id: targetWorkflowId,
          order: 0,
          depends_on: ["source"],
          condition,
        },
        outputs,
      );

      if (!conditionMet) {
        throw new Error("Trigger condition not met");
      }
    }

    // Trigger target workflow with source output as variables
    const execution = await orchestrationEngine.executeWorkflow({
      workflow_id: targetWorkflowId,
      trigger_type: "trigger",
      triggered_by: sourceExecutionId,
      variables: sourceExecution.output as Record<string, unknown>,
    });

    logger.info("Workflow triggered", {
      sourceExecutionId,
      targetWorkflowId,
      executionId: execution.id,
    });

    return execution;
  }

  /**
   * Pass data from one workflow to another
   */
  async passData(
    sourceExecutionId: string,
    targetWorkflowId: string,
    dataMapping: DataMapping,
  ): Promise<Record<string, unknown>> {
    const sourceExecution =
      await orchestrationEngine.getExecution(sourceExecutionId);

    if (!sourceExecution) {
      throw new Error(`Source execution not found: ${sourceExecutionId}`);
    }

    const sourceOutput =
      (sourceExecution.output as Record<string, unknown>) || {};
    const variables: Record<string, unknown> = {};

    // Apply mappings
    dataMapping.mappings.forEach((mapping) => {
      const value = this.getNestedValue(sourceOutput, mapping.from);
      variables[mapping.to] = value;
    });

    logger.info("Data passed between workflows", {
      sourceExecutionId,
      targetWorkflowId,
      mappings: dataMapping.mappings.length,
    });

    return variables;
  }

  /**
   * Conditional trigger based on workflow result
   */
  async conditionalTrigger(
    sourceExecutionId: string,
    targetWorkflowId: string,
    condition: ChainCondition,
  ): Promise<Execution | null> {
    try {
      return await this.triggerWorkflow(
        sourceExecutionId,
        targetWorkflowId,
        condition,
      );
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("condition not met")
      ) {
        logger.info("Conditional trigger skipped", {
          sourceExecutionId,
          targetWorkflowId,
        });
        return null;
      }
      throw error;
    }
  }

  /**
   * Get workflow status in chain
   */
  async getWorkflowStatus(chainId: string): Promise<WorkflowContext[]> {
    const db = getDatabase();

    const chainWorkflow = await db.get<Workflow>(
      "SELECT * FROM workflows WHERE id = ?",
      chainId,
    );

    if (!chainWorkflow) {
      throw new Error(`Workflow chain not found: ${chainId}`);
    }

    const definition =
      typeof chainWorkflow.definition === "string"
        ? JSON.parse(chainWorkflow.definition)
        : chainWorkflow.definition;

    if (definition.type !== "chain") {
      throw new Error("Workflow is not a chain");
    }

    const workflows: ChainedWorkflow[] = definition.workflows;
    const contexts: WorkflowContext[] = [];

    // Get status for each workflow in chain
    for (const wf of workflows) {
      const executions = await db.all<Execution[]>(
        `SELECT * FROM executions 
         WHERE workflow_id = ? AND trigger_type = 'chain'
         ORDER BY created_at DESC LIMIT 1`,
        wf.workflow_id,
      );

      const lastExecution = executions[0];

      contexts.push({
        workflow_id: wf.workflow_id,
        execution_id: lastExecution?.id,
        status: lastExecution?.status as any,
        output: lastExecution?.output as Record<string, unknown>,
        error: lastExecution?.error_message,
        started_at: lastExecution?.started_at,
        completed_at: lastExecution?.completed_at,
      });
    }

    return contexts;
  }
}

export const workflowDependenciesManager = new WorkflowDependenciesManager();
