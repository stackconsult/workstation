/**
 * Workflow Templates API Routes
 * Endpoints for browsing and loading pre-built workflow templates
 */

import { Router, Request, Response } from "express";
import {
  WORKFLOW_TEMPLATES,
  TEMPLATE_CATEGORIES,
  getTemplateById,
  getTemplatesByCategory,
  searchTemplates,
} from "../workflow-templates";
import { logger } from "../utils/logger";

const router = Router();

/**
 * Get all workflow templates
 * GET /api/workflow-templates
 * Query params:
 *   - category: Filter by category
 *   - complexity: Filter by complexity (beginner|intermediate|advanced)
 *   - search: Search by name, description, or tags
 */
router.get("/", (req: Request, res: Response) => {
  try {
    const { category, complexity, search } = req.query;

    let templates = WORKFLOW_TEMPLATES;

    // Filter by category
    if (category && typeof category === "string") {
      templates = getTemplatesByCategory(category);
    }

    // Filter by complexity
    if (complexity && typeof complexity === "string") {
      if (
        complexity === "beginner" ||
        complexity === "intermediate" ||
        complexity === "advanced"
      ) {
        templates = templates.filter((t) => t.complexity === complexity);
      }
    }

    // Search
    if (search && typeof search === "string") {
      templates = searchTemplates(search);
    }

    logger.info("Fetched workflow templates", {
      count: templates.length,
      filters: { category, complexity, search },
    });

    res.json({
      success: true,
      data: {
        templates,
        totalCount: templates.length,
        categories: TEMPLATE_CATEGORIES,
      },
    });
  } catch (error) {
    logger.error("Error fetching workflow templates", { error });
    res.status(500).json({
      success: false,
      error: "Failed to fetch workflow templates",
    });
  }
});

/**
 * Get template categories
 * GET /api/workflow-templates/categories
 */
router.get("/categories", (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: TEMPLATE_CATEGORIES,
    });
  } catch (error) {
    logger.error("Error fetching template categories", { error });
    res.status(500).json({
      success: false,
      error: "Failed to fetch template categories",
    });
  }
});

/**
 * Get specific template by ID
 * GET /api/workflow-templates/:id
 */
router.get("/:id", (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const template = getTemplateById(id);

    if (!template) {
      return res.status(404).json({
        success: false,
        error: "Template not found",
      });
    }

    logger.info("Fetched workflow template", { templateId: id });

    res.json({
      success: true,
      data: template,
    });
  } catch (error) {
    logger.error("Error fetching workflow template", { error });
    res.status(500).json({
      success: false,
      error: "Failed to fetch workflow template",
    });
  }
});

/**
 * Clone a template (create new workflow from template)
 * POST /api/workflow-templates/:id/clone
 * Body:
 *   - name: Custom name for the new workflow (optional)
 *   - customParams: Custom parameters to override defaults (optional)
 */
router.post("/:id/clone", (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, customParams } = req.body;

    const template = getTemplateById(id);

    if (!template) {
      return res.status(404).json({
        success: false,
        error: "Template not found",
      });
    }

    // Create a new workflow based on the template
    const newWorkflow = {
      ...template,
      id: `workflow-${Date.now()}`,
      name: name || `${template.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isTemplate: false,
      // Apply custom parameters if provided
      nodes: template.nodes.map((node) => ({
        ...node,
        params: customParams?.[node.id] || node.params,
      })),
    };

    logger.info("Cloned workflow template", {
      templateId: id,
      newWorkflowId: newWorkflow.id,
    });

    res.json({
      success: true,
      data: newWorkflow,
      message: "Template cloned successfully",
    });
  } catch (error) {
    logger.error("Error cloning workflow template", { error });
    res.status(500).json({
      success: false,
      error: "Failed to clone workflow template",
    });
  }
});

export default router;
