/// <reference types="jest" />
/**
 * Phase 1 Integration Tests
 * Tests for workflow creation, execution, and browser automation
 */

import request from "supertest";
import app from "../src/index";
import {
  initializeDatabase,
  closeDatabase,
} from "../src/automation/db/database";
import { generateDemoToken } from "../src/auth/jwt";

describe("Phase 1: Workflow Integration Tests", () => {
  let token: string;
  let workflowId: string;

  beforeAll(async () => {
    // Initialize test database
    await initializeDatabase(":memory:");

    // Get auth token
    token = generateDemoToken();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe("Workflow Management", () => {
    it("should create a workflow", async () => {
      const response = await request(app)
        .post("/api/v2/workflows")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Test Workflow",
          description: "A test workflow for integration testing",
          definition: {
            tasks: [
              {
                name: "test_task",
                agent_type: "browser",
                action: "navigate",
                parameters: {
                  url: "https://example.com",
                },
              },
            ],
          },
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("id");
      expect(response.body.data.name).toBe("Test Workflow");
      expect(response.body.data.status).toBe("active");

      workflowId = response.body.data.id;
    });

    it("should list workflows", async () => {
      const response = await request(app)
        .get("/api/v2/workflows")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it("should get a workflow by ID", async () => {
      const response = await request(app)
        .get(`/api/v2/workflows/${workflowId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(workflowId);
      expect(response.body.data.name).toBe("Test Workflow");
    });

    it("should require authentication for workflow endpoints", async () => {
      const response = await request(app).get("/api/v2/workflows").send();

      expect(response.status).toBe(401);
    });

    it("should return 404 for non-existent workflow", async () => {
      const response = await request(app)
        .get("/api/v2/workflows/non-existent-id")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe("Workflow Execution", () => {
    it("should accept workflow execution request", async () => {
      const response = await request(app)
        .post(`/api/v2/workflows/${workflowId}/execute`)
        .set("Authorization", `Bearer ${token}`)
        .send({});

      expect(response.status).toBe(202);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("id");
      expect(response.body.data.status).toBe("pending");
      expect(response.body.data.workflow_id).toBe(workflowId);

      // Note: We don't wait for completion in tests as it would launch real browsers
    });

    it("should fail to execute non-existent workflow", async () => {
      const response = await request(app)
        .post("/api/v2/workflows/non-existent-id/execute")
        .set("Authorization", `Bearer ${token}`)
        .send({});

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe("Execution Tracking", () => {
    it("should get execution status", async () => {
      // First create and execute a workflow
      const createResponse = await request(app)
        .post("/api/v2/workflows")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Trackable Workflow",
          definition: {
            tasks: [
              {
                name: "simple_task",
                agent_type: "browser",
                action: "navigate",
                parameters: { url: "https://example.com" },
              },
            ],
          },
        });

      const workflowId = createResponse.body.data.id;

      const execResponse = await request(app)
        .post(`/api/v2/workflows/${workflowId}/execute`)
        .set("Authorization", `Bearer ${token}`)
        .send({});

      const executionId = execResponse.body.data.id;

      // Now check status
      const statusResponse = await request(app)
        .get(`/api/v2/executions/${executionId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(statusResponse.status).toBe(200);
      expect(statusResponse.body.success).toBe(true);
      expect(statusResponse.body.data.id).toBe(executionId);
      expect(["pending", "running", "completed", "failed"]).toContain(
        statusResponse.body.data.status,
      );
    });

    it("should return 404 for non-existent execution", async () => {
      const response = await request(app)
        .get("/api/v2/executions/non-existent-id")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe("Complex Workflow", () => {
    it("should handle multi-step workflow", async () => {
      const response = await request(app)
        .post("/api/v2/workflows")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Multi-Step Workflow",
          description: "Tests multiple browser actions",
          definition: {
            tasks: [
              {
                name: "navigate",
                agent_type: "browser",
                action: "navigate",
                parameters: {
                  url: "https://example.com",
                },
              },
              {
                name: "get_content",
                agent_type: "browser",
                action: "getContent",
                parameters: {},
              },
            ],
            on_error: "stop",
          },
          timeout_seconds: 60,
          max_retries: 2,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.definition.tasks).toHaveLength(2);
      expect(response.body.data.timeout_seconds).toBe(60);
      expect(response.body.data.max_retries).toBe(2);
    });
  });
});
