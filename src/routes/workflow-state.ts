/**
 * Workflow State Management Routes
 * 
 * API endpoints for monitoring and managing workflow execution state
 */

import { Router, Request, Response } from 'express';
import {
  fetchWorkflowState,
  listActiveWorkflows,
  getActiveWorkflowsStatus,
  getWorkflowStatistics,
  cleanupStaleWorkflows,
} from '../services/workflow-state-manager';
import { authenticateToken } from '../auth/jwt';

const router = Router();

/**
 * Get workflow execution state
 * GET /api/workflow-state/:executionId
 */
router.get('/:executionId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { executionId } = req.params;

    const state = await fetchWorkflowState(executionId);

    if (!state) {
      res.status(404).json({
        success: false,
        error: 'Workflow state not found',
      });
      return;
    }

    res.json({
      success: true,
      state,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * List all active workflow executions
 * GET /api/workflow-state/active
 */
router.get('/active/list', authenticateToken, async (_req: Request, res: Response) => {
  try {
    const activeIds = await listActiveWorkflows();

    res.json({
      success: true,
      activeExecutions: activeIds,
      count: activeIds.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get detailed status of all active workflows
 * GET /api/workflow-state/active/detailed
 */
router.get('/active/detailed', authenticateToken, async (_req: Request, res: Response) => {
  try {
    const states = await getActiveWorkflowsStatus();

    res.json({
      success: true,
      workflows: states,
      count: states.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get workflow execution statistics
 * GET /api/workflow-state/stats
 */
router.get('/stats/overview', authenticateToken, async (_req: Request, res: Response) => {
  try {
    const statistics = await getWorkflowStatistics();

    res.json({
      success: true,
      statistics,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Clean up stale workflows
 * POST /api/workflow-state/cleanup
 */
router.post('/cleanup', authenticateToken, async (_req: Request, res: Response) => {
  try {
    const result = await cleanupStaleWorkflows();

    res.json({
      success: true,
      message: 'Cleanup completed',
      cleaned: result.cleaned,
      errors: result.errors,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
