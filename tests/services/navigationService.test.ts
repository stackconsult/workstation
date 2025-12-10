/// <reference types="jest" />
/**
 * Navigation Service Tests
 *
 * Tests for the TypeScript integration layer that communicates with Agent 2 Go backend.
 * These tests use mocked axios responses to simulate backend interactions.
 */

import axios from "axios";
import {
  NavigationService,
  NavigationRequest,
  ExtractionRequest,
} from "../../src/services/navigationService";

// Mock axios
jest.mock("axios");

describe("NavigationService", () => {
  let service: NavigationService;
  let mockAxiosInstance: any;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Mock axios instance
    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
    };

    // Mock axios.create to return our mock instance
    (axios.create as jest.Mock) = jest.fn(() => mockAxiosInstance);

    // Create service instance
    service = new NavigationService();
  });

  describe("constructor", () => {
    it("should create instance with default configuration", () => {
      expect(service).toBeInstanceOf(NavigationService);
      expect(axios.create).toHaveBeenCalledWith({
        baseURL: "http://localhost:11434",
        timeout: 30000,
        headers: {
          "Content-Type": "application/json",
        },
      });
    });

    it("should use custom configuration when provided", () => {
      const customConfig = {
        baseURL: "http://custom-backend:8080",
        timeout: 60000,
      };

      new NavigationService(customConfig);

      expect(axios.create).toHaveBeenCalledWith({
        baseURL: "http://custom-backend:8080",
        timeout: 60000,
        headers: {
          "Content-Type": "application/json",
        },
      });
    });
  });

  describe("healthCheck", () => {
    it("should return true when backend is healthy", async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: {
          status: "healthy",
          service: "navigation-helper",
          agent: 2,
          port: "11434",
        },
      });

      const result = await service.healthCheck();

      expect(result).toBe(true);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith("/health");
    });

    it("should return false when backend is unhealthy", async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: {
          status: "unhealthy",
          service: "navigation-helper",
          agent: 2,
          port: "11434",
        },
      });

      const result = await service.healthCheck();

      expect(result).toBe(false);
    });

    it("should return false when request fails", async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error("Network error"));

      const result = await service.healthCheck();

      expect(result).toBe(false);
    });
  });

  describe("navigate", () => {
    it("should successfully navigate to URL", async () => {
      const request: NavigationRequest = {
        url: "https://example.com",
        selectors: ["h1", "body"],
        timeout: 30,
      };

      mockAxiosInstance.post.mockResolvedValue({
        data: {
          success: true,
          message: "Navigation successful",
          url: "https://example.com",
        },
      });

      const result = await service.navigate(request);

      expect(result.success).toBe(true);
      expect(result.url).toBe("https://example.com");
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        "/api/browser/navigate",
        {
          url: "https://example.com",
          selectors: ["h1", "body"],
          timeout: 30,
        },
      );
    });

    it("should throw error when navigation fails", async () => {
      const request: NavigationRequest = {
        url: "https://example.com",
      };

      mockAxiosInstance.post.mockRejectedValue(new Error("Timeout"));

      await expect(service.navigate(request)).rejects.toThrow(
        "Navigation failed: Timeout",
      );
    });
  });

  describe("extractData", () => {
    it("should successfully extract data from page", async () => {
      const request: ExtractionRequest = {
        url: "https://example.com",
        selectors: {
          title: "h1",
          description: 'meta[name="description"]',
        },
        timeout: 30,
      };

      mockAxiosInstance.post.mockResolvedValue({
        data: {
          success: true,
          data: {
            title: "Example Domain",
            description: "Example description",
          },
        },
      });

      const result = await service.extractData(request);

      expect(result).toEqual({
        title: "Example Domain",
        description: "Example description",
      });
    });

    it("should throw error when extraction fails", async () => {
      const request: ExtractionRequest = {
        url: "https://example.com",
        selectors: { title: "h1" },
      };

      mockAxiosInstance.post.mockRejectedValue(new Error("Element not found"));

      await expect(service.extractData(request)).rejects.toThrow(
        "Data extraction failed: Element not found",
      );
    });
  });
});
