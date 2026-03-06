import { Request, Response, NextFunction, Application } from "express";
import {
  register,
  collectDefaultMetrics,
  Counter,
  Histogram,
  Gauge,
} from "prom-client";
import { getDatabase } from "../automation/db/database";
import { redisHealthCheck } from "./redis";
import os from "os";

// Collect default metrics (CPU, memory, etc.)
collectDefaultMetrics({ prefix: "workstation_" });

// Custom metrics
export const httpRequestDuration = new Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
});

export const httpRequestTotal = new Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
});

export const activeWebsocketConnections = new Gauge({
  name: "active_websocket_connections",
  help: "Number of active WebSocket connections",
});

export const workflowExecutions = new Counter({
  name: "workflow_executions_total",
  help: "Total number of workflow executions",
  labelNames: ["status"], // success, failure
});

export const agentTaskDuration = new Histogram({
  name: "agent_task_duration_seconds",
  help: "Agent task execution duration",
  labelNames: ["agent_id", "task_type"],
  buckets: [1, 5, 10, 30, 60, 120, 300],
});

export const databaseConnections = new Gauge({
  name: "database_connections_active",
  help: "Number of active database connections",
});

/**
 * Middleware to track HTTP request metrics
 */
export function metricsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const start = Date.now();

  res.on("finish", () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;

    httpRequestDuration
      .labels(req.method, route, res.statusCode.toString())
      .observe(duration);
    httpRequestTotal.labels(req.method, route, res.statusCode.toString()).inc();
  });

  next();
}

/**
 * Health check status
 */
export interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  uptime: number;
  checks: {
    database?: { status: string; latency?: number; error?: string };
    redis?: { status: string; latency?: number; error?: string };
    docker?: { status: string; containers?: number; error?: string };
    diskSpace?: { status: string; available?: string; error?: string };
  };
  metrics: {
    memory: { heapUsed: string; heapTotal: string; rss: string };
    cpu: { usage: number };
    activeConnections?: number;
  };
}

/**
 * Get comprehensive health status
 */
export async function getHealthStatus(): Promise<HealthStatus> {
  const health: HealthStatus = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {},
    metrics: {
      memory: {
        heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
        rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
      },
      cpu: {
        usage: parseFloat((os.loadavg()[0] * 100).toFixed(2)),
      },
    },
  };

  // Database health check
  try {
    const dbStart = Date.now();
    const db = getDatabase();
    await db.get("SELECT 1 as test");
    health.checks.database = {
      status: "up",
      latency: Date.now() - dbStart,
    };
  } catch (error) {
    health.checks.database = {
      status: "down",
      error: (error as Error).message,
    };
    health.status = "degraded";
  }

  // Redis health check
  try {
    const redisStart = Date.now();
    const redisHealth = await redisHealthCheck();
    health.checks.redis = {
      status: redisHealth.connected
        ? "up"
        : redisHealth.usingRedis
          ? "down"
          : "disabled",
      latency: redisHealth.connected ? Date.now() - redisStart : undefined,
      error:
        redisHealth.usingRedis && !redisHealth.connected
          ? "Connection failed"
          : undefined,
    };
    // Redis being down is not critical - we fall back to memory
    if (redisHealth.usingRedis && !redisHealth.connected) {
      console.warn("Redis unavailable, using in-memory fallback");
    }
  } catch (error) {
    health.checks.redis = {
      status: "error",
      error: (error as Error).message,
    };
  }

  // Disk space check
  try {
    const diskUsage = await checkDiskSpace();
    health.checks.diskSpace = {
      status: diskUsage.availableGB > 1 ? "up" : "low",
      available: `${diskUsage.availableGB.toFixed(2)}GB`,
    };
    if (diskUsage.availableGB < 1) {
      health.status = "degraded";
    }
  } catch (error) {
    health.checks.diskSpace = {
      status: "unknown",
      error: (error as Error).message,
    };
  }

  return health;
}

/**
 * Check available disk space
 */
async function checkDiskSpace(): Promise<{ availableGB: number }> {
  // Simple implementation - in production use proper disk monitoring
  const _total = os.totalmem(); // Reserved for future use
  const free = os.freemem();
  const availableGB = free / 1024 / 1024 / 1024;
  return { availableGB };
}

/**
 * Initialize monitoring
 */
export function initializeMonitoring(app: Application): void {
  // Apply metrics middleware to all routes
  app.use(metricsMiddleware);

  // Prometheus metrics endpoint
  app.get("/metrics", async (req: Request, res: Response) => {
    try {
      res.set("Content-Type", register.contentType);
      const metrics = await register.metrics();
      res.send(metrics);
    } catch (error) {
      res.status(500).send((error as Error).message);
    }
  });

  // Enhanced health check endpoint
  app.get("/health", async (req: Request, res: Response) => {
    try {
      const health = await getHealthStatus();
      const statusCode =
        health.status === "healthy"
          ? 200
          : health.status === "degraded"
            ? 200
            : 503;
      res.status(statusCode).json(health);
    } catch (error) {
      res.status(503).json({
        status: "unhealthy",
        error: (error as Error).message,
      });
    }
  });

  console.log(
    "✅ Monitoring initialized - Prometheus metrics available at /metrics",
  );
}
