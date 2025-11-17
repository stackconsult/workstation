/**
 * Phase 1 API Routes
 * Workflow and execution management endpoints
 */

import { Router, Request, Response } from 'express';
import { workflowService } from '../automation/workflow/service';
import { orchestrationEngine } from '../automation/orchestrator/engine';
import { authenticateToken, AuthenticatedRequest } from '../auth/jwt';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Create workflow
 * POST /api/v2/workflows
 */
router.post('/workflows', authenticateToken, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const workflow = await workflowService.createWorkflow({
      ...req.body,
      owner_id: authReq.user?.userId || 'anonymous'
    });

    res.status(201).json({
      success: true,
      data: workflow
    });
  } catch (error) {
    logger.error('Failed to create workflow', { error });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create workflow'
    });
  }
});

/**
 * List workflows
 * GET /api/v2/workflows
 */
router.get('/workflows', authenticateToken, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const workflows = await workflowService.listWorkflows(authReq.user?.userId);

    res.json({
      success: true,
      data: workflows
    });
  } catch (error) {
    logger.error('Failed to list workflows', { error });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list workflows'
    });
  }
});

/**
 * Get workflow by ID
 * GET /api/v2/workflows/:id
 */
router.get('/workflows/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const workflow = await workflowService.getWorkflow(req.params.id);

    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: 'Workflow not found'
      });
    }

    res.json({
      success: true,
      data: workflow
    });
  } catch (error) {
    logger.error('Failed to get workflow', { error });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get workflow'
    });
  }
});

/**
 * Execute workflow
 * POST /api/v2/workflows/:id/execute
 */
router.post('/workflows/:id/execute', authenticateToken, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    
    const execution = await orchestrationEngine.executeWorkflow({
      workflow_id: req.params.id,
      triggered_by: authReq.user?.userId,
      trigger_type: 'manual',
      variables: req.body.variables
    });

    res.status(202).json({
      success: true,
      data: execution,
      message: 'Workflow execution started'
    });
  } catch (error) {
    logger.error('Failed to execute workflow', { error });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to execute workflow'
    });
  }
});

/**
 * Get execution by ID
 * GET /api/v2/executions/:id
 */
router.get('/executions/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const execution = await orchestrationEngine.getExecution(req.params.id);

    if (!execution) {
      return res.status(404).json({
        success: false,
        error: 'Execution not found'
      });
    }

    res.json({
      success: true,
      data: execution
    });
  } catch (error) {
    logger.error('Failed to get execution', { error });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get execution'
    });
  }
});

/**
 * Get execution tasks
 * GET /api/v2/executions/:id/tasks
 */
router.get('/executions/:id/tasks', authenticateToken, async (req: Request, res: Response) => {
  try {
    const tasks = await orchestrationEngine.getExecutionTasks(req.params.id);

    res.json({
      success: true,
      data: tasks
    });
  } catch (error) {
    logger.error('Failed to get execution tasks', { error });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get execution tasks'
    });
  }
});

export default router;
