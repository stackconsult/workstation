/**
 * Request Correlation ID Middleware
 * Adds unique request IDs to all requests for tracking and debugging
 */

import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import { logger } from "../utils/logger";

// Extend Express Request to include requestId
// TypeScript namespace augmentation is necessary here for Express types
/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}
/* eslint-enable @typescript-eslint/no-namespace */

/**
 * Middleware to add correlation ID to all requests
 * Checks for existing X-Request-ID header or generates new one
 */
export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  // Check if request ID already exists in header
  const existingId = req.headers["x-request-id"] as string;
  const requestId = existingId || uuidv4();

  // Attach to request object
  req.requestId = requestId;

  // Add to response headers for client tracking
  res.setHeader("X-Request-ID", requestId);

  // Log request with ID
  logger.info("Request received", {
    requestId,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  next();
}

/**
 * Helper to get request ID from request object
 */
export function getRequestId(req: Request): string | undefined {
  return req.requestId;
}
