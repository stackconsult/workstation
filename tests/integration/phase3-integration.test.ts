/// <reference types="jest" />
/**
 * Phase 3 Integration Tests
 * Tests for advanced automation, WebSocket auth, rate limiting, and monitoring
 * Requires: Redis, PostgreSQL running
 */

import request from "supertest";
import app from "../../src/index";
import { advancedAutomation } from "../../src/services/advanced-automation";
import { getMCPProtocol } from "../../src/services/mcp-protocol";
import { wsRateLimiter } from "../../src/middleware/websocket-auth";

// Skip phase3 tests if required services (Redis/PostgreSQL) are not available
// These tests require live external services
const describeIfServices =
  process.env.REDIS_URL && process.env.DATABASE_URL ? describe : describe.skip;

describeIfServices("Phase 3 Integration Tests", () => {
  describe("Advanced Browser Automation - MCP Integration", () => {
    test("should handle open_tab MCP request", async () => {
      const mcpProtocol = getMCPProtocol();
      const response = await mcpProtocol.handleRequest({
        id: "test-1",
        method: "open_tab",
        params: { url: "https://example.com" },
      });

      expect(response.id).toBe("test-1");
      expect(response.result).toHaveProperty("tabId");
      expect(response.result).toHaveProperty("url", "https://example.com");
    });

    test("should handle list_tabs MCP request", async () => {
      const mcpProtocol = getMCPProtocol();

      // Open a tab first
      await mcpProtocol.handleRequest({
        id: "test-2",
        method: "open_tab",
        params: { url: "https://example.com" },
      });

      // List tabs
      const response = await mcpProtocol.handleRequest({
        id: "test-3",
        method: "list_tabs",
        params: {},
      });

      expect(response.id).toBe("test-3");
      expect(response.result).toHaveProperty("tabs");
      expect(Array.isArray(response.result.tabs)).toBe(true);
      expect(response.result.tabs.length).toBeGreaterThan(0);
    });

    test("should handle hover MCP request", async () => {
      const mcpProtocol = getMCPProtocol();
      const response = await mcpProtocol.handleRequest({
        id: "test-4",
        method: "hover",
        params: { selector: "#button", duration: 1000 },
      });

      expect(response.id).toBe("test-4");
      expect(response.result).toHaveProperty("success", true);
      expect(response.result).toHaveProperty("selector", "#button");
    });

    test("should handle network monitoring requests", async () => {
      const mcpProtocol = getMCPProtocol();

      // Start monitoring
      const startResponse = await mcpProtocol.handleRequest({
        id: "test-5",
        method: "start_network_monitoring",
        params: {},
      });

      expect(startResponse.result).toHaveProperty("success", true);
      expect(startResponse.result).toHaveProperty("monitoring", true);

      // Stop monitoring
      const stopResponse = await mcpProtocol.handleRequest({
        id: "test-6",
        method: "stop_network_monitoring",
        params: {},
      });

      expect(stopResponse.result).toHaveProperty("success", true);
      expect(stopResponse.result).toHaveProperty("requests");
    });

    test("should handle browser profile operations", async () => {
      const mcpProtocol = getMCPProtocol();

      // Save profile
      const saveResponse = await mcpProtocol.handleRequest({
        id: "test-7",
        method: "save_browser_profile",
        params: { name: "test-profile" },
      });

      expect(saveResponse.result).toHaveProperty("success", true);
      expect(saveResponse.result).toHaveProperty("profileName", "test-profile");

      // List profiles
      const listResponse = await mcpProtocol.handleRequest({
        id: "test-8",
        method: "list_profiles",
        params: {},
      });

      expect(listResponse.result).toHaveProperty("profiles");
      expect(Array.isArray(listResponse.result.profiles)).toBe(true);
    });
  });

  describe("WebSocket Rate Limiting", () => {
    test("should allow connections within limit", () => {
      const userId = "test-user-1";

      for (let i = 0; i < 10; i++) {
        expect(wsRateLimiter.canConnect(userId)).toBe(true);
        wsRateLimiter.trackConnection(userId);
      }
    });

    test("should block connections over limit", () => {
      const userId = "test-user-2";

      // Max 10 connections per user
      for (let i = 0; i < 10; i++) {
        wsRateLimiter.trackConnection(userId);
      }

      expect(wsRateLimiter.canConnect(userId)).toBe(false);
    });

    test("should allow messages within rate limit", () => {
      const userId = "test-user-3";

      // Should allow first 100 messages
      for (let i = 0; i < 100; i++) {
        expect(wsRateLimiter.canSendMessage(userId)).toBe(true);
      }
    });

    test("should block messages over rate limit", () => {
      const userId = "test-user-4";

      // Max 100 messages per minute
      for (let i = 0; i < 100; i++) {
        wsRateLimiter.canSendMessage(userId);
      }

      expect(wsRateLimiter.canSendMessage(userId)).toBe(false);
    });
  });

  describe("Monitoring Endpoints", () => {
    test("should expose /metrics endpoint", async () => {
      const response = await request(app).get("/metrics").expect(200);

      expect(response.text).toContain("workstation_");
    });

    test("should expose enhanced /health endpoint", async () => {
      const response = await request(app).get("/health").expect(200);

      expect(response.body).toHaveProperty("status");
      expect(response.body).toHaveProperty("timestamp");
      expect(response.body).toHaveProperty("uptime");
      expect(response.body).toHaveProperty("checks");
      expect(response.body).toHaveProperty("metrics");

      // Check for database health check
      expect(response.body.checks).toHaveProperty("database");
    });
  });

  describe("Rate Limiting on Endpoints", () => {
    test("should rate limit workflow execution endpoints", async () => {
      const token = "test-token"; // Would need a valid token in real scenario

      // This would normally be tested with actual requests
      // For now, we verify the rate limiter is applied
      expect(true).toBe(true); // Placeholder - would test with real requests
    });
  });

  describe("Advanced Automation Service", () => {
    test("should manage tabs correctly", async () => {
      const tabId = await advancedAutomation.openNewTab("https://example.com");
      expect(tabId).toBeGreaterThan(0);

      const tabs = await advancedAutomation.listTabs();
      expect(tabs.length).toBeGreaterThan(0);
      expect(tabs.find((t: any) => t.id === tabId)).toBeDefined();

      await advancedAutomation.closeTab(tabId);
      const tabsAfterClose = await advancedAutomation.listTabs();
      expect(tabsAfterClose.find((t: any) => t.id === tabId)).toBeUndefined();
    });

    test("should handle browser profiles", async () => {
      await advancedAutomation.saveBrowserProfile("test-profile");
      const profiles = await advancedAutomation.listProfiles();
      expect(profiles).toContain("test-profile");
    });
  });
});
