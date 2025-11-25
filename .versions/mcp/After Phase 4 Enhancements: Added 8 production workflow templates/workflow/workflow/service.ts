/**
 * Workflow Service - Phase 1
 * Manages workflow CRUD operations
 */

import { getDatabase, generateId, getCurrentTimestamp } from '../db/database';
import { Workflow, CreateWorkflowInput } from '../db/models';
import { logger } from '../../utils/logger';

export class WorkflowService {
  /**
   * Create a new workflow
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
}

export const workflowService = new WorkflowService();
