/**
 * Settings Page
 * System configuration and preferences
 */

import React from "react";

export const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Settings
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Configure system preferences and integrations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            General Settings
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                System Name
              </label>
              <input
                type="text"
                className="input-field"
                defaultValue="stackBrowserAgent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Default Timeout (seconds)
              </label>
              <input type="number" className="input-field" defaultValue="30" />
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Notifications
          </h3>
          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input type="checkbox" className="rounded" defaultChecked />
              <span className="text-gray-700 dark:text-gray-300">
                Email notifications for workflow failures
              </span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" className="rounded" defaultChecked />
              <span className="text-gray-700 dark:text-gray-300">
                Slack integration for alerts
              </span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" className="rounded" />
              <span className="text-gray-700 dark:text-gray-300">
                SMS alerts for critical errors
              </span>
            </label>
          </div>
        </div>

        {/* API Configuration */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            API Configuration
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                API Rate Limit (req/min)
              </label>
              <input type="number" className="input-field" defaultValue="100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                JWT Expiration (hours)
              </label>
              <input type="number" className="input-field" defaultValue="24" />
            </div>
          </div>
        </div>

        {/* Performance Settings */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Performance
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Max Concurrent Workflows
              </label>
              <input type="number" className="input-field" defaultValue="10" />
            </div>
            <label className="flex items-center gap-3">
              <input type="checkbox" className="rounded" defaultChecked />
              <span className="text-gray-700 dark:text-gray-300">
                Enable response compression
              </span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" className="rounded" defaultChecked />
              <span className="text-gray-700 dark:text-gray-300">
                Enable caching
              </span>
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <button className="btn-secondary">Reset to Defaults</button>
        <button className="btn-primary">Save Changes</button>
      </div>
    </div>
  );
};
