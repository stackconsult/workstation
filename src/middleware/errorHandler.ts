import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Global error handling middleware
 * Prevents sensitive information leakage in production
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log full error details internally (never send to client)
  logger.error('Unhandled error:', {
    error: err.message,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // Don't leak internal errors to client
  if (res.headersSent) {
    return next(err);
  }

  // In production, send generic error message
  // In development, include error message for debugging
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(500).json({
    error: 'Internal server error',
    message: isDevelopment ? err.message : 'An unexpected error occurred',
    // Never send stack traces to clients
  });
}

/**
 * 404 handler middleware
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
  });
}
