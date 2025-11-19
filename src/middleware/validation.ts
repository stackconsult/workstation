import { Request, Response, NextFunction } from "express";
import Joi from "joi";

/**
 * Validation middleware factory
 * @param schema - Joi validation schema
 * @returns Express middleware function
 */
export function validateRequest(schema: Joi.ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      }));

      res.status(400).json({
        error: "Validation failed",
        details: errors,
      });
      return;
    }

    // Replace request body with validated/sanitized data
    req.body = value;
    next();
  };
}

// Common validation schemas
export const schemas = {
  generateToken: Joi.object({
    userId: Joi.string().required().min(1).max(255),
    role: Joi.string()
      .optional()
      .valid("user", "admin", "moderator")
      .default("user"),
  }),
};
