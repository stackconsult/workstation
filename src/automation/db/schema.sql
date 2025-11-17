-- Phase 1: Core Browser Automation Layer Database Schema
-- Using SQLite for initial implementation, designed for PostgreSQL migration

-- Workflow definitions
CREATE TABLE IF NOT EXISTS workflows (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    description     TEXT,
    definition      TEXT NOT NULL,  -- JSON string
    owner_id        TEXT NOT NULL,
    workspace_id    TEXT,
    status          TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'archived')),
    version         INTEGER DEFAULT 1,
    
    -- Execution settings
    timeout_seconds INTEGER DEFAULT 3600,
    max_retries     INTEGER DEFAULT 3,
    
    -- Scheduling
    cron_schedule   TEXT,
    next_run_at     TEXT,  -- ISO 8601 timestamp
    
    created_at      TEXT DEFAULT (datetime('now')),
    updated_at      TEXT DEFAULT (datetime('now'))
);

-- Execution tracking
CREATE TABLE IF NOT EXISTS executions (
    id              TEXT PRIMARY KEY,
    workflow_id     TEXT NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    status          TEXT NOT NULL CHECK(status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    trigger_type    TEXT,  -- manual, scheduled, webhook, slack
    triggered_by    TEXT,
    
    started_at      TEXT,  -- ISO 8601 timestamp
    completed_at    TEXT,  -- ISO 8601 timestamp
    duration_ms     INTEGER,
    
    output          TEXT,  -- JSON string
    error_message   TEXT,
    
    created_at      TEXT DEFAULT (datetime('now'))
);

-- Task execution (individual steps)
CREATE TABLE IF NOT EXISTS tasks (
    id              TEXT PRIMARY KEY,
    execution_id    TEXT NOT NULL REFERENCES executions(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    agent_type      TEXT NOT NULL,
    action          TEXT NOT NULL,
    parameters      TEXT NOT NULL,  -- JSON string
    
    status          TEXT NOT NULL CHECK(status IN ('queued', 'running', 'completed', 'failed', 'skipped')),
    retry_count     INTEGER DEFAULT 0,
    
    queued_at       TEXT DEFAULT (datetime('now')),
    started_at      TEXT,
    completed_at    TEXT,
    
    output          TEXT,  -- JSON string
    error_message   TEXT
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_executions_workflow_id ON executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_executions_status ON executions(status);
CREATE INDEX IF NOT EXISTS idx_executions_created_at ON executions(created_at);
CREATE INDEX IF NOT EXISTS idx_tasks_execution_id ON tasks(execution_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_workflows_owner_id ON workflows(owner_id);
CREATE INDEX IF NOT EXISTS idx_workflows_status ON workflows(status);
