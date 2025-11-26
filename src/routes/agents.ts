/**
 * Agent Management Routes
 * API endpoints for managing agents and tasks
 */

import { Router, Response } from "express";
import { authenticateToken, AuthenticatedRequest } from "../auth/jwt";
import { agentOrchestrator } from "../services/agent-orchestrator";
import { logger } from "../utils/logger";

const router = Router();

/**
 * Get all agents
 * GET /api/agents
 */
router.get(
  "/",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const agents = await agentOrchestrator.getAllAgents();

      res.json({
        success: true,
        data: {
          agents,
          total: agents.length,
        },
      });

      logger.info(`Retrieved ${agents.length} agents`);
    } catch (error) {
      logger.error("Agents fetch error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch agents",
      });
    }
  },
);

/**
 * Get specific agent details
 * GET /api/agents/:id
 */
router.get(
  "/:id",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const agent = await agentOrchestrator.getAgent(id);

      if (!agent) {
        return res.status(404).json({
          success: false,
          error: "Agent not found",
        });
      }

      // Get agent statistics
      const stats = await agentOrchestrator.getAgentStatistics(id);

      res.json({
        success: true,
        data: {
          agent,
          statistics: stats,
        },
      });

      logger.info(`Retrieved agent ${id} details`);
    } catch (error) {
      logger.error("Agent fetch error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch agent",
      });
    }
  },
);

/**
 * Start an agent
 * POST /api/agents/:id/start
 */
router.post(
  "/:id/start",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      await agentOrchestrator.startAgent(id);

      res.json({
        success: true,
        message: `Agent ${id} started successfully`,
      });

      logger.info(`Agent ${id} started by user ${userId}`);
    } catch (error) {
      logger.error("Agent start error:", error);
      res.status(500).json({
        success: false,
        error: (error as Error).message || "Failed to start agent",
      });
    }
  },
);

/**
 * Stop an agent
 * POST /api/agents/:id/stop
 */
router.post(
  "/:id/stop",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      await agentOrchestrator.stopAgent(id);

      res.json({
        success: true,
        message: `Agent ${id} stopped successfully`,
      });

      logger.info(`Agent ${id} stopped by user ${userId}`);
    } catch (error) {
      logger.error("Agent stop error:", error);
      res.status(500).json({
        success: false,
        error: (error as Error).message || "Failed to stop agent",
      });
    }
  },
);

/**
 * Update agent health status
 * POST /api/agents/:id/health
 */
router.post(
  "/:id/health",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { healthStatus, metadata } = req.body;

      if (!healthStatus) {
        return res.status(400).json({
          success: false,
          error: "Health status is required",
        });
      }

      await agentOrchestrator.updateAgentHealth(
        id,
        healthStatus,
        metadata || {},
      );

      res.json({
        success: true,
        message: `Agent ${id} health updated to ${healthStatus}`,
      });

      logger.info(`Agent ${id} health updated to ${healthStatus}`);
    } catch (error) {
      logger.error("Agent health update error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update agent health",
      });
    }
  },
);

/**
 * Create a new agent task
 * POST /api/agents/tasks
 */
router.post(
  "/tasks",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      const { agentId, type, payload, priority = 5 } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized",
        });
      }

      if (!agentId || !type || !payload) {
        return res.status(400).json({
          success: false,
          error: "Agent ID, type, and payload are required",
        });
      }

      const taskId = await agentOrchestrator.createTask(
        agentId,
        type,
        payload,
        userId,
        priority,
      );

      res.status(201).json({
        success: true,
        data: {
          taskId,
        },
        message: "Task created successfully",
      });

      logger.info(
        `Task ${taskId} created for agent ${agentId} by user ${userId}`,
      );
    } catch (error) {
      logger.error("Task creation error:", error);
      res.status(500).json({
        success: false,
        error: (error as Error).message || "Failed to create task",
      });
    }
  },
);

/**
 * Get task status
 * GET /api/agents/tasks/:id
 */
router.get(
  "/tasks/:id",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const task = await agentOrchestrator.getTaskStatus(id);

      if (!task) {
        return res.status(404).json({
          success: false,
          error: "Task not found",
        });
      }

      res.json({
        success: true,
        data: task,
      });

      logger.info(`Task ${id} status retrieved`);
    } catch (error) {
      logger.error("Task status fetch error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch task status",
      });
    }
  },
);

/**
 * Get all tasks for an agent
 * GET /api/agents/:id/tasks
 */
router.get(
  "/:id/tasks",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { limit = 50 } = req.query;

      const tasks = await agentOrchestrator.getAgentTasks(
        id,
        parseInt(limit as string),
      );

      res.json({
        success: true,
        data: {
          tasks,
          total: tasks.length,
        },
      });

      logger.info(`Retrieved ${tasks.length} tasks for agent ${id}`);
    } catch (error) {
      logger.error("Agent tasks fetch error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch agent tasks",
      });
    }
  },
);

/**
 * Get agent statistics
 * GET /api/agents/:id/statistics
 */
router.get(
  "/:id/statistics",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const stats = await agentOrchestrator.getAgentStatistics(id);

      res.json({
        success: true,
        data: stats,
      });

      logger.info(`Retrieved statistics for agent ${id}`);
    } catch (error) {
      logger.error("Agent statistics fetch error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch agent statistics",
      });
    }
  },
);

/**
 * Get system overview (all agents status)
 * GET /api/agents/system/overview
 */
router.get(
  "/system/overview",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const agents = await agentOrchestrator.getAllAgents();
      const pendingTasks = await agentOrchestrator.getPendingTasksCount();

      const overview = {
        totalAgents: agents.length,
        runningAgents: agents.filter((a) => a.status === "running").length,
        stoppedAgents: agents.filter((a) => a.status === "stopped").length,
        healthyAgents: agents.filter((a) => a.healthStatus === "healthy")
          .length,
        unhealthyAgents: agents.filter((a) => a.healthStatus !== "healthy")
          .length,
        pendingTasks,
      };

      res.json({
        success: true,
        data: overview,
      });

      logger.info("System overview retrieved");
    } catch (error) {
      logger.error("System overview fetch error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch system overview",
      });
    }
  },
);

export default router;
