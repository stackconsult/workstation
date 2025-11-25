/**
 * Workstation Shared Library
 * 
 * Common utilities, types, and patterns used across all agents.
 * 
 * @module shared
 * @version 1.0.0
 */

// Utilities
export * from './utils/logger.js';
export * from './utils/retry.js';

// Types
export * from './types/index.js';

// Re-export commonly used items
export { createLogger, logger, type LogLevel } from './utils/logger.js';
export { 
  withRetry, 
  retryUntil, 
  CircuitBreaker, 
  RateLimiter,
  withTimeout,
  sleep 
} from './utils/retry.js';
