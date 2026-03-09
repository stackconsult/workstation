/**
 * Metrics Card Component
 * Display individual metric with trend
 */

import React from "react";

interface MetricsCardProps {
  title: string;
  value: number | string;
  icon: string;
  trend?: number;
  color?: "blue" | "purple" | "green" | "emerald" | "orange" | "red";
}

const colorClasses = {
  blue: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300",
  purple:
    "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300",
  green: "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300",
  emerald:
    "bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300",
  orange:
    "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300",
  red: "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300",
};

export const MetricsCard: React.FC<MetricsCardProps> = ({
  title,
  value,
  icon,
  trend,
  color = "blue",
}) => {
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {title}
          </p>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {value}
          </p>
          {trend !== undefined && (
            <p
              className={`text-sm mt-2 ${trend >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
            >
              {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}% from yesterday
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  );
};
