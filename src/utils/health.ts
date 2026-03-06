/**
 * Enhanced health check with system metrics
 */
import { isDatabaseConnected } from "../db/connection";

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
  database: {
    status: "connected" | "disconnected" | "unknown";
    connected: boolean;
  };
  dependencies: {
    database: boolean;
    websocket?: boolean;
  };
}

export function getHealthStatus(): HealthStatus {
  const memoryUsage = process.memoryUsage();
  const totalMemory = memoryUsage.heapTotal;
  const usedMemory = memoryUsage.heapUsed;
  const memoryPercentage = (usedMemory / totalMemory) * 100;

  // Check database connection
  const databaseConnected = isDatabaseConnected();

  // Determine overall health status
  let status: "ok" | "degraded" | "error" = "ok";

  // Critical: memory at 98% or higher
  if (memoryPercentage > 98) {
    status = "error";
  }
  // Degraded: memory 95%+ OR database disconnected
  else if (memoryPercentage > 95 || !databaseConnected) {
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
    database: {
      status: databaseConnected ? "connected" : "disconnected",
      connected: databaseConnected,
    },
    dependencies: {
      database: databaseConnected,
      // WebSocket status would be added here if available
    },
  };
}
