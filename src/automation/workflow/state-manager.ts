/**
 * Workflow State Manager
 *
 * Manages execution state, checkpoints, and recovery for workflows.
 * Provides real-time state tracking and persistence.
 *
 * @module automation/workflow/state-manager
 * @version 2.0.0
 */

import { logger } from "../../shared/utils/logger.js";

export interface ExecutionState {
  executionId: string;
  workflowId: string;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  currentStep: number;
  totalSteps: number;
  progress: number;
  variables: Record<string, any>;
  stepStates: Map<string, StepState>;
  checkpoints: Checkpoint[];
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
  error?: string;
}

export interface StepState {
  stepId: string;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  startedAt?: string;
  completedAt?: string;
  result?: any;
  error?: string;
  retryCount: number;
}

export interface Checkpoint {
  id: string;
  stepId: string;
  timestamp: string;
  state: Record<string, any>;
}

export interface StateUpdate {
  status?: ExecutionState["status"];
  currentStep?: number;
  progress?: number;
  error?: string;
}

/**
 * State Manager Class
 */
export class StateManager {
  private states: Map<string, ExecutionState> = new Map();
  private stateListeners: Map<string, Set<(state: ExecutionState) => void>> =
    new Map();
  private checkpointRetention = 100; // Keep last 100 checkpoints

  /**
   * Create new execution state
   */
  createState(
    executionId: string,
    workflowId: string,
    totalSteps: number,
    variables: Record<string, any> = {},
  ): ExecutionState {
    const state: ExecutionState = {
      executionId,
      workflowId,
      status: "pending",
      currentStep: 0,
      totalSteps,
      progress: 0,
      variables,
      stepStates: new Map(),
      checkpoints: [],
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.states.set(executionId, state);
    this.notifyListeners(executionId, state);

    logger.info("Execution state created", { executionId, workflowId });
    return state;
  }

  /**
   * Get execution state
   */
  getState(executionId: string): ExecutionState | null {
    return this.states.get(executionId) || null;
  }

  /**
   * Update execution state
   */
  updateState(executionId: string, update: StateUpdate): ExecutionState | null {
    const state = this.states.get(executionId);
    if (!state) {
      logger.warn("Execution state not found", { executionId });
      return null;
    }

    // Apply updates
    if (update.status !== undefined) {
      state.status = update.status;
    }

    if (update.currentStep !== undefined) {
      state.currentStep = update.currentStep;
    }

    if (update.progress !== undefined) {
      state.progress = update.progress;
    } else if (update.currentStep !== undefined && state.totalSteps > 0) {
      // Auto-calculate progress from current step
      state.progress = Math.round(
        (update.currentStep / state.totalSteps) * 100,
      );
    }

    if (update.error !== undefined) {
      state.error = update.error;
    }

    // Mark as completed if status is terminal
    if (
      state.status === "completed" ||
      state.status === "failed" ||
      state.status === "cancelled"
    ) {
      if (!state.completedAt) {
        state.completedAt = new Date().toISOString();
      }
    }

    state.updatedAt = new Date().toISOString();
    this.notifyListeners(executionId, state);

    logger.debug("Execution state updated", { executionId, update });
    return state;
  }

  /**
   * Update step state
   */
  updateStepState(
    executionId: string,
    stepId: string,
    stepUpdate: Partial<StepState>,
  ): boolean {
    const state = this.states.get(executionId);
    if (!state) {
      return false;
    }

    let stepState = state.stepStates.get(stepId);
    if (!stepState) {
      stepState = {
        stepId,
        status: "pending",
        retryCount: 0,
      };
      state.stepStates.set(stepId, stepState);
    }

    // Apply updates
    Object.assign(stepState, stepUpdate);
    state.updatedAt = new Date().toISOString();

    this.notifyListeners(executionId, state);

    logger.debug("Step state updated", { executionId, stepId, stepUpdate });
    return true;
  }

  /**
   * Create checkpoint
   */
  createCheckpoint(
    executionId: string,
    stepId: string,
    checkpointState: Record<string, any>,
  ): Checkpoint | null {
    const state = this.states.get(executionId);
    if (!state) {
      return null;
    }

    const checkpoint: Checkpoint = {
      id: `cp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      stepId,
      timestamp: new Date().toISOString(),
      state: { ...checkpointState },
    };

    state.checkpoints.push(checkpoint);

    // Limit checkpoint retention
    if (state.checkpoints.length > this.checkpointRetention) {
      state.checkpoints = state.checkpoints.slice(-this.checkpointRetention);
    }

    state.updatedAt = new Date().toISOString();
    this.notifyListeners(executionId, state);

    logger.info("Checkpoint created", {
      executionId,
      checkpointId: checkpoint.id,
      stepId,
    });
    return checkpoint;
  }

  /**
   * Restore from checkpoint
   */
  restoreFromCheckpoint(executionId: string, checkpointId: string): boolean {
    const state = this.states.get(executionId);
    if (!state) {
      return false;
    }

    const checkpoint = state.checkpoints.find((cp) => cp.id === checkpointId);
    if (!checkpoint) {
      logger.warn("Checkpoint not found", { executionId, checkpointId });
      return false;
    }

    // Restore state from checkpoint
    state.variables = { ...checkpoint.state };
    state.updatedAt = new Date().toISOString();

    this.notifyListeners(executionId, state);

    logger.info("State restored from checkpoint", {
      executionId,
      checkpointId,
      stepId: checkpoint.stepId,
    });

    return true;
  }

  /**
   * Get latest checkpoint
   */
  getLatestCheckpoint(executionId: string): Checkpoint | null {
    const state = this.states.get(executionId);
    if (!state || state.checkpoints.length === 0) {
      return null;
    }

    return state.checkpoints[state.checkpoints.length - 1];
  }

  /**
   * Delete execution state
   */
  deleteState(executionId: string): boolean {
    const deleted = this.states.delete(executionId);

    if (deleted) {
      // Clean up listeners
      this.stateListeners.delete(executionId);
      logger.info("Execution state deleted", { executionId });
    }

    return deleted;
  }

  /**
   * Get all active executions
   */
  getActiveExecutions(): ExecutionState[] {
    return Array.from(this.states.values()).filter(
      (state) => state.status === "running" || state.status === "pending",
    );
  }

  /**
   * Get execution count by status
   */
  getExecutionCountByStatus(status: ExecutionState["status"]): number {
    return Array.from(this.states.values()).filter(
      (state) => state.status === status,
    ).length;
  }

  /**
   * Subscribe to state changes
   */
  subscribe(
    executionId: string,
    callback: (state: ExecutionState) => void,
  ): () => void {
    if (!this.stateListeners.has(executionId)) {
      this.stateListeners.set(executionId, new Set());
    }

    this.stateListeners.get(executionId)!.add(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.stateListeners.get(executionId);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.stateListeners.delete(executionId);
        }
      }
    };
  }

  /**
   * Notify state listeners
   */
  private notifyListeners(executionId: string, state: ExecutionState): void {
    const listeners = this.stateListeners.get(executionId);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(state);
        } catch (error) {
          logger.error("Error in state listener", {
            executionId,
            error: (error as Error).message,
          });
        }
      });
    }
  }

  /**
   * Cleanup old states
   */
  cleanup(maxAge: number = 3600000): number {
    const now = Date.now();
    let cleaned = 0;

    this.states.forEach((state, executionId) => {
      // Only cleanup completed/failed/cancelled states
      if (
        state.status === "completed" ||
        state.status === "failed" ||
        state.status === "cancelled"
      ) {
        const updatedAt = new Date(state.updatedAt).getTime();
        if (now - updatedAt > maxAge) {
          this.deleteState(executionId);
          cleaned++;
        }
      }
    });

    if (cleaned > 0) {
      logger.info("Old execution states cleaned up", { count: cleaned });
    }

    return cleaned;
  }

  /**
   * Get state count
   */
  getStateCount(): number {
    return this.states.size;
  }

  /**
   * Export state (for persistence)
   */
  exportState(executionId: string): string | null {
    const state = this.states.get(executionId);
    if (!state) {
      return null;
    }

    // Convert Map to object for JSON serialization
    const exportData = {
      ...state,
      stepStates: Array.from(state.stepStates.entries()),
    };

    return JSON.stringify(exportData);
  }

  /**
   * Import state (from persistence)
   */
  importState(stateData: string): boolean {
    try {
      const data = JSON.parse(stateData);

      // Restore Map from array
      const state: ExecutionState = {
        ...data,
        stepStates: new Map(data.stepStates),
      };

      this.states.set(state.executionId, state);

      logger.info("Execution state imported", {
        executionId: state.executionId,
      });
      return true;
    } catch (error) {
      logger.error("Failed to import state", {
        error: (error as Error).message,
      });
      return false;
    }
  }
}

/**
 * Singleton instance
 */
export const stateManager = new StateManager();
