/**
 * Shared Type Definitions
 *
 * Common types used across the Workstation agent ecosystem.
 *
 * @module shared/types
 * @version 1.0.0
 */

/**
 * Agent Types
 */
export type AgentType =
  | "browser"
  | "code"
  | "analysis"
  | "storage"
  | "report"
  | "mcp"
  | "custom";

export type AgentStatus =
  | "stopped"
  | "starting"
  | "running"
  | "stopping"
  | "error";

export type HealthStatus = "healthy" | "degraded" | "unhealthy" | "unknown";

export interface AgentMetadata {
  id: string;
  name: string;
  type: AgentType;
  containerName?: string;
  status: AgentStatus;
  healthStatus: HealthStatus;
  capabilities: string[];
  metadata?: Record<string, any>;
  lastHealthCheck?: string;
  createdAt: string;
}

/**
 * Task Types
 */
export type TaskStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export type TaskPriority = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface TaskPayload {
  [key: string]: any;
}

export interface TaskResult {
  success: boolean;
  data?: any;
  error?: string;
  executionTime?: number;
  metadata?: Record<string, any>;
}

export interface AgentTask {
  id: string;
  agentId: string;
  type: string;
  payload: TaskPayload;
  priority: TaskPriority;
  status: TaskStatus;
  createdBy?: string;
  result?: TaskResult;
  retryCount: number;
  maxRetries: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

/**
 * Agent Handoff Types
 */
export interface AgentHandoff<T = any> {
  fromAgent: string;
  toAgent: string;
  handoffType: string;
  timestamp: string;
  data: T;
  metadata: HandoffMetadata;
}

export interface HandoffMetadata {
  correlationId: string;
  priority: TaskPriority;
  retryCount: number;
  timeout: number;
  context?: Record<string, any>;
}

/**
 * Health Check Types
 */
export interface HealthCheckResult {
  healthy: boolean;
  status: HealthStatus;
  checks: HealthCheck[];
  timestamp: string;
  uptime?: number;
}

export interface HealthCheck {
  name: string;
  status: "pass" | "fail" | "warn";
  message?: string;
  duration?: number;
  metadata?: Record<string, any>;
}

/**
 * Statistics Types
 */
export interface AgentStatistics {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  activeTasks: number;
  avgExecutionTime: number;
  successRate: number;
  lastTaskTime?: string;
}

export interface SystemOverview {
  totalAgents: number;
  runningAgents: number;
  stoppedAgents: number;
  healthyAgents: number;
  degradedAgents: number;
  unhealthyAgents: number;
  pendingTasks: number;
  activeTasks: number;
  mcpContainers: number;
  agentsByType: Record<AgentType, number>;
}

/**
 * Event Types
 */
export type EventType =
  | "agent.started"
  | "agent.stopped"
  | "agent.health"
  | "task.created"
  | "task.started"
  | "task.completed"
  | "task.failed"
  | "handoff.initiated"
  | "handoff.completed";

export interface AgentEvent<T = any> {
  type: EventType;
  timestamp: string;
  agentId?: string;
  taskId?: string;
  data: T;
  metadata?: Record<string, any>;
}

/**
 * Configuration Types
 */
export interface AgentConfig {
  id: string;
  type: AgentType;
  capabilities: string[];
  maxConcurrent: number;
  timeout: number;
  retryPolicy: RetryPolicy;
  healthCheck: HealthCheckConfig;
}

export interface RetryPolicy {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export interface HealthCheckConfig {
  enabled: boolean;
  interval: number;
  timeout: number;
  failureThreshold: number;
}

/**
 * API Response Types
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

/**
 * Workflow Types
 */
export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  steps: WorkflowStep[];
  metadata?: Record<string, any>;
}

export interface WorkflowStep {
  id: string;
  name: string;
  agentId: string;
  taskType: string;
  payload: TaskPayload;
  dependsOn?: string[];
  retryPolicy?: RetryPolicy;
  timeout?: number;
}

export interface WorkflowExecution {
  workflowId: string;
  executionId: string;
  status: "pending" | "running" | "completed" | "failed";
  currentStep?: string;
  steps: WorkflowStepExecution[];
  startedAt: string;
  completedAt?: string;
}

export interface WorkflowStepExecution {
  stepId: string;
  taskId: string;
  status: TaskStatus;
  result?: TaskResult;
  startedAt: string;
  completedAt?: string;
}

/**
 * Error Types
 */
export class AgentError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly agentId?: string,
    public readonly metadata?: Record<string, any>,
  ) {
    super(message);
    this.name = "AgentError";
  }
}

export class TaskError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly taskId?: string,
    public readonly metadata?: Record<string, any>,
  ) {
    super(message);
    this.name = "TaskError";
  }
}

export class HandoffError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly fromAgent?: string,
    public readonly toAgent?: string,
    public readonly metadata?: Record<string, any>,
  ) {
    super(message);
    this.name = "HandoffError";
  }
}

/**
 * Utility Types
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<
  T,
  Exclude<keyof T, Keys>
> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

export type Awaitable<T> = T | Promise<T>;
