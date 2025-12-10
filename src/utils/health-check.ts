/**
 * Health Check System
 *
 * Provides liveness and readiness probes for agents and services
 *
 * @module utils/health-check
 * @version 1.0.0
 */

import { logger } from "./logger";

export enum HealthStatus {
  HEALTHY = "healthy",
  DEGRADED = "degraded",
  UNHEALTHY = "unhealthy",
}

export interface HealthCheckResult {
  status: HealthStatus;
  timestamp: string;
  uptime: number;
  checks: {
    [key: string]: {
      status: HealthStatus;
      message?: string;
      responseTime?: number;
      lastCheck?: string;
    };
  };
  metrics?: {
    [key: string]: number | string;
  };
}

export interface HealthCheck {
  name: string;
  check: () => Promise<{ healthy: boolean; message?: string }>;
  critical?: boolean;
  timeout?: number;
}

/**
 * Health check manager
 */
export class HealthCheckManager {
  private checks: Map<string, HealthCheck> = new Map();
  private results: Map<string, any> = new Map();
  private startTime: number = Date.now();

  /**
   * Register a health check
   */
  register(check: HealthCheck): void {
    this.checks.set(check.name, check);
    logger.info(`Health check registered: ${check.name}`);
  }

  /**
   * Unregister a health check
   */
  unregister(name: string): void {
    this.checks.delete(name);
    this.results.delete(name);
    logger.info(`Health check unregistered: ${name}`);
  }

  /**
   * Run all health checks
   */
  async runAll(): Promise<HealthCheckResult> {
    const checkResults: Record<string, any> = {};
    let overallStatus = HealthStatus.HEALTHY;

    for (const [name, check] of this.checks.entries()) {
      const startTime = Date.now();
      try {
        const timeout = check.timeout || 5000;
        let timeoutId: NodeJS.Timeout | undefined;

        const result = await Promise.race([
          check.check().then((res) => {
            clearTimeout(timeoutId);
            return res;
          }),
          new Promise<{ healthy: boolean; message: string }>((_, reject) => {
            timeoutId = setTimeout(
              () => reject(new Error("Health check timeout")),
              timeout,
            );
          }),
        ]);

        // Clear timeout to prevent memory leak
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        const responseTime = Date.now() - startTime;
        const status = result.healthy
          ? HealthStatus.HEALTHY
          : HealthStatus.UNHEALTHY;

        checkResults[name] = {
          status,
          message: result.message,
          responseTime,
          lastCheck: new Date().toISOString(),
        };

        this.results.set(name, checkResults[name]);

        // Update overall status
        if (status === HealthStatus.UNHEALTHY && check.critical !== false) {
          overallStatus = HealthStatus.UNHEALTHY;
        } else if (
          status === HealthStatus.UNHEALTHY &&
          overallStatus === HealthStatus.HEALTHY
        ) {
          overallStatus = HealthStatus.DEGRADED;
        }
      } catch (error) {
        const responseTime = Date.now() - startTime;
        checkResults[name] = {
          status: HealthStatus.UNHEALTHY,
          message: error instanceof Error ? error.message : "Unknown error",
          responseTime,
          lastCheck: new Date().toISOString(),
        };

        this.results.set(name, checkResults[name]);

        if (check.critical !== false) {
          overallStatus = HealthStatus.UNHEALTHY;
        }
      }
    }

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      checks: checkResults,
    };
  }

  /**
   * Run a specific health check
   */
  async runCheck(name: string): Promise<any> {
    const check = this.checks.get(name);
    if (!check) {
      throw new Error(`Health check not found: ${name}`);
    }

    const startTime = Date.now();
    try {
      const result = await check.check();
      const responseTime = Date.now() - startTime;

      return {
        status: result.healthy ? HealthStatus.HEALTHY : HealthStatus.UNHEALTHY,
        message: result.message,
        responseTime,
        lastCheck: new Date().toISOString(),
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        status: HealthStatus.UNHEALTHY,
        message: error instanceof Error ? error.message : "Unknown error",
        responseTime,
        lastCheck: new Date().toISOString(),
      };
    }
  }

  /**
   * Get cached results without running checks
   */
  getResults(): HealthCheckResult {
    const checkResults: Record<string, any> = {};
    let overallStatus = HealthStatus.HEALTHY;

    for (const [name, result] of this.results.entries()) {
      checkResults[name] = result;

      const check = this.checks.get(name);
      if (
        result.status === HealthStatus.UNHEALTHY &&
        check?.critical !== false
      ) {
        overallStatus = HealthStatus.UNHEALTHY;
      } else if (
        result.status === HealthStatus.UNHEALTHY &&
        overallStatus === HealthStatus.HEALTHY
      ) {
        overallStatus = HealthStatus.DEGRADED;
      }
    }

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      checks: checkResults,
    };
  }

  /**
   * Check if system is healthy
   */
  isHealthy(): boolean {
    const result = this.getResults();
    return result.status === HealthStatus.HEALTHY;
  }

  /**
   * Check if system is ready (liveness check)
   */
  async isReady(): Promise<boolean> {
    try {
      const result = await this.runAll();
      return result.status !== HealthStatus.UNHEALTHY;
    } catch (error) {
      logger.error("Readiness check failed", { error });
      return false;
    }
  }
}

// Singleton instance
export const healthCheckManager = new HealthCheckManager();

// Common health checks

/**
 * Memory usage health check
 */
export function memoryHealthCheck(thresholdPercent = 90): HealthCheck {
  return {
    name: "memory",
    check: async () => {
      const usage = process.memoryUsage();
      const heapUsedPercent = (usage.heapUsed / usage.heapTotal) * 100;

      return {
        healthy: heapUsedPercent < thresholdPercent,
        message:
          heapUsedPercent >= thresholdPercent
            ? `Memory usage high: ${heapUsedPercent.toFixed(2)}%`
            : `Memory usage: ${heapUsedPercent.toFixed(2)}%`,
      };
    },
    critical: false,
    timeout: 1000,
  };
}

/**
 * Event loop lag health check
 */
export function eventLoopHealthCheck(thresholdMs = 100): HealthCheck {
  return {
    name: "event_loop",
    check: async () => {
      const start = Date.now();
      await new Promise((resolve) => setImmediate(resolve));
      const lag = Date.now() - start;

      return {
        healthy: lag < thresholdMs,
        message:
          lag >= thresholdMs
            ? `Event loop lag: ${lag}ms`
            : `Event loop lag: ${lag}ms`,
      };
    },
    critical: false,
    timeout: 2000,
  };
}

/**
 * Process uptime health check
 */
export function uptimeHealthCheck(minUptimeSeconds = 10): HealthCheck {
  return {
    name: "uptime",
    check: async () => {
      const uptime = process.uptime();

      return {
        healthy: uptime >= minUptimeSeconds,
        message: `Uptime: ${uptime.toFixed(0)}s`,
      };
    },
    critical: true,
    timeout: 1000,
  };
}
