/**
 * Centralized Error Handling Utilities
 *
 * Provides enterprise-grade error handling, logging, and recovery mechanisms
 * for all agents and services in the workstation ecosystem.
 *
 * @module utils/error-handler
 * @version 1.0.0
 */

import { logger } from "./logger";

/**
 * Error severity levels for classification and alerting
 */
export enum ErrorSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

/**
 * Error categories for classification and routing
 */
export enum ErrorCategory {
  VALIDATION = "validation",
  AUTHENTICATION = "authentication",
  AUTHORIZATION = "authorization",
  NETWORK = "network",
  DATABASE = "database",
  EXTERNAL_API = "external_api",
  INTERNAL = "internal",
  CONFIGURATION = "configuration",
  RESOURCE = "resource",
  TIMEOUT = "timeout",
  UNKNOWN = "unknown",
}

/**
 * Standard error response interface
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    category: ErrorCategory;
    severity: ErrorSeverity;
    timestamp: string;
    requestId?: string;
    details?: Record<string, unknown>;
    stack?: string;
  };
}

/**
 * Error metadata for tracking and analysis
 */
export interface ErrorMetadata {
  category: ErrorCategory;
  severity: ErrorSeverity;
  context?: Record<string, unknown>;
  recoverable?: boolean;
  retryable?: boolean;
  userMessage?: string;
}

/**
 * Structured application error with metadata
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly category: ErrorCategory;
  public readonly severity: ErrorSeverity;
  public readonly context: Record<string, unknown>;
  public readonly recoverable: boolean;
  public readonly retryable: boolean;
  public readonly userMessage: string;
  public readonly timestamp: string;

  constructor(
    message: string,
    code: string,
    metadata?: Partial<ErrorMetadata>,
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.category = metadata?.category || ErrorCategory.UNKNOWN;
    this.severity = metadata?.severity || ErrorSeverity.MEDIUM;
    this.context = metadata?.context || {};
    this.recoverable = metadata?.recoverable ?? true;
    this.retryable = metadata?.retryable ?? false;
    this.userMessage = metadata?.userMessage || message;
    this.timestamp = new Date().toISOString();

    // Maintain proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert error to response format
   */
  toResponse(includeStack = false): ErrorResponse {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.userMessage,
        category: this.category,
        severity: this.severity,
        timestamp: this.timestamp,
        details: this.context,
        ...(includeStack && { stack: this.stack }),
      },
    };
  }
}

/**
 * Error handler class with retry logic and circuit breaker integration
 */
export class ErrorHandler {
  private static errorCounts = new Map<string, number>();
  private static lastErrorTime = new Map<string, number>();
  private static readonly ERROR_RESET_INTERVAL = 60000; // 1 minute

  /**
   * Handle error with logging and classification
   */
  static handle(error: unknown, context?: Record<string, unknown>): AppError {
    const appError = this.normalize(error, context);

    // Log the error
    this.logError(appError);

    // Track error frequency
    this.trackError(appError.code);

    return appError;
  }

  /**
   * Normalize any error to AppError
   */
  static normalize(
    error: unknown,
    context?: Record<string, unknown>,
  ): AppError {
    if (error instanceof AppError) {
      // Add additional context if provided
      if (context && error.context) {
        Object.assign(error.context, context);
      }
      return error;
    }

    if (error instanceof Error) {
      // Convert standard Error to AppError
      return new AppError(error.message, "UNKNOWN_ERROR", {
        category: ErrorCategory.UNKNOWN,
        severity: ErrorSeverity.MEDIUM,
        context: {
          ...context,
          originalName: error.name,
          stack: error.stack,
        },
      });
    }

    // Handle non-Error objects
    return new AppError(String(error), "UNKNOWN_ERROR", {
      category: ErrorCategory.UNKNOWN,
      severity: ErrorSeverity.LOW,
      context,
    });
  }

  /**
   * Log error with appropriate severity
   */
  private static logError(error: AppError): void {
    const logData = {
      code: error.code,
      category: error.category,
      severity: error.severity,
      message: error.message,
      context: error.context,
      timestamp: error.timestamp,
    };

    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        logger.error("CRITICAL ERROR", logData);
        break;
      case ErrorSeverity.HIGH:
        logger.error("High severity error", logData);
        break;
      case ErrorSeverity.MEDIUM:
        logger.warn("Medium severity error", logData);
        break;
      case ErrorSeverity.LOW:
        logger.info("Low severity error", logData);
        break;
    }
  }

  /**
   * Track error frequency for circuit breaker decisions
   */
  private static trackError(code: string): void {
    const now = Date.now();
    const lastTime = this.lastErrorTime.get(code) || 0;

    // Reset counter if enough time has passed
    if (now - lastTime > this.ERROR_RESET_INTERVAL) {
      this.errorCounts.set(code, 1);
    } else {
      const count = (this.errorCounts.get(code) || 0) + 1;
      this.errorCounts.set(code, count);
    }

    this.lastErrorTime.set(code, now);
  }

  /**
   * Get error frequency for a specific error code
   */
  static getErrorCount(code: string): number {
    return this.errorCounts.get(code) || 0;
  }

  /**
   * Execute function with error handling and retry logic
   */
  static async withRetry<T>(
    fn: () => Promise<T>,
    options: {
      maxRetries?: number;
      delayMs?: number;
      backoffMultiplier?: number;
      retryableErrors?: ErrorCategory[];
      onRetry?: (attempt: number, error: AppError) => void;
    } = {},
  ): Promise<T> {
    const {
      maxRetries = 3,
      delayMs = 1000,
      backoffMultiplier = 2,
      retryableErrors = [
        ErrorCategory.NETWORK,
        ErrorCategory.TIMEOUT,
        ErrorCategory.EXTERNAL_API,
      ],
      onRetry,
    } = options;

    let lastError: AppError | undefined;
    let attempt = 0;

    while (attempt <= maxRetries) {
      try {
        return await fn();
      } catch (error) {
        lastError = this.handle(error);
        attempt++;

        // Don't retry if max retries reached or error is not retryable
        if (
          attempt > maxRetries ||
          !lastError.retryable ||
          !retryableErrors.includes(lastError.category)
        ) {
          throw lastError;
        }

        // Calculate delay with exponential backoff
        const delay = delayMs * Math.pow(backoffMultiplier, attempt - 1);

        if (onRetry) {
          onRetry(attempt, lastError);
        }

        logger.warn(`Retrying operation (attempt ${attempt}/${maxRetries})`, {
          error: lastError.code,
          delay,
        });

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    if (!lastError) {
      throw new AppError("Operation failed after retries", "UNKNOWN_ERROR");
    }
    throw lastError;
  }

  /**
   * Execute function with timeout
   */
  static async withTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number,
    timeoutError?: string,
  ): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) =>
        setTimeout(
          () =>
            reject(
              new AppError(
                timeoutError || `Operation timed out after ${timeoutMs}ms`,
                "OPERATION_TIMEOUT",
                {
                  category: ErrorCategory.TIMEOUT,
                  severity: ErrorSeverity.HIGH,
                  retryable: true,
                },
              ),
            ),
          timeoutMs,
        ),
      ),
    ]);
  }

  /**
   * Create validation error
   */
  static validationError(
    message: string,
    field?: string,
    value?: unknown,
  ): AppError {
    return new AppError(message, "VALIDATION_ERROR", {
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.LOW,
      context: { field, value },
      recoverable: true,
      retryable: false,
      userMessage: message,
    });
  }

  /**
   * Create authentication error
   */
  static authenticationError(message = "Authentication failed"): AppError {
    return new AppError(message, "AUTHENTICATION_ERROR", {
      category: ErrorCategory.AUTHENTICATION,
      severity: ErrorSeverity.HIGH,
      recoverable: false,
      retryable: false,
      userMessage: "Authentication required",
    });
  }

  /**
   * Create authorization error
   */
  static authorizationError(message = "Insufficient permissions"): AppError {
    return new AppError(message, "AUTHORIZATION_ERROR", {
      category: ErrorCategory.AUTHORIZATION,
      severity: ErrorSeverity.MEDIUM,
      recoverable: false,
      retryable: false,
      userMessage: "Access denied",
    });
  }

  /**
   * Create network error
   */
  static networkError(message: string, url?: string): AppError {
    return new AppError(message, "NETWORK_ERROR", {
      category: ErrorCategory.NETWORK,
      severity: ErrorSeverity.MEDIUM,
      context: { url },
      recoverable: true,
      retryable: true,
      userMessage: "Network error occurred",
    });
  }

  /**
   * Create database error
   */
  static databaseError(message: string, operation?: string): AppError {
    return new AppError(message, "DATABASE_ERROR", {
      category: ErrorCategory.DATABASE,
      severity: ErrorSeverity.HIGH,
      context: { operation },
      recoverable: true,
      retryable: true,
      userMessage: "Database operation failed",
    });
  }

  /**
   * Create external API error
   */
  static externalApiError(
    message: string,
    service?: string,
    statusCode?: number,
  ): AppError {
    return new AppError(message, "EXTERNAL_API_ERROR", {
      category: ErrorCategory.EXTERNAL_API,
      severity: ErrorSeverity.MEDIUM,
      context: { service, statusCode },
      recoverable: true,
      retryable: statusCode ? statusCode >= 500 : true,
      userMessage: "External service error",
    });
  }

  /**
   * Create resource error (file not found, etc.)
   */
  static resourceError(message: string, resource?: string): AppError {
    return new AppError(message, "RESOURCE_ERROR", {
      category: ErrorCategory.RESOURCE,
      severity: ErrorSeverity.MEDIUM,
      context: { resource },
      recoverable: false,
      retryable: false,
      userMessage: "Resource not available",
    });
  }

  /**
   * Create configuration error
   */
  static configError(message: string, setting?: string): AppError {
    return new AppError(message, "CONFIGURATION_ERROR", {
      category: ErrorCategory.CONFIGURATION,
      severity: ErrorSeverity.CRITICAL,
      context: { setting },
      recoverable: false,
      retryable: false,
      userMessage: "System configuration error",
    });
  }
}

/**
 * Express error handler middleware
 */
export function errorMiddleware(
  error: unknown,
  _req: any,
  res: any,
  _next: any,
): void {
  const appError = ErrorHandler.handle(error);
  const isDevelopment = process.env.NODE_ENV === "development";

  res
    .status(getHttpStatusCode(appError))
    .json(appError.toResponse(isDevelopment));
}

/**
 * Map error category/severity to HTTP status code
 */
function getHttpStatusCode(error: AppError): number {
  switch (error.category) {
    case ErrorCategory.VALIDATION:
      return 400;
    case ErrorCategory.AUTHENTICATION:
      return 401;
    case ErrorCategory.AUTHORIZATION:
      return 403;
    case ErrorCategory.RESOURCE:
      return 404;
    case ErrorCategory.TIMEOUT:
      return 408;
    case ErrorCategory.CONFIGURATION:
    case ErrorCategory.DATABASE:
    case ErrorCategory.INTERNAL:
      return 500;
    case ErrorCategory.EXTERNAL_API:
      return 502;
    case ErrorCategory.NETWORK:
      return 503;
    default:
      return error.severity === ErrorSeverity.CRITICAL ? 500 : 400;
  }
}

/**
 * Async route handler wrapper
 */
export function asyncHandler(
  fn: (req: any, res: any, next: any) => Promise<any>,
) {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
