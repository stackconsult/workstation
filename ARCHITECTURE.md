# Architecture Documentation

## Overview

stackBrowserAgent is a lightweight, secure JWT-based authentication service built with Express.js and TypeScript. It provides a foundation for browser automation agents with enterprise-grade security features.

## Technology Stack

### Runtime & Framework
- **Node.js** (v18+): JavaScript runtime
- **Express.js** (v4.18+): Web application framework
- **TypeScript** (v5.3+): Type-safe development

### Authentication & Security
- **jsonwebtoken** (v9.0+): JWT token generation and verification
- **express-rate-limit** (v8.2+): Rate limiting middleware
- **cors**: Cross-Origin Resource Sharing support
- **dotenv**: Environment variable management

### Development Tools
- **ts-node**: TypeScript execution for development
- **ESLint**: Code quality and style enforcement
- **@typescript-eslint**: TypeScript-specific linting rules

## Project Structure

```
stackBrowserAgent/
├── src/                              # Source code
│   ├── auth/                         # Authentication module
│   │   └── jwt.ts                    # JWT token logic
│   ├── automation/                   # Automation logic (agents, orchestrator, workflow, db)
│   │   ├── agents/                   # Agent implementations
│   │   ├── orchestrator/             # Orchestration logic
│   │   ├── workflow/                 # Workflow definitions
│   │   └── db/                       # Database access layer
│   ├── middleware/                   # Express middleware (errorHandler, validation)
│   │   ├── errorHandler.ts
│   │   └── validation.ts
│   ├── utils/                        # Utility functions (logger, health, env)
│   │   ├── logger.ts
│   │   ├── health.ts
│   │   └── env.ts
│   ├── routes/                       # Route definitions (automation routes)
│   │   └── automation.ts
│   ├── services/                     # Service layer (navigationService)
│   │   └── navigationService.ts
│   ├── orchestration/                # Agent orchestration
│   │   └── agent-orchestrator.ts
│   ├── types/                        # TypeScript type definitions
│   └── index.ts                      # Main application entry
├── agent-server/                     # Standalone agent server
├── mcp-containers/                   # Containerized MCP components
├── tests/                            # Test suites
├── dist/                             # Compiled JavaScript (generated)
├── node_modules/                     # Dependencies (generated)
├── .env.example                      # Environment variable template
├── .eslintrc.json                    # ESLint configuration
├── .gitignore                        # Git ignore rules
├── .dockerignore                     # Docker ignore rules
├── API.md                            # API documentation
├── ARCHITECTURE.md                   # Architecture documentation
├── CHANGELOG.md                      # Version history
├── CONTINUITY_DOCUMENTATION.md       # Continuity and operational docs
├── DEPLOYMENT_INTEGRATED.md          # Integrated deployment instructions
├── ENTERPRISE_ERROR_HANDLING.md      # Error handling education system
├── FIX_SUMMARY.md                    # Fix summary documentation
├── QUICKSTART_INTEGRATED.md          # Integrated quickstart guide
├── CONTRIBUTING.md                   # Contribution guidelines
├── Dockerfile                        # Docker container config
├── LICENSE                           # License file
├── README.md                         # Main documentation
├── package.json                      # Dependencies & scripts
├── railway.json                      # Railway deployment config
├── test.sh                           # Test suite script
└── tsconfig.json                     # TypeScript configuration
```

## Architecture Layers

### 1. Application Layer (`src/index.ts`)

The main Express application that:
- Configures middleware (CORS, JSON parsing, rate limiting)
- Defines API routes
- Handles HTTP requests and responses
- Manages server lifecycle

**Key Components**:
- Express app initialization
- Middleware configuration
- Route definitions
- Server startup

### 2. Authentication Layer (`src/auth/jwt.ts`)

JWT authentication module providing:
- Token generation with configurable expiration
- Token verification and validation
- Express middleware for protected routes
- Type-safe interfaces for JWT payloads

**Key Functions**:
- `generateToken(payload)`: Create signed JWT tokens
- `verifyToken(token)`: Validate and decode tokens
- `authenticateToken`: Express middleware for route protection
- `generateDemoToken()`: Quick token generation for testing

### 3. Security Layer

Implemented across the application:
- **Rate Limiting**: Prevents abuse and DoS attacks
- **JWT Authentication**: Stateless, secure authentication
- **Type Safety**: TypeScript ensures type correctness
- **Input Validation**: Validates required fields

## Data Flow

### Token Generation Flow

```
Client Request
    ↓
POST /auth/token
    ↓
Extract userId and role from request body
    ↓
Validate required fields (userId)
    ↓
generateToken({ userId, role })
    ↓
jwt.sign(payload, JWT_SECRET, { expiresIn })
    ↓
Return signed JWT token
    ↓
Client receives token
```

### Protected Route Flow

```
Client Request with Authorization header
    ↓
GET /api/protected
    ↓
authenticateToken middleware
    ↓
Extract token from Authorization header
    ↓
verifyToken(token)
    ↓
jwt.verify(token, JWT_SECRET)
    ↓
Valid? → Attach user to request → Continue to route handler
Invalid? → Return 403 Forbidden
Missing? → Return 401 Unauthorized
    ↓
Route handler processes request
    ↓
Response sent to client
```

## Security Architecture

### Defense in Depth

1. **Rate Limiting** (First Line)
   - Limits request frequency per IP
   - Prevents brute force attacks
   - Different limits for auth vs general endpoints

2. **JWT Authentication** (Second Line)
   - Stateless authentication
   - Cryptographically signed tokens
   - Configurable expiration

3. **Type Safety** (Development Time)
   - TypeScript catches type errors before runtime
   - Interface definitions prevent invalid data structures

4. **Input Validation** (Runtime)
   - Validates required fields
   - Prevents malformed requests

### Token Security

- **Signing**: HMAC SHA256 algorithm
- **Secret**: Configurable via JWT_SECRET environment variable
- **Expiration**: Configurable (default: 24 hours)
- **Validation**: Every protected request validates token signature

## Deployment Architecture

### Local Development

```
Developer Machine
    ↓
npm run dev (ts-node)
    ↓
TypeScript files run directly
    ↓
Hot reload on changes
```

### Production Build

```
Source Code (TypeScript)
    ↓
npm run build (tsc)
    ↓
Compiled JavaScript (dist/)
    ↓
npm start (node dist/index.js)
    ↓
Production server
```

### Docker Deployment

```
Dockerfile
    ↓
Install dependencies (npm ci)
    ↓
Copy source code
    ↓
Build TypeScript (npm run build)
    ↓
Remove dev dependencies (npm prune --production)
    ↓
Container ready
    ↓
CMD ["npm", "start"]
```

### Railway Deployment

```
GitHub Repository
    ↓
Railway detects railway.json
    ↓
Automatic build (npm install && npm run build)
    ↓
Environment variables configured
    ↓
Start command (npm start)
    ↓
Public URL assigned
```

## Configuration Management

### Environment Variables

| Variable | Purpose | Default | Required |
|----------|---------|---------|----------|
| `JWT_SECRET` | Token signing key | default-secret... | Yes (production) |
| `JWT_EXPIRATION` | Token lifetime | 24h | No |
| `PORT` | Server port | 3000 | No |
| `NODE_ENV` | Environment mode | development | No |

### Configuration Loading

1. `.env` file loaded via dotenv
2. Environment variables override .env values
3. Default values used as fallback
4. Railway auto-generates JWT_SECRET if not provided

## Scalability Considerations

### Current Architecture
- Single instance Node.js server
- Stateless authentication (JWT)
- In-memory rate limiting

### Scaling Strategies

**Horizontal Scaling**:
- Stateless JWT enables easy horizontal scaling
- Add load balancer in front of multiple instances
- No session store required

**Rate Limiting in Distributed Systems**:
- Current: In-memory (single instance)
- Future: Redis-backed rate limiting for distributed deployments

**Database Integration** (Future):
- User management and persistence
- Token revocation/blacklisting
- Activity logging

## Performance

### Request Handling
- Express.js event-driven architecture
- Non-blocking I/O operations
- Efficient JWT operations

### Memory Usage
- Lightweight Node.js process
- Minimal dependencies
- No session storage overhead

### Response Times
- Health check: <5ms
- Token generation: <10ms
- Token verification: <10ms
- Protected routes: <15ms (including verification)

## Monitoring & Logging

### Current Logging
- Server startup information
- Environment configuration
- Structured logging with Winston (implemented)
- Request/response logging
- Error tracking and categorization

### Future Enhancements
- Advanced log aggregation (ELK Stack, Datadog)
- Error tracking (Sentry integration)
- Performance metrics (Prometheus)
- Distributed tracing (OpenTelemetry)

## Extension Points

The architecture supports future extensions:

1. **WebSocket Support**: Real-time communication
2. **OAuth Integration**: Social login providers
3. **Message Queue**: Async task processing
4. **Caching Layer**: Redis for performance
5. **API Gateway**: Kong, Traefik for advanced routing

### Implemented Extensions

- **Database Layer**: SQLite-based persistence implemented
- **Browser Automation**: Playwright integration (1.56+) implemented

## Design Decisions

### Why JWT?
- **Stateless**: No server-side session storage
- **Scalable**: Works across multiple instances
- **Standard**: Industry-standard authentication
- **Flexible**: Can include custom claims

### Why Express?
- **Mature**: Battle-tested framework
- **Flexible**: Minimal, unopinionated
- **Ecosystem**: Large middleware ecosystem
- **Performance**: Fast and lightweight

### Why TypeScript?
- **Type Safety**: Catch errors at compile time
- **Developer Experience**: Better IDE support
- **Maintainability**: Self-documenting code
- **Refactoring**: Safer code changes

### Why Railway?
- **Simple**: One-click deployment
- **Automatic**: Build and deploy automation
- **Managed**: Infrastructure handled
- **Affordable**: Good free tier

## Security Best Practices

1. **Never commit secrets** to version control
2. **Use strong JWT_SECRET** in production (32+ characters)
3. **Enable HTTPS** in production
4. **Rotate secrets periodically**
5. **Monitor rate limit violations**
6. **Keep dependencies updated** (npm audit)
7. **Implement logging** for security events
8. **Use environment-specific configs**

## Testing Strategy

### Current Tests
- Automated test suite: 146 tests passing using Jest (covers core functionality and API endpoints)
- Manual test script (`test.sh`) for integration and smoke testing
- cURL-based API testing (for manual verification and debugging)

### Future Testing
- Additional unit test coverage (expanding beyond 64% overall)
- End-to-end tests (Playwright for UI automation)
- Load testing (Artillery, k6)
- Security testing (OWASP ZAP)

## Maintenance

### Regular Tasks
- Update dependencies (weekly/monthly)
- Review security advisories
- Monitor rate limit logs
- Rotate JWT secrets (quarterly)
- Review error logs

### Version Updates
- Follow semantic versioning
- Document breaking changes
- Provide migration guides
- Tag releases in Git

## Resources

- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Railway Docs](https://docs.railway.app/)

---

## Agent Ecosystem & MCP Architecture

### Overview

Workstation implements a **multi-agent architecture** with 20+ specialized agents orchestrated through the Model Context Protocol (MCP). Each agent runs in an isolated container with standardized interfaces and health monitoring.

### Agent 16: Coding Agent (Data Processing)

**Purpose**: GitHub integration, code automation, and data processing

**Architecture Components**:
```
┌─────────────────────────────────────────┐
│     Coding Agent (Agent 16)             │
│  ┌────────────────────────────────────┐ │
│  │   Express.js REST API              │ │
│  │   - GitHub Operations              │ │
│  │   - Code Analysis                  │ │
│  │   - Data Processing                │ │
│  └────────────────────────────────────┘ │
│  ┌────────────────────────────────────┐ │
│  │   Octokit GitHub Client            │ │
│  │   - Repository Management          │ │
│  │   - PR/Issue Operations            │ │
│  │   - Commit History                 │ │
│  └────────────────────────────────────┘ │
│  ┌────────────────────────────────────┐ │
│  │   MCP Protocol Layer               │ │
│  │   - Standardized Interface         │ │
│  │   - Health Monitoring              │ │
│  │   - Metadata Exposure              │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
         │
         │ HTTP/REST
         │ Port 3016
         ▼
┌─────────────────────────────────────────┐
│   Docker Container                      │
│   - Health Checks (30s interval)        │
│   - Auto-restart on failure             │
│   - Resource limits (1g memory)         │
└─────────────────────────────────────────┘
```

**Technology Stack**:
- **Runtime**: Node.js 18 Alpine
- **Framework**: Express.js with TypeScript
- **GitHub API**: Octokit REST client
- **Security**: Rate limiting, JWT (future), non-root user
- **Deployment**: Multi-stage Docker build

**Key Endpoints**:
```typescript
GET  /health                            // Health check
GET  /mcp/info                          // MCP metadata
GET  /api/github/repos                  // List repositories
GET  /api/github/repos/:owner/:repo     // Repository details
GET  /api/github/pulls/:owner/:repo     // Pull requests
GET  /api/github/issues/:owner/:repo    // Issues
GET  /api/github/commits/:owner/:repo   // Commits
POST /api/code/analyze                  // Code analysis
```

**Configuration**:
```typescript
interface Agent16Config {
  GITHUB_TOKEN: string;      // Required: GitHub PAT
  NODE_ENV: string;          // production | development
  MCP_PORT: number;          // Default: 3000
  LOG_LEVEL: string;         // debug | info | warn | error
}
```

### MCP Container Infrastructure

**Container Architecture**:
```
┌──────────────────────────────────────────────────────────┐
│                 Docker Network                           │
│              workstation-mcp-network                     │
│                                                          │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐   │
│  │ Agent 01│  │ Agent 02│  │   ...   │  │ Agent 16│   │
│  │ Port    │  │ Port    │  │         │  │ Port    │   │
│  │ 3001    │  │ 3002    │  │         │  │ 3016    │   │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘   │
│                                                          │
│                    ┌─────────────┐                      │
│                    │  Agent 20   │                      │
│                    │ Orchestrator│                      │
│                    │  Port 3020  │                      │
│                    └─────────────┘                      │
└──────────────────────────────────────────────────────────┘
```

**Health Monitoring**:
Each container includes:
- **Health Checks**: HTTP GET to `/health` every 30s
- **Timeout**: 10s per check
- **Retries**: 3 consecutive failures trigger restart
- **Start Period**: 40s grace period on startup

**Orchestration Features**:
1. **Service Discovery**: Containers discover each other via DNS
2. **Dependency Management**: Orchestrator depends on all agents
3. **Volume Persistence**: Shared data volume `workstation-mcp-data`
4. **Network Isolation**: Private bridge network

### Rollback & Recovery

**Peelback Script** (`.docker/peelback.sh`):
```bash
# Automated rollback process
1. Check prerequisites (Docker, Compose)
2. Backup current state (containers, images, env)
3. Stop unhealthy containers
4. Rollback to previous Docker images
5. Restart containers with retry logic
6. Verify health of all services
```

**Recovery Strategies**:
- **Automatic**: Health check failures trigger container restart
- **Manual**: Use peelback script for full rollback
- **Selective**: Restart individual containers via Compose

**Backup Locations**:
```
/tmp/mcp-backups/
├── containers-{timestamp}.txt
├── .env.backup-{timestamp}
└── {image-name}-{timestamp}.tar
```

### Agent Communication

**Inter-Agent Protocol**:
```typescript
interface MCPMessage {
  from: string;           // Source agent ID
  to: string;             // Target agent ID
  action: string;         // Action to perform
  payload: any;           // Action-specific data
  timestamp: string;      // ISO 8601 timestamp
  correlationId: string;  // Request tracking ID
}
```

**Message Flow**:
```
Client → Agent 16 → GitHub API
                 ↓
           Orchestrator (Agent 20)
                 ↓
           Other Agents (as needed)
```

### Deployment Configuration

**Docker Compose Structure**:
```yaml
version: '3.8'

services:
  mcp-16-data-processing:
    build: ./16-data-processing-mcp
    ports: ["3016:3000"]
    environment:
      - NODE_ENV=production
      - GITHUB_TOKEN=${GITHUB_TOKEN}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

**Environment Management**:
- **Template**: `mcp-containers/.env.example`
- **Active Config**: `mcp-containers/.env` (not committed)
- **Required Vars**: `GITHUB_TOKEN` for Agent 16
- **Optional Vars**: Slack webhooks, monitoring keys

### Security Considerations

**Container Security**:
1. **Non-root User**: Containers run as user `appuser` (UID 1001)
2. **Minimal Base**: Alpine Linux (minimal attack surface)
3. **Multi-stage Build**: Separate build and runtime environments
4. **Secret Management**: Environment variables, never in images

**Network Security**:
1. **Bridge Network**: Isolated from host network
2. **Port Mapping**: Only exposed ports accessible
3. **Rate Limiting**: API-level protection (100 req/15min)
4. **CORS**: Configured per-service

**API Security**:
1. **GitHub Token**: Personal Access Token with limited scopes
2. **Input Validation**: Request payload validation
3. **Error Handling**: No sensitive info in error messages
4. **Logging**: Audit trail without secrets

### Monitoring & Observability

**Health Metrics**:
```typescript
interface HealthResponse {
  status: 'ok' | 'degraded' | 'error';
  agent: string;
  timestamp: string;
  uptime: number;
  environment: string;
}
```

**Logging Strategy**:
- **Container Logs**: `docker-compose logs -f {service}`
- **Aggregation**: Future: ELK stack or Datadog
- **Retention**: Configurable via Docker daemon

**Metrics** (Future):
- **Request Rate**: Requests per second per agent
- **Error Rate**: Error percentage per endpoint
- **Response Time**: p50, p95, p99 latencies
- **Resource Usage**: CPU, memory, disk per container

### Development Workflow

**Local Development**:
```bash
# Start coding agent only
cd tools/coding-agent
npm install
npm run dev

# Or via Docker
docker-compose -f mcp-containers/docker-compose.mcp.yml up mcp-16-data-processing
```

**Testing**:
```bash
# Unit tests
cd tools/coding-agent
npm test

# Integration tests
curl http://localhost:3016/health
curl http://localhost:3016/api/github/repos

# Load testing (future)
# k6 run load-test.js
```

**CI/CD Integration**:
- **Build**: Multi-stage Docker build on push
- **Test**: Automated test suite in CI
- **Deploy**: Railway or manual via Compose
- **Rollback**: Automated via peelback script

### Future Enhancements

**Planned Features**:
1. **GraphQL API**: Unified query interface for all agents
2. **WebSocket Support**: Real-time updates and bidirectional communication
3. **Event Bus**: Redis-based pub/sub for agent coordination
4. **Service Mesh**: Istio or Linkerd for advanced networking
5. **Observability**: Prometheus + Grafana dashboards
6. **Auto-scaling**: Kubernetes deployment with HPA
7. **Multi-region**: Geographic distribution of agents

**Agent Roadmap**:
- **Agent 21-25**: ML/AI specialized agents
- **Agent 26-30**: Industry-specific agents (fintech, healthcare, etc.)
- **Custom Agents**: SDK for building custom agents

### References

- **MCP Specification**: [Model Context Protocol Docs](https://modelcontextprotocol.io)
- **Docker Best Practices**: [Docker Docs](https://docs.docker.com/develop/dev-best-practices/)
- **GitHub API**: [Octokit Documentation](https://octokit.github.io/rest.js/)
- **Container Security**: [OWASP Container Security](https://owasp.org/www-project-docker-top-10/)

---

**Last Updated**: November 19, 2025  
**Architecture Version**: 2.0 (MCP-enabled)
