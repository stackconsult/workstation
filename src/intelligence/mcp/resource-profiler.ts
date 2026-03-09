/**
 * Resource Profiler for MCP System Context
 * Real-time resource monitoring and pattern analysis
 */

import * as os from "os";

export interface ResourceMetrics {
  timestamp: Date;
  cpu: {
    usage: number; // 0-1
    userTime: number;
    systemTime: number;
    idleTime: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    available: number;
    usage: number; // 0-1
  };
  disk: {
    readBytes: number;
    writeBytes: number;
    readOps: number;
    writeOps: number;
    ioTime: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    packetsIn: number;
    packetsOut: number;
    bandwidth: number;
  };
}

export interface ResourcePattern {
  type:
    | "cpu-bound"
    | "memory-intensive"
    | "io-heavy"
    | "network-intensive"
    | "balanced";
  confidence: number;
  characteristics: {
    avgCpuUsage: number;
    avgMemoryUsage: number;
    avgDiskActivity: number;
    avgNetworkActivity: number;
  };
  bottlenecks: Array<{
    resource: "cpu" | "memory" | "disk" | "network";
    severity: "low" | "medium" | "high";
    recommendation: string;
  }>;
}

export interface ProfilerConfig {
  samplingInterval: number; // milliseconds
  historySize: number; // number of samples to keep
  enablePatternAnalysis: boolean;
}

export class ResourceProfiler {
  private metrics: ResourceMetrics[] = [];
  private config: ProfilerConfig;
  private profilingInterval: NodeJS.Timeout | null = null;
  private startTime: Date;

  constructor(config: Partial<ProfilerConfig> = {}) {
    this.config = {
      samplingInterval: config.samplingInterval || 1000,
      historySize: config.historySize || 60,
      enablePatternAnalysis: config.enablePatternAnalysis !== false,
    };
    this.startTime = new Date();
  }

  /**
   * Start profiling with periodic sampling
   */
  async startProfiling(): Promise<void> {
    if (this.profilingInterval) {
      console.warn("Profiling already started");
      return;
    }

    // Initial sample
    await this.captureMetrics();

    // Start periodic sampling
    this.profilingInterval = setInterval(async () => {
      await this.captureMetrics();
    }, this.config.samplingInterval);

    console.log(
      `✅ Resource profiling started (sampling every ${this.config.samplingInterval}ms)`,
    );
  }

  /**
   * Stop profiling
   */
  stopProfiling(): void {
    if (this.profilingInterval) {
      clearInterval(this.profilingInterval);
      this.profilingInterval = null;
      console.log("✅ Resource profiling stopped");
    }
  }

  /**
   * Capture current resource metrics
   */
  private async captureMetrics(): Promise<void> {
    const metrics: ResourceMetrics = {
      timestamp: new Date(),
      cpu: await this.captureCpuMetrics(),
      memory: this.captureMemoryMetrics(),
      disk: await this.captureDiskMetrics(),
      network: await this.captureNetworkMetrics(),
    };

    this.metrics.push(metrics);

    // Keep only recent history
    if (this.metrics.length > this.config.historySize) {
      this.metrics.shift();
    }
  }

  /**
   * Capture CPU metrics
   */
  private async captureCpuMetrics(): Promise<ResourceMetrics["cpu"]> {
    // Platform-specific CPU metrics capture
    // This is a simplified implementation
    const cpus = os.cpus();

    let totalUser = 0;
    let totalSystem = 0;
    let totalIdle = 0;

    for (const cpu of cpus) {
      totalUser += cpu.times.user;
      totalSystem += cpu.times.sys;
      totalIdle += cpu.times.idle;
    }

    const total = totalUser + totalSystem + totalIdle;
    const usage = total > 0 ? (totalUser + totalSystem) / total : 0;

    return {
      usage,
      userTime: totalUser,
      systemTime: totalSystem,
      idleTime: totalIdle,
    };
  }

  /**
   * Capture memory metrics
   */
  private captureMemoryMetrics(): ResourceMetrics["memory"] {
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;
    const usage = total > 0 ? used / total : 0;

    return {
      total,
      used,
      free,
      available: free,
      usage,
    };
  }

  /**
   * Capture disk I/O metrics
   */
  private async captureDiskMetrics(): Promise<ResourceMetrics["disk"]> {
    // Simplified disk metrics
    // In production, would use platform-specific APIs
    return {
      readBytes: 0,
      writeBytes: 0,
      readOps: 0,
      writeOps: 0,
      ioTime: 0,
    };
  }

  /**
   * Capture network metrics
   */
  private async captureNetworkMetrics(): Promise<ResourceMetrics["network"]> {
    // Simplified network metrics
    // In production, would use platform-specific APIs
    return {
      bytesIn: 0,
      bytesOut: 0,
      packetsIn: 0,
      packetsOut: 0,
      bandwidth: 0,
    };
  }

  /**
   * Analyze resource patterns from historical data
   */
  analyzePatterns(): ResourcePattern {
    if (this.metrics.length < 10) {
      return {
        type: "balanced",
        confidence: 0,
        characteristics: {
          avgCpuUsage: 0,
          avgMemoryUsage: 0,
          avgDiskActivity: 0,
          avgNetworkActivity: 0,
        },
        bottlenecks: [],
      };
    }

    // Calculate averages
    const avgCpu =
      this.metrics.reduce((sum, m) => sum + m.cpu.usage, 0) /
      this.metrics.length;
    const avgMemory =
      this.metrics.reduce((sum, m) => sum + m.memory.usage, 0) /
      this.metrics.length;
    const avgDisk = this.calculateDiskActivity();
    const avgNetwork = this.calculateNetworkActivity();

    // Determine workload type
    const { type, confidence } = this.classifyWorkload(
      avgCpu,
      avgMemory,
      avgDisk,
      avgNetwork,
    );

    // Identify bottlenecks
    const bottlenecks = this.identifyBottlenecks(
      avgCpu,
      avgMemory,
      avgDisk,
      avgNetwork,
    );

    return {
      type,
      confidence,
      characteristics: {
        avgCpuUsage: avgCpu,
        avgMemoryUsage: avgMemory,
        avgDiskActivity: avgDisk,
        avgNetworkActivity: avgNetwork,
      },
      bottlenecks,
    };
  }

  /**
   * Calculate disk activity score
   */
  private calculateDiskActivity(): number {
    // Simplified calculation
    return 0;
  }

  /**
   * Calculate network activity score
   */
  private calculateNetworkActivity(): number {
    // Simplified calculation
    return 0;
  }

  /**
   * Classify workload type based on resource usage
   */
  private classifyWorkload(
    cpu: number,
    memory: number,
    disk: number,
    network: number,
  ): { type: ResourcePattern["type"]; confidence: number } {
    const scores = {
      "cpu-bound": cpu * 2,
      "memory-intensive": memory * 2,
      "io-heavy": disk * 2,
      "network-intensive": network * 2,
      balanced: 1 - Math.max(cpu, memory, disk, network),
    };

    // Find highest score
    let maxScore = 0;
    let workloadType: ResourcePattern["type"] = "balanced";

    for (const [type, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        workloadType = type as ResourcePattern["type"];
      }
    }

    // Calculate confidence based on how much the winner exceeds others
    const confidence = Math.min(
      1,
      maxScore /
        (Object.values(scores).reduce((a, b) => a + b, 0) - maxScore + 0.1),
    );

    return { type: workloadType, confidence };
  }

  /**
   * Identify resource bottlenecks
   */
  private identifyBottlenecks(
    cpu: number,
    memory: number,
    disk: number,
    network: number,
  ): ResourcePattern["bottlenecks"] {
    const bottlenecks: ResourcePattern["bottlenecks"] = [];

    if (cpu > 0.8) {
      bottlenecks.push({
        resource: "cpu",
        severity: "high",
        recommendation:
          "Consider parallelization or offloading compute-intensive tasks",
      });
    } else if (cpu > 0.6) {
      bottlenecks.push({
        resource: "cpu",
        severity: "medium",
        recommendation: "Monitor CPU usage and optimize hot paths",
      });
    }

    if (memory > 0.85) {
      bottlenecks.push({
        resource: "memory",
        severity: "high",
        recommendation:
          "Critical memory pressure - reduce memory footprint or add more RAM",
      });
    } else if (memory > 0.7) {
      bottlenecks.push({
        resource: "memory",
        severity: "medium",
        recommendation: "Moderate memory usage - consider memory optimization",
      });
    }

    if (disk > 0.7) {
      bottlenecks.push({
        resource: "disk",
        severity: disk > 0.8 ? "high" : "medium",
        recommendation:
          "High disk I/O - consider SSD upgrade or reduce I/O operations",
      });
    }

    if (network > 0.7) {
      bottlenecks.push({
        resource: "network",
        severity: network > 0.8 ? "high" : "medium",
        recommendation:
          "High network usage - consider caching or reducing data transfer",
      });
    }

    return bottlenecks;
  }

  /**
   * Get current metrics
   */
  getCurrentMetrics(): ResourceMetrics | null {
    return this.metrics.length > 0
      ? this.metrics[this.metrics.length - 1]
      : null;
  }

  /**
   * Get all historical metrics
   */
  getHistoricalMetrics(): ResourceMetrics[] {
    return [...this.metrics];
  }

  /**
   * Get profiling statistics
   */
  getStatistics() {
    const uptime = Date.now() - this.startTime.getTime();
    const sampleCount = this.metrics.length;

    return {
      uptime,
      sampleCount,
      samplingInterval: this.config.samplingInterval,
      isActive: this.profilingInterval !== null,
    };
  }
}
