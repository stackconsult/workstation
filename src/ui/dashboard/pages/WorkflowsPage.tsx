/**
 * Workflows Page
 * Manage and execute workflows
 */

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { WorkflowCard } from "../components/WorkflowCard";

interface Workflow {
  id: string;
  name: string;
  description: string;
  status: "active" | "paused" | "draft";
  lastRun?: string;
  successRate: number;
  totalRuns: number;
  schedule?: string;
}

export const WorkflowsPage: React.FC = () => {
  const [filter, setFilter] = useState<"all" | "active" | "paused" | "draft">(
    "all",
  );

  const {
    data: workflows,
    isLoading,
    refetch,
  } = useQuery<Workflow[]>({
    queryKey: ["workflows", filter],
    queryFn: async () => {
      const url =
        filter === "all" ? "/api/workflows" : `/api/workflows?status=${filter}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch workflows");
      const result = await response.json();
      // Handle both wrapped and unwrapped response formats
      return result.data?.workflows || result.workflows || result;
    },
  });

  const filteredWorkflows = workflows || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Workflows
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create and manage automation workflows
          </p>
        </div>
        <Link
          to="/workflows/builder"
          className="btn-primary flex items-center gap-2"
        >
          <span>➕</span>
          Create Workflow
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(["all", "active", "paused", "draft"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === status
                ? "bg-primary-600 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Workflows Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredWorkflows.map((workflow) => (
            <WorkflowCard
              key={workflow.id}
              workflow={workflow}
              onUpdate={refetch}
            />
          ))}
        </div>
      )}

      {filteredWorkflows.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">
            No workflows found
          </p>
          <Link
            to="/workflows/builder"
            className="btn-primary inline-flex items-center gap-2"
          >
            <span>➕</span>
            Create Your First Workflow
          </Link>
        </div>
      )}
    </div>
  );
};
