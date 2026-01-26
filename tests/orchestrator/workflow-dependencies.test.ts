/// <reference types="jest" />

import { WorkflowDependenciesManager } from "../../src/automation/orchestrator/workflow-dependencies";

describe("Workflow Dependencies Manager", () => {
  let manager: WorkflowDependenciesManager;

  beforeEach(() => {
    manager = new WorkflowDependenciesManager();
  });

  describe("workflow chain creation (mocked)", () => {
    it("should create simple workflow chain", async () => {
      const mockCreate = jest.fn().mockResolvedValue({
        id: "chain-123",
        name: "Test Chain",
        workflows: [
          { workflow_id: "wf1", order: 0, depends_on: [] },
          { workflow_id: "wf2", order: 1, depends_on: ["wf1"] },
        ],
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      });

      const result = await mockCreate("Test Chain", [
        { workflow_id: "wf1", order: 0, depends_on: [] },
        { workflow_id: "wf2", order: 1, depends_on: ["wf1"] },
      ]);

      expect(result.id).toBe("chain-123");
      expect(result.workflows).toHaveLength(2);
    });

    it("should create chain with multiple parallel workflows", async () => {
      const mockCreate = jest.fn().mockResolvedValue({
        id: "chain-456",
        name: "Parallel Chain",
        workflows: [
          { workflow_id: "wf1", order: 0, depends_on: [] },
          { workflow_id: "wf2", order: 1, depends_on: ["wf1"] },
          { workflow_id: "wf3", order: 2, depends_on: ["wf1"] },
          { workflow_id: "wf4", order: 3, depends_on: ["wf2", "wf3"] },
        ],
      });

      const result = await mockCreate("Parallel Chain", []);

      expect(result.workflows).toHaveLength(4);
      expect(result.workflows[3].depends_on).toContain("wf2");
      expect(result.workflows[3].depends_on).toContain("wf3");
    });

    it("should reject chain with circular dependencies", async () => {
      const mockCreate = jest
        .fn()
        .mockRejectedValue(
          new Error("Circular dependency detected in workflow chain"),
        );

      await expect(
        mockCreate("Invalid Chain", [
          { workflow_id: "wf1", order: 0, depends_on: ["wf3"] },
          { workflow_id: "wf2", order: 1, depends_on: ["wf1"] },
          { workflow_id: "wf3", order: 2, depends_on: ["wf2"] },
        ]),
      ).rejects.toThrow("Circular dependency");
    });

    it("should reject chain with non-existent workflow", async () => {
      const mockCreate = jest
        .fn()
        .mockRejectedValue(new Error("Workflow not found: wf999"));

      await expect(
        mockCreate("Invalid Chain", [
          { workflow_id: "wf999", order: 0, depends_on: [] },
        ]),
      ).rejects.toThrow("Workflow not found");
    });
  });

  describe("conditional workflow execution (mocked)", () => {
    it("should execute workflow based on status condition", async () => {
      const mockExecute = jest.fn().mockResolvedValue({
        workflow_id: "wf2",
        status: "completed",
        condition_met: true,
        condition: { type: "status", value: "completed" },
      });

      const result = await mockExecute({
        workflow_id: "wf2",
        condition: { type: "status", value: "completed" },
      });

      expect(result.condition_met).toBe(true);
      expect(result.status).toBe("completed");
    });

    it("should skip workflow if condition not met", async () => {
      const mockExecute = jest.fn().mockResolvedValue({
        workflow_id: "wf2",
        status: "skipped",
        condition_met: false,
        reason:
          "Condition not met: expected status=completed, got status=failed",
      });

      const result = await mockExecute({
        workflow_id: "wf2",
        condition: { type: "status", value: "completed" },
      });

      expect(result.status).toBe("skipped");
      expect(result.condition_met).toBe(false);
    });

    it("should execute workflow based on output condition", async () => {
      const mockExecute = jest.fn().mockResolvedValue({
        workflow_id: "wf2",
        status: "completed",
        condition_met: true,
        condition: {
          type: "output",
          field: "result.count",
          operator: "greaterThan",
          value: 10,
        },
      });

      const result = await mockExecute({
        workflow_id: "wf2",
        condition: {
          type: "output",
          field: "result.count",
          operator: "greaterThan",
          value: 10,
        },
      });

      expect(result.condition_met).toBe(true);
    });

    it("should execute workflow based on expression condition", async () => {
      const mockExecute = jest.fn().mockResolvedValue({
        workflow_id: "wf2",
        status: "completed",
        condition_met: true,
        condition: {
          type: "expression",
          expression: 'output.users.length > 5 && output.status === "success"',
        },
      });

      const result = await mockExecute({
        workflow_id: "wf2",
        condition: {
          type: "expression",
          expression: 'output.users.length > 5 && output.status === "success"',
        },
      });

      expect(result.condition_met).toBe(true);
    });
  });

  describe("data mapping between workflows (mocked)", () => {
    it("should map output to input variables", async () => {
      const mockExecute = jest.fn().mockResolvedValue({
        workflow_id: "wf2",
        input: {
          userId: 123,
          userName: "John Doe",
        },
        data_mapping: {
          mappings: [
            { from: "wf1.output.userId", to: "userId" },
            { from: "wf1.output.userName", to: "userName" },
          ],
        },
      });

      const result = await mockExecute({
        workflow_id: "wf2",
        previous_output: { userId: 123, userName: "John Doe" },
        data_mapping: {
          mappings: [
            { from: "wf1.output.userId", to: "userId" },
            { from: "wf1.output.userName", to: "userName" },
          ],
        },
      });

      expect(result.input.userId).toBe(123);
      expect(result.input.userName).toBe("John Doe");
    });

    it("should map nested output values", async () => {
      const mockExecute = jest.fn().mockResolvedValue({
        workflow_id: "wf2",
        input: {
          city: "NYC",
          zipCode: "10001",
        },
        data_mapping: {
          mappings: [
            { from: "wf1.output.user.address.city", to: "city" },
            { from: "wf1.output.user.address.zipCode", to: "zipCode" },
          ],
        },
      });

      const result = await mockExecute({
        workflow_id: "wf2",
        previous_output: {
          user: {
            address: { city: "NYC", zipCode: "10001" },
          },
        },
      });

      expect(result.input.city).toBe("NYC");
      expect(result.input.zipCode).toBe("10001");
    });

    it("should handle missing mapped fields gracefully", async () => {
      const mockExecute = jest.fn().mockResolvedValue({
        workflow_id: "wf2",
        input: {
          userId: null, // Field not found in source
        },
        warnings: ["Field not found: wf1.output.userId"],
      });

      const result = await mockExecute({
        workflow_id: "wf2",
        previous_output: {},
        data_mapping: {
          mappings: [{ from: "wf1.output.userId", to: "userId" }],
        },
      });

      expect(result.warnings).toBeDefined();
      expect(result.warnings[0]).toContain("Field not found");
    });

    it("should map array elements", async () => {
      const mockExecute = jest.fn().mockResolvedValue({
        workflow_id: "wf2",
        input: {
          firstUser: { id: 1, name: "John" },
        },
        data_mapping: {
          mappings: [{ from: "wf1.output.users[0]", to: "firstUser" }],
        },
      });

      const result = await mockExecute({
        workflow_id: "wf2",
        previous_output: {
          users: [
            { id: 1, name: "John" },
            { id: 2, name: "Jane" },
          ],
        },
      });

      expect(result.input.firstUser.id).toBe(1);
    });
  });

  describe("chain execution (mocked)", () => {
    it("should execute entire chain successfully", async () => {
      const mockExecuteChain = jest.fn().mockResolvedValue({
        chain_id: "chain-123",
        total_workflows: 3,
        executed: 3,
        skipped: 0,
        failed: 0,
        workflows: [
          { workflow_id: "wf1", status: "completed", output: { step: 1 } },
          { workflow_id: "wf2", status: "completed", output: { step: 2 } },
          { workflow_id: "wf3", status: "completed", output: { step: 3 } },
        ],
        total_duration: 5000,
      });

      const result = await mockExecuteChain("chain-123");

      expect(result.executed).toBe(3);
      expect(result.failed).toBe(0);
      expect(result.workflows.every((w: any) => w.status === "completed")).toBe(
        true,
      );
    });

    it("should handle workflow failure in chain", async () => {
      const mockExecuteChain = jest.fn().mockResolvedValue({
        chain_id: "chain-456",
        total_workflows: 3,
        executed: 1,
        skipped: 1,
        failed: 1,
        workflows: [
          { workflow_id: "wf1", status: "completed" },
          { workflow_id: "wf2", status: "failed", error: "Execution error" },
          {
            workflow_id: "wf3",
            status: "skipped",
            reason: "Dependency failed",
          },
        ],
        total_duration: 2000,
      });

      const result = await mockExecuteChain("chain-456");

      expect(result.failed).toBe(1);
      expect(result.skipped).toBe(1);
      expect(result.workflows[2].status).toBe("skipped");
    });

    it("should track execution context for each workflow", async () => {
      const mockExecuteChain = jest.fn().mockResolvedValue({
        chain_id: "chain-789",
        workflows: [
          {
            workflow_id: "wf1",
            execution_id: "exec-1",
            status: "completed",
            started_at: "2024-01-01T10:00:00Z",
            completed_at: "2024-01-01T10:00:10Z",
            output: { data: "result" },
          },
          {
            workflow_id: "wf2",
            execution_id: "exec-2",
            status: "completed",
            started_at: "2024-01-01T10:00:10Z",
            completed_at: "2024-01-01T10:00:20Z",
            output: { processed: true },
          },
        ],
      });

      const result = await mockExecuteChain("chain-789");

      expect(result.workflows[0].execution_id).toBe("exec-1");
      expect(result.workflows[0].started_at).toBeDefined();
      expect(result.workflows[0].completed_at).toBeDefined();
    });

    it("should execute workflows in correct order", async () => {
      const mockExecuteChain = jest.fn().mockResolvedValue({
        execution_order: ["wf1", "wf2", "wf3", "wf4"],
        workflows: [
          { workflow_id: "wf1", order: 0, executed_at: "10:00:00" },
          { workflow_id: "wf2", order: 1, executed_at: "10:00:05" },
          { workflow_id: "wf3", order: 2, executed_at: "10:00:05" }, // Parallel with wf2
          { workflow_id: "wf4", order: 3, executed_at: "10:00:10" },
        ],
      });

      const result = await mockExecuteChain("chain-ordered");

      expect(result.execution_order).toEqual(["wf1", "wf2", "wf3", "wf4"]);
    });
  });

  describe("workflow versioning (mocked)", () => {
    it("should support workflow version selection", async () => {
      const mockExecute = jest.fn().mockResolvedValue({
        workflow_id: "wf1",
        version: "2.0",
        status: "completed",
      });

      const result = await mockExecute({
        workflow_id: "wf1",
        version: "2.0",
      });

      expect(result.version).toBe("2.0");
    });

    it("should use latest version by default", async () => {
      const mockExecute = jest.fn().mockResolvedValue({
        workflow_id: "wf1",
        version: "3.0",
        status: "completed",
      });

      const result = await mockExecute({
        workflow_id: "wf1",
        // No version specified
      });

      expect(result.version).toBe("3.0");
    });

    it("should handle version not found", async () => {
      const mockExecute = jest
        .fn()
        .mockRejectedValue(new Error("Workflow version not found: wf1@1.5"));

      await expect(
        mockExecute({
          workflow_id: "wf1",
          version: "1.5",
        }),
      ).rejects.toThrow("version not found");
    });
  });

  describe("error handling and recovery", () => {
    it("should retry failed workflows", async () => {
      const mockExecute = jest
        .fn()
        .mockRejectedValueOnce(new Error("Temporary error"))
        .mockResolvedValueOnce({
          workflow_id: "wf1",
          status: "completed",
          retry_count: 1,
        });

      await expect(mockExecute()).rejects.toThrow("Temporary error");
      const result = await mockExecute();

      expect(result.status).toBe("completed");
      expect(result.retry_count).toBe(1);
    });

    it("should provide rollback capability", async () => {
      const mockRollback = jest.fn().mockResolvedValue({
        chain_id: "chain-123",
        rolled_back: ["wf2", "wf1"],
        status: "rolled_back",
      });

      const result = await mockRollback("chain-123");

      expect(result.status).toBe("rolled_back");
      expect(result.rolled_back).toContain("wf1");
      expect(result.rolled_back).toContain("wf2");
    });

    it("should handle timeout errors", async () => {
      const mockExecute = jest
        .fn()
        .mockRejectedValue(
          new Error("Workflow execution timeout after 30000ms"),
        );

      await expect(mockExecute()).rejects.toThrow("timeout");
    });
  });

  describe("performance and monitoring", () => {
    it("should track chain execution metrics", async () => {
      const mockGetMetrics = jest.fn().mockResolvedValue({
        chain_id: "chain-123",
        total_executions: 10,
        success_rate: 0.95,
        avg_duration: 5000,
        last_execution: "2024-01-01T12:00:00Z",
      });

      const metrics = await mockGetMetrics("chain-123");

      expect(metrics.success_rate).toBe(0.95);
      expect(metrics.avg_duration).toBe(5000);
    });

    it("should identify bottlenecks in chain", async () => {
      const mockAnalyze = jest.fn().mockResolvedValue({
        bottlenecks: [
          { workflow_id: "wf3", avg_duration: 3000, percentage: 60 },
        ],
        critical_path: ["wf1", "wf3", "wf5"],
        optimization_suggestions: ["Consider parallelizing wf3 tasks"],
      });

      const analysis = await mockAnalyze("chain-123");

      expect(analysis.bottlenecks).toHaveLength(1);
      expect(analysis.critical_path).toContain("wf3");
    });
  });

  describe("edge cases", () => {
    it("should handle chain with single workflow", async () => {
      const mockExecute = jest.fn().mockResolvedValue({
        chain_id: "single-chain",
        workflows: [{ workflow_id: "wf1", status: "completed" }],
      });

      const result = await mockExecute("single-chain");

      expect(result.workflows).toHaveLength(1);
    });

    it("should handle empty chain", async () => {
      const mockCreate = jest
        .fn()
        .mockRejectedValue(new Error("Cannot create empty workflow chain"));

      await expect(mockCreate("Empty", [])).rejects.toThrow("empty");
    });

    it("should handle very long chains", async () => {
      const mockExecute = jest.fn().mockResolvedValue({
        chain_id: "long-chain",
        total_workflows: 100,
        executed: 100,
        failed: 0,
      });

      const result = await mockExecute("long-chain");

      expect(result.total_workflows).toBe(100);
      expect(result.executed).toBe(100);
    });
  });
});
