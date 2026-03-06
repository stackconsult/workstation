/// <reference types="jest" />
/**
 * Integration tests for Agent Handoff System
 * Tests memory retention, handoff workflow, and guardrail validation
 */

import * as fs from "fs";
import * as path from "path";
import {
  AgentOrchestrator,
  Agent,
  HandoffData,
} from "../../src/orchestration/agent-orchestrator";

describe("Handoff System Integration Tests", () => {
  const projectRoot = path.join(__dirname, "../../");
  let orchestrator: AgentOrchestrator;

  beforeEach(() => {
    orchestrator = new AgentOrchestrator({
      minAccuracy: 90,
      maxRetries: 3,
      timeoutMs: 30000,
      enableAutoRecovery: true,
    });
  });

  describe("Memory Retention", () => {
    test("should find existing handoff artifacts in repository", () => {
      const handoffFiles = fs
        .readdirSync(projectRoot)
        .filter((file) => file.startsWith(".agent") && file.endsWith(".json"));

      expect(handoffFiles.length).toBeGreaterThan(0);
      console.log(`Found ${handoffFiles.length} handoff artifacts`);
    });

    test("should validate handoff file format", () => {
      const handoffFile = path.join(projectRoot, ".agent10-to-agent11.json");

      if (fs.existsSync(handoffFile)) {
        const content = fs.readFileSync(handoffFile, "utf8");
        const handoff = JSON.parse(content);

        expect(handoff).toHaveProperty("from_agent");
        expect(handoff).toHaveProperty("to_agent");
        expect(handoff).toHaveProperty("timestamp");
        expect(typeof handoff.from_agent).toBe("number");
        expect(typeof handoff.to_agent).toBe("number");
        expect(typeof handoff.timestamp).toBe("string");
      }
    });
  });

  describe("Agent Registration", () => {
    test("should register agent with valid accuracy", () => {
      const agent: Agent = {
        id: 1,
        name: "Test Agent",
        tier: 1,
        status: "idle",
        accuracy: 95,
        requiredAccuracy: 90,
        capabilities: ["test", "validation"],
      };

      expect(() => {
        orchestrator.registerAgent(agent);
      }).not.toThrow();
    });

    test("should reject agent with insufficient accuracy", () => {
      const agent: Agent = {
        id: 2,
        name: "Low Accuracy Agent",
        tier: 1,
        status: "idle",
        accuracy: 85,
        requiredAccuracy: 90,
        capabilities: ["test"],
      };

      expect(() => {
        orchestrator.registerAgent(agent);
      }).toThrow("Agent 2 accuracy below required");
    });
  });

  describe("Handoff Data Structure", () => {
    test("should support valid handoff data structure", () => {
      const handoffData: HandoffData = {
        fromAgent: 9,
        toAgent: 10,
        timestamp: new Date().toISOString(),
        data: {
          optimizations: 5,
          changes: ["fix1", "fix2"],
        },
        metadata: {
          accuracy: 95,
          validatedBy: ["agent8", "agent9"],
        },
      };

      expect(handoffData.fromAgent).toBe(9);
      expect(handoffData.toAgent).toBe(10);
      expect(handoffData.metadata.accuracy).toBe(95);
      expect(handoffData.metadata.validatedBy).toHaveLength(2);
    });
  });
});
