/**
 * Template Gallery Component
 * Displays available workflow templates with filtering and search
 */

import React, { useState, useMemo } from "react";
import { WorkflowTemplate } from "../../workflow-templates/types";
import { TEMPLATE_CATEGORIES } from "../../workflow-templates";

interface TemplateGalleryProps {
  templates: WorkflowTemplate[];
  onSelect: (template: WorkflowTemplate) => void;
  onClose: () => void;
}

export const TemplateGallery: React.FC<TemplateGalleryProps> = ({
  templates,
  onSelect,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [complexityFilter, setComplexityFilter] = useState<string | null>(null);

  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      const matchesSearch =
        !searchQuery ||
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        template.tags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase()),
        );

      const matchesCategory =
        !selectedCategory || template.category === selectedCategory;
      const matchesComplexity =
        !complexityFilter || template.complexity === complexityFilter;

      return matchesSearch && matchesCategory && matchesComplexity;
    });
  }, [templates, searchQuery, selectedCategory, complexityFilter]);

  return (
    <div
      className="template-gallery-modal"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "8px",
          width: "90%",
          maxWidth: "1200px",
          height: "80vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px",
            borderBottom: "1px solid #ddd",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2>Workflow Template Gallery</h2>
          <button
            onClick={onClose}
            style={{
              fontSize: "24px",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>

        {/* Search and filters */}
        <div style={{ padding: "20px", borderBottom: "1px solid #eee" }}>
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: "10px",
              border: "1px solid #ddd",
              borderRadius: "4px",
            }}
          />
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {TEMPLATE_CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() =>
                  setSelectedCategory(
                    selectedCategory === category.id ? null : category.id,
                  )
                }
                style={{
                  padding: "5px 15px",
                  background:
                    selectedCategory === category.id ? "#2196F3" : "#f0f0f0",
                  color: selectedCategory === category.id ? "white" : "black",
                  border: "none",
                  borderRadius: "20px",
                  cursor: "pointer",
                }}
              >
                {category.icon} {category.name} ({category.templateCount})
              </button>
            ))}
          </div>
        </div>

        {/* Template grid */}
        <div
          style={{
            flex: 1,
            overflow: "auto",
            padding: "20px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "20px",
            alignContent: "start",
          }}
        >
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              onClick={() => onSelect(template)}
              style={{
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "15px",
                cursor: "pointer",
                transition: "all 0.2s",
                "&:hover": {
                  boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                  transform: "translateY(-2px)",
                },
              }}
            >
              <div style={{ fontSize: "32px", marginBottom: "10px" }}>
                {template.icon}
              </div>
              <h3 style={{ margin: "0 0 10px 0" }}>{template.name}</h3>
              <p
                style={{
                  fontSize: "14px",
                  color: "#666",
                  margin: "0 0 10px 0",
                }}
              >
                {template.description}
              </p>
              <div
                style={{
                  display: "flex",
                  gap: "5px",
                  flexWrap: "wrap",
                  marginBottom: "10px",
                }}
              >
                {template.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    style={{
                      fontSize: "12px",
                      padding: "2px 8px",
                      background: "#e0e0e0",
                      borderRadius: "10px",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "12px",
                  color: "#999",
                }}
              >
                <span>⏱️ {template.estimatedDuration}</span>
                <span>🎯 {template.complexity}</span>
              </div>
            </div>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px", color: "#999" }}>
            No templates found matching your criteria
          </div>
        )}
      </div>
    </div>
  );
};
