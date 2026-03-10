/**
 * Parallel Execution Engine - Phase 4
 * DAG-based parallel task execution with dependency resolution
 */

import { logger } from "../../utils/logger";
import { WorkflowTask } from "../db/models";

/**
 * DAG Node representing a task with dependencies
 */
export interface DAGNode {
  id: string;
  task: WorkflowTask;
  dependencies: string[]; // IDs of tasks this depends on
  dependents: string[]; // IDs of tasks that depend on this
  level: number; // Execution level (0 = no dependencies)
}

/**
 * Task execution state
 */
export interface TaskState {
  id: string;
  status: "pending" | "ready" | "running" | "completed" | "failed";
  result?: unknown;
  error?: string;
  startTime?: number;
  endTime?: number;
}

/**
 * Parallel execution result
 */
export interface ParallelExecutionResult {
  completed: TaskState[];
  failed: TaskState[];
  totalDuration: number;
  parallelismAchieved: number; // Average tasks running in parallel
}

/**
 * Parallel Execution Engine
 * Executes tasks in parallel based on dependency graph
 */
export class ParallelExecutionEngine {
  private maxConcurrency: number;
  private currentRunning: number = 0;

  constructor(maxConcurrency: number = 5) {
    this.maxConcurrency = maxConcurrency;
  }

  /**
   * Build Directed Acyclic Graph from workflow tasks
   */
  buildDAG(tasks: WorkflowTask[]): DAGNode[] {
    const nodes: DAGNode[] = [];
    const taskMap = new Map<string, WorkflowTask>();

    // Create task map
    tasks.forEach((task) => {
      taskMap.set(task.name, task);
    });

    // Build nodes with dependencies
    tasks.forEach((task) => {
      const dependencies = task.depends_on || [];

      const node: DAGNode = {
        id: task.name,
        task,
        dependencies: dependencies,
        dependents: [],
        level: 0,
      };

      nodes.push(node);
    });

    // Build dependent lists (reverse dependencies)
    nodes.forEach((node) => {
      node.dependencies.forEach((depId) => {
        const depNode = nodes.find((n) => n.id === depId);
        if (depNode) {
          depNode.dependents.push(node.id);
        }
      });
    });

    // Calculate execution levels (topological sort)
    this.calculateLevels(nodes);

    // Validate DAG (check for cycles)
    this.validateDAG(nodes);

    logger.info("DAG built", {
      taskCount: nodes.length,
      maxLevel: Math.max(...nodes.map((n) => n.level)),
    });

    return nodes;
  }

  /**
   * Calculate execution levels for each node
   */
  private calculateLevels(nodes: DAGNode[]): void {
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (node: DAGNode): number => {
      if (visited.has(node.id)) {
        return node.level;
      }

      if (visiting.has(node.id)) {
        throw new Error(
          `Circular dependency detected involving task: ${node.id}`,
        );
      }

      visiting.add(node.id);

      let maxDepLevel = -1;
      node.dependencies.forEach((depId) => {
        const depNode = nodes.find((n) => n.id === depId);
        if (depNode) {
          maxDepLevel = Math.max(maxDepLevel, visit(depNode));
        }
      });

      node.level = maxDepLevel + 1;
      visiting.delete(node.id);
      visited.add(node.id);

      return node.level;
    };

    nodes.forEach((node) => visit(node));
  }

  /**
   * Validate DAG has no cycles
   */
  private validateDAG(nodes: DAGNode[]): void {
    const visited = new Set<string>();
    const recStack = new Set<string>();

    const hasCycle = (nodeId: string): boolean => {
      if (!visited.has(nodeId)) {
        visited.add(nodeId);
        recStack.add(nodeId);

        const node = nodes.find((n) => n.id === nodeId);
        if (node) {
          for (const depId of node.dependencies) {
            if (!visited.has(depId) && hasCycle(depId)) {
              return true;
            } else if (recStack.has(depId)) {
              return true;
            }
          }
        }
      }

      recStack.delete(nodeId);
      return false;
    };

    for (const node of nodes) {
      if (hasCycle(node.id)) {
        throw new Error("DAG validation failed: Circular dependency detected");
      }
    }

    logger.info("DAG validated successfully");
  }

  /**
   * Resolve dependencies - determine which tasks can run in parallel
   */
  resolveDependencies(
    nodes: DAGNode[],
    completedTasks: Set<string>,
  ): DAGNode[] {
    return nodes.filter((node) => {
      // Task already completed
      if (completedTasks.has(node.id)) {
        return false;
      }

      // All dependencies must be completed
      return node.dependencies.every((depId) => completedTasks.has(depId));
    });
  }

  /**
   * Execute tasks in parallel with dependency resolution
   */
  async executeParallel(
    nodes: DAGNode[],
    executor: (task: WorkflowTask) => Promise<unknown>,
  ): Promise<ParallelExecutionResult> {
    const startTime = Date.now();
    const taskStates = new Map<string, TaskState>();
    const completedTasks = new Set<string>();
    const failedTasks = new Set<string>();

    // Initialize task states
    nodes.forEach((node) => {
      taskStates.set(node.id, {
        id: node.id,
        status: "pending",
      });
    });

    // Track parallelism
    const parallelismSamples: number[] = [];
    const sampleInterval = setInterval(() => {
      parallelismSamples.push(this.currentRunning);
    }, 100);

    try {
      // Execute tasks level by level
      const maxLevel = Math.max(...nodes.map((n) => n.level));

      for (let level = 0; level <= maxLevel; level++) {
        const levelTasks = nodes.filter((n) => n.level === level);

        logger.info(`Executing level ${level}`, {
          taskCount: levelTasks.length,
        });

        // Execute all tasks at this level in parallel
        await this.executeLevelTasks(
          levelTasks,
          executor,
          taskStates,
          completedTasks,
          failedTasks,
        );

        // Check if any tasks failed and should stop
        if (failedTasks.size > 0) {
          logger.warn("Tasks failed at level", {
            level,
            failedCount: failedTasks.size,
          });
          // Continue or break based on error handling policy
          // For now, we continue with remaining tasks
        }
      }

      clearInterval(sampleInterval);

      const totalDuration = Date.now() - startTime;
      const avgParallelism =
        parallelismSamples.length > 0
          ? parallelismSamples.reduce((a, b) => a + b, 0) /
            parallelismSamples.length
          : 0;

      const completed = Array.from(taskStates.values()).filter(
        (s) => s.status === "completed",
      );
      const failed = Array.from(taskStates.values()).filter(
        (s) => s.status === "failed",
      );

      logger.info("Parallel execution completed", {
        totalTasks: nodes.length,
        completed: completed.length,
        failed: failed.length,
        duration: totalDuration,
        avgParallelism: avgParallelism.toFixed(2),
      });

      return {
        completed,
        failed,
        totalDuration,
        parallelismAchieved: avgParallelism,
      };
    } catch (error) {
      clearInterval(sampleInterval);
      logger.error("Parallel execution error", { error });
      throw error;
    }
  }

  /**
   * Execute all tasks at a specific level in parallel
   */
  private async executeLevelTasks(
    levelTasks: DAGNode[],
    executor: (task: WorkflowTask) => Promise<unknown>,
    taskStates: Map<string, TaskState>,
    completedTasks: Set<string>,
    failedTasks: Set<string>,
  ): Promise<void> {
    const promises: Promise<void>[] = [];

    for (const node of levelTasks) {
      // Wait if max concurrency reached
      while (this.currentRunning >= this.maxConcurrency) {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      promises.push(
        this.scheduleTask(
          node,
          executor,
          taskStates,
          completedTasks,
          failedTasks,
        ),
      );
    }

    // Wait for all tasks at this level to complete
    await Promise.all(promises);
  }

  /**
   * Schedule task for execution
   */
  private async scheduleTask(
    node: DAGNode,
    executor: (task: WorkflowTask) => Promise<unknown>,
    taskStates: Map<string, TaskState>,
    completedTasks: Set<string>,
    failedTasks: Set<string>,
  ): Promise<void> {
    const state = taskStates.get(node.id)!;

    // Wait for dependencies
    await this.waitForDependencies(node, taskStates);

    // Check if any dependency failed
    const hasFailedDeps = node.dependencies.some((depId) =>
      failedTasks.has(depId),
    );
    if (hasFailedDeps) {
      state.status = "failed";
      state.error = "Dependency failed";
      failedTasks.add(node.id);
      logger.warn("Task skipped due to failed dependency", { taskId: node.id });
      return;
    }

    // Execute task
    this.currentRunning++;
    state.status = "running";
    state.startTime = Date.now();

    try {
      logger.info("Executing task", { taskId: node.id, name: node.task.name });

      const result = await executor(node.task);

      state.status = "completed";
      state.result = result;
      state.endTime = Date.now();
      completedTasks.add(node.id);

      logger.info("Task completed", {
        taskId: node.id,
        duration: state.endTime - state.startTime!,
      });
    } catch (error) {
      state.status = "failed";
      state.error = error instanceof Error ? error.message : String(error);
      state.endTime = Date.now();
      failedTasks.add(node.id);

      logger.error("Task failed", {
        taskId: node.id,
        error: state.error,
      });
    } finally {
      this.currentRunning--;
    }
  }

  /**
   * Wait for all dependencies to complete
   */
  private async waitForDependencies(
    node: DAGNode,
    taskStates: Map<string, TaskState>,
  ): Promise<void> {
    const checkDependencies = (): boolean => {
      return node.dependencies.every((depId) => {
        const depState = taskStates.get(depId);
        return (
          depState &&
          (depState.status === "completed" || depState.status === "failed")
        );
      });
    };

    // Poll until all dependencies are done
    while (!checkDependencies()) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  /**
   * Partial rollback on error
   * Rolls back completed tasks that depend on failed tasks
   */
  async rollback(
    nodes: DAGNode[],
    failedTaskIds: string[],
    rollbackExecutor: (task: WorkflowTask) => Promise<void>,
  ): Promise<string[]> {
    const rolledBack: string[] = [];
    const toRollback = new Set<string>(failedTaskIds);

    // Find all tasks that depend on failed tasks (transitively)
    const findDependents = (taskId: string): void => {
      const node = nodes.find((n) => n.id === taskId);
      if (node) {
        node.dependents.forEach((depId) => {
          if (!toRollback.has(depId)) {
            toRollback.add(depId);
            findDependents(depId);
          }
        });
      }
    };

    failedTaskIds.forEach(findDependents);

    // Rollback in reverse topological order
    const sortedNodes = [...nodes].sort((a, b) => b.level - a.level);

    for (const node of sortedNodes) {
      if (toRollback.has(node.id)) {
        try {
          logger.info("Rolling back task", { taskId: node.id });
          await rollbackExecutor(node.task);
          rolledBack.push(node.id);
        } catch (error) {
          logger.error("Rollback failed", { taskId: node.id, error });
        }
      }
    }

    logger.info("Rollback completed", { count: rolledBack.length });
    return rolledBack;
  }
}

export const parallelExecutionEngine = new ParallelExecutionEngine();
