/**
 * Quick Actions Component
 * Quick access buttons for common tasks
 */

import React from "react";
import { Link } from "react-router-dom";

interface QuickAction {
  title: string;
  description: string;
  icon: string;
  path: string;
  color: string;
}

const actions: QuickAction[] = [
  {
    title: "Create Workflow",
    description: "Build a new automation workflow",
    icon: "➕",
    path: "/workflows/create",
    color: "bg-blue-500",
  },
  {
    title: "Deploy Agent",
    description: "Deploy a new agent instance",
    icon: "🚀",
    path: "/agents/deploy",
    color: "bg-purple-500",
  },
  {
    title: "View Metrics",
    description: "Check performance metrics",
    icon: "📊",
    path: "/monitoring",
    color: "bg-green-500",
  },
  {
    title: "System Settings",
    description: "Configure system preferences",
    icon: "⚙️",
    path: "/settings",
    color: "bg-orange-500",
  },
];

export const QuickActions: React.FC = () => {
  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Quick Actions
      </h3>
      <div className="grid grid-cols-2 gap-4">
        {actions.map((action) => (
          <Link
            key={action.path}
            to={action.path}
            className="p-4 rounded-lg border-2 border-gray-200 dark:border-gray-600 hover:border-primary-500 dark:hover:border-primary-400 transition-colors group"
          >
            <div
              className={`inline-flex p-2 rounded-lg ${action.color} text-white mb-3`}
            >
              <span className="text-xl">{action.icon}</span>
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400">
              {action.title}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {action.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
};
