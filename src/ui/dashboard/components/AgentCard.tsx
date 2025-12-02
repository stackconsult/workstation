/**
 * Agent Card Component
 * Display individual agent information
 */

import React from "react";

interface Agent {
  id: string;
  name: string;
  type: string;
  status: "active" | "inactive" | "error";
  lastRun?: string;
  successRate: number;
  totalRuns: number;
}

interface AgentCardProps {
  agent: Agent;
  onUpdate: () => void;
}

export const AgentCard: React.FC<AgentCardProps> = ({ agent, onUpdate }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "status-success";
      case "inactive":
        return "status-info";
      case "error":
        return "status-error";
      default:
        return "status-info";
    }
  };

  const handleToggle = async () => {
    try {
      await fetch(`/api/agents/${agent.id}/toggle`, { method: "POST" });
      onUpdate();
    } catch (error) {
      console.error("Failed to toggle agent:", error);
    }
  };

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {agent.name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {agent.type}
          </p>
        </div>
        <span className={`status-badge ${getStatusColor(agent.status)}`}>
          {agent.status}
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Success Rate</span>
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {agent.successRate}%
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Total Runs</span>
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {agent.totalRuns}
          </span>
        </div>
        {agent.lastRun && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Last Run</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {new Date(agent.lastRun).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 flex gap-2">
        <button onClick={handleToggle} className="flex-1 btn-secondary text-sm">
          {agent.status === "active" ? "Pause" : "Activate"}
        </button>
        <button className="flex-1 btn-primary text-sm">View Details</button>
      </div>
    </div>
  );
};
