/**
 * Phase 1 API Routes
 * Workflow and execution management endpoints
 */

import { Router, Request, Response } from "express";
import { workflowService } from "../automation/workflow/service";
import { orchestrationEngine } from "../automation/orchestrator/engine";
import { authenticateToken, AuthenticatedRequest } from "../auth/jwt";
import { logger } from "../utils/logger";
import { executionRateLimiter } from "../middleware/advanced-rate-limit";

const router = Router();

/**
 * Create workflow
 * POST /api/v2/workflows
 */
router.post(
  "/workflows",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const workflow = await workflowService.createWorkflow({
        ...req.body,
        owner_id: authReq.user?.userId || "anonymous",
      });

      res.status(201).json({
        success: true,
        data: workflow,
      });
    } catch (error) {
      logger.error("Failed to create workflow", { error });
      res.status(500).json({
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create workflow",
      });
    }
  },
);

/**
 * List workflows
 * GET /api/v2/workflows
 */
router.get(
  "/workflows",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const workflows = await workflowService.listWorkflows(
        authReq.user?.userId,
      );

      res.json({
        success: true,
        data: workflows,
      });
    } catch (error) {
      logger.error("Failed to list workflows", { error });
      res.status(500).json({
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to list workflows",
      });
    }
  },
);

/**
 * Get workflow by ID
 * GET /api/v2/workflows/:id
 */
router.get(
  "/workflows/:id",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const workflow = await workflowService.getWorkflow(req.params.id);

      if (!workflow) {
        return res.status(404).json({
          success: false,
          error: "Workflow not found",
        });
      }

      res.json({
        success: true,
        data: workflow,
      });
    } catch (error) {
      logger.error("Failed to get workflow", { error });
      res.status(500).json({
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to get workflow",
      });
    }
  },
);

/**
 * Execute workflow
 * POST /api/v2/workflows/:id/execute
 * Rate limited: 10 executions per minute per user
 */
router.post(
  "/workflows/:id/execute",
  executionRateLimiter,
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;

      const execution = await orchestrationEngine.executeWorkflow({
        workflow_id: req.params.id,
        triggered_by: authReq.user?.userId,
        trigger_type: "manual",
        variables: req.body.variables,
      });

      res.status(202).json({
        success: true,
        data: execution,
        message: "Workflow execution started",
      });
    } catch (error) {
      logger.error("Failed to execute workflow", { error });
      res.status(500).json({
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to execute workflow",
      });
    }
  },
);

/**
 * Get execution by ID
 * GET /api/v2/executions/:id
 */
router.get(
  "/executions/:id",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const execution = await orchestrationEngine.getExecution(req.params.id);

      if (!execution) {
        return res.status(404).json({
          success: false,
          error: "Execution not found",
        });
      }

      res.json({
        success: true,
        data: execution,
      });
    } catch (error) {
      logger.error("Failed to get execution", { error });
      res.status(500).json({
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to get execution",
      });
    }
  },
);

/**
 * Get execution tasks
 * GET /api/v2/executions/:id/tasks
 */
router.get(
  "/executions/:id/tasks",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const tasks = await orchestrationEngine.getExecutionTasks(req.params.id);

      res.json({
        success: true,
        data: tasks,
      });
    } catch (error) {
      logger.error("Failed to get execution tasks", { error });
      res.status(500).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to get execution tasks",
      });
    }
  },
);

/**
 * Get execution status (for real-time polling)
 * GET /api/v2/executions/:id/status
 */
router.get(
  "/executions/:id/status",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const execution = await orchestrationEngine.getExecution(req.params.id);

      if (!execution) {
        return res.status(404).json({
          success: false,
          error: "Execution not found",
        });
      }

      // Calculate progress based on completed tasks
      const tasks = await orchestrationEngine.getExecutionTasks(req.params.id);
      const completedTasks = tasks.filter(
        (t) => t.status === "completed",
      ).length;
      const progress =
        tasks.length > 0
          ? Math.floor((completedTasks / tasks.length) * 100)
          : 0;

      res.json({
        success: true,
        data: {
          id: execution.id,
          status: execution.status,
          progress,
          started_at: execution.started_at,
          completed_at: execution.completed_at,
          duration_ms: execution.duration_ms,
          error_message: execution.error_message,
        },
      });
    } catch (error) {
      logger.error("Failed to get execution status", { error });
      res.status(500).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to get execution status",
      });
    }
  },
);

/**
 * Get execution logs (detailed task logs)
 * GET /api/v2/executions/:id/logs
 */
router.get(
  "/executions/:id/logs",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const execution = await orchestrationEngine.getExecution(req.params.id);
      const tasks = await orchestrationEngine.getExecutionTasks(req.params.id);

      if (!execution) {
        return res.status(404).json({
          success: false,
          error: "Execution not found",
        });
      }

      // Build log entries from execution and tasks
      const logs: Array<{
        timestamp: string;
        level: string;
        message: string;
        details: Record<string, unknown>;
      }> = [
        {
          timestamp: execution.created_at,
          level: "info",
          message: `Execution created: ${execution.id}`,
          details: {
            trigger_type: execution.trigger_type,
            triggered_by: execution.triggered_by,
          },
        },
      ];

      if (execution.started_at) {
        logs.push({
          timestamp: execution.started_at,
          level: "info",
          message: "Execution started",
          details: {},
        });
      }

      // Add task logs
      tasks.forEach((task) => {
        if (task.queued_at) {
          logs.push({
            timestamp: task.queued_at,
            level: "info",
            message: `Task queued: ${task.name}`,
            details: {
              task_id: task.id,
              agent_type: task.agent_type,
              action: task.action,
            },
          });
        }

        if (task.started_at) {
          logs.push({
            timestamp: task.started_at,
            level: "info",
            message: `Task started: ${task.name}`,
            details: { task_id: task.id },
          });
        }

        if (task.completed_at) {
          if (task.status === "completed") {
            logs.push({
              timestamp: task.completed_at,
              level: "info",
              message: `Task completed: ${task.name}`,
              details: { task_id: task.id, output: task.output },
            });
          } else if (task.status === "failed") {
            logs.push({
              timestamp: task.completed_at,
              level: "error",
              message: `Task failed: ${task.name}`,
              details: {
                task_id: task.id,
                error: task.error_message,
                retry_count: task.retry_count,
              },
            });
          }
        }
      });

      if (execution.completed_at) {
        logs.push({
          timestamp: execution.completed_at,
          level: execution.status === "completed" ? "info" : "error",
          message: `Execution ${execution.status}`,
          details: {
            duration_ms: execution.duration_ms,
            error_message: execution.error_message,
            output: execution.output,
          },
        });
      }

      // Sort logs by timestamp
      logs.sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );

      res.json({
        success: true,
        data: {
          execution_id: execution.id,
          logs,
        },
      });
    } catch (error) {
      logger.error("Failed to get execution logs", { error });
      res.status(500).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to get execution logs",
      });
    }
  },
);

/**
 * Execute workflow from description (Chrome Extension endpoint)
 * POST /api/v2/execute
 * Creates and executes a workflow in one step
 * Rate limited: 10 executions per minute per user
 */
router.post(
  "/execute",
  executionRateLimiter,
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { description, actions } = req.body;

      if (!description && (!actions || actions.length === 0)) {
        return res.status(400).json({
          success: false,
          error: "Either description or actions array is required",
        });
      }

      // Create workflow definition from actions or description
      const workflowDefinition = {
        tasks:
          actions && actions.length > 0
            ? actions
            : [
                {
                  name: "Execute prompt",
                  agent_type: "browser",
                  action: "evaluate",
                  parameters: {
                    expression:
                      description || 'console.log("No action specified")',
                  },
                },
              ],
        variables: req.body.variables || {},
        on_error: "stop" as const,
      };

      // Create workflow from description or actions
      const workflow = await workflowService.createWorkflow({
        name: description || "Chrome Extension Workflow",
        description: description || "",
        definition: workflowDefinition,
        owner_id: authReq.user?.userId || "chrome-extension",
      });

      // Execute the workflow immediately
      const execution = await orchestrationEngine.executeWorkflow({
        workflow_id: workflow.id,
        triggered_by: authReq.user?.userId,
        trigger_type: "manual",
        variables: req.body.variables || {},
      });

      res.status(202).json({
        success: true,
        data: {
          workflow,
          execution,
        },
        message: "Workflow created and execution started",
      });
    } catch (error) {
      logger.error("Failed to execute workflow from description", { error });
      res.status(500).json({
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to execute workflow",
      });
    }
  },
);

/**
 * Get workflow templates
 * GET /api/v2/templates
 */
router.get(
  "/templates",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const templates = [
        {
          id: "template_google_search",
          name: "Google Search",
          description: "Search Google and take a screenshot",
          category: "search",
          definition: {
            tasks: [
              {
                name: "navigate",
                agent_type: "browser",
                action: "navigate",
                parameters: { url: "https://google.com" },
              },
              {
                name: "search",
                agent_type: "browser",
                action: "type",
                parameters: { selector: 'input[name="q"]', text: "{{query}}" },
              },
              {
                name: "submit",
                agent_type: "browser",
                action: "click",
                parameters: { selector: 'input[value="Google Search"]' },
              },
              {
                name: "screenshot",
                agent_type: "browser",
                action: "screenshot",
                parameters: { fullPage: true },
              },
            ],
            variables: { query: "workstation automation" },
          },
        },
        {
          id: "template_form_fill",
          name: "Form Filler",
          description: "Navigate and fill out a form",
          category: "forms",
          definition: {
            tasks: [
              {
                name: "navigate",
                agent_type: "browser",
                action: "navigate",
                parameters: { url: "{{form_url}}" },
              },
              {
                name: "fill_name",
                agent_type: "browser",
                action: "type",
                parameters: {
                  selector: 'input[name="name"]',
                  text: "{{name}}",
                },
              },
              {
                name: "fill_email",
                agent_type: "browser",
                action: "type",
                parameters: {
                  selector: 'input[name="email"]',
                  text: "{{email}}",
                },
              },
              {
                name: "submit",
                agent_type: "browser",
                action: "click",
                parameters: { selector: 'button[type="submit"]' },
              },
            ],
            variables: {
              form_url: "https://example.com/form",
              name: "John Doe",
              email: "john@example.com",
            },
          },
        },
        {
          id: "template_screenshot",
          name: "Screenshot Capture",
          description: "Navigate to URL and capture screenshot",
          category: "capture",
          definition: {
            tasks: [
              {
                name: "navigate",
                agent_type: "browser",
                action: "navigate",
                parameters: { url: "{{url}}" },
              },
              {
                name: "wait",
                agent_type: "browser",
                action: "wait",
                parameters: { duration: 2000 },
              },
              {
                name: "screenshot",
                agent_type: "browser",
                action: "screenshot",
                parameters: { fullPage: true },
              },
            ],
            variables: { url: "https://example.com" },
          },
        },
        {
          id: "template_data_extraction",
          name: "Data Extractor",
          description: "Extract text from a webpage",
          category: "extraction",
          definition: {
            tasks: [
              {
                name: "navigate",
                agent_type: "browser",
                action: "navigate",
                parameters: { url: "{{url}}" },
              },
              {
                name: "extract",
                agent_type: "browser",
                action: "getText",
                parameters: { selector: "{{selector}}" },
              },
            ],
            variables: {
              url: "https://example.com",
              selector: "body",
            },
          },
        },
        {
          id: "template_login",
          name: "Login Flow",
          description: "Automated login workflow",
          category: "authentication",
          definition: {
            tasks: [
              {
                name: "navigate",
                agent_type: "browser",
                action: "navigate",
                parameters: { url: "{{login_url}}" },
              },
              {
                name: "enter_username",
                agent_type: "browser",
                action: "type",
                parameters: {
                  selector: 'input[name="username"]',
                  text: "{{username}}",
                },
              },
              {
                name: "enter_password",
                agent_type: "browser",
                action: "type",
                parameters: {
                  selector: 'input[name="password"]',
                  text: "{{password}}",
                },
              },
              {
                name: "submit",
                agent_type: "browser",
                action: "click",
                parameters: { selector: 'button[type="submit"]' },
              },
            ],
            variables: {
              login_url: "https://example.com/login",
              username: "",
              password: "",
            },
          },
        },
      ];

      res.json({
        success: true,
        data: templates,
        count: templates.length,
      });
    } catch (error) {
      logger.error("Failed to get templates", { error });
      res.status(500).json({
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to get templates",
      });
    }
  },
);

/**
 * Get template by ID
 * GET /api/v2/templates/:id
 */
router.get(
  "/templates/:id",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      // In a real implementation, this would query a database
      // For now, we'll return a simple hardcoded template
      res.json({
        success: true,
        data: {
          id: req.params.id,
          name: "Template",
          description: "Workflow template",
          definition: {
            tasks: [],
          },
        },
      });
    } catch (error) {
      logger.error("Failed to get template", { error });
      res.status(500).json({
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to get template",
      });
    }
  },
);

export default router;
