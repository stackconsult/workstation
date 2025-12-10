import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

/**
 * Custom error class with status code support
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string,
    public isOperational: boolean = true,
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handling middleware
 * Prevents sensitive information leakage in production
 *
 * @error_handling_strategy
 * - Logs full error details internally for debugging
 * - Never exposes stack traces or internal errors to clients
 * - Differentiates between development and production error responses
 * - Handles cases where response headers have already been sent
 *
 * @security_notes
 * - Stack traces are only logged, never sent to client
 * - Production errors use generic messages to prevent information disclosure
 * - All error details are logged to Winston for post-mortem analysis
 *
 * @rollback_considerations
 * - If error handling behavior changes, review logs for error patterns
 * - Ensure new error formats are backward compatible with monitoring tools
 * - Test error responses in staging before deploying to production
 */
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  // Determine status code and error code
  const statusCode = (err as AppError).statusCode || 500;
  const errorCode = (err as AppError).code || "INTERNAL_ERROR";
  const isOperational = (err as AppError).isOperational === true;

  // Log full error details internally (never send to client)
  // ERROR_HANDLING_NOTE: All errors are logged with context for debugging
  logger.error("Unhandled error:", {
    error: err.message,
    code: errorCode,
    statusCode,
    isOperational,
    stack: process.env.NODE_ENV !== "production" ? err.stack : undefined,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // Don't leak internal errors to client
  // ERROR_HANDLING_NOTE: Prevents double-sending headers (Express constraint)
  if (res.headersSent) {
    return next(err);
  }

  // In production, send generic error message for non-operational errors
  // In development, include error message for debugging
  // ERROR_HANDLING_NOTE: Environment-specific error disclosure policy
  const isDevelopment = process.env.NODE_ENV === "development";

  // Determine error message to send to client
  // Only show actual error message if:
  // 1. It's an operational error (explicitly marked as safe to show), OR
  // 2. We're in development mode
  const errorMessage =
    isOperational || isDevelopment ? err.message : "Internal server error";

  res.status(statusCode).json({
    error: errorMessage,
    code: errorCode,
    timestamp: new Date().toISOString(),
    path: req.path,
    // Never send stack traces to clients
    // SECURITY_NOTE: Stack traces could reveal internal implementation details
  });
}

/**
 * 404 handler middleware
 *
 * @error_handling_strategy
 * - Provides consistent 404 responses
 * - Logs attempted paths for security monitoring
 * - Returns structured JSON error format
 *
 * @security_notes
 * - Does not reveal internal route structure
 * - Path is echoed back for client debugging
 *
 * @rollback_considerations
 * - 404 format changes require frontend updates
 * - Monitor 404 rates after deployment for unexpected increases
 */
export function notFoundHandler(req: Request, res: Response): void {
  // ERROR_HANDLING_NOTE: 404 responses are normal, not logged as errors
  res.status(404).json({
    error: "Not found",
    code: "NOT_FOUND",
    path: req.path,
    timestamp: new Date().toISOString(),
  });
}
