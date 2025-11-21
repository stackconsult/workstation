/**
 * Dashboard Routes
 * User dashboard statistics, analytics, and recent activity
 */

import { Router, Response } from "express";
import { authenticateToken, AuthenticatedRequest } from "../auth/jwt";
import db from "../db/connection";
import { logger } from "../utils/logger";

const router = Router();

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

export default router;
