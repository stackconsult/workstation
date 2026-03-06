/**
 * Error Logs Component
 */

import React from "react";
import { useQuery } from "@tanstack/react-query";

interface ErrorLog {
  id: string;
  timestamp: string;
  level: "error" | "warning" | "critical";
  message: string;
  source: string;
  stack?: string;
}

export const ErrorLogs: React.FC = () => {
  const { data: logs } = useQuery<ErrorLog[]>({
    queryKey: ["error-logs"],
    queryFn: async () => {
      const response = await fetch("/api/logs/errors?limit=10");
      if (!response.ok) throw new Error("Failed to fetch logs");
      return response.json();
    },
    refetchInterval: 10000,
  });

  const getLevelColor = (level: string) => {
    switch (level) {
      case "critical":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "error":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "warning":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Recent Errors
        </h3>
        <button className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
          View All
        </button>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {logs?.map((log) => (
          <div
            key={log.id}
            className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <span className={`status-badge ${getLevelColor(log.level)}`}>
                {log.level.toUpperCase()}
              </span>
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {new Date(log.timestamp).toLocaleString()}
              </span>
            </div>
            <p className="text-sm text-gray-900 dark:text-gray-100 mb-1">
              {log.message}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Source: {log.source}
            </p>
            {log.stack && (
              <details className="mt-2">
                <summary className="text-xs text-primary-600 dark:text-primary-400 cursor-pointer">
                  Show stack trace
                </summary>
                <pre className="mt-2 text-xs bg-gray-900 dark:bg-gray-800 text-gray-100 p-2 rounded overflow-x-auto">
                  {log.stack}
                </pre>
              </details>
            )}
          </div>
        ))}
        {(!logs || logs.length === 0) && (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            No errors logged
          </p>
        )}
      </div>
    </div>
  );
};
