/**
 * Test Environment Configuration
 * Supports both live and mock testing modes with graceful degradation
 */

export const TEST_CONFIG = {
  // Test mode: 'live' or 'mock'
  mode: process.env.TEST_MODE || "live",

  // Service availability
  services: {
    redis: {
      enabled: process.env.REDIS_ENABLED === "true",
      required: false, // Redis is optional
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379"),
    },
    database: {
      enabled: true,
      required: true, // Database is required
    },
  },

  // Timeout configurations
  timeouts: {
    connection: 5000, // 5 seconds to connect
    operation: 10000, // 10 seconds per operation
  },

  // Retry configurations
  retry: {
    maxAttempts: 3,
    backoff: 1000, // 1 second initial backoff
  },
};

/**
 * Check if a service is available
 */
export async function isServiceAvailable(
  serviceName: keyof typeof TEST_CONFIG.services,
): Promise<boolean> {
  const service = TEST_CONFIG.services[serviceName];

  if (!service.enabled) {
    return false;
  }

  // Add specific health checks here
  if (serviceName === "redis") {
    try {
      const redisService = service as {
        enabled: boolean;
        required: boolean;
        host: string;
        port: number;
      };
      const Redis = require("ioredis");
      const client = new Redis({
        host: redisService.host,
        port: redisService.port,
        connectTimeout: TEST_CONFIG.timeouts.connection,
        maxRetriesPerRequest: 1,
        lazyConnect: true,
      });

      await client.connect();
      await client.ping();
      await client.quit();
      return true;
    } catch (error) {
      return false;
    }
  }

  return true;
}

/**
 * Skip test if service is not available and not required
 */
export function skipIfServiceUnavailable(
  serviceName: keyof typeof TEST_CONFIG.services,
) {
  return async () => {
    const available = await isServiceAvailable(serviceName);
    const service = TEST_CONFIG.services[serviceName];

    if (!available && service.required) {
      throw new Error(`Required service ${serviceName} is not available`);
    }

    return !available;
  };
}
