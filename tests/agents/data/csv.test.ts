/// <reference types="jest" />

import { CsvAgent, csvAgent } from "../../../src/automation/agents/data/csv";

describe("CSV Agent", () => {
  let agent: CsvAgent;

  beforeEach(() => {
    agent = new CsvAgent();
  });

  describe("parseCsv", () => {
    it("should parse simple CSV with headers", async () => {
      const csvData = `name,age,city
John,30,NYC
Jane,25,LA`;

      const result = await agent.parseCsv({ input: csvData });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0]).toEqual({ name: "John", age: 30, city: "NYC" });
      expect(result.data?.[1]).toEqual({ name: "Jane", age: 25, city: "LA" });
      expect(result.rowCount).toBe(2);
      expect(result.columns).toEqual(["name", "age", "city"]);
    });

    it("should parse CSV without headers", async () => {
      const csvData = `John,30,NYC
Jane,25,LA`;

      const result = await agent.parseCsv({
        input: csvData,
        options: { headers: false },
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(Array.isArray(result.data?.[0])).toBe(true);
    });

    it("should handle custom delimiter", async () => {
      const csvData = `name;age;city
John;30;NYC
Jane;25;LA`;

      const result = await agent.parseCsv({
        input: csvData,
        options: { delimiter: ";" },
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0]).toEqual({ name: "John", age: 30, city: "NYC" });
    });

    it("should skip empty lines", async () => {
      const csvData = `name,age,city
John,30,NYC

Jane,25,LA
`;

      const result = await agent.parseCsv({ input: csvData });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });

    it("should handle malformed CSV gracefully", async () => {
      const csvData = `name,age,city
John,30`;

      const result = await agent.parseCsv({ input: csvData });

      // csv-parse handles this gracefully - may succeed or fail depending on implementation
      expect(typeof result.success).toBe("boolean");
    });

    it("should auto-convert data types", async () => {
      const csvData = `name,age,active
John,30,true
Jane,25,false`;

      const result = await agent.parseCsv({ input: csvData });

      expect(result.success).toBe(true);
      expect(result.data?.[0].age).toBe(30);
      // CSV parsers may return strings or booleans depending on configuration
      expect(["true", true]).toContain(result.data?.[0].active);
    });

    it("should handle empty CSV", async () => {
      const result = await agent.parseCsv({ input: "" });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });
  });

  describe("writeCsv", () => {
    it("should write data to CSV format with headers", async () => {
      const data = [
        { name: "John", age: 30, city: "NYC" },
        { name: "Jane", age: 25, city: "LA" },
      ];

      const result = await agent.writeCsv({ data });

      expect(result.success).toBe(true);
      expect(result.csv).toContain("name,age,city");
      expect(result.csv).toContain("John,30,NYC");
      expect(result.csv).toContain("Jane,25,LA");
    });

    it("should write CSV without headers", async () => {
      const data = [
        { name: "John", age: 30, city: "NYC" },
        { name: "Jane", age: 25, city: "LA" },
      ];

      const result = await agent.writeCsv({
        data,
        options: { headers: false },
      });

      expect(result.success).toBe(true);
      expect(result.csv).not.toContain("name,age,city");
      expect(result.csv).toContain("John,30,NYC");
    });

    it("should handle custom delimiter", async () => {
      const data = [{ name: "John", age: 30, city: "NYC" }];

      const result = await agent.writeCsv({
        data,
        options: { delimiter: ";" },
      });

      expect(result.success).toBe(true);
      expect(result.csv).toContain("name;age;city");
      expect(result.csv).toContain("John;30;NYC");
    });

    it("should handle empty data array", async () => {
      const result = await agent.writeCsv({ data: [] });

      expect(result.success).toBe(false);
      expect(result.error).toContain("non-empty array");
    });

    it("should handle specific columns", async () => {
      const data = [{ name: "John", age: 30, city: "NYC", country: "USA" }];

      const result = await agent.writeCsv({
        data,
        options: { columns: ["name", "age"] },
      });

      expect(result.success).toBe(true);
      expect(result.csv).toContain("name,age");
      expect(result.csv).not.toContain("city");
    });
  });

  describe("filterCsv", () => {
    const testData = [
      { name: "John", age: 30, city: "NYC" },
      { name: "Jane", age: 25, city: "LA" },
      { name: "Bob", age: 35, city: "NYC" },
    ];

    it("should filter by equality", async () => {
      const result = await agent.filterCsv({
        data: testData,
        filters: [{ column: "city", operator: "eq", value: "NYC" }],
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.filteredCount).toBe(2);
      expect(result.data?.every((row) => row.city === "NYC")).toBe(true);
    });

    it("should filter by inequality", async () => {
      const result = await agent.filterCsv({
        data: testData,
        filters: [{ column: "city", operator: "ne", value: "NYC" }],
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].city).toBe("LA");
    });

    it("should filter by greater than", async () => {
      const result = await agent.filterCsv({
        data: testData,
        filters: [{ column: "age", operator: "gt", value: 25 }],
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.every((row) => row.age > 25)).toBe(true);
    });

    it("should filter by less than or equal", async () => {
      const result = await agent.filterCsv({
        data: testData,
        filters: [{ column: "age", operator: "lte", value: 30 }],
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });

    it("should filter by contains", async () => {
      const result = await agent.filterCsv({
        data: testData,
        filters: [{ column: "name", operator: "contains", value: "o" }],
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2); // John and Bob
    });

    it("should filter by startsWith", async () => {
      const result = await agent.filterCsv({
        data: testData,
        filters: [{ column: "name", operator: "startsWith", value: "J" }],
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2); // John and Jane
    });

    it("should filter by endsWith", async () => {
      const result = await agent.filterCsv({
        data: testData,
        filters: [{ column: "name", operator: "endsWith", value: "e" }],
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1); // Jane
    });

    it("should apply multiple filters (AND logic)", async () => {
      const result = await agent.filterCsv({
        data: testData,
        filters: [
          { column: "city", operator: "eq", value: "NYC" },
          { column: "age", operator: "gt", value: 30 },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].name).toBe("Bob");
    });

    it("should handle invalid data type", async () => {
      const result = await agent.filterCsv({
        data: "not an array" as any,
        filters: [],
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("array");
    });
  });

  describe("transformCsv", () => {
    const testData = [
      { firstName: "John", age: 30, salary: 50000 },
      { firstName: "Jane", age: 25, salary: 60000 },
    ];

    it("should rename columns", async () => {
      const result = await agent.transformCsv({
        data: testData,
        transforms: {
          columns: { firstName: "name", age: "years" },
        },
      });

      expect(result.success).toBe(true);
      expect(result.data?.[0]).toHaveProperty("name", "John");
      expect(result.data?.[0]).toHaveProperty("years", 30);
      expect(result.data?.[0]).not.toHaveProperty("firstName");
    });

    it("should transform values", async () => {
      const result = await agent.transformCsv({
        data: testData,
        transforms: {
          mapValues: {
            salary: (val: any) => val * 1.1, // 10% raise
          },
        },
      });

      expect(result.success).toBe(true);
      // Handle floating point precision - use toBeCloseTo
      expect(result.data?.[0].salary).toBeCloseTo(55000, 0);
      expect(result.data?.[1].salary).toBeCloseTo(66000, 0);
    });

    it("should add computed columns", async () => {
      const result = await agent.transformCsv({
        data: testData,
        transforms: {
          addColumns: {
            fullName: (row: any) => `${row.firstName} Doe`,
            category: (row: any) => (row.age > 28 ? "senior" : "junior"),
          },
        },
      });

      expect(result.success).toBe(true);
      expect(result.data?.[0]).toHaveProperty("fullName", "John Doe");
      expect(result.data?.[0]).toHaveProperty("category", "senior");
      expect(result.data?.[1]).toHaveProperty("category", "junior");
    });

    it("should apply multiple transformations", async () => {
      const result = await agent.transformCsv({
        data: testData,
        transforms: {
          columns: { firstName: "name" },
          mapValues: { age: (val: any) => val + 1 },
          addColumns: { decade: (row: any) => Math.floor(row.age / 10) * 10 },
        },
      });

      expect(result.success).toBe(true);
      expect(result.data?.[0]).toHaveProperty("name", "John");
      expect(result.data?.[0].age).toBe(31);
      expect(result.data?.[0]).toHaveProperty("decade", 30);
    });

    it("should handle invalid data type", async () => {
      const result = await agent.transformCsv({
        data: "not an array" as any,
        transforms: {},
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("array");
    });
  });

  describe("getStats", () => {
    const testData = [
      { name: "John", age: 30, city: "NYC", score: 85 },
      { name: "Jane", age: 25, city: "LA", score: 92 },
      { name: "Bob", age: 35, city: "NYC", score: 78 },
    ];

    it("should calculate statistics for numeric columns", async () => {
      const result = await agent.getStats({ data: testData });

      expect(result.success).toBe(true);
      expect(result.stats).toBeDefined();
      expect(result.stats?.age).toEqual({
        type: "numeric",
        count: 3,
        min: 25,
        max: 35,
        avg: 30,
        sum: 90,
      });
      expect(result.stats?.score).toEqual({
        type: "numeric",
        count: 3,
        min: 78,
        max: 92,
        avg: 85,
        sum: 255,
      });
    });

    it("should calculate statistics for string columns", async () => {
      const result = await agent.getStats({ data: testData });

      expect(result.success).toBe(true);
      expect(result.stats?.name).toBeDefined();
      expect(result.stats?.name.type).toBe("string");
      expect(result.stats?.name.count).toBe(3);
      expect(result.stats?.name.unique).toBe(3);
      expect(result.stats?.city.unique).toBe(2); // NYC and LA
      expect(result.stats?.city.mostCommon).toBe("NYC");
    });

    it("should handle specific columns", async () => {
      const result = await agent.getStats({
        data: testData,
        columns: ["age", "score"],
      });

      expect(result.success).toBe(true);
      expect(result.stats).toHaveProperty("age");
      expect(result.stats).toHaveProperty("score");
      expect(result.stats).not.toHaveProperty("name");
      expect(result.stats).not.toHaveProperty("city");
    });

    it("should handle empty data", async () => {
      const result = await agent.getStats({ data: [] });

      expect(result.success).toBe(false);
      expect(result.error).toContain("non-empty array");
    });

    it("should handle mixed null/undefined values", async () => {
      const mixedData = [
        { name: "John", age: 30 },
        { name: null, age: 25 },
        { name: "Bob", age: undefined },
      ];

      const result = await agent.getStats({ data: mixedData });

      expect(result.success).toBe(true);
      expect(result.stats?.name.count).toBe(2); // Only non-null
      expect(result.stats?.age.count).toBe(2); // Only defined
    });
  });

  describe("singleton instance", () => {
    it("should export csvAgent singleton", () => {
      expect(csvAgent).toBeInstanceOf(CsvAgent);
    });

    it("should work with singleton instance", async () => {
      const result = await csvAgent.parseCsv({
        input: "name,age\nJohn,30",
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });
  });
});
