# Context-Memory Intelligence Layer

The Context-Memory Intelligence Layer provides persistent memory, pattern recognition, and adaptive learning capabilities across the workstation automation system.

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│          Context-Memory Intelligence Layer           │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │ Entity Store │  │   Workflow   │  │ Learning  │ │
│  │              │  │   History    │  │   Model   │ │
│  │  - Tracking  │  │  - Metrics   │  │ - Training│ │
│  │  - Relations │  │  - Patterns  │  │ - Suggest │ │
│  │  - Context   │  │  - Analytics │  │ - Feedback│ │
│  └──────┬───────┘  └──────┬───────┘  └─────┬─────┘ │
│         │                 │                 │       │
│         └─────────────────┴─────────────────┘       │
│                           │                          │
│                    SQLite Database                   │
└─────────────────────────────────────────────────────┘
```

## Components

### 1. Entity Store (`entity-store.ts`)

Tracks entities across workflow executions with deduplication and relationship mapping.

**Features:**

- Track files, repositories, issues, PRs, agents, workflows, users
- Relationship mapping (depends_on, modifies, created_by, etc.)
- Importance scoring (0-100)
- Tag-based organization
- Workflow association
- Query interface with filters

**Usage:**

```typescript
import { getEntityStore } from "./intelligence/context-memory";

const entityStore = getEntityStore();

// Track an entity
const entity = await entityStore.trackEntity(
  "repository",
  "creditXcredit/workstation",
  { language: "TypeScript", stars: 42 },
  ["automation", "ai"],
);

// Create relationship
await entityStore.createRelationship(
  entityId1,
  entityId2,
  "depends_on",
  0.8, // strength
);

// Query entities
const repos = await entityStore.queryEntities({
  type: "repository",
  tags: ["automation"],
  min_importance: 70,
});
```

### 2. Workflow History (`workflow-history.ts`)

Records workflow executions, performance metrics, and detects patterns.

**Features:**

- Execution tracking with metrics
- Success/failure analytics
- Pattern detection:
  - Success sequences
  - Failure points
  - Performance bottlenecks
  - Optimization opportunities
- Automatic pattern recognition
- Historical analytics

**Usage:**

```typescript
import { getWorkflowHistory } from "./intelligence/context-memory";

const workflowHistory = getWorkflowHistory();

// Record execution
const record = await workflowHistory.recordExecution(
  workflowId,
  executionId,
  "success",
  {
    task_count: 5,
    tasks_completed: 5,
    tasks_failed: 0,
    average_task_duration_ms: 1500,
  },
  [entityId1, entityId2], // entities accessed
);

// Complete execution
await workflowHistory.completeExecution(
  record.id,
  "success",
  7500, // duration in ms
);

// Get patterns
const patterns = await workflowHistory.getWorkflowPatterns(workflowId);
console.log(patterns[0].recommendation);
```

### 3. Learning Model (`learning-model.ts`)

Provides adaptive learning from workflow patterns and generates optimization suggestions.

**Features:**

- Multiple model types:
  - Workflow optimization
  - Error prediction
  - Resource allocation
  - Task sequencing
- Automatic training from historical data
- Suggestion generation
- Feedback loop for continuous improvement
- Performance tracking

**Usage:**

```typescript
import { getLearningModel } from "./intelligence/context-memory";

const learningModel = getLearningModel();

// Train model
const model = await learningModel.trainModel({
  model_type: "workflow_optimization",
  training_window_days: 30,
  min_samples: 100,
  auto_retrain: true,
  retrain_interval_hours: 168, // weekly
  confidence_threshold: 0.7,
});

// Generate suggestions
const suggestions = await learningModel.generateSuggestions(
  model.id,
  workflowId,
);

// Apply suggestion with feedback
await learningModel.applySuggestion(suggestionId, {
  applied: true,
  helpful: true,
  actual_impact: {
    time_change_ms: -3000, // 3s faster
  },
  user_comment: "Great suggestion!",
  recorded_at: new Date().toISOString(),
});
```

## Integration Points

### Agent Orchestrator Integration

```typescript
import { getEntityStore } from "./intelligence/context-memory";

class AgentOrchestrator {
  async executeWorkflow(workflow) {
    const entityStore = getEntityStore();

    // Track workflow entity
    await entityStore.trackEntity(
      "workflow",
      workflow.name,
      { id: workflow.id },
      ["active"],
    );

    // Execute workflow...
  }
}
```

### Workflow Service Integration

```typescript
import { getWorkflowHistory } from "./intelligence/context-memory";

class WorkflowService {
  async executeWorkflow(workflow) {
    const history = getWorkflowHistory();

    // Record execution start
    const record = await history.recordExecution(
      workflow.id,
      executionId,
      "running",
      initialMetrics,
    );

    // Execute...

    // Complete execution
    await history.completeExecution(record.id, "success", durationMs);
  }
}
```

### LLM Service Integration

```typescript
import {
  getEntityStore,
  getLearningModel,
} from "./intelligence/context-memory";

class LLMService {
  async enhancePrompt(prompt, context) {
    const entityStore = getEntityStore();
    const learningModel = getLearningModel();

    // Get relevant entities
    const entities = await entityStore.queryEntities({
      workflow_id: context.workflowId,
      limit: 10,
    });

    // Get suggestions
    const suggestions = await learningModel.getWorkflowSuggestions(
      context.workflowId,
    );

    // Enhance prompt with context
    return {
      ...prompt,
      context: {
        entities,
        suggestions,
      },
    };
  }
}
```

### Chrome Extension Integration

The context-memory layer can be exposed to the Chrome extension for entity visibility:

```typescript
// In routes/automation.ts
app.get("/api/context/entities", async (req, res) => {
  const entityStore = getEntityStore();
  const entities = await entityStore.queryEntities({
    limit: 100,
    sort_by: "importance",
    sort_order: "desc",
  });

  res.json({ entities });
});
```

## Database Schema

### Entities Table

```sql
CREATE TABLE entities (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  metadata TEXT NOT NULL,
  first_seen TEXT NOT NULL,
  last_seen TEXT NOT NULL,
  access_count INTEGER DEFAULT 1,
  context TEXT NOT NULL,
  tags TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### Entity Relationships Table

```sql
CREATE TABLE entity_relationships (
  id TEXT PRIMARY KEY,
  source_entity_id TEXT NOT NULL,
  target_entity_id TEXT NOT NULL,
  relationship_type TEXT NOT NULL,
  strength REAL NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY(source_entity_id) REFERENCES entities(id),
  FOREIGN KEY(target_entity_id) REFERENCES entities(id)
);
```

### Workflow History Table

```sql
CREATE TABLE workflow_history (
  id TEXT PRIMARY KEY,
  workflow_id TEXT NOT NULL,
  execution_id TEXT NOT NULL,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  duration_ms INTEGER,
  status TEXT NOT NULL,
  metrics TEXT NOT NULL,
  entities_accessed TEXT NOT NULL,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TEXT NOT NULL
);
```

### Workflow Patterns Table

```sql
CREATE TABLE workflow_patterns (
  id TEXT PRIMARY KEY,
  pattern_type TEXT NOT NULL,
  description TEXT NOT NULL,
  confidence REAL NOT NULL,
  occurrences INTEGER DEFAULT 1,
  first_detected TEXT NOT NULL,
  last_detected TEXT NOT NULL,
  workflow_ids TEXT NOT NULL,
  recommendation TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### Learning Models Table

```sql
CREATE TABLE learning_models (
  id TEXT PRIMARY KEY,
  model_type TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  trained_at TEXT NOT NULL,
  accuracy REAL NOT NULL,
  training_samples INTEGER NOT NULL,
  parameters TEXT NOT NULL,
  performance_history TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### Learning Suggestions Table

```sql
CREATE TABLE learning_suggestions (
  id TEXT PRIMARY KEY,
  model_id TEXT NOT NULL,
  suggestion_type TEXT NOT NULL,
  description TEXT NOT NULL,
  confidence REAL NOT NULL,
  estimated_impact TEXT NOT NULL,
  workflow_id TEXT,
  actionable INTEGER DEFAULT 1,
  auto_apply INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  applied_at TEXT,
  feedback TEXT,
  FOREIGN KEY(model_id) REFERENCES learning_models(id)
);
```

## Performance Considerations

### Caching

- Entities are cached in memory after first retrieval
- Models are cached after training
- Cache invalidation on updates

### Indexing

- All tables have appropriate indexes for common queries
- Composite indexes on frequently joined columns

### Cleanup

- Automatic cleanup of old entities (configurable max age)
- Automatic cleanup of old history records
- Configurable retention policies

## Error Handling

All methods include comprehensive error handling:

- Try-catch blocks with detailed logging
- Graceful degradation (return empty arrays on query failures)
- Transaction rollback on failures
- Error propagation with context

## Testing

See `tests/intelligence/context-memory/` for comprehensive test suite:

- Unit tests for each component
- Integration tests for workflows
- Edge case coverage
- Performance benchmarks

## Future Enhancements

1. **Distributed Storage**: Support for PostgreSQL and Redis
2. **Real-time Sync**: WebSocket updates for entity changes
3. **Advanced ML**: Integration with TensorFlow.js for better predictions
4. **Graph Database**: Neo4j for complex relationship queries
5. **Time Series**: InfluxDB for performance metrics
6. **Vector Search**: Embeddings for semantic entity search

## Troubleshooting

### Issue: Schema initialization fails

**Solution**: Ensure database is initialized first

```typescript
import { initializeDatabase } from "./automation/db/database";
await initializeDatabase();
```

### Issue: Entities not persisting

**Solution**: Check database file permissions and path

### Issue: Pattern detection not working

**Solution**: Ensure sufficient historical data (minimum 5 executions)

### Issue: Low model accuracy

**Solution**: Increase training window and ensure data quality

## License

ISC License - Same as parent project
