/**
 * Database models for Phase 1
 * Type-safe interfaces for workflow, execution, and task entities
 */

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  definition: WorkflowDefinition;
  owner_id: string;
  workspace_id?: string;
  status: "active" | "inactive" | "archived";
  version: number;
  timeout_seconds: number;
  max_retries: number;
  cron_schedule?: string;
  next_run_at?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkflowDefinition {
  tasks?: WorkflowTask[];
  steps?: any[]; // For template-based workflows
  triggers?: any[];
  variables?: Record<string, unknown>;
  on_error?: "stop" | "continue" | "retry";
}

export interface WorkflowTask {
  id?: string;
  name: string;
  agent_type: string;
  action: string;
  parameters: Record<string, unknown>;
  depends_on?: string[];
  timeout_seconds?: number;
  retry_count?: number;
}

export interface Execution {
  id: string;
  workflow_id: string;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  trigger_type?:
    | "manual"
    | "scheduled"
    | "webhook"
    | "slack"
    | "chain"
    | "trigger";
  triggered_by?: string;
  started_at?: string;
  completed_at?: string;
  duration_ms?: number;
  output?: Record<string, unknown>;
  error_message?: string;
  created_at: string;
}

export interface Task {
  id: string;
  execution_id: string;
  name: string;
  agent_type: string;
  action: string;
  parameters: Record<string, unknown>;
  status: "queued" | "running" | "completed" | "failed" | "skipped";
  retry_count: number;
  queued_at: string;
  started_at?: string;
  completed_at?: string;
  output?: Record<string, unknown>;
  error_message?: string;
}

export interface CreateWorkflowInput {
  name: string;
  description?: string;
  definition: WorkflowDefinition;
  owner_id: string;
  workspace_id?: string;
  timeout_seconds?: number;
  max_retries?: number;
  cron_schedule?: string;
}

export interface ExecuteWorkflowInput {
  workflow_id: string;
  triggered_by?: string;
  trigger_type?:
    | "manual"
    | "scheduled"
    | "webhook"
    | "slack"
    | "chain"
    | "trigger";
  variables?: Record<string, unknown>;
}
