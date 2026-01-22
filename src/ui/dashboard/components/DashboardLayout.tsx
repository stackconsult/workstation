/**
 * Dashboard Layout Component
 * Main layout with sidebar navigation and header
 */

import React, { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";

interface DashboardLayoutProps {
  children: ReactNode;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { path: "/dashboard", label: "Overview", icon: "📊" },
  { path: "/agents", label: "Agents", icon: "🤖" },
  { path: "/workflows", label: "Workflows", icon: "⚙️" },
  { path: "/monitoring", label: "Monitoring", icon: "📈" },
  { path: "/settings", label: "Settings", icon: "⚙️" },
];

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  darkMode,
  onToggleDarkMode,
}) => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-lg">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-primary-600 dark:text-primary-400">
            stackBrowserAgent
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Enterprise Dashboard
          </p>
        </div>

        <nav className="px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200
                  ${
                    isActive
                      ? "bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }
                `}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onToggleDarkMode}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
          >
            <span>{darkMode ? "☀️" : "🌙"}</span>
            <span className="text-sm font-medium">
              {darkMode ? "Light" : "Dark"} Mode
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 min-h-screen">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-8 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
              {navItems.find((item) => item.path === location.pathname)
                ?.label || "Dashboard"}
            </h2>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
};
