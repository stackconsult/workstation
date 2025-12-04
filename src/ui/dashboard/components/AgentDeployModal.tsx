/**
 * Agent Deploy Modal Component
 */

import React, { useState } from "react";

interface AgentDeployModalProps {
  onClose: () => void;
  onDeploy: () => void;
}

export const AgentDeployModal: React.FC<AgentDeployModalProps> = ({
  onClose,
  onDeploy,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    type: "browser-automation",
    environment: "production",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/agents/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      onDeploy();
    } catch (error) {
      console.error("Failed to deploy agent:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Deploy New Agent
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Agent Name
            </label>
            <input
              type="text"
              className="input-field"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Agent Type
            </label>
            <select
              className="input-field"
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value })
              }
            >
              <option value="browser-automation">Browser Automation</option>
              <option value="data-extraction">Data Extraction</option>
              <option value="workflow-orchestration">
                Workflow Orchestration
              </option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Environment
            </label>
            <select
              className="input-field"
              value={formData.environment}
              onChange={(e) =>
                setFormData({ ...formData, environment: e.target.value })
              }
            >
              <option value="development">Development</option>
              <option value="staging">Staging</option>
              <option value="production">Production</option>
            </select>
          </div>
          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="flex-1 btn-primary">
              Deploy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
