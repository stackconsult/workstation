/**
 * Workflow Routes Integration
 *
 * Express router for workflow-related endpoints.
 * Integrates with workflow service and execution engine.
 *
 * @module routes/workflow-routes
 * @version 2.0.0
 */

import { Router } from "express";
import workflowApiRoutes from "../automation/workflow/api-routes.js";
import { logger } from "../shared/utils/logger.js";

const router = Router();

/**
 * Mount workflow API routes
 */
router.use("/workflows", workflowApiRoutes);

/**
 * Health check for workflow system
 */
router.get("/workflows/health", (req, res) => {
  res.json({
    success: true,
    service: "workflow",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

logger.info("Workflow routes initialized");

export default router;
