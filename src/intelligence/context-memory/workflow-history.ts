/**
 * Workflow History - Execution pattern tracking and performance monitoring
 * Part of Context Memory Module - Intelligence Layer
 * Version: v0.1.0-context-memory
 * Created: 2025-11-21
 */

import { randomUUID } from 'crypto';

// ========== Type Definitions ==========

export type WorkflowStatus = 'success' | 'failed' | 'partial' | 'running' | 'cancelled';

export interface PerformanceMetrics {
  duration_ms: number;
  accuracy_score: number; // 0.0 - 1.0
  entities_extracted: number;
  nodes_executed: number;
  errors_encountered: number;
  retry_count: number;
}

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  workflow_name: string;
  user_id: string;
  start_time: Date;
  end_time?: Date;
  status: WorkflowStatus;
  entities_processed: string[]; // Entity IDs from EntityStore
  next_workflow_triggered?: string;
  performance_metrics: PerformanceMetrics;
  error_details?: {
    message: string;
    stack?: string;
    node_id?: string;
  };
  metadata: Record<string, any>;
}

export interface WorkflowChain {
  workflows: string[]; // Workflow IDs in sequence
  frequency: number; // How many times this chain occurred
  avg_duration_ms: number;
  success_rate: number;
  last_executed: Date;
}

export interface WorkflowAnalytics {
  workflow_id: string;
  total_executions: number;
  success_count: number;
  failure_count: number;
  avg_duration_ms: number;
  avg_accuracy: number;
  most_common_next_workflow?: string;
  bottleneck_nodes: string[];
  peak_usage_hours: number[]; // 0-23
}

// ========== Workflow History Class ==========

export class WorkflowHistory {
  private executions: Map<string, WorkflowExecution>;
  private executionsByWorkflow: Map<string, Set<string>>;
  private executionsByUser: Map<string, Set<string>>;
  private chains: Map<string, WorkflowChain>;
  private maxHistorySize: number;

  constructor(maxHistorySize: number = 10000) {
    this.executions = new Map();
    this.executionsByWorkflow = new Map();
    this.executionsByUser = new Map();
    this.chains = new Map();
    this.maxHistorySize = maxHistorySize;
  }

  /**
   * Start tracking a new workflow execution
   */
  startExecution(params: {
    workflow_id: string;
    workflow_name: string;
    user_id: string;
    metadata?: Record<string, any>;
  }): string {
    const execution: WorkflowExecution = {
      id: randomUUID(),
      workflow_id: params.workflow_id,
      workflow_name: params.workflow_name,
      user_id: params.user_id,
      start_time: new Date(),
      status: 'running',
      entities_processed: [],
      performance_metrics: {
        duration_ms: 0,
        accuracy_score: 0,
        entities_extracted: 0,
        nodes_executed: 0,
        errors_encountered: 0,
        retry_count: 0,
      },
      metadata: params.metadata || {},
    };

    this.executions.set(execution.id, execution);
    this.updateIndexes(execution);
    this.enforceHistoryLimit();

    return execution.id;
  }

  /**
   * Complete a workflow execution
   */
  completeExecution(params: {
    execution_id: string;
    status: Exclude<WorkflowStatus, 'running'>;
    entities_processed?: string[];
    performance_metrics?: Partial<PerformanceMetrics>;
    next_workflow_triggered?: string;
    error_details?: WorkflowExecution['error_details'];
  }): void {
    const execution = this.executions.get(params.execution_id);
    if (!execution) {
      throw new Error(`Execution ${params.execution_id} not found`);
    }

    execution.end_time = new Date();
    execution.status = params.status;
    
    // Calculate duration
    execution.performance_metrics.duration_ms = 
      execution.end_time.getTime() - execution.start_time.getTime();

    // Update entities
    if (params.entities_processed) {
      execution.entities_processed = params.entities_processed;
    }

    // Update metrics
    if (params.performance_metrics) {
      execution.performance_metrics = {
        ...execution.performance_metrics,
        ...params.performance_metrics,
      };
    }

    // Track next workflow for chain analysis
    if (params.next_workflow_triggered) {
      execution.next_workflow_triggered = params.next_workflow_triggered;
      this.trackChain(execution.workflow_id, params.next_workflow_triggered);
    }

    // Store error details
    if (params.error_details) {
      execution.error_details = params.error_details;
    }
  }

  /**
   * Update execution progress (for long-running workflows)
   */
  updateProgress(params: {
    execution_id: string;
    nodes_executed?: number;
    entities_extracted?: number;
    errors_encountered?: number;
  }): void {
    const execution = this.executions.get(params.execution_id);
    if (!execution) return;

    if (params.nodes_executed !== undefined) {
      execution.performance_metrics.nodes_executed = params.nodes_executed;
    }
    if (params.entities_extracted !== undefined) {
      execution.performance_metrics.entities_extracted = params.entities_extracted;
    }
    if (params.errors_encountered !== undefined) {
      execution.performance_metrics.errors_encountered = params.errors_encountered;
    }
  }

  /**
   * Get execution by ID
   */
  getExecution(execution_id: string): WorkflowExecution | undefined {
    return this.executions.get(execution_id);
  }

  /**
   * Get all executions for a workflow
   */
  getWorkflowExecutions(workflow_id: string, limit?: number): WorkflowExecution[] {
    const executionIds = this.executionsByWorkflow.get(workflow_id) || new Set();
    let executions = Array.from(executionIds)
      .map(id => this.executions.get(id)!)
      .filter(Boolean)
      .sort((a, b) => b.start_time.getTime() - a.start_time.getTime());

    if (limit) {
      executions = executions.slice(0, limit);
    }

    return executions;
  }

  /**
   * Get analytics for a specific workflow
   */
  getWorkflowAnalytics(workflow_id: string): WorkflowAnalytics {
    const executions = this.getWorkflowExecutions(workflow_id);
    
    const total_executions = executions.length;
    const success_count = executions.filter(e => e.status === 'success').length;
    const failure_count = executions.filter(e => e.status === 'failed').length;

    const completed = executions.filter(e => e.end_time);
    const avg_duration_ms = completed.length > 0
      ? completed.reduce((sum, e) => sum + e.performance_metrics.duration_ms, 0) / completed.length
      : 0;

    const avg_accuracy = completed.length > 0
      ? completed.reduce((sum, e) => sum + e.performance_metrics.accuracy_score, 0) / completed.length
      : 0;

    // Find most common next workflow
    const nextWorkflowCounts = new Map<string, number>();
    executions.forEach(e => {
      if (e.next_workflow_triggered) {
        nextWorkflowCounts.set(
          e.next_workflow_triggered,
          (nextWorkflowCounts.get(e.next_workflow_triggered) || 0) + 1
        );
      }
    });
    const most_common_next_workflow = nextWorkflowCounts.size > 0
      ? Array.from(nextWorkflowCounts.entries()).sort((a, b) => b[1] - a[1])[0][0]
      : undefined;

    // Identify bottleneck nodes (nodes with high error rates)
    const nodeErrors = new Map<string, number>();
    executions.forEach(e => {
      if (e.error_details?.node_id) {
        nodeErrors.set(
          e.error_details.node_id,
          (nodeErrors.get(e.error_details.node_id) || 0) + 1
        );
      }
    });
    const bottleneck_nodes = Array.from(nodeErrors.entries())
      .filter(([_, count]) => count > 2) // More than 2 errors
      .map(([nodeId]) => nodeId);

    // Peak usage hours
    const hourCounts = new Array(24).fill(0);
    executions.forEach(e => {
      const hour = e.start_time.getHours();
      hourCounts[hour]++;
    });
    const avgCount = hourCounts.reduce((a, b) => a + b, 0) / 24;
    const peak_usage_hours = hourCounts
      .map((count, hour) => ({ hour, count }))
      .filter(({ count }) => count > avgCount * 1.5)
      .map(({ hour }) => hour);

    return {
      workflow_id,
      total_executions,
      success_count,
      failure_count,
      avg_duration_ms,
      avg_accuracy,
      most_common_next_workflow,
      bottleneck_nodes,
      peak_usage_hours,
    };
  }

  /**
   * Get common workflow chains
   */
  getCommonChains(minFrequency: number = 2): WorkflowChain[] {
    return Array.from(this.chains.values())
      .filter(chain => chain.frequency >= minFrequency)
      .sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * Get recent activity across all workflows
   */
  getRecentActivity(limit: number = 50): WorkflowExecution[] {
    return Array.from(this.executions.values())
      .sort((a, b) => b.start_time.getTime() - a.start_time.getTime())
      .slice(0, limit);
  }

  /**
   * Get user activity
   */
  getUserActivity(user_id: string, limit?: number): WorkflowExecution[] {
    const executionIds = this.executionsByUser.get(user_id) || new Set();
    let executions = Array.from(executionIds)
      .map(id => this.executions.get(id)!)
      .filter(Boolean)
      .sort((a, b) => b.start_time.getTime() - a.start_time.getTime());

    if (limit) {
      executions = executions.slice(0, limit);
    }

    return executions;
  }

  /**
   * Track workflow chains for intelligent handoffs
   */
  private trackChain(workflow1: string, workflow2: string): void {
    const chainKey = `${workflow1} -> ${workflow2}`;
    const existing = this.chains.get(chainKey);

    if (existing) {
      existing.frequency++;
      existing.last_executed = new Date();
    } else {
      this.chains.set(chainKey, {
        workflows: [workflow1, workflow2],
        frequency: 1,
        avg_duration_ms: 0,
        success_rate: 0,
        last_executed: new Date(),
      });
    }
  }

  /**
   * Update search indexes
   */
  private updateIndexes(execution: WorkflowExecution): void {
    // Index by workflow
    if (!this.executionsByWorkflow.has(execution.workflow_id)) {
      this.executionsByWorkflow.set(execution.workflow_id, new Set());
    }
    this.executionsByWorkflow.get(execution.workflow_id)!.add(execution.id);

    // Index by user
    if (!this.executionsByUser.has(execution.user_id)) {
      this.executionsByUser.set(execution.user_id, new Set());
    }
    this.executionsByUser.get(execution.user_id)!.add(execution.id);
  }

  /**
   * Enforce history size limit (oldest executions removed first)
   */
  private enforceHistoryLimit(): void {
    if (this.executions.size <= this.maxHistorySize) return;

    const sorted = Array.from(this.executions.values())
      .sort((a, b) => a.start_time.getTime() - b.start_time.getTime());

    const toRemove = sorted.slice(0, this.executions.size - this.maxHistorySize);
    toRemove.forEach(execution => {
      this.executions.delete(execution.id);
    });
  }

  /**
   * Clear all history (for testing)
   */
  clear(): void {
    this.executions.clear();
    this.executionsByWorkflow.clear();
    this.executionsByUser.clear();
    this.chains.clear();
  }

  /**
   * Get total execution count
   */
  count(): number {
    return this.executions.size;
  }
}

// ========== Singleton Instance ==========

export const globalWorkflowHistory = new WorkflowHistory();
