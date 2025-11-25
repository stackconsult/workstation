// ✅ JWT Secret Environment Validation (BEFORE imports to fail fast)
import dotenv from 'dotenv';
dotenv.config();

// Validate JWT_SECRET before server initialization - FAIL FAST
// Skip this check in test environment to allow tests to run
if (process.env.NODE_ENV !== 'test' && (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'changeme')) {
  console.error('❌ FATAL: Unsafe JWT_SECRET configured. Server will not start.');
  console.error('   Set a secure JWT_SECRET in your .env file');
  throw new Error('Unsafe JWT_SECRET configured. Server will not start.');
}

// CRITICAL: Global error handlers must be registered early
// These handlers prevent unhandled errors from crashing the process silently
process.on('uncaughtException', (err: Error) => {
  console.error('FATAL: Unhandled exception:', err);
  console.error('Stack trace:', err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  console.error('FATAL: Unhandled promise rejection:', reason);
  console.error('Promise:', promise);
  process.exit(1);
});

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createHash } from 'crypto';
import { join } from 'path';
import { generateToken, generateDemoToken, authenticateToken, AuthenticatedRequest } from './auth/jwt';
import { validateRequest, schemas } from './middleware/validation';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { validateEnvironment, printEnvironmentSummary } from './utils/env';
// Phase 1: Import automation routes and database
import automationRoutes from './routes/automation';
import mcpRoutes from './routes/mcp';
import gitRoutes from './routes/git';
import gitopsRoutes from './routes/gitops';
import authRoutes from './routes/auth';
import dashboardRoutes from './routes/dashboard';
import workflowsRoutes from './routes/workflows';
import workflowTemplatesRoutes from './routes/workflow-templates';
import agentsRoutes from './routes/agents';
import downloadsRoutes from './routes/downloads';
import backupsRoutes from './routes/backups';
import workflowStateRoutes from './routes/workflow-state';
import { initializeDatabase } from './automation/db/database';
// Context-Memory Intelligence Layer
import { initializeContextMemory } from './intelligence/context-memory';
// Phase 3: Import advanced rate limiting and monitoring
import { 
  authRateLimiter as advancedAuthLimiter,
  globalRateLimiter 
} from './middleware/advanced-rate-limit';
import { initializeMonitoring } from './services/monitoring';
// Phase 4: Import backup service
import { initializeBackupService } from './services/backup';

// Validate environment configuration
const envConfig = validateEnvironment();
printEnvironmentSummary(envConfig);

// Initialize Phase 1 database and context-memory before starting the server
async function initialize() {
  try {
    await initializeDatabase();
    logger.info('Phase 1: Database initialized successfully');
    
    await initializeContextMemory();
    logger.info('Context-Memory Intelligence Layer initialized successfully');
    
    // Phase 4: Initialize backup service
    initializeBackupService();
    logger.info('Phase 4: Backup service initialized successfully');
  } catch (error) {
    logger.error('Initialization failed', { error });
    process.exit(1);
  }
}

// Run initialization (server will start after this completes)
initialize().catch(error => {
  logger.error('Fatal initialization error', { error });
  process.exit(1);
});

const app = express();
const PORT = envConfig.port;

// Phase 3: Initialize monitoring (includes metrics middleware and /metrics endpoint)
// Note: This must be done early to capture all HTTP requests
initializeMonitoring(app);

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 auth requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
// Security headers with Helmet - relaxed for serving UI
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Allow inline scripts for UI
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

// CORS configuration with environment-based origins
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : process.env.NODE_ENV === 'production' 
    ? [] // No origins allowed by default in production - must be explicitly set
    : ['http://localhost:3000', 'http://localhost:3001']; // Development defaults

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, Postman, curl)
    if (!origin) {
      return callback(null, true);
    }
    
    if (allowedOrigins.length === 0 && process.env.NODE_ENV === 'production') {
      logger.warn('CORS request blocked - no allowed origins configured', { origin });
      return callback(new Error('CORS not allowed'), false);
    }
    
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      return callback(null, true);
    } else {
      logger.warn('CORS request blocked', { origin, allowedOrigins });
      return callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Phase 3: Apply global rate limiter with Redis backend (fallback to memory if Redis unavailable)
// This provides distributed rate limiting across multiple instances
try {
  app.use(globalRateLimiter);
  logger.info('Global rate limiter enabled (Redis-backed)');
} catch (error) {
  logger.warn('Global rate limiter fallback to memory-based limiter', { error });
  app.use(limiter); // Fallback to memory-based rate limiting
}

// Serve static files from public directory (Dashboard UI)
const publicPath = join(__dirname, '..', 'public');
app.use(express.static(publicPath));
logger.info('Serving static dashboard UI', { path: publicPath });

// Serve static files from docs directory (API docs)
const docsPath = join(__dirname, '..', 'docs');
app.use('/docs', express.static(docsPath));
logger.info('Serving static docs', { path: docsPath });

// Request logging middleware - anonymize IPs for privacy
app.use((req: Request, res: Response, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    // Hash IP for privacy while maintaining uniqueness for rate limiting
    const ipHash = req.ip ? createHash('sha256').update(req.ip).digest('hex').substring(0, 16) : 'unknown';
    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ipHash, // Log hashed IP instead of actual IP
    });
  });
  next();
});

// Health check endpoint is now provided by monitoring service
// See initializeMonitoring() above which adds enhanced /health endpoint

// Generate token endpoint (for testing) - with Redis-backed advanced rate limiting
try {
  app.post('/auth/token', advancedAuthLimiter, validateRequest(schemas.generateToken), (req: Request, res: Response) => {
    const { userId, role } = req.body;

    const token = generateToken({ userId, role });
    
    logger.info('Token generated', { userId, role });
    
    res.json({ token });
  });
} catch {
  // Fallback to memory-based rate limiter if Redis unavailable
  app.post('/auth/token', authLimiter, validateRequest(schemas.generateToken), (req: Request, res: Response) => {
    const { userId, role } = req.body;

    const token = generateToken({ userId, role });
    
    logger.info('Token generated', { userId, role });
    
    res.json({ token });
  });
}

// Demo token endpoint - with Redis-backed advanced rate limiting
try {
  app.get('/auth/demo-token', advancedAuthLimiter, (req: Request, res: Response) => {
    const token = generateDemoToken();
    res.json({ 
      token,
      message: 'Use this token for testing. Add it to Authorization header as: Bearer <token>'
    });
  });
} catch {
  // Fallback to memory-based rate limiter if Redis unavailable
  app.get('/auth/demo-token', authLimiter, (req: Request, res: Response) => {
    const token = generateDemoToken();
    res.json({ 
      token,
      message: 'Use this token for testing. Add it to Authorization header as: Bearer <token>'
    });
  });
}

// Protected route example
app.get('/api/protected', authenticateToken, (req: Request, res: Response) => {
  const authenticatedReq = req as AuthenticatedRequest;
  res.json({ 
    message: 'Access granted to protected resource',
    user: authenticatedReq.user 
  });
});

// Protected agent status endpoint
app.get('/api/agent/status', authenticateToken, (req: Request, res: Response) => {
  const authenticatedReq = req as AuthenticatedRequest;
  res.json({
    status: 'running',
    user: authenticatedReq.user,
    timestamp: new Date().toISOString()
  });
});

// Phase 1: Mount automation routes
app.use('/api/v2', automationRoutes);

// Auth routes for SaaS platform
app.use('/api/auth', authRoutes);

// Dashboard routes
app.use('/api/dashboard', dashboardRoutes);

// Workflows routes
app.use('/api/workflows', workflowsRoutes);

// Workflow templates routes
app.use('/api/workflow-templates', workflowTemplatesRoutes);

// Agents management routes
app.use('/api/agents', agentsRoutes);

// Downloads routes for build artifacts
app.use('/downloads', downloadsRoutes);
logger.info('Downloads routes registered for build artifacts');

// Phase 4: Backup management routes
app.use('/api/backups', backupsRoutes);
logger.info('Backup management routes registered');

// Phase 4: Workflow state management routes
app.use('/api/workflow-state', workflowStateRoutes);
logger.info('Workflow state management routes registered');

// MCP routes for GitHub Copilot integration
app.use('/api/v2', mcpRoutes);

// Git operations routes for coding agent
app.use('/api/v2', gitRoutes);

// Git operations API (protected) - low-level ops for automation agents
app.use('/api/v2/gitops', gitopsRoutes);

// Context-Memory Intelligence Layer Routes
import contextMemoryRoutes from './routes/context-memory';
app.use('/api/v2/context', contextMemoryRoutes);
logger.info('Context-Memory Intelligence Layer routes registered');

// Import WebSocket server for real-time updates
import { workflowWebSocketServer } from './services/workflow-websocket';

// 404 handler - must be after all routes
app.use(notFoundHandler);

// Global error handler - must be last
app.use(errorHandler);

// Start server only if not in test mode
if (process.env.NODE_ENV !== 'test') {
  const server = app.listen(PORT, () => {
    logger.info(`Server started`, {
      port: PORT,
      environment: envConfig.nodeEnv,
      nodeVersion: process.version,
    });
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📍 Environment: ${envConfig.nodeEnv}`);
    console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    console.log(`🔑 Demo token: http://localhost:${PORT}/auth/demo-token`);
    console.log(`🌐 WebSocket: ws://localhost:${PORT}/ws/executions`);
  });
  
  // Initialize WebSocket server for real-time workflow updates
  workflowWebSocketServer.initialize(server);
  logger.info('WebSocket server initialized for real-time workflow updates');
}

export default app;
