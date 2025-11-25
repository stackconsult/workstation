/**
 * Performance Monitoring Service
 * 
 * Monitors agent performance, connection pooling, and health scoring.
 * Provides metrics for Chrome Extension v2.0 backend integration.
 * 
 * @module services/performance-monitor
 * @version 2.0.0
 */

import { EventEmitter } from 'events';
import { logger } from '../utils/logger';
import { agentOrchestrator } from './agent-orchestrator';

export interface AgentPerformanceMetrics {
  agentId: string;
  agentName: string;
  healthScore: number; // 0-100
  responseTime: number; // milliseconds
  successRate: number; // 0-100
  errorCount: number;
  lastChecked: string;
}

export interface ConnectionPoolMetrics {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  waitingConnections: number;
  poolUtilization: number; // 0-100
}

export interface SystemMetrics {
  agents: AgentPerformanceMetrics[];
  connectionPool: ConnectionPoolMetrics;
  timestamp: string;
}

export class PerformanceMonitor extends EventEmitter {
  private metrics: Map<string, AgentPerformanceMetrics> = new Map();
  private connectionPool: ConnectionPoolMetrics = {
    totalConnections: 0,
    activeConnections: 0,
    idleConnections: 0,
    waitingConnections: 0,
    poolUtilization: 0,
  };
  private monitorInterval: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private checkIntervalMs: number = 10000; // 10 seconds

  constructor(intervalMs?: number) {
    super();
    if (intervalMs) {
      this.checkIntervalMs = intervalMs;
    }
  }

  /**
   * Start performance monitoring
   */
  public start(): void {
    if (this.isRunning) {
      logger.warn('Performance monitor already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting performance monitor', { 
      interval: this.checkIntervalMs 
    });

    // Perform initial check
    this.performHealthCheck().catch((error) => {
      logger.error('Initial health check failed', { error: error.message });
    });

    // Schedule periodic checks
    this.monitorInterval = setInterval(() => {
      this.performHealthCheck().catch((error) => {
        logger.error('Health check failed', { error: error.message });
      });
    }, this.checkIntervalMs);

    this.emit('started', { interval: this.checkIntervalMs });
  }

  /**
   * Stop performance monitoring
   */
  public stop(): void {
    if (!this.isRunning) {
      return;
    }

    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }

    this.isRunning = false;
    logger.info('Performance monitor stopped');
    this.emit('stopped');
  }

  /**
   * Perform health check on all agents
   */
  private async performHealthCheck(): Promise<void> {
    const checkStartTime = Date.now();

    try {
      const agents = await agentOrchestrator.getAllAgents();

      for (const agent of agents) {
        const metrics = await this.checkAgentHealth(agent.id, agent.name);
        this.metrics.set(agent.id, metrics);
      }

      // Update connection pool metrics
      this.updateConnectionPoolMetrics();

      const checkDuration = Date.now() - checkStartTime;
      logger.debug('Health check completed', {
        agentCount: agents.length,
        durationMs: checkDuration,
      });

      // Emit metrics event
      this.emit('metrics', this.getMetrics());

      // Emit alerts for unhealthy agents
      this.checkAndEmitAlerts();
    } catch (error) {
      logger.error('Health check error', { error: (error as Error).message });
      this.emit('error', error);
    }
  }

  /**
   * Check individual agent health
   */
  private async checkAgentHealth(
    agentId: string,
    agentName: string
  ): Promise<AgentPerformanceMetrics> {
    const startTime = Date.now();

    try {
      // Get agent from orchestrator
      const agent = await agentOrchestrator.getAgent(agentId);
      const responseTime = Date.now() - startTime;

      if (!agent) {
        return {
          agentId,
          agentName,
          healthScore: 0,
          responseTime: 0,
          successRate: 0,
          errorCount: 1,
          lastChecked: new Date().toISOString(),
        };
      }

      // Calculate health score based on status
      const healthScore = this.calculateHealthScore(
        agent.healthStatus,
        agent.status,
        responseTime
      );

      // Get error count from previous metrics
      const previousMetrics = this.metrics.get(agentId);
      const errorCount = agent.healthStatus === 'healthy' 
        ? 0 
        : (previousMetrics?.errorCount || 0) + 1;

      // Calculate success rate (simplified)
      const successRate = agent.healthStatus === 'healthy' ? 100 : 
        Math.max(0, 100 - (errorCount * 10));

      return {
        agentId,
        agentName,
        healthScore,
        responseTime,
        successRate,
        errorCount,
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Agent health check failed', { 
        agentId, 
        error: (error as Error).message 
      });

      const previousMetrics = this.metrics.get(agentId);
      return {
        agentId,
        agentName,
        healthScore: 0,
        responseTime: 0,
        successRate: 0,
        errorCount: (previousMetrics?.errorCount || 0) + 1,
        lastChecked: new Date().toISOString(),
      };
    }
  }

  /**
   * Calculate agent health score (0-100)
   */
  private calculateHealthScore(
    healthStatus: string,
    status: string,
    responseTime: number
  ): number {
    let score = 50; // Base score

    // Health status contributes 40 points
    if (healthStatus === 'healthy') {
      score += 40;
    } else if (healthStatus === 'degraded') {
      score += 20;
    }

    // Agent status contributes 10 points
    if (status === 'active' || status === 'running') {
      score += 10;
    }

    // Response time affects score (faster = better)
    // < 100ms: +0, 100-500ms: -5, > 500ms: -10
    if (responseTime > 500) {
      score -= 10;
    } else if (responseTime > 100) {
      score -= 5;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Update connection pool metrics
   */
  private updateConnectionPoolMetrics(): void {
    // Simulate connection pool metrics
    // In a real implementation, this would query the actual connection pool
    const totalConnections = 20;
    const activeConnections = this.metrics.size;
    const idleConnections = totalConnections - activeConnections;
    const waitingConnections = 0;

    this.connectionPool = {
      totalConnections,
      activeConnections,
      idleConnections,
      waitingConnections,
      poolUtilization: (activeConnections / totalConnections) * 100,
    };
  }

  /**
   * Check for unhealthy agents and emit alerts
   */
  private checkAndEmitAlerts(): void {
    const unhealthyAgents = Array.from(this.metrics.values()).filter(
      (m) => m.healthScore < 50
    );

    if (unhealthyAgents.length > 0) {
      this.emit('alert', {
        type: 'unhealthy_agents',
        count: unhealthyAgents.length,
        agents: unhealthyAgents,
        timestamp: new Date().toISOString(),
      });
    }

    // Alert on high pool utilization
    if (this.connectionPool.poolUtilization > 80) {
      this.emit('alert', {
        type: 'high_pool_utilization',
        utilization: this.connectionPool.poolUtilization,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Get all current metrics
   */
  public getMetrics(): SystemMetrics {
    return {
      agents: Array.from(this.metrics.values()),
      connectionPool: this.connectionPool,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get metrics for specific agent
   */
  public getAgentMetrics(agentId: string): AgentPerformanceMetrics | undefined {
    return this.metrics.get(agentId);
  }

  /**
   * Get connection pool metrics
   */
  public getConnectionPoolMetrics(): ConnectionPoolMetrics {
    return { ...this.connectionPool };
  }

  /**
   * Get agents by health score threshold
   */
  public getAgentsByHealthScore(minScore: number): AgentPerformanceMetrics[] {
    return Array.from(this.metrics.values()).filter(
      (m) => m.healthScore >= minScore
    );
  }

  /**
   * Get average health score across all agents
   */
  public getAverageHealthScore(): number {
    if (this.metrics.size === 0) return 0;

    const totalScore = Array.from(this.metrics.values()).reduce(
      (sum, m) => sum + m.healthScore,
      0
    );

    return totalScore / this.metrics.size;
  }

  /**
   * Force immediate health check
   */
  public async forceCheckNow(): Promise<void> {
    logger.info('Force health check requested');
    await this.performHealthCheck();
  }

  /**
   * Get service status
   */
  public isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Get statistics
   */
  public getStats(): {
    isRunning: boolean;
    agentCount: number;
    healthyAgents: number;
    averageHealthScore: number;
    poolUtilization: number;
  } {
    const healthyAgents = Array.from(this.metrics.values()).filter(
      (m) => m.healthScore >= 70
    ).length;

    return {
      isRunning: this.isRunning,
      agentCount: this.metrics.size,
      healthyAgents,
      averageHealthScore: this.getAverageHealthScore(),
      poolUtilization: this.connectionPool.poolUtilization,
    };
  }
}

// Export singleton instance
let performanceMonitor: PerformanceMonitor | null = null;

export function initializePerformanceMonitor(intervalMs?: number): PerformanceMonitor {
  if (!performanceMonitor) {
    performanceMonitor = new PerformanceMonitor(intervalMs);
    performanceMonitor.start();
    logger.info('Performance monitor initialized');
  }
  return performanceMonitor;
}

export function getPerformanceMonitor(): PerformanceMonitor | null {
  return performanceMonitor;
}
