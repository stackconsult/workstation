/**
 * Workflow Orchestration Engine - Phase 1
 * Executes workflows by coordinating tasks across agents
 */

import { getDatabase, generateId, getCurrentTimestamp } from '../db/database';
import { Workflow, Execution, Task, ExecuteWorkflowInput, WorkflowTask } from '../db/models';
import { agentRegistry } from '../agents/core/registry';
import { logger } from '../../utils/logger';

export class OrchestrationEngine {
  /**
   * Execute a workflow
   */
  async executeWorkflow(input: ExecuteWorkflowInput): Promise<Execution> {
    const db = getDatabase();
    
    // Get workflow
    const workflow = await db.get<Workflow>(
      'SELECT * FROM workflows WHERE id = ?',
      input.workflow_id
    );

    if (!workflow) {
      throw new Error(`Workflow not found: ${input.workflow_id}`);
    }

    if (workflow.status !== 'active') {
      throw new Error(`Workflow is not active: ${workflow.status}`);
    }

    // Create execution record
    const executionId = generateId();
    const execution: Execution = {
      id: executionId,
      workflow_id: workflow.id,
      status: 'pending',
      trigger_type: input.trigger_type || 'manual',
      triggered_by: input.triggered_by,
      created_at: getCurrentTimestamp()
    };

    await db.run(
      `INSERT INTO executions (id, workflow_id, status, trigger_type, triggered_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      execution.id,
      execution.workflow_id,
      execution.status,
      execution.trigger_type,
      execution.triggered_by,
      execution.created_at
    );

    logger.info('Execution created', { executionId, workflowId: workflow.id });

    // Execute workflow asynchronously
    this.runWorkflow(execution, workflow, input.variables).catch(error => {
      logger.error('Workflow execution failed', { executionId, error });
    });

    return execution;
  }

  /**
   * Run workflow tasks
   */
  private async runWorkflow(
    execution: Execution,
    workflow: Workflow,
    variables?: Record<string, unknown>
  ): Promise<void> {
    const db = getDatabase();
    const startTime = Date.now();

    try {
      // Update execution status to running
      await db.run(
        'UPDATE executions SET status = ?, started_at = ? WHERE id = ?',
        'running',
        getCurrentTimestamp(),
        execution.id
      );

      const definition = typeof workflow.definition === 'string' 
        ? JSON.parse(workflow.definition) 
        : workflow.definition;

      // Execute tasks in sequence (Phase 1: simple sequential execution)
      const taskResults: Record<string, unknown> = {};
      
      for (const taskDef of definition.tasks) {
        const taskResult = await this.executeTask(
          execution.id,
          taskDef,
          { ...variables, ...taskResults },
          workflow.max_retries
        );
        
        if (taskResult.status === 'failed') {
          if (definition.on_error === 'continue') {
            logger.warn('Task failed but continuing', { taskId: taskResult.id });
          } else {
            throw new Error(`Task failed: ${taskResult.error_message}`);
          }
        }
        
        taskResults[taskDef.name] = taskResult.output;
      }

      // Mark execution as completed
      const duration = Date.now() - startTime;
      await db.run(
        `UPDATE executions SET status = ?, completed_at = ?, duration_ms = ?, output = ?
         WHERE id = ?`,
        'completed',
        getCurrentTimestamp(),
        duration,
        JSON.stringify(taskResults),
        execution.id
      );

      logger.info('Workflow completed', { executionId: execution.id, duration });
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      await db.run(
        `UPDATE executions SET status = ?, completed_at = ?, duration_ms = ?, error_message = ?
         WHERE id = ?`,
        'failed',
        getCurrentTimestamp(),
        duration,
        errorMessage,
        execution.id
      );

      logger.error('Workflow failed', { executionId: execution.id, error });
    }
  }

  /**
   * Execute a single task
   */
  private async executeTask(
    executionId: string,
    taskDef: WorkflowTask,
    variables: Record<string, unknown>,
    maxRetries: number
  ): Promise<Task> {
    const db = getDatabase();
    const taskId = generateId();

    // Create task record
    const task: Task = {
      id: taskId,
      execution_id: executionId,
      name: taskDef.name,
      agent_type: taskDef.agent_type,
      action: taskDef.action,
      parameters: taskDef.parameters,
      status: 'queued',
      retry_count: 0,
      queued_at: getCurrentTimestamp()
    };

    await db.run(
      `INSERT INTO tasks (id, execution_id, name, agent_type, action, parameters, status, retry_count, queued_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      task.id,
      task.execution_id,
      task.name,
      task.agent_type,
      task.action,
      JSON.stringify(task.parameters),
      task.status,
      task.retry_count,
      task.queued_at
    );

    // Execute task with retries
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Update task status to running
        await db.run(
          'UPDATE tasks SET status = ?, started_at = ? WHERE id = ?',
          'running',
          getCurrentTimestamp(),
          task.id
        );

        // Get agent and execute
        const agent = await agentRegistry.getAgent(task.agent_type, task.action);
        if (!agent) {
          throw new Error(`Agent not found: ${task.agent_type}:${task.action}`);
        }

        // Replace variables in parameters
        const params = this.replaceVariables(task.parameters, variables);
        const output = await agent.execute(params);

        // Update task as completed
        await db.run(
          `UPDATE tasks SET status = ?, completed_at = ?, output = ? WHERE id = ?`,
          'completed',
          getCurrentTimestamp(),
          JSON.stringify(output),
          task.id
        );

        task.status = 'completed';
        task.output = output as Record<string, unknown>;
        task.completed_at = getCurrentTimestamp();

        logger.info('Task completed', { taskId, taskName: task.name });
        return task;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        task.retry_count = attempt + 1;

        await db.run(
          'UPDATE tasks SET retry_count = ? WHERE id = ?',
          task.retry_count,
          task.id
        );

        logger.warn('Task attempt failed', { 
          taskId, 
          attempt: attempt + 1, 
          maxRetries, 
          error: lastError.message 
        });

        if (attempt < maxRetries) {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    // All retries failed
    await db.run(
      `UPDATE tasks SET status = ?, completed_at = ?, error_message = ? WHERE id = ?`,
      'failed',
      getCurrentTimestamp(),
      lastError?.message || 'Unknown error',
      task.id
    );

    task.status = 'failed';
    task.error_message = lastError?.message || 'Unknown error';
    task.completed_at = getCurrentTimestamp();

    logger.error('Task failed after retries', { taskId, taskName: task.name });
    return task;
  }

  /**
   * Replace variables in parameters
   */
  private replaceVariables(
    params: Record<string, unknown>,
    variables: Record<string, unknown>
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string' && value.startsWith('${') && value.endsWith('}')) {
        const varName = value.slice(2, -1);
        result[key] = variables[varName] || value;
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  /**
   * Cancel an execution
   */
  async cancelExecution(executionId: string): Promise<void> {
    const db = getDatabase();

    await db.run(
      `UPDATE executions SET status = ?, completed_at = ? WHERE id = ? AND status IN ('pending', 'running')`,
      'cancelled',
      getCurrentTimestamp(),
      executionId
    );

    logger.info('Execution cancelled', { executionId });
  }

  /**
   * Get execution status
   */
  async getExecution(executionId: string): Promise<Execution | null> {
    const db = getDatabase();
    
    const execution = await db.get<Execution>(
      'SELECT * FROM executions WHERE id = ?',
      executionId
    );

    if (execution && execution.output && typeof execution.output === 'string') {
      execution.output = JSON.parse(execution.output);
    }

    return execution || null;
  }

  /**
   * Get tasks for an execution
   */
  async getExecutionTasks(executionId: string): Promise<Task[]> {
    const db = getDatabase();
    
    const tasks = await db.all<Task[]>(
      'SELECT * FROM tasks WHERE execution_id = ? ORDER BY queued_at ASC',
      executionId
    );

    return tasks.map(task => ({
      ...task,
      parameters: typeof task.parameters === 'string' ? JSON.parse(task.parameters) : task.parameters,
      output: task.output && typeof task.output === 'string' ? JSON.parse(task.output) : task.output
    }));
  }
}

export const orchestrationEngine = new OrchestrationEngine();
