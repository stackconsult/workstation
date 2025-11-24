# Issue #181 - Tasks

## Task 1: Implement User Authentication
- [ ] Implement user authentication.

> ### 🤖 Long-Form Code Agent Instructions for Task 1: User Authentication
> 
> #### Overview
> Implement a comprehensive, production-ready user authentication system using JWT (JSON Web Tokens) that aligns with the existing workstation repository architecture and security standards.
> 
> #### Prerequisites
> - Familiarity with JWT authentication flow (HS256/HS384/HS512 algorithms)
> - Understanding of Express.js middleware patterns
> - Knowledge of TypeScript strict mode
> - Security best practices (OWASP guidelines)
> 
> #### Step-by-Step Implementation Guide
> 
> **Step 1: Review Existing Authentication Infrastructure**
> ```bash
> # Examine current JWT implementation
> cat src/auth/jwt.ts
> 
> # Check middleware configuration
> cat src/middleware/auth.ts
> 
> # Review environment configuration
> cat .env.example
> ```
> 
> **Action Items:**
> - Verify JWT_SECRET is properly configured (minimum 32 characters)
> - Review existing `generateToken()`, `verifyToken()`, and `authenticateToken()` functions
> - Identify any security gaps or missing validation
> - Check rate limiting configuration in `src/index.ts`
> 
> **Step 2: Security Compliance Assessment**
> 
> Ensure the implementation meets these security requirements:
> 
> | Security Requirement | Implementation Check | Location |
> |---------------------|---------------------|----------|
> | JWT Secret Validation | Must be 32+ chars, not default | `.env`, `src/auth/jwt.ts` |
> | Algorithm Support | HS256/HS384/HS512 only | `src/auth/jwt.ts` |
> | Token Expiration | Default: 24h, configurable | `JWT_EXPIRATION` env var |
> | Rate Limiting | Auth: 10 req/15min, API: 100 req/15min | `src/index.ts` |
> | CORS Protection | Whitelisted origins only | `src/index.ts` |
> | Password Hashing | bcrypt with salt rounds ≥ 10 | `src/auth/password.ts` (if applicable) |
> | HTTPS Only | Secure cookies, HSTS headers | Helmet middleware |
> 
> **Step 3: Implement OAuth2 Support (Optional Enhancement)**
> 
> If OAuth2 is required in addition to JWT:
> 
> ```typescript
> // src/auth/oauth.ts (NEW FILE)
> import { Request, Response, NextFunction } from 'express';
> import { oauth2Client } from './oauth-config';
> 
> export interface OAuth2Config {
>   clientId: string;
>   clientSecret: string;
>   redirectUri: string;
>   scopes: string[];
> }
> 
> export const initiateOAuth2Flow = async (req: Request, res: Response) => {
>   // Implementation details
> };
> 
> export const handleOAuth2Callback = async (req: Request, res: Response) => {
>   // Implementation details
> };
> ```
> 
> **Step 4: Enhance JWT Implementation**
> 
> Add these improvements to `src/auth/jwt.ts`:
> 
> ```typescript
> // Add token refresh capability
> export const refreshToken = async (oldToken: string): Promise<string> => {
>   const decoded = verifyToken(oldToken);
>   if (!decoded) throw new Error('Invalid token');
>   
>   // Generate new token with extended expiration
>   return generateToken({
>     userId: decoded.userId,
>     email: decoded.email
>   });
> };
> 
> // Add token blacklist support (for logout)
> const tokenBlacklist = new Set<string>();
> 
> export const revokeToken = (token: string): void => {
>   tokenBlacklist.add(token);
> };
> 
> export const isTokenRevoked = (token: string): boolean => {
>   return tokenBlacklist.has(token);
> };
> ```
> 
> **Step 5: Create Comprehensive Test Suite**
> 
> Create `tests/auth/authentication.test.ts`:
> 
> ```typescript
> import { generateToken, verifyToken, authenticateToken } from '../../src/auth/jwt';
> import request from 'supertest';
> import app from '../../src/index';
> 
> describe('Authentication System', () => {
>   describe('JWT Token Generation', () => {
>     it('should generate valid JWT token', () => {
>       // Test implementation
>     });
>     
>     it('should reject tokens with invalid signature', () => {
>       // Test implementation
>     });
>     
>     it('should enforce token expiration', () => {
>       // Test implementation
>     });
>   });
>   
>   describe('Rate Limiting', () => {
>     it('should block after 10 failed auth attempts in 15 minutes', async () => {
>       // Test implementation
>     });
>   });
>   
>   describe('OAuth2 Flow', () => {
>     it('should redirect to OAuth2 provider', async () => {
>       // Test implementation
>     });
>     
>     it('should handle callback and exchange code for token', async () => {
>       // Test implementation
>     });
>   });
> });
> ```
> 
> **Test Coverage Requirements:**
> - Minimum 95% coverage for `src/auth/` directory
> - All edge cases covered (expired tokens, invalid signatures, missing headers)
> - Security scenarios tested (token tampering, replay attacks)
> 
> **Step 6: Update API Documentation**
> 
> Update `API.md` with authentication endpoints:
> 
> ```markdown
> ### Authentication Endpoints
> 
> #### POST /auth/login
> Authenticate user and receive JWT token
> 
> **Request:**
> ```json
> {
>   "email": "user@example.com",
>   "password": "securePassword123"
> }
> ```
> 
> **Response:**
> ```json
> {
>   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
>   "expiresIn": "24h"
> }
> ```
> 
> #### POST /auth/refresh
> Refresh an existing JWT token
> 
> #### POST /auth/logout
> Revoke current JWT token
> ```
> 
> **Step 7: Security Hardening**
> 
> Implement these security enhancements:
> 
> 1. **Environment Variable Validation**
> ```typescript
> // src/config/validate-env.ts
> if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'changeme') {
>   throw new Error('JWT_SECRET must be set to a secure value');
> }
> 
> if (process.env.JWT_SECRET.length < 32) {
>   throw new Error('JWT_SECRET must be at least 32 characters');
> }
> ```
> 
> 2. **GDPR Compliance**
> - IP anonymization in logs
> - User consent tracking
> - Data deletion endpoints
> 
> 3. **Security Headers**
> ```typescript
> // Already implemented via Helmet, verify configuration
> app.use(helmet({
>   contentSecurityPolicy: true,
>   hsts: true,
>   noSniff: true
> }));
> ```
> 
> **Step 8: Integration Testing**
> 
> ```bash
> # Run linting
> npm run lint
> 
> # Build the project
> npm run build
> 
> # Run test suite
> npm test
> 
> # Run test with coverage
> npm run test:coverage
> 
> # Verify coverage meets 95% threshold
> node scripts/coverage-scaling.js check
> ```
> 
> **Step 9: Documentation Requirements**
> 
> Update these files:
> - `README.md` - Add authentication section
> - `API.md` - Complete endpoint documentation
> - `docs/guides/SECURITY.md` - Security best practices
> - `CHANGELOG.md` - Document changes
> 
> **Step 10: Submit for Code Review**
> 
> ```bash
> # Stage changes
> git add src/auth/ tests/auth/ API.md
> 
> # Commit with descriptive message
> git commit -m "feat: implement comprehensive JWT authentication with OAuth2 support
> 
> - Add JWT token refresh endpoint
> - Implement token revocation/blacklist
> - Add OAuth2 flow support
> - Enhance security validation
> - Add comprehensive test coverage (95%+)
> - Update API documentation
> 
> Closes #181 (Task 1)"
> 
> # Push to feature branch
> git push origin feature/auth-enhancement
> ```
> 
> **Validation Checklist:**
> - [ ] JWT_SECRET properly configured and validated
> - [ ] Token generation, verification, and refresh working
> - [ ] Rate limiting active on auth endpoints
> - [ ] OAuth2 flow implemented (if required)
> - [ ] Test coverage ≥ 95% for auth module
> - [ ] All security headers configured
> - [ ] API documentation updated
> - [ ] CHANGELOG.md updated
> - [ ] No security vulnerabilities introduced
> - [ ] Builds successfully (`npm run build`)
> - [ ] All tests passing (`npm test`)
> 
> **Common Pitfalls to Avoid:**
> - ⚠️ Never commit JWT_SECRET to repository
> - ⚠️ Don't use weak secrets (minimum 32 characters)
> - ⚠️ Always validate token before processing requests
> - ⚠️ Implement proper error handling (don't leak sensitive info)
> - ⚠️ Don't skip rate limiting
> - ⚠️ Always use HTTPS in production

---

## Task 2: Enhance Data Validation
- [ ] Enhance data validation.

> ### 🤖 Long-Form Code Agent Instructions for Task 2: Data Validation Enhancement
> 
> #### Overview
> Strengthen the data validation layer across all API endpoints and internal services to prevent invalid data, injection attacks, and edge case failures. Implement comprehensive validation using Joi schemas with TypeScript integration.
> 
> #### Prerequisites
> - Understanding of Joi validation library
> - TypeScript type system and interfaces
> - Express.js request validation middleware
> - Common attack vectors (SQL injection, XSS, NoSQL injection)
> 
> #### Step-by-Step Implementation Guide
> 
> **Step 1: Audit Current Validation Logic**
> 
> ```bash
> # Find all validation-related files
> find src/ -name "*validation*" -o -name "*validator*" -o -name "*schema*"
> 
> # Check middleware directory
> ls -la src/middleware/
> 
> # Review route handlers for validation
> grep -r "req.body" src/routes/
> ```
> 
> **Action Items:**
> - Identify all API endpoints accepting user input
> - List endpoints missing validation
> - Review existing Joi schemas (if any)
> - Document current validation gaps
> 
> **Step 2: Define Validation Requirements**
> 
> Create a validation coverage matrix:
> 
> | Endpoint | Input Source | Current Validation | Required Validation | Priority |
> |----------|-------------|-------------------|---------------------|----------|
> | POST /auth/login | req.body | Basic | Email format, password strength | Critical |
> | POST /api/v2/workflows | req.body | Partial | Complete workflow schema | High |
> | GET /api/v2/workflows/:id | req.params | None | UUID validation | High |
> | PUT /api/v2/workflows/:id | req.body, req.params | Partial | Complete schema + UUID | High |
> | POST /api/browser/navigate | req.body | Basic | URL validation, security checks | Critical |
> 
> **Step 3: Create Comprehensive Joi Schemas**
> 
> Create `src/validation/schemas/index.ts`:
> 
> ```typescript
> import Joi from 'joi';
> 
> // Base schemas for reuse
> export const emailSchema = Joi.string()
>   .email({ minDomainSegments: 2 })
>   .lowercase()
>   .trim()
>   .required()
>   .messages({
>     'string.email': 'Invalid email format',
>     'any.required': 'Email is required'
>   });
> 
> export const passwordSchema = Joi.string()
>   .min(8)
>   .max(128)
>   .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
>   .required()
>   .messages({
>     'string.min': 'Password must be at least 8 characters',
>     'string.pattern.base': 'Password must contain uppercase, lowercase, number, and special character',
>     'any.required': 'Password is required'
>   });
> 
> export const uuidSchema = Joi.string()
>   .uuid({ version: 'uuidv4' })
>   .required()
>   .messages({
>     'string.uuid': 'Invalid UUID format',
>     'any.required': 'ID is required'
>   });
> 
> export const urlSchema = Joi.string()
>   .uri({ scheme: ['http', 'https'] })
>   .required()
>   .messages({
>     'string.uri': 'Invalid URL format',
>     'any.required': 'URL is required'
>   });
> 
> // Workflow validation schema
> export const workflowSchema = Joi.object({
>   name: Joi.string().min(3).max(100).required(),
>   description: Joi.string().max(500).optional(),
>   definition: Joi.object({
>     tasks: Joi.array().items(
>       Joi.object({
>         name: Joi.string().required(),
>         agent_type: Joi.string().valid('browser', 'data', 'storage').required(),
>         action: Joi.string().required(),
>         parameters: Joi.object().required(),
>         retry: Joi.object({
>           max_attempts: Joi.number().integer().min(1).max(5).default(3),
>           backoff_ms: Joi.number().integer().min(100).max(10000).default(1000)
>         }).optional()
>       })
>     ).min(1).required()
>   }).required(),
>   tags: Joi.array().items(Joi.string().max(50)).max(10).optional()
> });
> 
> // Login validation schema
> export const loginSchema = Joi.object({
>   email: emailSchema,
>   password: passwordSchema
> });
> 
> // Browser action validation schema
> export const browserActionSchema = Joi.object({
>   action: Joi.string()
>     .valid('navigate', 'click', 'type', 'screenshot', 'getText', 'getContent', 'evaluate')
>     .required(),
>   parameters: Joi.object().required(),
>   timeout: Joi.number().integer().min(1000).max(120000).optional()
> });
> ```
> 
> **Step 4: Create Validation Middleware**
> 
> Create `src/middleware/validate.ts`:
> 
> ```typescript
> import { Request, Response, NextFunction } from 'express';
> import { Schema, ValidationError } from 'joi';
> 
> export interface ValidationSource {
>   body?: Schema;
>   params?: Schema;
>   query?: Schema;
>   headers?: Schema;
> }
> 
> /**
>  * Express middleware factory for request validation
>  * @param schemas - Object containing Joi schemas for different request parts
>  * @returns Express middleware function
>  */
> export const validate = (schemas: ValidationSource) => {
>   return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
>     try {
>       const validationPromises = [];
> 
>       // Validate body
>       if (schemas.body) {
>         validationPromises.push(
>           schemas.body.validateAsync(req.body, {
>             abortEarly: false,
>             stripUnknown: true
>           })
>         );
>       }
> 
>       // Validate params
>       if (schemas.params) {
>         validationPromises.push(
>           schemas.params.validateAsync(req.params, {
>             abortEarly: false,
>             stripUnknown: true
>           })
>         );
>       }
> 
>       // Validate query
>       if (schemas.query) {
>         validationPromises.push(
>           schemas.query.validateAsync(req.query, {
>             abortEarly: false,
>             stripUnknown: true
>           })
>         );
>       }
> 
>       // Wait for all validations
>       const results = await Promise.all(validationPromises);
> 
>       // Update request with validated values
>       let index = 0;
>       if (schemas.body) req.body = results[index++];
>       if (schemas.params) req.params = results[index++];
>       if (schemas.query) req.query = results[index++];
> 
>       next();
>     } catch (error) {
>       if (error instanceof ValidationError) {
>         const errorMessages = error.details.map(detail => ({
>           field: detail.path.join('.'),
>           message: detail.message
>         }));
> 
>         res.status(400).json({
>           error: 'Validation failed',
>           details: errorMessages
>         });
>       } else {
>         next(error);
>       }
>     }
>   };
> };
> 
> /**
>  * Sanitize string input to prevent XSS attacks
>  */
> export const sanitizeString = (input: string): string => {
>   return input
>     .replace(/[<>]/g, '') // Remove angle brackets
>     .trim();
> };
> 
> /**
>  * Validate and sanitize URL to prevent SSRF attacks
>  */
> export const validateSafeUrl = (url: string): boolean => {
>   try {
>     const parsed = new URL(url);
>     
>     // Block local/private IPs
>     const blockedHosts = [
>       'localhost',
>       '127.0.0.1',
>       '0.0.0.0',
>       '::1',
>       '169.254.', // AWS metadata
>       '10.',
>       '172.16.',
>       '192.168.'
>     ];
> 
>     return !blockedHosts.some(blocked => 
>       parsed.hostname.includes(blocked)
>     );
>   } catch {
>     return false;
>   }
> };
> ```
> 
> **Step 5: Apply Validation to Routes**
> 
> Update `src/routes/automation.ts`:
> 
> ```typescript
> import { Router } from 'express';
> import { validate } from '../middleware/validate';
> import { workflowSchema, browserActionSchema } from '../validation/schemas';
> import { authenticateToken } from '../auth/jwt';
> 
> const router = Router();
> 
> // Create workflow with validation
> router.post(
>   '/workflows',
>   authenticateToken,
>   validate({ body: workflowSchema }),
>   async (req, res) => {
>     // Request body is now validated and typed
>     const workflow = req.body;
>     // Implementation...
>   }
> );
> 
> // Execute browser action with validation
> router.post(
>   '/browser/action',
>   authenticateToken,
>   validate({ body: browserActionSchema }),
>   async (req, res) => {
>     const { action, parameters } = req.body;
>     // Implementation...
>   }
> );
> 
> export default router;
> ```
> 
> **Step 6: Identify and Test Edge Cases**
> 
> Create `tests/validation/edge-cases.test.ts`:
> 
> ```typescript
> import request from 'supertest';
> import app from '../../src/index';
> 
> describe('Data Validation Edge Cases', () => {
>   describe('Workflow Creation', () => {
>     it('should reject empty workflow name', async () => {
>       const validTask = {
>         name: 'test-task',
>         agent_type: 'browser',
>         action: 'navigate',
>         parameters: { url: 'https://example.com' }
>       };
>       
>       const response = await request(app)
>         .post('/api/v2/workflows')
>         .set('Authorization', `Bearer ${validToken}`)
>         .send({ name: '', definition: { tasks: [validTask] } });
>       
>       expect(response.status).toBe(400);
>       expect(response.body.error).toBe('Validation failed');
>       expect(response.body.details[0].field).toBe('name');
>     });
> 
>     it('should reject workflow with too many tags', async () => {
>       const tags = Array(11).fill('tag');
>       const response = await request(app)
>         .post('/api/v2/workflows')
>         .set('Authorization', `Bearer ${validToken}`)
>         .send({ 
>           name: 'Test',
>           definition: { tasks: [validTask] },
>           tags
>         });
>       
>       expect(response.status).toBe(400);
>     });
> 
>     it('should sanitize XSS attempts in workflow name', async () => {
>       const response = await request(app)
>         .post('/api/v2/workflows')
>         .set('Authorization', `Bearer ${validToken}`)
>         .send({ 
>           name: '<script>alert("xss")</script>Workflow',
>           definition: { tasks: [validTask] }
>         });
>       
>       expect(response.status).toBe(400);
>     });
> 
>     it('should handle unicode characters correctly', async () => {
>       const response = await request(app)
>         .post('/api/v2/workflows')
>         .set('Authorization', `Bearer ${validToken}`)
>         .send({ 
>           name: '测试工作流 🚀',
>           definition: { tasks: [validTask] }
>         });
>       
>       expect(response.status).toBe(201);
>     });
> 
>     it('should reject malformed JSON', async () => {
>       const response = await request(app)
>         .post('/api/v2/workflows')
>         .set('Authorization', `Bearer ${validToken}`)
>         .set('Content-Type', 'application/json')
>         .send('{ invalid json }');
>       
>       expect(response.status).toBe(400);
>     });
>   });
> 
>   describe('URL Validation', () => {
>     it('should block SSRF attempts to localhost', async () => {
>       const response = await request(app)
>         .post('/api/browser/navigate')
>         .set('Authorization', `Bearer ${validToken}`)
>         .send({ 
>           action: 'navigate',
>           parameters: { url: 'http://localhost:6379' }
>         });
>       
>       expect(response.status).toBe(400);
>     });
> 
>     it('should block SSRF attempts to private IPs', async () => {
>       const privateIps = [
>         'http://192.168.1.1',
>         'http://10.0.0.1',
>         'http://172.16.0.1',
>         'http://169.254.169.254' // AWS metadata
>       ];
> 
>       for (const ip of privateIps) {
>         const response = await request(app)
>           .post('/api/browser/navigate')
>           .set('Authorization', `Bearer ${validToken}`)
>           .send({ 
>             action: 'navigate',
>             parameters: { url: ip }
>           });
>         
>         expect(response.status).toBe(400);
>       }
>     });
> 
>     it('should allow valid public URLs', async () => {
>       const response = await request(app)
>         .post('/api/browser/navigate')
>         .set('Authorization', `Bearer ${validToken}`)
>         .send({ 
>           action: 'navigate',
>           parameters: { url: 'https://google.com' }
>         });
>       
>       expect(response.status).toBe(200);
>     });
>   });
> 
>   describe('SQL Injection Prevention', () => {
>     it('should reject SQL injection attempts in search', async () => {
>       const response = await request(app)
>         .get('/api/v2/workflows')
>         .query({ search: "'; DROP TABLE workflows; --" })
>         .set('Authorization', `Bearer ${validToken}`);
>       
>       expect(response.status).toBe(400);
>     });
>   });
> });
> ```
> 
> **Step 7: Add TypeScript Type Guards**
> 
> Create `src/validation/type-guards.ts`:
> 
> ```typescript
> /**
>  * Type guard for workflow definition
>  */
> export function isWorkflowDefinition(obj: any): obj is WorkflowDefinition {
>   return (
>     obj &&
>     typeof obj === 'object' &&
>     Array.isArray(obj.tasks) &&
>     obj.tasks.every(isTask)
>   );
> }
> 
> /**
>  * Type guard for task
>  */
> export function isTask(obj: any): obj is Task {
>   return (
>     obj &&
>     typeof obj === 'object' &&
>     typeof obj.name === 'string' &&
>     typeof obj.agent_type === 'string' &&
>     typeof obj.action === 'string' &&
>     typeof obj.parameters === 'object'
>   );
> }
> 
> /**
>  * Validate and narrow type
>  */
> export function assertWorkflowDefinition(
>   obj: unknown
> ): asserts obj is WorkflowDefinition {
>   if (!isWorkflowDefinition(obj)) {
>     throw new TypeError('Invalid workflow definition');
>   }
> }
> ```
> 
> **Step 8: Performance Testing**
> 
> ```bash
> # Test validation performance with large payloads
> npm run test:performance
> 
> # Benchmark validation middleware
> npm run benchmark:validation
> ```
> 
> **Step 9: Update Documentation**
> 
> Update `API.md` with validation rules:
> 
> ```markdown
> ## Validation Rules
> 
> ### Workflow Schema
> - `name`: 3-100 characters, required
> - `description`: 0-500 characters, optional
> - `definition.tasks`: Array of 1+ tasks, required
> - `tags`: Array of 0-10 tags (max 50 chars each), optional
> 
> ### Error Response Format
> ```json
> {
>   "error": "Validation failed",
>   "details": [
>     {
>       "field": "name",
>       "message": "name must be at least 3 characters"
>     }
>   ]
> }
> ```
> ```
> 
> **Step 10: Integration and Testing**
> 
> ```bash
> # Install Joi if not already installed
> npm install joi
> npm install --save-dev @types/joi
> 
> # Run linting
> npm run lint
> 
> # Run tests with coverage
> npm run test:coverage
> 
> # Verify no regressions
> npm run test
> ```
> 
> **Validation Checklist:**
> - [ ] All API endpoints have validation middleware
> - [ ] Joi schemas created for all input types
> - [ ] XSS prevention implemented
> - [ ] SQL injection prevention implemented
> - [ ] SSRF protection implemented
> - [ ] URL validation with blocklist
> - [ ] Edge cases identified and tested
> - [ ] Test coverage ≥ 90% for validation module
> - [ ] API documentation updated with validation rules
> - [ ] TypeScript type guards implemented
> - [ ] Performance benchmarks passing
> - [ ] No validation bypasses possible
> 
> **Common Edge Cases to Test:**
> - Empty strings, null values, undefined
> - Very long strings (> max length)
> - Special characters and unicode
> - Arrays with 0 items, 1 item, max items
> - Nested object validation
> - Type coercion attempts
> - SQL injection patterns
> - XSS patterns
> - SSRF attempts
> - Integer overflow
> - Negative numbers where not allowed
> - Invalid UUIDs
> - Malformed URLs
> - Invalid email formats
> - Weak passwords
> 
> **Security Best Practices:**
> - ✅ Always validate on the server (never trust client)
> - ✅ Use allowlists, not blocklists (when possible)
> - ✅ Sanitize output in addition to input validation
> - ✅ Fail securely (reject invalid data)
> - ✅ Log validation failures for security monitoring
> - ✅ Don't expose internal errors in validation messages

---

## Task 3: Optimize Performance
- [ ] Optimize performance.

> ### 🤖 Long-Form Code Agent Instructions for Task 3: Performance Optimization
> 
> #### Overview
> Systematically identify, analyze, and optimize performance bottlenecks in the workstation application to achieve faster response times, lower resource usage, and better scalability.
> 
> #### Prerequisites
> - Profiling tools (Node.js profiler, Chrome DevTools)
> - Understanding of async/await and Promise optimization
> - Database query optimization knowledge
> - Caching strategies
> - Load testing tools (Artillery, k6)
> 
> #### Step-by-Step Implementation Guide
> 
> **Step 1: Establish Performance Baseline**
> 
> Create `scripts/performance/baseline.sh`:
> 
> ```bash
> #!/bin/bash
> # Performance baseline measurement
> 
> echo "=== Performance Baseline Test ==="
> echo "Starting server..."
> 
> # Start server in background
> npm start &
> SERVER_PID=$!
> sleep 5
> 
> # Run load tests
> echo "Running load tests..."
> npm run test:load
> 
> # Profile critical endpoints
> echo "Profiling endpoints..."
> curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3000/health
> curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3000/api/v2/workflows
> 
> # Kill server
> kill $SERVER_PID
> 
> echo "Baseline complete. Results saved to baseline-results.json"
> ```
> 
> Create `curl-format.txt`:
> ```
>     time_namelookup:  %{time_namelookup}s\n
>        time_connect:  %{time_connect}s\n
>     time_appconnect:  %{time_appconnect}s\n
>    time_pretransfer:  %{time_pretransfer}s\n
>       time_redirect:  %{time_redirect}s\n
>  time_starttransfer:  %{time_starttransfer}s\n
>                     ----------\n
>          time_total:  %{time_total}s\n
> ```
> 
> **Baseline Metrics to Track:**
> 
> | Metric | Current | Target | Measurement Method |
> |--------|---------|--------|-------------------|
> | Response Time (p50) | ? | < 100ms | Load testing |
> | Response Time (p95) | ? | < 500ms | Load testing |
> | Response Time (p99) | ? | < 1000ms | Load testing |
> | Throughput | ? | > 100 req/s | Artillery |
> | Memory Usage | ? | < 512MB | Node.js profiler |
> | CPU Usage | ? | < 50% | Node.js profiler |
> | Database Query Time | ? | < 50ms | Query profiler |
> | Cold Start Time | ? | < 3s | Manual timing |
> 
> **Step 2: Profile the Application**
> 
> Install profiling tools:
> 
> ```bash
> npm install --save-dev clinic autocannon
> npm install --save-dev artillery
> ```
> 
> Run profiling:
> 
> ```bash
> # CPU profiling
> clinic doctor -- node dist/index.js
> 
> # Memory profiling
> clinic heapprofiler -- node dist/index.js
> 
> # Event loop monitoring
> clinic bubbleprof -- node dist/index.js
> 
> # Load testing
> autocannon -c 100 -d 30 http://localhost:3000/api/v2/workflows
> ```
> 
> Analyze results to identify:
> - Slow database queries
> - N+1 query problems
> - Blocking operations in event loop
> - Memory leaks
> - Inefficient algorithms
> - Unnecessary computations
> 
> **Step 3: Optimize Database Queries**
> 
> Create `src/db/optimizations.ts`:
> 
> ```typescript
> import { Pool, PoolConfig } from 'pg';
> 
> // Optimize connection pool
> export const poolConfig: PoolConfig = {
>   max: 20, // Maximum connections
>   idleTimeoutMillis: 30000,
>   connectionTimeoutMillis: 2000,
>   // Enable prepared statements
>   allowExitOnIdle: true
> };
> 
> // Add query result caching
> const queryCache = new Map<string, { result: any; timestamp: number }>();
> const CACHE_TTL = 60000; // 1 minute
> 
> export async function cachedQuery(
>   pool: Pool,
>   query: string,
>   params: any[]
> ): Promise<any> {
>   const cacheKey = `${query}:${JSON.stringify(params)}`;
>   const cached = queryCache.get(cacheKey);
>   
>   if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
>     return cached.result;
>   }
>   
>   const result = await pool.query(query, params);
>   queryCache.set(cacheKey, { result, timestamp: Date.now() });
>   
>   return result;
> }
> 
> // Add indexes for common queries
> export const indexCreationQueries = [
>   `CREATE INDEX IF NOT EXISTS idx_workflows_user_id ON workflows(user_id)`,
>   `CREATE INDEX IF NOT EXISTS idx_workflows_created_at ON workflows(created_at DESC)`,
>   `CREATE INDEX IF NOT EXISTS idx_tasks_workflow_id ON workflow_tasks(workflow_id)`,
>   `CREATE INDEX IF NOT EXISTS idx_tasks_status ON workflow_tasks(status)`,
> ];
> 
> // Optimize N+1 queries with batching
> export async function getWorkflowsWithTasks(
>   pool: Pool,
>   userId: string
> ): Promise<any[]> {
>   // BAD: N+1 query
>   // const workflows = await pool.query('SELECT * FROM workflows WHERE user_id = $1', [userId]);
>   // for (const workflow of workflows.rows) {
>   //   workflow.tasks = await pool.query('SELECT * FROM workflow_tasks WHERE workflow_id = $1', [workflow.id]);
>   // }
>   
>   // GOOD: Single query with JOIN
>   const result = await pool.query(`
>     SELECT 
>       w.*,
>       json_agg(
>         json_build_object(
>           'id', t.id,
>           'name', t.name,
>           'status', t.status,
>           'result', t.result
>         )
>       ) as tasks
>     FROM workflows w
>     LEFT JOIN workflow_tasks t ON w.id = t.workflow_id
>     WHERE w.user_id = $1
>     GROUP BY w.id
>     ORDER BY w.created_at DESC
>   `, [userId]);
>   
>   return result.rows;
> }
> ```
> 
> **Step 4: Implement Response Caching**
> 
> Create `src/middleware/cache.ts`:
> 
> ```typescript
> import { Request, Response, NextFunction } from 'express';
> import NodeCache from 'node-cache';
> 
> // In-memory cache with 5-minute TTL
> const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });
> 
> export interface CacheOptions {
>   ttl?: number;
>   keyGenerator?: (req: Request) => string;
> }
> 
> /**
>  * Cache middleware for GET requests
>  */
> export const cacheMiddleware = (options: CacheOptions = {}) => {
>   return (req: Request, res: Response, next: NextFunction): void => {
>     // Only cache GET requests
>     if (req.method !== 'GET') {
>       return next();
>     }
> 
>     const cacheKey = options.keyGenerator 
>       ? options.keyGenerator(req)
>       : `${req.path}:${JSON.stringify(req.query)}`;
> 
>     const cachedResponse = cache.get(cacheKey);
> 
>     if (cachedResponse) {
>       res.set('X-Cache', 'HIT');
>       return res.json(cachedResponse);
>     }
> 
>     // Store original json method
>     const originalJson = res.json.bind(res);
> 
>     // Override json method to cache response
>     res.json = function(body: any): Response {
>       cache.set(cacheKey, body, options.ttl);
>       res.set('X-Cache', 'MISS');
>       return originalJson(body);
>     };
> 
>     next();
>   };
> };
> 
> /**
>  * Clear cache for specific pattern
>  */
> export const clearCache = (pattern?: string): void => {
>   if (pattern) {
>     const keys = cache.keys();
>     keys.filter(key => key.includes(pattern)).forEach(key => cache.del(key));
>   } else {
>     cache.flushAll();
>   }
> };
> ```
> 
> Apply caching to routes:
> 
> ```typescript
> import { cacheMiddleware } from '../middleware/cache';
> 
> // Cache workflow list for 5 minutes
> router.get('/workflows', 
>   authenticateToken,
>   cacheMiddleware({ ttl: 300 }),
>   async (req, res) => {
>     // Handler implementation
>   }
> );
> ```
> 
> **Step 5: Optimize Async Operations**
> 
> ```typescript
> // BAD: Sequential execution
> async function processWorkflowSequential(workflow: Workflow) {
>   const task1Result = await executeTask(workflow.tasks[0]);
>   const task2Result = await executeTask(workflow.tasks[1]);
>   const task3Result = await executeTask(workflow.tasks[2]);
>   return [task1Result, task2Result, task3Result];
> }
> 
> // GOOD: Parallel execution (when tasks are independent)
> async function processWorkflowParallel(workflow: Workflow) {
>   const results = await Promise.all(
>     workflow.tasks.map(task => executeTask(task))
>   );
>   return results;
> }
> 
> // BETTER: Parallel with concurrency limit
> import pLimit from 'p-limit';
> 
> async function processWorkflowLimited(workflow: Workflow) {
>   const limit = pLimit(5); // Max 5 concurrent tasks
>   
>   const results = await Promise.all(
>     workflow.tasks.map(task => 
>       limit(() => executeTask(task))
>     )
>   );
>   return results;
> }
> ```
> 
> **Step 6: Add Compression**
> 
> Update `src/index.ts`:
> 
> ```typescript
> import compression from 'compression';
> 
> // Add compression middleware (before routes)
> app.use(compression({
>   filter: (req, res) => {
>     if (req.headers['x-no-compression']) {
>       return false;
>     }
>     return compression.filter(req, res);
>   },
>   threshold: 1024 // Only compress responses > 1KB
> }));
> ```
> 
> **Step 7: Optimize Playwright Browser Usage**
> 
> Update `src/automation/agents/core/browser.ts`:
> 
> ```typescript
> import { chromium, Browser, BrowserContext } from 'playwright';
> 
> // Reuse browser instance (don't create new for each request)
> let browserInstance: Browser | null = null;
> 
> export async function getBrowserInstance(): Promise<Browser> {
>   if (!browserInstance || !browserInstance.isConnected()) {
>     const launchArgs = [
>       '--disable-dev-shm-usage',
>       '--disable-setuid-sandbox',
>       '--no-sandbox',
>       '--disable-gpu',
>       '--disable-features=IsolateOrigins,site-per-process'
>     ];
>     
>     browserInstance = await chromium.launch({
>       headless: true,
>       args: launchArgs
>     });
>   }
>   return browserInstance;
> }
> 
> // Use browser contexts instead of new browser instances
> export async function createBrowserContext(): Promise<BrowserContext> {
>   const browser = await getBrowserInstance();
>   return await browser.newContext({
>     viewport: { width: 1920, height: 1080 },
>     userAgent: 'Mozilla/5.0 (compatible; WorkstationBot/1.0)',
>   });
> }
> 
> // Cleanup on shutdown
> process.on('SIGTERM', async () => {
>   if (browserInstance) {
>     await browserInstance.close();
>   }
> });
> ```
> 
> **Step 8: Load Testing**
> 
> Create `tests/performance/load-test.yml`:
> 
> ```yaml
> config:
>   target: 'http://localhost:3000'
>   phases:
>     - duration: 60
>       arrivalRate: 10
>       name: "Warm up"
>     - duration: 120
>       arrivalRate: 50
>       name: "Sustained load"
>     - duration: 60
>       arrivalRate: 100
>       name: "Peak load"
>   processor: "./load-test-processor.js"
> 
> scenarios:
>   - name: "Workflow operations"
>     flow:
>       - post:
>           url: "/auth/login"
>           json:
>             email: "test@example.com"
>             password: "password123"
>           capture:
>             - json: "$.token"
>               as: "authToken"
>       
>       - get:
>           url: "/api/v2/workflows"
>           headers:
>             Authorization: "Bearer {{ authToken }}"
>       
>       - post:
>           url: "/api/v2/workflows"
>           headers:
>             Authorization: "Bearer {{ authToken }}"
>           json:
>             name: "Performance Test Workflow"
>             definition:
>               tasks:
>                 - name: "navigate"
>                   agent_type: "browser"
>                   action: "navigate"
>                   parameters:
>                     url: "https://example.com"
>       
>       - think: 2
> ```
> 
> Run load test:
> 
> ```bash
> artillery run tests/performance/load-test.yml --output results.json
> artillery report results.json
> ```
> 
> **Step 9: Monitor and Measure Improvements**
> 
> Create `scripts/performance/compare.js`:
> 
> ```javascript
> const fs = require('fs');
> 
> const baseline = JSON.parse(fs.readFileSync('baseline-results.json'));
> const current = JSON.parse(fs.readFileSync('current-results.json'));
> 
> console.log('Performance Comparison:');
> console.log('======================');
> 
> const metrics = ['p50', 'p95', 'p99', 'throughput'];
> metrics.forEach(metric => {
>   const improvement = ((baseline[metric] - current[metric]) / baseline[metric] * 100).toFixed(2);
>   console.log(`${metric}: ${baseline[metric]}ms → ${current[metric]}ms (${improvement}% improvement)`);
> });
> ```
> 
> **Step 10: Document Optimizations**
> 
> Update `docs/PERFORMANCE.md`:
> 
> ```markdown
> # Performance Optimizations
> 
> ## Summary
> - 50% reduction in p95 response time
> - 3x increase in throughput
> - 40% reduction in memory usage
> 
> ## Optimizations Implemented
> 
> ### Database Optimizations
> - Added indexes on frequently queried columns
> - Eliminated N+1 queries with JOINs
> - Implemented query result caching (1-minute TTL)
> - Optimized connection pool settings
> 
> ### Application Optimizations
> - Response caching for GET endpoints (5-minute TTL)
> - Gzip compression for responses > 1KB
> - Parallel task execution with concurrency limits
> - Reusable Playwright browser instance
> 
> ### Benchmark Results
> 
> | Metric | Before | After | Improvement |
> |--------|--------|-------|-------------|
> | p50 | 150ms | 75ms | 50% |
> | p95 | 800ms | 400ms | 50% |
> | Throughput | 50 req/s | 150 req/s | 200% |
> | Memory | 850MB | 510MB | 40% |
> ```
> 
> **Validation Checklist:**
> - [ ] Baseline metrics established
> - [ ] Profiling completed and bottlenecks identified
> - [ ] Database indexes added
> - [ ] N+1 queries eliminated
> - [ ] Response caching implemented
> - [ ] Compression enabled
> - [ ] Async operations optimized
> - [ ] Browser instance reuse implemented
> - [ ] Load testing completed
> - [ ] Performance improvements documented
> - [ ] Metrics show ≥ 30% improvement in p95 latency
> - [ ] No regressions in functionality
> - [ ] Memory usage within acceptable limits
> - [ ] All tests passing
> 
> **Performance Targets:**
> - ✅ p50 response time < 100ms
> - ✅ p95 response time < 500ms
> - ✅ p99 response time < 1000ms
> - ✅ Throughput > 100 req/s
> - ✅ Memory usage < 512MB
> - ✅ CPU usage < 50% under load
> - ✅ Database queries < 50ms
> - ✅ Cold start < 3s
> 
> **Monitoring:**
> ```bash
> # Continuous monitoring
> npm run monitor:performance
> 
> # Generate performance report
> npm run performance:report
> ```

---

## Final Notes

Please ensure to follow the above long-form instructions closely while working on each task. Each task includes:

- **Detailed step-by-step guidance**
- **Code examples and templates**
- **Security and best practice considerations**
- **Comprehensive testing requirements**
- **Validation checklists**
- **Common pitfalls to avoid**
- **Performance benchmarks**
- **Documentation requirements**

For questions or clarification on any task, refer to the repository documentation:
- [README.md](../README.md)
- [API Documentation](../API.md)
- [Architecture Overview](../docs/architecture/ARCHITECTURE.md)
- [Contributing Guide](../docs/guides/CONTRIBUTING.md)