/**
 * Performance Optimization Middleware
 * Implements connection pooling, caching, and compression
 */

import compression from "compression";
import responseTime from "response-time";
import { Request, Response, NextFunction } from "express";

/**
 * Response compression middleware
 * Compresses responses for improved network performance
 */
export const compressionMiddleware = compression({
  // Only compress responses larger than 1kb
  threshold: 1024,
  // Compression level (0-9, 6 is default)
  level: 6,
  // Filter function to determine what to compress
  filter: (req: Request, res: Response) => {
    if (req.headers["x-no-compression"]) {
      return false;
    }
    // Use compression's default filter
    return compression.filter(req, res);
  },
});

/**
 * Response time tracker middleware
 * Adds X-Response-Time header to responses
 */
export const responseTimeMiddleware = responseTime(
  (req: Request, res: Response, time: number) => {
    // Log slow requests (>1 second)
    if (time > 1000) {
      console.warn(
        `Slow request: ${req.method} ${req.url} took ${time.toFixed(2)}ms`,
      );
    }
  },
);

/**
 * Request deduplication cache
 * Prevents duplicate concurrent requests
 */
class RequestDeduplicator {
  private pendingRequests: Map<string, Promise<any>> = new Map();

  /**
   * Get cached response or execute request
   */
  async deduplicate<T>(
    key: string,
    fn: () => Promise<T>,
    ttl: number = 5000,
  ): Promise<T> {
    // Check if request is already pending
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key) as Promise<T>;
    }

    // Execute request and cache promise
    const promise = fn().finally(() => {
      // Remove from cache after TTL
      setTimeout(() => {
        this.pendingRequests.delete(key);
      }, ttl);
    });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  /**
   * Clear all pending requests
   */
  clear(): void {
    this.pendingRequests.clear();
  }
}

export const requestDeduplicator = new RequestDeduplicator();

/**
 * Simple in-memory cache with TTL
 */
class MemoryCache {
  private cache: Map<string, { value: any; expires: number }> = new Map();

  /**
   * Get value from cache
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    // Check if expired
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  /**
   * Set value in cache with TTL
   */
  set(key: string, value: any, ttl: number = 300000): void {
    this.cache.set(key, {
      value,
      expires: Date.now() + ttl,
    });
  }

  /**
   * Delete value from cache
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.cache.delete(key);
      }
    }
  }
}

export const memoryCache = new MemoryCache();

// Cleanup expired cache entries every 5 minutes
setInterval(
  () => {
    memoryCache.cleanup();
  },
  5 * 60 * 1000,
);

/**
 * Cache middleware for GET requests
 */
export const cacheMiddleware = (ttl: number = 300000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== "GET") {
      return next();
    }

    const key = `cache:${req.url}`;
    const cached = memoryCache.get(key);

    if (cached) {
      res.set("X-Cache", "HIT");
      return res.json(cached);
    }

    // Override res.json to cache the response
    const originalJson = res.json.bind(res);
    res.json = function (body: any) {
      memoryCache.set(key, body, ttl);
      res.set("X-Cache", "MISS");
      return originalJson(body);
    };

    next();
  };
};

/**
 * Connection pooling configuration
 * Used for database connections
 */
export interface PoolConfig {
  min: number;
  max: number;
  acquireTimeoutMillis: number;
  idleTimeoutMillis: number;
}

export const defaultPoolConfig: PoolConfig = {
  min: 2,
  max: 20,
  acquireTimeoutMillis: 30000,
  idleTimeoutMillis: 30000,
};

/**
 * Performance metrics collector
 */
class PerformanceMetrics {
  private metrics: {
    requestCount: number;
    errorCount: number;
    totalResponseTime: number;
    cacheHits: number;
    cacheMisses: number;
  } = {
    requestCount: 0,
    errorCount: 0,
    totalResponseTime: 0,
    cacheHits: 0,
    cacheMisses: 0,
  };

  recordRequest(responseTime: number): void {
    this.metrics.requestCount++;
    this.metrics.totalResponseTime += responseTime;
  }

  recordError(): void {
    this.metrics.errorCount++;
  }

  recordCacheHit(): void {
    this.metrics.cacheHits++;
  }

  recordCacheMiss(): void {
    this.metrics.cacheMisses++;
  }

  getMetrics() {
    return {
      ...this.metrics,
      averageResponseTime:
        this.metrics.requestCount > 0
          ? this.metrics.totalResponseTime / this.metrics.requestCount
          : 0,
      cacheHitRate:
        this.metrics.cacheHits + this.metrics.cacheMisses > 0
          ? (this.metrics.cacheHits /
              (this.metrics.cacheHits + this.metrics.cacheMisses)) *
            100
          : 0,
    };
  }

  reset(): void {
    this.metrics = {
      requestCount: 0,
      errorCount: 0,
      totalResponseTime: 0,
      cacheHits: 0,
      cacheMisses: 0,
    };
  }
}

export const performanceMetrics = new PerformanceMetrics();
