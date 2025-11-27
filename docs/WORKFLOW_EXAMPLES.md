# Phase 8.2 - Workflow Examples

## Example 1: CSV Data Processing Pipeline

**Use Case**: Import CSV data, transform it, and save to database.

**Workflow Steps**:
1. Parse CSV file
2. Filter invalid records
3. Transform data structure
4. Insert into database

**Implementation**:

```typescript
import { CSVAgent } from './agents/data/csv';
import { DatabaseAgent } from './agents/storage/database';

async function csvProcessingPipeline(csvData: string) {
  const csvAgent = new CSVAgent();
  const dbAgent = new DatabaseAgent();
  
  // Step 1: Parse CSV
  const parsed = await csvAgent.parseCsv({
    input: csvData,
    options: { delimiter: ',', hasHeaders: true }
  });
  
  if (!parsed.success) {
    throw new Error(`CSV parsing failed: ${parsed.error}`);
  }
  
  // Step 2: Filter invalid records
  const filtered = await csvAgent.filterCsv({
    data: parsed.data,
    filters: [
      { column: 'email', operator: 'contains', value: '@' }, // Valid email
      { column: 'age', operator: 'gte', value: 18 } // Adult only
    ]
  });
  
  // Step 3: Transform data
  const transformed = await csvAgent.transformCsv({
    data: filtered.data,
    transforms: {
      columns: {
        'first_name': 'firstName',
        'last_name': 'lastName'
      },
      mapValues: {
        email: (val) => val.toLowerCase().trim()
      }
    }
  });
  
  // Step 4: Insert into database
  for (const record of transformed.data) {
    await dbAgent.insert({
      connection: process.env.DATABASE_URL,
      table: 'users',
      data: record
    });
  }
  
  return {
    processed: transformed.data.length,
    filtered: parsed.data.length - filtered.data.length
  };
}

// Usage
const csvContent = `first_name,last_name,email,age
John,Doe,john@example.com,30
Jane,Smith,jane@example.com,25
Bob,Invalid,,15`;

const result = await csvProcessingPipeline(csvContent);
console.log(`Processed ${result.processed} records, filtered ${result.filtered}`);
```

**Chrome Extension Workflow**:
```json
{
  "name": "CSV to Database Pipeline",
  "nodes": [
    {
      "id": "csv-1",
      "type": "csv",
      "action": "parseCsv",
      "config": { "delimiter": "," }
    },
    {
      "id": "csv-2",
      "type": "csv",
      "action": "filterCsv",
      "config": {
        "filters": [
          { "column": "email", "operator": "contains", "value": "@" }
        ]
      }
    },
    {
      "id": "csv-3",
      "type": "csv",
      "action": "transformCsv",
      "config": {
        "columns": { "first_name": "firstName" }
      }
    },
    {
      "id": "db-1",
      "type": "database",
      "action": "insert",
      "config": { "table": "users" }
    }
  ],
  "edges": [
    { "from": "csv-1", "to": "csv-2" },
    { "from": "csv-2", "to": "csv-3" },
    { "from": "csv-3", "to": "db-1" }
  ]
}
```

---

## Example 2: Google Sheets Automation

**Use Case**: Fetch data from Google Sheets, process it, and send email reports.

**Workflow Steps**:
1. Read data from Google Sheets
2. Calculate aggregations
3. Generate PDF report
4. Send email with PDF attachment

**Implementation**:

```typescript
import { GoogleSheetsAgent } from './agents/integration/sheets';
import { PDFAgent } from './agents/data/pdf';
import { EmailAgent } from './agents/integration/email';

async function sheetsReportingWorkflow() {
  const sheetsAgent = new GoogleSheetsAgent();
  const pdfAgent = new PDFAgent();
  const emailAgent = new EmailAgent();
  
  // Step 1: Read from Google Sheets
  const data = await sheetsAgent.read({
    spreadsheetId: process.env.SPREADSHEET_ID,
    range: 'Sales!A1:E100'
  });
  
  // Step 2: Calculate aggregations
  const salesData = data.values.slice(1); // Skip header
  const totalSales = salesData.reduce((sum, row) => sum + parseFloat(row[4] || 0), 0);
  const avgSale = totalSales / salesData.length;
  
  const summary = {
    totalRecords: salesData.length,
    totalSales: totalSales.toFixed(2),
    averageSale: avgSale.toFixed(2),
    topSalesperson: salesData.sort((a, b) => parseFloat(b[4]) - parseFloat(a[4]))[0][0]
  };
  
  // Step 3: Generate PDF report
  const pdf = await pdfAgent.generatePdf({
    content: [
      { type: 'text', value: 'Sales Report', style: { fontSize: 20, bold: true } },
      { type: 'text', value: `Total Sales: $${summary.totalSales}` },
      { type: 'text', value: `Average Sale: $${summary.averageSale}` },
      { type: 'text', value: `Top Salesperson: ${summary.topSalesperson}` },
      { type: 'table', value: {
        headers: ['Name', 'Region', 'Product', 'Date', 'Amount'],
        rows: salesData.slice(0, 10) // Top 10
      }}
    ]
  });
  
  // Step 4: Send email
  await emailAgent.send({
    to: ['manager@example.com'],
    subject: 'Weekly Sales Report',
    body: `Please find attached the weekly sales report.\n\nTotal Sales: $${summary.totalSales}`,
    attachments: [
      { filename: 'sales-report.pdf', content: pdf.buffer }
    ]
  });
  
  return summary;
}
```

**Chrome Extension Workflow**:
```json
{
  "name": "Sheets to Email Report",
  "nodes": [
    {
      "id": "sheets-1",
      "type": "sheets",
      "action": "read",
      "config": {
        "spreadsheetId": "${SPREADSHEET_ID}",
        "range": "Sales!A1:E100"
      }
    },
    {
      "id": "transform-1",
      "type": "json",
      "action": "transform",
      "config": {
        "aggregate": {
          "totalSales": "sum(values[*][4])"
        }
      }
    },
    {
      "id": "pdf-1",
      "type": "pdf",
      "action": "generate",
      "config": {
        "template": "sales-report"
      }
    },
    {
      "id": "email-1",
      "type": "email",
      "action": "send",
      "config": {
        "to": "manager@example.com",
        "subject": "Weekly Sales Report"
      }
    }
  ],
  "edges": [
    { "from": "sheets-1", "to": "transform-1" },
    { "from": "transform-1", "to": "pdf-1" },
    { "from": "pdf-1", "to": "email-1" }
  ]
}
```

---

## Example 3: Multi-Step Data Pipeline

**Use Case**: Extract data from multiple sources, merge, and store in S3.

**Workflow Steps**:
1. Fetch RSS feeds (client news)
2. Query database (client info)
3. Merge data
4. Convert to JSON
5. Upload to S3

**Implementation**:

```typescript
import { RSSAgent } from './agents/data/rss';
import { DatabaseAgent } from './agents/storage/database';
import { JSONAgent } from './agents/data/json';
import { S3Agent } from './agents/storage/s3';

async function dataPipelineWorkflow(clientName: string) {
  const rssAgent = new RSSAgent();
  const dbAgent = new DatabaseAgent();
  const jsonAgent = new JSONAgent();
  const s3Agent = new S3Agent();
  
  // Step 1: Fetch RSS feeds
  const feed = await rssAgent.fetchFeed({
    url: 'https://news.example.com/feed.xml'
  });
  
  const clientNews = await rssAgent.filterByClient({
    feed: feed.items,
    clientName: clientName
  });
  
  // Step 2: Query database for client info
  const clientInfo = await dbAgent.query({
    connection: process.env.DATABASE_URL,
    sql: 'SELECT * FROM clients WHERE name = $1',
    params: [clientName]
  });
  
  // Step 3: Merge data
  const merged = {
    client: clientInfo.rows[0],
    news: clientNews,
    reportDate: new Date().toISOString()
  };
  
  // Step 4: Convert to JSON
  const json = JSON.stringify(merged, null, 2);
  
  // Step 5: Upload to S3
  await s3Agent.upload({
    bucket: 'client-intelligence',
    key: `reports/${clientName}-${Date.now()}.json`,
    body: Buffer.from(json),
    contentType: 'application/json'
  });
  
  return {
    newsCount: clientNews.length,
    reportKey: `reports/${clientName}-${Date.now()}.json`
  };
}
```

**Chrome Extension Workflow**:
```json
{
  "name": "Multi-Source Data Pipeline",
  "nodes": [
    {
      "id": "rss-1",
      "type": "rss",
      "action": "fetchFeed",
      "config": { "url": "https://news.example.com/feed.xml" }
    },
    {
      "id": "rss-2",
      "type": "rss",
      "action": "filterByClient",
      "config": { "clientName": "${clientName}" }
    },
    {
      "id": "db-1",
      "type": "database",
      "action": "query",
      "config": {
        "sql": "SELECT * FROM clients WHERE name = $1",
        "params": ["${clientName}"]
      }
    },
    {
      "id": "json-1",
      "type": "json",
      "action": "merge",
      "config": {}
    },
    {
      "id": "s3-1",
      "type": "s3",
      "action": "upload",
      "config": {
        "bucket": "client-intelligence",
        "keyPattern": "reports/${clientName}-${timestamp}.json"
      }
    }
  ],
  "edges": [
    { "from": "rss-1", "to": "rss-2" },
    { "from": "rss-2", "to": "json-1" },
    { "from": "db-1", "to": "json-1" },
    { "from": "json-1", "to": "s3-1" }
  ]
}
```

---

## Example 4: Parallel Data Processing

**Use Case**: Process multiple data sources simultaneously for maximum performance.

**Workflow Steps**:
1. Parallel: Fetch 3 different CSV files
2. Parallel: Transform each CSV
3. Merge all results
4. Save to database

**Implementation**:

```typescript
import { CSVAgent } from './agents/data/csv';
import { FileAgent } from './agents/storage/file';
import { DatabaseAgent } from './agents/storage/database';

async function parallelProcessingWorkflow() {
  const csvAgent = new CSVAgent();
  const fileAgent = new FileAgent();
  const dbAgent = new DatabaseAgent();
  
  const files = [
    's3://data-bucket/sales-q1.csv',
    's3://data-bucket/sales-q2.csv',
    's3://data-bucket/sales-q3.csv'
  ];
  
  // Step 1 & 2: Parallel fetch and transform
  const results = await Promise.all(
    files.map(async (filePath) => {
      // Fetch file
      const content = await fileAgent.read({
        provider: 's3',
        path: filePath
      });
      
      // Parse CSV
      const parsed = await csvAgent.parseCsv({
        input: content.toString(),
        options: { delimiter: ',' }
      });
      
      // Transform
      const transformed = await csvAgent.transformCsv({
        data: parsed.data,
        transforms: {
          mapValues: {
            amount: (val) => parseFloat(val) * 1.1 // 10% markup
          }
        }
      });
      
      return transformed.data;
    })
  );
  
  // Step 3: Merge results
  const merged = results.flat();
  
  // Step 4: Save to database
  await dbAgent.transaction({
    connection: process.env.DATABASE_URL,
    queries: merged.map(record => ({
      sql: 'INSERT INTO sales (product, amount, date) VALUES ($1, $2, $3)',
      params: [record.product, record.amount, record.date]
    }))
  });
  
  return {
    filesProcessed: files.length,
    recordsInserted: merged.length
  };
}
```

**Chrome Extension Workflow** (with parallel execution):
```json
{
  "name": "Parallel CSV Processing",
  "nodes": [
    {
      "id": "file-1",
      "type": "file",
      "action": "read",
      "config": { "path": "s3://data-bucket/sales-q1.csv" },
      "parallelGroup": 1
    },
    {
      "id": "file-2",
      "type": "file",
      "action": "read",
      "config": { "path": "s3://data-bucket/sales-q2.csv" },
      "parallelGroup": 1
    },
    {
      "id": "file-3",
      "type": "file",
      "action": "read",
      "config": { "path": "s3://data-bucket/sales-q3.csv" },
      "parallelGroup": 1
    },
    {
      "id": "csv-1",
      "type": "csv",
      "action": "parseCsv",
      "config": {},
      "parallelGroup": 2
    },
    {
      "id": "csv-2",
      "type": "csv",
      "action": "parseCsv",
      "config": {},
      "parallelGroup": 2
    },
    {
      "id": "csv-3",
      "type": "csv",
      "action": "parseCsv",
      "config": {},
      "parallelGroup": 2
    },
    {
      "id": "merge-1",
      "type": "json",
      "action": "merge",
      "config": {},
      "parallelGroup": 3
    },
    {
      "id": "db-1",
      "type": "database",
      "action": "batchInsert",
      "config": { "table": "sales" },
      "parallelGroup": 4
    }
  ],
  "edges": [
    { "from": "file-1", "to": "csv-1" },
    { "from": "file-2", "to": "csv-2" },
    { "from": "file-3", "to": "csv-3" },
    { "from": "csv-1", "to": "merge-1" },
    { "from": "csv-2", "to": "merge-1" },
    { "from": "csv-3", "to": "merge-1" },
    { "from": "merge-1", "to": "db-1" }
  ]
}
```

**Performance**: This parallel approach processes 3 files in ~1x time instead of 3x time with sequential processing.

---

## Workflow Best Practices

### 1. Error Handling
Always handle errors gracefully:
```typescript
try {
  const result = await agent.operation(params);
  if (!result.success) {
    // Handle failure
    await notificationAgent.send({
      message: `Operation failed: ${result.error}`
    });
  }
} catch (error) {
  // Handle unexpected errors
  await logAgent.error('Unexpected error', { error });
}
```

### 2. Data Validation
Validate data between steps:
```typescript
const validated = await jsonAgent.validateJson({
  data: transformed.data,
  schema: expectedSchema
});

if (!validated.valid) {
  throw new Error(`Validation failed: ${validated.errors}`);
}
```

### 3. Progress Monitoring
Track progress for long workflows:
```typescript
const totalSteps = workflow.nodes.length;
let completedSteps = 0;

workflow.nodes.forEach(async (node) => {
  await executeNode(node);
  completedSteps++;
  console.log(`Progress: ${(completedSteps/totalSteps*100).toFixed(0)}%`);
});
```

### 4. Resource Cleanup
Always cleanup resources:
```typescript
try {
  const connection = await dbAgent.connect();
  // ... use connection
} finally {
  await dbAgent.disconnect();
}
```

### 5. Retry Logic
Implement retries for transient failures:
```typescript
const result = await executeWithRetry(
  () => apiAgent.call(params),
  { maxAttempts: 3, delayMs: 1000 }
);
```

---

## Testing Workflows

Use the test framework to validate workflows:

```typescript
import { WorkflowExecutor } from './orchestrator/executor';

describe('CSV Processing Workflow', () => {
  it('should process CSV and save to database', async () => {
    const executor = new WorkflowExecutor();
    const result = await executor.execute({
      workflow: csvProcessingWorkflow,
      inputs: { csvData: testCsvData }
    });
    
    expect(result.success).toBe(true);
    expect(result.processed).toBeGreaterThan(0);
  });
});
```

---

## Next Steps

- See `docs/AGENT_DOCUMENTATION.md` for detailed agent API reference
- See `docs/oauth-setup.md` for OAuth configuration
- See `docs/troubleshooting.md` for common issues
- See `chrome-extension/README.md` for Chrome extension workflow builder guide
