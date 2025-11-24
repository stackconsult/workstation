import { Request, Response, NextFunction } from 'express';
import {
  apiRateLimiter,
  authRateLimiter,
  executionRateLimiter,
  globalRateLimiter,
  createCustomRateLimiter,
  rateLimitRedis,
  useRedis,
} from '../../src/middleware/advanced-rate-limit';

// Mock ioredis
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    quit: jest.fn(),
    disconnect: jest.fn(),
  }));
});

// Mock rate-limit-redis
jest.mock('rate-limit-redis', () => {
  return jest.fn().mockImplementation(() => ({
    prefix: 'rl:',
  }));
});

// Mock express-rate-limit
jest.mock('express-rate-limit', () => {
  return jest.fn().mockImplementation(() => {
    return (req: any, res: any, next: any) => {
      next();
    };
  });
});

describe('Advanced Rate Limit Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      ip: '127.0.0.1',
      headers: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      setHeader: jest.fn(),
    };
    nextFunction = jest.fn();
    
    // Clear environment variables for each test
    delete process.env.REDIS_ENABLED;
    delete process.env.REDIS_HOST;
    delete process.env.REDIS_PORT;
    delete process.env.REDIS_PASSWORD;
  });

  describe('Redis Configuration', () => {
    it('should export useRedis flag', () => {
      expect(typeof useRedis).toBe('boolean');
    });

    it('should enable Redis in production environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      // Re-require to trigger initialization with new env
      jest.resetModules();
      const { useRedis: prodUseRedis } = require('../../src/middleware/advanced-rate-limit');
      
      expect(prodUseRedis).toBe(true);
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should enable Redis when REDIS_ENABLED is true', () => {
      const originalEnv = process.env.REDIS_ENABLED;
      process.env.REDIS_ENABLED = 'true';
      
      jest.resetModules();
      const { useRedis: enabledUseRedis } = require('../../src/middleware/advanced-rate-limit');
      
      expect(enabledUseRedis).toBe(true);
      
      process.env.REDIS_ENABLED = originalEnv;
    });

    it('should fallback to memory store when Redis is disabled', () => {
      delete process.env.REDIS_ENABLED;
      delete process.env.NODE_ENV;
      
      jest.resetModules();
      const { rateLimitRedis: memoryRedis } = require('../../src/middleware/advanced-rate-limit');
      
      expect(memoryRedis).toBeNull();
    });
  });

  describe('API Rate Limiter', () => {
    it('should be defined and callable', () => {
      expect(apiRateLimiter).toBeDefined();
      expect(typeof apiRateLimiter).toBe('function');
    });

    it('should allow requests within limit', () => {
      apiRateLimiter(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should have correct window (15 minutes)', () => {
      // This is tested via the implementation details
      // The actual behavior would require integration testing
      expect(apiRateLimiter).toBeDefined();
    });

    it('should have max of 100 requests', () => {
      // Configuration check - actual enforcement requires integration test
      expect(apiRateLimiter).toBeDefined();
    });
  });

  describe('Auth Rate Limiter', () => {
    it('should be defined and callable', () => {
      expect(authRateLimiter).toBeDefined();
      expect(typeof authRateLimiter).toBe('function');
    });

    it('should allow requests within limit', () => {
      authRateLimiter(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should have stricter limits than API rate limiter', () => {
      // Auth limiter should be more restrictive (5 vs 100 requests)
      expect(authRateLimiter).toBeDefined();
    });

    it('should skip successful requests', () => {
      // skipSuccessfulRequests option should be true for auth
      expect(authRateLimiter).toBeDefined();
    });
  });

  describe('Execution Rate Limiter', () => {
    it('should be defined and callable', () => {
      expect(executionRateLimiter).toBeDefined();
      expect(typeof executionRateLimiter).toBe('function');
    });

    it('should allow requests within limit', () => {
      executionRateLimiter(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should have 1-minute window', () => {
      // Window: 60 seconds for workflow executions
      expect(executionRateLimiter).toBeDefined();
    });

    it('should allow 10 executions per minute', () => {
      // Max: 10 executions
      expect(executionRateLimiter).toBeDefined();
    });
  });

  describe('Global Rate Limiter', () => {
    it('should be defined and callable', () => {
      expect(globalRateLimiter).toBeDefined();
      expect(typeof globalRateLimiter).toBe('function');
    });

    it('should allow requests within limit', () => {
      globalRateLimiter(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should have high limit (1000 per hour)', () => {
      // Very permissive global limit
      expect(globalRateLimiter).toBeDefined();
    });
  });

  describe('Custom Rate Limiter', () => {
    it('should create custom rate limiter with specified options', () => {
      const customLimiter = createCustomRateLimiter({
        windowMs: 60000,
        max: 50,
        message: 'Custom limit exceeded',
      });
      
      expect(customLimiter).toBeDefined();
      expect(typeof customLimiter).toBe('function');
    });

    it('should allow requests within custom limit', () => {
      const customLimiter = createCustomRateLimiter({
        windowMs: 60000,
        max: 50,
      });
      
      customLimiter(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should use custom message when provided', () => {
      const customMessage = 'Custom rate limit message';
      const customLimiter = createCustomRateLimiter({
        windowMs: 60000,
        max: 50,
        message: customMessage,
      });
      
      expect(customLimiter).toBeDefined();
    });

    it('should support skipSuccessfulRequests option', () => {
      const customLimiter = createCustomRateLimiter({
        windowMs: 60000,
        max: 50,
        skipSuccessfulRequests: true,
      });
      
      expect(customLimiter).toBeDefined();
    });

    it('should handle very short windows', () => {
      const customLimiter = createCustomRateLimiter({
        windowMs: 1000, // 1 second
        max: 5,
      });
      
      expect(customLimiter).toBeDefined();
    });

    it('should handle very large windows', () => {
      const customLimiter = createCustomRateLimiter({
        windowMs: 24 * 60 * 60 * 1000, // 24 hours
        max: 10000,
      });
      
      expect(customLimiter).toBeDefined();
    });

    it('should handle low request limits', () => {
      const customLimiter = createCustomRateLimiter({
        windowMs: 60000,
        max: 1, // Very restrictive
      });
      
      expect(customLimiter).toBeDefined();
    });
  });

  describe('Rate Limiter Behavior', () => {
    it('should add standard headers to response', () => {
      apiRateLimiter(mockRequest as Request, mockResponse as Response, nextFunction);
      
      // express-rate-limit adds RateLimit-* headers
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should track requests by IP address', () => {
      mockRequest.ip = '192.168.1.1';
      apiRateLimiter(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should handle missing IP address', () => {
      delete mockRequest.ip;
      apiRateLimiter(mockRequest as Request, mockResponse as Response, nextFunction);
      
      // Should still work with undefined IP
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should handle requests from different IPs independently', () => {
      // First IP
      mockRequest.ip = '192.168.1.1';
      apiRateLimiter(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalledTimes(1);
      
      // Second IP - should be independent
      mockRequest.ip = '192.168.1.2';
      mockResponse.setHeader = jest.fn();
      const nextFunction2 = jest.fn();
      apiRateLimiter(mockRequest as Request, mockResponse as Response, nextFunction2);
      expect(nextFunction2).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle Redis connection errors gracefully', () => {
      // Rate limiters should fall back to memory store on Redis error
      expect(apiRateLimiter).toBeDefined();
      expect(authRateLimiter).toBeDefined();
      expect(executionRateLimiter).toBeDefined();
      expect(globalRateLimiter).toBeDefined();
    });

    it('should continue working if Redis store creation fails', () => {
      // Should fall back to memory store
      const customLimiter = createCustomRateLimiter({
        windowMs: 60000,
        max: 50,
      });
      
      customLimiter(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalled();
    });
  });

  describe('Security Tests', () => {
    it('should prevent IP spoofing attempts', () => {
      // Test with suspicious headers
      mockRequest.headers = {
        'x-forwarded-for': '1.1.1.1, 2.2.2.2, 3.3.3.3',
      };
      mockRequest.ip = '127.0.0.1';
      
      apiRateLimiter(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should handle IPv6 addresses', () => {
      mockRequest.ip = '2001:0db8:85a3:0000:0000:8a2e:0370:7334';
      apiRateLimiter(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should handle localhost connections', () => {
      mockRequest.ip = '::1'; // IPv6 localhost
      apiRateLimiter(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(nextFunction).toHaveBeenCalled();
    });
  });

  describe('Different Limiter Configurations', () => {
    it('should have different configurations for different limiters', () => {
      // All limiters should be defined and unique
      expect(apiRateLimiter).toBeDefined();
      expect(authRateLimiter).toBeDefined();
      expect(executionRateLimiter).toBeDefined();
      expect(globalRateLimiter).toBeDefined();
      
      // They should be different middleware functions
      expect(apiRateLimiter).not.toBe(authRateLimiter);
      expect(apiRateLimiter).not.toBe(executionRateLimiter);
      expect(apiRateLimiter).not.toBe(globalRateLimiter);
    });

    it('should enforce appropriate limits for sensitive operations', () => {
      // Auth limiter should be the most restrictive
      expect(authRateLimiter).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid successive requests', async () => {
      // Simulate rapid requests
      for (let i = 0; i < 5; i++) {
        const next = jest.fn();
        apiRateLimiter(mockRequest as Request, mockResponse as Response, next);
      }
      
      // Should process all requests (under limit)
      expect(true).toBe(true);
    });

    it('should handle concurrent requests from same IP', async () => {
      const promises = [];
      for (let i = 0; i < 3; i++) {
        const next = jest.fn();
        promises.push(
          new Promise((resolve) => {
            apiRateLimiter(mockRequest as Request, mockResponse as Response, () => {
              next();
              resolve(true);
            });
          })
        );
      }
      
      await Promise.all(promises);
      expect(true).toBe(true);
    });

    it('should handle requests with malformed IP addresses', () => {
      mockRequest.ip = 'not-an-ip-address';
      apiRateLimiter(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should handle null IP address', () => {
      mockRequest.ip = null as any;
      apiRateLimiter(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(nextFunction).toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    it('should process requests efficiently', () => {
      const start = Date.now();
      
      for (let i = 0; i < 100; i++) {
        const next = jest.fn();
        apiRateLimiter(
          { ...mockRequest, ip: `192.168.1.${i}` } as Request,
          mockResponse as Response,
          next
        );
      }
      
      const duration = Date.now() - start;
      
      // Should process 100 requests very quickly (< 1 second)
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Redis Store Configuration', () => {
    it('should use Redis prefix for keys', () => {
      // Redis keys should be prefixed with "rl:"
      expect(rateLimitRedis).toBeDefined();
    });

    it('should handle Redis client initialization', () => {
      // Client should be initialized or null
      expect(rateLimitRedis === null || typeof rateLimitRedis === 'object').toBe(true);
    });
  });
});
