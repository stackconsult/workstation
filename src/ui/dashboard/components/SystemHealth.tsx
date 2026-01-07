/**
 * System Health Component
 * Display system health status and metrics
 */

import React from "react";
import { useQuery } from "@tanstack/react-query";

interface HealthCheck {
  name: string;
  status: "healthy" | "degraded" | "unhealthy";
  message?: string;
  responseTime?: number;
}

interface SystemHealthData {
  status: "healthy" | "degraded" | "unhealthy";
  checks: HealthCheck[];
  uptime: number;
  version: string;
}

export const SystemHealth: React.FC = () => {
  const { data: health } = useQuery<SystemHealthData>({
    queryKey: ["system-health"],
    queryFn: async () => {
      const response = await fetch("/health/live");
      if (!response.ok) throw new Error("Health check failed");
      return response.json();
    },
    refetchInterval: 10000, // Every 10 seconds
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "degraded":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "unhealthy":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return "✅";
      case "degraded":
        return "⚠️";
      case "unhealthy":
        return "❌";
      default:
        return "❓";
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          System Health
        </h3>
        <span
          className={`status-badge ${getStatusColor(health?.status || "healthy")}`}
        >
          {getStatusIcon(health?.status || "healthy")}{" "}
          {health?.status || "Loading..."}
        </span>
      </div>

      <div className="space-y-4">
        {health?.checks?.map((check) => (
          <div
            key={check.name}
            className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-700"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{getStatusIcon(check.status)}</span>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {check.name}
                </p>
                {check.message && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {check.message}
                  </p>
                )}
              </div>
            </div>
            {check.responseTime && (
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {check.responseTime}ms
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-600 dark:text-gray-400">Uptime</p>
          <p className="font-semibold text-gray-900 dark:text-gray-100">
            {health?.uptime
              ? `${Math.floor(health.uptime / 3600)}h ${Math.floor((health.uptime % 3600) / 60)}m`
              : "N/A"}
          </p>
        </div>
        <div>
          <p className="text-gray-600 dark:text-gray-400">Version</p>
          <p className="font-semibold text-gray-900 dark:text-gray-100">
            {health?.version || "N/A"}
          </p>
        </div>
      </div>
    </div>
  );
};
