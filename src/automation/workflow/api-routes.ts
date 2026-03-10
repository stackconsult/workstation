/**
 * Workflow API Routes
 *
 * REST API endpoints for workflow management including templates,
 * execution, and real-time monitoring.
 *
 * @module automation/workflow/api-routes
 * @version 2.0.0
 */

import { Router, Request, Response } from "express";
import { workflowService } from "./service.js";
import { logger } from "../../shared/utils/logger.js";
import { TemplateLoader } from "./template-loader.js";
import { ExecutionEngine } from "./execution-engine.js";
import { StateManager } from "./state-manager.js";

const router = Router();

// Initialize services
const templateLoader = new TemplateLoader();
const executionEngine = new ExecutionEngine();
const stateManager = new StateManager();

/**
 * GET /api/workflows/templates
 * Fetch all workflow templates
 */
router.get("/templates", async (req: Request, res: Response) => {
  try {
    const { category, difficulty } = req.query;

    // Use TemplateLoader to get real templates
    let templates = templateLoader.getAllTemplates();

    // Filter by category if provided
    if (category && typeof category === "string") {
      templates = templateLoader.getTemplatesByCategory(category);
    }

    // Filter by difficulty if provided
    if (difficulty && typeof difficulty === "string") {
      templates = templates.filter((t) => t.difficulty === difficulty);
    }

    logger.info("Fetched workflow templates", {
      count: templates.length,
      category,
      difficulty,
    });

    res.json({
      success: true,
      data: templates,
      count: templates.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Failed to fetch templates", {
      error: (error as Error).message,
    });
    res.status(500).json({
      success: false,
      error: (error as Error).message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/workflows/templates/:templateId
 * Fetch specific workflow template
 */
router.get("/templates/:templateId", async (req: Request, res: Response) => {
  try {
    const { templateId } = req.params;

    // Use TemplateLoader to get specific template
    const template = templateLoader.getTemplate(templateId);

    if (!template) {
      return res.status(404).json({
        success: false,
        error: "Template not found",
        timestamp: new Date().toISOString(),
      });
    }

    logger.info("Fetched template", { templateId });

    res.json({
      success: true,
      data: template,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Failed to fetch template", {
      error: (error as Error).message,
    });
    res.status(500).json({
      success: false,
      error: (error as Error).message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * POST /api/workflows/templates/:templateId/create
 * Create workflow from template
 */
router.post(
  "/templates/:templateId/create",
  async (req: Request, res: Response) => {
    try {
      const { templateId } = req.params;
      const { name, owner_id } = req.body;

      // Get template from loader
      const template = templateLoader.getTemplate(templateId);
      if (!template) {
        return res.status(404).json({
          success: false,
          error: "Template not found",
          timestamp: new Date().toISOString(),
        });
      }

      // Use template's definition directly (already contains steps)
      const workflow = await workflowService.createWorkflow({
        name: name || template.name,
        description: template.description,
        definition: template.definition,
        owner_id: owner_id || "system",
        workspace_id: "default",
      });

      logger.info("Workflow created from template", {
        templateId,
        workflowId: workflow.id,
      });

      res.json({
        success: true,
        data: workflow,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Failed to create workflow from template", {
        error: (error as Error).message,
      });
      res.status(500).json({
        success: false,
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      });
    }
  },
);

/**
 * POST /api/workflows/:workflowId/execute
 * Execute workflow
 */
router.post("/:workflowId/execute", async (req: Request, res: Response) => {
  try {
    const { workflowId } = req.params;
    const { variables } = req.body;

    const workflow = await workflowService.getWorkflow(workflowId);
    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: "Workflow not found",
        timestamp: new Date().toISOString(),
      });
    }

    // Generate execution ID
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Create state for this execution
    const totalSteps = workflow.definition.steps?.length || 0;
    stateManager.createState(
      executionId,
      workflowId,
      totalSteps,
      variables || {},
    );
    stateManager.updateState(executionId, { status: "running" });

    // Execute workflow using ExecutionEngine (async)
    executionEngine
      .execute(workflowId, executionId, workflow.definition, variables || {})
      .then((result) => {
        stateManager.updateState(executionId, {
          status: "completed",
          progress: 100,
        });
        logger.info("Workflow execution completed", {
          workflowId,
          executionId,
          status: result.status,
        });
      })
      .catch((error) => {
        stateManager.updateState(executionId, {
          status: "failed",
          error: error.message,
        });
        logger.error("Workflow execution failed", {
          workflowId,
          executionId,
          error: error.message,
        });
      });

    logger.info("Workflow execution started", { workflowId, executionId });

    res.json({
      success: true,
      data: {
        executionId,
        workflowId,
        status: "running",
        progress: 0,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Failed to execute workflow", {
      error: (error as Error).message,
    });
    res.status(500).json({
      success: false,
      error: (error as Error).message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/workflows/executions/:executionId
 * Get execution status
 */
router.get("/executions/:executionId", async (req: Request, res: Response) => {
  try {
    const { executionId } = req.params;

    // Get execution state from StateManager
    const state = stateManager.getState(executionId);

    if (!state) {
      return res.status(404).json({
        success: false,
        error: "Execution not found",
        timestamp: new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      data: {
        executionId,
        status: state.status,
        progress: state.progress,
        currentStep: state.currentStep,
        totalSteps: state.totalSteps,
        error: state.error,
        startedAt: state.startedAt,
        completedAt: state.completedAt,
        updatedAt: state.updatedAt,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Failed to get execution status", {
      error: (error as Error).message,
    });
    res.status(500).json({
      success: false,
      error: (error as Error).message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/workflows
 * List all workflows
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const { owner_id } = req.query;
    const workflows = await workflowService.listWorkflows(owner_id as string);

    res.json({
      success: true,
      data: workflows,
      count: workflows.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Failed to list workflows", {
      error: (error as Error).message,
    });
    res.status(500).json({
      success: false,
      error: (error as Error).message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/workflows/:workflowId
 * Get specific workflow
 */
router.get("/:workflowId", async (req: Request, res: Response) => {
  try {
    const { workflowId } = req.params;
    const workflow = await workflowService.getWorkflow(workflowId);

    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: "Workflow not found",
        timestamp: new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      data: workflow,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Failed to get workflow", { error: (error as Error).message });
    res.status(500).json({
      success: false,
      error: (error as Error).message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * PUT /api/workflows/:workflowId
 * Update workflow
 */
router.put("/:workflowId", async (req: Request, res: Response) => {
  try {
    const { workflowId } = req.params;
    const updates = req.body;

    const workflow = await workflowService.updateWorkflow(workflowId, updates);

    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: "Workflow not found",
        timestamp: new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      data: workflow,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Failed to update workflow", {
      error: (error as Error).message,
    });
    res.status(500).json({
      success: false,
      error: (error as Error).message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * DELETE /api/workflows/:workflowId
 * Delete workflow
 */
router.delete("/:workflowId", async (req: Request, res: Response) => {
  try {
    const { workflowId } = req.params;
    const deleted = await workflowService.deleteWorkflow(workflowId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: "Workflow not found",
        timestamp: new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      message: "Workflow deleted",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Failed to delete workflow", {
      error: (error as Error).message,
    });
    res.status(500).json({
      success: false,
      error: (error as Error).message,
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
