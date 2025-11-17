# MCP Architecture & Agent Mapping Specification

## Overview

This document defines the complete architecture for the 20-MCP system, including agent-to-MCP mappings, communication protocols, node structure, and connectivity patterns.

## System Architecture

### High-Level Design

```
┌─────────────────────────────────────────────────────────────────┐
│                    Master Orchestrator (MCP-20)                  │
│                 Coordinates all agent activities                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Orchestrates
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Nginx Proxy (Port 80)                     │
│              Routes requests to appropriate MCPs                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
        ┌───────────▼──────────┐   ┌───▼───────────────┐
        │  Tier 1: Core (1-6)  │   │  Tier 2: Quality  │
        │   Builder Agents     │   │    (7-13)         │
        └──────────────────────┘   └───────────────────┘
                    │                   │
        ┌───────────▼──────────┐   ┌───▼───────────────┐
        │ Tier 3: Platform     │   │  External APIs    │
        │   (14-20)            │   │  & Services       │
        └──────────────────────┘   └───────────────────┘
```

## Agent-to-MCP Mapping

### Tier 1: Core Builder Agents (1-6)

#### MCP-01: CSS Selector Builder
- **Agent**: Agent 1 - CSS Selector & Element Finder
- **Port**: 3001
- **Status**: ✅ COMPLETE
- **Purpose**: Generate, validate, and optimize CSS selectors
- **Tools**: 
  - `generate_selector` - Create selectors from text/attributes
  - `validate_selector` - Test selector validity
  - `optimize_selector` - Improve selector performance
  - `extract_data` - Pull data using selectors
  - `monitor_changes` - Track DOM changes
- **Dependencies**: Playwright, @modelcontextprotocol/sdk
- **Health Check**: `/health` on port 3000

#### MCP-02: Navigation Helper
- **Agent**: Agent 2 - Page Navigation & Interaction
- **Port**: 3002
- **Status**: 🔨 NEEDS REBUILD (stub exists)
- **Purpose**: Navigate pages, click elements, handle popups
- **Tools**:
  - `navigate_to` - Go to URL with wait conditions
  - `click_element` - Click with retry logic
  - `fill_form` - Fill form fields
  - `handle_popup` - Accept/dismiss dialogs
  - `wait_for_navigation` - Smart navigation waits
- **Dependencies**: Playwright, @modelcontextprotocol/sdk
- **Health Check**: `/health` on port 3000

#### MCP-03: Data Extraction
- **Agent**: Agent 3 - Data Scraping & Parsing
- **Port**: 3003
- **Status**: 🔨 NEEDS REBUILD (stub exists)
- **Purpose**: Extract structured data from web pages
- **Tools**:
  - `extract_table` - Parse HTML tables
  - `extract_list` - Extract lists/arrays
  - `extract_json` - Find JSON in page
  - `extract_metadata` - Get meta tags
  - `parse_schema` - Extract schema.org data
- **Dependencies**: Playwright, Cheerio, @modelcontextprotocol/sdk
- **Health Check**: `/health` on port 3000

#### MCP-04: Error Handling
- **Agent**: Agent 4 - Error Detection & Recovery
- **Port**: 3004
- **Status**: 🔨 NEEDS REBUILD (stub exists)
- **Purpose**: Detect errors, retry failures, log issues
- **Tools**:
  - `detect_error` - Find errors on page
  - `retry_action` - Retry with backoff
  - `capture_screenshot` - Screenshot on error
  - `log_error` - Structured error logging
  - `recover_session` - Session recovery
- **Dependencies**: Playwright, Winston, @modelcontextprotocol/sdk
- **Health Check**: `/health` on port 3000

#### MCP-05: Workflow Orchestrator
- **Agent**: Agent 5 - Multi-Step Workflow Manager
- **Port**: 3005
- **Status**: ❌ MISSING
- **Purpose**: Coordinate multi-step automation workflows
- **Tools**:
  - `create_workflow` - Define workflow steps
  - `execute_workflow` - Run workflow
  - `pause_workflow` - Pause execution
  - `resume_workflow` - Resume from checkpoint
  - `get_workflow_status` - Status query
- **Dependencies**: Node-cron, @modelcontextprotocol/sdk
- **Health Check**: `/health` on port 3000

#### MCP-06: Project Builder
- **Agent**: Agent 6 - Code Generation & Scaffolding
- **Port**: 3006
- **Status**: ❌ MISSING
- **Purpose**: Generate project structures and boilerplate
- **Tools**:
  - `scaffold_project` - Create project structure
  - `generate_component` - Generate code components
  - `add_dependency` - Add npm packages
  - `create_config` - Generate config files
  - `setup_tests` - Create test templates
- **Dependencies**: @modelcontextprotocol/sdk, fs-extra
- **Health Check**: `/health` on port 3000

### Tier 2: Quality & Monitoring Agents (7-13)

#### MCP-07: Code Quality
- **Agent**: Agent 7 - Linting & Code Review
- **Port**: 3007
- **Status**: ❌ MISSING
- **Purpose**: Analyze code quality and enforce standards
- **Tools**:
  - `lint_code` - Run ESLint/TSLint
  - `check_types` - TypeScript type checking
  - `analyze_complexity` - Cyclomatic complexity
  - `suggest_improvements` - Code suggestions
  - `format_code` - Prettier formatting
- **Dependencies**: ESLint, TypeScript, @modelcontextprotocol/sdk
- **Health Check**: `/health` on port 3000

#### MCP-08: Performance Monitor
- **Agent**: Agent 8 - Performance Analysis
- **Port**: 3008
- **Status**: ❌ MISSING
- **Purpose**: Monitor and optimize performance metrics
- **Tools**:
  - `measure_load_time` - Page load metrics
  - `analyze_bundle` - Bundle size analysis
  - `check_lighthouse` - Lighthouse scores
  - `monitor_memory` - Memory usage tracking
  - `profile_cpu` - CPU profiling
- **Dependencies**: Playwright, Lighthouse, @modelcontextprotocol/sdk
- **Health Check**: `/health` on port 3000

#### MCP-09: Error Tracker
- **Agent**: Agent 9 - Centralized Error Management
- **Port**: 3009
- **Status**: ❌ MISSING
- **Purpose**: Aggregate and analyze errors across system
- **Tools**:
  - `log_error` - Log structured error
  - `query_errors` - Search error logs
  - `get_error_stats` - Error statistics
  - `create_alert` - Configure alerts
  - `export_logs` - Export error data
- **Dependencies**: Winston, SQLite, @modelcontextprotocol/sdk
- **Health Check**: `/health` on port 3000

#### MCP-10: Security Scanner
- **Agent**: Agent 10 - Security Analysis
- **Port**: 3010
- **Status**: ❌ MISSING
- **Purpose**: Scan for security vulnerabilities
- **Tools**:
  - `scan_dependencies` - Check npm audit
  - `check_secrets` - Find exposed secrets
  - `analyze_headers` - Security headers
  - `test_xss` - XSS vulnerability testing
  - `check_csp` - Content Security Policy
- **Dependencies**: npm-audit, @modelcontextprotocol/sdk
- **Health Check**: `/health` on port 3000

#### MCP-11: Accessibility Checker
- **Agent**: Agent 11 - A11y Compliance
- **Port**: 3011
- **Status**: ❌ MISSING
- **Purpose**: Check accessibility standards (WCAG)
- **Tools**:
  - `check_wcag` - WCAG compliance test
  - `analyze_contrast` - Color contrast check
  - `check_aria` - ARIA label validation
  - `test_keyboard` - Keyboard navigation
  - `generate_report` - A11y report
- **Dependencies**: Axe-core, Playwright, @modelcontextprotocol/sdk
- **Health Check**: `/health` on port 3000

#### MCP-12: Integration Hub
- **Agent**: Agent 12 - External Service Integration
- **Port**: 3012
- **Status**: ❌ MISSING
- **Purpose**: Connect to external APIs and services
- **Tools**:
  - `call_api` - Make HTTP requests
  - `send_webhook` - Send webhook events
  - `connect_database` - Database connections
  - `upload_storage` - Cloud storage upload
  - `send_email` - Email notifications
- **Dependencies**: Axios, @modelcontextprotocol/sdk
- **Health Check**: `/health` on port 3000

#### MCP-13: Docs Auditor
- **Agent**: Agent 13 - Documentation Quality
- **Port**: 3013
- **Status**: ❌ MISSING
- **Purpose**: Audit and improve documentation
- **Tools**:
  - `check_completeness` - Doc coverage check
  - `validate_links` - Link validation
  - `check_examples` - Example code testing
  - `analyze_readability` - Readability score
  - `suggest_improvements` - Doc suggestions
- **Dependencies**: Markdown-it, @modelcontextprotocol/sdk
- **Health Check**: `/health` on port 3000

### Tier 3: Platform & Advanced (14-20)

#### MCP-14: Advanced Automation
- **Agent**: Agent 14 - Complex Automation Workflows
- **Port**: 3014
- **Status**: ❌ MISSING
- **Purpose**: Handle complex multi-page automation
- **Tools**:
  - `create_bot` - Define automation bot
  - `schedule_task` - Schedule recurring tasks
  - `parallel_execute` - Run tasks in parallel
  - `conditional_flow` - Conditional logic
  - `loop_action` - Iterative actions
- **Dependencies**: Node-cron, @modelcontextprotocol/sdk
- **Health Check**: `/health` on port 3000

#### MCP-15: API Integrator
- **Agent**: Agent 15 - REST/GraphQL API Tools
- **Port**: 3015
- **Status**: ❌ MISSING
- **Purpose**: Build and test API integrations
- **Tools**:
  - `test_endpoint` - Test API endpoint
  - `generate_client` - Generate API client
  - `mock_api` - Create mock server
  - `validate_schema` - Schema validation
  - `monitor_api` - API health monitoring
- **Dependencies**: Axios, @modelcontextprotocol/sdk
- **Health Check**: `/health` on port 3000

#### MCP-16: Data Processor
- **Agent**: Agent 16 - Data Transformation
- **Port**: 3016
- **Status**: ❌ MISSING
- **Purpose**: Process, transform, and analyze data
- **Tools**:
  - `transform_data` - Data transformation
  - `aggregate_data` - Aggregation operations
  - `filter_data` - Data filtering
  - `export_csv` - Export to CSV
  - `export_json` - Export to JSON
- **Dependencies**: @modelcontextprotocol/sdk
- **Health Check**: `/health` on port 3000

#### MCP-17: Learning Platform
- **Agent**: Agent 17 - AI Training & Learning
- **Port**: 3017
- **Status**: ❌ MISSING
- **Purpose**: Machine learning model training
- **Tools**:
  - `train_model` - Train ML model
  - `predict` - Make predictions
  - `evaluate_model` - Model evaluation
  - `export_model` - Export trained model
  - `load_model` - Load existing model
- **Dependencies**: Natural, @modelcontextprotocol/sdk
- **Health Check**: `/health` on port 3000

#### MCP-18: Community Hub
- **Agent**: Agent 18 - Collaboration & Sharing
- **Port**: 3018
- **Status**: ❌ MISSING
- **Purpose**: Share workflows and collaborate
- **Tools**:
  - `share_workflow` - Share workflow config
  - `import_workflow` - Import shared workflow
  - `rate_workflow` - Rate/review workflows
  - `search_workflows` - Search community
  - `contribute` - Submit contribution
- **Dependencies**: @modelcontextprotocol/sdk
- **Health Check**: `/health` on port 3000

#### MCP-19: Deployment Manager
- **Agent**: Agent 19 - Deploy & Release
- **Port**: 3019
- **Status**: ❌ MISSING
- **Purpose**: Manage deployments and releases
- **Tools**:
  - `deploy_container` - Deploy Docker container
  - `rollback_deployment` - Rollback to previous
  - `health_check` - Check deployment health
  - `scale_service` - Scale up/down
  - `view_logs` - View deployment logs
- **Dependencies**: Docker SDK, @modelcontextprotocol/sdk
- **Health Check**: `/health` on port 3000

#### MCP-20: Master Orchestrator
- **Agent**: Agent 20 - System-Wide Coordinator
- **Port**: 3020
- **Status**: ❌ MISSING
- **Purpose**: Coordinate all agents and MCPs
- **Tools**:
  - `route_request` - Route to appropriate MCP
  - `aggregate_results` - Combine results
  - `health_check_all` - Check all MCPs
  - `coordinate_workflow` - Multi-MCP workflows
  - `load_balance` - Balance MCP load
- **Dependencies**: All MCP clients, @modelcontextprotocol/sdk
- **Health Check**: `/health` on port 3000
- **Depends On**: MCP-01 through MCP-19

## Communication Protocol

### MCP Server Protocol

All MCPs implement the Model Context Protocol (MCP) specification:

1. **Transport**: StdioServerTransport for process communication
2. **Format**: JSON-RPC 2.0 messages
3. **Capabilities**: Tool execution, resource management
4. **Health**: HTTP endpoint on port 3000

### Message Flow

```
Agent Request → Nginx Proxy → Target MCP → Tool Execution → Response
                    │
                    ├──→ MCP-20 (Orchestrator) for coordination
                    └──→ Direct to specific MCP for single operations
```

### Error Handling Protocol

1. **Retry Logic**: Exponential backoff (2^n seconds)
2. **Circuit Breaker**: Open after 5 consecutive failures
3. **Fallback**: Route to backup MCP if available
4. **Logging**: All errors logged to MCP-09 (Error Tracker)

## Node Structure

### MCP Node Architecture

Each MCP container has:

```typescript
class BaseMCPServer {
  private server: Server;           // MCP SDK server
  private browser: Browser | null;  // Playwright browser (if needed)
  private httpServer: any;          // Express health check server
  
  // Core Methods
  protected setupTools(): void;              // Register tools
  protected setupHttpServer(): void;         // Health check endpoint
  protected getTools(): Tool[];              // Tool definitions
  protected handleTool(name, args): any;     // Tool execution
  async run(): void;                         // Start server
  async cleanup(): void;                     // Graceful shutdown
}
```

### Connectivity Patterns

#### Point-to-Point
- Agent → Specific MCP (e.g., Agent requests MCP-01 for selector)

#### Hub-and-Spoke
- Agent → MCP-20 → Multiple MCPs (orchestrated workflow)

#### Publish-Subscribe
- MCP-09 (Error Tracker) subscribes to errors from all MCPs

#### Request-Response
- Standard RPC pattern for all tool executions

## Network Configuration

### Docker Network

```yaml
networks:
  default:
    name: workstation-mcp-network
    driver: bridge
```

### Port Mappings

| MCP | Internal | External | Purpose |
|-----|----------|----------|---------|
| 01  | 3000     | 3001     | Selector Builder |
| 02  | 3000     | 3002     | Navigation |
| 03  | 3000     | 3003     | Data Extraction |
| ... | ...      | ...      | ... |
| 20  | 3000     | 3020     | Orchestrator |
| Nginx | 80     | 80       | Proxy |

### Nginx Routing

```nginx
location /mcp/01/ { proxy_pass http://mcp-01-selector:3000/; }
location /mcp/02/ { proxy_pass http://mcp-02-navigation:3000/; }
# ... routes for all 20 MCPs
```

## Service Dependencies

### Dependency Graph

```
MCP-20 (Orchestrator)
  ├── Depends on: MCP-01 through MCP-19
  └── Coordinates: All workflow execution

MCP-01 (Selector)
  └── Independent

MCP-02 (Navigation)
  └── Uses: MCP-01 (for selector generation)

MCP-03 (Extraction)
  ├── Uses: MCP-01 (selectors)
  └── Uses: MCP-02 (navigation)

MCP-04 (Error Handling)
  └── Monitors: All MCPs

MCP-09 (Error Tracker)
  └── Receives from: All MCPs
```

## Guardrails & Error Handling

### Built-in Guardrails

1. **Rate Limiting**
   - Max 100 requests/minute per MCP
   - Enforced at Nginx proxy level

2. **Timeout Management**
   - Tool execution timeout: 30 seconds
   - Browser operation timeout: 60 seconds
   - Network request timeout: 10 seconds

3. **Resource Limits**
   - Max 2 concurrent browser instances per MCP
   - Memory limit: 512MB per container
   - CPU limit: 0.5 cores per container

4. **Input Validation**
   - JSON schema validation on all tool inputs
   - URL validation and sanitization
   - Selector syntax validation

5. **Security**
   - No arbitrary code execution
   - Sandboxed browser contexts
   - CORS restrictions on health endpoints

### Error Recovery Strategies

1. **Retry on Failure**
   ```typescript
   async function withRetry(fn, maxRetries = 3) {
     for (let i = 0; i < maxRetries; i++) {
       try {
         return await fn();
       } catch (e) {
         if (i === maxRetries - 1) throw e;
         await sleep(Math.pow(2, i) * 1000);
       }
     }
   }
   ```

2. **Circuit Breaker**
   - Open circuit after 5 consecutive failures
   - Half-open after 60 seconds
   - Close after 3 successful requests

3. **Graceful Degradation**
   - Return cached results if service unavailable
   - Use fallback MCPs when primary fails
   - Partial results better than complete failure

## Health Monitoring

### Health Check Specification

Every MCP exposes:

```
GET /health
Response: {
  "status": "healthy" | "degraded" | "unhealthy",
  "agent": "agent-XX-name",
  "uptime": 12345,
  "metrics": {
    "requests": 100,
    "errors": 2,
    "avgResponseTime": 150
  }
}
```

### Monitoring Strategy

1. **Container Level**: Docker health checks every 30s
2. **Application Level**: Express health endpoint
3. **System Level**: MCP-20 orchestrator polls all MCPs
4. **External Level**: External monitoring (optional)

## Testing Strategy

### Test Levels

1. **Unit Tests**: Individual tool functions
2. **Integration Tests**: MCP-to-MCP communication
3. **End-to-End Tests**: Full workflows through Nginx
4. **Load Tests**: Performance under load
5. **Chaos Tests**: Failure scenarios

### Test Coverage Target

- Minimum: 80% code coverage
- Critical paths: 100% coverage
- Error handling: 100% coverage

## Deployment Architecture

### Docker Compose Stack

```
docker-compose.mcp.yml
  ├── 20 MCP services
  ├── 1 Nginx proxy
  ├── Shared network
  └── Volume mounts for data persistence
```

### Rollback Strategy

1. Image versioning: `workstation-mcp-XX:v1.0.0`
2. Blue-green deployments
3. Automated rollback on health check failures
4. Manual rollback via script

### Scaling Strategy

- Horizontal: Multiple instances of individual MCPs
- Vertical: Increase resource limits per container
- Load balancing: Nginx upstream configuration

## Documentation Requirements

### Per-MCP Documentation

Each MCP must have:

1. **README.md** with:
   - Purpose and capabilities
   - Tool descriptions
   - Usage examples
   - API reference
   - Error codes

2. **CHANGELOG.md** for version history

3. **Inline JSDoc** for all public methods

4. **OpenAPI/Swagger** for HTTP endpoints (if applicable)

## Quality Standards

### Code Quality

- TypeScript strict mode enabled
- ESLint with no warnings
- Prettier formatting
- No `any` types without justification

### Security

- No secrets in code
- Environment variable validation
- Input sanitization
- Output encoding

### Performance

- Tool execution < 30s
- Health check response < 1s
- Memory usage < 512MB
- No memory leaks

## Implementation Checklist

For each MCP (05-20):

- [ ] Create directory structure
- [ ] Copy base template
- [ ] Implement specific tools
- [ ] Add tool schemas
- [ ] Create Dockerfile
- [ ] Write tests (>80% coverage)
- [ ] Create comprehensive README
- [ ] Add to docker-compose.mcp.yml
- [ ] Configure Nginx routing
- [ ] Test health endpoint
- [ ] Test tool execution
- [ ] Integration test with MCP-20
- [ ] Document in architecture

## Next Steps

1. Build MCP-05 through MCP-20 following this architecture
2. Implement inter-MCP communication protocols
3. Deploy and test full stack
4. Load test and optimize
5. Document operational runbook
