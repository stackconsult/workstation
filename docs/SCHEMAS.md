# 📋 Workstation Data Schemas

**Comprehensive schemas for workflows, agents, and system components**

---

## Table of Contents

- [Workflow Schema](#workflow-schema)
- [Agent Schema](#agent-schema)
- [Task Schema](#task-schema)
- [Result Schema](#result-schema)
- [Database Schema](#database-schema)
- [Configuration Schema](#configuration-schema)
- [API Request/Response Schemas](#api-requestresponse-schemas)

---

## Workflow Schema

### Workflow Definition

Complete JSON schema for defining browser automation workflows.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Workflow",
  "description": "Browser automation workflow definition",
  "type": "object",
  "required": ["name", "definition"],
  "properties": {
    "name": {
      "type": "string",
      "description": "Human-readable workflow name",
      "minLength": 1,
      "maxLength": 255,
      "example": "Google Search and Screenshot"
    },
    "description": {
      "type": "string",
      "description": "Detailed workflow description",
      "maxLength": 1000,
      "example": "Performs a Google search and captures a screenshot of the results"
    },
    "definition": {
      "type": "object",
      "required": ["tasks"],
      "properties": {
        "tasks": {
          "type": "array",
          "description": "Array of tasks to execute",
          "minItems": 1,
          "items": {
            "$ref": "#/definitions/task"
          }
        },
        "variables": {
          "type": "object",
          "description": "Workflow-level variables for substitution",
          "additionalProperties": {
            "type": ["string", "number", "boolean"]
          },
          "example": {
            "search_term": "browser automation",
            "timeout": 30000
          }
        },
        "options": {
          "type": "object",
          "description": "Global workflow options",
          "properties": {
            "timeout": {
              "type": "number",
              "description": "Global timeout in milliseconds",
              "minimum": 1000,
              "default": 30000
            },
            "retries": {
              "type": "number",
              "description": "Maximum retry attempts per task",
              "minimum": 0,
              "maximum": 5,
              "default": 3
            },
            "headless": {
              "type": "boolean",
              "description": "Run browser in headless mode",
              "default": true
            }
          }
        }
      }
    },
    "tags": {
      "type": "array",
      "description": "Tags for categorizing workflows",
      "items": {
        "type": "string"
      },
      "example": ["search", "automation", "testing"]
    },
    "enabled": {
      "type": "boolean",
      "description": "Whether workflow is enabled for execution",
      "default": true
    }
  },
  "definitions": {
    "task": {
      "type": "object",
      "required": ["name", "agent_type", "action"],
      "properties": {
        "name": {
          "type": "string",
          "description": "Unique task identifier",
          "pattern": "^[a-zA-Z0-9_-]+$",
          "example": "navigate_to_google"
        },
        "agent_type": {
          "type": "string",
          "description": "Type of agent to execute task",
          "enum": ["browser", "api", "data", "custom"],
          "default": "browser"
        },
        "action": {
          "type": "string",
          "description": "Action to perform",
          "enum": [
            "navigate",
            "click",
            "type",
            "getText",
            "screenshot",
            "getContent",
            "evaluate"
          ]
        },
        "parameters": {
          "type": "object",
          "description": "Action-specific parameters",
          "additionalProperties": true
        },
        "depends_on": {
          "type": "array",
          "description": "Tasks that must complete before this task",
          "items": {
            "type": "string"
          },
          "example": ["navigate_to_google", "wait_for_load"]
        },
        "timeout": {
          "type": "number",
          "description": "Task-specific timeout in milliseconds",
          "minimum": 1000
        },
        "retry": {
          "type": "object",
          "description": "Task-specific retry configuration",
          "properties": {
            "attempts": {
              "type": "number",
              "minimum": 0,
              "maximum": 5
            },
            "delay": {
              "type": "number",
              "description": "Delay between retries in milliseconds",
              "minimum": 100
            }
          }
        },
        "condition": {
          "type": "object",
          "description": "Conditional execution rules",
          "properties": {
            "if": {
              "type": "string",
              "description": "JavaScript expression to evaluate"
            },
            "skip_on_failure": {
              "type": "boolean",
              "description": "Continue workflow even if task fails"
            }
          }
        }
      }
    }
  }
}
```

### Example: Complete Workflow

```json
{
  "name": "E-commerce Product Search",
  "description": "Search for a product, filter results, and extract pricing data",
  "definition": {
    "tasks": [
      {
        "name": "navigate",
        "agent_type": "browser",
        "action": "navigate",
        "parameters": {
          "url": "https://example.com",
          "waitUntil": "networkidle"
        }
      },
      {
        "name": "search",
        "agent_type": "browser",
        "action": "type",
        "parameters": {
          "selector": "#search-input",
          "text": "{{product_name}}"
        },
        "depends_on": ["navigate"]
      },
      {
        "name": "submit",
        "agent_type": "browser",
        "action": "click",
        "parameters": {
          "selector": "#search-button"
        },
        "depends_on": ["search"]
      },
      {
        "name": "wait_results",
        "agent_type": "browser",
        "action": "evaluate",
        "parameters": {
          "script": "document.querySelector('.results').children.length > 0"
        },
        "depends_on": ["submit"],
        "timeout": 10000
      },
      {
        "name": "extract_prices",
        "agent_type": "browser",
        "action": "getText",
        "parameters": {
          "selector": ".product-price"
        },
        "depends_on": ["wait_results"]
      },
      {
        "name": "screenshot",
        "agent_type": "browser",
        "action": "screenshot",
        "parameters": {
          "fullPage": true,
          "path": "/tmp/results.png"
        },
        "depends_on": ["wait_results"],
        "condition": {
          "skip_on_failure": true
        }
      }
    ],
    "variables": {
      "product_name": "laptop"
    },
    "options": {
      "timeout": 60000,
      "retries": 2,
      "headless": true
    }
  },
  "tags": ["ecommerce", "search", "pricing"],
  "enabled": true
}
```

---

## Agent Schema

### Agent Capability Definition

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Agent",
  "description": "Specialized agent capability definition",
  "type": "object",
  "required": ["id", "type", "capabilities"],
  "properties": {
    "id": {
      "type": "string",
      "description": "Unique agent identifier",
      "pattern": "^agent-[0-9]+$",
      "example": "agent-17"
    },
    "type": {
      "type": "string",
      "description": "Agent category",
      "enum": [
        "infrastructure",
        "quality",
        "intelligence",
        "development",
        "automation"
      ]
    },
    "name": {
      "type": "string",
      "description": "Human-readable agent name",
      "example": "Project Builder & Deployment"
    },
    "capabilities": {
      "type": "array",
      "description": "List of agent capabilities",
      "items": {
        "type": "string"
      },
      "example": [
        "build_automation",
        "deployment_orchestration",
        "production_readiness"
      ]
    },
    "status": {
      "type": "string",
      "enum": ["planned", "in_progress", "complete", "deprecated"],
      "default": "planned"
    },
    "completion_date": {
      "type": "string",
      "format": "date",
      "description": "Date agent was completed",
      "example": "2025-11-17"
    },
    "implementation": {
      "type": "object",
      "properties": {
        "language": {
          "type": "string",
          "enum": ["typescript", "python", "bash"]
        },
        "entry_point": {
          "type": "string",
          "description": "Main file path"
        },
        "dependencies": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      }
    }
  }
}
```

### Example: Agent Definition

```json
{
  "id": "agent-17",
  "type": "infrastructure",
  "name": "Project Builder & Deployment",
  "capabilities": [
    "build_automation",
    "deployment_orchestration",
    "production_readiness",
    "integration_testing"
  ],
  "status": "complete",
  "completion_date": "2025-11-17",
  "implementation": {
    "language": "typescript",
    "entry_point": "src/agents/agent17/index.ts",
    "dependencies": ["docker", "railway-cli", "playwright"]
  }
}
```

---

## Task Schema

### Task Execution Record

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Task",
  "description": "Task execution record",
  "type": "object",
  "required": ["id", "workflow_id", "name", "status"],
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid",
      "description": "Unique task execution ID"
    },
    "workflow_id": {
      "type": "string",
      "format": "uuid",
      "description": "Parent workflow ID"
    },
    "name": {
      "type": "string",
      "description": "Task name from workflow definition"
    },
    "status": {
      "type": "string",
      "enum": ["pending", "running", "completed", "failed", "retrying"],
      "description": "Current task status"
    },
    "started_at": {
      "type": "string",
      "format": "date-time",
      "description": "Task start timestamp"
    },
    "completed_at": {
      "type": "string",
      "format": "date-time",
      "description": "Task completion timestamp"
    },
    "duration_ms": {
      "type": "number",
      "description": "Execution duration in milliseconds"
    },
    "attempts": {
      "type": "number",
      "description": "Number of execution attempts",
      "minimum": 1
    },
    "error": {
      "type": "object",
      "description": "Error information if task failed",
      "properties": {
        "message": {
          "type": "string"
        },
        "code": {
          "type": "string"
        },
        "stack": {
          "type": "string"
        }
      }
    }
  }
}
```

---

## Result Schema

### Task Result Data

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "TaskResult",
  "description": "Result data from task execution",
  "type": "object",
  "required": ["task_id", "type", "data"],
  "properties": {
    "task_id": {
      "type": "string",
      "format": "uuid"
    },
    "type": {
      "type": "string",
      "enum": ["text", "html", "json", "image", "binary"],
      "description": "Result data type"
    },
    "data": {
      "description": "Result data (type varies based on 'type' field)"
    },
    "metadata": {
      "type": "object",
      "description": "Additional metadata about the result",
      "properties": {
        "encoding": {
          "type": "string"
        },
        "size": {
          "type": "number"
        },
        "mime_type": {
          "type": "string"
        }
      }
    },
    "created_at": {
      "type": "string",
      "format": "date-time"
    }
  }
}
```

---

## Database Schema

### SQL Schema

Complete database schema for workflow storage.

```sql
-- Workflows table
CREATE TABLE IF NOT EXISTS workflows (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    definition TEXT NOT NULL,
    tags TEXT,
    enabled BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT,
    metadata TEXT
);

CREATE INDEX idx_workflows_enabled ON workflows(enabled);
CREATE INDEX idx_workflows_created_at ON workflows(created_at);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    workflow_id TEXT NOT NULL,
    name TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('pending', 'running', 'completed', 'failed', 'retrying')),
    started_at DATETIME,
    completed_at DATETIME,
    duration_ms INTEGER,
    attempts INTEGER DEFAULT 1,
    error_message TEXT,
    error_code TEXT,
    error_stack TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
);

CREATE INDEX idx_tasks_workflow_id ON tasks(workflow_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_created_at ON tasks(created_at);

-- Results table
CREATE TABLE IF NOT EXISTS results (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('text', 'html', 'json', 'image', 'binary')),
    data TEXT,
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE INDEX idx_results_task_id ON results(task_id);

-- Execution history table
CREATE TABLE IF NOT EXISTS execution_history (
    id TEXT PRIMARY KEY,
    workflow_id TEXT NOT NULL,
    status TEXT NOT NULL,
    started_at DATETIME NOT NULL,
    completed_at DATETIME,
    total_tasks INTEGER,
    completed_tasks INTEGER,
    failed_tasks INTEGER,
    metadata TEXT,
    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
);

CREATE INDEX idx_execution_history_workflow_id ON execution_history(workflow_id);
CREATE INDEX idx_execution_history_started_at ON execution_history(started_at);
```

### TypeScript Interface

```typescript
// Database models
export interface Workflow {
  id: string;
  name: string;
  description?: string;
  definition: WorkflowDefinition;
  tags?: string[];
  enabled: boolean;
  created_at: Date;
  updated_at: Date;
  created_by?: string;
  metadata?: Record<string, unknown>;
}

export interface Task {
  id: string;
  workflow_id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'retrying';
  started_at?: Date;
  completed_at?: Date;
  duration_ms?: number;
  attempts: number;
  error?: {
    message: string;
    code?: string;
    stack?: string;
  };
  created_at: Date;
}

export interface Result {
  id: string;
  task_id: string;
  type: 'text' | 'html' | 'json' | 'image' | 'binary';
  data: unknown;
  metadata?: {
    encoding?: string;
    size?: number;
    mime_type?: string;
  };
  created_at: Date;
}

export interface ExecutionHistory {
  id: string;
  workflow_id: string;
  status: string;
  started_at: Date;
  completed_at?: Date;
  total_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
  metadata?: Record<string, unknown>;
}
```

---

## Configuration Schema

### Environment Configuration

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "EnvironmentConfig",
  "description": "Application environment configuration",
  "type": "object",
  "required": ["JWT_SECRET"],
  "properties": {
    "NODE_ENV": {
      "type": "string",
      "enum": ["development", "production", "test"],
      "default": "development"
    },
    "PORT": {
      "type": "number",
      "minimum": 1,
      "maximum": 65535,
      "default": 3000
    },
    "JWT_SECRET": {
      "type": "string",
      "minLength": 32,
      "description": "Secret key for JWT signing (min 32 chars in production)"
    },
    "JWT_EXPIRATION": {
      "type": "string",
      "pattern": "^[0-9]+(s|m|h|d)$",
      "default": "24h",
      "examples": ["1h", "30m", "7d"]
    },
    "ALLOWED_ORIGINS": {
      "type": "string",
      "description": "Comma-separated list of allowed CORS origins"
    },
    "DATABASE_URL": {
      "type": "string",
      "description": "PostgreSQL connection string (production)"
    },
    "LOG_LEVEL": {
      "type": "string",
      "enum": ["error", "warn", "info", "debug"],
      "default": "info"
    },
    "BROWSER_HEADLESS": {
      "type": "boolean",
      "default": true,
      "description": "Run browsers in headless mode"
    },
    "MAX_RETRIES": {
      "type": "number",
      "minimum": 0,
      "maximum": 10,
      "default": 3
    }
  }
}
```

---

## API Request/Response Schemas

### Create Workflow Request

```json
{
  "method": "POST",
  "endpoint": "/api/v2/workflows",
  "headers": {
    "Authorization": "Bearer <JWT_TOKEN>",
    "Content-Type": "application/json"
  },
  "body": {
    "$ref": "#/workflow-schema"
  }
}
```

### Create Workflow Response

```json
{
  "status": 201,
  "body": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "My Workflow",
    "description": "Workflow description",
    "created_at": "2025-11-17T12:00:00Z",
    "status": "created"
  }
}
```

### Execute Workflow Request

```json
{
  "method": "POST",
  "endpoint": "/api/v2/workflows/:id/execute",
  "headers": {
    "Authorization": "Bearer <JWT_TOKEN>",
    "Content-Type": "application/json"
  },
  "body": {
    "variables": {
      "url": "https://example.com",
      "search_term": "test"
    },
    "options": {
      "priority": "high",
      "notify_on_complete": true
    }
  }
}
```

### Execute Workflow Response

```json
{
  "status": 202,
  "body": {
    "execution_id": "660e8400-e29b-41d4-a716-446655440001",
    "workflow_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "queued",
    "estimated_duration_ms": 30000,
    "status_url": "/api/v2/tasks/660e8400-e29b-41d4-a716-446655440001"
  }
}
```

### Get Task Status Response

```json
{
  "status": 200,
  "body": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "workflow_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "running",
    "progress": {
      "total_tasks": 5,
      "completed_tasks": 3,
      "failed_tasks": 0,
      "current_task": "screenshot"
    },
    "started_at": "2025-11-17T12:00:00Z",
    "estimated_completion": "2025-11-17T12:00:30Z"
  }
}
```

### Error Response

```json
{
  "status": 400,
  "body": {
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Invalid workflow definition",
      "details": [
        {
          "field": "definition.tasks[0].action",
          "message": "Invalid action type"
        }
      ]
    }
  }
}
```

---

## Schema Validation

### Using JSON Schema Validator

```typescript
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv();
addFormats(ajv);

// Load workflow schema
const workflowSchema = require('./schemas/workflow.json');
const validate = ajv.compile(workflowSchema);

// Validate workflow
const workflow = {
  name: "Test Workflow",
  definition: {
    tasks: [/* ... */]
  }
};

const valid = validate(workflow);
if (!valid) {
  console.error(validate.errors);
}
```

### Using TypeScript Types

```typescript
import { Workflow, WorkflowDefinition, Task } from './types';

// Type-safe workflow creation
const workflow: Workflow = {
  id: uuid(),
  name: "My Workflow",
  definition: {
    tasks: [
      {
        name: "navigate",
        agent_type: "browser",
        action: "navigate",
        parameters: {
          url: "https://example.com"
        }
      }
    ]
  },
  enabled: true,
  created_at: new Date(),
  updated_at: new Date()
};
```

---

## Related Documentation

- [API.md](../../api/API.md) - Complete API documentation
- [ARCHITECTURE.md](../../architecture/ARCHITECTURE.md) - System architecture
- [HOW_TO_USE_BROWSER_AGENT.md](../../guides/HOW_TO_USE_BROWSER_AGENT.md) - Usage guide
- [PROJECT_TIMELINE.md](../../PROJECT_TIMELINE.md) - Project history

---

**Last Updated**: November 17, 2025  
**Schema Version**: 1.0  
**Validation**: JSON Schema Draft 07

**Note**: All schemas are validated and used in production. See `src/automation/workflow/validator.ts` for implementation.
