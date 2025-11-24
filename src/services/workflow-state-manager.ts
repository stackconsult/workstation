/**
 * Workflow State Manager - Redis-backed workflow execution tracking
 * 
 * Features:
 * - Real-time workflow state tracking
 * - Distributed locks for concurrent execution prevention
 * - Active execution monitoring
 * - Execution progress tracking
 */

import {
  setWorkflowState,
  getWorkflowState,
  deleteWorkflowState,
  acquireExecutionLock,
  releaseExecutionLock,
  checkExecutionLock,
  addActiveExecution,
  removeActiveExecution,
  getActiveExecutions,
  DEFAULT_TTL,
} from './redis';

export interface WorkflowState {
  executionId: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number; // 0-100
  currentStep: string;
  totalSteps: number;
  completedSteps: number;
  data: Record<string, any>;
  startedAt: number;
  updatedAt: number;
  estimatedCompletion?: number;
  error?: string;
}

export interface ExecutionLock {
  executionId: string;
  workerId: string;
  acquiredAt: number;
  expiresAt: number;
}

/**
 * Update workflow execution state
 */
export async function updateWorkflowState(state: WorkflowState): Promise<boolean> {
  state.updatedAt = Date.now();
  return await setWorkflowState(state.executionId, state);
}

/**
 * Get workflow execution state
 */
export async function fetchWorkflowState(executionId: string): Promise<WorkflowState | null> {
  const state = await getWorkflowState(executionId);
  return state as WorkflowState | null;
}

/**
 * Clear workflow execution state
 */
export async function clearWorkflowState(executionId: string): Promise<boolean> {
  return await deleteWorkflowState(executionId);
}

/**
 * Start tracking a workflow execution
 */
export async function startWorkflowTracking(
  executionId: string,
  workflowId: string,
  totalSteps: number,
  data: Record<string, any> = {}
): Promise<boolean> {
  const state: WorkflowState = {
    executionId,
    workflowId,
    status: 'running',
    progress: 0,
    currentStep: 'initializing',
    totalSteps,
    completedSteps: 0,
    data,
    startedAt: Date.now(),
    updatedAt: Date.now(),
  };

  // Save state and mark as active
  const saved = await updateWorkflowState(state);
  if (saved) {
    await addActiveExecution(executionId);
  }

  return saved;
}

/**
 * Update workflow progress
 */
export async function updateWorkflowProgress(
  executionId: string,
  completedSteps: number,
  currentStep: string,
  additionalData?: Record<string, any>
): Promise<boolean> {
  const state = await fetchWorkflowState(executionId);
  if (!state) {
    console.error(`Workflow state not found for execution: ${executionId}`);
    return false;
  }

  state.completedSteps = completedSteps;
  state.currentStep = currentStep;
  state.progress = Math.round((completedSteps / state.totalSteps) * 100);
  
  if (additionalData) {
    state.data = { ...state.data, ...additionalData };
  }

  // Estimate completion time based on current progress
  if (state.progress > 0 && state.progress < 100) {
    const elapsed = Date.now() - state.startedAt;
    const estimatedTotal = (elapsed / state.progress) * 100;
    state.estimatedCompletion = state.startedAt + estimatedTotal;
  }

  return await updateWorkflowState(state);
}

/**
 * Complete workflow execution
 */
export async function completeWorkflowTracking(
  executionId: string,
  status: 'completed' | 'failed' | 'cancelled',
  error?: string,
  finalData?: Record<string, any>
): Promise<boolean> {
  const state = await fetchWorkflowState(executionId);
  if (!state) {
    console.error(`Workflow state not found for execution: ${executionId}`);
    return false;
  }

  state.status = status;
  state.progress = status === 'completed' ? 100 : state.progress;
  state.error = error;
  
  if (finalData) {
    state.data = { ...state.data, ...finalData };
  }

  // Save final state (with longer TTL for completed workflows)
  const ttl: number = status === 'completed' ? DEFAULT_TTL.WORKFLOW_STATE * 2 : DEFAULT_TTL.WORKFLOW_STATE;
  const saved = await setWorkflowState(executionId, state, ttl);

  // Remove from active executions
  if (saved) {
    await removeActiveExecution(executionId);
  }

  return saved;
}

/**
 * Acquire exclusive lock for workflow execution
 */
export async function lockWorkflowExecution(
  executionId: string,
  workerId: string
): Promise<boolean> {
  return await acquireExecutionLock(executionId, workerId, DEFAULT_TTL.EXECUTION_LOCK);
}

/**
 * Release workflow execution lock
 */
export async function unlockWorkflowExecution(executionId: string): Promise<boolean> {
  return await releaseExecutionLock(executionId);
}

/**
 * Check if workflow execution is locked
 */
export async function isWorkflowLocked(executionId: string): Promise<{ locked: boolean; workerId?: string }> {
  const workerId = await checkExecutionLock(executionId);
  return {
    locked: workerId !== null,
    workerId: workerId || undefined,
  };
}

/**
 * Get all currently active workflow executions
 */
export async function listActiveWorkflows(): Promise<string[]> {
  return await getActiveExecutions();
}

/**
 * Get detailed status of all active workflows
 */
export async function getActiveWorkflowsStatus(): Promise<WorkflowState[]> {
  const activeIds = await getActiveExecutions();
  const states: WorkflowState[] = [];

  for (const id of activeIds) {
    const state = await fetchWorkflowState(id);
    if (state) {
      states.push(state);
    }
  }

  return states;
}

/**
 * Clean up stale workflow states
 * (Should be called periodically via cron job)
 */
export async function cleanupStaleWorkflows(): Promise<{ cleaned: number; errors: number }> {
  const activeIds = await getActiveExecutions();
  let cleaned = 0;
  let errors = 0;

  for (const id of activeIds) {
    try {
      const state = await fetchWorkflowState(id);
      
      // If state doesn't exist or workflow is stuck for > 1 hour
      if (!state || (Date.now() - state.updatedAt > 3600000 && state.status === 'running')) {
        await removeActiveExecution(id);
        if (state) {
          await completeWorkflowTracking(id, 'failed', 'Workflow timed out or became unresponsive');
        }
        cleaned++;
      }
    } catch (error) {
      console.error(`Error cleaning up execution ${id}:`, error);
      errors++;
    }
  }

  return { cleaned, errors };
}

/**
 * Get workflow execution statistics
 */
export async function getWorkflowStatistics(): Promise<{
  activeExecutions: number;
  executionsByStatus: Record<string, number>;
  averageProgress: number;
}> {
  const states = await getActiveWorkflowsStatus();

  const statistics = {
    activeExecutions: states.length,
    executionsByStatus: {
      pending: 0,
      running: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
    },
    averageProgress: 0,
  };

  if (states.length === 0) {
    return statistics;
  }

  let totalProgress = 0;

  for (const state of states) {
    statistics.executionsByStatus[state.status]++;
    totalProgress += state.progress;
  }

  statistics.averageProgress = Math.round(totalProgress / states.length);

  return statistics;
}

/**
 * Workflow execution guard - prevents duplicate concurrent executions
 */
export async function executeWithLock<T>(
  executionId: string,
  workerId: string,
  fn: () => Promise<T>
): Promise<T> {
  // Try to acquire lock
  const locked = await lockWorkflowExecution(executionId, workerId);
  
  if (!locked) {
    const lockInfo = await isWorkflowLocked(executionId);
    throw new Error(
      `Workflow execution ${executionId} is already locked by worker ${lockInfo.workerId || 'unknown'}`
    );
  }

  try {
    // Execute the function
    const result = await fn();
    return result;
  } finally {
    // Always release lock
    await unlockWorkflowExecution(executionId);
  }
}
