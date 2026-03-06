/**
 * Workflows Routes
 * CRUD operations for saved workflows
 */

import { Router, Response } from "express";
import { authenticateToken, AuthenticatedRequest } from "../auth/jwt";
import db from "../db/connection";
import { logger } from "../utils/logger";

const router = Router();

/**
 * Get all user workflows
 * GET /api/workflows
 * Supports status filter query parameter
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

      const {
        category,
        status,
        sortBy = "updated_at",
        order = "DESC",
        limit = 50,
        offset = 0,
      } = req.query;

      let query = `
      SELECT 
        sw.id,
        sw.name,
        sw.description,
        sw.category,
        sw.actions,
        sw.is_template,
        sw.total_executions,
        sw.successful_executions,
        sw.avg_duration_ms,
        sw.created_at,
        sw.updated_at,
        COALESCE(
          (SELECT status FROM executions WHERE workflow_id = sw.id ORDER BY created_at DESC LIMIT 1),
          'idle'
        ) as current_status
      FROM saved_workflows sw
      WHERE sw.user_id = $1
    `;

      const queryParams: any[] = [userId];

      // Filter by category if provided
      if (category) {
        queryParams.push(category);
        query += ` AND sw.category = $${queryParams.length}`;
      }

      // Filter by status if provided (requires subquery)
      if (status) {
        queryParams.push(status);
        query += ` AND COALESCE(
        (SELECT status FROM executions WHERE workflow_id = sw.id ORDER BY created_at DESC LIMIT 1),
        'idle'
      ) = $${queryParams.length}`;
      }

      // Add sorting
      const sortFieldMap: { [key: string]: string } = {
        created_at: "sw.created_at",
        updated_at: "sw.updated_at",
        name: "sw.name",
        total_executions: "sw.total_executions",
        avg_duration_ms: "sw.avg_duration_ms",
      };
      const orderMap: { [key: string]: "ASC" | "DESC" } = {
        ASC: "ASC",
        DESC: "DESC",
      };

      const sortField = sortFieldMap[sortBy as string] ?? "sw.updated_at";
      const sortOrder = orderMap[(order as string).toUpperCase()] ?? "DESC";

      query += ` ORDER BY ${sortField} ${sortOrder}`;

      // Add pagination
      queryParams.push(limit, offset);
      query += ` LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}`;

      const result = await db.query(query, queryParams);

      // Get total count
      let countQuery =
        "SELECT COUNT(*) FROM saved_workflows WHERE user_id = $1";
      const countParams: any[] = [userId];

      if (category) {
        countParams.push(category);
        countQuery += ` AND category = $${countParams.length}`;
      }

      if (status) {
        countParams.push(status);
        countQuery += ` AND COALESCE(
        (SELECT status FROM executions WHERE workflow_id = saved_workflows.id ORDER BY created_at DESC LIMIT 1),
        'idle'
      ) = $${countParams.length}`;
      }

      const countResult = await db.query(countQuery, countParams);
      const totalCount = parseInt(countResult.rows[0].count);

      res.json({
        success: true,
        data: {
          workflows: result.rows,
          pagination: {
            total: totalCount,
            limit: parseInt(limit as string),
            offset: parseInt(offset as string),
            hasMore:
              parseInt(offset as string) + result.rows.length < totalCount,
          },
          filters: {
            category: category || null,
            status: status || null,
          },
        },
      });

      logger.info(
        `Retrieved ${result.rows.length} workflows for user ${userId}${status ? ` (filtered by status: ${status})` : ""}`,
      );
    } catch (error) {
      logger.error("Workflows fetch error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch workflows",
      });
    }
  },
);

/**
 * Get single workflow by ID
 * GET /api/workflows/:id
 */
router.get(
  "/:id",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized",
        });
      }

      const result = await db.query(
        `SELECT * FROM saved_workflows
       WHERE id = $1 AND user_id = $2`,
        [id, userId],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Workflow not found",
        });
      }

      res.json({
        success: true,
        data: result.rows[0],
      });

      logger.info(`Workflow ${id} retrieved for user ${userId}`);
    } catch (error) {
      logger.error("Workflow fetch error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch workflow",
      });
    }
  },
);

/**
 * Create new workflow
 * POST /api/workflows
 */
router.post(
  "/",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      const {
        name,
        description,
        category,
        actions,
        isTemplate = false,
      } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized",
        });
      }

      // Validation
      if (!name || !actions) {
        return res.status(400).json({
          success: false,
          error: "Name and actions are required",
        });
      }

      if (!Array.isArray(actions)) {
        return res.status(400).json({
          success: false,
          error: "Actions must be an array",
        });
      }

      const result = await db.query(
        `INSERT INTO saved_workflows
        (user_id, name, description, category, actions, is_template)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
        [
          userId,
          name,
          description || null,
          category || "general",
          JSON.stringify(actions),
          isTemplate,
        ],
      );

      res.status(201).json({
        success: true,
        data: result.rows[0],
        message: "Workflow created successfully",
      });

      logger.info(`Workflow created: ${result.rows[0].id} by user ${userId}`);
    } catch (error) {
      logger.error("Workflow creation error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create workflow",
      });
    }
  },
);

/**
 * Update workflow
 * PUT /api/workflows/:id
 */
router.put(
  "/:id",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;
      const { name, description, category, actions, isTemplate } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized",
        });
      }

      // Check ownership
      const checkResult = await db.query(
        "SELECT id FROM saved_workflows WHERE id = $1 AND user_id = $2",
        [id, userId],
      );

      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Workflow not found or unauthorized",
        });
      }

      // Build update query dynamically
      const updates: string[] = [];
      const values: any[] = [];
      let paramCounter = 1;

      if (name !== undefined) {
        updates.push(`name = $${paramCounter++}`);
        values.push(name);
      }
      if (description !== undefined) {
        updates.push(`description = $${paramCounter++}`);
        values.push(description);
      }
      if (category !== undefined) {
        updates.push(`category = $${paramCounter++}`);
        values.push(category);
      }
      if (actions !== undefined) {
        if (!Array.isArray(actions)) {
          return res.status(400).json({
            success: false,
            error: "Actions must be an array",
          });
        }
        updates.push(`actions = $${paramCounter++}`);
        values.push(JSON.stringify(actions));
      }
      if (isTemplate !== undefined) {
        updates.push(`is_template = $${paramCounter++}`);
        values.push(isTemplate);
      }

      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          error: "No fields to update",
        });
      }

      // Add workflow ID and user ID to params
      values.push(id, userId);

      const query = `
      UPDATE saved_workflows 
      SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCounter++} AND user_id = $${paramCounter++}
      RETURNING *
    `;

      const result = await db.query(query, values);

      res.json({
        success: true,
        data: result.rows[0],
        message: "Workflow updated successfully",
      });

      logger.info(`Workflow ${id} updated by user ${userId}`);
    } catch (error) {
      logger.error("Workflow update error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update workflow",
      });
    }
  },
);

/**
 * Delete workflow
 * DELETE /api/workflows/:id
 */
router.delete(
  "/:id",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized",
        });
      }

      const result = await db.query(
        "DELETE FROM saved_workflows WHERE id = $1 AND user_id = $2 RETURNING id",
        [id, userId],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Workflow not found or unauthorized",
        });
      }

      res.json({
        success: true,
        message: "Workflow deleted successfully",
      });

      logger.info(`Workflow ${id} deleted by user ${userId}`);
    } catch (error) {
      logger.error("Workflow deletion error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete workflow",
      });
    }
  },
);

/**
 * Get workflow execution history
 * GET /api/workflows/:id/executions
 */
router.get(
  "/:id/executions",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;
      const { limit = 20, offset = 0 } = req.query;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized",
        });
      }

      // Check workflow ownership
      const workflowResult = await db.query(
        "SELECT id FROM saved_workflows WHERE id = $1 AND user_id = $2",
        [id, userId],
      );

      if (workflowResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Workflow not found or unauthorized",
        });
      }

      const result = await db.query(
        `SELECT
        id,
        status,
        steps_completed,
        total_steps,
        duration_ms,
        error_message,
        created_at,
        completed_at
       FROM workflow_executions
       WHERE workflow_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
        [id, limit, offset],
      );

      const countResult = await db.query(
        "SELECT COUNT(*) FROM workflow_executions WHERE workflow_id = $1",
        [id],
      );
      const totalCount = parseInt(countResult.rows[0].count);

      res.json({
        success: true,
        data: {
          executions: result.rows,
          pagination: {
            total: totalCount,
            limit: parseInt(limit as string),
            offset: parseInt(offset as string),
            hasMore:
              parseInt(offset as string) + result.rows.length < totalCount,
          },
        },
      });

      logger.info(`Execution history retrieved for workflow ${id}`);
    } catch (error) {
      logger.error("Execution history fetch error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch execution history",
      });
    }
  },
);

/**
 * MISSING ENDPOINT 8: Execute workflow
 * POST /api/workflows/:id/execute
 * Frontend compatibility endpoint
 */
router.post(
  "/:id/execute",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;
      const { inputs } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized",
        });
      }

      // Check workflow ownership
      const workflowResult = await db.query(
        "SELECT * FROM saved_workflows WHERE id = $1 AND user_id = $2",
        [id, userId],
      );

      if (workflowResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Workflow not found or unauthorized",
        });
      }

      const workflow = workflowResult.rows[0];

      // Create execution record
      const executionResult = await db.query(
        `INSERT INTO executions
        (workflow_id, status, steps_completed, total_steps)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
        [id, "pending", 0, workflow.actions?.length || 0],
      );

      const execution = executionResult.rows[0];

      // Start workflow execution asynchronously (would integrate with actual execution engine)
      logger.info(
        `Workflow execution started: ${execution.id} for workflow ${id} by user ${userId}`,
        {
          workflowName: workflow.name,
          inputs,
        },
      );

      res.json({
        success: true,
        data: {
          executionId: execution.id,
          status: execution.status,
          workflowId: id,
          startedAt: execution.created_at,
        },
        message: "Workflow execution started",
      });

      // Update workflow statistics
      await db.query(
        `UPDATE saved_workflows
       SET total_executions = total_executions + 1, 
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
        [id],
      );

      logger.info(
        `Workflow ${id} executed by user ${userId}, execution ID: ${execution.id}`,
      );
    } catch (error) {
      logger.error("Workflow execution error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to execute workflow",
      });
    }
  },
);

export default router;
