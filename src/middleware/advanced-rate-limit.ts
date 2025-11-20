import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

// Initialize Redis client for rate limiting
const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  enableOfflineQueue: false,
  retryStrategy(times) {
    // Exponential backoff: 50ms, 100ms, 200ms, 400ms, 800ms...
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

redisClient.on('error', (err) => {
  console.error('Redis rate limit client error:', err);
});

redisClient.on('connect', () => {
  console.log('✅ Redis rate limit client connected');
});

/**
 * Create Redis-backed rate limiter
 */
function createRedisRateLimiter(options: {
  windowMs: number;
  max: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
}) {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: options.message || 'Too many requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    store: new RedisStore({
      // @ts-ignore - Redis client typing issue
      client: redisClient,
      prefix: 'rl:',
    }),
  });
}

/**
 * API rate limiter - general endpoints
 * 100 requests per 15 minutes per IP
 */
export const apiRateLimiter = createRedisRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many API requests from this IP, please try again after 15 minutes'
});

/**
 * Auth endpoints rate limiter - stricter limits
 * 5 requests per 15 minutes per IP
 */
export const authRateLimiter = createRedisRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many authentication attempts, please try again after 15 minutes',
  skipSuccessfulRequests: true // Only count failed attempts
});

/**
 * Workflow execution rate limiter
 * 10 executions per minute per user
 */
export const executionRateLimiter = createRedisRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: 'Too many workflow executions, please slow down'
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
  message: 'Too many requests from this IP, please try again later'
});

export { redisClient as rateLimitRedis };
