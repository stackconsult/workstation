/**
 * Adaptive Rate Limiting Service
 * Dynamic rate limits based on load and user behavior
 */

import rateLimit, { RateLimitRequestHandler } from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import Redis from "ioredis";
import { logger } from "../utils/logger";

// Redis client for rate limiting
let redisClient: Redis | null = null;

try {
  if (process.env.REDIS_URL || process.env.REDIS_HOST) {
    redisClient = new Redis({
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379"),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || "0"),
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    redisClient.on("error", (error) => {
      logger.error("Redis rate limit client error", { error });
    });

    redisClient.on("connect", () => {
      logger.info("Redis rate limit client connected");
    });
  }
} catch (error) {
  logger.warn(
    "Failed to initialize Redis for rate limiting, falling back to memory store",
    { error },
  );
}

// ============================================
// Rate Limit Configurations
// ============================================

interface AdaptiveRateLimitConfig {
  windowMs: number;
  max: number;
  message: string;
  standardHeaders?: boolean;
  legacyHeaders?: boolean;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

/**
 * Create adaptive rate limiter
 */
function createAdaptiveLimiter(
  config: AdaptiveRateLimitConfig,
): RateLimitRequestHandler {
  const baseConfig: any = {
    windowMs: config.windowMs,
    max: config.max,
    message: config.message,
    standardHeaders: config.standardHeaders ?? true,
    legacyHeaders: config.legacyHeaders ?? false,
    skipSuccessfulRequests: config.skipSuccessfulRequests ?? false,
    skipFailedRequests: config.skipFailedRequests ?? false,
    // Key generator - use IP or user ID
    keyGenerator: (req: any) => {
      return req.user?.userId || req.ip || "anonymous";
    },
    // Custom handler for rate limit exceeded
    handler: (req: any, res: any) => {
      logger.warn("Rate limit exceeded", {
        ip: req.ip,
        path: req.path,
        userId: req.user?.userId,
      });

      res.status(429).json({
        success: false,
        error: config.message,
        retryAfter: Math.ceil(config.windowMs / 1000),
      });
    },
  };

  // Use Redis store if available
  if (redisClient) {
    baseConfig.store = new RedisStore({
      // @ts-expect-error - RedisStore types compatibility
      client: redisClient,
      prefix: "rl:",
    });
  }

  return rateLimit(baseConfig);
}

// ============================================
// Global Rate Limiters
// ============================================

/**
 * Global rate limiter - applies to all routes
 * 100 requests per 15 minutes per IP/user
 */
export const globalRateLimiter = createAdaptiveLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: "Too many requests from this IP, please try again later.",
});

/**
 * Authentication rate limiter - stricter for auth endpoints
 * 10 requests per 15 minutes per IP
 */
export const authRateLimiter = createAdaptiveLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: "Too many authentication attempts, please try again later.",
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
});

/**
 * API rate limiter - for general API endpoints
 * 60 requests per minute per IP/user
 */
export const apiRateLimiter = createAdaptiveLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  message: "API rate limit exceeded, please slow down.",
});

/**
 * Execution rate limiter - for workflow executions
 * 10 executions per minute per user
 */
export const executionRateLimiter = createAdaptiveLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message:
    "Too many workflow executions, please wait before starting new workflows.",
  skipSuccessfulRequests: false,
});

/**
 * Upload rate limiter - for file uploads
 * 20 uploads per hour per user
 */
export const uploadRateLimiter = createAdaptiveLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: "Upload limit exceeded, please try again later.",
});

/**
 * WebSocket rate limiter - for WebSocket connections
 * 5 connections per minute per IP
 */
export const websocketRateLimiter = createAdaptiveLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: "Too many WebSocket connection attempts.",
});

// ============================================
// Adaptive Rate Limiting
// ============================================

/**
 * Adaptive rate limiter that adjusts based on server load
 * Reduces limits when server is under high load
 */
export class AdaptiveRateLimiter {
  private currentLoad: number = 0;
  private maxLoad: number = 0.8; // 80% CPU threshold

  constructor() {
    // Monitor server load (simplified - in production use proper monitoring)
    setInterval(() => {
      // This would integrate with actual server metrics
      // For now, using a placeholder
      this.updateLoad();
    }, 10000);
  }

  private updateLoad(): void {
    // Placeholder - integrate with actual metrics
    // In production, this would check CPU, memory, active connections, etc.
    this.currentLoad = Math.random(); // Mock load
  }

  /**
   * Get adjusted rate limit based on current load
   */
  public getAdjustedLimit(baseLimit: number): number {
    if (this.currentLoad > this.maxLoad) {
      // Reduce limit by 50% when under high load
      return Math.floor(baseLimit * 0.5);
    }
    return baseLimit;
  }

  /**
   * Create adaptive limiter that adjusts with server load
   */
  public createAdaptiveLimiter(
    config: AdaptiveRateLimitConfig,
  ): RateLimitRequestHandler {
    const limiter = createAdaptiveLimiter({
      ...config,
      max: this.getAdjustedLimit(config.max),
    });

    // Update limits periodically based on load
    setInterval(() => {
      // In production, this would dynamically adjust the rate limiter
      logger.debug("Adaptive rate limit check", {
        currentLoad: this.currentLoad,
        adjustedLimit: this.getAdjustedLimit(config.max),
      });
    }, 60000);

    return limiter;
  }
}

// Export adaptive rate limiter instance
export const adaptiveRateLimiter = new AdaptiveRateLimiter();

/**
 * Cleanup function
 */
export async function shutdownRateLimiter(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    logger.info("Rate limiter Redis client shut down");
  }
}
