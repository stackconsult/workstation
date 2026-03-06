/**
 * Context-Memory Intelligence Layer API Routes
 * Endpoints for entity tracking, workflow history, and learning suggestions
 */

import { Router, Request, Response } from "express";
import { authenticateToken } from "../auth/jwt";
import { logger } from "../utils/logger";
import {
  getEntityStore,
  getWorkflowHistory,
  getLearningModel,
} from "../intelligence/context-memory";

const router = Router();

/**
 * Get entity statistics
 * GET /api/v2/context/entities/stats
 */
router.get(
  "/entities/stats",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const entityStore = getEntityStore();
      const stats = await entityStore.getStatistics();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error("Failed to get entity statistics", { error });
      res.status(500).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to get entity statistics",
      });
    }
  },
);

/**
 * Query entities
 * GET /api/v2/context/entities
 */
router.get(
  "/entities",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const entityStore = getEntityStore();

      // Parse and validate type
      let entityType:
        | "file"
        | "repository"
        | "issue"
        | "pr"
        | "agent"
        | "workflow"
        | "user"
        | "custom"
        | undefined;
      if (req.query.type) {
        const validTypes = [
          "file",
          "repository",
          "issue",
          "pr",
          "agent",
          "workflow",
          "user",
          "custom",
        ];
        if (validTypes.includes(req.query.type as string)) {
          entityType = req.query.type as typeof entityType;
        }
      }

      // Validate numeric query parameters
      const minImportanceParam = req.query.min_importance
        ? Number(req.query.min_importance)
        : undefined;
      const min_importance =
        typeof minImportanceParam === "number" && !isNaN(minImportanceParam)
          ? minImportanceParam
          : undefined;

      const limitParam = req.query.limit ? Number(req.query.limit) : 100;
      const limit = !isNaN(limitParam) && limitParam > 0 ? limitParam : 100;

      const offsetParam = req.query.offset ? Number(req.query.offset) : 0;
      const offset = !isNaN(offsetParam) && offsetParam >= 0 ? offsetParam : 0;

      const options = {
        type: entityType,
        tags: req.query.tags
          ? (req.query.tags as string).split(",")
          : undefined,
        workflow_id: req.query.workflow_id as string | undefined,
        min_importance,
        limit,
        offset,
        sort_by: req.query.sort_by as
          | "importance"
          | "access_count"
          | "last_seen"
          | undefined,
        sort_order: req.query.sort_order as "asc" | "desc" | undefined,
      };

      const entities = await entityStore.queryEntities(options);

      res.json({
        success: true,
        data: entities,
        count: entities.length,
      });
    } catch (error) {
      logger.error("Failed to query entities", { error });
      res.status(500).json({
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to query entities",
      });
    }
  },
);

/**
 * Get entity by ID
 * GET /api/v2/context/entities/:id
 */
router.get(
  "/entities/:id",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const entityStore = getEntityStore();
      const stats = await entityStore.getStatistics();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error("Failed to get entity statistics", { error });
      res.status(500).json({
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to get statistics",
      });
    }
  },
);

/**
 * Get workflow history
 * GET /api/v2/context/history
 */
router.get(
  "/history",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const workflowHistory = getWorkflowHistory();
      const options = {
        workflow_id: req.query.workflow_id as string | undefined,
        status: req.query.status as
          | "success"
          | "failure"
          | "partial"
          | "cancelled"
          | undefined,
        start_date: req.query.start_date as string | undefined,
        end_date: req.query.end_date as string | undefined,
        limit: req.query.limit ? Number(req.query.limit) : 50,
        offset: req.query.offset ? Number(req.query.offset) : 0,
      };

      const history = await workflowHistory.queryHistory(options);

      res.json({
        success: true,
        data: history,
        count: history.length,
      });
    } catch (error) {
      logger.error("Failed to query workflow history", { error });
      res.status(500).json({
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to query history",
      });
    }
  },
);

/**
 * Get workflow statistics
 * GET /api/v2/context/history/:workflowId/stats
 */
router.get(
  "/history/:workflowId/stats",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const workflowHistory = getWorkflowHistory();
      const stats = await workflowHistory.getWorkflowStatistics(
        req.params.workflowId,
      );

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error("Failed to get workflow statistics", {
        error,
        workflowId: req.params.workflowId,
      });
      res.status(500).json({
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to get statistics",
      });
    }
  },
);

/**
 * Get workflow patterns
 * GET /api/v2/context/patterns/:workflowId
 */
router.get(
  "/patterns/:workflowId",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const workflowHistory = getWorkflowHistory();
      const patterns = await workflowHistory.getWorkflowPatterns(
        req.params.workflowId,
      );

      res.json({
        success: true,
        data: patterns,
      });
    } catch (error) {
      logger.error("Failed to get workflow patterns", {
        error,
        workflowId: req.params.workflowId,
      });
      res.status(500).json({
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to get patterns",
      });
    }
  },
);

/**
 * Get all patterns
 * GET /api/v2/context/patterns
 */
router.get(
  "/patterns",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const workflowHistory = getWorkflowHistory();
      const minConfidence = req.query.min_confidence
        ? Number(req.query.min_confidence)
        : 0.5;
      const patterns = await workflowHistory.getAllPatterns(minConfidence);

      res.json({
        success: true,
        data: patterns,
      });
    } catch (error) {
      logger.error("Failed to get all patterns", { error });
      res.status(500).json({
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to get patterns",
      });
    }
  },
);

/**
 * Get workflow suggestions
 * GET /api/v2/context/suggestions/:workflowId
 */
router.get(
  "/suggestions/:workflowId",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const learningModel = getLearningModel();
      const suggestions = await learningModel.getWorkflowSuggestions(
        req.params.workflowId,
      );

      res.json({
        success: true,
        data: suggestions,
      });
    } catch (error) {
      logger.error("Failed to get suggestions", {
        error,
        workflowId: req.params.workflowId,
      });
      res.status(500).json({
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to get suggestions",
      });
    }
  },
);

/**
 * Apply suggestion with feedback
 * POST /api/v2/context/suggestions/:id/apply
 */
router.post(
  "/suggestions/:id/apply",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      // Validate request body
      if (!req.body || typeof req.body !== "object") {
        return res.status(400).json({
          success: false,
          error: "Invalid request body",
        });
      }

      const learningModel = getLearningModel();
      await learningModel.applySuggestion(req.params.id, req.body);

      res.json({
        success: true,
        message: "Suggestion applied successfully",
      });
    } catch (error) {
      logger.error("Failed to apply suggestion", {
        error,
        suggestionId: req.params.id,
      });
      res.status(500).json({
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to apply suggestion",
      });
    }
  },
);

/**
 * Train learning model
 * POST /api/v2/context/models/train
 */
router.post(
  "/models/train",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      // Validate request body
      if (!req.body || typeof req.body !== "object") {
        return res.status(400).json({
          success: false,
          error: "Invalid request body",
        });
      }

      const learningModel = getLearningModel();
      const model = await learningModel.trainModel(req.body);

      res.json({
        success: true,
        data: model,
      });
    } catch (error) {
      logger.error("Failed to train model", { error });
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to train model",
      });
    }
  },
);

export default router;
