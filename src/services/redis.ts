/**
 * Redis Service - Centralized Redis connection and operations
 * 
 * Provides:
 * - Session caching
 * - Workflow state tracking
 * - Distributed locks
 * - Generic key-value operations
 * 
 * Gracefully degrades to in-memory storage when Redis is unavailable
 */

import Redis from 'ioredis';

// Configuration
const REDIS_ENABLED = process.env.REDIS_ENABLED === 'true' || process.env.NODE_ENV === 'production';
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379');
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;
const REDIS_DB = parseInt(process.env.REDIS_DB || '0');

// Key prefixes for namespacing
export const KEY_PREFIXES = {
  SESSION: 'wks:session:',
  WORKFLOW_STATE: 'wks:workflow:',
  EXECUTION_LOCK: 'wks:lock:execution:',
  ACTIVE_EXECUTIONS: 'wks:executions:active',
  API_CACHE: 'wks:cache:api:',
  RATE_LIMIT: 'wks:ratelimit:',
} as const;

// Default TTLs (in seconds)
export const DEFAULT_TTL = {
  SESSION: 86400, // 24 hours
  WORKFLOW_STATE: 3600, // 1 hour
  EXECUTION_LOCK: 300, // 5 minutes
  API_CACHE: 3600, // 1 hour
  RATE_LIMIT: 900, // 15 minutes
} as const;

// In-memory fallback store
interface MemoryItem {
  value: string;
  expiry: number | null;
}

const memoryStore = new Map<string, MemoryItem>();

/**
 * Clean up expired items from memory store
 */
function cleanupMemoryStore(): void {
  const now = Date.now();
  for (const [key, item] of memoryStore.entries()) {
    if (item.expiry !== null && item.expiry < now) {
      memoryStore.delete(key);
    }
  }
}

// Run cleanup every minute
setInterval(cleanupMemoryStore, 60000);

/**
 * Redis Client singleton
 */
class RedisService {
  private client: Redis | null = null;
  private isConnected = false;
  private useRedis = REDIS_ENABLED;

  constructor() {
    if (this.useRedis) {
      this.initializeClient();
    } else {
      console.log('📝 Redis disabled, using in-memory store');
    }
  }

  /**
   * Initialize Redis client with connection handling
   */
  private initializeClient(): void {
    this.client = new Redis({
      host: REDIS_HOST,
      port: REDIS_PORT,
      password: REDIS_PASSWORD,
      db: REDIS_DB,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) {
          console.error('❌ Redis connection failed after 3 retries, falling back to memory store');
          this.useRedis = false;
          return null;
        }
        return Math.min(times * 50, 200); // Exponential backoff
      },
    });

    this.client.on('connect', () => {
      this.isConnected = true;
      console.log('✅ Redis client connected');
    });

    this.client.on('error', (err) => {
      console.error('❌ Redis client error:', err.message);
      this.isConnected = false;
    });

    this.client.on('close', () => {
      this.isConnected = false;
      console.warn('⚠️  Redis connection closed');
    });
  }

  /**
   * Check if Redis is available
   */
  isAvailable(): boolean {
    return this.useRedis && this.isConnected && this.client !== null;
  }

  /**
   * Get value by key
   */
  async get(key: string): Promise<string | null> {
    if (this.isAvailable() && this.client) {
      try {
        return await this.client.get(key);
      } catch (error) {
        console.error('Redis GET error:', error);
        return this.getFromMemory(key);
      }
    }
    return this.getFromMemory(key);
  }

  /**
   * Set value with optional TTL
   */
  async set(key: string, value: string, ttl?: number): Promise<boolean> {
    if (this.isAvailable() && this.client) {
      try {
        if (ttl) {
          await this.client.setex(key, ttl, value);
        } else {
          await this.client.set(key, value);
        }
        return true;
      } catch (error) {
        console.error('Redis SET error:', error);
        return this.setInMemory(key, value, ttl);
      }
    }
    return this.setInMemory(key, value, ttl);
  }

  /**
   * Delete key
   */
  async del(key: string): Promise<boolean> {
    if (this.isAvailable() && this.client) {
      try {
        await this.client.del(key);
        return true;
      } catch (error) {
        console.error('Redis DEL error:', error);
        memoryStore.delete(key);
        return true;
      }
    }
    memoryStore.delete(key);
    return true;
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    if (this.isAvailable() && this.client) {
      try {
        const result = await this.client.exists(key);
        return result === 1;
      } catch (error) {
        console.error('Redis EXISTS error:', error);
        return this.existsInMemory(key);
      }
    }
    return this.existsInMemory(key);
  }

  /**
   * Set key with NX flag (only if not exists) - for distributed locks
   */
  async setNX(key: string, value: string, ttl: number): Promise<boolean> {
    if (this.isAvailable() && this.client) {
      try {
        const result = await this.client.set(key, value, 'EX', ttl, 'NX');
        return result === 'OK';
      } catch (error) {
        console.error('Redis SETNX error:', error);
        return this.setNXInMemory(key, value, ttl);
      }
    }
    return this.setNXInMemory(key, value, ttl);
  }

  /**
   * Add to set
   */
  async sadd(key: string, ...members: string[]): Promise<number> {
    if (this.isAvailable() && this.client) {
      try {
        return await this.client.sadd(key, ...members);
      } catch (error) {
        console.error('Redis SADD error:', error);
        return this.saddInMemory(key, ...members);
      }
    }
    return this.saddInMemory(key, ...members);
  }

  /**
   * Remove from set
   */
  async srem(key: string, ...members: string[]): Promise<number> {
    if (this.isAvailable() && this.client) {
      try {
        return await this.client.srem(key, ...members);
      } catch (error) {
        console.error('Redis SREM error:', error);
        return this.sremInMemory(key, ...members);
      }
    }
    return this.sremInMemory(key, ...members);
  }

  /**
   * Get all set members
   */
  async smembers(key: string): Promise<string[]> {
    if (this.isAvailable() && this.client) {
      try {
        return await this.client.smembers(key);
      } catch (error) {
        console.error('Redis SMEMBERS error:', error);
        return this.smembersInMemory(key);
      }
    }
    return this.smembersInMemory(key);
  }

  /**
   * Hash set field
   */
  async hset(key: string, field: string, value: string): Promise<number> {
    if (this.isAvailable() && this.client) {
      try {
        return await this.client.hset(key, field, value);
      } catch (error) {
        console.error('Redis HSET error:', error);
        return this.hsetInMemory(key, field, value);
      }
    }
    return this.hsetInMemory(key, field, value);
  }

  /**
   * Hash get field
   */
  async hget(key: string, field: string): Promise<string | null> {
    if (this.isAvailable() && this.client) {
      try {
        return await this.client.hget(key, field);
      } catch (error) {
        console.error('Redis HGET error:', error);
        return this.hgetInMemory(key, field);
      }
    }
    return this.hgetInMemory(key, field);
  }

  /**
   * Hash get all fields
   */
  async hgetall(key: string): Promise<Record<string, string>> {
    if (this.isAvailable() && this.client) {
      try {
        return await this.client.hgetall(key);
      } catch (error) {
        console.error('Redis HGETALL error:', error);
        return this.hgetallInMemory(key);
      }
    }
    return this.hgetallInMemory(key);
  }

  /**
   * Increment value
   */
  async incr(key: string): Promise<number> {
    if (this.isAvailable() && this.client) {
      try {
        return await this.client.incr(key);
      } catch (error) {
        console.error('Redis INCR error:', error);
        return this.incrInMemory(key);
      }
    }
    return this.incrInMemory(key);
  }

  /**
   * Set TTL on existing key
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    if (this.isAvailable() && this.client) {
      try {
        const result = await this.client.expire(key, seconds);
        return result === 1;
      } catch (error) {
        console.error('Redis EXPIRE error:', error);
        return this.expireInMemory(key, seconds);
      }
    }
    return this.expireInMemory(key, seconds);
  }

  /**
   * Get TTL of key
   */
  async ttl(key: string): Promise<number> {
    if (this.isAvailable() && this.client) {
      try {
        return await this.client.ttl(key);
      } catch (error) {
        console.error('Redis TTL error:', error);
        return this.ttlInMemory(key);
      }
    }
    return this.ttlInMemory(key);
  }

  /**
   * Disconnect Redis client
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
      this.client = null;
    }
  }

  // ===== Memory Store Fallback Methods =====

  private getFromMemory(key: string): string | null {
    const item = memoryStore.get(key);
    if (!item) return null;
    if (item.expiry !== null && item.expiry < Date.now()) {
      memoryStore.delete(key);
      return null;
    }
    return item.value;
  }

  private setInMemory(key: string, value: string, ttl?: number): boolean {
    const expiry = ttl ? Date.now() + ttl * 1000 : null;
    memoryStore.set(key, { value, expiry });
    return true;
  }

  private existsInMemory(key: string): boolean {
    const item = memoryStore.get(key);
    if (!item) return false;
    if (item.expiry !== null && item.expiry < Date.now()) {
      memoryStore.delete(key);
      return false;
    }
    return true;
  }

  private setNXInMemory(key: string, value: string, ttl: number): boolean {
    if (this.existsInMemory(key)) return false;
    return this.setInMemory(key, value, ttl);
  }

  private saddInMemory(key: string, ...members: string[]): number {
    const item = memoryStore.get(key);
    let set: Set<string>;
    
    if (item) {
      set = new Set(JSON.parse(item.value));
    } else {
      set = new Set();
    }
    
    const initialSize = set.size;
    members.forEach(m => set.add(m));
    
    memoryStore.set(key, { 
      value: JSON.stringify([...set]), 
      expiry: null 
    });
    
    return set.size - initialSize;
  }

  private sremInMemory(key: string, ...members: string[]): number {
    const item = memoryStore.get(key);
    if (!item) return 0;
    
    const set = new Set(JSON.parse(item.value));
    const initialSize = set.size;
    members.forEach(m => set.delete(m));
    
    if (set.size === 0) {
      memoryStore.delete(key);
    } else {
      memoryStore.set(key, { 
        value: JSON.stringify([...set]), 
        expiry: null 
      });
    }
    
    return initialSize - set.size;
  }

  private smembersInMemory(key: string): string[] {
    const item = memoryStore.get(key);
    if (!item) return [];
    return JSON.parse(item.value);
  }

  private hsetInMemory(key: string, field: string, value: string): number {
    const item = memoryStore.get(key);
    let hash: Record<string, string>;
    
    if (item) {
      hash = JSON.parse(item.value);
    } else {
      hash = {};
    }
    
    const isNew = !hash[field];
    hash[field] = value;
    
    memoryStore.set(key, { 
      value: JSON.stringify(hash), 
      expiry: null 
    });
    
    return isNew ? 1 : 0;
  }

  private hgetInMemory(key: string, field: string): string | null {
    const item = memoryStore.get(key);
    if (!item) return null;
    const hash = JSON.parse(item.value);
    return hash[field] || null;
  }

  private hgetallInMemory(key: string): Record<string, string> {
    const item = memoryStore.get(key);
    if (!item) return {};
    return JSON.parse(item.value);
  }

  private incrInMemory(key: string): number {
    const item = memoryStore.get(key);
    const current = item ? parseInt(item.value) : 0;
    const newValue = current + 1;
    memoryStore.set(key, { 
      value: String(newValue), 
      expiry: item?.expiry || null 
    });
    return newValue;
  }

  private expireInMemory(key: string, seconds: number): boolean {
    const item = memoryStore.get(key);
    if (!item) return false;
    item.expiry = Date.now() + seconds * 1000;
    return true;
  }

  private ttlInMemory(key: string): number {
    const item = memoryStore.get(key);
    if (!item) return -2; // Key doesn't exist
    if (item.expiry === null) return -1; // No expiry
    const remaining = Math.floor((item.expiry - Date.now()) / 1000);
    return remaining > 0 ? remaining : -2;
  }
}

// Export singleton instance
export const redisService = new RedisService();

// Export convenience functions for common operations

/**
 * Session management
 */
export async function setSession(userId: string, sessionData: object, ttl?: number): Promise<boolean> {
  const key = `${KEY_PREFIXES.SESSION}${userId}`;
  return await redisService.set(key, JSON.stringify(sessionData), ttl || DEFAULT_TTL.SESSION);
}

export async function getSession(userId: string): Promise<object | null> {
  const key = `${KEY_PREFIXES.SESSION}${userId}`;
  const data = await redisService.get(key);
  return data ? JSON.parse(data) : null;
}

export async function deleteSession(userId: string): Promise<boolean> {
  const key = `${KEY_PREFIXES.SESSION}${userId}`;
  return await redisService.del(key);
}

/**
 * Workflow state management
 */
export async function setWorkflowState(executionId: string, state: object, ttl?: number): Promise<boolean> {
  const key = `${KEY_PREFIXES.WORKFLOW_STATE}${executionId}`;
  return await redisService.set(key, JSON.stringify(state), ttl || DEFAULT_TTL.WORKFLOW_STATE);
}

export async function getWorkflowState(executionId: string): Promise<object | null> {
  const key = `${KEY_PREFIXES.WORKFLOW_STATE}${executionId}`;
  const data = await redisService.get(key);
  return data ? JSON.parse(data) : null;
}

export async function deleteWorkflowState(executionId: string): Promise<boolean> {
  const key = `${KEY_PREFIXES.WORKFLOW_STATE}${executionId}`;
  return await redisService.del(key);
}

/**
 * Distributed locks for workflow execution
 */
export async function acquireExecutionLock(executionId: string, workerId: string, ttl?: number): Promise<boolean> {
  const key = `${KEY_PREFIXES.EXECUTION_LOCK}${executionId}`;
  return await redisService.setNX(key, workerId, ttl || DEFAULT_TTL.EXECUTION_LOCK);
}

export async function releaseExecutionLock(executionId: string): Promise<boolean> {
  const key = `${KEY_PREFIXES.EXECUTION_LOCK}${executionId}`;
  return await redisService.del(key);
}

export async function checkExecutionLock(executionId: string): Promise<string | null> {
  const key = `${KEY_PREFIXES.EXECUTION_LOCK}${executionId}`;
  return await redisService.get(key);
}

/**
 * Active executions tracking
 */
export async function addActiveExecution(executionId: string): Promise<number> {
  return await redisService.sadd(KEY_PREFIXES.ACTIVE_EXECUTIONS, executionId);
}

export async function removeActiveExecution(executionId: string): Promise<number> {
  return await redisService.srem(KEY_PREFIXES.ACTIVE_EXECUTIONS, executionId);
}

export async function getActiveExecutions(): Promise<string[]> {
  return await redisService.smembers(KEY_PREFIXES.ACTIVE_EXECUTIONS);
}

/**
 * API response caching
 */
export async function cacheAPIResponse(hash: string, response: object, ttl?: number): Promise<boolean> {
  const key = `${KEY_PREFIXES.API_CACHE}${hash}`;
  return await redisService.set(key, JSON.stringify(response), ttl || DEFAULT_TTL.API_CACHE);
}

export async function getCachedAPIResponse(hash: string): Promise<object | null> {
  const key = `${KEY_PREFIXES.API_CACHE}${hash}`;
  const data = await redisService.get(key);
  return data ? JSON.parse(data) : null;
}

/**
 * Health check
 */
export async function redisHealthCheck(): Promise<{ healthy: boolean; usingRedis: boolean; connected: boolean }> {
  const usingRedis = redisService.isAvailable();
  let connected = false;

  if (usingRedis) {
    try {
      await redisService.set('health:check', 'ok', 10);
      const value = await redisService.get('health:check');
      connected = value === 'ok';
      await redisService.del('health:check');
    } catch {
      connected = false;
    }
  }

  return {
    healthy: true, // Always healthy (falls back to memory)
    usingRedis,
    connected,
  };
}
