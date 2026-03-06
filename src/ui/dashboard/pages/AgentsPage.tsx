/**
 * Agents Page
 * Manage and monitor agents
 */

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AgentCard } from "../components/AgentCard";
import { AgentDeployModal } from "../components/AgentDeployModal";

interface Agent {
  id: string;
  name: string;
  type: string;
  status: "active" | "inactive" | "error";
  lastRun?: string;
  successRate: number;
  totalRuns: number;
}

export const AgentsPage: React.FC = () => {
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");

  const {
    data: agents,
    isLoading,
    refetch,
  } = useQuery<Agent[]>({
    queryKey: ["agents", filter],
    queryFn: async () => {
      const url =
        filter === "all" ? "/api/agents" : `/api/agents?status=${filter}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch agents");
      const result = await response.json();
      // Handle both wrapped and unwrapped response formats
      return result.data?.agents || result.agents || result;
    },
  });

  const filteredAgents = agents || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Agents
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your automation agents
          </p>
        </div>
        <button
          onClick={() => setShowDeployModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <span>➕</span>
          Deploy New Agent
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(["all", "active", "inactive"] as const).map((status) => (
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

      {/* Agents Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} onUpdate={refetch} />
          ))}
        </div>
      )}

      {filteredAgents.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            No agents found
          </p>
        </div>
      )}

      {/* Deploy Modal */}
      {showDeployModal && (
        <AgentDeployModal
          onClose={() => setShowDeployModal(false)}
          onDeploy={() => {
            setShowDeployModal(false);
            refetch();
          }}
        />
      )}
    </div>
  );
};
