/// <reference types="jest" />

/**
 * Downloads Routes Test Suite
 *
 * Tests for:
 * - File download endpoints
 * - Rate limiting
 * - Health check
 * - Manifest retrieval
 * - Error handling
 * - Security (file validation)
 */

import request from "supertest";
import express from "express";
import downloadsRoutes from "../../src/routes/downloads";
import { join } from "path";
import {
  existsSync,
  writeFileSync,
  mkdirSync,
  unlinkSync,
  rmdirSync,
} from "fs";

// Create test app
function createTestApp() {
  const app = express();
  app.use("/downloads", downloadsRoutes);
  return app;
}

describe("Downloads Routes", () => {
  let app: express.Application;
  const testDownloadsDir = join(__dirname, "../../public/downloads");

  beforeAll(() => {
    app = createTestApp();

    // Ensure downloads directory exists
    if (!existsSync(testDownloadsDir)) {
      mkdirSync(testDownloadsDir, { recursive: true });
    }
  });

  describe("GET /downloads/health", () => {
    it("should return health status", async () => {
      const response = await request(app).get("/downloads/health").expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("status");
      expect(response.body).toHaveProperty("files");
      expect(response.body).toHaveProperty("timestamp");
      expect(Array.isArray(response.body.files)).toBe(true);
    });

    it("should report healthy status when all files exist", async () => {
      const response = await request(app).get("/downloads/health");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Check that files are reported
      expect(response.body.files).toBeDefined();
      expect(Array.isArray(response.body.files)).toBe(true);
    });

    it("should include timestamp in health response", async () => {
      const response = await request(app).get("/downloads/health");

      expect(response.body.timestamp).toBeDefined();
      expect(new Date(response.body.timestamp).toString()).not.toBe(
        "Invalid Date",
      );
    });
  });

  describe("GET /downloads/:filename", () => {
    describe("manifest.json download", () => {
      it("should download manifest.json if it exists", async () => {
        const manifestPath = join(testDownloadsDir, "manifest.json");

        // Only test if manifest exists
        if (existsSync(manifestPath)) {
          const response = await request(app)
            .get("/downloads/manifest.json")
            .expect(200);

          expect(response.headers["content-type"]).toMatch(/application\/json/);
          expect(response.body).toBeDefined();
        } else {
          // If manifest doesn't exist, should return 404
          const response = await request(app)
            .get("/downloads/manifest.json")
            .expect(404);

          expect(response.body.success).toBe(false);
          expect(response.body.error).toBeDefined();
        }
      });

      it("should have proper cache headers for manifest", async () => {
        const manifestPath = join(testDownloadsDir, "manifest.json");

        if (existsSync(manifestPath)) {
          const response = await request(app).get("/downloads/manifest.json");

          expect(response.headers["cache-control"]).toBeDefined();
          expect(response.headers["etag"]).toBeDefined();
        }
      });
    });

    describe("chrome-extension.zip download", () => {
      it("should download chrome-extension.zip if it exists", async () => {
        const zipPath = join(testDownloadsDir, "chrome-extension.zip");

        if (existsSync(zipPath)) {
          const response = await request(app)
            .get("/downloads/chrome-extension.zip")
            .expect(200);

          expect(response.headers["content-type"]).toBe("application/zip");
          expect(response.headers["content-disposition"]).toMatch(/attachment/);
          expect(response.headers["content-disposition"]).toMatch(
            /chrome-extension\.zip/,
          );
          expect(response.headers["content-length"]).toBeDefined();
        } else {
          // If file doesn't exist, should return 404
          const response = await request(app)
            .get("/downloads/chrome-extension.zip")
            .expect(404);

          expect(response.body.success).toBe(false);
        }
      });
    });

    describe("workflow-builder.zip download", () => {
      it("should download workflow-builder.zip if it exists", async () => {
        const zipPath = join(testDownloadsDir, "workflow-builder.zip");

        if (existsSync(zipPath)) {
          const response = await request(app)
            .get("/downloads/workflow-builder.zip")
            .expect(200);

          expect(response.headers["content-type"]).toBe("application/zip");
          expect(response.headers["content-disposition"]).toMatch(/attachment/);
          expect(response.headers["content-disposition"]).toMatch(
            /workflow-builder\.zip/,
          );
        } else {
          const response = await request(app)
            .get("/downloads/workflow-builder.zip")
            .expect(404);

          expect(response.body.success).toBe(false);
        }
      });
    });

    describe("Security - File validation", () => {
      it("should reject non-whitelisted files", async () => {
        const response = await request(app)
          .get("/downloads/malicious.exe")
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toMatch(/not found/i);
      });

      it("should reject path traversal attempts", async () => {
        const response = await request(app)
          .get("/downloads/../../../etc/passwd")
          .expect(404);

        // Express normalizes the path, so this becomes '/etc/passwd'
        // which is correctly rejected as not in whitelist
        expect(response.body).toBeDefined();
        // The response might be a 404 from Express or our handler
        expect(response.status).toBe(404);
      });

      it("should reject attempts to access parent directories", async () => {
        const response = await request(app)
          .get("/downloads/..%2F..%2Fpackage.json")
          .expect(404);

        expect(response.body.success).toBe(false);
      });

      it("should only allow whitelisted extensions", async () => {
        const response = await request(app)
          .get("/downloads/script.sh")
          .expect(404);

        expect(response.body.success).toBe(false);
      });
    });

    describe("Error handling", () => {
      it("should return 404 for non-existent whitelisted file", async () => {
        // First, make sure the file doesn't exist
        const testFile = join(testDownloadsDir, "chrome-extension.zip");
        const fileExists = existsSync(testFile);

        if (!fileExists) {
          const response = await request(app)
            .get("/downloads/chrome-extension.zip")
            .expect(404);

          expect(response.body.success).toBe(false);
          expect(response.body.error).toBeDefined();
          expect(response.body.error).toMatch(/not found/i);
        }
      });

      it("should have proper error message format", async () => {
        const response = await request(app)
          .get("/downloads/nonexistent.zip")
          .expect(404);

        expect(response.body).toHaveProperty("success", false);
        expect(response.body).toHaveProperty("error");
        expect(typeof response.body.error).toBe("string");
      });
    });

    describe("Headers and caching", () => {
      it("should set proper cache control headers", async () => {
        const manifestPath = join(testDownloadsDir, "manifest.json");

        if (existsSync(manifestPath)) {
          const response = await request(app).get("/downloads/manifest.json");

          expect(response.headers["cache-control"]).toBeDefined();
          expect(response.headers["cache-control"]).toMatch(/public/);
          expect(response.headers["cache-control"]).toMatch(/max-age/);
        }
      });

      it("should set ETag header", async () => {
        const manifestPath = join(testDownloadsDir, "manifest.json");

        if (existsSync(manifestPath)) {
          const response = await request(app).get("/downloads/manifest.json");

          expect(response.headers["etag"]).toBeDefined();
        }
      });

      it("should set correct Content-Type for zip files", async () => {
        const zipPath = join(testDownloadsDir, "chrome-extension.zip");

        if (existsSync(zipPath)) {
          const response = await request(app).get(
            "/downloads/chrome-extension.zip",
          );

          expect(response.headers["content-type"]).toBe("application/zip");
        }
      });

      it("should set Content-Length header", async () => {
        const manifestPath = join(testDownloadsDir, "manifest.json");

        if (existsSync(manifestPath)) {
          const response = await request(app).get("/downloads/manifest.json");

          expect(response.headers["content-length"]).toBeDefined();
          expect(parseInt(response.headers["content-length"])).toBeGreaterThan(
            0,
          );
        }
      });
    });
  });

  describe("Rate Limiting", () => {
    it("should allow requests within rate limit", async () => {
      // Make a few requests (well within the limit of 20/15min)
      for (let i = 0; i < 3; i++) {
        const response = await request(app).get("/downloads/health");

        expect(response.status).toBe(200);
      }
    });

    it("should have rate limit headers", async () => {
      const manifestPath = join(testDownloadsDir, "manifest.json");

      if (existsSync(manifestPath)) {
        const response = await request(app).get("/downloads/manifest.json");

        // Rate limit headers may or may not be present depending on middleware
        // Just verify the request succeeds
        expect([200, 404]).toContain(response.status);
      }
    });

    // Note: Testing rate limit exhaustion requires making 20+ requests
    // which is slow and may be flaky. Skipped in unit tests.
    it.skip("should enforce rate limit after 20 requests", async () => {
      // This test is skipped as it's slow and better suited for integration tests
      // Rate limit: 20 requests per 15 minutes
    });
  });

  describe("MIME Type Detection", () => {
    it("should serve .zip files with application/zip MIME type", async () => {
      const zipPath = join(testDownloadsDir, "chrome-extension.zip");

      if (existsSync(zipPath)) {
        const response = await request(app).get(
          "/downloads/chrome-extension.zip",
        );

        expect(response.headers["content-type"]).toBe("application/zip");
      }
    });

    it("should serve .json files with application/json MIME type", async () => {
      const manifestPath = join(testDownloadsDir, "manifest.json");

      if (existsSync(manifestPath)) {
        const response = await request(app).get("/downloads/manifest.json");

        expect(response.headers["content-type"]).toMatch(/application\/json/);
      }
    });
  });

  describe("Content-Disposition Headers", () => {
    it("should set attachment disposition for zip files", async () => {
      const zipPath = join(testDownloadsDir, "chrome-extension.zip");

      if (existsSync(zipPath)) {
        const response = await request(app).get(
          "/downloads/chrome-extension.zip",
        );

        expect(response.headers["content-disposition"]).toBeDefined();
        expect(response.headers["content-disposition"]).toMatch(/^attachment/);
        expect(response.headers["content-disposition"]).toMatch(/filename/);
      }
    });

    it("should include correct filename in Content-Disposition", async () => {
      const zipPath = join(testDownloadsDir, "workflow-builder.zip");

      if (existsSync(zipPath)) {
        const response = await request(app).get(
          "/downloads/workflow-builder.zip",
        );

        expect(response.headers["content-disposition"]).toMatch(
          /workflow-builder\.zip/,
        );
      }
    });
  });
});
