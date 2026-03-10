/**
 * Workflow Builder - React Component
 * Visual drag-and-drop workflow designer
 * Phase 4 - Production-ready visual builder
 */

import React, { useState, useCallback, useRef, useEffect } from "react";
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Background,
  Controls,
  MiniMap,
  Connection,
  useNodesState,
  useEdgesState,
  MarkerType,
  ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";

import { WorkflowTemplate } from "../../workflow-templates/types";
import { WORKFLOW_TEMPLATES } from "../../workflow-templates";
import { TemplateGallery } from "./TemplateGallery";
import { NodeEditor } from "./NodeEditor";
import { WorkflowValidator } from "./WorkflowValidator";
import { RealTimePreview } from "./RealTimePreview";

interface WorkflowBuilderProps {
  initialWorkflow?: WorkflowTemplate;
  onSave?: (workflow: WorkflowTemplate) => void;
  onExecute?: (workflow: WorkflowTemplate) => void;
  mode?: "create" | "edit" | "view";
}

/**
 * Custom node types for workflow builder
 */
const nodeTypes = {
  start: StartNode,
  end: EndNode,
  action: ActionNode,
  condition: ConditionNode,
  loop: LoopNode,
  parallel: ParallelNode,
};

export const WorkflowBuilder: React.FC<WorkflowBuilderProps> = ({
  initialWorkflow,
  onSave,
  onExecute,
  mode = "create",
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [workflowName, setWorkflowName] = useState("New Workflow");
  const [workflowDescription, setWorkflowDescription] = useState("");

  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  /**
   * Initialize workflow from template
   */
  useEffect(() => {
    if (initialWorkflow) {
      loadTemplate(initialWorkflow);
    }
  }, [initialWorkflow]);

  /**
   * Load template into builder
   */
  const loadTemplate = useCallback(
    (template: WorkflowTemplate) => {
      const flowNodes = template.nodes.map((node) => ({
        id: node.id,
        type: node.type,
        position: { x: node.x, y: node.y },
        data: {
          label: node.label,
          params: node.params || {},
        },
      }));

      const flowEdges = template.connections.map((conn) => ({
        id: conn.id,
        source: conn.source,
        target: conn.target,
        sourceHandle: conn.sourceHandle,
        targetHandle: conn.targetHandle,
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      }));

      setNodes(flowNodes);
      setEdges(flowEdges);
      setWorkflowName(template.name);
      setWorkflowDescription(template.description);
    },
    [setNodes, setEdges],
  );

  /**
   * Handle new connections between nodes
   */
  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            markerEnd: {
              type: MarkerType.ArrowClosed,
            },
          },
          eds,
        ),
      );
    },
    [setEdges],
  );

  /**
   * Handle node selection for editing
   */
  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  /**
   * Add new node to workflow
   */
  const addNode = useCallback(
    (nodeType: string) => {
      const newNode: Node = {
        id: `node-${Date.now()}`,
        type: nodeType,
        position: { x: Math.random() * 400, y: Math.random() * 400 },
        data: {
          label: `New ${nodeType}`,
          params: {},
        },
      };
      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes],
  );

  /**
   * Delete selected node
   */
  const deleteNode = useCallback(() => {
    if (selectedNode) {
      setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
      setEdges((eds) =>
        eds.filter(
          (e) => e.source !== selectedNode.id && e.target !== selectedNode.id,
        ),
      );
      setSelectedNode(null);
    }
  }, [selectedNode, setNodes, setEdges]);

  /**
   * Update node data
   */
  const updateNodeData = useCallback(
    (nodeId: string, data: any) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: { ...node.data, ...data },
            };
          }
          return node;
        }),
      );
    },
    [setNodes],
  );

  /**
   * Validate workflow
   */
  const validateWorkflow = useCallback(() => {
    const errors: string[] = [];

    // Check for start node
    if (!nodes.find((n) => n.type === "start")) {
      errors.push("Workflow must have a start node");
    }

    // Check for end node
    if (!nodes.find((n) => n.type === "end")) {
      errors.push("Workflow must have an end node");
    }

    // Check for disconnected nodes
    nodes.forEach((node) => {
      if (node.type !== "start" && node.type !== "end") {
        const hasIncoming = edges.some((e) => e.target === node.id);
        const hasOutgoing = edges.some((e) => e.source === node.id);
        if (!hasIncoming || !hasOutgoing) {
          errors.push(`Node "${node.data.label}" is disconnected`);
        }
      }
    });

    // Check for cycles (basic check)
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const hasCycle = (nodeId: string): boolean => {
      if (visiting.has(nodeId)) return true;
      if (visited.has(nodeId)) return false;

      visiting.add(nodeId);
      const outgoingEdges = edges.filter((e) => e.source === nodeId);

      for (const edge of outgoingEdges) {
        if (hasCycle(edge.target)) return true;
      }

      visiting.delete(nodeId);
      visited.add(nodeId);
      return false;
    };

    const startNode = nodes.find((n) => n.type === "start");
    if (startNode && hasCycle(startNode.id)) {
      errors.push("Workflow contains cycles (infinite loops)");
    }

    setValidationErrors(errors);
    return errors.length === 0;
  }, [nodes, edges]);

  /**
   * Save workflow
   */
  const handleSave = useCallback(() => {
    if (!validateWorkflow()) {
      alert("Please fix validation errors before saving");
      return;
    }

    const template: WorkflowTemplate = {
      id: initialWorkflow?.id || `workflow-${Date.now()}`,
      name: workflowName,
      description: workflowDescription,
      category: "automation",
      tags: ["custom"],
      complexity: "intermediate",
      createdAt: initialWorkflow?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nodes: nodes.map((node) => ({
        id: node.id,
        type: node.type || "action",
        label: node.data.label,
        x: node.position.x,
        y: node.position.y,
        params: node.data.params,
      })),
      connections: edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
      })),
    };

    onSave?.(template);
  }, [
    nodes,
    edges,
    workflowName,
    workflowDescription,
    initialWorkflow,
    validateWorkflow,
    onSave,
  ]);

  /**
   * Execute workflow
   */
  const handleExecute = useCallback(() => {
    if (!validateWorkflow()) {
      alert("Please fix validation errors before executing");
      return;
    }

    const template: WorkflowTemplate = {
      id: initialWorkflow?.id || `workflow-${Date.now()}`,
      name: workflowName,
      description: workflowDescription,
      category: "automation",
      tags: ["custom"],
      complexity: "intermediate",
      createdAt: initialWorkflow?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nodes: nodes.map((node) => ({
        id: node.id,
        type: node.type || "action",
        label: node.data.label,
        x: node.position.x,
        y: node.position.y,
        params: node.data.params,
      })),
      connections: edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
      })),
    };

    onExecute?.(template);
    setShowPreview(true);
  }, [
    nodes,
    edges,
    workflowName,
    workflowDescription,
    initialWorkflow,
    validateWorkflow,
    onExecute,
  ]);

  return (
    <div
      className="workflow-builder"
      style={{ width: "100%", height: "100vh" }}
    >
      {/* Toolbar */}
      <div
        className="toolbar"
        style={{
          height: "60px",
          background: "#fff",
          borderBottom: "1px solid #ddd",
          padding: "10px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <input
            type="text"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            style={{
              fontSize: "18px",
              fontWeight: "bold",
              border: "none",
              outline: "none",
              marginRight: "20px",
            }}
            placeholder="Workflow Name"
          />
          <button onClick={() => setShowTemplateGallery(true)}>
            📚 Templates
          </button>
          <button onClick={() => addNode("action")}>➕ Add Action</button>
          <button onClick={() => addNode("condition")}>❓ Add Condition</button>
          <button onClick={() => addNode("loop")}>🔄 Add Loop</button>
        </div>
        <div>
          <button onClick={validateWorkflow}>✅ Validate</button>
          <button onClick={handleSave}>💾 Save</button>
          <button onClick={handleExecute}>▶️ Execute</button>
        </div>
      </div>

      {/* Main workspace */}
      <div style={{ display: "flex", height: "calc(100vh - 60px)" }}>
        {/* Canvas */}
        <div ref={reactFlowWrapper} style={{ flex: 1 }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>

        {/* Side panel */}
        <div
          style={{
            width: "300px",
            background: "#f5f5f5",
            borderLeft: "1px solid #ddd",
            overflow: "auto",
          }}
        >
          {selectedNode && (
            <NodeEditor
              node={selectedNode}
              onUpdate={updateNodeData}
              onDelete={deleteNode}
            />
          )}

          {validationErrors.length > 0 && (
            <WorkflowValidator errors={validationErrors} />
          )}
        </div>
      </div>

      {/* Modals */}
      {showTemplateGallery && (
        <TemplateGallery
          templates={WORKFLOW_TEMPLATES}
          onSelect={(template) => {
            loadTemplate(template);
            setShowTemplateGallery(false);
          }}
          onClose={() => setShowTemplateGallery(false)}
        />
      )}

      {showPreview && (
        <RealTimePreview
          workflow={{
            id: "preview",
            name: workflowName,
            description: workflowDescription,
            category: "automation",
            tags: [],
            complexity: "intermediate",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            nodes: nodes.map((node) => ({
              id: node.id,
              type: node.type || "action",
              label: node.data.label,
              x: node.position.x,
              y: node.position.y,
              params: node.data.params,
            })),
            connections: edges.map((edge) => ({
              id: edge.id,
              source: edge.source,
              target: edge.target,
            })),
          }}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
};

/**
 * Custom node components
 */
function StartNode({ data }: { data: any }) {
  return (
    <div
      style={{
        padding: "10px 20px",
        borderRadius: "50%",
        background: "#4CAF50",
        color: "white",
        fontWeight: "bold",
      }}
    >
      {data.label || "Start"}
    </div>
  );
}

function EndNode({ data }: { data: any }) {
  return (
    <div
      style={{
        padding: "10px 20px",
        borderRadius: "50%",
        background: "#f44336",
        color: "white",
        fontWeight: "bold",
      }}
    >
      {data.label || "End"}
    </div>
  );
}

function ActionNode({ data }: { data: any }) {
  return (
    <div
      style={{
        padding: "10px 20px",
        borderRadius: "4px",
        background: "#2196F3",
        color: "white",
        minWidth: "150px",
      }}
    >
      {data.label || "Action"}
    </div>
  );
}

function ConditionNode({ data }: { data: any }) {
  return (
    <div
      style={{
        padding: "10px 20px",
        transform: "rotate(45deg)",
        background: "#FF9800",
        color: "white",
        minWidth: "100px",
        minHeight: "100px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span style={{ transform: "rotate(-45deg)" }}>
        {data.label || "Condition"}
      </span>
    </div>
  );
}

function LoopNode({ data }: { data: any }) {
  return (
    <div
      style={{
        padding: "10px 20px",
        borderRadius: "4px",
        background: "#9C27B0",
        color: "white",
        minWidth: "150px",
        border: "2px dashed white",
      }}
    >
      {data.label || "Loop"}
    </div>
  );
}

function ParallelNode({ data }: { data: any }) {
  return (
    <div
      style={{
        padding: "10px 20px",
        borderRadius: "4px",
        background: "#00BCD4",
        color: "white",
        minWidth: "150px",
        border: "2px solid white",
      }}
    >
      {data.label || "Parallel"}
    </div>
  );
}

/**
 * Wrapped component with ReactFlowProvider
 */
export default function WorkflowBuilderWrapper(props: WorkflowBuilderProps) {
  return (
    <ReactFlowProvider>
      <WorkflowBuilder {...props} />
    </ReactFlowProvider>
  );
}
