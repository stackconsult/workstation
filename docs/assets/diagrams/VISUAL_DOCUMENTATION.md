# 📊 Workstation Visual Documentation

This document contains Mermaid diagrams that visualize the Workstation architecture, development phases, and system interactions.

---

## Table of Contents

- [Project Timeline](#project-timeline)
- [Phase Progression](#phase-progression)
- [Agent Ecosystem](#agent-ecosystem)
- [System Architecture](#system-architecture)
- [Workflow Execution](#workflow-execution)
- [Authentication Flow](#authentication-flow)
- [Deployment Architecture](#deployment-architecture)

---

## Project Timeline

### Complete Development Timeline

```mermaid
timeline
    title Workstation Development Timeline (2024-2025)
    section 2024 Nov
        Nov 11 : v1.0.0 Initial Release
               : JWT Authentication
               : Express.js API
               : Docker Support
        Nov 14 : v1.1.0 Security Release
               : Helmet Integration
               : CORS Protection
               : Input Sanitization
    section 2025 Nov
        Nov 15 : Phase 1 Browser Automation
               : Playwright Integration
               : Workflow Engine
               : Database Layer
        Nov 15 : Agents 8-11 Complete
               : Error Assessment
               : Optimization
               : Guard Rails
               : Analytics
        Nov 16 : Agents 12 & 16 Complete
               : QA Intelligence
               : Competitor Research
               : Autonomous Loop
        Nov 17 : Agent 17 & Coding Agent
               : Project Builder
               : Deployment Manager
               : Specialized Coding
        Nov 17 : PR #49 Documentation Reorg
               : Structure Overhaul
               : Landing Page
               : GitHub Pages Setup
```

### Milestone Timeline with Durations

```mermaid
gantt
    title Workstation Major Milestones
    dateFormat  YYYY-MM-DD
    
    section Phase 0: Foundation
    JWT Auth Service        :done, p0-1, 2024-11-01, 2024-11-11
    Security Hardening      :done, p0-2, 2024-11-12, 2024-11-14
    
    section Phase 1: Browser Automation
    Playwright Integration  :done, p1-1, 2025-11-15, 1d
    Workflow Engine         :done, p1-2, 2025-11-15, 1d
    Database Layer          :done, p1-3, 2025-11-15, 1d
    API v2 Development      :done, p1-4, 2025-11-16, 1d
    
    section Phase 2: Agent Ecosystem
    Infrastructure Agents   :done, p2-1, 2025-11-15, 1d
    Quality Agents          :done, p2-2, 2025-11-15, 2d
    Intelligence Agents     :done, p2-3, 2025-11-16, 2d
    Development Agents      :done, p2-4, 2025-11-17, 1d
    Advanced Agents         :active, p2-5, 2025-11-18, 30d
    
    section Phase 2: Documentation
    Reorganization          :done, p2-6, 2025-11-17, 1d
    Continuity Docs         :active, p2-7, 2025-11-17, 1d
    
    section Phase 3: Planned
    Slack Integration       :p3, 2025-12-15, 45d
```

---

## Phase Progression

### Phase Status Overview

```mermaid
graph LR
    A[Phase 0: Foundation<br/>✅ Complete] --> B[Phase 1: Browser Automation<br/>✅ Complete]
    B --> C[Phase 2: Agent Ecosystem<br/>🟡 70% Complete]
    C --> D[Phase 3: Slack Integration<br/>⚪ Planned]
    D --> E[Phase 4: Advanced Features<br/>⚪ Planned]
    E --> F[Phase 5: Enterprise Scale<br/>⚪ Planned]
    
    style A fill:#90EE90,stroke:#006400,stroke-width:3px
    style B fill:#90EE90,stroke:#006400,stroke-width:3px
    style C fill:#FFD700,stroke:#FF8C00,stroke-width:3px
    style D fill:#E0E0E0,stroke:#808080,stroke-width:2px
    style E fill:#E0E0E0,stroke:#808080,stroke-width:2px
    style F fill:#E0E0E0,stroke:#808080,stroke-width:2px
```

### Detailed Phase Breakdown

```mermaid
graph TD
    subgraph "Phase 0: Foundation ✅"
        P0_1[JWT Authentication]
        P0_2[Express.js API]
        P0_3[Security Features]
        P0_4[Docker & Deployment]
    end
    
    subgraph "Phase 1: Browser Automation ✅"
        P1_1[Playwright Integration]
        P1_2[7 Browser Actions]
        P1_3[Workflow Engine]
        P1_4[Database Layer]
        P1_5[RESTful API v2]
    end
    
    subgraph "Phase 2: Agent Ecosystem 🟡"
        P2_1[10 Agents Complete]
        P2_2[Quality Assurance]
        P2_3[Optimization Tools]
        P2_4[11 Agents Remaining]
    end
    
    subgraph "Phase 3: Slack Integration ⚪"
        P3_1[Slack Bot]
        P3_2[Natural Language]
        P3_3[Team Collaboration]
    end
    
    P0_1 --> P0_2
    P0_2 --> P0_3
    P0_3 --> P0_4
    P0_4 --> P1_1
    
    P1_1 --> P1_2
    P1_2 --> P1_3
    P1_3 --> P1_4
    P1_4 --> P1_5
    P1_5 --> P2_1
    
    P2_1 --> P2_2
    P2_2 --> P2_3
    P2_3 --> P2_4
    P2_4 --> P3_1
    
    P3_1 --> P3_2
    P3_2 --> P3_3
    
    style P0_1 fill:#90EE90
    style P0_2 fill:#90EE90
    style P0_3 fill:#90EE90
    style P0_4 fill:#90EE90
    style P1_1 fill:#90EE90
    style P1_2 fill:#90EE90
    style P1_3 fill:#90EE90
    style P1_4 fill:#90EE90
    style P1_5 fill:#90EE90
    style P2_1 fill:#FFD700
    style P2_2 fill:#FFD700
    style P2_3 fill:#FFD700
    style P2_4 fill:#E0E0E0
    style P3_1 fill:#E0E0E0
    style P3_2 fill:#E0E0E0
    style P3_3 fill:#E0E0E0
```

---

## Agent Ecosystem

### Agent Development Flow

```mermaid
graph TB
    subgraph "Infrastructure Agents ✅"
        A1[Agent 1: MCP Server<br/>CSS Selector Builder]
        A7[Agent 7: Security Scanner<br/>Vulnerability Detection]
        A17[Agent 17: Project Builder<br/>Build & Deployment]
    end
    
    subgraph "Quality Assurance Agents ✅"
        A8[Agent 8: Error Assessment<br/>Error Analysis & Docs]
        A9[Agent 9: Optimization<br/>Performance & Quality]
        A10[Agent 10: Guard Rails<br/>Error Prevention]
        A12[Agent 12: QA Intelligence<br/>Autonomous QA]
    end
    
    subgraph "Intelligence Agents ✅"
        A11[Agent 11: Data Analytics<br/>Analysis & Comparison]
        A16[Agent 16: Competitor Research<br/>Market Intelligence]
    end
    
    subgraph "Development Agents ✅"
        AC[Workstation Coding Agent<br/>Domain-Specific Coding]
    end
    
    subgraph "Planned Agents ⚪"
        A13[Agent 13: Performance Testing]
        A14[Agent 14: Accessibility]
        A15[Agent 15: Doc Generator]
        A18[Agent 18: Community Hub]
        A19[Agent 19: Deployment Manager]
        A20[Agent 20: Plugin System]
        A21[Agent 21: Multi-tenant]
    end
    
    A1 --> A8
    A7 --> A8
    A8 --> A9
    A9 --> A10
    A10 --> A11
    A11 --> A12
    A12 --> A16
    A16 --> A17
    A17 --> AC
    AC --> A13
    A13 --> A14
    A14 --> A15
    A15 --> A18
    A18 --> A19
    A19 --> A20
    A20 --> A21
    
    style A1 fill:#90EE90,stroke:#006400
    style A7 fill:#90EE90,stroke:#006400
    style A8 fill:#90EE90,stroke:#006400
    style A9 fill:#90EE90,stroke:#006400
    style A10 fill:#90EE90,stroke:#006400
    style A11 fill:#90EE90,stroke:#006400
    style A12 fill:#90EE90,stroke:#006400
    style A16 fill:#90EE90,stroke:#006400
    style A17 fill:#90EE90,stroke:#006400
    style AC fill:#90EE90,stroke:#006400
    style A13 fill:#E0E0E0,stroke:#808080
    style A14 fill:#E0E0E0,stroke:#808080
    style A15 fill:#E0E0E0,stroke:#808080
    style A18 fill:#E0E0E0,stroke:#808080
    style A19 fill:#E0E0E0,stroke:#808080
    style A20 fill:#E0E0E0,stroke:#808080
    style A21 fill:#E0E0E0,stroke:#808080
```

### Agent Categories

```mermaid
mindmap
  root((Agent Ecosystem))
    Infrastructure
      MCP Server
      Security Scanner
      Project Builder
    Quality Assurance
      Error Assessment
      Optimization
      Guard Rails
      QA Intelligence
    Intelligence
      Data Analytics
      Competitor Research
    Development
      Coding Agent
      Doc Generator
    Planned
      Performance Testing
      Accessibility
      Community Hub
      Deployment Manager
      Plugin System
      Multi-tenant
```

---

## System Architecture

### High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        CLI[CLI Interface]
        WEB[Web Dashboard]
        API_CLIENT[API Clients]
    end
    
    subgraph "API Layer"
        AUTH[JWT Authentication]
        RATE[Rate Limiting]
        ROUTES[API Routes v1 & v2]
    end
    
    subgraph "Automation Layer"
        ORCH[Orchestration Engine]
        WORKFLOW[Workflow Manager]
        BROWSER[Browser Agent<br/>Playwright]
    end
    
    subgraph "Agent Ecosystem"
        AGENTS[Specialized Agents<br/>1-21]
        REGISTRY[Agent Registry]
    end
    
    subgraph "Data Layer"
        SQLITE[SQLite<br/>Development]
        POSTGRES[PostgreSQL<br/>Production]
    end
    
    CLI --> AUTH
    WEB --> AUTH
    API_CLIENT --> AUTH
    
    AUTH --> RATE
    RATE --> ROUTES
    
    ROUTES --> ORCH
    ORCH --> WORKFLOW
    WORKFLOW --> BROWSER
    WORKFLOW --> REGISTRY
    REGISTRY --> AGENTS
    
    WORKFLOW --> SQLITE
    WORKFLOW --> POSTGRES
    AGENTS --> SQLITE
    AGENTS --> POSTGRES
    
    style AUTH fill:#FFE4B5
    style BROWSER fill:#87CEEB
    style AGENTS fill:#98FB98
    style ORCH fill:#DDA0DD
```

### Component Architecture

```mermaid
graph LR
    subgraph "src/"
        AUTH_DIR[auth/]
        MIDDLEWARE[middleware/]
        ROUTES_DIR[routes/]
        AUTOMATION[automation/]
        UTILS[utils/]
    end
    
    subgraph "automation/"
        AGENTS_DIR[agents/core/]
        ORCH_DIR[orchestrator/]
        WORKFLOW_DIR[workflow/]
        DB_DIR[db/]
    end
    
    subgraph "agents/core/"
        BROWSER_TS[browser.ts]
        VISION_TS[vision.ts]
        REGISTRY_TS[registry.ts]
    end
    
    AUTH_DIR --> MIDDLEWARE
    MIDDLEWARE --> ROUTES_DIR
    ROUTES_DIR --> AUTOMATION
    AUTOMATION --> AGENTS_DIR
    AUTOMATION --> ORCH_DIR
    AUTOMATION --> WORKFLOW_DIR
    AUTOMATION --> DB_DIR
    AGENTS_DIR --> BROWSER_TS
    AGENTS_DIR --> VISION_TS
    AGENTS_DIR --> REGISTRY_TS
    
    style AUTOMATION fill:#87CEEB
    style AGENTS_DIR fill:#98FB98
```

---

## Workflow Execution

### Workflow Execution Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Auth
    participant Orchestrator
    participant Workflow
    participant Browser
    participant Database
    
    Client->>API: POST /api/v2/workflows/:id/execute
    API->>Auth: Verify JWT Token
    Auth-->>API: Token Valid
    API->>Orchestrator: Execute Workflow Request
    Orchestrator->>Database: Load Workflow Definition
    Database-->>Orchestrator: Workflow Data
    Orchestrator->>Workflow: Parse Tasks
    
    loop For Each Task
        Workflow->>Browser: Execute Action
        Browser->>Browser: Navigate/Click/Type/etc
        Browser-->>Workflow: Action Result
        Workflow->>Database: Save Task Result
    end
    
    Workflow-->>Orchestrator: Execution Complete
    Orchestrator->>Database: Update Workflow Status
    Orchestrator-->>API: Return Results
    API-->>Client: Execution Response
```

### Task Execution State Machine

```mermaid
stateDiagram-v2
    [*] --> Pending: Workflow Created
    Pending --> Queued: Scheduled
    Queued --> Running: Execution Started
    Running --> Completed: Success
    Running --> Failed: Error
    Running --> Retrying: Transient Error
    Retrying --> Running: Retry Attempt
    Retrying --> Failed: Max Retries
    Completed --> [*]
    Failed --> [*]
    
    note right of Running
        Task executing
        with timeout
    end note
    
    note right of Retrying
        Exponential backoff
        Max 3 attempts
    end note
```

### Workflow Task Dependencies

```mermaid
graph TD
    START[Workflow Start] --> T1[Task 1: Navigate]
    T1 --> T2[Task 2: Wait for Load]
    T2 --> T3[Task 3: Click Button]
    T2 --> T4[Task 4: Fill Form]
    T3 --> T5[Task 5: Screenshot]
    T4 --> T5
    T5 --> T6[Task 6: Extract Data]
    T6 --> END[Workflow Complete]
    
    style START fill:#90EE90
    style END fill:#90EE90
    style T1 fill:#87CEEB
    style T2 fill:#87CEEB
    style T3 fill:#87CEEB
    style T4 fill:#87CEEB
    style T5 fill:#87CEEB
    style T6 fill:#87CEEB
```

---

## Authentication Flow

### JWT Authentication Process

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant RateLimit
    participant Auth
    participant JWT
    participant Database
    
    Client->>API: POST /auth/token
    API->>RateLimit: Check Rate Limit
    RateLimit-->>API: Limit OK
    API->>Auth: Validate Request
    Auth->>JWT: Generate Token
    JWT->>JWT: Sign with Secret
    JWT-->>Auth: Signed Token
    Auth-->>API: Token Response
    API-->>Client: {"token": "eyJ...", "expiresIn": "24h"}
    
    Note over Client: Store Token Securely
    
    Client->>API: GET /api/protected<br/>Authorization: Bearer TOKEN
    API->>JWT: Verify Token
    JWT->>JWT: Validate Signature
    JWT->>JWT: Check Expiration
    JWT-->>API: Token Valid
    API->>Database: Execute Query
    Database-->>API: Data
    API-->>Client: Protected Data
```

### Security Layers

```mermaid
graph TD
    REQUEST[Incoming Request] --> HELMET[Helmet Security Headers]
    HELMET --> CORS[CORS Protection]
    CORS --> RATE[Rate Limiting]
    RATE --> JWT_CHECK{JWT Token?}
    JWT_CHECK -->|Yes| JWT_VERIFY[JWT Verification]
    JWT_CHECK -->|No| PUBLIC{Public Route?}
    PUBLIC -->|Yes| HANDLER[Route Handler]
    PUBLIC -->|No| DENY[401 Unauthorized]
    JWT_VERIFY -->|Valid| SANITIZE[Input Sanitization]
    JWT_VERIFY -->|Invalid| DENY
    SANITIZE --> HANDLER
    HANDLER --> RESPONSE[Response]
    DENY --> ERROR[Error Response]
    
    style HELMET fill:#FFE4B5
    style CORS fill:#FFE4B5
    style RATE fill:#FFE4B5
    style JWT_VERIFY fill:#FFE4B5
    style SANITIZE fill:#FFE4B5
    style HANDLER fill:#90EE90
    style DENY fill:#FFB6C1
```

---

## Deployment Architecture

### Docker Container Architecture

```mermaid
graph TB
    subgraph "Docker Container"
        NODE[Node.js Runtime]
        APP[Workstation App]
        PLAYWRIGHT[Playwright Browsers]
        SQLITE[SQLite DB]
    end
    
    subgraph "External Services"
        POSTGRES[PostgreSQL<br/>Production]
        REGISTRY[GitHub Container Registry]
    end
    
    subgraph "Deployment Platforms"
        RAILWAY[Railway]
        DOCKER_HOST[Docker Host]
        K8S[Kubernetes]
    end
    
    NODE --> APP
    APP --> PLAYWRIGHT
    APP --> SQLITE
    APP --> POSTGRES
    
    REGISTRY --> RAILWAY
    REGISTRY --> DOCKER_HOST
    REGISTRY --> K8S
    
    style NODE fill:#90EE90
    style APP fill:#87CEEB
    style PLAYWRIGHT fill:#DDA0DD
```

### Multi-Platform Build

```mermaid
graph LR
    SOURCE[Source Code] --> BUILD[Docker Build]
    BUILD --> AMD64[AMD64 Image]
    BUILD --> ARM64[ARM64 Image]
    AMD64 --> MANIFEST[Multi-Platform Manifest]
    ARM64 --> MANIFEST
    MANIFEST --> GHCR[GitHub Container Registry]
    GHCR --> DEPLOY[Deployment]
    
    style SOURCE fill:#FFE4B5
    style BUILD fill:#87CEEB
    style MANIFEST fill:#98FB98
    style GHCR fill:#DDA0DD
    style DEPLOY fill:#90EE90
```

### Railway Deployment Flow

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant Git as GitHub
    participant Railway
    participant Container
    participant App
    
    Dev->>Git: Push Code
    Git->>Railway: Webhook Trigger
    Railway->>Railway: Build Docker Image
    Railway->>Container: Deploy Container
    Container->>App: Start Application
    App->>App: Health Check
    App-->>Railway: Health OK
    Railway-->>Dev: Deployment Success
```

---

## Data Flow Diagrams

### Workflow Definition to Execution

```mermaid
graph TD
    JSON[JSON Workflow Definition] --> VALIDATE{Validation}
    VALIDATE -->|Valid| STORE[Store in Database]
    VALIDATE -->|Invalid| ERROR[Validation Error]
    STORE --> SCHEDULE[Schedule Execution]
    SCHEDULE --> PARSE[Parse Tasks]
    PARSE --> DEPS[Build Dependency Graph]
    DEPS --> EXEC[Execute Tasks]
    EXEC --> TASK1[Task Execution]
    TASK1 --> RESULT[Store Results]
    RESULT --> STATUS[Update Status]
    STATUS --> COMPLETE{All Tasks Done?}
    COMPLETE -->|Yes| SUCCESS[Workflow Complete]
    COMPLETE -->|No| EXEC
    
    style JSON fill:#FFE4B5
    style STORE fill:#87CEEB
    style EXEC fill:#98FB98
    style SUCCESS fill:#90EE90
    style ERROR fill:#FFB6C1
```

### Agent Communication Pattern

```mermaid
graph TB
    TRIGGER[Event Trigger] --> REGISTRY[Agent Registry]
    REGISTRY --> SELECT{Select Agent}
    SELECT --> AGENT[Specialized Agent]
    AGENT --> EXECUTE[Execute Task]
    EXECUTE --> RESULT[Generate Result]
    RESULT --> NOTIFY[Notify Orchestrator]
    NOTIFY --> LOG[Log Activity]
    LOG --> METRIC[Update Metrics]
    METRIC --> COMPLETE[Task Complete]
    
    style TRIGGER fill:#FFE4B5
    style AGENT fill:#98FB98
    style COMPLETE fill:#90EE90
```

---

## Usage Examples

### Quick Reference

To render these diagrams in your documentation:

1. **In Markdown**: Copy the entire code block including the ` ```mermaid ` tags
2. **In GitHub**: Diagrams render automatically in README and markdown files
3. **In Documentation Sites**: Most static site generators support Mermaid
4. **As Images**: Use [Mermaid Live Editor](https://mermaid.live/) to export as PNG/SVG

### Updating Diagrams

When updating system architecture or workflow:

1. Update the relevant diagram in this file
2. Ensure consistency across all related diagrams
3. Update related documentation with references
4. Test rendering in GitHub preview

---

## Related Documentation

- [ARCHITECTURE.md](../../architecture/ARCHITECTURE.md) - Detailed architecture documentation
- [PROJECT_TIMELINE.md](../../PROJECT_TIMELINE.md) - Complete project timeline
- [DEVELOPMENT_PHASES.md](../../DEVELOPMENT_PHASES.md) - Phase documentation
- [ROADMAP.md](../../architecture/ROADMAP.md) - Future plans

---

**Last Updated**: November 17, 2025  
**Document Version**: 1.0  
**Diagrams**: 25 total

**Note**: All diagrams use Mermaid syntax and render automatically on GitHub.
