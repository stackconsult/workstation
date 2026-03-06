/// <reference types="jest" />
import {
  ErrorHandler,
  AppError,
  ErrorCategory,
} from "../../src/utils/error-handler";

// Mock logger
jest.mock("../../src/utils/logger", () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

describe("ErrorHandler Utilities", () => {
  describe("Error Creation Helpers", () => {
    it("should create validation error with correct properties", () => {
      const error = ErrorHandler.validationError(
        "Invalid input",
        "email",
        "bad@email",
      );

      expect(error).toBeInstanceOf(AppError);
      expect(error.category).toBe(ErrorCategory.VALIDATION);
      expect(error.message).toBe("Invalid input");
      expect(error.context).toEqual({
        field: "email",
        value: "bad@email",
      });
      expect(error.retryable).toBe(false);
    });

    it("should create network error with correct properties", () => {
      const error = ErrorHandler.networkError(
        "Connection failed",
        "https://api.example.com",
      );

      expect(error).toBeInstanceOf(AppError);
      expect(error.category).toBe(ErrorCategory.NETWORK);
      expect(error.retryable).toBe(true);
      expect(error.context?.url).toBe("https://api.example.com");
    });

    it("should create database error with correct properties", () => {
      const error = ErrorHandler.databaseError("Query failed", "INSERT");

      expect(error).toBeInstanceOf(AppError);
      expect(error.category).toBe(ErrorCategory.DATABASE);
      expect(error.retryable).toBe(true);
      expect(error.context?.operation).toBe("INSERT");
    });

    it("should create authentication error", () => {
      const error = ErrorHandler.authenticationError("Invalid token");

      expect(error).toBeInstanceOf(AppError);
      expect(error.category).toBe(ErrorCategory.AUTHENTICATION);
      expect(error.retryable).toBe(false);
    });

    it("should create authorization error", () => {
      const error = ErrorHandler.authorizationError("Insufficient permissions");

      expect(error).toBeInstanceOf(AppError);
      expect(error.category).toBe(ErrorCategory.AUTHORIZATION);
      expect(error.retryable).toBe(false);
    });
  });

  describe("withRetry", () => {
    it("should succeed on first attempt", async () => {
      const mockFn = jest.fn().mockResolvedValue("success");

      const result = await ErrorHandler.withRetry(mockFn);

      expect(result).toBe("success");
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it("should retry on network error and eventually succeed", async () => {
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(ErrorHandler.networkError("Connection failed"))
        .mockRejectedValueOnce(ErrorHandler.networkError("Connection failed"))
        .mockResolvedValue("success");

      const result = await ErrorHandler.withRetry(mockFn, {
        maxRetries: 3,
        delayMs: 10,
        backoffMultiplier: 1,
      });

      expect(result).toBe("success");
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it("should throw error after max retries exceeded", async () => {
      const error = ErrorHandler.networkError("Connection failed");
      const mockFn = jest.fn().mockRejectedValue(error);

      await expect(
        ErrorHandler.withRetry(mockFn, {
          maxRetries: 2,
          delayMs: 10,
          backoffMultiplier: 1,
        }),
      ).rejects.toThrow(AppError);

      expect(mockFn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it("should not retry validation errors", async () => {
      const error = ErrorHandler.validationError("Invalid input");
      const mockFn = jest.fn().mockRejectedValue(error);

      await expect(
        ErrorHandler.withRetry(mockFn, {
          maxRetries: 3,
          delayMs: 10,
        }),
      ).rejects.toThrow(AppError);

      expect(mockFn).toHaveBeenCalledTimes(1); // No retries
    });

    it("should call onRetry callback on each retry", async () => {
      const onRetry = jest.fn();
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(ErrorHandler.networkError("Failed"))
        .mockResolvedValue("success");

      await ErrorHandler.withRetry(mockFn, {
        maxRetries: 2,
        delayMs: 10,
        backoffMultiplier: 1,
        onRetry,
      });

      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(1, expect.any(AppError));
    });

    it("should apply exponential backoff", async () => {
      const delays: number[] = [];
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = jest.fn((fn: any, delay: number) => {
        delays.push(delay);
        return originalSetTimeout(fn, 0);
      }) as any;

      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(ErrorHandler.networkError("Failed"))
        .mockRejectedValueOnce(ErrorHandler.networkError("Failed"))
        .mockResolvedValue("success");

      await ErrorHandler.withRetry(mockFn, {
        maxRetries: 3,
        delayMs: 100,
        backoffMultiplier: 2,
      });

      // First retry: 100ms, Second retry: 200ms
      expect(delays[0]).toBe(100);
      expect(delays[1]).toBe(200);

      global.setTimeout = originalSetTimeout;
    });

    it("should handle undefined lastError edge case", async () => {
      const mockFn = jest.fn().mockImplementation(() => {
        throw undefined;
      });

      await expect(
        ErrorHandler.withRetry(mockFn, { maxRetries: 0 }),
      ).rejects.toThrow(AppError);
    });
  });

  describe("withTimeout", () => {
    it("should succeed within timeout", async () => {
      const mockFn = jest.fn().mockResolvedValue("success");

      const result = await ErrorHandler.withTimeout(mockFn, 1000);

      expect(result).toBe("success");
    });

    it("should throw timeout error when operation exceeds timeout", async () => {
      const mockFn = jest
        .fn()
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(resolve, 200)),
        );

      await expect(
        ErrorHandler.withTimeout(mockFn, 50, "Custom timeout message"),
      ).rejects.toThrow("Custom timeout message");
    });

    it("should use default timeout message when not provided", async () => {
      const mockFn = jest
        .fn()
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(resolve, 200)),
        );

      await expect(ErrorHandler.withTimeout(mockFn, 50)).rejects.toThrow(
        "Operation timed out",
      );
    });
  });

  describe("Error Handling", () => {
    it("should handle AppError instances", () => {
      const error = new AppError("Test error", "TEST_ERROR", {
        category: ErrorCategory.INTERNAL,
      });

      const handled = ErrorHandler.handle(error);

      expect(handled).toBe(error);
      expect(handled.category).toBe(ErrorCategory.INTERNAL);
    });

    it("should convert generic Error to AppError", () => {
      const error = new Error("Generic error");

      const handled = ErrorHandler.handle(error);

      expect(handled).toBeInstanceOf(AppError);
      expect(handled.category).toBe(ErrorCategory.UNKNOWN);
      expect(handled.message).toBe("Generic error");
    });

    it("should handle non-Error objects", () => {
      const handled = ErrorHandler.handle("string error");

      expect(handled).toBeInstanceOf(AppError);
      expect(handled.message).toBe("string error");
      expect(handled.category).toBe(ErrorCategory.UNKNOWN);
    });

    it("should handle null/undefined errors", () => {
      const handled = ErrorHandler.handle(null);

      expect(handled).toBeInstanceOf(AppError);
      expect(handled.message).toBe("null");
    });
  });

  describe("Error Classification", () => {
    it("should classify retryable errors correctly", () => {
      const networkError = ErrorHandler.networkError("Connection failed");
      const validationError = ErrorHandler.validationError("Invalid input");

      expect(networkError.retryable).toBe(true);
      expect(validationError.retryable).toBe(false);
    });

    it("should classify error categories correctly", () => {
      expect(ErrorHandler.networkError("test").category).toBe(
        ErrorCategory.NETWORK,
      );
      expect(ErrorHandler.databaseError("test").category).toBe(
        ErrorCategory.DATABASE,
      );
      expect(ErrorHandler.validationError("test").category).toBe(
        ErrorCategory.VALIDATION,
      );
      expect(ErrorHandler.authenticationError().category).toBe(
        ErrorCategory.AUTHENTICATION,
      );
      expect(ErrorHandler.authorizationError().category).toBe(
        ErrorCategory.AUTHORIZATION,
      );
    });
  });

  describe("Integration Tests", () => {
    it("should combine retry and timeout for robust error handling", async () => {
      let attempt = 0;
      const mockFn = jest.fn().mockImplementation(async () => {
        attempt++;
        if (attempt < 3) {
          throw ErrorHandler.networkError("Temporary failure");
        }
        return "success";
      });

      const result = await ErrorHandler.withRetry(
        () => ErrorHandler.withTimeout(mockFn, 1000),
        {
          maxRetries: 3,
          delayMs: 10,
          backoffMultiplier: 1,
        },
      );

      expect(result).toBe("success");
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it("should handle timeout within retry loop", async () => {
      const mockFn = jest
        .fn()
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(resolve, 200)),
        );

      await expect(
        ErrorHandler.withRetry(() => ErrorHandler.withTimeout(mockFn, 50), {
          maxRetries: 2,
          delayMs: 10,
          retryableErrors: [ErrorCategory.TIMEOUT],
        }),
      ).rejects.toThrow();
    });
  });
});
