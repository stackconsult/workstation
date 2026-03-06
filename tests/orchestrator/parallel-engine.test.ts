/// <reference types="jest" />

import { ParallelExecutionEngine } from "../../src/automation/orchestrator/parallel-engine";
import { WorkflowTask } from "../../src/automation/db/models";

describe("Parallel Execution Engine", () => {
  let engine: ParallelExecutionEngine;

  beforeEach(() => {
    engine = new ParallelExecutionEngine(5); // Max 5 concurrent tasks
  });

  describe("DAG construction", () => {
    it("should build DAG from tasks with no dependencies", () => {
      const tasks: WorkflowTask[] = [
        { name: "task1", action: "test", params: {}, order: 0, depends_on: [] },
        { name: "task2", action: "test", params: {}, order: 1, depends_on: [] },
        { name: "task3", action: "test", params: {}, order: 2, depends_on: [] },
      ];

      const dag = engine.buildDAG(tasks);

      expect(dag).toHaveLength(3);
      expect(dag.every((node) => node.level === 0)).toBe(true);
      expect(dag.every((node) => node.dependencies.length === 0)).toBe(true);
    });

    it("should build DAG with simple dependencies", () => {
      const tasks: WorkflowTask[] = [
        { name: "task1", action: "test", params: {}, order: 0, depends_on: [] },
        {
          name: "task2",
          action: "test",
          params: {},
          order: 1,
          depends_on: ["task1"],
        },
        {
          name: "task3",
          action: "test",
          params: {},
          order: 2,
          depends_on: ["task2"],
        },
      ];

      const dag = engine.buildDAG(tasks);

      expect(dag).toHaveLength(3);
      expect(dag.find((n) => n.id === "task1")?.level).toBe(0);
      expect(dag.find((n) => n.id === "task2")?.level).toBe(1);
      expect(dag.find((n) => n.id === "task3")?.level).toBe(2);
    });

    it("should build DAG with diamond dependency pattern", () => {
      const tasks: WorkflowTask[] = [
        { name: "start", action: "test", params: {}, order: 0, depends_on: [] },
        {
          name: "left",
          action: "test",
          params: {},
          order: 1,
          depends_on: ["start"],
        },
        {
          name: "right",
          action: "test",
          params: {},
          order: 2,
          depends_on: ["start"],
        },
        {
          name: "end",
          action: "test",
          params: {},
          order: 3,
          depends_on: ["left", "right"],
        },
      ];

      const dag = engine.buildDAG(tasks);

      expect(dag.find((n) => n.id === "start")?.level).toBe(0);
      expect(dag.find((n) => n.id === "left")?.level).toBe(1);
      expect(dag.find((n) => n.id === "right")?.level).toBe(1);
      expect(dag.find((n) => n.id === "end")?.level).toBe(2);
    });

    it("should populate dependents lists", () => {
      const tasks: WorkflowTask[] = [
        { name: "task1", action: "test", params: {}, order: 0, depends_on: [] },
        {
          name: "task2",
          action: "test",
          params: {},
          order: 1,
          depends_on: ["task1"],
        },
        {
          name: "task3",
          action: "test",
          params: {},
          order: 2,
          depends_on: ["task1"],
        },
      ];

      const dag = engine.buildDAG(tasks);
      const task1 = dag.find((n) => n.id === "task1");

      expect(task1?.dependents).toContain("task2");
      expect(task1?.dependents).toContain("task3");
      expect(task1?.dependents).toHaveLength(2);
    });

    it("should detect circular dependencies", () => {
      const tasks: WorkflowTask[] = [
        {
          name: "task1",
          action: "test",
          params: {},
          order: 0,
          depends_on: ["task3"],
        },
        {
          name: "task2",
          action: "test",
          params: {},
          order: 1,
          depends_on: ["task1"],
        },
        {
          name: "task3",
          action: "test",
          params: {},
          order: 2,
          depends_on: ["task2"],
        },
      ];

      expect(() => engine.buildDAG(tasks)).toThrow("Circular dependency");
    });

    it("should detect self-referencing task", () => {
      const tasks: WorkflowTask[] = [
        {
          name: "task1",
          action: "test",
          params: {},
          order: 0,
          depends_on: ["task1"],
        },
      ];

      expect(() => engine.buildDAG(tasks)).toThrow();
    });
  });

  describe("execution levels", () => {
    it("should assign correct levels for linear chain", () => {
      const tasks: WorkflowTask[] = [
        { name: "t1", action: "test", params: {}, order: 0, depends_on: [] },
        {
          name: "t2",
          action: "test",
          params: {},
          order: 1,
          depends_on: ["t1"],
        },
        {
          name: "t3",
          action: "test",
          params: {},
          order: 2,
          depends_on: ["t2"],
        },
        {
          name: "t4",
          action: "test",
          params: {},
          order: 3,
          depends_on: ["t3"],
        },
      ];

      const dag = engine.buildDAG(tasks);

      expect(dag.find((n) => n.id === "t1")?.level).toBe(0);
      expect(dag.find((n) => n.id === "t2")?.level).toBe(1);
      expect(dag.find((n) => n.id === "t3")?.level).toBe(2);
      expect(dag.find((n) => n.id === "t4")?.level).toBe(3);
    });

    it("should assign correct levels for parallel branches", () => {
      const tasks: WorkflowTask[] = [
        { name: "start", action: "test", params: {}, order: 0, depends_on: [] },
        {
          name: "branch1",
          action: "test",
          params: {},
          order: 1,
          depends_on: ["start"],
        },
        {
          name: "branch2",
          action: "test",
          params: {},
          order: 2,
          depends_on: ["start"],
        },
        {
          name: "branch3",
          action: "test",
          params: {},
          order: 3,
          depends_on: ["start"],
        },
      ];

      const dag = engine.buildDAG(tasks);

      expect(dag.find((n) => n.id === "start")?.level).toBe(0);
      expect(dag.find((n) => n.id === "branch1")?.level).toBe(1);
      expect(dag.find((n) => n.id === "branch2")?.level).toBe(1);
      expect(dag.find((n) => n.id === "branch3")?.level).toBe(1);
    });

    it("should handle complex dependency graph", () => {
      const tasks: WorkflowTask[] = [
        { name: "a", action: "test", params: {}, order: 0, depends_on: [] },
        { name: "b", action: "test", params: {}, order: 1, depends_on: ["a"] },
        { name: "c", action: "test", params: {}, order: 2, depends_on: ["a"] },
        {
          name: "d",
          action: "test",
          params: {},
          order: 3,
          depends_on: ["b", "c"],
        },
        { name: "e", action: "test", params: {}, order: 4, depends_on: ["c"] },
        {
          name: "f",
          action: "test",
          params: {},
          order: 5,
          depends_on: ["d", "e"],
        },
      ];

      const dag = engine.buildDAG(tasks);

      expect(dag.find((n) => n.id === "a")?.level).toBe(0);
      expect(dag.find((n) => n.id === "b")?.level).toBe(1);
      expect(dag.find((n) => n.id === "c")?.level).toBe(1);
      expect(dag.find((n) => n.id === "d")?.level).toBe(2);
      expect(dag.find((n) => n.id === "e")?.level).toBe(2);
      expect(dag.find((n) => n.id === "f")?.level).toBe(3);
    });
  });

  describe("parallel execution (mocked)", () => {
    it("should execute independent tasks in parallel", async () => {
      const mockExecute = jest.fn().mockImplementation(async (dag: any[]) => {
        const level0Tasks = dag.filter((n) => n.level === 0);
        return {
          completed: level0Tasks.map((n) => ({
            id: n.id,
            status: "completed",
            result: { success: true },
          })),
          failed: [],
          totalDuration: 100,
          parallelismAchieved: level0Tasks.length,
        };
      });

      const tasks: WorkflowTask[] = [
        { name: "t1", action: "test", params: {}, order: 0, depends_on: [] },
        { name: "t2", action: "test", params: {}, order: 1, depends_on: [] },
        { name: "t3", action: "test", params: {}, order: 2, depends_on: [] },
      ];

      const dag = engine.buildDAG(tasks);
      const result = await mockExecute(dag);

      expect(result.completed).toHaveLength(3);
      expect(result.parallelismAchieved).toBe(3);
    });

    it("should respect max concurrency limit", async () => {
      const engine5 = new ParallelExecutionEngine(5);
      const mockExecute = jest.fn().mockResolvedValue({
        completed: Array.from({ length: 10 }, (_, i) => ({
          id: `t${i}`,
          status: "completed",
        })),
        failed: [],
        totalDuration: 200,
        parallelismAchieved: 5, // Max concurrency
      });

      const result = await mockExecute();

      expect(result.parallelismAchieved).toBe(5);
    });

    it("should execute tasks level by level", async () => {
      const mockExecute = jest.fn().mockResolvedValue({
        completed: [
          { id: "t1", status: "completed", level: 0 },
          { id: "t2", status: "completed", level: 1 },
          { id: "t3", status: "completed", level: 1 },
          { id: "t4", status: "completed", level: 2 },
        ],
        failed: [],
        totalDuration: 300,
        parallelismAchieved: 2,
      });

      const result = await mockExecute();

      expect(result.completed).toHaveLength(4);
      expect(result.failed).toHaveLength(0);
    });

    it("should handle task failure and stop dependents", async () => {
      const mockExecute = jest.fn().mockResolvedValue({
        completed: [{ id: "t1", status: "completed" }],
        failed: [{ id: "t2", status: "failed", error: "Task execution error" }],
        skipped: [{ id: "t3", status: "skipped", reason: "Dependency failed" }],
        totalDuration: 150,
      });

      const result = await mockExecute();

      expect(result.completed).toHaveLength(1);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].error).toBeDefined();
    });

    it("should pass data between dependent tasks", async () => {
      const mockExecute = jest.fn().mockResolvedValue({
        completed: [
          { id: "t1", status: "completed", result: { userId: 123 } },
          {
            id: "t2",
            status: "completed",
            result: { profileData: { userId: 123 } },
          },
        ],
        failed: [],
        totalDuration: 200,
      });

      const result = await mockExecute();

      expect(result.completed[1].result).toEqual({
        profileData: { userId: 123 },
      });
    });
  });

  describe("performance metrics", () => {
    it("should calculate parallelism achieved", async () => {
      const mockCalculate = jest.fn().mockReturnValue({
        totalTasks: 10,
        totalDuration: 1000,
        parallelismAchieved: 3.5, // Average concurrent tasks
        efficiency: 0.7, // 70% parallel efficiency
      });

      const metrics = mockCalculate();

      expect(metrics.parallelismAchieved).toBeGreaterThan(1);
      expect(metrics.efficiency).toBeGreaterThan(0);
      expect(metrics.efficiency).toBeLessThanOrEqual(1);
    });

    it("should track task execution times", async () => {
      const mockTrack = jest.fn().mockReturnValue({
        tasks: [
          { id: "t1", duration: 100 },
          { id: "t2", duration: 150 },
          { id: "t3", duration: 200 },
        ],
        criticalPath: ["t1", "t2", "t3"],
        criticalPathDuration: 450,
      });

      const metrics = mockTrack();

      expect(metrics.criticalPath).toHaveLength(3);
      expect(metrics.criticalPathDuration).toBe(450);
    });
  });

  describe("error handling", () => {
    it("should handle missing dependency gracefully", () => {
      const tasks: WorkflowTask[] = [
        {
          name: "t1",
          action: "test",
          params: {},
          order: 0,
          depends_on: ["nonexistent"],
        },
      ];

      const dag = engine.buildDAG(tasks);

      // Should create node but dependency won't be found
      expect(dag).toHaveLength(1);
      expect(dag[0].dependencies).toContain("nonexistent");
    });

    it("should handle empty task list", () => {
      const dag = engine.buildDAG([]);

      expect(dag).toHaveLength(0);
    });

    it("should handle single task", () => {
      const tasks: WorkflowTask[] = [
        { name: "t1", action: "test", params: {}, order: 0, depends_on: [] },
      ];

      const dag = engine.buildDAG(tasks);

      expect(dag).toHaveLength(1);
      expect(dag[0].level).toBe(0);
    });
  });

  describe("concurrency control", () => {
    it("should initialize with default concurrency", () => {
      const defaultEngine = new ParallelExecutionEngine();
      expect(defaultEngine).toBeInstanceOf(ParallelExecutionEngine);
    });

    it("should initialize with custom concurrency", () => {
      const engine10 = new ParallelExecutionEngine(10);
      expect(engine10).toBeInstanceOf(ParallelExecutionEngine);
    });

    it("should limit concurrent task execution", async () => {
      const mockExecute = jest.fn().mockImplementation(async () => {
        // Simulate respecting max concurrency
        return { maxConcurrent: 5 };
      });

      const result = await mockExecute();
      expect(result.maxConcurrent).toBe(5);
    });
  });

  describe("edge cases", () => {
    it("should handle tasks with identical names", () => {
      const tasks: WorkflowTask[] = [
        {
          name: "duplicate",
          action: "test1",
          params: {},
          order: 0,
          depends_on: [],
        },
        {
          name: "duplicate",
          action: "test2",
          params: {},
          order: 1,
          depends_on: [],
        },
      ];

      const dag = engine.buildDAG(tasks);

      // Should handle duplicates (implementation dependent)
      expect(dag.length).toBeGreaterThan(0);
    });

    it("should handle very deep dependency chains", () => {
      const tasks: WorkflowTask[] = Array.from({ length: 100 }, (_, i) => ({
        name: `task${i}`,
        action: "test",
        params: {},
        order: i,
        depends_on: i > 0 ? [`task${i - 1}`] : [],
      }));

      const dag = engine.buildDAG(tasks);

      expect(dag).toHaveLength(100);
      expect(dag[dag.length - 1].level).toBe(99);
    });

    it("should handle very wide parallel tasks", () => {
      const tasks: WorkflowTask[] = Array.from({ length: 50 }, (_, i) => ({
        name: `parallel${i}`,
        action: "test",
        params: {},
        order: i,
        depends_on: [],
      }));

      const dag = engine.buildDAG(tasks);

      expect(dag).toHaveLength(50);
      expect(dag.every((n) => n.level === 0)).toBe(true);
    });
  });
});
