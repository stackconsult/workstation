/**
 * Workflow Validator Component
 * Displays validation errors and warnings
 */

import React from "react";

interface WorkflowValidatorProps {
  errors: string[];
}

export const WorkflowValidator: React.FC<WorkflowValidatorProps> = ({
  errors,
}) => {
  if (errors.length === 0) {
    return (
      <div
        style={{
          padding: "20px",
          background: "#4CAF50",
          color: "white",
          margin: "20px",
          borderRadius: "4px",
        }}
      >
        ✅ Workflow is valid
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "20px",
        background: "#fff3cd",
        border: "1px solid #ffc107",
        margin: "20px",
        borderRadius: "4px",
      }}
    >
      <h4 style={{ margin: "0 0 10px 0", color: "#856404" }}>
        ⚠️ Validation Errors
      </h4>
      <ul style={{ margin: 0, paddingLeft: "20px", color: "#856404" }}>
        {errors.map((error, index) => (
          <li key={index}>{error}</li>
        ))}
      </ul>
    </div>
  );
};
