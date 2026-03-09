/// <reference types="jest" />
/**
 * Integration Test for Complete Workstation Platform
 * Tests JWT Auth + Agent Server + MCP integration
 */

import { describe, test, expect } from "@jest/globals";
import path from "path";
import fs from "fs";

describe("Workstation Integration Tests", () => {
  describe("File Structure", () => {
    test("should have agent-server directory", () => {
      const agentServerPath = path.join(process.cwd(), "agent-server");
      expect(fs.existsSync(agentServerPath)).toBe(true);
    });

    test("should have agent-server nodejs implementation", () => {
      const nodejsPath = path.join(process.cwd(), "agent-server", "nodejs");
      expect(fs.existsSync(nodejsPath)).toBe(true);
    });

    test("should have agent-server package.json", () => {
      const packagePath = path.join(
        process.cwd(),
        "agent-server",
        "nodejs",
        "package.json",
      );
      expect(fs.existsSync(packagePath)).toBe(true);
    });

    test("should have agent-server start.js", () => {
      const startPath = path.join(
        process.cwd(),
        "agent-server",
        "nodejs",
        "start.js",
      );
      expect(fs.existsSync(startPath)).toBe(true);
    });
  });

  describe("Docker Configuration", () => {
    test("should have integrated Dockerfile", () => {
      const dockerfilePath = path.join(process.cwd(), "Dockerfile.integrated");
      expect(fs.existsSync(dockerfilePath)).toBe(true);
    });

    test("should have integrated Docker Compose file", () => {
      const composePath = path.join(
        process.cwd(),
        "docker-compose.integrated.yml",
      );
      expect(fs.existsSync(composePath)).toBe(true);
    });

    test("should have start-services script", () => {
      const scriptPath = path.join(
        process.cwd(),
        "docker",
        "start-services.sh",
      );
      expect(fs.existsSync(scriptPath)).toBe(true);
    });

    test("start-services script should exist and have bash shebang", () => {
      const scriptPath = path.join(
        process.cwd(),
        "docker",
        "start-services.sh",
      );
      expect(fs.existsSync(scriptPath)).toBe(true);

      const content = fs.readFileSync(scriptPath, "utf-8");
      expect(content).toContain("#!/bin/bash");
      // Note: Script will be made executable during Docker build via chmod
    });
  });

  describe("MCP Configuration", () => {
    test("should have MCP config file", () => {
      const mcpConfigPath = path.join(process.cwd(), "mcp-config.yml");
      expect(fs.existsSync(mcpConfigPath)).toBe(true);
    });

    test("MCP config should contain required sections", () => {
      const mcpConfigPath = path.join(process.cwd(), "mcp-config.yml");
      const content = fs.readFileSync(mcpConfigPath, "utf-8");

      expect(content).toContain("mcp:");
      expect(content).toContain("cdp:");
      expect(content).toContain("recovery:");
      expect(content).toContain("peelback:");
      expect(content).toContain("rollback:");
    });
  });

  describe("Documentation", () => {
    test("should have integrated deployment guide", () => {
      const deployPath = path.join(
        process.cwd(),
        "docs/guides/DEPLOYMENT_INTEGRATED.md",
      );
      expect(fs.existsSync(deployPath)).toBe(true);
    });

    test("should have integrated quickstart guide", () => {
      const quickstartPath = path.join(
        process.cwd(),
        "docs/guides/QUICKSTART_INTEGRATED.md",
      );
      expect(fs.existsSync(quickstartPath)).toBe(true);
    });

    test("should have quick-start script", () => {
      const scriptPath = path.join(process.cwd(), "quick-start.sh");
      expect(fs.existsSync(scriptPath)).toBe(true);
    });

    test("quick-start script should be executable", () => {
      const scriptPath = path.join(process.cwd(), "quick-start.sh");
      const stats = fs.statSync(scriptPath);
      const isExecutable = (stats.mode & parseInt("111", 8)) !== 0;
      expect(isExecutable).toBe(true);
    });

    test("deployment guide should contain architecture diagram", () => {
      const deployPath = path.join(
        process.cwd(),
        "docs/guides/DEPLOYMENT_INTEGRATED.md",
      );
      const content = fs.readFileSync(deployPath, "utf-8");
      expect(content).toContain("Architecture Overview");
    });

    test("deployment guide should contain rollback procedures", () => {
      const deployPath = path.join(
        process.cwd(),
        "docs/guides/DEPLOYMENT_INTEGRATED.md",
      );
      const content = fs.readFileSync(deployPath, "utf-8");
      expect(content).toContain("Rollback & Recovery");
    });
  });

  describe("Docker Image Configuration", () => {
    test("Dockerfile should have multi-stage build", () => {
      const dockerfilePath = path.join(process.cwd(), "Dockerfile.integrated");
      const content = fs.readFileSync(dockerfilePath, "utf-8");

      // Should have builder stage
      expect(content).toContain("AS builder");
      // Should have agent-server-builder stage
      expect(content).toContain("AS agent-server-builder");
      // Should copy from both stages
      expect(content).toContain("COPY --from=builder");
      expect(content).toContain("COPY --from=agent-server-builder");
    });

    test("Dockerfile should expose all required ports", () => {
      const dockerfilePath = path.join(process.cwd(), "Dockerfile.integrated");
      const content = fs.readFileSync(dockerfilePath, "utf-8");

      // Ports can be on one line or multiple lines
      expect(content).toMatch(/EXPOSE.*3000/); // JWT Auth
      expect(content).toMatch(/EXPOSE.*8080/); // Agent HTTP
      expect(content).toMatch(/EXPOSE.*8082/); // Agent WS
    });

    test("Dockerfile should set environment variables", () => {
      const dockerfilePath = path.join(process.cwd(), "Dockerfile.integrated");
      const content = fs.readFileSync(dockerfilePath, "utf-8");

      expect(content).toContain("ENV PORT=3000");
      expect(content).toContain("ENV AGENT_SERVER_WS_PORT=8082");
      expect(content).toContain("ENV AGENT_SERVER_HTTP_PORT=8080");
    });

    test("Dockerfile should include healthcheck", () => {
      const dockerfilePath = path.join(process.cwd(), "Dockerfile.integrated");
      const content = fs.readFileSync(dockerfilePath, "utf-8");

      expect(content).toContain("HEALTHCHECK");
    });
  });

  describe("Docker Compose Configuration", () => {
    test("Docker Compose should define workstation service", () => {
      const composePath = path.join(
        process.cwd(),
        "docker-compose.integrated.yml",
      );
      const content = fs.readFileSync(composePath, "utf-8");

      expect(content).toContain("workstation:");
      expect(content).toContain("build:");
      expect(content).toContain("Dockerfile.integrated");
    });

    test("Docker Compose should expose all ports", () => {
      const composePath = path.join(
        process.cwd(),
        "docker-compose.integrated.yml",
      );
      const content = fs.readFileSync(composePath, "utf-8");

      expect(content).toContain('"3000:3000"');
      expect(content).toContain('"8080:8080"');
      expect(content).toContain('"8082:8082"');
    });

    test("Docker Compose should define environment variables", () => {
      const composePath = path.join(
        process.cwd(),
        "docker-compose.integrated.yml",
      );
      const content = fs.readFileSync(composePath, "utf-8");

      expect(content).toContain("NODE_ENV");
      expect(content).toContain("JWT_SECRET");
      expect(content).toContain("AGENT_SERVER_WS_PORT");
      expect(content).toContain("CDP_HOST");
    });

    test("Docker Compose should define volumes", () => {
      const composePath = path.join(
        process.cwd(),
        "docker-compose.integrated.yml",
      );
      const content = fs.readFileSync(composePath, "utf-8");

      expect(content).toContain("volumes:");
      expect(content).toContain("workstation-data");
      expect(content).toContain("workstation-logs");
    });
  });

  describe("Agent Server Package", () => {
    test("agent-server should have required dependencies", () => {
      const packagePath = path.join(
        process.cwd(),
        "agent-server",
        "nodejs",
        "package.json",
      );
      const content = fs.readFileSync(packagePath, "utf-8");
      const pkg = JSON.parse(content);

      expect(pkg.dependencies).toBeDefined();
      expect(pkg.dependencies.ws).toBeDefined();
      expect(pkg.dependencies.winston).toBeDefined();
      expect(pkg.dependencies.dotenv).toBeDefined();
      expect(pkg.dependencies["js-yaml"]).toBeDefined();
      expect(pkg.dependencies.uuid).toBeDefined();
    });

    test("agent-server should have start script", () => {
      const packagePath = path.join(
        process.cwd(),
        "agent-server",
        "nodejs",
        "package.json",
      );
      const content = fs.readFileSync(packagePath, "utf-8");
      const pkg = JSON.parse(content);

      expect(pkg.scripts).toBeDefined();
      expect(pkg.scripts.start).toBeDefined();
    });
  });

  describe("Integration Points", () => {
    test("start-services script should start all services", () => {
      const scriptPath = path.join(
        process.cwd(),
        "docker",
        "start-services.sh",
      );
      const content = fs.readFileSync(scriptPath, "utf-8");

      // Should start JWT Auth
      expect(content).toContain("node dist/index.js");
      // Should start Agent Server
      expect(content).toContain("node start.js");
      // Should have health checks
      expect(content).toContain("health");
    });

    test("gitignore should exclude agent-server artifacts", () => {
      const gitignorePath = path.join(process.cwd(), ".gitignore");
      const content = fs.readFileSync(gitignorePath, "utf-8");

      expect(content).toContain("agent-server/nodejs/node_modules");
    });
  });

  describe("Configuration Validation", () => {
    test("MCP config should have recovery settings", () => {
      const mcpConfigPath = path.join(process.cwd(), "mcp-config.yml");
      const content = fs.readFileSync(mcpConfigPath, "utf-8");

      expect(content).toContain("recovery:");
      expect(content).toContain("enabled: true");
      expect(content).toContain("peelback:");
      expect(content).toContain("snapshots:");
      expect(content).toContain("rollback:");
    });

    test("MCP config should have CDP settings", () => {
      const mcpConfigPath = path.join(process.cwd(), "mcp-config.yml");
      const content = fs.readFileSync(mcpConfigPath, "utf-8");

      expect(content).toContain("cdp:");
      expect(content).toContain("host:");
      expect(content).toContain("port: 9222");
    });
  });
});
