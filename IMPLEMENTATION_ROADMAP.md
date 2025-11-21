# Implementation Roadmap - Missing Agents & Features

This document outlines the step-by-step implementation plan for completing the missing agents and features identified in issue #152 and PR #153.

## Phase 1: Data Agents (Priority: HIGH)
**Goal**: Enable workflow automation to work with various data formats

### Step 1.1: CSV Agent
- [x] Create `src/automation/agents/data/csv.ts`
- [x] Implement CSV parsing (read/write operations)
- [x] Add CSV data transformation capabilities
- [x] Support CSV filtering and querying
- [x] Wire to agent registry
- [ ] Add unit tests in `tests/agents/data/csv.test.ts`
- [x] Update documentation

**Capabilities**:
- `parse_csv`: Parse CSV file/string into structured data
- `write_csv`: Convert data to CSV format
- `filter_csv`: Filter CSV rows by conditions
- `transform_csv`: Map/transform CSV columns

### Step 1.2: JSON Agent
- [x] Create `src/automation/agents/data/json.ts`
- [x] Implement JSON parsing and validation
- [x] Add JSON schema validation
- [x] Support JSONPath queries
- [x] Wire to agent registry
- [ ] Add unit tests in `tests/agents/data/json.test.ts`
- [x] Update documentation

**Capabilities**:
- `parse_json`: Parse JSON string with validation
- `query_json`: JSONPath query execution
- `validate_json`: Schema validation
- `transform_json`: Data transformation

### Step 1.3: Excel Agent
- [x] Create `src/automation/agents/data/excel.ts`
- [x] Implement Excel file parsing (XLSX)
- [x] Support multiple sheets
- [x] Add cell formatting support
- [x] Wire to agent registry
- [ ] Add unit tests in `tests/agents/data/excel.test.ts`
- [x] Update documentation

**Capabilities**:
- `readExcel`: Read Excel file (all sheets or specific)
- `writeExcel`: Write data to Excel format
- `getSheet`: Extract specific sheet data
- `listSheets`: List all sheets in workbook
- `formatCells`: Apply cell formatting
- `getInfo`: Get Excel file information

### Step 1.4: PDF Agent
- [x] Create `src/automation/agents/data/pdf.ts`
- [x] Implement PDF text extraction
- [x] Add PDF table extraction
- [x] Support PDF generation from data
- [x] Wire to agent registry
- [ ] Add unit tests in `tests/agents/data/pdf.test.ts`
- [x] Update documentation

**Capabilities**:
- `extractText`: Extract text from PDF
- `extractTables`: Extract tables from PDF
- `generatePdf`: Create PDF from data
- `mergePdfs`: Combine multiple PDFs
- `getPdfInfo`: Get PDF metadata
- `splitPdf`: Split PDF into pages

## Phase 2: Integration Agents (Priority: HIGH)
**Goal**: Connect workflows to external services

### Step 2.1: Google Sheets Agent
- [ ] Create `src/automation/agents/integration/sheets.ts`
- [ ] Implement Google Sheets API integration
- [ ] Add OAuth2 authentication support
- [ ] Support read/write operations
- [ ] Add batch operations support
- [ ] Wire to agent registry
- [ ] Add unit tests in `tests/agents/integration/sheets.test.ts`
- [ ] Update documentation

**Capabilities**:
- `read_sheet`: Read data from Google Sheet
- `write_sheet`: Write data to Google Sheet
- `append_rows`: Append rows to sheet
- `update_cells`: Update specific cells
- `create_sheet`: Create new sheet in spreadsheet

### Step 2.2: Calendar Agent
- [ ] Create `src/automation/agents/integration/calendar.ts`
- [ ] Implement calendar API integration (Google Calendar)
- [ ] Add OAuth2 authentication support
- [ ] Support event CRUD operations
- [ ] Add recurring events support
- [ ] Wire to agent registry
- [ ] Add unit tests in `tests/agents/integration/calendar.test.ts`
- [ ] Update documentation

**Capabilities**:
- `create_event`: Create calendar event
- `list_events`: List events in date range
- `update_event`: Update existing event
- `delete_event`: Delete event
- `check_availability`: Check free/busy status

## Phase 3: Storage Agents (Priority: MEDIUM)
**Goal**: Enable data persistence across various storage systems

### Step 3.1: Database Agent
- [ ] Create `src/automation/agents/storage/database.ts`
- [ ] Implement PostgreSQL support (existing connection)
- [ ] Add SQLite support for lightweight use
- [ ] Support basic CRUD operations
- [ ] Add query builder helpers
- [ ] Wire to agent registry
- [ ] Add unit tests in `tests/agents/storage/database.test.ts`
- [ ] Update documentation

**Capabilities**:
- `query`: Execute SQL query
- `insert`: Insert records
- `update`: Update records
- `delete`: Delete records
- `transaction`: Execute transactional operations

### Step 3.2: S3/Cloud Storage Agent
- [ ] Create `src/automation/agents/storage/s3.ts`
- [ ] Implement AWS S3 SDK integration
- [ ] Add support for S3-compatible services
- [ ] Support file upload/download
- [ ] Add presigned URL generation
- [ ] Wire to agent registry
- [ ] Add unit tests in `tests/agents/storage/s3.test.ts`
- [ ] Update documentation

**Capabilities**:
- `upload_file`: Upload file to S3
- `download_file`: Download file from S3
- `list_files`: List files in bucket
- `delete_file`: Delete file from S3
- `generate_presigned_url`: Create temporary access URLs

## Phase 4: Orchestration Features (Priority: HIGH)
**Goal**: Enable advanced workflow orchestration capabilities

### Step 4.1: Parallel Execution Engine
- [ ] Create `src/automation/orchestrator/parallel-engine.ts`
- [ ] Implement DAG (Directed Acyclic Graph) builder
- [ ] Add task dependency resolution
- [ ] Support parallel task execution
- [ ] Implement task scheduling algorithm
- [ ] Add error handling and rollback
- [ ] Wire to main orchestration engine
- [ ] Add unit tests in `tests/orchestrator/parallel-engine.test.ts`
- [ ] Update documentation

**Features**:
- DAG-based task scheduling
- Parallel execution where dependencies allow
- Automatic dependency resolution
- Error handling with partial rollback
- Progress tracking for parallel tasks

### Step 4.2: Multi-Workflow Dependencies
- [ ] Create `src/automation/orchestrator/workflow-dependencies.ts`
- [ ] Implement workflow chaining
- [ ] Add cross-workflow data passing
- [ ] Support conditional workflow triggers
- [ ] Add workflow versioning support
- [ ] Wire to main orchestration engine
- [ ] Add unit tests in `tests/orchestrator/workflow-dependencies.test.ts`
- [ ] Update documentation

**Features**:
- Trigger workflows based on other workflow completion
- Pass data between workflows
- Conditional workflow execution
- Workflow version management

## Phase 5: Advanced Features Integration (Priority: MEDIUM)
**Goal**: Complete integration of partially implemented features

### Step 5.1: MCP Protocol Integration
- [ ] Update `src/services/mcp-protocol.ts`
- [ ] Wire advanced browser automation to MCP
- [ ] Add multi-tab orchestration via MCP
- [ ] Implement iframe handling via MCP
- [ ] Add file operation handlers
- [ ] Test MCP endpoint integration
- [ ] Update documentation

### Step 5.2: WebSocket Authentication
- [ ] Update `src/services/mcp-websocket.ts`
- [ ] Apply JWT authentication middleware
- [ ] Implement connection rate limiting
- [ ] Add per-user connection tracking
- [ ] Test WebSocket auth flow
- [ ] Update documentation

### Step 5.3: Distributed Rate Limiting
- [ ] Update `src/middleware/advanced-rate-limit.ts`
- [ ] Configure Redis integration
- [ ] Implement Redis fallback logic
- [ ] Apply rate limiters to all endpoints
- [ ] Test rate limiting under load
- [ ] Update documentation

## Phase 6: Visual Workflow Builder Enhancements (Priority: LOW)
**Goal**: Add new node types for new agents

### Step 6.1: Add Data Agent Nodes
- [ ] Update `public/workflow-builder.html`
- [ ] Add CSV node type with params
- [ ] Add JSON node type with params
- [ ] Add Excel node type with params
- [ ] Add PDF node type with params
- [ ] Update node type converter
- [ ] Test node creation and execution

### Step 6.2: Add Integration Agent Nodes
- [ ] Update `public/workflow-builder.html`
- [ ] Add Google Sheets node type
- [ ] Add Calendar node type
- [ ] Update node type converter
- [ ] Add OAuth configuration UI
- [ ] Test node creation and execution

### Step 6.3: Add Storage Agent Nodes
- [ ] Update `public/workflow-builder.html`
- [ ] Add Database node type
- [ ] Add S3 node type
- [ ] Update node type converter
- [ ] Test node creation and execution

### Step 6.4: Add Orchestration Nodes
- [ ] Update `public/workflow-builder.html`
- [ ] Add Parallel execution node
- [ ] Add Fork/Join node types
- [ ] Add Workflow trigger node
- [ ] Update node type converter
- [ ] Test parallel workflow execution

## Phase 7: Testing & Validation (Priority: HIGH)
**Goal**: Ensure all components work together

### Step 7.1: Integration Tests
- [ ] Create `tests/integration/data-agents.test.ts`
- [ ] Create `tests/integration/integration-agents.test.ts`
- [ ] Create `tests/integration/storage-agents.test.ts`
- [ ] Create `tests/integration/parallel-execution.test.ts`
- [ ] Create end-to-end workflow tests
- [ ] Verify all tests pass

### Step 7.2: Chrome Extension Testing
- [ ] Test workflow builder with new nodes
- [ ] Test execution of data agent workflows
- [ ] Test execution of integration agent workflows
- [ ] Test parallel workflow execution
- [ ] Verify error handling and logging

### Step 7.3: Performance Testing
- [ ] Load test parallel execution
- [ ] Test rate limiting under load
- [ ] Measure workflow execution times
- [ ] Optimize bottlenecks

## Phase 8: Documentation & Examples (Priority: MEDIUM)
**Goal**: Provide comprehensive documentation

### Step 8.1: Agent Documentation
- [ ] Document all data agents with examples
- [ ] Document all integration agents with examples
- [ ] Document all storage agents with examples
- [ ] Add OAuth setup guides
- [ ] Add troubleshooting guides

### Step 8.2: Workflow Examples
- [ ] Create example: CSV processing workflow
- [ ] Create example: Google Sheets automation
- [ ] Create example: Multi-step data pipeline
- [ ] Create example: Parallel data processing
- [ ] Add examples to documentation

### Step 8.3: Developer Guide
- [ ] Update WORKFLOW_BUILDER_INTEGRATION.md
- [ ] Add guide for creating custom agents
- [ ] Add guide for extending orchestrator
- [ ] Add MCP protocol documentation
- [ ] Add deployment guide

## Implementation Timeline

### Week 1: Data Agents
- Day 1-2: CSV & JSON agents
- Day 3-4: Excel & PDF agents
- Day 5: Testing & integration

### Week 2: Integration & Storage Agents
- Day 1-2: Google Sheets & Calendar agents
- Day 3-4: Database & S3 agents
- Day 5: Testing & integration

### Week 3: Orchestration Features
- Day 1-3: Parallel execution engine
- Day 4-5: Multi-workflow dependencies

### Week 4: Advanced Features & Polish
- Day 1-2: MCP integration & WebSocket auth
- Day 3: Visual builder enhancements
- Day 4-5: Testing & documentation

## Dependencies & Prerequisites

### NPM Packages to Install
```bash
npm install --save \
  csv-parse csv-stringify \
  xlsx \
  pdf-parse pdfkit \
  googleapis \
  aws-sdk \
  ioredis
```

### Environment Variables Needed
```bash
# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=

# AWS S3
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
AWS_S3_BUCKET=

# Redis (for distributed rate limiting)
REDIS_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

## Success Metrics

- [ ] All 4 data agents implemented and tested
- [ ] All 2 integration agents implemented and tested
- [ ] All 2 storage agents implemented and tested
- [ ] Parallel execution working with DAG scheduling
- [ ] Multi-workflow dependencies functional
- [ ] All advanced features fully integrated
- [ ] Visual builder supports all new node types
- [ ] 100+ integration tests passing
- [ ] Documentation complete with examples
- [ ] Chrome extension fully functional with all agents

## Risk Mitigation

### Technical Risks
1. **Google OAuth complexity**: Start with service account auth before OAuth
2. **PDF parsing reliability**: Use well-tested libraries (pdf-parse)
3. **Parallel execution complexity**: Start with simple DAG, iterate
4. **Redis dependency**: Ensure graceful fallback to memory

### Mitigation Strategies
- Implement agents incrementally with tests
- Use feature flags for new functionality
- Maintain backward compatibility
- Document known limitations
- Provide clear error messages

## Notes
- Each phase can be worked on incrementally
- Phases 1-2 are critical path for user value
- Phase 4 (orchestration) enables advanced use cases
- Phase 5 completes existing partial implementations
- Phases 6-8 are polish and documentation
