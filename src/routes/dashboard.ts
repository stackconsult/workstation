/**
 * Dashboard Routes
 * User dashboard statistics, analytics, and recent activity
 */

import { Router, Response } from "express";
import { authenticateToken, AuthenticatedRequest } from "../auth/jwt";
import db from "../db/connection";
import { logger } from "../utils/logger";
import { promises as fs } from "fs";
import { join, resolve } from "path";
import { exec } from "child_process";
import { promisify } from "util";
import rateLimit from "express-rate-limit";
import os from "os";

const router = Router();
const execAsync = promisify(exec);

// Rate limiter for public endpoints
const publicStatsLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: "Too many requests to statistics endpoint, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Cache for repository statistics
interface RepoStatsCache {
  data: any;
  timestamp: number;
  ttl: number;
}

let repoStatsCache: RepoStatsCache = {
  data: null,
  timestamp: 0,
  ttl: 5 * 60 * 1000, // 5 minutes cache
};

/**
 * Get dashboard metrics (production-ready with real database queries)
 * GET /api/metrics/dashboard
 * Public endpoint with rate limiting
 */
router.get("/metrics", publicStatsLimiter, async (req, res: Response) => {
  try {
    // Get system-wide statistics (not user-specific)
    // This is a public endpoint showing overall system health

    // Count total agents from file system
    const agentsPath = resolve(process.cwd(), ".github", "agents");
    let totalAgents = 0;

    try {
      const agentDirs = await fs.readdir(agentsPath, { withFileTypes: true });
      totalAgents = agentDirs.filter((dir) => dir.isDirectory()).length;
    } catch (error) {
      logger.warn("Could not read agents directory", { error });
    }

    // Query database for real workflow metrics
    let runningWorkflows = 0;
    let completedToday = 0;
    let successRate = 0;

    try {
      // Get running workflows count
      const runningResult = await db.query(
        `SELECT COUNT(*) as count FROM executions WHERE status IN ('pending', 'running')`,
      );
      runningWorkflows = parseInt(runningResult.rows[0]?.count || "0");

      // Get completed today count
      const completedResult = await db.query(
        `SELECT COUNT(*) as count FROM executions 
         WHERE status = 'completed' 
         AND DATE(created_at) = DATE('now')`,
      );
      completedToday = parseInt(completedResult.rows[0]?.count || "0");

      // Calculate success rate (last 100 executions)
      const successResult = await db.query(
        `SELECT 
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful,
          COUNT(*) as total
         FROM (
           SELECT status FROM executions 
           WHERE status IN ('completed', 'failed')
           ORDER BY created_at DESC 
           LIMIT 100
         )`,
      );
      const successful = parseInt(successResult.rows[0]?.successful || "0");
      const total = parseInt(successResult.rows[0]?.total || "0");
      successRate = total > 0 ? Math.round((successful / total) * 100) : 0;
    } catch (dbError) {
      logger.warn("Database query failed, using fallback values", {
        error: dbError,
      });
      // Fallback to reasonable defaults if database is unavailable
      runningWorkflows = 0;
      completedToday = 0;
      successRate = 0;
    }

    const metrics = {
      activeAgents: totalAgents,
      runningWorkflows,
      completedToday,
      successRate,
    };

    res.json(metrics);
    logger.info("Dashboard metrics retrieved", { metrics });
  } catch (error) {
    logger.error("Dashboard metrics fetch error:", error);
    res.status(500).json({
      activeAgents: 0,
      runningWorkflows: 0,
      completedToday: 0,
      successRate: 0,
    });
  }
});

/**
 * Get user dashboard data
 * GET /api/dashboard
 */
router.get(
  "/",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized",
        });
      }

      // Get user statistics
      const statsResult = await db.query(
        `SELECT
        COUNT(DISTINCT sw.id) as total_workflows,
        COUNT(DISTINCT we.id) as total_executions,
        COUNT(DISTINCT CASE WHEN we.status = 'completed' THEN we.id END) as successful_executions,
        COUNT(DISTINCT CASE WHEN we.status = 'failed' THEN we.id END) as failed_executions,
        AVG(CASE WHEN we.status = 'completed' THEN we.duration_ms END) as avg_execution_time
      FROM users u
      LEFT JOIN saved_workflows sw ON u.id = sw.user_id
      LEFT JOIN workflow_executions we ON sw.id = we.workflow_id
      WHERE u.id = $1`,
        [userId],
      );

      // Get recent workflow executions
      const recentExecutionsResult = await db.query(
        `SELECT
        we.id,
        we.workflow_id,
        sw.name as workflow_name,
        we.status,
        we.duration_ms,
        we.steps_completed,
        we.total_steps,
        we.created_at,
        we.completed_at
      FROM workflow_executions we
      INNER JOIN saved_workflows sw ON we.workflow_id = sw.id
      WHERE sw.user_id = $1
      ORDER BY we.created_at DESC
      LIMIT 10`,
        [userId],
      );

      // Get usage analytics for the last 30 days
      const analyticsResult = await db.query(
        `SELECT
        date,
        total_executions,
        successful_executions,
        failed_executions,
        total_duration_ms
      FROM usage_analytics
      WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '30 days'
      ORDER BY date DESC`,
        [userId],
      );

      // Get agent task statistics
      const agentStatsResult = await db.query(
        `SELECT
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_tasks,
        COUNT(CASE WHEN status = 'pending' OR status = 'running' THEN 1 END) as active_tasks
      FROM agent_tasks
      WHERE created_by = $1`,
        [userId],
      );

      // Get subscription info
      const subscriptionResult = await db.query(
        `SELECT
        license_key,
        status,
        plan_type,
        access_level,
        expires_at,
        created_at
      FROM subscriptions
      WHERE user_id = $1 AND status = 'active'
      LIMIT 1`,
        [userId],
      );

      const stats = statsResult.rows[0] || {};
      const recentExecutions = recentExecutionsResult.rows;
      const analytics = analyticsResult.rows;
      const agentStats = agentStatsResult.rows[0] || {};
      const subscription = subscriptionResult.rows[0] || null;

      // Calculate success rate
      const totalExecs = parseInt(stats.total_executions || "0");
      const successfulExecs = parseInt(stats.successful_executions || "0");
      const successRate =
        totalExecs > 0 ? (successfulExecs / totalExecs) * 100 : 0;

      res.json({
        success: true,
        data: {
          statistics: {
            totalWorkflows: parseInt(stats.total_workflows || "0"),
            totalExecutions: totalExecs,
            successfulExecutions: successfulExecs,
            failedExecutions: parseInt(stats.failed_executions || "0"),
            successRate: parseFloat(successRate.toFixed(2)),
            avgExecutionTime: stats.avg_execution_time
              ? parseFloat(stats.avg_execution_time)
              : 0,
          },
          agentStatistics: {
            totalTasks: parseInt(agentStats.total_tasks || "0"),
            completedTasks: parseInt(agentStats.completed_tasks || "0"),
            failedTasks: parseInt(agentStats.failed_tasks || "0"),
            activeTasks: parseInt(agentStats.active_tasks || "0"),
          },
          recentExecutions,
          analytics,
          subscription,
        },
      });

      logger.info(`Dashboard data retrieved for user ${userId}`);
    } catch (error) {
      logger.error("Dashboard data fetch error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch dashboard data",
      });
    }
  },
);

/**
 * Get usage analytics with custom date range
 * GET /api/dashboard/analytics
 */
router.get(
  "/analytics",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      const { startDate, endDate, groupBy = "day" } = req.query;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized",
        });
      }

      // Default to last 30 days if no dates provided
      const start =
        startDate ||
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0];
      const end = endDate || new Date().toISOString().split("T")[0];

      const analyticsResult = await db.query(
        `SELECT
        date,
        total_executions,
        successful_executions,
        failed_executions,
        total_duration_ms,
        unique_workflows
      FROM usage_analytics
      WHERE user_id = $1 
        AND date >= $2::date 
        AND date <= $3::date
      ORDER BY date ASC`,
        [userId, start, end],
      );

      res.json({
        success: true,
        data: {
          period: {
            startDate: start,
            endDate: end,
            groupBy,
          },
          analytics: analyticsResult.rows,
        },
      });

      logger.info(
        `Analytics data retrieved for user ${userId}, period ${start} to ${end}`,
      );
    } catch (error) {
      logger.error("Analytics fetch error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch analytics",
      });
    }
  },
);

/**
 * Get public repository statistics (no auth required)
 * GET /api/dashboard/repo-stats
 * Returns cached stats with auto-refresh
 * Rate limited to 30 requests per minute
 */
router.get("/repo-stats", publicStatsLimiter, async (req, res: Response) => {
  try {
    const now = Date.now();

    // Return cached data if still valid
    if (
      repoStatsCache.data &&
      now - repoStatsCache.timestamp < repoStatsCache.ttl
    ) {
      return res.json({
        success: true,
        data: repoStatsCache.data,
        cached: true,
        cacheAge: Math.floor((now - repoStatsCache.timestamp) / 1000),
        nextUpdate: Math.floor(
          (repoStatsCache.ttl - (now - repoStatsCache.timestamp)) / 1000,
        ),
      });
    }

    // Collect fresh statistics
    const stats: any = {
      timestamp: new Date().toISOString(),
      repository: {
        name: "creditXcredit/workstation",
        description: "Privacy-First Browser Automation Platform",
      },
    };

    try {
      // Get file counts
      const { stdout: totalFiles } = await execAsync("git ls-files | wc -l");
      stats.files = {
        total: parseInt(totalFiles.trim()) || 0,
      };

      // Get TypeScript files
      const { stdout: tsFiles } = await execAsync(
        'find src -name "*.ts" 2>/dev/null | wc -l',
      );
      stats.files.typescript = parseInt(tsFiles.trim()) || 0;

      // Get test files
      const { stdout: testFiles } = await execAsync(
        'find tests -name "*.test.ts" -o -name "*.spec.ts" 2>/dev/null | wc -l',
      );
      stats.files.tests = parseInt(testFiles.trim()) || 0;

      // Get documentation files
      const { stdout: docFiles } = await execAsync(
        'find . -name "*.md" -not -path "./node_modules/*" 2>/dev/null | wc -l',
      );
      stats.files.documentation = parseInt(docFiles.trim()) || 0;

      // Get lines of code
      const { stdout: productionLoc } = await execAsync(
        'find src -name "*.ts" -o -name "*.js" 2>/dev/null | xargs wc -l 2>/dev/null | tail -1 | awk \'{print $1}\'',
      );
      stats.codeMetrics = {
        productionLoc: parseInt(productionLoc.trim()) || 0,
      };

      const { stdout: testLoc } = await execAsync(
        "find tests -name \"*.ts\" 2>/dev/null | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}'",
      );
      stats.codeMetrics.testLoc = parseInt(testLoc.trim()) || 0;

      // Get agent count
      const { stdout: agents } = await execAsync(
        "ls -d agents/*/ 2>/dev/null | wc -l",
      );
      stats.infrastructure = {
        agents: parseInt(agents.trim()) || 0,
      };

      // Get MCP containers count
      const { stdout: containers } = await execAsync(
        "ls -d mcp-containers/*/ 2>/dev/null | wc -l",
      );
      stats.infrastructure.mcpContainers = parseInt(containers.trim()) || 0;

      // Get workflows count
      const { stdout: workflows } = await execAsync(
        "ls -1 .github/workflows/*.yml .github/workflows/*.yaml 2>/dev/null | wc -l",
      );
      stats.infrastructure.workflows = parseInt(workflows.trim()) || 0;

      // Get recent commits (last 24 hours)
      try {
        const { stdout: recentCommits } = await execAsync(
          'git log --since="24 hours ago" --oneline | wc -l',
        );
        stats.activity = {
          commitsLast24h: parseInt(recentCommits.trim()) || 0,
        };
      } catch {
        stats.activity = { commitsLast24h: 0 };
      }

      // Read REPO_UPDATE_TASKS.md for last update time
      try {
        const tasksPath = join(process.cwd(), "REPO_UPDATE_TASKS.md");
        const tasksContent = await fs.readFile(tasksPath, "utf-8");
        const lastUpdatedMatch = tasksContent.match(
          /\*\*Last Updated\*\*:\s*(.+)/,
        );
        if (lastUpdatedMatch) {
          stats.lastAutoUpdate = lastUpdatedMatch[1].trim();
        }
      } catch {
        stats.lastAutoUpdate = "Unknown";
      }

      // Add agent status
      stats.agentSystem = {
        totalAgents: stats.infrastructure.agents,
        activeAgents: stats.infrastructure.agents, // Assume all active
        status: "operational",
      };
    } catch (error: any) {
      logger.error("Error collecting repo statistics:", error);
      stats.error = "Some statistics may be incomplete";
      stats.errorDetails = error.message;
    }

    // Update cache
    repoStatsCache = {
      data: stats,
      timestamp: now,
      ttl: repoStatsCache.ttl,
    };

    res.json({
      success: true,
      data: stats,
      cached: false,
      nextUpdate: Math.floor(repoStatsCache.ttl / 1000),
    });

    logger.info("Repository statistics collected and cached");
  } catch (error) {
    logger.error("Repo stats fetch error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch repository statistics",
      fallback: repoStatsCache.data || null,
    });
  }
});

/**
 * Get agent system status
 * GET /api/dashboard/agent-status
 */
router.get("/agent-status", async (req, res: Response) => {
  try {
    const agents = [];
    const agentsDir = join(process.cwd(), "agents");
    const resolvedAgentsDir = resolve(agentsDir);

    try {
      const agentDirs = await fs.readdir(agentsDir, { withFileTypes: true });

      for (const dir of agentDirs) {
        if (dir.isDirectory() && !dir.isSymbolicLink()) {
          // Validate that the path is still within agents directory
          const agentPath = resolve(join(agentsDir, dir.name));
          if (!agentPath.startsWith(resolvedAgentsDir)) {
            logger.warn(
              `Skipping directory outside agents folder: ${dir.name}`,
            );
            continue;
          }

          const readmePath = join(agentsDir, dir.name, "README.md");
          let description = "";
          const status = "active";

          try {
            const readmeContent = await fs.readFile(readmePath, "utf-8");
            const titleMatch = readmeContent.match(/^#\s+(.+)$/m);
            if (titleMatch) {
              description = titleMatch[1];
            }
          } catch {
            // README not found, use directory name
            description = dir.name;
          }

          agents.push({
            id: dir.name,
            name: description || dir.name,
            status,
            lastActive: new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      logger.error("Error reading agents directory:", error);
    }

    res.json({
      success: true,
      data: {
        agents,
        totalAgents: agents.length,
        activeAgents: agents.filter((a) => a.status === "active").length,
        systemStatus: "operational",
      },
    });
  } catch (error) {
    logger.error("Agent status fetch error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch agent status",
    });
  }
});

/**
 * Trigger automated deployment
 * POST /api/dashboard/deploy
 * Requires authentication
 */
router.post(
  "/deploy",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { target, environment = "production" } = req.body;

      if (!["dashboard", "chrome", "full"].includes(target)) {
        return res.status(400).json({
          success: false,
          error:
            "Invalid deployment target. Must be: dashboard, chrome, or full",
        });
      }

      logger.info(`Deployment requested: target=${target}, env=${environment}`);

      // Execute deployment script based on target
      let command = "";
      let description = "";

      switch (target) {
        case "dashboard":
          command = 'npm run build && echo "Dashboard built successfully"';
          description = "Building dashboard UI";
          break;
        case "chrome":
          command =
            'npm run build:chrome && echo "Chrome extension built successfully"';
          description = "Building Chrome extension";
          break;
        case "full":
          command = "bash one-click-deploy.sh > /tmp/deployment.log 2>&1 &";
          description = "Running full stack deployment";
          break;
      }

      // Start deployment asynchronously
      exec(command, { cwd: process.cwd() }, (error) => {
        if (error) {
          logger.error(`Deployment failed for ${target}:`, error);
        } else {
          logger.info(`Deployment completed for ${target}`);
        }
      });

      res.json({
        success: true,
        data: {
          target,
          environment,
          status: "started",
          message: `${description} started`,
          command: target === "full" ? "one-click-deploy.sh" : command,
        },
      });

      logger.info(`Deployment initiated for ${target}`);
    } catch (error) {
      logger.error("Deployment trigger error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to trigger deployment",
      });
    }
  },
);

/**
 * Check deployment status
 * GET /api/dashboard/deploy/status
 * Requires authentication
 */
router.get(
  "/deploy/status",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Check if deployment processes are running
      const { stdout: processes } = await execAsync(
        'ps aux | grep -E "one-click-deploy|npm run build" | grep -v grep || echo ""',
      );

      const isDeploying = processes.trim().length > 0;

      // Check if deployment log exists
      let lastDeployment = null;
      try {
        const logPath = "/tmp/deployment.log";
        const stats = await fs.stat(logPath);
        lastDeployment = {
          timestamp: stats.mtime,
          logPath,
        };
      } catch {
        // No deployment log found
      }

      res.json({
        success: true,
        data: {
          isDeploying,
          lastDeployment,
          environment: process.env.NODE_ENV || "development",
          ready: !isDeploying,
        },
      });
    } catch (error) {
      logger.error("Deployment status check error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to check deployment status",
      });
    }
  },
);

/**
 * MISSING ENDPOINT 1: Dashboard metrics alias
 * GET /api/metrics/dashboard
 * Alias for /api/dashboard/metrics (frontend compatibility)
 */
router.get(
  "/metrics/dashboard",
  publicStatsLimiter,
  async (req, res: Response) => {
    try {
      // Get system-wide statistics (public endpoint)
      const agentsPath = resolve(process.cwd(), ".github", "agents");
      let totalAgents = 0;

      try {
        const agentDirs = await fs.readdir(agentsPath, { withFileTypes: true });
        totalAgents = agentDirs.filter((dir) => dir.isDirectory()).length;
      } catch (error) {
        logger.warn("Could not read agents directory", { error });
      }

      let runningWorkflows = 0;
      let completedToday = 0;
      let successRate = 0;

      try {
        const runningResult = await db.query(
          `SELECT COUNT(*) as count FROM executions WHERE status IN ('pending', 'running')`,
        );
        runningWorkflows = parseInt(runningResult.rows[0]?.count || "0");

        const completedResult = await db.query(
          `SELECT COUNT(*) as count FROM executions
         WHERE status = 'completed' 
         AND DATE(created_at) = CURRENT_DATE`,
        );
        completedToday = parseInt(completedResult.rows[0]?.count || "0");

        const successResult = await db.query(
          `SELECT
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful,
          COUNT(*) as total
         FROM (
           SELECT status FROM executions 
           WHERE status IN ('completed', 'failed')
           ORDER BY created_at DESC 
           LIMIT 100
         ) recent_executions`,
        );
        const successful = parseInt(successResult.rows[0]?.successful || "0");
        const total = parseInt(successResult.rows[0]?.total || "0");
        successRate = total > 0 ? Math.round((successful / total) * 100) : 0;
      } catch (dbError) {
        logger.warn("Database query failed, using fallback values", {
          error: dbError,
        });
      }

      const metrics = {
        activeAgents: totalAgents,
        runningWorkflows,
        completedToday,
        successRate,
      };

      res.json(metrics);
      logger.info("Dashboard metrics retrieved (via alias)", { metrics });
    } catch (error) {
      logger.error("Dashboard metrics fetch error:", error);
      res.status(500).json({
        activeAgents: 0,
        runningWorkflows: 0,
        completedToday: 0,
        successRate: 0,
      });
    }
  },
);

/**
 * MISSING ENDPOINT 2: Recent activity feed
 * GET /api/activity/recent
 * Public endpoint with rate limiting
 */
router.get(
  "/activity/recent",
  publicStatsLimiter,
  async (req, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;

      // Query recent workflow executions and agent tasks
      const activities: any[] = [];

      try {
        const executionsResult = await db.query(
          `SELECT
          'workflow' as type,
          e.id,
          e.status,
          e.created_at,
          COALESCE(sw.name, 'Unnamed Workflow') as name
         FROM executions e
         LEFT JOIN saved_workflows sw ON e.workflow_id = sw.id
         ORDER BY e.created_at DESC
         LIMIT $1`,
          [limit],
        );

        activities.push(...executionsResult.rows);
      } catch (dbError) {
        logger.warn("Could not fetch workflow executions", { error: dbError });
      }

      // Sort by created_at descending
      activities.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );

      res.json({
        success: true,
        data: activities.slice(0, limit),
        total: activities.length,
      });

      logger.info("Recent activity retrieved", { count: activities.length });
    } catch (error) {
      logger.error("Activity feed fetch error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch recent activity",
        data: [],
      });
    }
  },
);

/**
 * MISSING ENDPOINT 3: Performance metrics
 * GET /api/metrics/performance
 * Returns system performance data
 */
router.get(
  "/metrics/performance",
  publicStatsLimiter,
  async (req, res: Response) => {
    try {
      const metrics = {
        cpu: {
          usage: process.cpuUsage(),
          loadAverage: os.loadavg(),
        },
        memory: {
          used: process.memoryUsage().heapUsed,
          total: process.memoryUsage().heapTotal,
          rss: process.memoryUsage().rss,
          external: process.memoryUsage().external,
          percentage:
            (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) *
            100,
        },
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      };

      res.json({
        success: true,
        data: metrics,
      });

      logger.debug("Performance metrics retrieved", {
        memoryUsage: metrics.memory.percentage,
      });
    } catch (error) {
      logger.error("Performance metrics fetch error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch performance metrics",
      });
    }
  },
);

/**
 * MISSING ENDPOINT 4: Resource usage metrics
 * GET /api/metrics/resources
 * Returns detailed resource usage
 */
router.get(
  "/metrics/resources",
  publicStatsLimiter,
  async (req, res: Response) => {
    try {
      const resources = {
        cpu: {
          count: os.cpus().length,
          model: os.cpus()[0]?.model || "Unknown",
          speed: os.cpus()[0]?.speed || 0,
          loadAverage: os.loadavg(),
        },
        memory: {
          total: os.totalmem(),
          free: os.freemem(),
          used: os.totalmem() - os.freemem(),
          usagePercentage:
            ((os.totalmem() - os.freemem()) / os.totalmem()) * 100,
        },
        process: {
          memoryUsage: process.memoryUsage(),
          cpuUsage: process.cpuUsage(),
          uptime: process.uptime(),
        },
        system: {
          platform: os.platform(),
          arch: os.arch(),
          hostname: os.hostname(),
          uptime: os.uptime(),
        },
        timestamp: new Date().toISOString(),
      };

      res.json({
        success: true,
        data: resources,
      });

      logger.debug("Resource metrics retrieved");
    } catch (error) {
      logger.error("Resource metrics fetch error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch resource metrics",
      });
    }
  },
);

/**
 * MISSING ENDPOINT 5: Error logs
 * GET /api/logs/errors
 * Returns recent error logs (requires authentication)
 */
router.get(
  "/logs/errors",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;

      // In production, this would query a logging database or service
      // For now, return structured error log format
      const errors: any[] = [];

      try {
        // Try to read from database if error_logs table exists
        const errorResult = await db.query(
          `SELECT id, level, message, stack, timestamp, context
         FROM error_logs
         ORDER BY timestamp DESC
         LIMIT $1`,
          [limit],
        );

        errors.push(...errorResult.rows);
      } catch (dbError) {
        // Table might not exist, return empty array
        logger.warn("Error logs table not found or inaccessible", {
          error: dbError,
        });
      }

      res.json({
        success: true,
        data: errors,
        total: errors.length,
      });

      logger.info("Error logs retrieved", { count: errors.length });
    } catch (error) {
      logger.error("Error logs fetch error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch error logs",
        data: [],
      });
    }
  },
);

export default router;
