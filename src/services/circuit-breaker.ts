/**
 * Circuit Breaker Pattern Implementation
 * Prevents cascading failures by failing fast when a service is unhealthy
 */

import { logger } from "../utils/logger";

// ============================================
// Types and Interfaces
// ============================================

export enum CircuitState {
  CLOSED = "CLOSED", // Normal operation
  OPEN = "OPEN", // Failure threshold exceeded
  HALF_OPEN = "HALF_OPEN", // Testing if service recovered
}

export interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening
  successThreshold: number; // Number of successes to close from half-open
  timeout: number; // Time in ms before trying half-open
  resetTimeout: number; // Time in ms to wait in open state
  monitoringPeriod: number; // Time window for counting failures
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failures: number;
  successes: number;
  consecutiveFailures: number;
  consecutiveSuccesses: number;
  lastFailureTime: number | null;
  lastSuccessTime: number | null;
  totalCalls: number;
  totalFailures: number;
  totalSuccesses: number;
}

// ============================================
// Circuit Breaker Implementation
// ============================================

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures: number = 0;
  private successes: number = 0;
  private consecutiveFailures: number = 0;
  private consecutiveSuccesses: number = 0;
  private lastFailureTime: number | null = null;
  private lastSuccessTime: number | null = null;
  private totalCalls: number = 0;
  private totalFailures: number = 0;
  private totalSuccesses: number = 0;
  private nextAttempt: number = Date.now();

  constructor(
    private name: string,
    private config: CircuitBreakerConfig,
  ) {
    logger.info("Circuit breaker initialized", {
      name,
      config,
    });
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.totalCalls++;

    // Check if circuit is open
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttempt) {
        logger.warn("Circuit breaker is OPEN", {
          name: this.name,
          nextAttempt: new Date(this.nextAttempt).toISOString(),
        });
        throw new CircuitBreakerError(`Circuit breaker "${this.name}" is OPEN`);
      }

      // Try half-open state
      this.state = CircuitState.HALF_OPEN;
      logger.info("Circuit breaker entering HALF_OPEN state", {
        name: this.name,
      });
    }

    try {
      const result = await Promise.race([fn(), this.timeout()]);

      this.onSuccess();
      return result as T;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Timeout promise
   */
  private timeout(): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Circuit breaker "${this.name}" timeout`));
      }, this.config.timeout);
    });
  }

  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    this.totalSuccesses++;
    this.successes++;
    this.consecutiveSuccesses++;
    this.consecutiveFailures = 0;
    this.lastSuccessTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      if (this.consecutiveSuccesses >= this.config.successThreshold) {
        this.state = CircuitState.CLOSED;
        this.resetCounts();
        logger.info("Circuit breaker closed after recovery", {
          name: this.name,
        });
      }
    }
  }

  /**
   * Handle failed execution
   */
  private onFailure(): void {
    this.totalFailures++;
    this.failures++;
    this.consecutiveFailures++;
    this.consecutiveSuccesses = 0;
    this.lastFailureTime = Date.now();

    logger.warn("Circuit breaker recorded failure", {
      name: this.name,
      consecutiveFailures: this.consecutiveFailures,
      threshold: this.config.failureThreshold,
    });

    if (this.state === CircuitState.HALF_OPEN) {
      // Immediately open if failure in half-open state
      this.openCircuit();
    } else if (this.consecutiveFailures >= this.config.failureThreshold) {
      this.openCircuit();
    }
  }

  /**
   * Open the circuit
   */
  private openCircuit(): void {
    this.state = CircuitState.OPEN;
    this.nextAttempt = Date.now() + this.config.resetTimeout;

    logger.error("Circuit breaker opened", {
      name: this.name,
      consecutiveFailures: this.consecutiveFailures,
      nextAttempt: new Date(this.nextAttempt).toISOString(),
    });
  }

  /**
   * Reset counters
   */
  private resetCounts(): void {
    this.failures = 0;
    this.successes = 0;
    this.consecutiveFailures = 0;
    this.consecutiveSuccesses = 0;
  }

  /**
   * Get current circuit breaker stats
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      consecutiveFailures: this.consecutiveFailures,
      consecutiveSuccesses: this.consecutiveSuccesses,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      totalCalls: this.totalCalls,
      totalFailures: this.totalFailures,
      totalSuccesses: this.totalSuccesses,
    };
  }

  /**
   * Force open the circuit (for manual intervention)
   */
  forceOpen(): void {
    this.state = CircuitState.OPEN;
    this.nextAttempt = Date.now() + this.config.resetTimeout;
    logger.warn("Circuit breaker manually forced open", {
      name: this.name,
    });
  }

  /**
   * Force close the circuit (for manual intervention)
   */
  forceClose(): void {
    this.state = CircuitState.CLOSED;
    this.resetCounts();
    logger.info("Circuit breaker manually forced closed", {
      name: this.name,
    });
  }
}

// ============================================
// Circuit Breaker Error
// ============================================

export class CircuitBreakerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CircuitBreakerError";
  }
}

// ============================================
// Circuit Breaker Registry
// ============================================

export class CircuitBreakerRegistry {
  private breakers: Map<string, CircuitBreaker> = new Map();

  /**
   * Get or create a circuit breaker
   */
  getOrCreate(
    name: string,
    config?: Partial<CircuitBreakerConfig>,
  ): CircuitBreaker {
    if (!this.breakers.has(name)) {
      const defaultConfig: CircuitBreakerConfig = {
        failureThreshold: 5,
        successThreshold: 2,
        timeout: 10000,
        resetTimeout: 60000,
        monitoringPeriod: 120000,
        ...config,
      };

      this.breakers.set(name, new CircuitBreaker(name, defaultConfig));
    }

    return this.breakers.get(name)!;
  }

  /**
   * Get all circuit breaker stats
   */
  getAllStats(): Record<string, CircuitBreakerStats> {
    const stats: Record<string, CircuitBreakerStats> = {};

    this.breakers.forEach((breaker, name) => {
      stats[name] = breaker.getStats();
    });

    return stats;
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    this.breakers.forEach((breaker) => breaker.forceClose());
    logger.info("All circuit breakers reset");
  }
}

// Export singleton registry
export const circuitBreakerRegistry = new CircuitBreakerRegistry();

// ============================================
// Pre-configured Circuit Breakers
// ============================================

// Database circuit breaker
export const databaseCircuitBreaker = circuitBreakerRegistry.getOrCreate(
  "database",
  {
    failureThreshold: 5,
    successThreshold: 2,
    timeout: 5000,
    resetTimeout: 30000,
    monitoringPeriod: 60000,
  },
);

// External API circuit breaker
export const apiCircuitBreaker = circuitBreakerRegistry.getOrCreate(
  "external-api",
  {
    failureThreshold: 3,
    successThreshold: 2,
    timeout: 10000,
    resetTimeout: 60000,
    monitoringPeriod: 120000,
  },
);

// Redis circuit breaker
export const redisCircuitBreaker = circuitBreakerRegistry.getOrCreate("redis", {
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 3000,
  resetTimeout: 30000,
  monitoringPeriod: 60000,
});

// Browser automation circuit breaker
export const browserCircuitBreaker = circuitBreakerRegistry.getOrCreate(
  "browser-automation",
  {
    failureThreshold: 3,
    successThreshold: 2,
    timeout: 30000,
    resetTimeout: 120000,
    monitoringPeriod: 180000,
  },
);
