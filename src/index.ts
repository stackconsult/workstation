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
import { getHealthStatus } from './utils/health';
import { validateEnvironment, printEnvironmentSummary } from './utils/env';
// Phase 1: Import automation routes and database
import automationRoutes from './routes/automation';
import mcpRoutes from './routes/mcp';
import gitRoutes from './routes/git';
import gitopsRoutes from './routes/gitops';
import authRoutes from './routes/auth';
import dashboardRoutes from './routes/dashboard';
import workflowsRoutes from './routes/workflows';
import agentsRoutes from './routes/agents';
import { initializeDatabase, getDatabase } from './automation/db/database';

// Validate environment configuration
const envConfig = validateEnvironment();
printEnvironmentSummary(envConfig);

// Initialize Phase 1 database
initializeDatabase().then(() => {
  logger.info('Phase 1: Database initialized successfully');
}).catch(error => {
  logger.error('Phase 1: Database initialization failed', { error });
});

const app = express();
const PORT = envConfig.port;

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
app.use(limiter); // Apply rate limiting to all routes

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

// Health check endpoint with enhanced metrics including database status
app.get('/health', async (req: Request, res: Response) => {
  const health = getHealthStatus();
  
  // Add database health check
  try {
    const db = getDatabase();
    // Simple query to check database connection
    await db.get('SELECT 1 as test');
    health.database = { status: 'connected' };
  } catch (error) {
    health.database = { status: 'disconnected', error: (error as Error).message };
    health.status = 'degraded';
  }
  
  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

// Generate token endpoint (for testing) - with stricter rate limiting and validation
app.post('/auth/token', authLimiter, validateRequest(schemas.generateToken), (req: Request, res: Response) => {
  const { userId, role } = req.body;

  const token = generateToken({ userId, role });
  
  logger.info('Token generated', { userId, role });
  
  res.json({ token });
});

// Demo token endpoint - with stricter rate limiting
app.get('/auth/demo-token', authLimiter, (req: Request, res: Response) => {
  const token = generateDemoToken();
  res.json({ 
    token,
    message: 'Use this token for testing. Add it to Authorization header as: Bearer <token>'
  });
});

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

// Agents management routes
app.use('/api/agents', agentsRoutes);

// MCP routes for GitHub Copilot integration
app.use('/api/v2', mcpRoutes);

// Git operations routes for coding agent
app.use('/api/v2', gitRoutes);

// Git operations API (protected) - low-level ops for automation agents
app.use('/api/v2/gitops', gitopsRoutes);

// 404 handler - must be after all routes
app.use(notFoundHandler);

// Global error handler - must be last
app.use(errorHandler);

// Start server only if not in test mode
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logger.info(`Server started`, {
      port: PORT,
      environment: envConfig.nodeEnv,
      nodeVersion: process.version,
    });
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📍 Environment: ${envConfig.nodeEnv}`);
    console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    console.log(`🔑 Demo token: http://localhost:${PORT}/auth/demo-token`);
  });
}

export default app;
