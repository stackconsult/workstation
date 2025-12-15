/**
 * Activity Feed Component
 * Real-time activity feed
 */

import React from "react";
import { useQuery } from "@tanstack/react-query";

interface Activity {
  id: string;
  type: "workflow" | "agent" | "system";
  message: string;
  timestamp: string;
  status: "success" | "error" | "warning" | "info";
}

export const ActivityFeed: React.FC = () => {
  const { data: activities } = useQuery<Activity[]>({
    queryKey: ["activity-feed"],
    queryFn: async () => {
      const response = await fetch("/api/activity/recent?limit=10");
      if (!response.ok) throw new Error("Failed to fetch activities");
      return response.json();
    },
    refetchInterval: 5000,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "text-green-600 dark:text-green-400";
      case "error":
        return "text-red-600 dark:text-red-400";
      case "warning":
        return "text-yellow-600 dark:text-yellow-400";
      default:
        return "text-blue-600 dark:text-blue-400";
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "workflow":
        return "⚙️";
      case "agent":
        return "🤖";
      case "system":
        return "🔧";
      default:
        return "📝";
    }
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Recent Activity
      </h3>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {activities?.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          >
            <span className="text-xl">{getIcon(activity.type)}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900 dark:text-gray-100">
                {activity.message}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {new Date(activity.timestamp).toLocaleString()}
              </p>
            </div>
            <div
              className={`text-xs font-medium ${getStatusColor(activity.status)}`}
            >
              {activity.status}
            </div>
          </div>
        ))}
        {(!activities || activities.length === 0) && (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            No recent activity
          </p>
        )}
      </div>
    </div>
  );
};
