/**
 * Workflow Template Types
 * Defines structure for pre-built workflow templates
 */

export interface WorkflowNode {
  id: string;
  type: string;
  label: string;
  x: number;
  y: number;
  params?: Record<string, any>;
}

export interface WorkflowConnection {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category:
    | "scraping"
    | "automation"
    | "data-processing"
    | "integration"
    | "monitoring"
    | "ecommerce"
    | "social-media"
    | "reporting"
    | "testing"
    | "devops"
    | "business-process";
  icon?: string;
  thumbnail?: string;
  tags: string[];
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  defaultParams?: Record<string, any>;
  estimatedDuration?: string;
  complexity: "beginner" | "intermediate" | "advanced";
  createdAt: string;
  updatedAt: string;
}

export interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  icon?: string;
  templateCount: number;
}
