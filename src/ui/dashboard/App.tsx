/**
 * Main App Component
 * Root component with routing and layout
 */

import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { DashboardLayout } from "./components/DashboardLayout";
import { OverviewPage } from "./pages/OverviewPage";
import { AgentsPage } from "./pages/AgentsPage";
import { WorkflowsPage } from "./pages/WorkflowsPage";
import { MonitoringPage } from "./pages/MonitoringPage";
import { SettingsPage } from "./pages/SettingsPage";

export const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved ? JSON.parse(saved) : false;
  });

  const toggleDarkMode = () => {
    setDarkMode((prev: boolean) => {
      const newValue = !prev;
      localStorage.setItem("darkMode", JSON.stringify(newValue));
      return newValue;
    });
  };

  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  return (
    <DashboardLayout darkMode={darkMode} onToggleDarkMode={toggleDarkMode}>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<OverviewPage />} />
        <Route path="/agents" element={<AgentsPage />} />
        <Route path="/workflows" element={<WorkflowsPage />} />
        <Route path="/monitoring" element={<MonitoringPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </DashboardLayout>
  );
};
