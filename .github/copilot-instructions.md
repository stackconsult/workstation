# GitHub Copilot Instructions for stackBrowserAgent

## Project Overview

stackBrowserAgent is a lightweight, secure JWT-based authentication service built with Express.js and TypeScript. It provides a foundation for browser automation agents with enterprise-grade security features including rate limiting and JWT authentication.

**MCP Integration**: This repository implements the Model Context Protocol (MCP) for seamless integration with GitHub Copilot and AI agents. The MCP server provides standardized access to browser automation capabilities through natural language.

**Key Technologies:**
- Node.js v18+ runtime
- Express.js v4.18+ web framework
- TypeScript v5.3+ for type safety
- JWT (jsonwebtoken) for authentication
- express-rate-limit for security
- Model Context Protocol (MCP) for AI integration

## Repository Structure

```
src/
├── auth/           # Authentication module
│   └── jwt.ts     # JWT token generation and verification
└── index.ts       # Main Express application entry point
```

**Important Directories:**
- `src/` - All TypeScript source code
- `src/routes/` - API route handlers (including MCP endpoints)
- `dist/` - Compiled JavaScript output (generated, not tracked)
- `node_modules/` - Dependencies (generated, not tracked)
- `.mcp/` - Model Context Protocol documentation and specifications

## Development Guidelines

### Before Making Changes

1. **Install dependencies:** `npm install`
2. **Verify current state:** Run `npm run lint && npm run build` to ensure everything works
3. **Check existing tests:** Review `test.sh` to understand test coverage

### Making Changes

1. **Write TypeScript:** All code must be in TypeScript, not JavaScript
2. **Follow existing patterns:** Match the coding style in existing files
3. **Use strict typing:** Leverage TypeScript's strict mode (already enabled)
4. **Keep it minimal:** Make the smallest possible changes to achieve the goal

### Testing Requirements

1. **Lint your code:** Run `npm run lint` before committing
2. **Build successfully:** Run `npm run build` to ensure TypeScript compiles
3. **Test manually:** Use `test.sh` for integration testing (requires built code)
4. **No unit tests yet:** The project uses `test.sh` for testing, not Jest/Mocha

### Build Process

```bash
# Development (uses ts-node, no compilation)
npm run dev

# Linting (ESLint with TypeScript rules)
npm run lint

# Build (TypeScript compilation to dist/)
npm run build

# Production (runs compiled code)
npm start
```

**Important:** Always run `npm run lint && npm run build` before finalizing changes.

## Code Standards

### TypeScript Standards

- **Strict mode enabled:** All TypeScript strict checks are enforced
- **Explicit types:** Define types for function parameters and return values
- **Interfaces:** Use interfaces for object structures (see `JWTPayload` in `jwt.ts`)
- **Type imports:** Use `import type` for type-only imports when possible
- **Error handling:** Properly type catch blocks and error responses

### Express.js Patterns

- **Middleware:** Use Express middleware pattern for reusable logic
- **Request handlers:** Follow Express `(req, res, next)` signature
- **Error responses:** Return JSON with consistent structure: `{ error: 'message' }`
- **Success responses:** Return JSON with consistent structure: `{ message, data }`
- **Status codes:** Use appropriate HTTP status codes (401, 403, 200, etc.)

### Security Requirements

1. **Never commit secrets:** Use environment variables via `.env` file
2. **Rate limiting:** All endpoints should respect existing rate limiters
3. **Input validation:** Validate all user inputs before processing
4. **JWT security:** Use existing JWT verification middleware for protected routes
5. **Type safety:** Leverage TypeScript to prevent security issues

### Environment Variables

Required variables (see `.env.example`):
- `JWT_SECRET` - Secret key for JWT signing (critical for security)
- `JWT_EXPIRATION` - Token expiration time (default: "24h")
- `PORT` - Server port (default: 3000)

## Common Tasks

### Adding a New API Endpoint

1. Add route definition in `src/index.ts`
2. Use existing rate limiters (`limiter` or `authLimiter`)
3. For protected routes, use `authenticateToken` middleware
4. Return consistent JSON responses
5. Update `API.md` documentation if public-facing

Example:
```typescript
app.get('/api/new-endpoint', authenticateToken, (req, res) => {
  res.json({ message: 'Success', data: { /* ... */ } });
});
```

### Modifying Authentication

- JWT logic is in `src/auth/jwt.ts`
- Three main exports: `generateToken`, `verifyToken`, `authenticateToken`
- Always maintain backward compatibility with existing tokens
- Test thoroughly with `test.sh`

### Updating Dependencies

1. Update `package.json`
2. Run `npm install`
3. Test with `npm run lint && npm run build`
4. Verify `test.sh` still passes
5. Document in `CHANGELOG.md`

## Documentation Requirements

When making changes, update relevant documentation:

- **API.md** - For API endpoint changes
- **ARCHITECTURE.md** - For architectural changes
- **README.md** - For user-facing feature changes
- **CHANGELOG.md** - For all changes (follow existing format)
- **CONTRIBUTING.md** - For development process changes

## Deployment Considerations

### Railway Deployment
- Configuration in `railway.json`
- Automatically builds with `npm run build`
- Environment variables set in Railway dashboard
- No deployment scripts needed

### Docker Deployment
- `Dockerfile` defines container build
- Multi-stage build not used (simple single-stage)
- `.dockerignore` prevents unnecessary files in image

## Known Limitations

1. **No automated tests:** Currently uses `test.sh` (bash script), no Jest/Mocha
2. **In-memory rate limiting:** Not suitable for multi-instance deployments
3. **No database:** User data stored in JWT tokens only
4. **No token revocation:** Tokens valid until expiration
5. **No refresh tokens:** Tokens must be regenerated after expiration

## Don't Do This

❌ **Don't add testing frameworks** unless specifically requested (project uses `test.sh`)
❌ **Don't modify rate limiter without security review** (could introduce vulnerabilities)
❌ **Don't change TypeScript configuration** without understanding impact
❌ **Don't add runtime dependencies lightly** (keep project lightweight)
❌ **Don't remove or weaken security features**
❌ **Don't commit `.env` files** (use `.env.example` as template)

## Questions to Ask

When implementing features, consider:

1. **Security:** Does this introduce any security vulnerabilities?
2. **Breaking changes:** Will existing API consumers be affected?
3. **Type safety:** Are all types properly defined?
4. **Documentation:** What documentation needs updating?
5. **Testing:** How can this be tested with `test.sh`?
6. **Deployment:** Does this affect Railway/Docker deployment?

## Getting Help

- **Issue tracker:** Use GitHub Issues for bugs and features
- **Architecture docs:** See `ARCHITECTURE.md` for system design
- **API docs:** See `API.md` for endpoint specifications
- **Contributing guide:** See `CONTRIBUTING.md` for contribution process

## Examples of Good Contributions

✅ Adding new authenticated endpoint with proper middleware
✅ Improving error handling with better type safety
✅ Enhancing rate limiting configuration
✅ Adding input validation for existing endpoints
✅ Improving TypeScript types and interfaces
✅ Updating documentation to match code changes

## Quick Reference

**Lint:** `npm run lint`  
**Build:** `npm run build`  
**Dev:** `npm run dev`  
**Test:** Build first, then `./test.sh`  
**Production:** `npm start` (requires `npm run build` first)

**Main files:**
- `src/index.ts` - Express app and routes
- `src/auth/jwt.ts` - JWT authentication
- `src/routes/mcp.ts` - MCP endpoints for GitHub Copilot
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `.eslintrc.json` - Linting rules
- `server.json` - MCP server specification

**MCP Documentation:**
- `.mcp/README.md` - MCP documentation index
- `.mcp/guides/PUBLISHING.md` - How to publish MCP servers
- `.mcp/guides/API_USAGE.md` - How to consume MCP APIs
- `.mcp/specs/API_SPEC.md` - Complete API reference
