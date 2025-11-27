# Visual Workflow Builder Integration

## Overview

This document describes the complete integration of the visual workflow builder with the Chrome extension, backend APIs, and agent orchestration system. The builder now supports **all 10+ agents** including data processing, integrations, and storage operations with **parallel execution** capabilities.

## Implementation Summary

### 1. Backend API Enhancements

#### New Endpoints

**GET `/api/v2/executions/:id/status`**
- Returns real-time execution status for polling
- Includes progress percentage based on completed tasks
- Provides duration and error information

**GET `/api/v2/executions/:id/logs`**
- Returns detailed execution logs
- Includes task-level logging with timestamps
- Provides error traces for debugging

**Existing Enhanced Endpoints**
- `POST /api/v2/workflows` - Create workflows
- `GET /api/v2/workflows` - List workflows  
- `POST /api/v2/execute` - Execute workflows directly
- `POST /api/v2/workflows/:id/execute` - Execute specific workflow
- `GET /api/v2/executions/:id` - Get execution details
- `GET /api/v2/executions/:id/tasks` - Get execution tasks

### 2. Visual Workflow Builder Enhancement

#### New Features

**Execute Button**
- Converts visual nodes to backend workflow format
- Creates workflow if not already saved
- Executes workflow via `/api/v2/workflows/:id/execute`
- Displays real-time execution status with progress bar

**JWT Authentication**
- Reads token from `localStorage.authToken`
- Includes token in all API requests
- Prompts user to login if token missing

**Real-time Status Polling**
- Polls `/api/v2/executions/:id/status` every second
- Updates progress bar and status message
- Automatically fetches logs on completion/failure

**Execution Results Display**
- Shows execution status (pending, running, completed, failed)
- Displays progress percentage
- Shows error messages if execution fails
- Expandable logs section with detailed task logs

**Execution History Panel**
- Slide-in panel showing past executions
- Displays workflow name, timestamp, and status
- Click to view execution details

**Node Connection Functionality**
- Visual connection between nodes (rendered with D3.js)
- Connection state management
- Automatic connection rendering

**JSON Import/Export**
- Export workflow as JSON file (includes nodes and connections)
- Import workflow from JSON file
- Backend-compatible format conversion

**Save to Backend**
- Saves workflow to backend via `/api/v2/workflows`
- Stores workflow ID for future executions
- Converts visual nodes to backend task format

#### Workflow Format Conversion

Visual Builder Nodes → Backend Workflow Format:

```javascript
// Visual Node
{
  id: 'node-1',
  type: 'navigate',
  params: { url: 'https://example.com' }
}

// Backend Task
{
  name: 'navigate',
  agent_type: 'browser',
  action: 'navigate',
  parameters: { url: 'https://example.com' }
}
```

Node Type Mappings:
- `navigate` → `navigate` action
- `click` → `click` action
- `fill` → `type` action
- `extract` → `getText` action
- `wait` → `wait` action
- `condition` → `evaluate` action

### 3. Chrome Extension Integration

#### New Builder Tab

**Features:**
- "Open Builder" button - Opens workflow builder in new tab
- "New Workflow" button - Opens blank workflow builder
- "Load Workflow" button - Loads first workflow from backend

**Updated Save Button:**
- Saves workflow to backend via `/api/v2/workflows`
- Creates proper workflow definition from text description
- Stores workflow ID in local history

**Execute Button Enhancement:**
- Uses backend API for execution
- Polls for execution status
- Updates history with execution results

**History Tab:**
- Shows workflows saved to backend
- Displays execution status
- Click to load workflow

### 4. Workflow Format Standardization

All workflow sources now produce compatible formats:

1. **Visual Builder** → Converts nodes to tasks
2. **Templates** → Already in task format
3. **Recording** → Converts recorded actions to tasks
4. **Manual JSON** → Direct task format

Common workflow structure:
```json
{
  "name": "Workflow Name",
  "description": "Description",
  "definition": {
    "tasks": [
      {
        "name": "task-name",
        "agent_type": "browser",
        "action": "navigate",
        "parameters": { "url": "https://example.com" }
      }
    ],
    "variables": {},
    "on_error": "stop"
  }
}
```

### 5. Testing

Created comprehensive test suite in `tests/workflow-builder.test.ts`:

- Backend API endpoint tests
- Workflow format conversion tests
- Execution flow tests
- Chrome extension integration tests
- Visual builder feature tests

All tests passing ✅

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Visual Workflow Builder                  │
│  (public/workflow-builder.html)                             │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Node Library │  │    Canvas    │  │  Properties  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Execute | Save | Export | Import | History          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           ↓
                     JWT Auth Token
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                     Backend API Routes                       │
│  (src/routes/automation.ts)                                 │
│                                                              │
│  POST   /api/v2/workflows          - Create workflow        │
│  GET    /api/v2/workflows          - List workflows         │
│  POST   /api/v2/execute            - Execute immediately    │
│  POST   /api/v2/workflows/:id/execute - Execute workflow    │
│  GET    /api/v2/executions/:id/status - Poll status         │
│  GET    /api/v2/executions/:id/logs   - Get logs            │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│              Workflow & Orchestration Services               │
│                                                              │
│  WorkflowService            OrchestrationEngine             │
│  - createWorkflow()         - executeWorkflow()             │
│  - getWorkflow()            - getExecution()                │
│  - listWorkflows()          - getExecutionTasks()           │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                      Agent Registry                          │
│                                                              │
│  Browser Agent | Storage Agent | Email Agent | RSS Agent    │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                   Chrome Extension                           │
│  (chrome-extension/popup/)                                  │
│                                                              │
│  ┌─────────┬─────────┬──────────┬─────────┬──────────┐     │
│  │ Execute │ Builder │Templates │ History │ Settings │     │
│  └─────────┴─────────┴──────────┴─────────┴──────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## Usage Guide

### Creating a Workflow in Visual Builder

1. **Open the Builder**
   - Navigate to `http://localhost:3000/workflow-builder.html`
   - Or use Chrome extension → Builder tab → Open Builder

2. **Add Nodes**
   - Click node types from the library (left panel)
   - Nodes appear on canvas
   - Drag nodes to position them

3. **Configure Nodes**
   - Click a node to select it
   - Edit properties in right panel
   - Enter parameters (URL, selector, etc.)

4. **Connect Nodes (Optional)**
   - Visual connections are displayed
   - Execution order follows node sequence

5. **Save Workflow**
   - Click "Save" to store in backend
   - Workflow gets unique ID
   - Available for later execution

6. **Execute Workflow**
   - Click "Execute" button
   - Watch real-time progress
   - View logs on completion

### Executing from Chrome Extension

1. **Open Extension**
   - Click extension icon in browser

2. **Builder Tab**
   - Click "Open Builder" to create visual workflows
   - Or use "Load Workflow" to edit existing

3. **Execute Tab**
   - Enter workflow description
   - Click "Execute Workflow"
   - Watch status polling
   - View results

4. **History Tab**
   - See past executions
   - Click to view details

## API Examples

### Create and Execute Workflow

```javascript
// 1. Create workflow
const workflow = {
  name: "Google Search",
  description: "Search Google for Workstation",
  definition: {
    tasks: [
      {
        name: "navigate",
        agent_type: "browser",
        action: "navigate",
        parameters: { url: "https://google.com" }
      },
      {
        name: "search",
        agent_type: "browser",
        action: "type",
        parameters: { 
          selector: 'input[name="q"]',
          text: "Workstation"
        }
      }
    ],
    variables: {},
    on_error: "stop"
  }
};

const createRes = await fetch('/api/v2/workflows', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(workflow)
});

const { data: { id: workflowId } } = await createRes.json();

// 2. Execute workflow
const execRes = await fetch(`/api/v2/workflows/${workflowId}/execute`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ variables: {} })
});

const { data: { id: executionId } } = await execRes.json();

// 3. Poll status
const pollStatus = async () => {
  const statusRes = await fetch(`/api/v2/executions/${executionId}/status`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const { data: { status, progress } } = await statusRes.json();
  console.log(`Status: ${status}, Progress: ${progress}%`);
  
  if (status === 'completed' || status === 'failed') {
    // Get logs
    const logsRes = await fetch(`/api/v2/executions/${executionId}/logs`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const { data: { logs } } = await logsRes.json();
    console.log('Logs:', logs);
  } else {
    setTimeout(pollStatus, 1000);
  }
};

pollStatus();
```

## Security

- **JWT Authentication**: All API endpoints require valid JWT token
- **Token Storage**: Tokens stored in localStorage (client-side)
- **Rate Limiting**: Execution endpoints have rate limits
- **Input Validation**: All workflow inputs validated on backend

## Performance

- **Status Polling**: 1 second intervals (configurable)
- **Timeout**: Default 2 minute timeout for executions
- **Retry**: Automatic task retry on failure (configurable)
- **Caching**: Workflow definitions cached in memory

## Future Enhancements

1. **Real-time WebSocket Updates**: Replace polling with WebSocket ✅ (Implemented in Phase 5)
2. **Workflow Templates**: Pre-built workflow templates
3. **Workflow Versioning**: Save multiple versions
4. **Collaborative Editing**: Multi-user workflow editing
5. **Workflow Marketplace**: Share workflows with community
6. **Advanced Node Types**: Loop, conditional, parallel nodes ✅ (Parallel implemented)
7. **Workflow Scheduling**: Cron-based execution
8. **Workflow Analytics**: Execution metrics and insights

## Agent Node Types Reference

### Control Nodes

#### Start Node
- **Type**: `start`
- **Description**: Entry point for workflow
- **Parameters**: None
- **Example**: Every workflow must start with this node

#### End Node
- **Type**: `end`
- **Description**: Exit point for workflow
- **Parameters**: None
- **Example**: Marks successful completion

#### Condition Node
- **Type**: `condition`
- **Description**: Conditional branching based on expression
- **Parameters**:
  - `condition` (string): JavaScript expression to evaluate
- **Example**: `${data.status} === 'success'`

#### Loop Node
- **Type**: `loop`
- **Description**: Iterate over items
- **Parameters**:
  - `items` (array): Items to loop over
  - `iterator` (string): Variable name for current item
- **Example**: Loop over CSV rows

#### Parallel Node
- **Type**: `parallel`
- **Description**: Execute multiple tasks in parallel
- **Parameters**:
  - `tasks` (array): Task IDs to execute in parallel
  - `maxConcurrency` (number): Max parallel tasks (default: 5)
- **Example**: Process multiple files simultaneously

### Browser Nodes

#### Navigate
- **Type**: `navigate`
- **Agent**: `browser`
- **Action**: `navigate`
- **Parameters**:
  - `url` (string): URL to navigate to
- **Example**:
```json
{
  "url": "https://example.com"
}
```

#### Click
- **Type**: `click`
- **Agent**: `browser`
- **Action**: `click`
- **Parameters**:
  - `selector` (string): CSS selector for element
- **Example**:
```json
{
  "selector": "button.submit"
}
```

#### Fill Form
- **Type**: `fill`
- **Agent**: `browser`
- **Action**: `type`
- **Parameters**:
  - `selector` (string): Input element selector
  - `text` (string): Text to type
- **Example**:
```json
{
  "selector": "input[name='email']",
  "text": "user@example.com"
}
```

#### Extract Data
- **Type**: `extract`
- **Agent**: `browser`
- **Action**: `getText`
- **Parameters**:
  - `selector` (string): Element selector to extract from
- **Example**:
```json
{
  "selector": ".product-price"
}
```

### Data Processing Nodes

#### Parse CSV
- **Type**: `csv_parse`
- **Agent**: `csv`
- **Action**: `parseCsv`
- **Parameters**:
  - `input` (string): CSV data or file path
  - `hasHeader` (boolean): Whether CSV has header row
- **Example**:
```json
{
  "input": "name,age\\nJohn,30\\nJane,25",
  "hasHeader": true
}
```

#### Write CSV
- **Type**: `csv_write`
- **Agent**: `csv`
- **Action**: `writeCsv`
- **Parameters**:
  - `data` (array): Array of objects to convert
  - `includeHeader` (boolean): Include header row
- **Example**:
```json
{
  "data": [{"name": "John", "age": 30}],
  "includeHeader": true
}
```

#### Parse JSON
- **Type**: `json_parse`
- **Agent**: `json`
- **Action**: `parseJson`
- **Parameters**:
  - `input` (string): JSON string to parse
- **Example**:
```json
{
  "input": "{\"name\": \"John\", \"age\": 30}"
}
```

#### Query JSON
- **Type**: `json_query`
- **Agent**: `json`
- **Action**: `queryJson`
- **Parameters**:
  - `data` (object): JSON object to query
  - `query` (string): JSONPath query
- **Example**:
```json
{
  "data": {"users": [{"name": "John"}]},
  "query": "$.users[0].name"
}
```

#### Read Excel
- **Type**: `excel_read`
- **Agent**: `excel`
- **Action**: `readExcel`
- **Parameters**:
  - `filePath` (string): Path to Excel file
  - `sheetName` (string, optional): Specific sheet to read
- **Example**:
```json
{
  "filePath": "/tmp/data.xlsx",
  "sheetName": "Sheet1"
}
```

#### Write Excel
- **Type**: `excel_write`
- **Agent**: `excel`
- **Action**: `writeExcel`
- **Parameters**:
  - `data` (array): Data to write
  - `sheetName` (string): Sheet name
  - `outputPath` (string): Output file path
- **Example**:
```json
{
  "data": [[1, 2, 3], [4, 5, 6]],
  "sheetName": "Results",
  "outputPath": "/tmp/output.xlsx"
}
```

#### Extract PDF Text
- **Type**: `pdf_extract`
- **Agent**: `pdf`
- **Action**: `extractText`
- **Parameters**:
  - `filePath` (string): Path to PDF file
- **Example**:
```json
{
  "filePath": "/tmp/document.pdf"
}
```

#### Generate PDF
- **Type**: `pdf_generate`
- **Agent**: `pdf`
- **Action**: `generatePdf`
- **Parameters**:
  - `content` (string): Content for PDF
  - `outputPath` (string): Output file path
- **Example**:
```json
{
  "content": "Hello, PDF!",
  "outputPath": "/tmp/output.pdf"
}
```

### Integration Nodes

#### Read Google Sheet
- **Type**: `sheets_read`
- **Agent**: `sheets`
- **Action**: `readSheet`
- **Parameters**:
  - `spreadsheetId` (string): Google Sheets ID
  - `range` (string): A1 notation range
  - `sheetsConfig` (object): OAuth credentials
- **Example**:
```json
{
  "spreadsheetId": "1ABC...",
  "range": "Sheet1!A1:Z100",
  "sheetsConfig": {
    "authType": "oauth2",
    "clientId": "...",
    "clientSecret": "...",
    "redirectUri": "..."
  }
}
```

**OAuth Setup Guide**:
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials
3. Add authorized redirect URI
4. Use credentials in sheetsConfig

#### Write Google Sheet
- **Type**: `sheets_write`
- **Agent**: `sheets`
- **Action**: `writeSheet`
- **Parameters**:
  - `spreadsheetId` (string): Google Sheets ID
  - `range` (string): A1 notation range
  - `values` (array): 2D array of values
  - `sheetsConfig` (object): OAuth credentials
- **Example**:
```json
{
  "spreadsheetId": "1ABC...",
  "range": "Sheet1!A1",
  "values": [["Name", "Age"], ["John", 30]],
  "sheetsConfig": {...}
}
```

#### Create Calendar Event
- **Type**: `calendar_create`
- **Agent**: `calendar`
- **Action**: `createEvent`
- **Parameters**:
  - `summary` (string): Event title
  - `start` (string): Start datetime (ISO 8601)
  - `end` (string): End datetime (ISO 8601)
  - `description` (string, optional): Event description
  - `calendarConfig` (object): OAuth credentials
- **Example**:
```json
{
  "summary": "Team Meeting",
  "start": "2024-01-15T10:00:00Z",
  "end": "2024-01-15T11:00:00Z",
  "description": "Weekly sync",
  "calendarConfig": {...}
}
```

**OAuth Setup**: Same as Google Sheets

#### List Calendar Events
- **Type**: `calendar_list`
- **Agent**: `calendar`
- **Action**: `listEvents`
- **Parameters**:
  - `timeMin` (string): Start time (ISO 8601)
  - `timeMax` (string, optional): End time
  - `maxResults` (number): Max events to return
  - `calendarConfig` (object): OAuth credentials
- **Example**:
```json
{
  "timeMin": "2024-01-01T00:00:00Z",
  "maxResults": 10,
  "calendarConfig": {...}
}
```

#### Send Email
- **Type**: `email_send`
- **Agent**: `email`
- **Action**: `sendEmail`
- **Parameters**:
  - `to` (string): Recipient email
  - `subject` (string): Email subject
  - `body` (string): Email body
  - `emailConfig` (object): Email provider config
- **Example**:
```json
{
  "to": "recipient@example.com",
  "subject": "Automated Report",
  "body": "Please find the report attached.",
  "emailConfig": {
    "provider": "gmail",
    "email": "sender@example.com"
  }
}
```

#### Read Emails
- **Type**: `email_read`
- **Agent**: `email`
- **Action**: `getUnreadEmails`
- **Parameters**:
  - `maxResults` (number): Max emails to fetch
  - `emailConfig` (object): Email provider config
- **Example**:
```json
{
  "maxResults": 10,
  "emailConfig": {...}
}
```

### Storage Nodes

#### Database Query
- **Type**: `database_query`
- **Agent**: `database`
- **Action**: `query`
- **Parameters**:
  - `sql` (string): SQL query
  - `params` (array): Query parameters
  - `dbConfig` (object): Database connection config
- **Example**:
```json
{
  "sql": "SELECT * FROM users WHERE age > ?",
  "params": [18],
  "dbConfig": {
    "type": "postgresql",
    "useExistingConnection": true
  }
}
```

#### Database Insert
- **Type**: `database_insert`
- **Agent**: `database`
- **Action**: `insert`
- **Parameters**:
  - `table` (string): Table name
  - `data` (object): Data to insert
  - `dbConfig` (object): Database connection config
- **Example**:
```json
{
  "table": "users",
  "data": {"name": "John", "age": 30},
  "dbConfig": {...}
}
```

#### S3 Upload
- **Type**: `s3_upload`
- **Agent**: `s3`
- **Action**: `uploadFile`
- **Parameters**:
  - `key` (string): S3 object key
  - `content` (string): File content or path
  - `s3Config` (object): S3 credentials
- **Example**:
```json
{
  "key": "data/file.txt",
  "content": "Hello, S3!",
  "s3Config": {
    "region": "us-east-1",
    "bucket": "my-bucket"
  }
}
```

#### S3 Download
- **Type**: `s3_download`
- **Agent**: `s3`
- **Action**: `downloadFile`
- **Parameters**:
  - `key` (string): S3 object key
  - `s3Config` (object): S3 credentials
- **Example**:
```json
{
  "key": "data/file.txt",
  "s3Config": {...}
}
```

#### Read File
- **Type**: `file_read`
- **Agent**: `file`
- **Action**: `readFile`
- **Parameters**:
  - `path` (string): File path
  - `encoding` (string, optional): File encoding (default: utf-8)
  - `fileConfig` (object): File storage config
- **Example**:
```json
{
  "path": "/tmp/data.txt",
  "fileConfig": {
    "storageType": "local",
    "basePath": "/tmp"
  }
}
```

#### Write File
- **Type**: `file_write`
- **Agent**: `file`
- **Action**: `writeFile`
- **Parameters**:
  - `path` (string): File path
  - `content` (string): File content
  - `fileConfig` (object): File storage config
- **Example**:
```json
{
  "path": "/tmp/output.txt",
  "content": "Hello, World!",
  "fileConfig": {...}
}
```

## Parallel Execution Workflow Pattern

### Example: Parallel Data Processing

```json
{
  "name": "Parallel Data Processing",
  "description": "Process multiple files in parallel",
  "definition": {
    "tasks": [
      {
        "name": "read-file-1",
        "agent_type": "file",
        "action": "readFile",
        "parameters": {"path": "/tmp/file1.csv"}
      },
      {
        "name": "read-file-2",
        "agent_type": "file",
        "action": "readFile",
        "parameters": {"path": "/tmp/file2.csv"}
      },
      {
        "name": "read-file-3",
        "agent_type": "file",
        "action": "readFile",
        "parameters": {"path": "/tmp/file3.csv"}
      },
      {
        "name": "parse-csv-1",
        "agent_type": "csv",
        "action": "parseCsv",
        "parameters": {"input": "${read-file-1}"},
        "depends_on": ["read-file-1"]
      },
      {
        "name": "parse-csv-2",
        "agent_type": "csv",
        "action": "parseCsv",
        "parameters": {"input": "${read-file-2}"},
        "depends_on": ["read-file-2"]
      },
      {
        "name": "parse-csv-3",
        "agent_type": "csv",
        "action": "parseCsv",
        "parameters": {"input": "${read-file-3}"},
        "depends_on": ["read-file-3"]
      },
      {
        "name": "merge-results",
        "agent_type": "json",
        "action": "mergeJson",
        "parameters": {
          "objects": [
            "${parse-csv-1}",
            "${parse-csv-2}",
            "${parse-csv-3}"
          ]
        },
        "depends_on": ["parse-csv-1", "parse-csv-2", "parse-csv-3"]
      }
    ],
    "variables": {},
    "on_error": "stop"
  }
}
```

This workflow will:
1. Read 3 files in parallel (level 0)
2. Parse 3 CSVs in parallel (level 1)
3. Merge results sequentially (level 2)

**Execution Time**: With parallel engine, this completes in ~33% of sequential time!

## OAuth Setup Guides

### Google Sheets & Calendar OAuth

1. **Create Google Cloud Project**
   - Go to https://console.cloud.google.com
   - Create new project or select existing

2. **Enable APIs**
   - Enable Google Sheets API
   - Enable Google Calendar API

3. **Create OAuth 2.0 Credentials**
   - Go to Credentials → Create Credentials → OAuth 2.0 Client ID
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3000/oauth/callback`

4. **Download Credentials**
   - Download JSON file
   - Extract `client_id`, `client_secret`

5. **Set Environment Variables**
```bash
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/oauth/callback
```

6. **Authenticate in Workflow**
```json
{
  "sheetsConfig": {
    "authType": "oauth2",
    "clientId": "${GOOGLE_CLIENT_ID}",
    "clientSecret": "${GOOGLE_CLIENT_SECRET}",
    "redirectUri": "${GOOGLE_REDIRECT_URI}"
  }
}
```

### Service Account (Recommended for Automation)

1. **Create Service Account**
   - Go to IAM & Admin → Service Accounts
   - Create service account
   - Download JSON key file

2. **Share Resources**
   - Share spreadsheet/calendar with service account email
   - Grant edit permissions

3. **Use in Workflow**
```json
{
  "sheetsConfig": {
    "authType": "service_account",
    "serviceAccountKey": "/path/to/key.json"
  }
}
```

## Future Enhancements

1. **Real-time WebSocket Updates**: Replace polling with WebSocket
2. **Workflow Templates**: Pre-built workflow templates
3. **Workflow Versioning**: Save multiple versions
4. **Collaborative Editing**: Multi-user workflow editing
5. **Workflow Marketplace**: Share workflows with community
6. **Advanced Node Types**: Loop, conditional, parallel nodes
7. **Workflow Scheduling**: Cron-based execution
8. **Workflow Analytics**: Execution metrics and insights

## Troubleshooting

### "Token not found" Error
- Ensure you're logged in
- Check localStorage for `authToken` key
- Try refreshing the page

### Execution Stuck in "Running"
- Check execution logs for errors
- Verify agent is properly configured
- Check network connectivity

### Nodes Not Connecting
- Ensure D3.js is loaded
- Check browser console for errors
- Verify connections array is populated

### Workflow Not Saving
- Verify JWT token is valid
- Check network tab for API errors
- Ensure backend is running

## Files Modified

### Backend
- `src/routes/automation.ts` - Added status and logs endpoints
- `src/automation/orchestrator/engine.ts` - No changes needed
- `src/automation/workflow/service.ts` - No changes needed

### Frontend
- `public/workflow-builder.html` - Added execute, auth, history features
- `public/css/workflow-builder.css` - Added styles for new components

### Chrome Extension
- `chrome-extension/popup/index.html` - Added Builder tab
- `chrome-extension/popup/script.js` - Added Builder tab handlers
- `chrome-extension/background.js` - No changes needed (already had execute)

### Tests
- `tests/workflow-builder.test.ts` - New test suite

## Conclusion

The visual workflow builder is now fully integrated with:
✅ Backend API with real-time status and logging
✅ JWT authentication and security
✅ Chrome extension with Builder tab
✅ Workflow format standardization
✅ Comprehensive test coverage

Users can now:
✅ Create workflows visually
✅ Save workflows to backend
✅ Execute workflows with real-time feedback
✅ View execution history and logs
✅ Use workflows from builder, templates, or recording
✅ Access all features from Chrome extension

---

# Developer Guide - Extending the Workflow Builder

This section provides guidance for developers who want to extend the workflow builder with custom functionality.

## Adding Custom Node Types

### Step 1: Define Node Type

Add your node type to `public/workflow-builder.html`:

```javascript
const customNodeTypes = {
  // Your custom nodes
  custom_api_call: {
    name: 'API Call',
    category: 'custom',
    color: '#9C27B0',
    icon: '🔌',
    params: {
      method: {
        type: 'select',
        options: ['GET', 'POST', 'PUT', 'DELETE'],
        default: 'GET',
      },
      url: {
        type: 'text',
        required: true,
        placeholder: 'https://api.example.com/endpoint',
      },
      headers: {
        type: 'textarea',
        placeholder: '{"Authorization": "Bearer token"}',
      },
      body: {
        type: 'textarea',
        placeholder: '{"key": "value"}',
      },
    },
  },
};

// Merge with existing node types
Object.assign(nodeTypes, customNodeTypes);
```

### Step 2: Add Node Type Converter

Update the `convertNodeToTask` function:

```javascript
function convertNodeToTask(node) {
  const converters = {
    // ... existing converters
    custom_api_call: (node) => ({
      name: node.id,
      agent_type: 'custom',
      action: 'api_call',
      parameters: {
        method: node.params.method,
        url: node.params.url,
        headers: JSON.parse(node.params.headers || '{}'),
        body: JSON.parse(node.params.body || '{}'),
      },
    }),
  };

  return converters[node.type]?.(node) || null;
}
```

### Step 3: Create Custom Agent (Backend)

See [Creating Custom Agents Guide](./docs/guides/CREATING_CUSTOM_AGENTS.md) for detailed instructions.

## Customizing the Builder UI

### Adding Custom Panels

```javascript
// Add a new panel
function createCustomPanel() {
  const panel = document.createElement('div');
  panel.id = 'custom-panel';
  panel.className = 'custom-panel';
  panel.innerHTML = `
    <h3>Custom Tools</h3>
    <div id="custom-tools"></div>
  `;
  document.body.appendChild(panel);
}

// Call on page load
window.addEventListener('load', createCustomPanel);
```

### Adding Custom Actions

```javascript
// Add custom toolbar button
function addCustomAction() {
  const toolbar = document.querySelector('.toolbar');
  const button = document.createElement('button');
  button.textContent = 'Custom Action';
  button.onclick = () => {
    // Your custom action
    console.log('Custom action triggered');
  };
  toolbar.appendChild(button);
}
```

## Extending Workflow Execution

### Adding Execution Hooks

```javascript
// Before execution hook
async function beforeExecute(workflow) {
  console.log('About to execute:', workflow.name);
  // Add custom logic here
  return workflow;
}

// After execution hook
async function afterExecute(execution) {
  console.log('Execution completed:', execution.id);
  // Add custom logic here
  return execution;
}

// Modify the execute function
async function executeWorkflow() {
  let workflow = await beforeExecute(currentWorkflow);
  
  const response = await fetch('/api/v2/workflows/:id/execute', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify(workflow),
  });

  const execution = await response.json();
  await afterExecute(execution);
}
```

### Adding Custom Validation

```javascript
function validateWorkflow(workflow) {
  const errors = [];

  // Custom validation rules
  if (workflow.definition.tasks.length === 0) {
    errors.push('Workflow must have at least one task');
  }

  workflow.definition.tasks.forEach((task, index) => {
    if (!task.name) {
      errors.push(`Task ${index + 1} must have a name`);
    }
    
    // Add more validation rules
  });

  return errors;
}

// Use before execution
async function executeWorkflow() {
  const errors = validateWorkflow(currentWorkflow);
  if (errors.length > 0) {
    alert('Validation errors:\n' + errors.join('\n'));
    return;
  }
  
  // Continue with execution
}
```

## Integrating with External Services

### Adding OAuth Integration

```javascript
async function authenticateWithService() {
  // Redirect to OAuth provider
  const clientId = 'your-client-id';
  const redirectUri = encodeURIComponent(window.location.origin + '/oauth/callback');
  const authUrl = `https://provider.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}`;
  
  window.location.href = authUrl;
}

// Handle OAuth callback
if (window.location.pathname === '/oauth/callback') {
  const code = new URLSearchParams(window.location.search).get('code');
  
  // Exchange code for token
  const response = await fetch('/api/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });

  const { access_token } = await response.json();
  localStorage.setItem('service_token', access_token);
}
```

### Webhook Integration

```javascript
// Register webhook endpoint
async function registerWebhook(workflowId) {
  const response = await fetch('/api/webhooks/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      workflow_id: workflowId,
      url: `${window.location.origin}/api/webhooks/trigger/${workflowId}`,
      events: ['workflow.completed', 'workflow.failed'],
    }),
  });

  return response.json();
}
```

## Performance Optimization

### Debouncing Node Updates

```javascript
let updateTimeout;

function onNodeUpdate(node) {
  clearTimeout(updateTimeout);
  
  updateTimeout = setTimeout(() => {
    // Perform actual update
    updateNodeProperties(node);
  }, 300);
}
```

### Lazy Loading Node Library

```javascript
let nodesLoaded = false;

function loadNodeLibrary() {
  if (nodesLoaded) return;
  
  // Load node definitions
  fetch('/api/node-types')
    .then(res => res.json())
    .then(types => {
      Object.assign(nodeTypes, types);
      renderNodeLibrary();
      nodesLoaded = true;
    });
}

// Load on first interaction
document.getElementById('node-library').addEventListener('click', loadNodeLibrary, { once: true });
```

### Caching Workflow Templates

```javascript
const templateCache = new Map();

async function getTemplate(id) {
  if (templateCache.has(id)) {
    return templateCache.get(id);
  }

  const response = await fetch(`/api/workflow-templates/${id}`);
  const template = await response.json();
  
  templateCache.set(id, template);
  return template;
}
```

## Testing Custom Extensions

### Unit Testing

```javascript
describe('Custom Node Type', () => {
  it('should convert custom_api_call node correctly', () => {
    const node = {
      id: 'node-1',
      type: 'custom_api_call',
      params: {
        method: 'POST',
        url: 'https://api.example.com/data',
        headers: '{"Content-Type": "application/json"}',
        body: '{"key": "value"}',
      },
    };

    const task = convertNodeToTask(node);

    expect(task.agent_type).toBe('custom');
    expect(task.action).toBe('api_call');
    expect(task.parameters.method).toBe('POST');
  });
});
```

### Integration Testing

```javascript
describe('Workflow Builder Integration', () => {
  it('should create and execute custom workflow', async () => {
    // Create workflow with custom node
    const workflow = {
      name: 'Custom Workflow',
      definition: {
        tasks: [
          {
            name: 'api-call',
            agent_type: 'custom',
            action: 'api_call',
            parameters: {
              method: 'GET',
              url: 'https://api.example.com/test',
            },
          },
        ],
      },
    };

    // Save workflow
    const response = await fetch('/api/v2/workflows', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(workflow),
    });

    const savedWorkflow = await response.json();

    // Execute workflow
    const execResponse = await fetch(`/api/v2/workflows/${savedWorkflow.id}/execute`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    const execution = await execResponse.json();
    expect(execution.status).toBe('pending');
  });
});
```

## Additional Resources

- [Creating Custom Agents](./docs/guides/CREATING_CUSTOM_AGENTS.md)
- [Extending the Orchestrator](./docs/guides/EXTENDING_ORCHESTRATOR.md)
- [MCP Protocol Documentation](./docs/MCP_PROTOCOL.md)
- [Deployment Guide](./docs/guides/DEPLOYMENT.md)
- [API Documentation](./API.md)

## Contributing

To contribute extensions to the workflow builder:

1. Fork the repository
2. Create a feature branch
3. Implement your extension
4. Add tests
5. Update documentation
6. Submit a pull request

## Support

For help with extending the workflow builder:

- Review existing examples in the codebase
- Check the troubleshooting guide
- Open an issue on GitHub
- Join community discussions
