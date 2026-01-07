/**
 * Resource Usage Component
 */

import React from "react";
import { useQuery } from "@tanstack/react-query";

interface ResourceData {
  cpu: number;
  memory: number;
  disk: number;
  network: {
    in: number;
    out: number;
  };
}

export const ResourceUsage: React.FC = () => {
  const { data: resources } = useQuery<ResourceData>({
    queryKey: ["resource-usage"],
    queryFn: async () => {
      const response = await fetch("/api/metrics/resources");
      if (!response.ok) throw new Error("Failed to fetch resources");
      return response.json();
    },
    refetchInterval: 2000,
  });

  const getUsageColor = (value: number) => {
    if (value >= 90) return "bg-red-500";
    if (value >= 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  const UsageBar = ({ label, value }: { label: string; value: number }) => (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="text-gray-700 dark:text-gray-300">{label}</span>
        <span className="font-semibold text-gray-900 dark:text-gray-100">
          {value}%
        </span>
      </div>
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${getUsageColor(value)} transition-all duration-300`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
        Resource Usage
      </h3>
      <div className="space-y-6">
        <UsageBar label="CPU" value={resources?.cpu || 0} />
        <UsageBar label="Memory" value={resources?.memory || 0} />
        <UsageBar label="Disk" value={resources?.disk || 0} />

        <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Network
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Incoming</span>
              <p className="font-semibold text-gray-900 dark:text-gray-100 mt-1">
                {resources?.network.in.toFixed(2)} MB/s
              </p>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Outgoing</span>
              <p className="font-semibold text-gray-900 dark:text-gray-100 mt-1">
                {resources?.network.out.toFixed(2)} MB/s
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
