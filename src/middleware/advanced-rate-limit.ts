import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import Redis from "ioredis";

// Check if we should use Redis (only in production or if explicitly enabled)
const useRedis =
  process.env.REDIS_ENABLED === "true" || process.env.NODE_ENV === "production";

// Initialize Redis client for rate limiting only if enabled
let redisClient: Redis | null = null;

if (useRedis) {
  redisClient = new Redis({
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
    password: process.env.REDIS_PASSWORD,
    enableOfflineQueue: false,
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      // Only retry 3 times
      if (times > 3) {
        console.error(
          "Redis connection failed after 3 retries, falling back to memory store",
        );
        return null; // Stop retrying
      }
      // Exponential backoff: 50ms, 100ms, 200ms
      const delay = Math.min(times * 50, 200);
      return delay;
    },
  });

  redisClient.on("error", (err) => {
    console.error("Redis rate limit client error:", err.message);
  });

  redisClient.on("connect", () => {
    console.log("✅ Redis rate limit client connected");
  });
}

/**
 * Create Redis-backed rate limiter or memory-based fallback
 */
function createRedisRateLimiter(options: {
  windowMs: number;
  max: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
}) {
  const config: any = {
    windowMs: options.windowMs,
    max: options.max,
    message: options.message || "Too many requests, please try again later",
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
  };

  // Only use Redis store if Redis is enabled and client is available
  if (useRedis && redisClient) {
    try {
      // Type assertion for RedisStore client compatibility
      // RedisStore expects specific Redis client interface which ioredis implements
      const storeConfig: any = {
        client: redisClient,
        prefix: "rl:",
      };
      config.store = new RedisStore(storeConfig);
    } catch (error) {
      console.warn(
        "Failed to create Redis store for rate limiter, using memory store:",
        (error as Error).message,
      );
    }
  }

  return rateLimit(config);
}

/**
 * API rate limiter - general endpoints
 * 100 requests per 15 minutes per IP
 */
export const apiRateLimiter = createRedisRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message:
    "Too many API requests from this IP, please try again after 15 minutes",
});

/**
 * Auth endpoints rate limiter - stricter limits
 * 5 requests per 15 minutes per IP
 */
export const authRateLimiter = createRedisRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message:
    "Too many authentication attempts, please try again after 15 minutes",
  skipSuccessfulRequests: true, // Only count failed attempts
});

/**
 * Workflow execution rate limiter
 * 10 executions per minute per user
 */
export const executionRateLimiter = createRedisRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: "Too many workflow executions, please slow down",
});

/**
 * Create custom rate limiter with specified options
 */
export function createCustomRateLimiter(options: {
  windowMs: number;
  max: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
}) {
  return createRedisRateLimiter(options);
}

/**
 * Global rate limiter - very high limit, just to prevent abuse
 * 1000 requests per hour per IP
 */
export const globalRateLimiter = createRedisRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000,
  message: "Too many requests from this IP, please try again later",
});

export { redisClient as rateLimitRedis, useRedis };
