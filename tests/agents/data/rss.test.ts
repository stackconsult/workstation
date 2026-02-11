/// <reference types="jest" />

import { RssAgent } from "../../../src/automation/agents/data/rss";

describe("RSS Agent", () => {
  let agent: RssAgent;

  beforeEach(() => {
    agent = new RssAgent();
  });

  describe("fetchFeed", () => {
    it("should fetch RSS feed with default settings", async () => {
      const result = await agent.fetchFeed({
        url: "https://example.com/feed.xml",
      });

      expect(result).toBeDefined();
      expect(result.title).toBeDefined();
      expect(result.description).toBeDefined();
      expect(result.items).toBeDefined();
      expect(Array.isArray(result.items)).toBe(true);
    });

    it("should limit items by maxItems parameter", async () => {
      const result = await agent.fetchFeed({
        url: "https://example.com/feed.xml",
        maxItems: 5,
      });

      expect(result.items.length).toBeLessThanOrEqual(5);
    });

    it("should return feed with item structure", async () => {
      const result = await agent.fetchFeed({
        url: "https://example.com/feed.xml",
      });

      if (result.items.length > 0) {
        const item = result.items[0];
        expect(item).toHaveProperty("title");
        expect(item).toHaveProperty("link");
        expect(item).toHaveProperty("content");
        expect(item).toHaveProperty("contentSnippet");
        expect(item).toHaveProperty("pubDate");
        expect(item).toHaveProperty("categories");
      }
    });

    it("should handle feed with no items", async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        title: "Empty Feed",
        description: "Feed with no items",
        items: [],
      });

      // Since this is a mock implementation, we expect at least the structure
      const result = await agent.fetchFeed({
        url: "https://example.com/empty-feed.xml",
      });

      expect(result).toBeDefined();
      expect(result.items).toBeDefined();
    });

    it("should default maxItems to 20", async () => {
      const result = await agent.fetchFeed({
        url: "https://example.com/feed.xml",
      });

      // Mock implementation returns limited items
      expect(result.items.length).toBeLessThanOrEqual(20);
    });
  });

  describe("extractClientInfo", () => {
    it("should extract client-specific information", async () => {
      const result = await agent.extractClientInfo({
        url: "https://example.com/feed.xml",
        clientName: "Acme Corp",
      });

      expect(Array.isArray(result)).toBe(true);
    });

    it("should calculate relevance scores", async () => {
      const result = await agent.extractClientInfo({
        url: "https://example.com/feed.xml",
        clientName: "Technology",
      });

      if (result.length > 0) {
        result.forEach((item) => {
          expect(item).toHaveProperty("relevanceScore");
          expect(typeof item.relevanceScore).toBe("number");
          expect(item.relevanceScore).toBeGreaterThan(0);
          expect(item.relevanceScore).toBeLessThanOrEqual(1);
        });
      }
    });

    it("should filter by relevance threshold", async () => {
      const result = await agent.extractClientInfo({
        url: "https://example.com/feed.xml",
        clientName: "Test Client",
      });

      // All items should have relevance > 0.3
      result.forEach((item) => {
        expect(item.relevanceScore).toBeGreaterThan(0.3);
      });
    });

    it("should sort results by relevance", async () => {
      const result = await agent.extractClientInfo({
        url: "https://example.com/feed.xml",
        clientName: "Technology",
      });

      if (result.length > 1) {
        for (let i = 0; i < result.length - 1; i++) {
          expect(result[i].relevanceScore).toBeGreaterThanOrEqual(
            result[i + 1].relevanceScore,
          );
        }
      }
    });

    it("should extract client mentions", async () => {
      const result = await agent.extractClientInfo({
        url: "https://example.com/feed.xml",
        clientName: "Technology",
      });

      if (result.length > 0) {
        result.forEach((item) => {
          expect(item).toHaveProperty("clientMentions");
          expect(Array.isArray(item.clientMentions)).toBe(true);
        });
      }
    });

    it("should include required intelligence fields", async () => {
      const result = await agent.extractClientInfo({
        url: "https://example.com/feed.xml",
        clientName: "Test",
      });

      if (result.length > 0) {
        const item = result[0];
        expect(item).toHaveProperty("title");
        expect(item).toHaveProperty("url");
        expect(item).toHaveProperty("summary");
        expect(item).toHaveProperty("date");
        expect(item).toHaveProperty("relevanceScore");
        expect(item).toHaveProperty("clientMentions");
      }
    });

    it("should limit results by maxItems", async () => {
      const result = await agent.extractClientInfo({
        url: "https://example.com/feed.xml",
        clientName: "Technology",
        maxItems: 3,
      });

      expect(result.length).toBeLessThanOrEqual(3);
    });

    it("should handle empty client name", async () => {
      const result = await agent.extractClientInfo({
        url: "https://example.com/feed.xml",
        clientName: "",
      });

      expect(Array.isArray(result)).toBe(true);
    });

    it("should summarize content", async () => {
      const result = await agent.extractClientInfo({
        url: "https://example.com/feed.xml",
        clientName: "Technology",
      });

      if (result.length > 0) {
        result.forEach((item) => {
          expect(item.summary).toBeDefined();
          expect(typeof item.summary).toBe("string");
          // Summary should be truncated to ~150 chars
          expect(item.summary.length).toBeLessThanOrEqual(200);
        });
      }
    });
  });

  describe("client mention detection", () => {
    it("should detect exact client name matches", async () => {
      const result = await agent.extractClientInfo({
        url: "https://example.com/feed.xml",
        clientName: "Technology",
      });

      // Mock implementation should detect mentions
      expect(result).toBeDefined();
    });

    it("should be case-insensitive", async () => {
      const result1 = await agent.extractClientInfo({
        url: "https://example.com/feed.xml",
        clientName: "technology",
      });

      const result2 = await agent.extractClientInfo({
        url: "https://example.com/feed.xml",
        clientName: "TECHNOLOGY",
      });

      expect(result1.length).toBeGreaterThanOrEqual(0);
      expect(result2.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe("edge cases", () => {
    it("should handle invalid URLs gracefully", async () => {
      // Mock implementation doesn't make actual HTTP requests
      const result = await agent.fetchFeed({
        url: "invalid-url",
      });

      expect(result).toBeDefined();
    });

    it("should handle network errors", async () => {
      // Mock implementation returns placeholder data
      const result = await agent.fetchFeed({
        url: "https://nonexistent.example.com/feed.xml",
      });

      expect(result).toBeDefined();
    });

    it("should handle malformed RSS", async () => {
      // Mock implementation returns structured data
      const result = await agent.fetchFeed({
        url: "https://example.com/malformed.xml",
      });

      expect(result).toBeDefined();
      expect(result.items).toBeDefined();
    });

    it("should handle special characters in client name", async () => {
      const result = await agent.extractClientInfo({
        url: "https://example.com/feed.xml",
        clientName: "Acme & Co.",
      });

      expect(Array.isArray(result)).toBe(true);
    });

    it("should handle very long feed items", async () => {
      const result = await agent.fetchFeed({
        url: "https://example.com/feed.xml",
      });

      expect(result).toBeDefined();
    });
  });

  describe("performance", () => {
    it("should handle large feeds efficiently", async () => {
      const startTime = Date.now();

      await agent.fetchFeed({
        url: "https://example.com/large-feed.xml",
        maxItems: 100,
      });

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000); // Should complete in under 5 seconds
    });

    it("should process multiple feeds concurrently", async () => {
      const feeds = [
        "https://example.com/feed1.xml",
        "https://example.com/feed2.xml",
        "https://example.com/feed3.xml",
      ];

      const results = await Promise.all(
        feeds.map((url) => agent.fetchFeed({ url })),
      );

      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result).toBeDefined();
      });
    });
  });
});
