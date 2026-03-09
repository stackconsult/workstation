/**
 * Performance Chart Component
 */

import React from "react";

interface PerformanceChartProps {
  title: string;
  data: Array<{ timestamp: number; value: number }>;
  color: string;
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({
  title,
  data,
  color,
}) => {
  const maxValue = Math.max(...(data.map((d) => d.value) || [1]));

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        {title}
      </h3>
      <div className="h-64 flex items-end gap-2">
        {data.slice(-20).map((point, index) => (
          <div
            key={index}
            className="flex-1 bg-gradient-to-t rounded-t transition-all duration-300 hover:opacity-80"
            style={{
              height: `${(point.value / maxValue) * 100}%`,
              background: `linear-gradient(to top, ${color}, ${color}80)`,
              minHeight: "2px",
            }}
            title={`${point.value} at ${new Date(point.timestamp).toLocaleTimeString()}`}
          />
        ))}
      </div>
      <div className="mt-4 flex justify-between text-sm text-gray-600 dark:text-gray-400">
        <span>Last 20 data points</span>
        <span>Max: {maxValue.toFixed(2)}</span>
      </div>
    </div>
  );
};
