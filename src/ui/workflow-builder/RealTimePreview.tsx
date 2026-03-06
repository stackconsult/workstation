/**
 * Real-Time Preview Component
 * Live workflow execution preview with step-by-step debugging
 */

import React, { useState, useEffect, useCallback } from "react";
import { WorkflowTemplate } from "../../workflow-templates/types";

interface RealTimePreviewProps {
  workflow: WorkflowTemplate;
  onClose: () => void;
}

interface ExecutionStep {
  nodeId: string;
  nodeName: string;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  startTime?: number;
  endTime?: number;
  duration?: number;
  output?: any;
  error?: string;
  variables?: Record<string, any>;
}

interface PerformanceMetrics {
  totalDuration: number;
  stepCount: number;
  successRate: number;
  averageStepDuration: number;
  slowestStep: string;
  fastestStep: string;
}

export const RealTimePreview: React.FC<RealTimePreviewProps> = ({
  workflow,
  onClose,
}) => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionSteps, setExecutionSteps] = useState<ExecutionStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [variables, setVariables] = useState<Record<string, any>>({});
  const [performanceMetrics, setPerformanceMetrics] =
    useState<PerformanceMetrics | null>(null);
  const [executionSpeed, setExecutionSpeed] = useState<
    "slow" | "normal" | "fast"
  >("normal");

  /**
   * Initialize execution steps from workflow
   */
  useEffect(() => {
    const steps: ExecutionStep[] = workflow.nodes.map((node) => ({
      nodeId: node.id,
      nodeName: node.label,
      status: "pending",
    }));
    setExecutionSteps(steps);
  }, [workflow]);

  /**
   * Calculate execution delay based on speed
   */
  const getExecutionDelay = () => {
    switch (executionSpeed) {
      case "slow":
        return 2000;
      case "fast":
        return 500;
      default:
        return 1000;
    }
  };

  /**
   * Simulate workflow execution
   */
  const executeWorkflow = useCallback(async () => {
    setIsExecuting(true);
    setCurrentStepIndex(0);
    const startTime = Date.now();

    // Find start node
    const startNode = workflow.nodes.find((n) => n.type === "start");
    if (!startNode) {
      alert("No start node found");
      setIsExecuting(false);
      return;
    }

    // Execute nodes in order based on connections
    const executedNodes = new Set<string>();
    const queue = [startNode.id];

    let stepIndex = 0;
    while (queue.length > 0 && isExecuting) {
      const currentNodeId = queue.shift()!;

      if (executedNodes.has(currentNodeId)) {
        continue;
      }

      const currentNode = workflow.nodes.find((n) => n.id === currentNodeId);
      if (!currentNode) continue;

      // Update step status to running
      setExecutionSteps((prev) =>
        prev.map((step, idx) =>
          idx === stepIndex
            ? { ...step, status: "running", startTime: Date.now() }
            : step,
        ),
      );
      setCurrentStepIndex(stepIndex);

      // Simulate execution delay
      await new Promise((resolve) => setTimeout(resolve, getExecutionDelay()));

      // Simulate step execution and output
      const stepOutput = simulateStepExecution(currentNode, variables);
      const stepDuration =
        Date.now() - (executionSteps[stepIndex]?.startTime || Date.now());

      // Update step status to completed
      setExecutionSteps((prev) =>
        prev.map((step, idx) =>
          idx === stepIndex
            ? {
                ...step,
                status: stepOutput.success ? "completed" : "failed",
                endTime: Date.now(),
                duration: stepDuration,
                output: stepOutput.output,
                error: stepOutput.error,
                variables: { ...variables },
              }
            : step,
        ),
      );

      if (stepOutput.success) {
        // Update variables with step output
        setVariables((prev) => ({ ...prev, ...stepOutput.variables }));

        // Add connected nodes to queue
        const connectedNodes = workflow.connections
          .filter((conn) => conn.source === currentNodeId)
          .map((conn) => conn.target);

        queue.push(...connectedNodes);
        executedNodes.add(currentNodeId);
      } else {
        // Handle error - stop execution or continue based on error handling strategy
        console.error(`Step ${currentNode.label} failed:`, stepOutput.error);
        break;
      }

      stepIndex++;
    }

    // Calculate performance metrics
    const totalDuration = Date.now() - startTime;
    const completedSteps = executionSteps.filter(
      (s) => s.status === "completed",
    );
    const successRate = (completedSteps.length / executionSteps.length) * 100;
    const durations = completedSteps.map((s) => s.duration || 0);
    const averageStepDuration =
      durations.reduce((a, b) => a + b, 0) / durations.length;

    const slowestStepIdx = durations.indexOf(Math.max(...durations));
    const fastestStepIdx = durations.indexOf(Math.min(...durations));

    setPerformanceMetrics({
      totalDuration,
      stepCount: executionSteps.length,
      successRate,
      averageStepDuration,
      slowestStep: completedSteps[slowestStepIdx]?.nodeName || "N/A",
      fastestStep: completedSteps[fastestStepIdx]?.nodeName || "N/A",
    });

    setIsExecuting(false);
  }, [workflow, variables, executionSteps, isExecuting, executionSpeed]);

  /**
   * Simulate step execution (placeholder for actual execution logic)
   */
  const simulateStepExecution = (
    node: any,
    currentVariables: Record<string, any>,
  ) => {
    // Simulate different node type behaviors
    const random = Math.random();

    // 90% success rate for simulation
    if (random > 0.9) {
      return {
        success: false,
        error: `Simulated error in step "${node.label}"`,
      };
    }

    return {
      success: true,
      output: {
        nodeId: node.id,
        nodeType: node.type,
        result: `Executed ${node.label}`,
        timestamp: new Date().toISOString(),
      },
      variables: {
        [`${node.id}_result`]: `Output from ${node.label}`,
      },
    };
  };

  /**
   * Reset execution
   */
  const resetExecution = () => {
    setExecutionSteps((prev) =>
      prev.map((step) => ({
        ...step,
        status: "pending",
        startTime: undefined,
        endTime: undefined,
        duration: undefined,
        output: undefined,
        error: undefined,
      })),
    );
    setCurrentStepIndex(-1);
    setVariables({});
    setPerformanceMetrics(null);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "8px",
          width: "90%",
          maxWidth: "1400px",
          height: "90vh",
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
          <div>
            <h2 style={{ margin: 0 }}>▶️ Workflow Preview: {workflow.name}</h2>
            <p style={{ margin: "5px 0 0 0", color: "#666" }}>
              {workflow.description}
            </p>
          </div>
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

        {/* Controls */}
        <div
          style={{
            padding: "15px 20px",
            borderBottom: "1px solid #eee",
            display: "flex",
            gap: "10px",
            alignItems: "center",
          }}
        >
          <button
            onClick={executeWorkflow}
            disabled={isExecuting}
            style={{
              padding: "10px 20px",
              background: isExecuting ? "#ccc" : "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: isExecuting ? "not-allowed" : "pointer",
              fontWeight: "bold",
            }}
          >
            {isExecuting ? "⏸️ Running..." : "▶️ Execute"}
          </button>
          <button
            onClick={resetExecution}
            disabled={isExecuting}
            style={{
              padding: "10px 20px",
              background: "#ff9800",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: isExecuting ? "not-allowed" : "pointer",
            }}
          >
            🔄 Reset
          </button>
          <div
            style={{
              marginLeft: "20px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <label>Speed:</label>
            <select
              value={executionSpeed}
              onChange={(e) => setExecutionSpeed(e.target.value as any)}
              disabled={isExecuting}
              style={{ padding: "5px 10px" }}
            >
              <option value="slow">Slow (2s/step)</option>
              <option value="normal">Normal (1s/step)</option>
              <option value="fast">Fast (0.5s/step)</option>
            </select>
          </div>
        </div>

        {/* Main content */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {/* Execution steps */}
          <div
            style={{
              flex: 1,
              overflow: "auto",
              padding: "20px",
              borderRight: "1px solid #ddd",
            }}
          >
            <h3>Execution Steps</h3>
            {executionSteps.map((step, index) => (
              <div
                key={step.nodeId}
                style={{
                  padding: "15px",
                  margin: "10px 0",
                  border: "2px solid",
                  borderColor:
                    step.status === "running"
                      ? "#2196F3"
                      : step.status === "completed"
                        ? "#4CAF50"
                        : step.status === "failed"
                          ? "#f44336"
                          : "#ddd",
                  borderRadius: "4px",
                  background: currentStepIndex === index ? "#f0f8ff" : "white",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <span style={{ fontSize: "20px" }}>
                      {step.status === "running"
                        ? "⏳"
                        : step.status === "completed"
                          ? "✅"
                          : step.status === "failed"
                            ? "❌"
                            : "⏸️"}
                    </span>
                    <div>
                      <div style={{ fontWeight: "bold" }}>{step.nodeName}</div>
                      <div style={{ fontSize: "12px", color: "#666" }}>
                        {step.status.toUpperCase()}
                      </div>
                    </div>
                  </div>
                  {step.duration && (
                    <div style={{ fontSize: "12px", color: "#666" }}>
                      {step.duration}ms
                    </div>
                  )}
                </div>

                {step.output && (
                  <div
                    style={{
                      marginTop: "10px",
                      padding: "10px",
                      background: "#f5f5f5",
                      borderRadius: "4px",
                      fontSize: "12px",
                    }}
                  >
                    <strong>Output:</strong>
                    <pre style={{ margin: "5px 0 0 0", overflow: "auto" }}>
                      {JSON.stringify(step.output, null, 2)}
                    </pre>
                  </div>
                )}

                {step.error && (
                  <div
                    style={{
                      marginTop: "10px",
                      padding: "10px",
                      background: "#ffebee",
                      borderRadius: "4px",
                      fontSize: "12px",
                      color: "#c62828",
                    }}
                  >
                    <strong>Error:</strong> {step.error}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Variables inspector */}
          <div
            style={{
              width: "300px",
              overflow: "auto",
              padding: "20px",
              background: "#f9f9f9",
            }}
          >
            <h3>Variables</h3>
            {Object.keys(variables).length === 0 ? (
              <p style={{ color: "#999" }}>No variables yet</p>
            ) : (
              <div>
                {Object.entries(variables).map(([key, value]) => (
                  <div
                    key={key}
                    style={{
                      marginBottom: "10px",
                      padding: "10px",
                      background: "white",
                      borderRadius: "4px",
                      border: "1px solid #ddd",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: "bold",
                        fontSize: "12px",
                        marginBottom: "5px",
                      }}
                    >
                      {key}
                    </div>
                    <div style={{ fontSize: "12px", wordBreak: "break-all" }}>
                      {typeof value === "object"
                        ? JSON.stringify(value)
                        : String(value)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {performanceMetrics && (
              <div style={{ marginTop: "30px" }}>
                <h3>Performance Metrics</h3>
                <div
                  style={{
                    padding: "15px",
                    background: "white",
                    borderRadius: "4px",
                    border: "1px solid #ddd",
                  }}
                >
                  <div style={{ marginBottom: "10px" }}>
                    <strong>Total Duration:</strong>{" "}
                    {performanceMetrics.totalDuration}ms
                  </div>
                  <div style={{ marginBottom: "10px" }}>
                    <strong>Steps:</strong> {performanceMetrics.stepCount}
                  </div>
                  <div style={{ marginBottom: "10px" }}>
                    <strong>Success Rate:</strong>{" "}
                    {performanceMetrics.successRate.toFixed(1)}%
                  </div>
                  <div style={{ marginBottom: "10px" }}>
                    <strong>Avg Step Duration:</strong>{" "}
                    {performanceMetrics.averageStepDuration.toFixed(0)}ms
                  </div>
                  <div style={{ marginBottom: "10px" }}>
                    <strong>Slowest Step:</strong>{" "}
                    {performanceMetrics.slowestStep}
                  </div>
                  <div>
                    <strong>Fastest Step:</strong>{" "}
                    {performanceMetrics.fastestStep}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
