# Workflow Examples

Practical examples of workflows using data, integration, and storage agents.

## Table of Contents

1. [CSV Processing Workflow](#csv-processing-workflow)
2. [Google Sheets Automation](#google-sheets-automation)
3. [Multi-Step Data Pipeline](#multi-step-data-pipeline)
4. [Parallel Data Processing](#parallel-data-processing)
5. [Database to Cloud Storage Sync](#database-to-cloud-storage-sync)
6. [Email Report Generation](#email-report-generation)

---

## CSV Processing Workflow

**Use Case**: Import CSV file, validate data, transform it, and save to database.

### Workflow Definition

```json
{
  "name": "CSV Data Import",
  "description": "Parse CSV, validate, and import to database",
  "tasks": [
    {
      "id": "parse_csv",
      "agent": "csv",
      "action": "parseCsv",
      "params": {
        "input": "{{workflow.input.csvFile}}",
        "options": {
          "headers": true,
          "skipInvalidLines": true
        }
      }
    },
    {
      "id": "validate_data",
      "agent": "json",
      "action": "validateJson",
      "params": {
        "data": "{{tasks.parse_csv.data}}",
        "schema": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "email": { "type": "string", "format": "email" },
              "age": { "type": "number", "minimum": 0 }
            },
            "required": ["email", "age"]
          }
        }
      },
      "dependsOn": ["parse_csv"]
    },
    {
      "id": "import_to_db",
      "agent": "database",
      "action": "insert",
      "params": {
        "table": "users",
        "records": "{{tasks.parse_csv.data}}"
      },
      "dependsOn": ["validate_data"],
      "condition": "{{tasks.validate_data.valid}}"
    }
  ]
}
```

### TypeScript Implementation

```typescript
import { workflowOrchestrator } from '../services/agent-orchestrator';

async function importCSVData(csvFile: Buffer) {
  const workflow = {
    name: 'CSV Data Import',
    input: { csvFile },
    tasks: [
      // ... (workflow definition above)
    ]
  };

  const result = await workflowOrchestrator.execute(workflow);
  
  if (result.success) {
    console.log(`Imported ${result.tasks.import_to_db.inserted} records`);
  } else {
    console.error('Import failed:', result.error);
  }
  
  return result;
}

// Usage
const csvBuffer = await fs.readFile('data.csv');
await importCSVData(csvBuffer);
```

### Visual Builder

1. Add "CSV Agent" node → `parseCsv`
2. Add "JSON Agent" node → `validateJson`
3. Add "Database Agent" node → `insert`
4. Connect nodes: CSV → JSON → Database
5. Configure parameters in property panel
6. Execute workflow

---

## Google Sheets Automation

**Use Case**: Read data from Google Sheets, process it, and write summary back.

### Workflow Definition

```json
{
  "name": "Sales Report Summary",
  "description": "Calculate sales totals and update summary sheet",
  "tasks": [
    {
      "id": "read_sales_data",
      "agent": "sheets",
      "action": "readSheet",
      "params": {
        "spreadsheetId": "{{workflow.config.spreadsheetId}}",
        "range": "Sales!A2:D100",
        "auth": "{{workflow.config.googleAuth}}"
      }
    },
    {
      "id": "calculate_totals",
      "agent": "json",
      "action": "transformJson",
      "params": {
        "data": "{{tasks.read_sales_data.data}}",
        "transform": "aggregateSales" // Custom function
      },
      "dependsOn": ["read_sales_data"]
    },
    {
      "id": "update_summary",
      "agent": "sheets",
      "action": "updateCells",
      "params": {
        "spreadsheetId": "{{workflow.config.spreadsheetId}}",
        "updates": [
          {
            "range": "Summary!A1:B1",
            "values": [[
              "Total Sales",
              "{{tasks.calculate_totals.total}}"
            ]]
          }
        ],
        "auth": "{{workflow.config.googleAuth}}"
      },
      "dependsOn": ["calculate_totals"]
    }
  ]
}
```

### Custom Transform Function

```typescript
function aggregateSales(salesData: any[][]) {
  const total = salesData.reduce((sum, row) => {
    const amount = parseFloat(row[3]); // Column D: Amount
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);
  
  const byProduct = salesData.reduce((acc, row) => {
    const product = row[0]; // Column A: Product
    const amount = parseFloat(row[3]);
    acc[product] = (acc[product] || 0) + amount;
    return acc;
  }, {});
  
  return {
    total,
    byProduct,
    count: salesData.length
  };
}

// Register custom transform
jsonAgent.registerTransform('aggregateSales', aggregateSales);
```

### Scheduling

Run this workflow on a schedule:

```typescript
import { scheduleWorkflow } from '../services/workflow-scheduler';

scheduleWorkflow({
  workflowId: 'sales-summary',
  schedule: '0 9 * * MON', // Every Monday at 9 AM
  config: {
    spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
    googleAuth: tokens
  }
});
```

---

## Multi-Step Data Pipeline

**Use Case**: Fetch data from API, transform it, save to database, upload to S3, and send email notification.

### Workflow Definition

```json
{
  "name": "Data Pipeline",
  "description": "Complete data processing pipeline",
  "tasks": [
    {
      "id": "fetch_api_data",
      "agent": "browser",
      "action": "fetch",
      "params": {
        "url": "https://api.example.com/data",
        "method": "GET",
        "headers": {
          "Authorization": "Bearer {{workflow.config.apiKey}}"
        }
      }
    },
    {
      "id": "parse_json",
      "agent": "json",
      "action": "parseJson",
      "params": {
        "input": "{{tasks.fetch_api_data.body}}"
      },
      "dependsOn": ["fetch_api_data"]
    },
    {
      "id": "transform_data",
      "agent": "json",
      "action": "transformJson",
      "params": {
        "data": "{{tasks.parse_json.data}}",
        "transform": "normalizeData"
      },
      "dependsOn": ["parse_json"]
    },
    {
      "id": "save_to_database",
      "agent": "database",
      "action": "insert",
      "params": {
        "table": "processed_data",
        "records": "{{tasks.transform_data.data}}"
      },
      "dependsOn": ["transform_data"]
    },
    {
      "id": "generate_report",
      "agent": "json",
      "action": "transformJson",
      "params": {
        "data": "{{tasks.transform_data.data}}",
        "transform": "generateReport"
      },
      "dependsOn": ["transform_data"]
    },
    {
      "id": "convert_to_csv",
      "agent": "csv",
      "action": "writeCsv",
      "params": {
        "data": "{{tasks.generate_report.data}}",
        "options": { "headers": true }
      },
      "dependsOn": ["generate_report"]
    },
    {
      "id": "upload_to_s3",
      "agent": "s3",
      "action": "uploadFile",
      "params": {
        "key": "reports/data-{{workflow.timestamp}}.csv",
        "body": "{{tasks.convert_to_csv.csv}}",
        "contentType": "text/csv"
      },
      "dependsOn": ["convert_to_csv"]
    },
    {
      "id": "send_notification",
      "agent": "email",
      "action": "sendEmail",
      "params": {
        "to": ["admin@example.com"],
        "subject": "Data Pipeline Completed",
        "body": "Processed {{tasks.transform_data.data.length}} records. Report available at: {{tasks.upload_to_s3.url}}"
      },
      "dependsOn": ["upload_to_s3"]
    }
  ]
}
```

### Error Handling

Add error handling for each step:

```typescript
const workflow = {
  // ... tasks above
  errorHandling: {
    retryPolicy: {
      maxRetries: 3,
      delayMs: 1000,
      backoffMultiplier: 2
    },
    onError: async (error, task) => {
      // Send error notification
      await emailAgent.sendEmail({
        to: ['admin@example.com'],
        subject: 'Pipeline Failed',
        body: `Task ${task.id} failed: ${error.message}`
      });
    }
  }
};
```

---

## Parallel Data Processing

**Use Case**: Process multiple files simultaneously for faster execution.

### Workflow Definition

```json
{
  "name": "Parallel File Processing",
  "description": "Process multiple files in parallel",
  "tasks": [
    {
      "id": "list_files",
      "agent": "s3",
      "action": "listFiles",
      "params": {
        "prefix": "inbox/",
        "maxKeys": 100
      }
    },
    {
      "id": "process_files",
      "type": "parallel",
      "strategy": "fan-out",
      "source": "{{tasks.list_files.files}}",
      "template": {
        "download": {
          "agent": "s3",
          "action": "downloadFile",
          "params": {
            "key": "{{item.key}}"
          }
        },
        "parse": {
          "agent": "csv",
          "action": "parseCsv",
          "params": {
            "input": "{{tasks.download.body}}"
          },
          "dependsOn": ["download"]
        },
        "import": {
          "agent": "database",
          "action": "insert",
          "params": {
            "table": "imported_data",
            "records": "{{tasks.parse.data}}"
          },
          "dependsOn": ["parse"]
        },
        "archive": {
          "agent": "s3",
          "action": "moveFile",
          "params": {
            "sourceKey": "{{item.key}}",
            "destinationKey": "processed/{{item.key}}"
          },
          "dependsOn": ["import"]
        }
      },
      "dependsOn": ["list_files"]
    },
    {
      "id": "aggregate_results",
      "agent": "json",
      "action": "transformJson",
      "params": {
        "data": "{{tasks.process_files.results}}",
        "transform": "aggregateResults"
      },
      "dependsOn": ["process_files"]
    }
  ]
}
```

### Parallel Execution Configuration

```typescript
const parallelConfig = {
  maxConcurrency: 5, // Process 5 files at once
  batchSize: 10,     // Process in batches of 10
  timeout: 30000,    // 30 second timeout per file
  continueOnError: true, // Don't stop if one file fails
  collectErrors: true    // Collect all errors for reporting
};

const result = await workflowOrchestrator.execute(workflow, {
  parallel: parallelConfig
});

console.log(`Processed ${result.tasks.process_files.successful} files`);
console.log(`Failed: ${result.tasks.process_files.failed} files`);
```

### Performance Monitoring

```typescript
import { performanceMonitor } from '../services/monitoring';

performanceMonitor.on('taskComplete', (task) => {
  console.log(`${task.id}: ${task.duration}ms`);
});

// Get statistics after workflow completes
const stats = performanceMonitor.getWorkflowStats(workflowId);
console.log('Total duration:', stats.totalDuration);
console.log('Avg task duration:', stats.avgTaskDuration);
console.log('Bottleneck:', stats.slowestTask);
```

---

## Database to Cloud Storage Sync

**Use Case**: Backup database tables to S3 daily.

### Workflow Definition

```json
{
  "name": "Database Backup",
  "description": "Export database tables to S3",
  "tasks": [
    {
      "id": "list_tables",
      "agent": "database",
      "action": "query",
      "params": {
        "sql": "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
      }
    },
    {
      "id": "backup_tables",
      "type": "parallel",
      "source": "{{tasks.list_tables.rows}}",
      "template": {
        "export_table": {
          "agent": "database",
          "action": "query",
          "params": {
            "sql": "SELECT * FROM {{item.table_name}}"
          }
        },
        "convert_to_json": {
          "agent": "json",
          "action": "transformJson",
          "params": {
            "data": "{{tasks.export_table.rows}}",
            "transform": "toJSON"
          },
          "dependsOn": ["export_table"]
        },
        "upload_backup": {
          "agent": "s3",
          "action": "uploadFile",
          "params": {
            "key": "backups/{{workflow.date}}/{{item.table_name}}.json",
            "body": "{{tasks.convert_to_json.json}}",
            "contentType": "application/json",
            "metadata": {
              "table": "{{item.table_name}}",
              "rows": "{{tasks.export_table.rowCount}}",
              "timestamp": "{{workflow.timestamp}}"
            }
          },
          "dependsOn": ["convert_to_json"]
        }
      },
      "dependsOn": ["list_tables"]
    },
    {
      "id": "create_manifest",
      "agent": "json",
      "action": "transformJson",
      "params": {
        "data": "{{tasks.backup_tables.results}}",
        "transform": "createManifest"
      },
      "dependsOn": ["backup_tables"]
    },
    {
      "id": "upload_manifest",
      "agent": "s3",
      "action": "uploadFile",
      "params": {
        "key": "backups/{{workflow.date}}/manifest.json",
        "body": "{{tasks.create_manifest.manifest}}",
        "contentType": "application/json"
      },
      "dependsOn": ["create_manifest"]
    }
  ]
}
```

### Scheduled Execution

```typescript
import { scheduleWorkflow } from '../services/workflow-scheduler';

// Run daily at 2 AM
scheduleWorkflow({
  workflowId: 'db-backup',
  schedule: '0 2 * * *',
  timezone: 'America/New_York',
  retryOnFailure: true,
  notifyOnFailure: ['admin@example.com']
});
```

---

## Email Report Generation

**Use Case**: Generate weekly sales report from database and email to stakeholders.

### Workflow Definition

```json
{
  "name": "Weekly Sales Report",
  "description": "Generate and email weekly sales report",
  "tasks": [
    {
      "id": "fetch_sales_data",
      "agent": "database",
      "action": "query",
      "params": {
        "sql": "SELECT * FROM sales WHERE created_at >= NOW() - INTERVAL '7 days'"
      }
    },
    {
      "id": "calculate_metrics",
      "agent": "json",
      "action": "transformJson",
      "params": {
        "data": "{{tasks.fetch_sales_data.rows}}",
        "transform": "calculateMetrics"
      },
      "dependsOn": ["fetch_sales_data"]
    },
    {
      "id": "generate_csv_report",
      "agent": "csv",
      "action": "writeCsv",
      "params": {
        "data": "{{tasks.fetch_sales_data.rows}}",
        "options": { "headers": true }
      },
      "dependsOn": ["fetch_sales_data"]
    },
    {
      "id": "generate_pdf_summary",
      "agent": "pdf",
      "action": "generatePdf",
      "params": {
        "content": [
          {
            "type": "text",
            "text": "Weekly Sales Report",
            "fontSize": 24,
            "bold": true
          },
          {
            "type": "text",
            "text": "Period: {{workflow.startDate}} to {{workflow.endDate}}",
            "fontSize": 12
          },
          {
            "type": "table",
            "headers": ["Metric", "Value"],
            "rows": [
              ["Total Sales", "${{tasks.calculate_metrics.totalSales}}"],
              ["Total Orders", "{{tasks.calculate_metrics.orderCount}}"],
              ["Avg Order Value", "${{tasks.calculate_metrics.avgOrderValue}}"]
            ]
          }
        ]
      },
      "dependsOn": ["calculate_metrics"]
    },
    {
      "id": "send_report_email",
      "agent": "email",
      "action": "sendEmail",
      "params": {
        "to": ["sales@example.com", "management@example.com"],
        "subject": "Weekly Sales Report - {{workflow.weekOf}}",
        "html": "<h1>Weekly Sales Report</h1><p>Please find attached this week's sales report.</p><p>Total Sales: ${{tasks.calculate_metrics.totalSales}}</p>",
        "attachments": [
          {
            "filename": "sales-data.csv",
            "content": "{{tasks.generate_csv_report.csv}}"
          },
          {
            "filename": "summary.pdf",
            "content": "{{tasks.generate_pdf_summary.buffer}}"
          }
        ]
      },
      "dependsOn": ["generate_csv_report", "generate_pdf_summary"]
    }
  ]
}
```

### Metrics Calculation

```typescript
function calculateMetrics(salesData: any[]) {
  const totalSales = salesData.reduce((sum, sale) => sum + sale.amount, 0);
  const orderCount = salesData.length;
  const avgOrderValue = orderCount > 0 ? totalSales / orderCount : 0;
  
  const topProducts = salesData
    .reduce((acc, sale) => {
      acc[sale.product] = (acc[sale.product] || 0) + sale.amount;
      return acc;
    }, {});
  
  const topProductsArray = Object.entries(topProducts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  return {
    totalSales: totalSales.toFixed(2),
    orderCount,
    avgOrderValue: avgOrderValue.toFixed(2),
    topProducts: topProductsArray
  };
}

jsonAgent.registerTransform('calculateMetrics', calculateMetrics);
```

---

## Best Practices

### 1. Error Handling

Always implement proper error handling:

```typescript
const workflow = {
  tasks: [...],
  errorHandling: {
    retryPolicy: {
      maxRetries: 3,
      delayMs: 1000,
      backoffMultiplier: 2
    },
    fallback: {
      onTaskError: 'continue', // or 'stop'
      defaultValue: null
    },
    notifications: {
      onError: ['admin@example.com'],
      includeStackTrace: true
    }
  }
};
```

### 2. Input Validation

Validate workflow inputs:

```typescript
const schema = {
  type: 'object',
  properties: {
    csvFile: { type: 'string' },
    targetTable: { type: 'string', pattern: '^[a-z_]+$' }
  },
  required: ['csvFile', 'targetTable']
};

await jsonAgent.validateJson({
  data: workflowInput,
  schema
});
```

### 3. Resource Management

Clean up resources after workflow:

```typescript
workflow.cleanup = async (context) => {
  if (context.dbConnection) {
    await dbAgent.disconnect();
  }
  if (context.tempFiles) {
    await Promise.all(
      context.tempFiles.map(file => fileAgent.deleteFile({ path: file }))
    );
  }
};
```

### 4. Monitoring & Logging

Add comprehensive logging:

```typescript
import { logger } from '../utils/logger';

workflow.hooks = {
  beforeTask: (task) => {
    logger.info(`Starting task: ${task.id}`);
  },
  afterTask: (task, result) => {
    logger.info(`Completed task: ${task.id}`, { duration: result.duration });
  },
  onError: (task, error) => {
    logger.error(`Task failed: ${task.id}`, { error });
  }
};
```

### 5. Testing

Test workflows before production:

```typescript
import { workflowValidator } from '../services/workflow-validator';

// Validate workflow structure
const validation = await workflowValidator.validate(workflow);
if (!validation.valid) {
  console.error('Invalid workflow:', validation.errors);
}

// Dry run (simulation without execution)
const dryRunResult = await workflowOrchestrator.dryRun(workflow);
console.log('Dry run:', dryRunResult.executionPlan);
```

---

## Next Steps

- [Agents Reference](./AGENTS_REFERENCE.md) - Complete agent documentation
- [Creating Custom Agents](./CREATING_CUSTOM_AGENTS.md) - Build your own agents
- [Extending Orchestrator](./EXTENDING_ORCHESTRATOR.md) - Advanced orchestration patterns
- [Visual Workflow Builder](../../WORKFLOW_BUILDER_INTEGRATION.md) - Build workflows visually
