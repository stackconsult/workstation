# Phase 8.1 - Agent Documentation

## Data Agents

### CSV Agent

**Location**: `src/automation/agents/data/csv.ts`

**Purpose**: Parse, transform, filter, and write CSV data files.

**Capabilities**:
- `parse_csv` - Parse CSV files/strings into structured data
- `write_csv` - Convert data to CSV format
- `filter_csv` - Filter CSV rows by conditions
- `transform_csv` - Map/transform CSV columns

**Usage Examples**:

```typescript
// Parse CSV from string
const csvAgent = new CSVAgent();
const result = await csvAgent.parseCsv({
  input: `name,age,city
John,30,NYC
Jane,25,LA`,
  options: { 
    delimiter: ',',
    hasHeaders: true
  }
});
console.log(result.data);
// Output: [{ name: 'John', age: 30, city: 'NYC' }, { name: 'Jane', age: 25, city: 'LA' }]

// Filter CSV data
const filtered = await csvAgent.filterCsv({
  data: result.data,
  filters: [
    { column: 'age', operator: 'gt', value: 25 }
  ]
});

// Transform CSV data
const transformed = await csvAgent.transformCsv({
  data: result.data,
  transforms: {
    columns: { name: 'fullName' }, // Rename column
    mapValues: {
      age: (val) => val + 1 // Increment age
    }
  }
});

// Write to CSV
const csv = await csvAgent.writeCsv({
  data: transformed.data,
  options: { delimiter: ',', includeHeaders: true }
});
```

---

### JSON Agent

**Location**: `src/automation/agents/data/json.ts`

**Purpose**: Parse, validate, query, and transform JSON data.

**Capabilities**:
- `parse_json` - Parse JSON strings with validation
- `query_json` - Execute JSONPath queries
- `validate_json` - Schema validation
- `transform_json` - Data transformation

**Usage Examples**:

```typescript
const jsonAgent = new JSONAgent();

// Parse JSON with validation
const result = await jsonAgent.parseJson({
  input: '{"name":"John","age":30}'
});

// JSONPath query
const queried = await jsonAgent.queryJson({
  data: { users: [{ name: 'John', age: 30 }, { name: 'Jane', age: 25 }] },
  query: '$.users[?(@.age > 25)]'
});

// Validate against schema
const validated = await jsonAgent.validateJson({
  data: { name: 'John', age: 30 },
  schema: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      age: { type: 'number' }
    },
    required: ['name', 'age']
  }
});

// Transform JSON data
const transformed = await jsonAgent.transformJson({
  data: { firstName: 'John', lastName: 'Doe' },
  transforms: {
    pick: ['firstName'], // Select specific fields
    rename: { firstName: 'name' }
  }
});
```

---

### Excel Agent

**Location**: `src/automation/agents/data/excel.ts`

**Purpose**: Read and write Excel files (XLSX format) with multi-sheet support.

**Capabilities**:
- `readExcel` - Read Excel files (all sheets or specific)
- `writeExcel` - Write data to Excel format
- `getSheet` - Extract specific sheet data
- `listSheets` - List all sheets in workbook

**Usage Examples**:

```typescript
const excelAgent = new ExcelAgent();

// Read Excel file
const result = await excelAgent.readExcel({
  buffer: fileBuffer,
  sheetName: 'Sheet1' // Optional, reads all sheets if omitted
});

// Write to Excel
const excel = await excelAgent.writeExcel({
  data: [
    { name: 'John', age: 30 },
    { name: 'Jane', age: 25 }
  ],
  sheetName: 'Employees',
  options: { 
    columnWidths: [20, 10],
    headerStyle: { bold: true }
  }
});

// List sheets
const sheets = await excelAgent.listSheets({
  buffer: fileBuffer
});
console.log(sheets); // ['Sheet1', 'Sheet2', 'Data']

// Get specific sheet
const sheetData = await excelAgent.getSheet({
  buffer: fileBuffer,
  sheetName: 'Sheet2'
});
```

---

### PDF Agent

**Location**: `src/automation/agents/data/pdf.ts`

**Purpose**: Extract text and tables from PDFs, generate PDF documents.

**Capabilities**:
- `extractText` - Extract text from PDF
- `extractTables` - Extract tables from PDF
- `generatePdf` - Create PDF documents
- `mergePdfs` - Combine multiple PDFs

**Usage Examples**:

```typescript
const pdfAgent = new PDFAgent();

// Extract text from PDF
const text = await pdfAgent.extractText({
  buffer: pdfBuffer,
  pages: [1, 2, 3] // Optional, extracts all if omitted
});

// Extract tables
const tables = await pdfAgent.extractTables({
  buffer: pdfBuffer,
  page: 1
});

// Generate PDF
const pdf = await pdfAgent.generatePdf({
  content: [
    { type: 'text', value: 'Hello World', style: { fontSize: 16 } },
    { type: 'table', value: { headers: ['Name', 'Age'], rows: [['John', '30']] } }
  ],
  options: {
    pageSize: 'A4',
    margins: { top: 50, bottom: 50, left: 50, right: 50 }
  }
});
```

---

### RSS Agent

**Location**: `src/automation/agents/data/rss.ts`

**Purpose**: Fetch and parse RSS feeds, extract client intelligence.

**Capabilities**:
- `fetchFeed` - Fetch RSS feed from URL
- `parseFeed` - Parse RSS/Atom feed
- `filterByClient` - Filter entries by client mentions
- `extractIntelligence` - Extract client-specific intelligence

**Usage Examples**:

```typescript
const rssAgent = new RSSAgent();

// Fetch and parse RSS feed
const feed = await rssAgent.fetchFeed({
  url: 'https://example.com/feed.xml'
});

// Filter by client mention
const clientNews = await rssAgent.filterByClient({
  feed: feed.items,
  clientName: 'Acme Corp',
  keywords: ['acquisition', 'merger', 'expansion']
});

// Extract intelligence
const intelligence = await rssAgent.extractIntelligence({
  entries: clientNews,
  categories: ['financial', 'strategic', 'operational']
});
```

---

## Integration Agents

### Google Sheets Agent

**Location**: `src/automation/agents/integration/sheets.ts`

**Purpose**: Interact with Google Sheets via Google Sheets API.

**Capabilities**:
- `read` - Read data from spreadsheet
- `write` - Write data to spreadsheet
- `append` - Append rows to spreadsheet
- `update` - Update specific cells
- `batchUpdate` - Perform multiple updates
- `createSpreadsheet` - Create new spreadsheet

**OAuth Setup**:
1. Enable Google Sheets API in Google Cloud Console
2. Create OAuth 2.0 credentials
3. Set environment variables:
   ```bash
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
   ```

**Usage Examples**:

```typescript
const sheetsAgent = new GoogleSheetsAgent();

// Read from sheet
const data = await sheetsAgent.read({
  spreadsheetId: 'abc123',
  range: 'Sheet1!A1:D10'
});

// Write to sheet
await sheetsAgent.write({
  spreadsheetId: 'abc123',
  range: 'Sheet1!A1',
  values: [
    ['Name', 'Age', 'City'],
    ['John', 30, 'NYC'],
    ['Jane', 25, 'LA']
  ]
});

// Append rows
await sheetsAgent.append({
  spreadsheetId: 'abc123',
  range: 'Sheet1',
  values: [['Bob', 35, 'SF']]
});

// Batch update
await sheetsAgent.batchUpdate({
  spreadsheetId: 'abc123',
  requests: [
    { updateCells: { range: 'Sheet1!A1', values: [['Updated']] } },
    { deleteRange: { range: 'Sheet1!C1:C10' } }
  ]
});
```

**Troubleshooting**:
- **401 Unauthorized**: Check OAuth credentials and token expiry
- **403 Forbidden**: Verify spreadsheet sharing permissions
- **429 Too Many Requests**: Implement rate limiting (100 requests/100 seconds per user)

---

### Google Calendar Agent

**Location**: `src/automation/agents/integration/calendar.ts`

**Purpose**: Manage Google Calendar events and availability.

**Capabilities**:
- `listEvents` - List calendar events
- `createEvent` - Create calendar event
- `updateEvent` - Update existing event
- `deleteEvent` - Delete event
- `checkAvailability` - Check free/busy times

**OAuth Setup**: Same as Google Sheets Agent

**Usage Examples**:

```typescript
const calendarAgent = new GoogleCalendarAgent();

// List events
const events = await calendarAgent.listEvents({
  calendarId: 'primary',
  timeMin: '2025-01-01T00:00:00Z',
  timeMax: '2025-01-31T23:59:59Z'
});

// Create event
const event = await calendarAgent.createEvent({
  calendarId: 'primary',
  summary: 'Team Meeting',
  start: { dateTime: '2025-01-15T10:00:00Z', timeZone: 'America/New_York' },
  end: { dateTime: '2025-01-15T11:00:00Z', timeZone: 'America/New_York' },
  attendees: ['john@example.com', 'jane@example.com']
});

// Check availability
const availability = await calendarAgent.checkAvailability({
  calendarId: 'primary',
  timeMin: '2025-01-15T09:00:00Z',
  timeMax: '2025-01-15T17:00:00Z'
});
```

---

### Email Agent

**Location**: `src/automation/agents/integration/email.ts`

**Purpose**: Send and manage emails via Gmail, Outlook, IMAP/SMTP.

**Capabilities**:
- `send` - Send email with attachments
- `fetch` - Fetch emails
- `search` - Search emails by criteria
- `markAsRead` - Mark emails as read
- `delete` - Delete emails

**Usage Examples**:

```typescript
const emailAgent = new EmailAgent();

// Send email
await emailAgent.send({
  to: ['john@example.com'],
  subject: 'Test Email',
  body: 'Hello World',
  attachments: [
    { filename: 'report.pdf', content: pdfBuffer }
  ]
});

// Fetch emails
const emails = await emailAgent.fetch({
  provider: 'gmail',
  folder: 'INBOX',
  limit: 10,
  unreadOnly: true
});

// Search emails
const results = await emailAgent.search({
  query: 'from:john@example.com subject:report',
  dateRange: { start: '2025-01-01', end: '2025-01-31' }
});
```

---

## Storage Agents

### Database Agent

**Location**: `src/automation/agents/storage/database.ts`

**Purpose**: Execute SQL queries on PostgreSQL and SQLite databases.

**Capabilities**:
- `query` - Execute SELECT queries
- `insert` - Insert records
- `update` - Update records
- `delete` - Delete records
- `transaction` - Execute transactional queries

**Usage Examples**:

```typescript
const dbAgent = new DatabaseAgent();

// Query
const users = await dbAgent.query({
  connection: 'postgresql://localhost/mydb',
  sql: 'SELECT * FROM users WHERE age > $1',
  params: [25]
});

// Insert
await dbAgent.insert({
  connection: 'postgresql://localhost/mydb',
  table: 'users',
  data: { name: 'John', age: 30, city: 'NYC' }
});

// Transaction
await dbAgent.transaction({
  connection: 'postgresql://localhost/mydb',
  queries: [
    { sql: 'INSERT INTO users (name) VALUES ($1)', params: ['John'] },
    { sql: 'INSERT INTO orders (user_id) VALUES ($1)', params: [1] }
  ]
});
```

**Security Note**: Always use parameterized queries to prevent SQL injection!

---

### S3 Storage Agent

**Location**: `src/automation/agents/storage/s3.ts`

**Purpose**: Upload, download, and manage files in AWS S3.

**Capabilities**:
- `upload` - Upload file to S3
- `download` - Download file from S3
- `list` - List objects in bucket
- `delete` - Delete object
- `getPresignedUrl` - Generate presigned URL

**Usage Examples**:

```typescript
const s3Agent = new S3Agent();

// Upload file
await s3Agent.upload({
  bucket: 'my-bucket',
  key: 'reports/2025-01.pdf',
  body: fileBuffer,
  contentType: 'application/pdf'
});

// Download file
const file = await s3Agent.download({
  bucket: 'my-bucket',
  key: 'reports/2025-01.pdf'
});

// Get presigned URL (expires in 1 hour)
const url = await s3Agent.getPresignedUrl({
  bucket: 'my-bucket',
  key: 'reports/2025-01.pdf',
  expiresIn: 3600
});
```

---

### File Storage Agent

**Location**: `src/automation/agents/storage/file.ts`

**Purpose**: Manage files across local, S3, GCS, and Azure storage.

**Capabilities**:
- `read` - Read file content
- `write` - Write file content
- `list` - List files in directory
- `delete` - Delete file
- `copy` - Copy file between locations

**Usage Examples**:

```typescript
const fileAgent = new FileAgent();

// Read file
const content = await fileAgent.read({
  provider: 'local',
  path: '/tmp/data.json'
});

// Write file
await fileAgent.write({
  provider: 's3',
  path: 's3://my-bucket/data.json',
  content: JSON.stringify(data),
  contentType: 'application/json'
});

// List files
const files = await fileAgent.list({
  provider: 'gcs',
  path: 'gs://my-bucket/reports/'
});
```

---

## Common Patterns

### Error Handling

All agents follow consistent error handling:

```typescript
try {
  const result = await agent.operation(params);
  if (!result.success) {
    console.error('Operation failed:', result.error);
  }
} catch (error) {
  console.error('Unexpected error:', error);
}
```

### Retry Logic

Agents support automatic retries for transient failures:

```typescript
const result = await agent.operation({
  ...params,
  retry: {
    maxAttempts: 3,
    delayMs: 1000,
    backoffMultiplier: 2
  }
});
```

### Progress Tracking

Monitor long-running operations:

```typescript
const result = await agent.operation({
  ...params,
  onProgress: (progress) => {
    console.log(`Progress: ${progress.percent}%`);
  }
});
```

---

## Next Steps

- See `docs/workflow-examples.md` for complete workflow examples
- See `docs/oauth-setup.md` for OAuth configuration details
- See `docs/troubleshooting.md` for common issues and solutions
