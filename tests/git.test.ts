/// <reference types="jest" />
import request from "supertest";
import app from "../src/index";
import { generateDemoToken } from "../src/auth/jwt";

// Skip git tests if GITHUB_TOKEN is not configured
// These tests require live GitHub API integration
const describeIfGitHub = process.env.GITHUB_TOKEN ? describe : describe.skip;

describeIfGitHub("Git Operations API", () => {
  let token: string;

  beforeAll(() => {
    token = generateDemoToken();
  });

  describe("GET /api/v2/git/status", () => {
    it("should require authentication", async () => {
      const response = await request(app).get("/api/v2/git/status");

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("error");
    });

    it("should return git status with valid token", async () => {
      const response = await request(app)
        .get("/api/v2/git/status")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body.data).toHaveProperty("current");
      expect(response.body.data).toHaveProperty("ahead");
      expect(response.body.data).toHaveProperty("behind");
      expect(response.body.data).toHaveProperty("files");
      expect(response.body.data).toHaveProperty("isClean");
    });
  });

  describe("GET /api/v2/git/branches", () => {
    it("should require authentication", async () => {
      const response = await request(app).get("/api/v2/git/branches");

      expect(response.status).toBe(401);
    });

    it("should return list of branches with valid token", async () => {
      const response = await request(app)
        .get("/api/v2/git/branches")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("success", true);
      expect(Array.isArray(response.body.data)).toBe(true);

      if (response.body.data.length > 0) {
        const branch = response.body.data[0];
        expect(branch).toHaveProperty("name");
        expect(branch).toHaveProperty("current");
        expect(branch).toHaveProperty("commit");
      }
    });
  });

  describe("POST /api/v2/git/push", () => {
    it("should require authentication", async () => {
      const response = await request(app)
        .post("/api/v2/git/push")
        .send({ force: false });

      expect(response.status).toBe(401);
    });

    it("should validate request body", async () => {
      const response = await request(app)
        .post("/api/v2/git/push")
        .set("Authorization", `Bearer ${token}`)
        .send({ force: "invalid" });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error", "Validation error");
    });

    it("should accept valid push request format", async () => {
      const response = await request(app)
        .post("/api/v2/git/push")
        .set("Authorization", `Bearer ${token}`)
        .send({ force: false });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("success", true);
    });
  });

  describe("POST /api/v2/git/commit", () => {
    it("should require authentication", async () => {
      const response = await request(app)
        .post("/api/v2/git/commit")
        .send({ message: "Test commit" });

      expect(response.status).toBe(401);
    });

    it("should validate commit message is required", async () => {
      const response = await request(app)
        .post("/api/v2/git/commit")
        .set("Authorization", `Bearer ${token}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error", "Validation error");
    });

    it("should validate commit message length", async () => {
      const response = await request(app)
        .post("/api/v2/git/commit")
        .set("Authorization", `Bearer ${token}`)
        .send({ message: "a".repeat(501) });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error", "Validation error");
    });

    it("should accept valid commit request format", async () => {
      const response = await request(app)
        .post("/api/v2/git/commit")
        .set("Authorization", `Bearer ${token}`)
        .send({
          message: "Test commit message",
          files: ["test.txt"],
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("success", true);
    });
  });

  describe("GET /api/v2/git/prs", () => {
    it("should require authentication", async () => {
      const response = await request(app).get("/api/v2/git/prs");

      expect(response.status).toBe(401);
    });

    it("should validate state parameter", async () => {
      const response = await request(app)
        .get("/api/v2/git/prs?state=invalid")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error", "Validation error");
    });

    it("should accept valid state parameters with GitHub token", async () => {
      // Set GITHUB_TOKEN temporarily for this test
      const originalToken = process.env.GITHUB_TOKEN;
      process.env.GITHUB_TOKEN = "test-token";

      const response = await request(app)
        .get("/api/v2/git/prs?state=open")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("success", true);

      // Restore original token
      process.env.GITHUB_TOKEN = originalToken;
    });

    it("should return error when GitHub token is not configured", async () => {
      // Ensure GITHUB_TOKEN is not set
      const originalToken = process.env.GITHUB_TOKEN;
      delete process.env.GITHUB_TOKEN;

      const response = await request(app)
        .get("/api/v2/git/prs?state=open")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        "error",
        "GitHub token not configured",
      );

      // Restore original token
      process.env.GITHUB_TOKEN = originalToken;
    });
  });

  describe("POST /api/v2/git/pr", () => {
    it("should require authentication", async () => {
      const response = await request(app).post("/api/v2/git/pr").send({
        title: "Test PR",
        head: "feature",
        base: "main",
      });

      expect(response.status).toBe(401);
    });

    it("should validate required fields", async () => {
      const response = await request(app)
        .post("/api/v2/git/pr")
        .set("Authorization", `Bearer ${token}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error", "Validation error");
    });

    it("should validate title length", async () => {
      const response = await request(app)
        .post("/api/v2/git/pr")
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "a".repeat(201),
          head: "feature",
          base: "main",
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error", "Validation error");
    });

    it("should accept valid PR request format with GitHub token", async () => {
      // Set GITHUB_TOKEN temporarily for this test
      const originalToken = process.env.GITHUB_TOKEN;
      process.env.GITHUB_TOKEN = "test-token";

      const response = await request(app)
        .post("/api/v2/git/pr")
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "Test PR",
          head: "feature-branch",
          base: "main",
          body: "PR description",
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("success", true);

      // Restore original token
      process.env.GITHUB_TOKEN = originalToken;
    });
  });

  describe("POST /api/v2/git/sync", () => {
    it("should require authentication", async () => {
      const response = await request(app).post("/api/v2/git/sync");

      expect(response.status).toBe(401);
    });

    it("should accept sync request with valid token", async () => {
      const response = await request(app)
        .post("/api/v2/git/sync")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("data");
    });
  });
});
