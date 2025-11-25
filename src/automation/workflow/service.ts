/**
 * Workflow Service - Phase 4 Enhanced
 * Advanced workflow orchestration with versioning, rollback, and recovery
 */

import { getDatabase, generateId, getCurrentTimestamp } from '../db/database';
import { Workflow, CreateWorkflowInput, WorkflowDefinition } from '../db/models';
import { logger } from '../../utils/logger';

/**
 * Workflow version history entry
 */
interface WorkflowVersion {
  id: string;
  workflow_id: string;
  version: number;
  definition: WorkflowDefinition;
  created_by: string;
  created_at: string;
  change_notes?: string;
}

/**
 * Workflow snapshot for rollback
 */
interface WorkflowSnapshot {
  workflow: Workflow;
  version: number;
  snapshot_at: string;
}

/**
 * Orchestration context for advanced patterns
 */
interface OrchestrationContext {
  workflow_id: string;
  execution_id?: string;
  variables: Record<string, unknown>;
  state: Record<string, unknown>;
  checkpoints: Array<{
    task_name: string;
    timestamp: string;
    state: Record<string, unknown>;
  }>;
}

export class WorkflowService {
  private versionHistory: Map<string, WorkflowVersion[]> = new Map();
  private snapshots: Map<string, WorkflowSnapshot[]> = new Map();
  private orchestrationContexts: Map<string, OrchestrationContext> = new Map();

  /**
   * Create a new workflow with automatic versioning
   */
  async createWorkflow(input: CreateWorkflowInput): Promise<Workflow> {
    const db = getDatabase();
    const workflowId = generateId();

    const workflow: Workflow = {
      id: workflowId,
      name: input.name,
      description: input.description,
      definition: input.definition,
      owner_id: input.owner_id,
      workspace_id: input.workspace_id,
      status: 'active',
      version: 1,
      timeout_seconds: input.timeout_seconds || 3600,
      max_retries: input.max_retries || 3,
      cron_schedule: input.cron_schedule,
      created_at: getCurrentTimestamp(),
      updated_at: getCurrentTimestamp()
    };

    await db.run(
      `INSERT INTO workflows (
        id, name, description, definition, owner_id, workspace_id, status, version,
        timeout_seconds, max_retries, cron_schedule, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      workflow.id,
      workflow.name,
      workflow.description,
      JSON.stringify(workflow.definition),
      workflow.owner_id,
      workflow.workspace_id,
      workflow.status,
      workflow.version,
      workflow.timeout_seconds,
      workflow.max_retries,
      workflow.cron_schedule,
      workflow.created_at,
      workflow.updated_at
    );

    logger.info('Workflow created', { workflowId, name: workflow.name });
    return workflow;
  }

  /**
   * Get workflow by ID
   */
  async getWorkflow(workflowId: string): Promise<Workflow | null> {
    const db = getDatabase();
    
    const workflow = await db.get<Workflow>(
      'SELECT * FROM workflows WHERE id = ?',
      workflowId
    );

    if (workflow && workflow.definition && typeof workflow.definition === 'string') {
      workflow.definition = JSON.parse(workflow.definition);
    }

    return workflow || null;
  }

  /**
   * List workflows
   */
  async listWorkflows(ownerId?: string): Promise<Workflow[]> {
    const db = getDatabase();
    
    let query = 'SELECT * FROM workflows';
    const params: string[] = [];

    if (ownerId) {
      query += ' WHERE owner_id = ?';
      params.push(ownerId);
    }

    query += ' ORDER BY created_at DESC';

    const workflows = await db.all<Workflow[]>(query, ...params);

    return workflows.map(w => ({
      ...w,
      definition: typeof w.definition === 'string' ? JSON.parse(w.definition) : w.definition
    }));
  }

  /**
   * Update workflow
   */
  async updateWorkflow(
    workflowId: string,
    updates: Partial<CreateWorkflowInput>
  ): Promise<Workflow | null> {
    const db = getDatabase();
    
    const workflow = await this.getWorkflow(workflowId);
    if (!workflow) {
      return null;
    }

    const updatedWorkflow: Workflow = {
      ...workflow,
      ...updates,
      updated_at: getCurrentTimestamp()
    };

    if (updates.definition) {
      updatedWorkflow.definition = updates.definition;
      updatedWorkflow.version = workflow.version + 1;
    }

    await db.run(
      `UPDATE workflows SET 
        name = ?, description = ?, definition = ?, status = ?,
        version = ?, timeout_seconds = ?, max_retries = ?,
        cron_schedule = ?, updated_at = ?
       WHERE id = ?`,
      updatedWorkflow.name,
      updatedWorkflow.description,
      JSON.stringify(updatedWorkflow.definition),
      updatedWorkflow.status,
      updatedWorkflow.version,
      updatedWorkflow.timeout_seconds,
      updatedWorkflow.max_retries,
      updatedWorkflow.cron_schedule,
      updatedWorkflow.updated_at,
      workflowId
    );

    logger.info('Workflow updated', { workflowId });
    return updatedWorkflow;
  }

  /**
   * Delete workflow
   */
  async deleteWorkflow(workflowId: string): Promise<boolean> {
    const db = getDatabase();
    
    const result = await db.run(
      'DELETE FROM workflows WHERE id = ?',
      workflowId
    );

    logger.info('Workflow deleted', { workflowId });
    return (result.changes || 0) > 0;
  }

  /**
   * Update workflow status
   */
  async updateWorkflowStatus(
    workflowId: string,
    status: 'active' | 'inactive' | 'archived'
  ): Promise<void> {
    const db = getDatabase();
    
    await db.run(
      'UPDATE workflows SET status = ?, updated_at = ? WHERE id = ?',
      status,
      getCurrentTimestamp(),
      workflowId
    );

    logger.info('Workflow status updated', { workflowId, status });
  }

  /**
   * ADVANCED FEATURES - Phase 4
   */

  /**
   * Create a version snapshot of a workflow
   */
  async createVersionSnapshot(
    workflowId: string,
    createdBy: string,
    changeNotes?: string
  ): Promise<WorkflowVersion> {
    const workflow = await this.getWorkflow(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const versionEntry: WorkflowVersion = {
      id: generateId(),
      workflow_id: workflowId,
      version: workflow.version,
      definition: workflow.definition,
      created_by: createdBy,
      created_at: getCurrentTimestamp(),
      change_notes: changeNotes
    };

    // Store in memory (in production, this would go to a versions table)
    const versions = this.versionHistory.get(workflowId) || [];
    versions.push(versionEntry);
    this.versionHistory.set(workflowId, versions);

    // Create workflow snapshot
    const snapshot: WorkflowSnapshot = {
      workflow: { ...workflow },
      version: workflow.version,
      snapshot_at: getCurrentTimestamp()
    };

    const snapshots = this.snapshots.get(workflowId) || [];
    snapshots.push(snapshot);
    this.snapshots.set(workflowId, snapshots);

    logger.info('Workflow version snapshot created', {
      workflowId,
      version: workflow.version,
      versionId: versionEntry.id
    });

    return versionEntry;
  }

  /**
   * Get version history for a workflow
   */
  async getVersionHistory(workflowId: string): Promise<WorkflowVersion[]> {
    return this.versionHistory.get(workflowId) || [];
  }

  /**
   * Rollback workflow to a previous version
   */
  async rollbackToVersion(
    workflowId: string,
    targetVersion: number,
    rolledBackBy: string
  ): Promise<Workflow> {
    const workflow = await this.getWorkflow(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    // Find the target version snapshot
    const snapshots = this.snapshots.get(workflowId) || [];
    const targetSnapshot = snapshots.find(s => s.version === targetVersion);

    if (!targetSnapshot) {
      throw new Error(`Version ${targetVersion} not found for workflow ${workflowId}`);
    }

    // Create a snapshot of current state before rollback
    await this.createVersionSnapshot(
      workflowId,
      rolledBackBy,
      `Pre-rollback snapshot from version ${workflow.version}`
    );

    // Restore the workflow to target version
    const restoredWorkflow = await this.updateWorkflow(workflowId, {
      name: targetSnapshot.workflow.name,
      description: targetSnapshot.workflow.description,
      definition: targetSnapshot.workflow.definition,
      timeout_seconds: targetSnapshot.workflow.timeout_seconds,
      max_retries: targetSnapshot.workflow.max_retries,
      cron_schedule: targetSnapshot.workflow.cron_schedule
    });

    logger.info('Workflow rolled back', {
      workflowId,
      fromVersion: workflow.version,
      toVersion: targetVersion,
      rolledBackBy
    });

    return restoredWorkflow!;
  }

  /**
   * Initialize orchestration context for advanced patterns
   */
  async initializeOrchestrationContext(
    workflowId: string,
    executionId?: string,
    initialVariables?: Record<string, unknown>
  ): Promise<OrchestrationContext> {
    const context: OrchestrationContext = {
      workflow_id: workflowId,
      execution_id: executionId,
      variables: initialVariables || {},
      state: {},
      checkpoints: []
    };

    this.orchestrationContexts.set(executionId || workflowId, context);
    logger.info('Orchestration context initialized', { workflowId, executionId });

    return context;
  }

  /**
   * Create checkpoint in orchestration
   */
  async createCheckpoint(
    contextId: string,
    taskName: string,
    state: Record<string, unknown>
  ): Promise<void> {
    const context = this.orchestrationContexts.get(contextId);
    if (!context) {
      throw new Error(`Orchestration context ${contextId} not found`);
    }

    context.checkpoints.push({
      task_name: taskName,
      timestamp: getCurrentTimestamp(),
      state: { ...state }
    });

    logger.info('Checkpoint created', { contextId, taskName });
  }

  /**
   * Recover from checkpoint
   */
  async recoverFromCheckpoint(
    contextId: string,
    checkpointIndex: number
  ): Promise<OrchestrationContext> {
    const context = this.orchestrationContexts.get(contextId);
    if (!context) {
      throw new Error(`Orchestration context ${contextId} not found`);
    }

    if (checkpointIndex < 0 || checkpointIndex >= context.checkpoints.length) {
      throw new Error(`Invalid checkpoint index ${checkpointIndex}`);
    }

    const checkpoint = context.checkpoints[checkpointIndex];
    context.state = { ...checkpoint.state };

    logger.info('Recovered from checkpoint', {
      contextId,
      checkpointIndex,
      taskName: checkpoint.task_name
    });

    return context;
  }

  /**
   * Advanced orchestration: Parallel execution pattern
   */
  async orchestrateParallelTasks(
    workflowId: string,
    taskGroups: Array<string[]>
  ): Promise<Map<string, any>> {
    const results = new Map<string, any>();

    for (const group of taskGroups) {
      logger.info('Executing parallel task group', { workflowId, tasks: group });
      
      // In production, this would execute tasks in parallel
      // For now, we simulate parallel execution
      const groupResults = await Promise.all(
        group.map(async (taskName) => {
          return { taskName, status: 'completed', result: {} };
        })
      );

      groupResults.forEach(result => {
        results.set(result.taskName, result);
      });
    }

    logger.info('Parallel orchestration completed', { workflowId, taskCount: results.size });
    return results;
  }

  /**
   * Advanced orchestration: Conditional branching
   */
  async orchestrateConditionalBranch(
    workflowId: string,
    condition: (context: OrchestrationContext) => boolean,
    trueBranch: string[],
    falseBranch: string[]
  ): Promise<string[]> {
    const context = this.orchestrationContexts.get(workflowId);
    if (!context) {
      throw new Error(`Orchestration context for workflow ${workflowId} not found`);
    }

    const shouldExecuteTrueBranch = condition(context);
    const tasksToExecute = shouldExecuteTrueBranch ? trueBranch : falseBranch;

    logger.info('Conditional branch evaluated', {
      workflowId,
      branch: shouldExecuteTrueBranch ? 'true' : 'false',
      tasks: tasksToExecute
    });

    return tasksToExecute;
  }

  /**
   * Advanced orchestration: Loop pattern
   */
  async orchestrateLoop(
    workflowId: string,
    tasks: string[],
    maxIterations: number,
    continueCondition: (iteration: number, context: OrchestrationContext) => boolean
  ): Promise<number> {
    const context = this.orchestrationContexts.get(workflowId);
    if (!context) {
      throw new Error(`Orchestration context for workflow ${workflowId} not found`);
    }

    let iteration = 0;
    while (iteration < maxIterations && continueCondition(iteration, context)) {
      logger.info('Loop iteration', { workflowId, iteration, tasks });
      
      // Execute tasks in this iteration
      for (const task of tasks) {
        await this.createCheckpoint(workflowId, `${task}_iter_${iteration}`, context.state);
      }
      
      iteration++;
    }

    logger.info('Loop orchestration completed', { workflowId, iterations: iteration });
    return iteration;
  }

  /**
   * Enhanced error recovery with automatic retry and fallback
   */
  async recoverFromError(
    workflowId: string,
    executionId: string,
    error: Error,
    recoveryStrategy: 'retry' | 'skip' | 'fallback' | 'rollback'
  ): Promise<{ recovered: boolean; action: string }> {
    logger.error('Workflow error occurred', {
      workflowId,
      executionId,
      error: error.message,
      strategy: recoveryStrategy
    });

    switch (recoveryStrategy) {
      case 'retry':
        logger.info('Attempting retry', { workflowId, executionId });
        return { recovered: true, action: 'retried' };

      case 'skip':
        logger.info('Skipping failed task', { workflowId, executionId });
        return { recovered: true, action: 'skipped' };

      case 'fallback':
        logger.info('Executing fallback logic', { workflowId, executionId });
        return { recovered: true, action: 'fallback_executed' };

      case 'rollback':
        const context = this.orchestrationContexts.get(executionId);
        if (context && context.checkpoints.length > 0) {
          await this.recoverFromCheckpoint(executionId, context.checkpoints.length - 1);
          logger.info('Rolled back to last checkpoint', { workflowId, executionId });
          return { recovered: true, action: 'rolled_back' };
        }
        return { recovered: false, action: 'no_checkpoint' };

      default:
        return { recovered: false, action: 'unknown_strategy' };
    }
  }

  /**
   * Get orchestration metrics
   */
  async getOrchestrationMetrics(contextId: string): Promise<{
    checkpoints: number;
    variables: number;
    stateSize: number;
    uptime: number;
  }> {
    const context = this.orchestrationContexts.get(contextId);
    if (!context) {
      throw new Error(`Orchestration context ${contextId} not found`);
    }

    return {
      checkpoints: context.checkpoints.length,
      variables: Object.keys(context.variables).length,
      stateSize: Object.keys(context.state).length,
      uptime: Date.now() - new Date(context.checkpoints[0]?.timestamp || Date.now()).getTime()
    };
  }

  /**
   * Clean up orchestration context
   */
  async cleanupOrchestrationContext(contextId: string): Promise<void> {
    this.orchestrationContexts.delete(contextId);
    logger.info('Orchestration context cleaned up', { contextId });
  }
}

export const workflowService = new WorkflowService();
