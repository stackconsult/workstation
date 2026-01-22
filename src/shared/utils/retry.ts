/**
 * Shared Retry Utility
 *
 * Provides retry logic with exponential backoff, custom conditions,
 * and circuit breaker pattern for resilient agent operations.
 *
 * @module shared/utils/retry
 * @version 1.0.0
 */

import { logger } from "./logger.js";

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  onRetry?: (attempt: number, error: Error) => void;
  shouldRetry?: (error: Error) => boolean;
}

export interface RetryUntilOptions<T> {
  maxAttempts?: number;
  delay?: number;
  condition: (result: T) => boolean;
  onAttempt?: (attempt: number, result: T) => void;
}

/**
 * Retry a function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    backoffMultiplier = 2,
    onRetry,
    shouldRetry = () => true,
  } = options;

  let lastError: Error;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Check if we should retry this error
      if (!shouldRetry(lastError)) {
        throw lastError;
      }

      // Last attempt, throw error
      if (attempt === maxRetries - 1) {
        logger.error("All retry attempts failed", {
          attempts: maxRetries,
          error: lastError.message,
        });
        throw lastError;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        baseDelay * Math.pow(backoffMultiplier, attempt),
        maxDelay,
      );

      logger.warn("Retry attempt", {
        attempt: attempt + 1,
        maxRetries,
        delay,
        error: lastError.message,
      });

      // Call onRetry callback if provided
      if (onRetry) {
        onRetry(attempt + 1, lastError);
      }

      // Wait before retrying
      await sleep(delay);
    }
  }

  throw lastError!;
}

/**
 * Retry until a condition is met
 */
export async function retryUntil<T>(
  fn: () => Promise<T>,
  options: RetryUntilOptions<T>,
): Promise<T> {
  const { maxAttempts = 10, delay = 1000, condition, onAttempt } = options;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const result = await fn();

    if (condition(result)) {
      logger.debug("Condition met", { attempt: attempt + 1 });
      return result;
    }

    if (onAttempt) {
      onAttempt(attempt + 1, result);
    }

    if (attempt < maxAttempts - 1) {
      logger.info("Condition not met, retrying", {
        attempt: attempt + 1,
        maxAttempts,
      });
      await sleep(delay);
    }
  }

  throw new Error(`Condition not met after ${maxAttempts} attempts`);
}

/**
 * Circuit Breaker Pattern
 * Prevents cascading failures by temporarily blocking requests
 * when failure threshold is exceeded
 */
export class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: "closed" | "open" | "half-open" = "closed";

  constructor(
    private readonly threshold: number = 5,
    private readonly timeout: number = 60000, // 1 minute
    private readonly resetTimeout: number = 30000, // 30 seconds
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // If circuit is open, check if we should try half-open
    if (this.state === "open") {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = "half-open";
        logger.info("Circuit breaker entering half-open state");
      } else {
        throw new Error("Circuit breaker is OPEN - too many failures");
      }
    }

    try {
      const result = await fn();

      // Success - reset circuit
      if (this.state === "half-open") {
        this.state = "closed";
        this.failureCount = 0;
        logger.info("Circuit breaker closed - system recovered");
      }

      return result;
    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = Date.now();

      // Open circuit if threshold exceeded
      if (this.failureCount >= this.threshold) {
        this.state = "open";
        logger.error("Circuit breaker OPENED", {
          failureCount: this.failureCount,
          threshold: this.threshold,
        });
      }

      throw error;
    }
  }

  getState(): string {
    return this.state;
  }

  reset(): void {
    this.state = "closed";
    this.failureCount = 0;
    this.lastFailureTime = 0;
    logger.info("Circuit breaker manually reset");
  }
}

/**
 * Rate Limiter
 * Limits the rate of function execution
 */
export class RateLimiter {
  private queue: Array<() => void> = [];
  private activeCount = 0;

  constructor(
    private readonly maxConcurrent: number = 5,
    private readonly minInterval: number = 0,
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Wait for available slot
    while (this.activeCount >= this.maxConcurrent) {
      await new Promise<void>((resolve) => this.queue.push(resolve));
    }

    this.activeCount++;

    try {
      const result = await fn();

      // Wait minimum interval if specified
      if (this.minInterval > 0) {
        await sleep(this.minInterval);
      }

      return result;
    } finally {
      this.activeCount--;

      // Process next in queue
      const next = this.queue.shift();
      if (next) next();
    }
  }
}

/**
 * Retry with timeout
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  timeoutMessage = "Operation timed out",
): Promise<T> {
  return Promise.race([
    fn(),
    sleep(timeoutMs).then(() => {
      throw new Error(timeoutMessage);
    }),
  ]);
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Batch retry - retry array of operations
 */
export async function retryBatch<T>(
  items: T[],
  fn: (item: T) => Promise<any>,
  options: RetryOptions = {},
): Promise<Array<{ success: boolean; result?: any; error?: Error }>> {
  return Promise.all(
    items.map(async (item) => {
      try {
        const result = await withRetry(() => fn(item), options);
        return { success: true, result };
      } catch (error) {
        return { success: false, error: error as Error };
      }
    }),
  );
}
