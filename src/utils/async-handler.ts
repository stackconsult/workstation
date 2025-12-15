/**
 * Async Handler Utility
 * Wraps async route handlers to catch errors automatically
 */

import { Request, Response, NextFunction } from "express";
import { logger } from "./logger";

/**
 * Wraps async route handlers to automatically catch errors
 * Usage: router.get('/path', asyncHandler(async (req, res) => { ... }))
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((error: Error) => {
      logger.error("Async route handler error", {
        path: req.path,
        method: req.method,
        error: error.message,
        stack: error.stack,
      });

      // Don't expose internal errors to clients
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    });
  };
}

/**
 * Database error handler with retry support
 */
export async function withDatabaseRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      // Check if error is retryable (connection errors, timeouts, etc.)
      const isRetryable =
        lastError.message.includes("ECONNREFUSED") ||
        lastError.message.includes("ETIMEDOUT") ||
        lastError.message.includes("Connection terminated") ||
        lastError.message.includes("connection is not open");

      if (!isRetryable || attempt === maxRetries) {
        throw lastError;
      }

      // Exponential backoff
      const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      logger.warn(`Database operation failed, retrying in ${delayMs}ms`, {
        attempt,
        maxRetries,
        error: lastError.message,
      });

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError || new Error("Database operation failed");
}
