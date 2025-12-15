/**
 * Monitoring Page
 * System metrics and performance monitoring
 */

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { PerformanceChart } from "../components/PerformanceChart";
import { ResourceUsage } from "../components/ResourceUsage";
import { ErrorLogs } from "../components/ErrorLogs";

export const MonitoringPage: React.FC = () => {
  const { data: metrics } = useQuery({
    queryKey: ["performance-metrics"],
    queryFn: async () => {
      const response = await fetch("/api/metrics/performance");
      if (!response.ok) throw new Error("Failed to fetch metrics");
      return response.json();
    },
    refetchInterval: 5000,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Monitoring
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Track system performance and resource usage
        </p>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PerformanceChart
          title="Response Time"
          data={metrics?.responseTime || []}
          color="#0ea5e9"
        />
        <PerformanceChart
          title="Throughput (req/s)"
          data={metrics?.throughput || []}
          color="#10b981"
        />
      </div>

      {/* Resource Usage */}
      <ResourceUsage />

      {/* Error Logs */}
      <ErrorLogs />
    </div>
  );
};
