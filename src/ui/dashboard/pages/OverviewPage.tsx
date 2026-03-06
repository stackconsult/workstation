/**
 * Overview Page
 * Main dashboard with system metrics and status
 */

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { MetricsCard } from "../components/MetricsCard";
import { ActivityFeed } from "../components/ActivityFeed";
import { QuickActions } from "../components/QuickActions";
import { SystemHealth } from "../components/SystemHealth";

interface DashboardMetrics {
  activeAgents: number;
  runningWorkflows: number;
  completedToday: number;
  successRate: number;
}

export const OverviewPage: React.FC = () => {
  const { data: metrics, isLoading } = useQuery<DashboardMetrics>({
    queryKey: ["dashboard-metrics"],
    queryFn: async () => {
      const response = await fetch("/api/metrics/dashboard");
      if (!response.ok) throw new Error("Failed to fetch metrics");
      return response.json();
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricsCard
          title="Active Agents"
          value={metrics?.activeAgents || 0}
          icon="🤖"
          trend={+5}
          color="blue"
        />
        <MetricsCard
          title="Running Workflows"
          value={metrics?.runningWorkflows || 0}
          icon="⚙️"
          trend={+2}
          color="purple"
        />
        <MetricsCard
          title="Completed Today"
          value={metrics?.completedToday || 0}
          icon="✅"
          trend={+12}
          color="green"
        />
        <MetricsCard
          title="Success Rate"
          value={`${metrics?.successRate || 0}%`}
          icon="📊"
          trend={+3}
          color="emerald"
        />
      </div>

      {/* System Health */}
      <SystemHealth />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Feed */}
        <ActivityFeed />

        {/* Quick Actions */}
        <QuickActions />
      </div>
    </div>
  );
};
