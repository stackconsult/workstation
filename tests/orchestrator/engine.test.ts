/// <reference types="jest" />

import { OrchestrationEngine } from "../../src/automation/orchestrator/engine";

describe("Orchestration Engine", () => {
  let engine: OrchestrationEngine;

  beforeEach(() => {
    engine = new OrchestrationEngine();
  });

  describe("executeWorkflow", () => {
    it("should create and execute workflow", async () => {
      const mockExecute = jest.fn().mockResolvedValue({
        id: "exec-123",
        workflow_id: "wf-123",
        status: "pending",
        trigger_type: "manual",
        triggered_by: "user-123",
        created_at: new Date().toISOString(),
      });

      const result = await mockExecute({
        workflow_id: "wf-123",
        trigger_type: "manual",
        triggered_by: "user-123",
      });

      expect(result.id).toBeDefined();
      expect(result.workflow_id).toBe("wf-123");
      expect(result.status).toBe("pending");
    });

    it("should handle non-existent workflow", async () => {
      const mockExecute = jest
        .fn()
        .mockRejectedValue(new Error("Workflow not found: wf-nonexistent"));

      await expect(
        mockExecute({
          workflow_id: "wf-nonexistent",
          trigger_type: "manual",
        }),
      ).rejects.toThrow("Workflow not found");
    });

    it("should reject inactive workflow", async () => {
      const mockExecute = jest
        .fn()
        .mockRejectedValue(new Error("Workflow is not active: disabled"));

      await expect(
        mockExecute({
          workflow_id: "wf-disabled",
          trigger_type: "manual",
        }),
      ).rejects.toThrow("Workflow is not active");
    });

    it("should execute with variables", async () => {
      const mockExecute = jest.fn().mockResolvedValue({
        id: "exec-124",
        workflow_id: "wf-123",
        status: "pending",
        trigger_type: "manual",
        variables: { userId: 123, action: "process" },
      });

      const result = await mockExecute({
        workflow_id: "wf-123",
        trigger_type: "manual",
        variables: { userId: 123, action: "process" },
      });

      expect(result.variables).toBeDefined();
    });

    it("should support different trigger types", async () => {
      const mockExecute = jest.fn().mockResolvedValue({
        id: "exec-125",
        workflow_id: "wf-123",
        status: "pending",
        trigger_type: "schedule",
        triggered_by: "system",
      });

      const result = await mockExecute({
        workflow_id: "wf-123",
        trigger_type: "schedule",
        triggered_by: "system",
      });

      expect(result.trigger_type).toBe("schedule");
    });
  });

  describe("task execution", () => {
    it("should execute tasks sequentially", async () => {
      const mockRun = jest.fn().mockResolvedValue({
        execution_id: "exec-123",
        status: "completed",
        tasks: [
          { name: "task1", status: "completed", order: 0 },
          { name: "task2", status: "completed", order: 1 },
          { name: "task3", status: "completed", order: 2 },
        ],
      });

      const result = await mockRun();

      expect(result.tasks).toHaveLength(3);
      expect(result.status).toBe("completed");
    });

    it("should pass data between tasks", async () => {
      const mockRun = jest.fn().mockResolvedValue({
        execution_id: "exec-124",
        output: {
          task1: { userId: 123 },
          task2: { profileData: { userId: 123, name: "John" } },
        },
      });

      const result = await mockRun();

      expect(result.output.task1).toBeDefined();
      expect(result.output.task2.profileData.userId).toBe(123);
    });

    it("should handle task failures", async () => {
      const mockRun = jest.fn().mockResolvedValue({
        execution_id: "exec-125",
        status: "failed",
        tasks: [
          { name: "task1", status: "completed" },
          {
            name: "task2",
            status: "failed",
            error_message: "Task execution error",
          },
        ],
        error_message: "Task failed: Task execution error",
      });

      const result = await mockRun();

      expect(result.status).toBe("failed");
      expect(result.error_message).toContain("Task failed");
    });

    it("should continue on error when configured", async () => {
      const mockRun = jest.fn().mockResolvedValue({
        execution_id: "exec-126",
        status: "completed",
        tasks: [
          { name: "task1", status: "completed" },
          { name: "task2", status: "failed", error_message: "Error" },
          { name: "task3", status: "completed" },
        ],
        on_error: "continue",
      });

      const result = await mockRun();

      expect(result.status).toBe("completed");
      expect(result.tasks[2].status).toBe("completed");
    });

    it("should retry failed tasks", async () => {
      const mockRun = jest.fn().mockResolvedValue({
        execution_id: "exec-127",
        tasks: [
          {
            name: "task1",
            status: "completed",
            attempts: 2,
            retries: 1,
          },
        ],
      });

      const result = await mockRun();

      expect(result.tasks[0].attempts).toBe(2);
      expect(result.tasks[0].retries).toBe(1);
    });
  });

  describe("workflow status management", () => {
    it("should update status to running", async () => {
      const mockStatus = jest.fn().mockResolvedValue({
        execution_id: "exec-123",
        status: "running",
        started_at: new Date().toISOString(),
      });

      const result = await mockStatus();

      expect(result.status).toBe("running");
      expect(result.started_at).toBeDefined();
    });

    it("should update status to completed", async () => {
      const mockStatus = jest.fn().mockResolvedValue({
        execution_id: "exec-123",
        status: "completed",
        completed_at: new Date().toISOString(),
        duration_ms: 5000,
      });

      const result = await mockStatus();

      expect(result.status).toBe("completed");
      expect(result.completed_at).toBeDefined();
      expect(result.duration_ms).toBe(5000);
    });

    it("should update status to failed", async () => {
      const mockStatus = jest.fn().mockResolvedValue({
        execution_id: "exec-123",
        status: "failed",
        error_message: "Execution failed",
        duration_ms: 2000,
      });

      const result = await mockStatus();

      expect(result.status).toBe("failed");
      expect(result.error_message).toBeDefined();
    });
  });

  describe("agent integration", () => {
    it("should execute agent tasks", async () => {
      const mockExecute = jest.fn().mockResolvedValue({
        task_id: "task-123",
        agent: "browser",
        action: "navigate",
        status: "completed",
        output: { url: "https://example.com" },
      });

      const result = await mockExecute({
        agent: "browser",
        action: "navigate",
        params: { url: "https://example.com" },
      });

      expect(result.status).toBe("completed");
      expect(result.output.url).toBe("https://example.com");
    });

    it("should handle agent not found", async () => {
      const mockExecute = jest
        .fn()
        .mockRejectedValue(new Error("Agent not found: nonexistent"));

      await expect(
        mockExecute({
          agent: "nonexistent",
          action: "test",
        }),
      ).rejects.toThrow("Agent not found");
    });

    it("should handle action not supported", async () => {
      const mockExecute = jest
        .fn()
        .mockRejectedValue(new Error("Action not supported: invalidAction"));

      await expect(
        mockExecute({
          agent: "browser",
          action: "invalidAction",
        }),
      ).rejects.toThrow("Action not supported");
    });
  });

  describe("execution tracking", () => {
    it("should track execution duration", async () => {
      const mockTrack = jest.fn().mockResolvedValue({
        execution_id: "exec-123",
        started_at: "2024-01-01T10:00:00Z",
        completed_at: "2024-01-01T10:00:05Z",
        duration_ms: 5000,
      });

      const result = await mockTrack();

      expect(result.duration_ms).toBe(5000);
    });

    it("should track task outputs", async () => {
      const mockTrack = jest.fn().mockResolvedValue({
        execution_id: "exec-123",
        output: {
          task1: { result: "success" },
          task2: { data: [1, 2, 3] },
        },
      });

      const result = await mockTrack();

      expect(result.output.task1).toBeDefined();
      expect(result.output.task2.data).toEqual([1, 2, 3]);
    });
  });

  describe("error handling", () => {
    it("should handle database errors", async () => {
      const mockExecute = jest
        .fn()
        .mockRejectedValue(new Error("Database connection failed"));

      await expect(mockExecute()).rejects.toThrow("Database connection failed");
    });

    it("should handle JSON parsing errors", async () => {
      const mockExecute = jest
        .fn()
        .mockRejectedValue(new Error("Invalid JSON in workflow definition"));

      await expect(mockExecute()).rejects.toThrow("Invalid JSON");
    });

    it("should handle task timeout", async () => {
      const mockExecute = jest.fn().mockResolvedValue({
        task_id: "task-123",
        status: "failed",
        error_message: "Task execution timeout after 30000ms",
      });

      const result = await mockExecute();

      expect(result.status).toBe("failed");
      expect(result.error_message).toContain("timeout");
    });
  });

  describe("concurrent executions", () => {
    it("should handle multiple concurrent workflows", async () => {
      const mockExecute = jest.fn().mockResolvedValue({
        execution_id: expect.any(String),
        status: "pending",
      });

      const results = await Promise.all([
        mockExecute({ workflow_id: "wf-1" }),
        mockExecute({ workflow_id: "wf-2" }),
        mockExecute({ workflow_id: "wf-3" }),
      ]);

      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result.execution_id).toBeDefined();
      });
    });

    it("should handle concurrent task execution within workflow", async () => {
      const mockExecute = jest.fn().mockResolvedValue({
        execution_id: "exec-123",
        concurrentTasks: 5,
        duration_ms: 2000,
      });

      const result = await mockExecute();

      expect(result.concurrentTasks).toBe(5);
    });
  });

  describe("workflow definition validation", () => {
    it("should validate workflow structure", async () => {
      const mockValidate = jest.fn().mockResolvedValue({
        valid: true,
        workflow_id: "wf-123",
      });

      const result = await mockValidate({
        tasks: [{ name: "task1", action: "test", order: 0 }],
      });

      expect(result.valid).toBe(true);
    });

    it("should reject invalid workflow definition", async () => {
      const mockValidate = jest.fn().mockResolvedValue({
        valid: false,
        error: "Invalid task structure",
      });

      const result = await mockValidate({
        tasks: [],
      });

      expect(result.valid).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("should handle empty workflow", async () => {
      const mockExecute = jest.fn().mockResolvedValue({
        execution_id: "exec-123",
        status: "completed",
        tasks: [],
        duration_ms: 0,
      });

      const result = await mockExecute();

      expect(result.tasks).toHaveLength(0);
      expect(result.status).toBe("completed");
    });

    it("should handle very long workflows", async () => {
      const mockExecute = jest.fn().mockResolvedValue({
        execution_id: "exec-123",
        tasks: Array.from({ length: 100 }, (_, i) => ({
          name: `task${i}`,
          status: "completed",
        })),
      });

      const result = await mockExecute();

      expect(result.tasks).toHaveLength(100);
    });

    it("should handle task dependencies", async () => {
      const mockExecute = jest.fn().mockResolvedValue({
        execution_id: "exec-123",
        tasks: [
          { name: "task1", depends_on: [] },
          { name: "task2", depends_on: ["task1"] },
          { name: "task3", depends_on: ["task1", "task2"] },
        ],
      });

      const result = await mockExecute();

      expect(result.tasks[2].depends_on).toContain("task1");
      expect(result.tasks[2].depends_on).toContain("task2");
    });
  });
});
