/**
 * Workflow Builder System - Main Export
 *
 * This file exports the enhanced workflow service and all 32 templates.
 * UI components are available in src/ui/workflow-builder/ for frontend integration.
 *
 * @module workflow-builder
 */

// Export enhanced workflow service
export {
  WorkflowService,
  workflowService,
} from "./automation/workflow/service";

// Export all workflow templates
export {
  WORKFLOW_TEMPLATES,
  TEMPLATE_CATEGORIES,
  getTemplateById,
  getTemplatesByCategory,
  searchTemplates,
  getTemplatesByComplexity,
} from "./workflow-templates";

// Export types
export type {
  WorkflowTemplate,
  WorkflowNode,
  WorkflowConnection,
  TemplateCategory,
} from "./workflow-templates/types";

export type {
  Workflow,
  WorkflowDefinition,
  WorkflowTask,
  Execution,
  Task,
  CreateWorkflowInput,
  ExecuteWorkflowInput,
} from "./automation/db/models";

/**
 * UI Components (for frontend integration)
 *
 * These components require React 18+ and ReactFlow:
 * - WorkflowBuilder: Main drag-and-drop workflow designer
 * - TemplateGallery: Template selection UI
 * - NodeEditor: Node property editor
 * - WorkflowValidator: Validation UI
 * - RealTimePreview: Execution preview
 *
 * To use in a React application:
 * ```tsx
 * import WorkflowBuilder from './ui/workflow-builder/WorkflowBuilder';
 * import { RealTimePreview } from './ui/workflow-builder/RealTimePreview';
 *
 * // In your component
 * <WorkflowBuilder
 *   mode="create"
 *   onSave={(workflow) => saveWorkflow(workflow)}
 *   onExecute={(workflow) => executeWorkflow(workflow)}
 * />
 * ```
 *
 * Required dependencies:
 * - react@^18.0.0
 * - react-dom@^18.0.0
 * - reactflow@^11.0.0
 */

// For documentation
export const WORKFLOW_BUILDER_INFO = {
  version: "1.0.0",
  phase: "Phase 4 Step 4",
  templateCount: 32,
  categories: 11,
  features: [
    "32 production-ready workflow templates",
    "Advanced workflow orchestration with versioning",
    "Visual drag-and-drop workflow builder (React components)",
    "Real-time execution preview with debugging",
    "One-click deployment script",
    "Comprehensive documentation",
  ],
  components: {
    service: "Enhanced WorkflowService with versioning and orchestration",
    templates: "32 templates across 11 categories",
    ui: "React components for visual workflow building",
    deployment: "Automated deployment with health checks and rollback",
  },
};
