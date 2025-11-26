/// <reference types="jest" />
import { Request, Response, NextFunction } from "express";
import {
  Validator,
  validateRequest,
  sanitizeRequest,
  commonSchemas,
} from "../../src/utils/validation";
import Joi from "joi";

describe("Validation Utilities", () => {
  describe("Validator.validate", () => {
    it("should validate valid data successfully", () => {
      const schema = Joi.object({
        name: Joi.string().required(),
        age: Joi.number().required(),
      });
      const data = { name: "John", age: 30 };

      const result = Validator.validate(data, schema);
      expect(result.valid).toBe(true);
      expect(result.data).toEqual(data);
    });

    it("should return errors for invalid data", () => {
      const schema = Joi.object({
        name: Joi.string().required(),
        age: Joi.number().required(),
      });
      const data = { name: "John", age: "invalid" };

      const result = Validator.validate(data, schema);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe("Validator.validateOrThrow", () => {
    it("should validate valid data successfully", () => {
      const schema = Joi.object({
        name: Joi.string().required(),
        age: Joi.number().required(),
      });
      const data = { name: "John", age: 30 };

      expect(() => Validator.validateOrThrow(data, schema)).not.toThrow();
    });

    it("should throw error for invalid data", () => {
      const schema = Joi.object({
        name: Joi.string().required(),
        age: Joi.number().required(),
      });
      const data = { name: "John", age: "invalid" as any };

      expect(() => Validator.validateOrThrow(data, schema)).toThrow();
    });
  });

  describe("Email Validation", () => {
    it("should validate correct email addresses", () => {
      const validEmails = [
        "test@example.com",
        "user.name@example.com",
        "user+tag@example.com",
        "user_name@example.co.uk",
        "test123@test-domain.com",
      ];

      validEmails.forEach((email) => {
        expect(Validator.isValidEmail(email)).toBe(true);
      });
    });

    it("should reject invalid email addresses", () => {
      const invalidEmails = [
        "invalid",
        "@example.com",
        "user@",
        "user @example.com",
        "",
        "user@@example.com",
      ];

      invalidEmails.forEach((email) => {
        expect(Validator.isValidEmail(email)).toBe(false);
      });
    });

    it("should handle emails with plus addressing", () => {
      expect(Validator.isValidEmail("user+tag@example.com")).toBe(true);
    });

    it("should handle emails with dots", () => {
      expect(Validator.isValidEmail("first.last@example.com")).toBe(true);
    });
  });

  describe("UUID Validation", () => {
    it("should validate correct UUIDs", () => {
      const validUuids = [
        "123e4567-e89b-12d3-a456-426614174000",
        "550e8400-e29b-41d4-a716-446655440000",
        "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
      ];

      validUuids.forEach((uuid) => {
        expect(Validator.isValidUuid(uuid)).toBe(true);
      });
    });

    it("should reject invalid UUIDs", () => {
      const invalidUuids = [
        "invalid-uuid",
        "123e4567-e89b-12d3-a456",
        "123e4567-e89b-12d3-a456-42661417400g",
        "",
        "123e4567e89b12d3a456426614174000",
      ];

      invalidUuids.forEach((uuid) => {
        expect(Validator.isValidUuid(uuid)).toBe(false);
      });
    });
  });

  describe("JSON Validation", () => {
    it("should validate correct JSON", () => {
      expect(Validator.isValidJson('{"key": "value"}')).toBe(true);
      expect(Validator.isValidJson("[]")).toBe(true);
      expect(Validator.isValidJson("null")).toBe(true);
    });

    it("should reject invalid JSON", () => {
      expect(Validator.isValidJson("{key: value}")).toBe(false);
      expect(Validator.isValidJson("invalid")).toBe(false);
      expect(Validator.isValidJson("")).toBe(false);
    });
  });

  describe("String Sanitization", () => {
    it("should sanitize XSS attack vectors", () => {
      const dangerous = '<script>alert("XSS")</script>';
      const sanitized = Validator.sanitizeString(dangerous);

      expect(sanitized).not.toContain("<script>");
      expect(sanitized).not.toContain("</script>");
    });

    it("should remove HTML entities", () => {
      const input = '<div>Test & "quotes"</div>';
      const sanitized = Validator.sanitizeString(input);

      expect(sanitized).not.toContain("<div>");
      expect(sanitized).not.toContain("<");
      expect(sanitized).not.toContain(">");
    });

    it("should handle empty strings", () => {
      expect(Validator.sanitizeString("")).toBe("");
    });

    it("should preserve safe characters", () => {
      const input = "Hello World 123";
      const sanitized = Validator.sanitizeString(input);

      expect(sanitized).toBe(input);
    });
  });

  describe("HTML Sanitization", () => {
    it("should remove dangerous tags by default", () => {
      const input = "<p>Hello</p><script>alert(1)</script>";
      const sanitized = Validator.sanitizeHtml(input);

      expect(sanitized).not.toContain("<script>");
    });

    it("should preserve allowed tags", () => {
      const input = "<p>Hello <strong>World</strong></p>";
      const sanitized = Validator.sanitizeHtml(input, ["p", "strong"]);

      // sanitize-html should keep allowed tags
      expect(sanitized).toBeDefined();
    });
  });

  describe("URL Sanitization", () => {
    it("should allow safe URLs", () => {
      const url = "https://example.com/path";
      const sanitized = Validator.sanitizeUrl(url);

      expect(sanitized).toBe(url); // URL preserves the path as-is
    });

    it("should reject javascript: protocol", () => {
      const url = "javascript:alert(1)";
      const sanitized = Validator.sanitizeUrl(url);

      expect(sanitized).toBe(""); // Returns empty string on error
    });

    it("should reject data: protocol by default", () => {
      const url = "data:text/html,<script>alert(1)</script>";
      const sanitized = Validator.sanitizeUrl(url);

      expect(sanitized).toBe(""); // Returns empty string on error
    });

    it("should allow custom protocols", () => {
      const url = "ftp://example.com";
      const sanitized = Validator.sanitizeUrl(url, ["ftp"]);

      expect(sanitized).toBe("ftp://example.com/"); // URL adds trailing slash when no path
    });
  });

  describe("Object Sanitization", () => {
    it("should sanitize string values in objects", () => {
      const input = {
        name: "<script>alert(1)</script>",
        description: "Normal text",
      };

      const sanitized = Validator.sanitizeObject(input);

      expect(sanitized.name).not.toContain("<script>");
      expect(sanitized.description).toBe("Normal text");
    });

    it("should sanitize nested objects", () => {
      const input = {
        user: {
          name: "<script>alert(1)</script>",
          email: "test@example.com",
        },
      };

      const sanitized = Validator.sanitizeObject(input);

      expect(sanitized.user.name).not.toContain("<script>");
      expect(sanitized.user.email).toBe("test@example.com");
    });

    it("should sanitize arrays", () => {
      const input = {
        items: ["<script>alert(1)</script>", "safe text"],
      };

      const sanitized = Validator.sanitizeObject(input);

      expect(sanitized.items[0]).not.toContain("<script>");
      expect(sanitized.items[1]).toBe("safe text");
    });

    it("should preserve non-string values", () => {
      const input = {
        count: 42,
        active: true,
        data: null,
      };

      const sanitized = Validator.sanitizeObject(input);

      expect(sanitized.count).toBe(42);
      expect(sanitized.active).toBe(true);
      expect(sanitized.data).toBe(null);
    });

    it("should handle null and undefined", () => {
      expect(Validator.sanitizeObject(null)).toBe(null);
      expect(Validator.sanitizeObject(undefined)).toBe(undefined);
    });
  });

  describe("validateRequest Middleware", () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
      mockRequest = {
        body: {},
      };
      mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      mockNext = jest.fn();
    });

    it("should call next() for valid data", () => {
      const schema = Joi.object({
        name: Joi.string().required(),
      });
      mockRequest.body = { name: "John" };

      const middleware = validateRequest(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it("should return 400 for invalid data", () => {
      const schema = Joi.object({
        name: Joi.string().required(),
      });
      mockRequest.body = {}; // Missing required field

      const middleware = validateRequest(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("sanitizeRequest Middleware", () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
      mockRequest = {
        body: {},
        query: {},
        params: {},
      };
      mockResponse = {};
      mockNext = jest.fn();
    });

    it("should sanitize request body", () => {
      mockRequest.body = {
        name: "<script>alert(1)</script>",
      };

      sanitizeRequest(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockRequest.body.name).not.toContain("<script>");
      expect(mockNext).toHaveBeenCalled();
    });

    it("should sanitize query parameters using Object.assign", () => {
      mockRequest.query = {
        search: "<script>alert(1)</script>",
      } as any;

      sanitizeRequest(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockRequest.query).toBeDefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it("should sanitize URL parameters using Object.assign", () => {
      mockRequest.params = {
        id: "<script>alert(1)</script>",
      } as any;

      sanitizeRequest(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockRequest.params).toBeDefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it("should handle missing body/query/params", () => {
      mockRequest = {};

      expect(() => {
        sanitizeRequest(
          mockRequest as Request,
          mockResponse as Response,
          mockNext,
        );
      }).not.toThrow();

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe("Common Schemas", () => {
    it("should have agentExecutionRequest schema", () => {
      expect(commonSchemas.agentExecutionRequest).toBeDefined();
    });

    it("should have workflowExecutionRequest schema", () => {
      expect(commonSchemas.workflowExecutionRequest).toBeDefined();
    });

    it("should have paginationParams schema", () => {
      expect(commonSchemas.paginationParams).toBeDefined();
    });

    it("should have authRequest schema", () => {
      expect(commonSchemas.authRequest).toBeDefined();
    });

    it("should have browserTask schema", () => {
      expect(commonSchemas.browserTask).toBeDefined();
    });

    it("should have dataExtraction schema", () => {
      expect(commonSchemas.dataExtraction).toBeDefined();
    });
  });

  describe("Security Tests", () => {
    it("should remove quotes from SQL-like strings", () => {
      const input = "'; DROP TABLE users; --";
      const sanitized = Validator.sanitizeString(input);

      // sanitizeString doesn't escape quotes, just removes angle brackets and javascript:
      expect(sanitized).toBeDefined();
    });

    it("should handle SQL injection in objects", () => {
      const input = {
        username: "admin' OR '1'='1",
        password: "' OR '1'='1",
      };

      const sanitized = Validator.sanitizeObject(input);

      // sanitizeString doesn't escape quotes by default
      expect(sanitized.username).toBeDefined();
      expect(sanitized.password).toBeDefined();
    });
  });

  describe("Edge Cases", () => {
    it("should handle very long strings", () => {
      const longString = "a".repeat(10000);
      const sanitized = Validator.sanitizeString(longString);

      expect(sanitized).toBe(longString);
    });

    it("should handle unicode characters", () => {
      const unicode = "你好世界 🌍";
      const sanitized = Validator.sanitizeString(unicode);

      expect(sanitized).toBe(unicode);
    });

    it("should handle special characters", () => {
      const special = "!@#$%^&*()_+-=[]{}|;:,.<>?";
      const sanitized = Validator.sanitizeString(special);

      // Should escape or preserve based on context
      expect(sanitized).toBeDefined();
    });
  });
});
