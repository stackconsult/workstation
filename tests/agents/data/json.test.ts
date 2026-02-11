/// <reference types="jest" />

import { JsonAgent, jsonAgent } from "../../../src/automation/agents/data/json";
import Joi from "joi";

describe("JSON Agent", () => {
  let agent: JsonAgent;

  beforeEach(() => {
    agent = new JsonAgent();
  });

  describe("parseJson", () => {
    it("should parse valid JSON string", async () => {
      const jsonString = '{"name":"John","age":30,"active":true}';

      const result = await agent.parseJson({ input: jsonString });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ name: "John", age: 30, active: true });
    });

    it("should parse JSON array", async () => {
      const jsonString = '[{"id":1},{"id":2}]';

      const result = await agent.parseJson({ input: jsonString });

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data).toHaveLength(2);
    });

    it("should handle nested objects", async () => {
      const jsonString = '{"user":{"name":"John","address":{"city":"NYC"}}}';

      const result = await agent.parseJson({ input: jsonString });

      expect(result.success).toBe(true);
      expect(result.data.user.name).toBe("John");
      expect(result.data.user.address.city).toBe("NYC");
    });

    it("should handle reviver function", async () => {
      const jsonString = '{"date":"2024-01-01"}';

      const result = await agent.parseJson({
        input: jsonString,
        options: {
          reviver: (key, value) => {
            if (key === "date" && typeof value === "string") {
              return new Date(value);
            }
            return value;
          },
        },
      });

      expect(result.success).toBe(true);
      expect(result.data.date).toBeInstanceOf(Date);
    });

    it("should handle invalid JSON gracefully", async () => {
      const result = await agent.parseJson({ input: "{invalid json}" });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should handle empty string", async () => {
      const result = await agent.parseJson({ input: "" });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("queryJson", () => {
    const testData = {
      user: {
        name: "John",
        age: 30,
        address: {
          city: "NYC",
          zip: "10001",
        },
      },
      items: [
        { id: 1, name: "Item 1" },
        { id: 2, name: "Item 2" },
      ],
    };

    it("should query top-level property", async () => {
      const result = await agent.queryJson({
        data: testData,
        query: "$.user",
      });

      expect(result.success).toBe(true);
      expect(result.result).toEqual(testData.user);
    });

    it("should query nested property", async () => {
      const result = await agent.queryJson({
        data: testData,
        query: "$.user.name",
      });

      expect(result.success).toBe(true);
      expect(result.result).toBe("John");
    });

    it("should query deep nested property", async () => {
      const result = await agent.queryJson({
        data: testData,
        query: "$.user.address.city",
      });

      expect(result.success).toBe(true);
      expect(result.result).toBe("NYC");
    });

    it("should query array element by index", async () => {
      const result = await agent.queryJson({
        data: testData,
        query: "$.items[0]",
      });

      expect(result.success).toBe(true);
      expect(result.result).toEqual({ id: 1, name: "Item 1" });
    });

    it("should query all array elements with wildcard", async () => {
      const result = await agent.queryJson({
        data: testData,
        query: "$.items[*]",
      });

      expect(result.success).toBe(true);
      expect(Array.isArray(result.result)).toBe(true);
      expect(result.result).toHaveLength(2);
    });

    it("should handle query without $ prefix", async () => {
      const result = await agent.queryJson({
        data: testData,
        query: "user.name",
      });

      expect(result.success).toBe(true);
      expect(result.result).toBe("John");
    });

    it("should return entire data for root query", async () => {
      const result = await agent.queryJson({
        data: testData,
        query: "$",
      });

      expect(result.success).toBe(true);
      expect(result.result).toEqual(testData);
    });

    it("should return undefined for non-existent path", async () => {
      const result = await agent.queryJson({
        data: testData,
        query: "$.nonexistent",
      });

      expect(result.success).toBe(true);
      expect(result.result).toBeUndefined();
    });

    it("should handle invalid array access", async () => {
      const result = await agent.queryJson({
        data: testData,
        query: "$.user[0]",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("not an array");
    });
  });

  describe("validateJson", () => {
    it("should validate with Joi schema", async () => {
      const schema = Joi.object({
        name: Joi.string().required(),
        age: Joi.number().required(),
      });

      const data = { name: "John", age: 30 };

      const result = await agent.validateJson({ data, schema });

      expect(result.success).toBe(true);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it("should detect validation errors with Joi", async () => {
      const schema = Joi.object({
        name: Joi.string().required(),
        age: Joi.number().required(),
      });

      const data = { name: "John" }; // Missing age

      const result = await agent.validateJson({ data, schema });

      expect(result.success).toBe(true);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThan(0);
    });

    it("should validate with simple object schema", async () => {
      const schema = {
        name: { type: "string", required: true },
        age: { type: "number", required: true },
      };

      const data = { name: "John", age: 30 };

      const result = await agent.validateJson({ data, schema });

      expect(result.success).toBe(true);
      expect(result.valid).toBe(true);
    });

    it("should detect type mismatches", async () => {
      const schema = {
        name: { type: "string", required: true },
        age: { type: "number", required: true },
      };

      const data = { name: "John", age: "30" }; // age is string, not number

      const result = await agent.validateJson({ data, schema });

      expect(result.success).toBe(true);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it("should detect missing required fields", async () => {
      const schema = {
        name: { type: "string", required: true },
        age: { type: "number", required: true },
      };

      const data = { name: "John" };

      const result = await agent.validateJson({ data, schema });

      expect(result.success).toBe(true);
      expect(result.valid).toBe(false);
      expect(result.errors?.some((e) => e.includes("age"))).toBe(true);
    });

    it("should validate nested objects", async () => {
      const schema = {
        user: {
          name: { type: "string", required: true },
          address: {
            city: { type: "string", required: true },
          },
        },
      };

      const data = {
        user: {
          name: "John",
          address: { city: "NYC" },
        },
      };

      const result = await agent.validateJson({ data, schema });

      expect(result.success).toBe(true);
      expect(result.valid).toBe(true);
    });
  });

  describe("transformJson", () => {
    const testData = {
      firstName: "John",
      lastName: "Doe",
      age: 30,
      salary: 50000,
    };

    it.skip("should apply mapping transformations", async () => {
      const result = await agent.transformJson({
        data: testData,
        transforms: {
          map: {
            fullName: (data: any) => `${data.firstName} ${data.lastName}`,
            yearsOld: "age",
          },
        },
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty("fullName", "John Doe");
      expect(result.data).toHaveProperty("yearsOld", 30);
    });

    it("should filter array data", async () => {
      const arrayData = [
        { name: "John", age: 30 },
        { name: "Jane", age: 25 },
        { name: "Bob", age: 35 },
      ];

      const result = await agent.transformJson({
        data: arrayData,
        transforms: {
          filter: (item: any) => item.age > 28,
        },
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data.every((item: any) => item.age > 28)).toBe(true);
    });

    it("should sort array data ascending", async () => {
      const arrayData = [
        { name: "Bob", score: 85 },
        { name: "Alice", score: 95 },
        { name: "Charlie", score: 75 },
      ];

      const result = await agent.transformJson({
        data: arrayData,
        transforms: {
          sort: { key: "score", order: "asc" },
        },
      });

      expect(result.success).toBe(true);
      expect(result.data[0].name).toBe("Charlie");
      expect(result.data[2].name).toBe("Alice");
    });

    it("should sort array data descending", async () => {
      const arrayData = [
        { name: "Bob", score: 85 },
        { name: "Alice", score: 95 },
        { name: "Charlie", score: 75 },
      ];

      const result = await agent.transformJson({
        data: arrayData,
        transforms: {
          sort: { key: "score", order: "desc" },
        },
      });

      expect(result.success).toBe(true);
      expect(result.data[0].name).toBe("Alice");
      expect(result.data[2].name).toBe("Charlie");
    });

    it("should apply multiple transformations", async () => {
      const arrayData = [
        { name: "Bob", age: 30, score: 85 },
        { name: "Alice", age: 25, score: 95 },
        { name: "Charlie", age: 35, score: 75 },
      ];

      const result = await agent.transformJson({
        data: arrayData,
        transforms: {
          filter: (item: any) => item.age > 26,
          sort: { key: "score", order: "desc" },
        },
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].name).toBe("Bob");
      expect(result.data[1].name).toBe("Charlie");
    });
  });

  describe("stringifyJson", () => {
    it("should stringify simple object", async () => {
      const data = { name: "John", age: 30 };

      const result = await agent.stringifyJson({ data });

      expect(result.success).toBe(true);
      expect(result.json).toBe('{"name":"John","age":30}');
    });

    it("should stringify with pretty formatting", async () => {
      const data = { name: "John", age: 30 };

      const result = await agent.stringifyJson({
        data,
        pretty: true,
      });

      expect(result.success).toBe(true);
      expect(result.json).toContain("\n");
      expect(result.json).toContain("  "); // Default 2-space indent
    });

    it("should use custom indentation", async () => {
      const data = { name: "John", age: 30 };

      const result = await agent.stringifyJson({
        data,
        pretty: true,
        indent: 4,
      });

      expect(result.success).toBe(true);
      expect(result.json).toContain("    "); // 4-space indent
    });

    it("should handle circular references gracefully", async () => {
      const data: any = { name: "John" };
      data.self = data; // Circular reference

      const result = await agent.stringifyJson({ data });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("mergeJson", () => {
    it("should merge multiple objects", async () => {
      const objects = [
        { name: "John", age: 30 },
        { city: "NYC", country: "USA" },
        { active: true },
      ];

      const result = await agent.mergeJson({ objects });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        name: "John",
        age: 30,
        city: "NYC",
        country: "USA",
        active: true,
      });
    });

    it("should override properties in order", async () => {
      const objects = [{ name: "John", age: 30 }, { age: 31 }];

      const result = await agent.mergeJson({ objects });

      expect(result.success).toBe(true);
      expect(result.data.age).toBe(31);
    });

    it("should deep merge nested objects", async () => {
      const objects = [
        { user: { name: "John", age: 30 } },
        { user: { city: "NYC" } },
      ];

      const result = await agent.mergeJson({
        objects,
        deep: true,
      });

      expect(result.success).toBe(true);
      expect(result.data.user).toEqual({
        name: "John",
        age: 30,
        city: "NYC",
      });
    });

    it("should merge arrays in deep mode", async () => {
      const objects = [{ items: [1, 2] }, { items: [3, 4] }];

      const result = await agent.mergeJson({
        objects,
        deep: true,
      });

      expect(result.success).toBe(true);
      expect(result.data.items).toEqual([1, 2, 3, 4]);
    });

    it("should handle empty objects array", async () => {
      const result = await agent.mergeJson({ objects: [] });

      expect(result.success).toBe(false);
      expect(result.error).toContain("non-empty array");
    });

    it("should handle single object", async () => {
      const result = await agent.mergeJson({
        objects: [{ name: "John" }],
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ name: "John" });
    });
  });

  describe("singleton instance", () => {
    it("should export jsonAgent singleton", () => {
      expect(jsonAgent).toBeInstanceOf(JsonAgent);
    });

    it("should work with singleton instance", async () => {
      const result = await jsonAgent.parseJson({
        input: '{"test":true}',
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ test: true });
    });
  });
});
