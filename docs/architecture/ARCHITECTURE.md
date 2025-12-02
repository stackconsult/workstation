# Architecture Documentation

## Overview

**Workstation** is a production-scale browser automation and workflow orchestration platform with **167,682 lines** of TypeScript/JavaScript code across a comprehensive microservices architecture. Built with enterprise-grade security, multi-tenant workspaces, and AI integration.

## Technology Stack

### Core Runtime & Framework
- **Node.js** (v18+): JavaScript runtime
- **Express.js** (v4.18+): Web application framework
- **TypeScript** (v5.3+): Type-safe development with strict mode
- **Playwright** (v1.40+): Browser automation engine

### Authentication & Security
- **Passport.js**: Multi-provider authentication (Local, Google OAuth, GitHub OAuth)
- **jsonwebtoken** (v9.0+): JWT token generation and verification
- **express-rate-limit** (v8.2+): Rate limiting middleware
- **express-session**: Session management with secure cookies
- **AES-256-GCM**: Token encryption for sensitive data
- **CORS**: Cross-Origin Resource Sharing support
- **Helmet**: Security headers

### Data & Storage
- **SQLite**: Development database
- **PostgreSQL**: Production database with multi-tenant support
- **Redis**: Distributed rate limiting and caching
- **Database migrations**: Version-controlled schema management

### Integration & Communication
- **@slack/bolt** (v4.6+): Slack integration with OAuth
- **Socket.io** (v4.6+): Real-time WebSocket communication
- **MCP Protocol**: Model Context Protocol for AI agent integration
- **Nodemailer**: Email service (SMTP)

### UI & Visualization
- **EJS** (v3.1+): Server-side templating
- **Tailwind CSS** (v3.0+): Utility-first CSS framework
- **Chart.js** (v4.4+): Data visualization
- **Responsive Design**: Mobile, tablet, desktop support

### Development & Quality
- **Jest** (v29.7+): Testing framework (1,037 tests)
- **ESLint** (v8.0+): Code quality enforcement
- **ts-node**: TypeScript execution for development
- **Docker**: Containerization (multi-platform)
- **Kubernetes**: Production orchestration

## Project Structure

```
workstation/
├── src/                           # Core Platform (36,746 LOC, 129 files)
│   ├── auth/                      # Authentication (Passport.js, JWT, OAuth)
│   │   ├── jwt.ts                # JWT token management
│   │   └── passport.ts           # Passport strategies (Local, Google, GitHub)
│   ├── routes/                    # API Routes (16 files)
│   │   ├── auth.ts               # Authentication endpoints
│   │   ├── workspaces.ts         # Workspace management
│   │   ├── slack.ts              # Slack integration
│   │   ├── automation.ts         # Workflow automation
│   │   ├── mcp.ts                # MCP protocol endpoints
│   │   ├── dashboard.ts          # Dashboard API
│   │   └── ...                   # Additional routes
│   ├── services/                  # Business Logic (23 files)
│   │   ├── slack.ts              # Slack service layer
│   │   ├── email.ts              # Email service
│   │   ├── mcp-websocket.ts      # WebSocket server
│   │   ├── workflow-websocket.ts # Workflow updates
│   │   ├── redis.ts              # Redis integration
│   │   └── ...                   # Additional services
│   ├── automation/                # Workflow Engine
│   │   ├── orchestrator/         # Workflow orchestration
│   │   ├── agents/               # Browser agents
│   │   └── db/                   # Database layer
│   ├── utils/                     # Utilities
│   │   ├── error-handler.ts      # Comprehensive error handling
│   │   ├── health-check.ts       # K8s health probes
│   │   └── validation.ts         # Input validation
│   ├── db/                        # Database
│   │   ├── migrations/           # SQL migrations
│   │   └── schema.sql            # Database schema
│   └── scripts/                   # Automation scripts
│       └── initialize-workspaces.ts
├── chrome-extension/              # Browser Extension (11,829 LOC, 28 files)
│   ├── manifest.json             # Chrome extension manifest
│   ├── background.js             # Service worker
│   ├── content.js                # Content script
│   ├── popup/                    # Extension popup UI
│   ├── playwright/               # Playwright integration
│   │   ├── self-healing.js       # Self-healing selectors
│   │   ├── retry.js              # Retry logic
│   │   └── ...                   # Additional features
│   └── lib/                      # Extension libraries
├── agents/                        # Automation Agents (9,207 LOC, 40 files)
│   ├── agent1-6/                 # Build setup agents
│   ├── agent7/                   # Security & penetration testing
│   ├── agent8-12/                # Quality & analytics agents
│   ├── repo-update-agent/        # Documentation sync
│   ├── wikibrarian/              # Wiki management
│   └── ...                       # Additional agents
├── mcp-containers/                # MCP Microservices (4,154 LOC, 21 files)
│   ├── mcp-16-data/              # Data processing
│   ├── github-private-backup-mcp/ # GitHub backup
│   └── ...                       # Additional containers
├── tools/                         # Build Tools (627 LOC)
│   └── coding-agent/             # Git operations
├── public/                        # Web UI (1,491 LOC, 4 files)
│   ├── dashboard.html            # Main dashboard
│   ├── workflow-builder.html    # Visual workflow builder
│   └── css/                      # Stylesheets
├── tests/                         # Test Suites (2,742 LOC, 44 files)
│   ├── agents/                   # Agent tests
│   ├── integration/              # Integration tests
│   └── ...                       # Additional tests
├── docs/                          # Documentation (171 files)
│   ├── architecture/             # Architecture docs
│   ├── guides/                   # User guides
│   └── api/                      # API documentation
├── k8s/                           # Kubernetes manifests
├── .github/                       # GitHub Actions (22 workflows)
├── dist/                          # Compiled output (generated)
├── node_modules/                 # Dependencies (generated)
├── .env.example                  # Environment template
├── package.json                  # Dependencies & scripts
├── tsconfig.json                 # TypeScript config
└── Dockerfile                    # Container definition
```

## Architecture Layers

### 1. Application Layer (`src/index.ts`)

The main Express application that:
- Configures middleware (CORS, JSON parsing, rate limiting, sessions)
- Defines API routes (16 route files)
- Handles HTTP requests and responses
- Manages server lifecycle
- Initializes WebSocket servers

**Key Components**:
- Express app initialization
- Middleware stack configuration
- Route registration (authentication, automation, workspaces, Slack, MCP)
- WebSocket server setup
- Health check endpoints

### 2. Authentication Layer (`src/auth/`)

Multi-provider authentication with Passport.js:
- **Local Strategy**: Email/password with bcrypt
- **Google OAuth 2.0**: Social login
- **GitHub OAuth**: Developer authentication
- **JWT Tokens**: Stateless authentication
- **Session Management**: Express-session with secure cookies
- **Password Reset**: Email verification with expiring tokens
- **OAuth Linking**: Automatic account linking across providers

**Key Functions**:
- `generateToken(payload)`: Create signed JWT tokens
- `verifyToken(token)`: Validate and decode tokens
- `authenticateToken`: Express middleware for route protection
- Passport strategies: `LocalStrategy`, `GoogleStrategy`, `GitHubStrategy`

### 3. Workspace Layer (`src/routes/workspaces.ts`)

Multi-tenant workspace management:
- **20 Pre-configured Workspaces**: workspace-alpha through workspace-upsilon
- **Two-stage Authentication**: Generic login → email/password activation
- **RBAC**: Owner, Admin, Member, Viewer roles
- **Member Management**: Invitation system with expiring tokens
- **Data Isolation**: PostgreSQL-based tenant separation

**Database Tables**:
- `workspaces`: Workspace metadata
- `workspace_members`: RBAC membership
- `workspace_invitations`: Invitation tokens
- `oauth_accounts`: OAuth provider linking
- `password_reset_tokens`: Reset flow tokens

### 4. Integration Layer

#### Slack Integration (`src/services/slack.ts`)
- OAuth installation flow with state validation
- Slash commands: `/workflow`, `/workspace`, `/agent`
- Interactive components: buttons, modals, select menus
- Event listeners: app mentions, help messages
- Block Kit rich formatting

#### MCP Protocol (`src/services/mcp-protocol.ts`)
- Model Context Protocol for AI agents
- 28 browser automation handlers
- Real-time bidirectional communication
- GitHub Copilot integration

#### WebSocket Communication (`src/services/mcp-websocket.ts`)
- Real-time workflow execution updates
- JWT authentication on connections
- Per-user rate limiting
- Channel-based pub/sub messaging

### 5. Security Layer

Implemented across the application:
- **Rate Limiting**: 100 req/15min global, 10 auth req/15min
- **JWT Authentication**: HS256/384/512 algorithms
- **Token Encryption**: AES-256-GCM for OAuth tokens
- **Password Hashing**: bcrypt for user passwords, SHA-256 for reset tokens
- **CSRF Protection**: sameSite: 'lax' cookies
- **Security Headers**: Helmet integration (CSP, HSTS, XSS)
- **Input Validation**: Joi schemas for all inputs
- **Type Safety**: TypeScript strict mode

### 6. Workflow Engine (`src/automation/`)

Browser automation and orchestration:
- **Playwright Integration**: Chromium automation
- **Task Orchestration**: Multi-step workflow execution
- **Retry Logic**: Exponential backoff
- **Error Handling**: Comprehensive error recovery
- **Database Storage**: SQLite (dev) / PostgreSQL (prod)
- **Variable Substitution**: Dynamic parameter injection

### 7. Microservices Architecture

#### MCP Containers (21 containers)
- **Agent 16**: Data processing & container management
- **GitHub Backup**: Immutable private repo backup
- **Additional Containers**: Specialized microservices

#### Automation Agents (40 agents)
- **Browser Agent**: Core Playwright automation
- **Data Agents**: CSV, JSON, Excel, PDF processing
- **Integration Agents**: Email, Sheets, Calendar
- **Security Agent**: CVE scanning, TypeScript error detection
- **Documentation Agents**: Wiki management, repo updates

## Data Flow

### Authentication Flow (Passport.js)

```
Client Request
    ↓
POST /api/auth/google (or /github, /passport/login)
    ↓
Passport Strategy Authentication
    ↓
OAuth Provider Verification (for OAuth) OR Local Verification (for Local)
    ↓
Create/Link User Account
    ↓
Generate JWT Token
    ↓
Create Session (express-session)
    ↓
Return Token + User Data
    ↓
Client stores token
    ↓
Subsequent requests include JWT in Authorization header
    ↓
authenticateToken middleware verifies JWT
    ↓
Request proceeds to protected route
```

### Workspace Flow

```
User Registration
    ↓
POST /api/workspaces/workspace-alpha/login (generic credentials)
    ↓
Verify Generic Username/Password
    ↓
Return Temporary Token
    ↓
POST /api/workspaces/workspace-alpha/activate
    ↓
Verify Generic Credentials + New Email/Password
    ↓
Update Workspace with User Email/Password
    ↓
Set is_activated = true
    ↓
Return Permanent JWT Token
    ↓
User can now access workspace with personal credentials
```

### Workflow Execution Flow

```
Client Request
    ↓
POST /api/v2/workflows (with workflow definition)
    ↓
authenticateToken middleware
    ↓
Validate workflow schema
    ↓
Store workflow in database
    ↓
Return workflow ID
    ↓
POST /api/v2/workflows/:id/execute
    ↓
Load workflow from database
    ↓
Initialize Playwright browser
    ↓
Execute tasks sequentially
    ↓
For each task:
    - Parse action (navigate, click, type, extract, etc.)
    - Execute with retry logic
    - Update task status
    - Emit WebSocket update
    ↓
Close browser
    ↓
Mark workflow complete
    ↓
Emit final WebSocket update
    ↓
Return execution results
```

## Deployment Architecture

### Development
```
Local Machine
    ↓
npm run dev (ts-node)
    ↓
Express Server (localhost:3000)
    ↓
SQLite Database (data/workflows.db)
    ↓
Playwright Browsers (local)
```

### Production (Railway/Kubernetes)
```
Load Balancer
    ↓
Express Server (containerized)
    ↓
PostgreSQL Database (managed)
    ↓
Redis (distributed rate limiting)
    ↓
Playwright Browsers (containerized)
    ↓
Health Checks (/health/live, /health/ready)
    ↓
Metrics & Monitoring
```

### Docker Containerization
```dockerfile
# Multi-platform support (amd64, arm64)
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
RUN npx playwright install chromium --with-deps
COPY dist/ ./dist/
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

## Scalability Considerations

### Horizontal Scaling
- Stateless application design (JWT, no server sessions)
- Redis for distributed rate limiting
- PostgreSQL connection pooling
- Load balancer distribution

### Performance Optimization
- Browser page pooling (reuse Playwright pages)
- Parallel workflow execution
- Caching with Redis
- Database query optimization
- Gzip compression

### Monitoring & Observability
- Health check endpoints for Kubernetes
- Prometheus metrics integration
- Structured logging (Winston)
- Error tracking
- Performance monitoring

## Security Best Practices

### Environment Variables
All sensitive data in environment variables:
- `JWT_SECRET`: JWT signing key (required)
- `SESSION_SECRET`: Session signing key (required)
- `ENCRYPTION_KEY`: AES-256-GCM encryption key (required)
- `DATABASE_URL`: PostgreSQL connection (production)
- `REDIS_URL`: Redis connection (production)
- OAuth credentials (GOOGLE_CLIENT_SECRET, GITHUB_CLIENT_SECRET)
- SMTP credentials (SMTP_USER, SMTP_PASS)
- Slack credentials (SLACK_CLIENT_SECRET, SLACK_SIGNING_SECRET)

### Secure Defaults
- HTTPS only in production
- Secure cookies (httpOnly, sameSite: 'lax')
- Rate limiting on all endpoints
- Input validation on all user data
- SQL injection prevention (parameterized queries)
- XSS prevention (input sanitization)
- CSRF protection (sameSite cookies)

## API Endpoints Summary

### Authentication (7 endpoints)
- `POST /api/auth/password-reset/request`
- `POST /api/auth/password-reset/confirm`
- `GET /api/auth/google` & `/api/auth/google/callback`
- `GET /api/auth/github` & `/api/auth/github/callback`
- `POST /api/auth/passport/login`

### Workspaces (6+ endpoints)
- `GET /api/workspaces`
- `POST /api/workspaces/:slug/login`
- `POST /api/workspaces/:slug/activate`
- `GET /api/workspaces/:slug/members`
- Additional member management endpoints

### Slack (5 endpoints)
- `GET /api/slack/oauth/install`
- `GET /api/slack/oauth/callback`
- `POST /api/slack/commands`
- `POST /api/slack/interactions`
- `POST /api/slack/events`

### Automation (7+ endpoints)
- `POST /api/v2/workflows` - Create workflow
- `GET /api/v2/workflows/:id` - Get workflow
- `POST /api/v2/workflows/:id/execute` - Execute workflow
- `GET /api/v2/workflows/:id/status` - Get status
- Additional workflow management endpoints

### MCP Protocol (28 handlers)
- Browser automation handlers
- Real-time communication
- AI agent integration

### Health & Monitoring
- `GET /health/live` - Liveness probe
- `GET /health/ready` - Readiness probe
- `GET /metrics` - Prometheus metrics

## Technology Decisions

### Why TypeScript?
- Type safety prevents runtime errors
- Better IDE support and autocomplete
- Easier refactoring
- Self-documenting code
- Strict mode enforces quality

### Why Express.js?
- Mature, well-documented framework
- Large ecosystem of middleware
- Simple, unopinionated design
- Easy to extend and customize

### Why Playwright?
- Modern browser automation
- Multi-browser support
- Built-in waiting mechanisms
- Network interception
- Screenshot and video recording

### Why JWT?
- Stateless authentication
- Scales horizontally
- Works across domains
- Industry standard
- Easy to implement

### Why Passport.js?
- 500+ authentication strategies
- Well-maintained and tested
- Easy OAuth integration
- Flexible and extensible

### Why Multi-tenant Workspaces?
- B2B SaaS model
- Data isolation
- Team collaboration
- RBAC support
- Scalable revenue model

## Future Enhancements

See [ROADMAP.md](ROADMAP.md) for detailed future plans.

## Related Documentation

- [API Documentation](../api/API.md)
- [Deployment Guide](../guides/DEPLOYMENT.md)
- [Security Guide](../guides/SECURITY.md)
- [Contributing Guide](../guides/CONTRIBUTING.md)
- [MCP Protocol](../MCP_PROTOCOL.md)
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
- Console logging for development

### Future Enhancements
- Structured logging (Winston, Pino)
- Request/response logging
- Error tracking (Sentry)
- Performance metrics (Prometheus)
- Distributed tracing (OpenTelemetry)

## Extension Points

The architecture supports future extensions:

1. **Database Layer**: Add database connection for persistence
2. **WebSocket Support**: Real-time communication
3. **OAuth Integration**: Social login providers
4. **Browser Automation**: Puppeteer/Playwright integration
5. **Message Queue**: Async task processing
6. **Caching Layer**: Redis for performance
7. **API Gateway**: Kong, Traefik for advanced routing

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
- Manual test script (`test.sh`)
- 7 test cases covering core functionality
- cURL-based API testing

### Future Testing
- Unit tests (Jest, Vitest)
- Integration tests (Supertest)
- End-to-end tests (Playwright)
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
