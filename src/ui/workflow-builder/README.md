# Workflow Builder UI Components

## Overview

This directory contains React components for the visual workflow builder interface. These components provide a production-ready, drag-and-drop workflow designer with real-time preview capabilities.

## Components

### WorkflowBuilder.tsx

Main workflow designer component with drag-and-drop functionality.

**Features:**

- Visual node-based editor
- Drag-and-drop interface
- Real-time validation
- Template loading
- Save and execute workflows

### TemplateGallery.tsx

Template selection and browsing interface.

**Features:**

- Browse 32+ templates
- Filter by category
- Search functionality
- Complexity filtering
- Template preview

### NodeEditor.tsx

Side panel for editing node properties.

**Features:**

- Edit node labels
- Modify node parameters
- Add/remove parameters
- Delete nodes

### WorkflowValidator.tsx

Validation feedback display.

**Features:**

- Real-time validation
- Error highlighting
- Warning messages
- Success indicators

### RealTimePreview.tsx

Live workflow execution preview.

**Features:**

- Step-by-step execution visualization
- Variable inspection
- Performance metrics
- Error visualization
- Execution speed control

## Requirements

These components require the following dependencies in your frontend project:

```json
{
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "reactflow": "^11.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0"
  }
}
```

## Installation

### Option 1: Copy to React Project

1. Copy this entire directory to your React project
2. Install dependencies:

```bash
npm install react react-dom reactflow
npm install --save-dev @types/react @types/react-dom
```

3. Import and use:

```tsx
import WorkflowBuilder from "./workflow-builder/WorkflowBuilder";

function App() {
  return (
    <WorkflowBuilder
      mode="create"
      onSave={(workflow) => console.log("Saved:", workflow)}
      onExecute={(workflow) => console.log("Execute:", workflow)}
    />
  );
}
```

### Option 2: Use as Reference

These components serve as a reference implementation. You can adapt them to your specific frontend framework (Vue, Angular, Svelte, etc.) or customize the React components to match your design system.

## Usage Examples

### Creating a New Workflow

```tsx
import WorkflowBuilder from "./workflow-builder/WorkflowBuilder";

function WorkflowCreator() {
  const handleSave = async (workflow) => {
    const response = await fetch("/api/workflows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(workflow),
    });
    const saved = await response.json();
    console.log("Workflow saved:", saved);
  };

  return <WorkflowBuilder mode="create" onSave={handleSave} />;
}
```

### Editing an Existing Workflow

```tsx
import WorkflowBuilder from "./workflow-builder/WorkflowBuilder";
import { useState, useEffect } from "react";

function WorkflowEditor({ workflowId }) {
  const [workflow, setWorkflow] = useState(null);

  useEffect(() => {
    fetch(`/api/workflows/${workflowId}`)
      .then((res) => res.json())
      .then((data) => setWorkflow(data));
  }, [workflowId]);

  if (!workflow) return <div>Loading...</div>;

  return (
    <WorkflowBuilder
      mode="edit"
      initialWorkflow={workflow}
      onSave={async (updated) => {
        await fetch(`/api/workflows/${workflowId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updated),
        });
      }}
    />
  );
}
```

### View-Only Mode

```tsx
<WorkflowBuilder mode="view" initialWorkflow={workflow} />
```

### Using the Template Gallery

```tsx
import { TemplateGallery } from "./workflow-builder/TemplateGallery";
import { WORKFLOW_TEMPLATES } from "../workflow-templates";

function TemplateSelector() {
  const [showGallery, setShowGallery] = useState(true);

  return (
    <>
      {showGallery && (
        <TemplateGallery
          templates={WORKFLOW_TEMPLATES}
          onSelect={(template) => {
            console.log("Selected:", template);
            setShowGallery(false);
          }}
          onClose={() => setShowGallery(false)}
        />
      )}
    </>
  );
}
```

### Using the Real-Time Preview

```tsx
import { RealTimePreview } from "./workflow-builder/RealTimePreview";

function WorkflowPreviewDemo() {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <>
      <button onClick={() => setShowPreview(true)}>Preview Workflow</button>

      {showPreview && (
        <RealTimePreview
          workflow={myWorkflow}
          onClose={() => setShowPreview(false)}
        />
      )}
    </>
  );
}
```

## Customization

### Styling

Components use inline styles for portability. To customize:

1. **Use CSS Modules:**

```tsx
import styles from "./WorkflowBuilder.module.css";
<div className={styles.container}>...</div>;
```

2. **Use Styled Components:**

```tsx
import styled from "styled-components";
const Container = styled.div`...`;
```

3. **Use Tailwind CSS:**

```tsx
<div className="flex items-center justify-between">...</div>
```

### Custom Node Types

Add custom node types in `WorkflowBuilder.tsx`:

```tsx
const nodeTypes = {
  start: StartNode,
  end: EndNode,
  action: ActionNode,
  condition: ConditionNode,
  loop: LoopNode,
  parallel: ParallelNode,
  customType: CustomNode, // Add your custom node
};

function CustomNode({ data }) {
  return (
    <div
      style={
        {
          /* custom styles */
        }
      }
    >
      {data.label}
    </div>
  );
}
```

## Integration with Backend

These components are designed to work with the enhanced `WorkflowService` in `src/automation/workflow/service.ts`.

**API Endpoints Expected:**

- `POST /api/workflows` - Create workflow
- `GET /api/workflows/:id` - Get workflow
- `PUT /api/workflows/:id` - Update workflow
- `DELETE /api/workflows/:id` - Delete workflow
- `GET /api/workflows/templates` - Get all templates
- `POST /api/workflows/:id/execute` - Execute workflow

## TypeScript Support

All components are fully typed. Import types from:

```tsx
import type { WorkflowTemplate } from "../workflow-templates/types";
import type { Node, Edge } from "reactflow";
```

## Testing

These components can be tested using React Testing Library:

```tsx
import { render, screen } from "@testing-library/react";
import WorkflowBuilder from "./WorkflowBuilder";

test("renders workflow builder", () => {
  render(<WorkflowBuilder mode="create" />);
  expect(screen.getByText("New Workflow")).toBeInTheDocument();
});
```

## Performance Optimization

For large workflows (100+ nodes):

1. Enable ReactFlow's performance mode:

```tsx
<ReactFlow
  nodes={nodes}
  edges={edges}
  snapToGrid
  defaultZoom={0.8}
  minZoom={0.1}
  maxZoom={2}
  // Virtualization for large graphs
  nodesDraggable={!isViewMode}
/>
```

2. Use React.memo for custom nodes:

```tsx
const ActionNode = React.memo(({ data }) => {
  return <div>{data.label}</div>;
});
```

3. Debounce node updates:

```tsx
import { useCallback } from "react";
import debounce from "lodash/debounce";

const debouncedUpdate = useCallback(
  debounce((nodeId, data) => {
    updateNodeData(nodeId, data);
  }, 300),
  [],
);
```

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

ReactFlow requires modern browser features. For older browsers, polyfills may be needed.

## License

These components are part of the Workstation project and follow the same license.

## Support

For issues or questions:

- Check the main WORKFLOW_BUILDER_DOCUMENTATION.md
- Review ReactFlow documentation: https://reactflow.dev/
- Open an issue in the repository

## Future Enhancements

Planned features:

- [ ] Undo/redo functionality
- [ ] Workflow diff viewer
- [ ] Collaborative editing
- [ ] Custom theme support
- [ ] Export to image/PDF
- [ ] Workflow analytics dashboard
- [ ] AI-powered workflow suggestions

---

**Note:** These components are production-ready but provided as-is. They serve as a comprehensive reference implementation and can be adapted to your specific needs.
