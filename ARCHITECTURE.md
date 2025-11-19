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

## MCP Container Architecture

### Overview

Workstation includes 20 specialized MCP (Model Context Protocol) containers, each providing specific capabilities. All containers are orchestrated through Docker Compose and routed via an nginx reverse proxy.

### Container Topology

```
                    ┌─────────────────────────────────┐
                    │   Nginx Reverse Proxy (Port 80) │
                    │   Routes: /mcp-{01-20}/*        │
                    └──────────────┬──────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
      ┌─────────────▼──────────┐   ┌─────────────▼──────────┐
      │  MCP Container 01      │   │  MCP Container 16       │
      │  Selector Builder      │   │  Data Processing        │
      │  Port: 3001            │   │  Port: 3016             │
      │  Health: /health       │   │  Health: /health        │
      │                        │   │  **MANAGER AGENT**      │
      └────────────────────────┘   └─────────────────────────┘
                    │                             │
      ┌─────────────▼──────────┐   ┌─────────────▼──────────┐
      │  MCP Container 02      │   │  MCP Container 20       │
      │  Navigation Helper     │   │  Master Orchestrator    │
      │  Port: 3002            │   │  Port: 3020             │
      │  Health: /health       │   │  Health: /health        │
      └────────────────────────┘   └─────────────────────────┘
                    │
              [... Containers 03-19 ...]
```

### Network Configuration

**Network**: `workstation-mcp-network` (bridge)

**Port Mapping**:
```
Host Port 80    → Nginx Proxy → Internal routing
Host Port 3001  → MCP-01 (Selector Builder)
Host Port 3002  → MCP-02 (Navigation Helper)
...
Host Port 3016  → MCP-16 (Data Processing - Manager)
...
Host Port 3020  → MCP-20 (Master Orchestrator)
```

**Internal DNS**:
- Each container is accessible via hostname: `mcp-{number}-{name}`
- Example: `mcp-16-data`, `mcp-01-selector`

### Container Specifications

| Container | Name | Port | Role | Health Check |
|-----------|------|------|------|--------------|
| MCP-01 | Selector Builder | 3001 | CSS selector generation | `/health` |
| MCP-02 | Navigation Helper | 3002 | Browser navigation | `/health` |
| MCP-03 | Database Orchestration | 3003 | Database operations | `/health` |
| MCP-04 | Integration Specialist | 3004 | Slack/webhook integration | `/health` |
| MCP-05 | Workflow Orchestrator | 3005 | Workflow management | `/health` |
| MCP-06 | Project Builder | 3006 | Project scaffolding | `/health` |
| MCP-07 | Code Quality | 3007 | Linting and quality checks | `/health` |
| MCP-08 | Performance Monitor | 3008 | Performance analysis | `/health` |
| MCP-09 | Error Tracker | 3009 | Error monitoring | `/health` |
| MCP-10 | Security Scanner | 3010 | Security auditing | `/health` |
| MCP-11 | Accessibility Checker | 3011 | A11y validation | `/health` |
| MCP-12 | Integration Hub | 3012 | API integration | `/health` |
| MCP-13 | Docs Auditor | 3013 | Documentation checks | `/health` |
| MCP-14 | Advanced Automation | 3014 | Complex automation | `/health` |
| MCP-15 | API Integrator | 3015 | External API integration | `/health` |
| **MCP-16** | **Data Processing** | **3016** | **Container Manager** | `/health` |
| MCP-17 | Learning Platform | 3017 | Educational content | `/health` |
| MCP-18 | Community Hub | 3018 | Community features | `/health` |
| MCP-19 | Deployment Manager | 3019 | Deployment automation | `/health` |
| MCP-20 | Master Orchestrator | 3020 | Cross-container coordination | `/health` |

### Agent-16: MCP Container Manager

**Assignment**: Agent-16 (Data Processing MCP) is designated as the **MCP Container Manager**.

**Responsibilities**:
1. **Container Health Monitoring**
   - Periodic health checks for all 20 containers
   - Alert on container failures
   - Auto-restart unhealthy containers

2. **Peelback Operations**
   - Execute container rollbacks
   - Verify image tags before deployment
   - Log all peelback operations

3. **Inter-Container Communication**
   - Route requests between containers
   - Maintain service registry
   - Handle container discovery

4. **Status Reporting**
   - Aggregate container metrics
   - Provide unified status API
   - Generate health reports

**API Endpoints** (Port 3016):
```
GET  /api/containers/status              - Get all container statuses
GET  /api/containers/:name/health        - Check specific container
POST /api/containers/peelback            - Trigger rollback
GET  /api/containers/peelback/status/:id - Check peelback status
POST /api/github/push-branch             - Push branch to GitHub
POST /api/github/sync                    - Sync with GitHub
```

**Configuration**:
```bash
# Environment variables for Agent-16
MCP_MANAGER_AGENT=agent-16
MCP_CONTAINER_COUNT=20
MCP_PORT_OFFSET=3000
MCP_NETWORK=workstation-mcp-network
```

### Nginx Proxy Configuration

**File**: `.docker/nginx.conf`

**Routing Rules**:
```nginx
# Route to MCP containers
location /mcp-01/ {
    proxy_pass http://mcp-01-selector:3000/;
}

location /mcp-16/ {
    proxy_pass http://mcp-16-data:3000/;
}

# Route to manager API
location /api/containers/ {
    proxy_pass http://mcp-16-data:3000/api/containers/;
}

# Health check endpoint
location /health {
    access_log off;
    return 200 "healthy\n";
    add_header Content-Type text/plain;
}
```

**Load Balancing** (Future):
```nginx
upstream mcp_containers {
    least_conn;
    server mcp-01-selector:3000;
    server mcp-02-navigation:3000;
    # ... other containers
}
```

### Volume Mounts

**Logs**:
```yaml
volumes:
  - ./logs/mcp-01:/app/logs           # Container logs
  - ./logs/mcp-16:/app/logs           # Manager logs
  - ./logs/nginx:/var/log/nginx       # Proxy logs
```

**Configurations**:
```yaml
volumes:
  - ./mcp-containers/.env:/app/.env:ro              # Environment config
  - ./.docker/nginx.conf:/etc/nginx/nginx.conf:ro   # Nginx config
```

**Persistent Data**:
```yaml
volumes:
  - mcp_data:/app/data                # Persistent storage
  - mcp_cache:/app/cache              # Cache storage
```

### Health Checks

**Container Health Check**:
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

**Health Check Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-11-19T12:00:00Z",
  "uptime": 3600,
  "container": "mcp-16-data",
  "version": "1.0.0"
}
```

### Container Lifecycle

**Startup Sequence**:
1. Base containers (MCP-01 to MCP-19) start in parallel
2. MCP-20 (Master Orchestrator) waits for all base containers
3. Nginx proxy starts last, after all containers are healthy
4. Agent-16 performs initial health sweep

**Restart Policy**:
```yaml
restart: unless-stopped
```

**Graceful Shutdown**:
```bash
docker-compose -f docker-compose.mcp.yml down --timeout 30
```

### Peelback Architecture

**Peelback Script**: `.docker/peelback.sh`

**Workflow**:
```
User/Agent-16 Trigger
       ↓
Validate Container Name
       ↓
Stop Target Container
       ↓
Pull Previous Image Tag
       ↓
Start Container (Old Image)
       ↓
Verify Health Check
       ↓
Log Peelback Event
       ↓
Return Status
```

**Safety Checks**:
1. Verify container exists
2. Verify image tag exists
3. Backup current state
4. Health check verification
5. Rollback on failure

### Runbook

#### Starting MCP Ecosystem

```bash
# 1. Configure environment
cd /home/runner/work/workstation/workstation
cp mcp-containers/.env.example mcp-containers/.env

# 2. Start all containers
docker-compose -f docker-compose.mcp.yml up -d

# 3. Verify all containers started
docker-compose -f docker-compose.mcp.yml ps

# 4. Check health via Agent-16
curl http://localhost:3016/api/containers/status

# 5. Verify nginx routing
curl http://localhost/health
```

#### Troubleshooting Container

```bash
# 1. Check container logs
docker-compose -f docker-compose.mcp.yml logs mcp-16-data

# 2. Check container health
curl http://localhost:3016/health

# 3. Restart container
docker-compose -f docker-compose.mcp.yml restart mcp-16-data

# 4. If persistent issues, peelback
./.docker/peelback.sh mcp-16-data v1.0.0
```

#### Rolling Out Updates

```bash
# 1. Build new image
docker build -t mcp-16-data:v1.1.0 mcp-containers/16-data-processing-mcp/

# 2. Tag as latest
docker tag mcp-16-data:v1.1.0 mcp-16-data:latest

# 3. Restart container (pulls new image)
docker-compose -f docker-compose.mcp.yml up -d mcp-16-data

# 4. Verify health
curl http://localhost:3016/health

# 5. If issues, peelback to v1.0.0
./.docker/peelback.sh mcp-16-data v1.0.0
```

### Monitoring & Logging

**Log Aggregation**:
```bash
# All MCP container logs
tail -f logs/mcp-*/app.log

# Nginx access logs
tail -f logs/nginx/access.log

# Agent-16 manager logs
tail -f logs/mcp-16/manager.log
```

**Metrics Collection** (Future):
- Prometheus integration
- Grafana dashboards
- Alert manager rules

### Security Considerations

1. **Network Isolation**: All containers on isolated bridge network
2. **Read-Only Configs**: Configuration files mounted read-only
3. **Non-Root User**: Containers run as non-root user
4. **Health Checks**: Automatic container restart on failure
5. **Secrets Management**: Environment variables, not in code

### Diagram: Complete System Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                         Workstation Platform                   │
├───────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────────────┐        ┌──────────────────────┐    │
│  │  Main Application    │        │  MCP Ecosystem       │    │
│  │  (Port 3000)         │        │  (Ports 3001-3020)   │    │
│  │                      │        │                      │    │
│  │  - JWT Auth          │        │  - 20 MCP Containers │    │
│  │  - Workflow Engine   │        │  - Nginx Proxy       │    │
│  │  - Browser Automation│        │  - Agent-16 Manager  │    │
│  │  - REST API          │◄───────┤  - Container Health  │    │
│  │  - Database (SQLite) │        │  - Peelback Support  │    │
│  └──────────────────────┘        └──────────────────────┘    │
│           │                                  │                │
│           │                                  │                │
│           ▼                                  ▼                │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              Docker Network (Bridge)                     │ │
│  │   workstation-main-network | workstation-mcp-network    │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                                │
└───────────────────────────────────────────────────────────────┘
```

## Resources

- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Railway Docs](https://docs.railway.app/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Nginx Reverse Proxy Guide](https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/)
