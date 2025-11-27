# Agents Reference Guide

Complete reference for all data, integration, and storage agents in the Workstation platform.

## Table of Contents

1. [Data Agents](#data-agents)
   - [CSV Agent](#csv-agent)
   - [JSON Agent](#json-agent)
   - [Excel Agent](#excel-agent)
   - [PDF Agent](#pdf-agent)
2. [Integration Agents](#integration-agents)
   - [Google Sheets Agent](#google-sheets-agent)
   - [Calendar Agent](#calendar-agent)
   - [Email Agent](#email-agent)
3. [Storage Agents](#storage-agents)
   - [Database Agent](#database-agent)
   - [S3/Cloud Storage Agent](#s3cloud-storage-agent)
   - [File Agent](#file-agent)
4. [OAuth Setup](#oauth-setup)
5. [Troubleshooting](#troubleshooting)

---

## Data Agents

### CSV Agent

Parse, transform, and generate CSV files with advanced filtering capabilities.

#### Capabilities

- **parse_csv**: Parse CSV file or string into structured data
- **write_csv**: Convert data to CSV format
- **filter_csv**: Filter CSV rows by conditions
- **transform_csv**: Map/transform CSV columns

#### Examples

**Parse CSV from string:**
```typescript
const result = await csvAgent.parseCsv({
  input: "name,age,city\nJohn,30,NYC\nJane,25,LA",
  options: {
    headers: true,
    delimiter: ','
  }
});
// Result: { success: true, data: [{ name: 'John', age: '30', city: 'NYC' }, ...] }
```

**Filter CSV data:**
```typescript
const result = await csvAgent.filterCsv({
  data: [
    { name: 'John', age: 30, city: 'NYC' },
    { name: 'Jane', age: 25, city: 'LA' }
  ],
  condition: (row) => row.age > 25
});
// Result: { success: true, data: [{ name: 'John', age: 30, city: 'NYC' }] }
```

**Transform CSV columns:**
```typescript
const result = await csvAgent.transformCsv({
  data: [{ name: 'John', age: 30 }],
  transform: (row) => ({
    fullName: row.name.toUpperCase(),
    ageInMonths: row.age * 12
  })
});
// Result: { success: true, data: [{ fullName: 'JOHN', ageInMonths: 360 }] }
```

**Write CSV:**
```typescript
const result = await csvAgent.writeCsv({
  data: [
    { name: 'John', age: 30 },
    { name: 'Jane', age: 25 }
  ],
  options: {
    headers: true,
    delimiter: ','
  }
});
// Result: { success: true, csv: 'name,age\nJohn,30\nJane,25\n' }
```

#### Common Use Cases

1. **Data Import**: Parse uploaded CSV files for database import
2. **Report Generation**: Transform database query results to CSV for download
3. **Data Validation**: Filter and validate CSV data before processing
4. **ETL Pipelines**: Transform CSV data between different formats

---

### JSON Agent

Parse, validate, query, and transform JSON data with schema validation.

#### Capabilities

- **parse_json**: Parse JSON string with validation
- **query_json**: JSONPath query execution
- **validate_json**: Schema validation
- **transform_json**: Data transformation

#### Examples

**Parse and validate JSON:**
```typescript
const result = await jsonAgent.parseJson({
  input: '{"name":"John","age":30}',
  schema: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      age: { type: 'number' }
    },
    required: ['name', 'age']
  }
});
// Result: { success: true, data: { name: 'John', age: 30 } }
```

**Query JSON with JSONPath:**
```typescript
const result = await jsonAgent.queryJson({
  data: {
    users: [
      { name: 'John', age: 30 },
      { name: 'Jane', age: 25 }
    ]
  },
  path: '$.users[?(@.age > 25)].name'
});
// Result: { success: true, data: ['John'] }
```

**Transform JSON:**
```typescript
const result = await jsonAgent.transformJson({
  data: { firstName: 'John', lastName: 'Doe' },
  transform: (data) => ({
    fullName: `${data.firstName} ${data.lastName}`
  })
});
// Result: { success: true, data: { fullName: 'John Doe' } }
```

#### Schema Validation

The JSON agent supports JSON Schema validation:

```typescript
const schema = {
  type: 'object',
  properties: {
    email: { type: 'string', format: 'email' },
    age: { type: 'number', minimum: 0, maximum: 120 }
  },
  required: ['email']
};

const result = await jsonAgent.validateJson({
  data: { email: 'john@example.com', age: 30 },
  schema
});
// Result: { success: true, valid: true }
```

---

### Excel Agent

Read, write, and manipulate Excel files (XLSX format) with multi-sheet support.

#### Capabilities

- **readExcel**: Read Excel file (all sheets or specific)
- **writeExcel**: Write data to Excel format
- **getSheet**: Extract specific sheet data
- **listSheets**: List all sheets in workbook
- **formatCells**: Apply cell formatting
- **getInfo**: Get Excel file information

#### Examples

**Read Excel file:**
```typescript
const result = await excelAgent.readExcel({
  input: buffer, // File buffer or path
  options: {
    sheets: ['Sheet1'], // Optional: specify sheets
    range: 'A1:D10'     // Optional: specify range
  }
});
// Result: { success: true, data: { Sheet1: [[...], [...]] } }
```

**Write Excel file:**
```typescript
const result = await excelAgent.writeExcel({
  data: {
    'Sales Data': [
      ['Product', 'Price', 'Quantity'],
      ['Widget', 10.99, 100],
      ['Gadget', 25.50, 50]
    ]
  },
  options: {
    formatting: {
      'Sales Data!A1:C1': { bold: true, fill: 'FFFF00' }
    }
  }
});
// Result: { success: true, buffer: <Excel file buffer> }
```

**List sheets:**
```typescript
const result = await excelAgent.listSheets({
  input: buffer
});
// Result: { success: true, sheets: ['Sheet1', 'Sheet2', 'Sales Data'] }
```

**Get specific sheet:**
```typescript
const result = await excelAgent.getSheet({
  input: buffer,
  sheetName: 'Sales Data'
});
// Result: { success: true, data: [[...], [...]] }
```

#### Tips

- Excel agent uses the `xlsx` library (SheetJS)
- Supports both XLSX and XLS formats
- Cell formatting includes bold, italic, colors, borders
- Can handle large files efficiently with streaming

---

### PDF Agent

Extract text and tables from PDFs, generate PDFs from data.

#### Capabilities

- **extractText**: Extract text from PDF
- **extractTables**: Extract tables from PDF
- **generatePdf**: Create PDF from data
- **mergePdfs**: Combine multiple PDFs
- **getPdfInfo**: Get PDF metadata
- **splitPdf**: Split PDF into pages

#### Examples

**Extract text from PDF:**
```typescript
const result = await pdfAgent.extractText({
  input: buffer, // PDF buffer or path
  options: {
    pages: [1, 2, 3] // Optional: specific pages
  }
});
// Result: { success: true, text: 'PDF content...' }
```

**Extract tables:**
```typescript
const result = await pdfAgent.extractTables({
  input: buffer,
  options: {
    pages: [1]
  }
});
// Result: { success: true, tables: [[[...], [...]]] }
```

**Generate PDF:**
```typescript
const result = await pdfAgent.generatePdf({
  content: [
    { type: 'text', text: 'Invoice #12345', fontSize: 24 },
    { type: 'table', headers: ['Item', 'Price'], rows: [...] }
  ],
  options: {
    margins: { top: 50, bottom: 50, left: 50, right: 50 }
  }
});
// Result: { success: true, buffer: <PDF buffer> }
```

**Merge PDFs:**
```typescript
const result = await pdfAgent.mergePdfs({
  inputs: [buffer1, buffer2, buffer3]
});
// Result: { success: true, buffer: <Merged PDF buffer> }
```

---

## Integration Agents

### Google Sheets Agent

Integrate with Google Sheets API for reading and writing spreadsheet data.

#### Setup Required

See [OAuth Setup](#oauth-setup) section for Google OAuth configuration.

#### Capabilities

- **authenticate**: OAuth2 and Service Account authentication
- **readSheet**: Read data from Google Sheet
- **writeSheet**: Write data to Google Sheet (overwrites range)
- **appendRows**: Append rows to sheet
- **updateCells**: Update specific cells (batch support)
- **createSheet**: Create new sheet in spreadsheet
- **listSheets**: List all sheets in spreadsheet
- **getSheetInfo**: Get spreadsheet metadata

#### Examples

**Authenticate (OAuth):**
```typescript
const result = await sheetsAgent.authenticate({
  type: 'oauth',
  credentials: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI
  },
  code: authorizationCode // From OAuth flow
});
// Result: { success: true, tokens: { access_token, refresh_token } }
```

**Read sheet data:**
```typescript
const result = await sheetsAgent.readSheet({
  spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
  range: 'Sheet1!A1:D10',
  auth: tokens
});
// Result: { success: true, data: [[...], [...]] }
```

**Append rows:**
```typescript
const result = await sheetsAgent.appendRows({
  spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
  range: 'Sheet1!A:D',
  values: [
    ['John', 'Doe', 'john@example.com', '555-1234'],
    ['Jane', 'Smith', 'jane@example.com', '555-5678']
  ],
  auth: tokens
});
// Result: { success: true, updatedRows: 2 }
```

**Update specific cells (batch):**
```typescript
const result = await sheetsAgent.updateCells({
  spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
  updates: [
    { range: 'Sheet1!A1', values: [['Updated Value']] },
    { range: 'Sheet1!B2:C2', values: [['Value1', 'Value2']] }
  ],
  auth: tokens
});
// Result: { success: true, updatedCells: 3 }
```

**Create new sheet:**
```typescript
const result = await sheetsAgent.createSheet({
  spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
  title: 'Sales Q4 2024',
  auth: tokens
});
// Result: { success: true, sheetId: 12345 }
```

#### Common Use Cases

1. **Data Sync**: Sync application data with Google Sheets
2. **Reporting**: Generate automated reports in Sheets
3. **Data Collection**: Read form responses or survey data
4. **Collaboration**: Share data with team via Sheets

---

### Calendar Agent

Integrate with Google Calendar API for event management.

#### Setup Required

See [OAuth Setup](#oauth-setup) section for Google OAuth configuration.

#### Capabilities

- **authenticate**: OAuth2 and Service Account authentication
- **createEvent**: Create calendar event with date/time
- **listEvents**: List events in date range
- **getEvent**: Get event details by ID
- **updateEvent**: Update existing event
- **deleteEvent**: Delete event
- **checkAvailability**: Check free/busy status for time range

#### Examples

**Create event:**
```typescript
const result = await calendarAgent.createEvent({
  calendarId: 'primary',
  event: {
    summary: 'Team Meeting',
    description: 'Quarterly planning meeting',
    start: { dateTime: '2024-12-01T10:00:00-05:00' },
    end: { dateTime: '2024-12-01T11:00:00-05:00' },
    attendees: [
      { email: 'john@example.com' },
      { email: 'jane@example.com' }
    ]
  },
  auth: tokens
});
// Result: { success: true, eventId: 'abc123', link: 'https://...' }
```

**List upcoming events:**
```typescript
const result = await calendarAgent.listEvents({
  calendarId: 'primary',
  timeMin: '2024-12-01T00:00:00Z',
  timeMax: '2024-12-31T23:59:59Z',
  maxResults: 10,
  auth: tokens
});
// Result: { success: true, events: [...] }
```

**Check availability:**
```typescript
const result = await calendarAgent.checkAvailability({
  calendarId: 'primary',
  timeMin: '2024-12-01T10:00:00Z',
  timeMax: '2024-12-01T11:00:00Z',
  auth: tokens
});
// Result: { success: true, available: false, busyTimes: [...] }
```

**Update event:**
```typescript
const result = await calendarAgent.updateEvent({
  calendarId: 'primary',
  eventId: 'abc123',
  updates: {
    summary: 'Team Meeting (Updated)',
    start: { dateTime: '2024-12-01T14:00:00-05:00' },
    end: { dateTime: '2024-12-01T15:00:00-05:00' }
  },
  auth: tokens
});
// Result: { success: true, updated: true }
```

---

### Email Agent

Send and receive emails via SMTP/IMAP integration.

#### Capabilities

- **sendEmail**: Send email with attachments
- **readEmails**: Fetch emails from inbox
- **searchEmails**: Search emails by criteria
- **markAsRead**: Mark email as read
- **deleteEmail**: Delete email

#### Examples

**Send email:**
```typescript
const result = await emailAgent.sendEmail({
  from: 'noreply@example.com',
  to: ['user@example.com'],
  subject: 'Welcome to our platform',
  body: 'Thank you for signing up!',
  html: '<h1>Welcome!</h1><p>Thank you for signing up!</p>',
  attachments: [
    {
      filename: 'welcome.pdf',
      content: buffer
    }
  ]
});
// Result: { success: true, messageId: '<abc@example.com>' }
```

**Read recent emails:**
```typescript
const result = await emailAgent.readEmails({
  folder: 'INBOX',
  limit: 10,
  unreadOnly: true
});
// Result: { success: true, emails: [...] }
```

**Search emails:**
```typescript
const result = await emailAgent.searchEmails({
  from: 'support@example.com',
  subject: 'invoice',
  since: '2024-11-01'
});
// Result: { success: true, emails: [...] }
```

#### Configuration

Set these environment variables:

```bash
# SMTP (sending)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# IMAP (receiving)
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USER=your-email@gmail.com
IMAP_PASS=your-app-password
```

---

## Storage Agents

### Database Agent

Execute SQL queries against PostgreSQL and SQLite databases.

#### Capabilities

- **connect**: Connect to PostgreSQL or SQLite database
- **disconnect**: Close database connection
- **query**: Execute SQL query with parameters
- **insert**: Insert records (single or batch)
- **update**: Update records
- **delete**: Delete records
- **transaction**: Execute transactional operations
- **getTableInfo**: Get table schema and index information

#### Examples

**Connect to PostgreSQL:**
```typescript
const result = await dbAgent.connect({
  type: 'postgres',
  config: {
    host: 'localhost',
    port: 5432,
    database: 'mydb',
    user: 'postgres',
    password: 'password'
  }
});
// Result: { success: true, connected: true }
```

**Execute query:**
```typescript
const result = await dbAgent.query({
  sql: 'SELECT * FROM users WHERE age > $1',
  params: [25]
});
// Result: { success: true, rows: [...], rowCount: 5 }
```

**Insert records (batch):**
```typescript
const result = await dbAgent.insert({
  table: 'users',
  records: [
    { name: 'John', age: 30, email: 'john@example.com' },
    { name: 'Jane', age: 25, email: 'jane@example.com' }
  ]
});
// Result: { success: true, inserted: 2 }
```

**Transaction:**
```typescript
const result = await dbAgent.transaction({
  operations: [
    { type: 'insert', table: 'orders', data: { ... } },
    { type: 'update', table: 'inventory', data: { ... }, where: 'id = 1' },
    { type: 'delete', table: 'cart', where: 'user_id = 123' }
  ]
});
// Result: { success: true, committed: true }
```

**Get table schema:**
```typescript
const result = await dbAgent.getTableInfo({
  table: 'users'
});
// Result: { success: true, columns: [...], indexes: [...] }
```

#### Connection Pooling

The database agent automatically manages connection pooling for PostgreSQL.

---

### S3/Cloud Storage Agent

Upload, download, and manage files in AWS S3 and S3-compatible services.

#### Capabilities

- **uploadFile**: Upload file to S3 bucket
- **downloadFile**: Download file from S3
- **listFiles**: List files in bucket (with prefix filtering)
- **deleteFile**: Delete file from S3
- **getFileInfo**: Get file metadata
- **generatePresignedUrl**: Create temporary access URLs
- **copyFile**: Copy file within bucket
- **moveFile**: Move file to different location

#### Examples

**Upload file:**
```typescript
const result = await s3Agent.uploadFile({
  key: 'documents/report.pdf',
  body: buffer,
  contentType: 'application/pdf',
  metadata: {
    author: 'John Doe',
    department: 'Sales'
  },
  acl: 'private'
});
// Result: { success: true, url: 'https://...' }
```

**Download file:**
```typescript
const result = await s3Agent.downloadFile({
  key: 'documents/report.pdf',
  saveTo: '/path/to/save/report.pdf' // Optional: save to disk
});
// Result: { success: true, body: <Buffer>, metadata: {...} }
```

**List files with prefix:**
```typescript
const result = await s3Agent.listFiles({
  prefix: 'documents/',
  maxKeys: 100
});
// Result: { success: true, files: [...], truncated: false }
```

**Generate presigned URL:**
```typescript
const result = await s3Agent.generatePresignedUrl({
  key: 'documents/report.pdf',
  operation: 'getObject',
  expiresIn: 3600 // 1 hour
});
// Result: { success: true, url: 'https://...?signature=...' }
```

**Copy file:**
```typescript
const result = await s3Agent.copyFile({
  sourceKey: 'documents/report.pdf',
  destinationKey: 'archive/2024/report.pdf'
});
// Result: { success: true, copied: true }
```

#### Configuration

Set these environment variables:

```bash
# AWS S3
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=my-bucket

# S3-Compatible (MinIO, DigitalOcean Spaces)
S3_ENDPOINT=https://nyc3.digitaloceanspaces.com
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
S3_BUCKET=my-space
S3_REGION=nyc3
```

---

### File Agent

Read, write, and manipulate local files and directories.

#### Capabilities

- **readFile**: Read file content
- **writeFile**: Write content to file
- **appendFile**: Append content to file
- **deleteFile**: Delete file
- **listDirectory**: List files in directory
- **createDirectory**: Create directory
- **copyFile**: Copy file
- **moveFile**: Move file

#### Examples

**Read file:**
```typescript
const result = await fileAgent.readFile({
  path: '/data/config.json',
  encoding: 'utf8'
});
// Result: { success: true, content: '{"key":"value"}' }
```

**Write file:**
```typescript
const result = await fileAgent.writeFile({
  path: '/data/output.txt',
  content: 'Hello, World!',
  encoding: 'utf8'
});
// Result: { success: true, written: true }
```

**List directory:**
```typescript
const result = await fileAgent.listDirectory({
  path: '/data',
  recursive: true
});
// Result: { success: true, files: [...], directories: [...] }
```

---

## OAuth Setup

### Google OAuth (Sheets & Calendar)

#### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable APIs:
   - Google Sheets API
   - Google Calendar API

#### 2. Create OAuth Credentials

1. Navigate to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Select "Web application"
4. Add authorized redirect URIs:
   ```
   http://localhost:3000/auth/google/callback
   https://your-domain.com/auth/google/callback
   ```
5. Save Client ID and Client Secret

#### 3. Configure Environment Variables

```bash
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
```

#### 4. OAuth Flow

**Step 1: Get Authorization URL**
```typescript
const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
  `client_id=${GOOGLE_CLIENT_ID}&` +
  `redirect_uri=${GOOGLE_REDIRECT_URI}&` +
  `response_type=code&` +
  `scope=https://www.googleapis.com/auth/spreadsheets%20https://www.googleapis.com/auth/calendar&` +
  `access_type=offline&` +
  `prompt=consent`;

// Redirect user to authUrl
```

**Step 2: Exchange Code for Tokens**
```typescript
const result = await sheetsAgent.authenticate({
  type: 'oauth',
  credentials: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI
  },
  code: authorizationCode // From callback URL
});

// Store tokens for future use
const { access_token, refresh_token } = result.tokens;
```

#### 5. Using Service Account (Server-to-Server)

For automated workflows without user interaction:

1. Create Service Account in Google Cloud Console
2. Download JSON key file
3. Share Google Sheet/Calendar with service account email
4. Configure:

```bash
GOOGLE_SERVICE_ACCOUNT_EMAIL=service-account@project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_KEY=/path/to/service-account-key.json
```

```typescript
const result = await sheetsAgent.authenticate({
  type: 'service_account',
  credentials: {
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  }
});
```

---

## Troubleshooting

### Common Issues

#### CSV Agent

**Issue**: CSV parsing fails with malformed data
```
Solution: Use try-catch and specify error handling:
const result = await csvAgent.parseCsv({
  input: csvString,
  options: {
    skipInvalidLines: true,
    errorHandler: (error) => console.log('Skipped line:', error)
  }
});
```

#### Google Sheets Agent

**Issue**: 403 Forbidden error
```
Solution: 
1. Ensure Google Sheets API is enabled
2. Check OAuth scopes include 'spreadsheets'
3. Verify spreadsheet is shared with service account email
```

**Issue**: Token expired
```
Solution: Implement token refresh:
const result = await sheetsAgent.refreshToken({
  refreshToken: storedRefreshToken,
  credentials: {
    clientId: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET
  }
});
```

#### Database Agent

**Issue**: Connection timeout
```
Solution: Increase timeout and check network:
const result = await dbAgent.connect({
  type: 'postgres',
  config: {
    host: 'localhost',
    port: 5432,
    database: 'mydb',
    connectionTimeoutMillis: 10000
  }
});
```

#### S3 Agent

**Issue**: Access denied
```
Solution:
1. Verify AWS credentials are correct
2. Check bucket policy allows operation
3. Ensure IAM role has s3:GetObject, s3:PutObject permissions
```

**Issue**: Large file upload fails
```
Solution: Use multipart upload for files > 5MB:
const result = await s3Agent.uploadFile({
  key: 'large-file.zip',
  body: buffer,
  multipart: true,
  partSize: 5 * 1024 * 1024 // 5MB parts
});
```

### Error Handling

All agents return consistent error format:

```typescript
{
  success: false,
  error: {
    code: 'ERROR_CODE',
    message: 'Human-readable error message',
    details: { /* Additional error context */ }
  }
}
```

### Getting Help

1. Check [FAQ](./FAQ.md) for common questions
2. Review [Troubleshooting Guide](./TROUBLESHOOTING.md)
3. Open issue on [GitHub](https://github.com/creditXcredit/workstation/issues)
4. Join community discussions

---

## Next Steps

- [Workflow Examples](./WORKFLOW_EXAMPLES.md) - See agents in action
- [Creating Custom Agents](./CREATING_CUSTOM_AGENTS.md) - Build your own agents
- [API Reference](../../API.md) - Complete API documentation
