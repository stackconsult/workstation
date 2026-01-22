/**
 * Live Integration Tests
 * These tests run against real services with proper error handling
 * for optional dependencies like Redis
 */

import request from "supertest";
import app from "../src/index";
import { generateDemoToken } from "../src/auth/jwt";
import { isServiceAvailable, TEST_CONFIG } from "./test-config";

describe("Live Integration Tests", () => {
  let redisAvailable: boolean;

  beforeAll(async () => {
    // Check if Redis is available
    redisAvailable = await isServiceAvailable("redis");

    if (redisAvailable) {
      console.log("✅ Redis available - running full integration tests");
    } else {
      console.log(
        "⚠️  Redis not available - some features will use in-memory fallback",
      );
    }
  });

  describe("GET /health", () => {
    it("should return health status with live data", async () => {
      const response = await request(app).get("/health");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("status");
      expect(response.body.status).toBe("healthy");
      expect(response.body).toHaveProperty("timestamp");
      expect(response.body).toHaveProperty("uptime");
      expect(response.body.uptime).toBeGreaterThan(0);
      expect(response.body).toHaveProperty("metrics");
      // version is optional
    });

    it("should return real memory metrics", async () => {
      const response = await request(app).get("/health");

      // Memory metrics are nested under metrics.memory
      expect(response.body.metrics).toHaveProperty("memory");
      const memory = response.body.metrics.memory;

      // Verify these are real values, not mocks
      expect(memory).toHaveProperty("heapUsed");
      expect(memory).toHaveProperty("heapTotal");
      expect(memory).toHaveProperty("rss");

      // Real memory values should be non-zero and reasonable
      expect(typeof memory.heapUsed).toBe("string");
      expect(typeof memory.heapTotal).toBe("string");
      expect(typeof memory.rss).toBe("string");

      // Parse and verify they're actual memory values (in MB)
      const heapUsed = parseFloat(memory.heapUsed);
      const heapTotal = parseFloat(memory.heapTotal);
      const rss = parseFloat(memory.rss);

      expect(heapUsed).toBeGreaterThan(0);
      expect(heapTotal).toBeGreaterThan(heapUsed);
      expect(rss).toBeGreaterThan(0);
    });

    it("should include database check status", async () => {
      const response = await request(app).get("/health");

      expect(response.body).toHaveProperty("checks");
      expect(response.body.checks).toHaveProperty("database");
      expect(response.body.checks.database).toHaveProperty("status");
      expect(response.body.checks.database.status).toBe("up");
    });

    it("should handle Redis status appropriately", async () => {
      const response = await request(app).get("/health");

      if (redisAvailable) {
        // If Redis is available, it should be reported
        expect(response.body.checks).toHaveProperty("redis");
        expect(response.body.checks.redis.status).toBe("up");
      } else {
        // If Redis is not available, the app should still be healthy
        expect(response.body.status).toBe("healthy");
      }
    });
  });

  describe("GET /auth/demo-token", () => {
    it("should generate a real JWT token", async () => {
      const response = await request(app).get("/auth/demo-token");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("token");
      expect(response.body).toHaveProperty("message");

      const token = response.body.token;
      expect(typeof token).toBe("string");
      expect(token.split(".")).toHaveLength(3); // JWT has 3 parts

      // Verify it's not a mock by decoding it
      const parts = token.split(".");
      const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());
      expect(payload).toHaveProperty("userId");
      expect(payload).toHaveProperty("role");
      expect(payload).toHaveProperty("iat");
      expect(payload).toHaveProperty("exp");
    });
  });

  describe("POST /auth/token", () => {
    it("should generate real token with valid payload", async () => {
      const response = await request(app)
        .post("/auth/token")
        .send({ userId: "test-user", role: "admin" });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("token");

      const token = response.body.token;
      expect(typeof token).toBe("string");

      // Decode and verify the payload
      const parts = token.split(".");
      const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());
      expect(payload.userId).toBe("test-user");
      expect(payload.role).toBe("admin");
    });

    it("should actually fail without userId", async () => {
      const response = await request(app)
        .post("/auth/token")
        .send({ role: "admin" });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
      // Error message may vary, just check it exists
      expect(response.body.error).toBeTruthy();
    });

    it("should use real default role when not provided", async () => {
      const response = await request(app)
        .post("/auth/token")
        .send({ userId: "test-user" });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("token");

      const token = response.body.token;
      const parts = token.split(".");
      const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());
      expect(payload).toHaveProperty("role");
      expect(payload.role).toBe("user"); // Default role
    });

    it("should actually reject invalid role", async () => {
      const response = await request(app)
        .post("/auth/token")
        .send({ userId: "test-user", role: "invalid-role" });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
      // Error message may vary, just check it exists
      expect(response.body.error).toBeTruthy();
    });
  });

  describe("GET /api/protected", () => {
    it("should access protected route with real valid token", async () => {
      const token = generateDemoToken();
      const response = await request(app)
        .get("/api/protected")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("user");
      expect(response.body.user).toHaveProperty("userId");
      expect(response.body.user).toHaveProperty("role");
    });

    it("should actually reject requests without token", async () => {
      const response = await request(app).get("/api/protected");

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toMatch(/token/i);
    });

    it("should actually reject invalid tokens", async () => {
      const response = await request(app)
        .get("/api/protected")
        .set("Authorization", "Bearer invalid-token");

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty("error");
    });
  });

  describe("Message Broker Integration", () => {
    it("should work with Redis when available or fallback to in-memory", async () => {
      // This test verifies the system adapts to Redis availability
      const { getMessageBroker } = require("../src/services/message-broker");
      const broker = getMessageBroker();

      const status = broker.getStatus();

      if (redisAvailable) {
        expect(status.redisEnabled).toBe(true);
        expect(status.connected).toBe(true);
      } else {
        // Should work in in-memory mode
        expect(status.connected).toBe(true);
      }
    });
  });
});
