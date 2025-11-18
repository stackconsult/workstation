/**
 * Enhanced health check with system metrics
 */
export interface HealthStatus {
  status: "ok" | "degraded" | "error";
  timestamp: string;
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  version: string;
  database?: {
    status: string;
    error?: string;
  };
}

export function getHealthStatus(): HealthStatus {
  const memoryUsage = process.memoryUsage();
  const totalMemory = memoryUsage.heapTotal;
  const usedMemory = memoryUsage.heapUsed;
  const memoryPercentage = (usedMemory / totalMemory) * 100;

  // Consider the service healthy unless memory is critically high (>95%)
  // This is more appropriate for health checks as 90% is still operational
  let status: "ok" | "degraded" | "error" = "ok";
  if (memoryPercentage > 98) {
    status = "error";
  } else if (memoryPercentage > 95) {
    status = "degraded";
  }

  return {
    status,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      used: Math.round(usedMemory / 1024 / 1024), // MB
      total: Math.round(totalMemory / 1024 / 1024), // MB
      percentage: Math.round(memoryPercentage),
    },
    version: process.env.npm_package_version || "1.0.0",
  };
}
