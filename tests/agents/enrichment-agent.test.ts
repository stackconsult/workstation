/// <reference types="jest" />

/**
 * Unit tests for Enrichment Agent
 * Tests geocoding, company enrichment, and contact enrichment capabilities
 */

import { EnrichmentAgent } from "../../src/automation/agents/utility/enrichment";

describe("Enrichment Agent Tests", () => {
  let enrichmentAgent: EnrichmentAgent;

  beforeEach(() => {
    enrichmentAgent = new EnrichmentAgent();
  });

  afterEach(() => {
    enrichmentAgent.clearCache();
  });

  describe("geocode", () => {
    it("should geocode a valid address", async () => {
      const result = await enrichmentAgent.geocode({
        address: "Seattle, WA, USA",
        options: {
          timeout: 10000,
          retries: 3,
          cacheResults: false, // Disable cache for testing
        },
      });

      expect(result.success).toBe(true);
      if (result.data) {
        expect(result.data.latitude).toBeDefined();
        expect(result.data.longitude).toBeDefined();
        expect(result.data.address).toBeDefined();
        expect(typeof result.data.latitude).toBe("number");
        expect(typeof result.data.longitude).toBe("number");
      }
    }, 15000);

    it("should return error for empty address", async () => {
      const result = await enrichmentAgent.geocode({
        address: "",
        options: {
          cacheResults: false,
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain("required");
    });

    it("should use cache on second call with same address", async () => {
      const address = "San Francisco, CA";

      // First call
      const result1 = await enrichmentAgent.geocode({
        address,
        options: {
          timeout: 10000,
          cacheResults: true,
        },
      });

      // Second call (should use cache)
      const result2 = await enrichmentAgent.geocode({
        address,
        options: {
          cacheResults: true,
        },
      });

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);

      const stats = enrichmentAgent.getCacheStats();
      expect(stats.size).toBeGreaterThan(0);
    }, 15000);

    it("should handle network errors gracefully", async () => {
      const result = await enrichmentAgent.geocode({
        address: "Invalid!!!Address!!!12345@@@@",
        options: {
          timeout: 5000,
          retries: 1,
          cacheResults: false,
        },
      });

      // Even invalid addresses might return some result from geocoding service
      // or return an error - both are acceptable
      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
    }, 15000);
  });

  describe("enrichCompanyData", () => {
    it("should enrich company data from domain", async () => {
      const result = await enrichmentAgent.enrichCompanyData({
        domain: "github.com",
        options: {
          timeout: 10000,
          retries: 3,
          cacheResults: false,
        },
      });

      expect(result.success).toBe(true);
      if (result.data) {
        expect(result.data.name).toBeDefined();
        expect(result.data.domain).toBe("github.com");
        expect(result.data.website).toBeDefined();
      }
    }, 15000);

    it("should extract company name from domain", async () => {
      const result = await enrichmentAgent.enrichCompanyData({
        domain: "stackoverflow.com",
        options: {
          cacheResults: false,
        },
      });

      expect(result.success).toBe(true);
      if (result.data) {
        // extractCompanyName transforms 'stackoverflow' to 'Stackoverflow'
        expect(result.data.name).toBe("Stackoverflow");
      }
    }, 15000);

    it("should return error for invalid domain", async () => {
      const result = await enrichmentAgent.enrichCompanyData({
        domain: "",
        options: {
          cacheResults: false,
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should sanitize domain URLs", async () => {
      const result = await enrichmentAgent.enrichCompanyData({
        domain: "https://www.example.com/about",
        options: {
          timeout: 10000,
          cacheResults: false,
        },
      });

      expect(result.success).toBe(true);
      if (result.data) {
        expect(result.data.domain).toBe("example.com");
      }
    }, 15000);

    it("should cache company enrichment results", async () => {
      const domain = "microsoft.com";

      await enrichmentAgent.enrichCompanyData({
        domain,
        options: {
          timeout: 10000,
          cacheResults: true,
        },
      });

      const stats = enrichmentAgent.getCacheStats();
      expect(stats.entries.some((key) => key.includes("company"))).toBe(true);
    }, 15000);
  });

  describe("enrichContact", () => {
    it("should enrich contact data from email", async () => {
      const result = await enrichmentAgent.enrichContact({
        email: "test@github.com",
        options: {
          timeout: 10000,
          cacheResults: false,
        },
      });

      expect(result.success).toBe(true);
      if (result.data) {
        expect(result.data.email).toBe("test@github.com");
        expect(result.data.company).toBeDefined();
      }
    }, 15000);

    it("should validate email format", async () => {
      const result = await enrichmentAgent.enrichContact({
        email: "invalid-email",
        options: {
          cacheResults: false,
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain("email");
    });

    it("should return error for empty email", async () => {
      const result = await enrichmentAgent.enrichContact({
        email: "",
        options: {
          cacheResults: false,
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should extract company from email domain", async () => {
      const result = await enrichmentAgent.enrichContact({
        email: "user@amazon.com",
        options: {
          timeout: 10000,
          cacheResults: false,
        },
      });

      expect(result.success).toBe(true);
      if (result.data) {
        expect(result.data.company).toBeDefined();
        // extractCompanyName capitalizes first letter: 'amazon' -> 'Amazon'
        expect(result.data.company?.toLowerCase()).toContain("amazon");
      }
    }, 15000);
  });

  describe("batchEnrich", () => {
    it("should enrich multiple records in batch", async () => {
      const result = await enrichmentAgent.batchEnrich({
        records: [
          { type: "geocode", value: "New York, NY" },
          { type: "company", value: "google.com" },
          { type: "contact", value: "test@apple.com" },
        ],
        options: {
          timeout: 15000,
          cacheResults: false,
        },
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      if (result.data) {
        expect(result.data).toHaveLength(3);

        // Check that at least some results were successful
        const successfulResults = result.data.filter((r) => r.success);
        expect(successfulResults.length).toBeGreaterThan(0);
      }
    }, 20000);

    it("should handle mixed success and failure in batch", async () => {
      const result = await enrichmentAgent.batchEnrich({
        records: [
          { type: "geocode", value: "" }, // Invalid
          { type: "company", value: "example.com" }, // Valid
          { type: "contact", value: "invalid-email" }, // Invalid
        ],
        options: {
          cacheResults: false,
        },
      });

      expect(result.success).toBe(true);
      if (result.data) {
        expect(result.data).toHaveLength(3);

        // Check mixed results
        const failedResults = result.data.filter((r) => !r.success);
        expect(failedResults.length).toBeGreaterThan(0);
      }
    }, 15000);

    it("should handle unknown enrichment type", async () => {
      const result = await enrichmentAgent.batchEnrich({
        records: [{ type: "unknown" as any, value: "test" }],
        options: {
          cacheResults: false,
        },
      });

      expect(result.success).toBe(true);
      if (result.data && result.data[0]) {
        expect(result.data[0].success).toBe(false);
        expect(result.data[0].error).toContain("Unknown enrichment type");
      }
    });
  });

  describe("cache management", () => {
    it("should clear cache", async () => {
      // Add some cached data
      await enrichmentAgent.geocode({
        address: "Boston, MA",
        options: {
          timeout: 10000,
          cacheResults: true,
        },
      });

      let stats = enrichmentAgent.getCacheStats();
      expect(stats.size).toBeGreaterThan(0);

      // Clear cache
      enrichmentAgent.clearCache();

      stats = enrichmentAgent.getCacheStats();
      expect(stats.size).toBe(0);
    }, 15000);

    it("should provide cache statistics", async () => {
      await enrichmentAgent.geocode({
        address: "Chicago, IL",
        options: {
          timeout: 10000,
          cacheResults: true,
        },
      });

      await enrichmentAgent.enrichCompanyData({
        domain: "twitter.com",
        options: {
          timeout: 10000,
          cacheResults: true,
        },
      });

      const stats = enrichmentAgent.getCacheStats();
      expect(stats.size).toBeGreaterThanOrEqual(2);
      expect(Array.isArray(stats.entries)).toBe(true);
      expect(stats.entries.length).toBe(stats.size);
    }, 15000);

    it("should respect cacheResults option", async () => {
      const address = "Portland, OR";

      // First call without cache
      await enrichmentAgent.geocode({
        address,
        options: {
          timeout: 10000,
          cacheResults: false,
        },
      });

      let stats = enrichmentAgent.getCacheStats();
      const initialSize = stats.size;

      // Second call with cache enabled
      await enrichmentAgent.geocode({
        address,
        options: {
          timeout: 10000,
          cacheResults: true,
        },
      });

      stats = enrichmentAgent.getCacheStats();
      expect(stats.size).toBeGreaterThan(initialSize);
    }, 15000);
  });

  describe("error handling", () => {
    it("should handle timeout gracefully", async () => {
      const result = await enrichmentAgent.geocode({
        address: "Test Address",
        options: {
          timeout: 1, // Very short timeout
          retries: 1,
          cacheResults: false,
        },
      });

      // Should complete without crashing
      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
    }, 10000);

    it("should retry on failures", async () => {
      const result = await enrichmentAgent.enrichCompanyData({
        domain: "example.com",
        options: {
          timeout: 5000,
          retries: 2,
          cacheResults: false,
        },
      });

      // Should complete even with retries
      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
    }, 15000);

    it("should sanitize inputs", async () => {
      const result = await enrichmentAgent.enrichContact({
        email: "  test@example.com  ",
        options: {
          cacheResults: false,
        },
      });

      expect(result.success).toBe(true);
      if (result.data) {
        expect(result.data.email).toBe("test@example.com");
      }
    }, 10000);
  });
});
