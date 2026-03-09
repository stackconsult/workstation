/**
 * Enhanced Validation Service with Zod
 * Type-safe request validation with automatic schema generation
 */

import { z } from "zod";
import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

// ============================================
// Common Schemas
// ============================================

export const commonSchemas = {
  // ID validation
  id: z.string().uuid("Invalid UUID format"),

  // Pagination
  pagination: z.object({
    page: z.number().int().positive().default(1),
    limit: z.number().int().min(1).max(100).default(20),
  }),

  // Sorting
  sort: z.object({
    sortBy: z.string().optional(),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  }),

  // Date range
  dateRange: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
};

// ============================================
// Workflow Schemas
// ============================================

export const workflowSchemas = {
  create: z.object({
    name: z.string().min(1).max(255),
    description: z.string().max(1000).optional(),
    definition: z.object({
      tasks: z.array(
        z.object({
          name: z.string(),
          agent_type: z.string(),
          action: z.string(),
          parameters: z.record(z.string(), z.unknown()),
          depends_on: z.array(z.string()).optional(),
        }),
      ),
    }),
    category: z.string().optional(),
    is_template: z.boolean().default(false),
  }),

  update: z.object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().max(1000).optional(),
    definition: z
      .object({
        tasks: z.array(
          z.object({
            name: z.string(),
            agent_type: z.string(),
            action: z.string(),
            parameters: z.record(z.string(), z.unknown()),
            depends_on: z.array(z.string()).optional(),
          }),
        ),
      })
      .optional(),
    category: z.string().optional(),
  }),

  execute: z.object({
    variables: z.record(z.string(), z.unknown()).optional(),
    timeout_seconds: z.number().int().positive().max(3600).optional(),
  }),
};

// ============================================
// Authentication Schemas
// ============================================

export const authSchemas = {
  login: z.object({
    username: z.string().min(3).max(50),
    password: z.string().min(8).max(128),
  }),

  register: z.object({
    username: z
      .string()
      .min(3)
      .max(50)
      .regex(
        /^[a-zA-Z0-9_-]+$/,
        "Username can only contain letters, numbers, hyphens, and underscores",
      ),
    password: z
      .string()
      .min(8)
      .max(128)
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    email: z.string().email(),
  }),

  refreshToken: z.object({
    refreshToken: z.string(),
  }),
};

// ============================================
// Execution Schemas
// ============================================

export const executionSchemas = {
  list: z.object({
    workflow_id: z.string().uuid().optional(),
    status: z
      .enum(["pending", "running", "completed", "failed", "cancelled"])
      .optional(),
    ...commonSchemas.pagination.shape,
    ...commonSchemas.sort.shape,
    ...commonSchemas.dateRange.shape,
  }),

  retry: z.object({
    execution_id: z.string().uuid(),
  }),
};

// ============================================
// Agent Schemas
// ============================================

export const agentSchemas = {
  browser: z.object({
    action: z.enum(["navigate", "click", "type", "screenshot", "extract"]),
    parameters: z.object({
      url: z.string().url().optional(),
      selector: z.string().optional(),
      text: z.string().optional(),
    }),
  }),

  data: z.object({
    action: z.enum(["parse_csv", "write_csv", "parse_json", "query_json"]),
    parameters: z.object({
      filePath: z.string().optional(),
      data: z.any().optional(),
      query: z.string().optional(),
    }),
  }),
};

// ============================================
// Middleware Factory
// ============================================

export type ValidationTarget = "body" | "query" | "params";

/**
 * Create validation middleware from Zod schema
 */
export function validate<T extends z.ZodTypeAny>(
  schema: T,
  target: ValidationTarget = "body",
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req[target];
      const validated = schema.parse(data);

      // Replace request data with validated data
      (req as any)[target] = validated;

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors = error.issues.map((err) => ({
          field: err.path.join("."),
          message: err.message,
          code: err.code,
        }));

        logger.warn("Validation error", {
          target,
          errors: formattedErrors,
          path: req.path,
        });

        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: formattedErrors,
        });
      }

      logger.error("Unexpected validation error", { error });
      return res.status(500).json({
        success: false,
        error: "Internal validation error",
      });
    }
  };
}

/**
 * Validate multiple targets
 */
export function validateMultiple(
  validations: Array<{
    schema: z.ZodTypeAny;
    target: ValidationTarget;
  }>,
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      for (const { schema, target } of validations) {
        const data = req[target];
        const validated = schema.parse(data);
        (req as any)[target] = validated;
      }
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors = error.issues.map((err) => ({
          field: err.path.join("."),
          message: err.message,
          code: err.code,
        }));

        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: formattedErrors,
        });
      }

      return res.status(500).json({
        success: false,
        error: "Internal validation error",
      });
    }
  };
}

// Export all schemas
export const schemas = {
  common: commonSchemas,
  workflow: workflowSchemas,
  auth: authSchemas,
  execution: executionSchemas,
  agent: agentSchemas,
};
