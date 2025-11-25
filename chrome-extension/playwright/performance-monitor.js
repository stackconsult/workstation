/**
 * Performance Monitor for Chrome Extension
 * Tracks metrics, monitors health, and provides insights
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.thresholds = {
      executionTime: 30000, // 30 seconds
      memoryUsage: 100 * 1024 * 1024, // 100MB
      errorRate: 0.1, // 10%
      responseTime: 5000 // 5 seconds
    };
    this.alerts = [];
    this.maxAlerts = 100;
  }

  /**
   * Start tracking an operation
   */
  startOperation(operationId, metadata = {}) {
    this.metrics.set(operationId, {
      id: operationId,
      startTime: performance.now(),
      startMemory: this.getMemoryUsage(),
      metadata,
      events: [],
      completed: false
    });
  }

  /**
   * Record an event during operation
   */
  recordEvent(operationId, eventName, data = {}) {
    const metric = this.metrics.get(operationId);
    
    if (!metric) {
      console.warn(`[PerformanceMonitor] Operation ${operationId} not found`);
      return;
    }

    metric.events.push({
      name: eventName,
      timestamp: performance.now() - metric.startTime,
      data
    });
  }

  /**
   * Complete operation tracking
   */
  completeOperation(operationId, result = {}) {
    const metric = this.metrics.get(operationId);
    
    if (!metric) {
      console.warn(`[PerformanceMonitor] Operation ${operationId} not found`);
      return null;
    }

    const endTime = performance.now();
    const endMemory = this.getMemoryUsage();

    metric.completed = true;
    metric.endTime = endTime;
    metric.duration = endTime - metric.startTime;
    metric.memoryDelta = endMemory - metric.startMemory;
    metric.result = result;

    // Check thresholds
    this.checkThresholds(metric);

    return metric;
  }

  /**
   * Record operation error
   */
  recordError(operationId, error) {
    const metric = this.metrics.get(operationId);
    
    if (metric) {
      metric.error = {
        message: error.message || String(error),
        stack: error.stack,
        timestamp: performance.now() - metric.startTime
      };
      metric.completed = true;
      metric.success = false;
    }

    this.createAlert('error', `Operation ${operationId} failed`, {
      operationId,
      error: error.message
    });
  }

  /**
   * Get memory usage
   */
  getMemoryUsage() {
    if (performance.memory) {
      return performance.memory.usedJSHeapSize;
    }
    return 0;
  }

  /**
   * Check thresholds and create alerts
   */
  checkThresholds(metric) {
    if (metric.duration > this.thresholds.executionTime) {
      this.createAlert('warning', 'Slow operation detected', {
        operationId: metric.id,
        duration: metric.duration,
        threshold: this.thresholds.executionTime
      });
    }

    if (metric.memoryDelta > this.thresholds.memoryUsage) {
      this.createAlert('warning', 'High memory usage detected', {
        operationId: metric.id,
        memoryDelta: metric.memoryDelta,
        threshold: this.thresholds.memoryUsage
      });
    }
  }

  /**
   * Create alert
   */
  createAlert(level, message, data = {}) {
    const alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      level,
      message,
      data,
      timestamp: Date.now()
    };

    this.alerts.unshift(alert);

    // Keep only recent alerts
    if (this.alerts.length > this.maxAlerts) {
      this.alerts = this.alerts.slice(0, this.maxAlerts);
    }

    console.log(`[PerformanceMonitor] ${level.toUpperCase()}: ${message}`, data);

    return alert;
  }

  /**
   * Get operation metrics
   */
  getMetrics(operationId) {
    return this.metrics.get(operationId);
  }

  /**
   * Get all metrics
   */
  getAllMetrics() {
    return Array.from(this.metrics.values());
  }

  /**
   * Get metrics summary
   */
  getSummary() {
    const allMetrics = this.getAllMetrics();
    const completed = allMetrics.filter(m => m.completed);
    const successful = completed.filter(m => m.success !== false);
    const failed = completed.filter(m => m.success === false);

    const durations = completed.map(m => m.duration).filter(d => d !== undefined);
    const avgDuration = durations.length > 0 
      ? durations.reduce((a, b) => a + b, 0) / durations.length 
      : 0;

    const memoryDeltas = completed.map(m => m.memoryDelta).filter(d => d !== undefined && d > 0);
    const avgMemoryDelta = memoryDeltas.length > 0
      ? memoryDeltas.reduce((a, b) => a + b, 0) / memoryDeltas.length
      : 0;

    return {
      totalOperations: allMetrics.length,
      completedOperations: completed.length,
      successfulOperations: successful.length,
      failedOperations: failed.length,
      successRate: completed.length > 0 
        ? (successful.length / completed.length) * 100 
        : 0,
      averageDuration: avgDuration,
      averageMemoryDelta: avgMemoryDelta,
      currentMemoryUsage: this.getMemoryUsage(),
      alertCount: this.alerts.length
    };
  }

  /**
   * Get recent alerts
   */
  getAlerts(count = 10) {
    return this.alerts.slice(0, count);
  }

  /**
   * Get alerts by level
   */
  getAlertsByLevel(level) {
    return this.alerts.filter(a => a.level === level);
  }

  /**
   * Clear old metrics
   */
  cleanup(maxAge = 3600000) { // 1 hour default
    const now = Date.now();
    const cutoff = now - maxAge;

    for (const [id, metric] of this.metrics.entries()) {
      if (metric.startTime < cutoff) {
        this.metrics.delete(id);
      }
    }

    // Clear old alerts
    this.alerts = this.alerts.filter(a => a.timestamp > cutoff);
  }

  /**
   * Get performance insights
   */
  getInsights() {
    const summary = this.getSummary();
    const insights = [];

    // Success rate insight
    if (summary.successRate < 90) {
      insights.push({
        type: 'error_rate',
        severity: 'high',
        message: `Low success rate: ${summary.successRate.toFixed(1)}%`,
        recommendation: 'Review error logs and improve error handling'
      });
    }

    // Performance insight
    if (summary.averageDuration > this.thresholds.executionTime * 0.5) {
      insights.push({
        type: 'performance',
        severity: 'medium',
        message: `Average operation duration: ${(summary.averageDuration / 1000).toFixed(2)}s`,
        recommendation: 'Optimize slow operations or increase timeout threshold'
      });
    }

    // Memory insight
    if (summary.currentMemoryUsage > this.thresholds.memoryUsage * 0.8) {
      insights.push({
        type: 'memory',
        severity: 'high',
        message: `High memory usage: ${(summary.currentMemoryUsage / 1024 / 1024).toFixed(2)}MB`,
        recommendation: 'Review memory leaks and implement cleanup'
      });
    }

    return insights;
  }

  /**
   * Export metrics to JSON
   */
  exportMetrics() {
    return {
      summary: this.getSummary(),
      metrics: this.getAllMetrics(),
      alerts: this.alerts,
      insights: this.getInsights(),
      timestamp: Date.now()
    };
  }

  /**
   * Get health status
   */
  getHealthStatus() {
    const summary = this.getSummary();
    const insights = this.getInsights();
    const criticalAlerts = this.getAlertsByLevel('error').length;
    const warningAlerts = this.getAlertsByLevel('warning').length;

    let healthScore = 100;

    // Deduct for low success rate
    if (summary.successRate < 90) {
      healthScore -= (90 - summary.successRate);
    }

    // Deduct for alerts
    healthScore -= criticalAlerts * 10;
    healthScore -= warningAlerts * 2;

    // Deduct for high insights
    healthScore -= insights.filter(i => i.severity === 'high').length * 5;

    healthScore = Math.max(0, Math.min(100, healthScore));

    return {
      score: healthScore,
      status: healthScore >= 80 ? 'healthy' : healthScore >= 50 ? 'degraded' : 'unhealthy',
      summary,
      criticalAlerts,
      warningAlerts,
      insights: insights.length,
      timestamp: Date.now()
    };
  }

  /**
   * Set custom threshold
   */
  setThreshold(key, value) {
    if (this.thresholds.hasOwnProperty(key)) {
      this.thresholds[key] = value;
      console.log(`[PerformanceMonitor] Threshold ${key} set to ${value}`);
    } else {
      console.warn(`[PerformanceMonitor] Unknown threshold: ${key}`);
    }
  }

  /**
   * Get thresholds
   */
  getThresholds() {
    return { ...this.thresholds };
  }

  /**
   * Reset all metrics
   */
  reset() {
    this.metrics.clear();
    this.alerts = [];
    console.log('[PerformanceMonitor] Reset complete');
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

// Auto cleanup every hour
setInterval(() => {
  performanceMonitor.cleanup();
}, 3600000);

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PerformanceMonitor, performanceMonitor };
}
