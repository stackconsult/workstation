/**
 * Workflow Card Component
 */

import React from "react";

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

interface WorkflowCardProps {
  workflow: Workflow;
  onUpdate: () => void;
}

export const WorkflowCard: React.FC<WorkflowCardProps> = ({
  workflow,
  onUpdate,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "status-success";
      case "paused":
        return "status-warning";
      case "draft":
        return "status-info";
      default:
        return "status-info";
    }
  };

  const handleExecute = async () => {
    try {
      await fetch(`/api/workflows/${workflow.id}/execute`, { method: "POST" });
      onUpdate();
    } catch (error) {
      console.error("Failed to execute workflow:", error);
    }
  };

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {workflow.name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {workflow.description}
          </p>
        </div>
        <span className={`status-badge ${getStatusColor(workflow.status)}`}>
          {workflow.status}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        {workflow.schedule && (
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Schedule</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {workflow.schedule}
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Success Rate</span>
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {workflow.successRate}%
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Total Runs</span>
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {workflow.totalRuns}
          </span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 flex gap-2">
        <button onClick={handleExecute} className="flex-1 btn-primary text-sm">
          Execute Now
        </button>
        <button className="flex-1 btn-secondary text-sm">Edit</button>
      </div>
    </div>
  );
};
