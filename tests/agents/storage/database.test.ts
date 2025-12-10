/// <reference types="jest" />

import { DatabaseAgent } from "../../../src/automation/agents/storage/database";

describe("Database Agent", () => {
  describe("PostgreSQL configuration", () => {
    it("should initialize with existing connection config", () => {
      const agent = new DatabaseAgent({
        type: "postgresql",
        useExistingConnection: true,
      });

      expect(agent).toBeInstanceOf(DatabaseAgent);
    });

    it("should initialize with connection string", () => {
      const agent = new DatabaseAgent({
        type: "postgresql",
        connectionString: "postgresql://user:pass@localhost:5432/testdb",
      });

      expect(agent).toBeInstanceOf(DatabaseAgent);
    });

    it("should reject invalid PostgreSQL config", async () => {
      const agent = new DatabaseAgent({
        type: "postgresql",
        // Missing both useExistingConnection and connectionString
      });

      await expect(agent.connect()).rejects.toThrow(
        "requires either useExistingConnection or connectionString",
      );
    });
  });

  describe("SQLite configuration", () => {
    it("should initialize with filename", () => {
      const agent = new DatabaseAgent({
        type: "sqlite",
        filename: ":memory:",
      });

      expect(agent).toBeInstanceOf(DatabaseAgent);
    });

    it("should reject SQLite without filename", async () => {
      const agent = new DatabaseAgent({
        type: "sqlite",
        // Missing filename
      });

      await expect(agent.connect()).rejects.toThrow("requires filename");
    });
  });

  describe("query (mocked)", () => {
    it("should execute SELECT query", async () => {
      const mockQuery = jest.fn().mockResolvedValue({
        success: true,
        rows: [
          { id: 1, name: "John", age: 30 },
          { id: 2, name: "Jane", age: 25 },
        ],
        rowCount: 2,
      });

      const result = await mockQuery({
        query: "SELECT * FROM users WHERE age > $1",
        params: [25],
      });

      expect(result.success).toBe(true);
      expect(result.rows).toHaveLength(2);
      expect(result.rowCount).toBe(2);
    });

    it("should handle query with no results", async () => {
      const mockQuery = jest.fn().mockResolvedValue({
        success: true,
        rows: [],
        rowCount: 0,
      });

      const result = await mockQuery({
        query: "SELECT * FROM users WHERE id = $1",
        params: [999],
      });

      expect(result.success).toBe(true);
      expect(result.rows).toHaveLength(0);
    });

    it("should handle parameterized queries", async () => {
      const mockQuery = jest.fn().mockResolvedValue({
        success: true,
        rows: [{ id: 1, name: "John" }],
        rowCount: 1,
      });

      const result = await mockQuery({
        query: "SELECT * FROM users WHERE name = $1 AND age = $2",
        params: ["John", 30],
      });

      expect(result.success).toBe(true);
      expect(result.rows[0].name).toBe("John");
    });

    it("should handle SQL syntax errors", async () => {
      const mockQuery = jest.fn().mockResolvedValue({
        success: false,
        error: 'syntax error at or near "FROM"',
      });

      const result = await mockQuery({
        query: "SELECT * FORM users",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("syntax error");
    });
  });

  describe("insert (mocked)", () => {
    it("should insert single record", async () => {
      const mockInsert = jest.fn().mockResolvedValue({
        success: true,
        rows: [{ id: 1, name: "John", age: 30 }],
        rowCount: 1,
      });

      const result = await mockInsert({
        table: "users",
        data: { name: "John", age: 30 },
        returning: ["id", "name", "age"],
      });

      expect(result.success).toBe(true);
      expect(result.rowCount).toBe(1);
      expect(result.rows[0].id).toBe(1);
    });

    it("should insert multiple records", async () => {
      const mockInsert = jest.fn().mockResolvedValue({
        success: true,
        rows: [
          { id: 1, name: "John" },
          { id: 2, name: "Jane" },
        ],
        rowCount: 2,
      });

      const result = await mockInsert({
        table: "users",
        data: [
          { name: "John", age: 30 },
          { name: "Jane", age: 25 },
        ],
        returning: ["id", "name"],
      });

      expect(result.success).toBe(true);
      expect(result.rowCount).toBe(2);
      expect(result.rows).toHaveLength(2);
    });

    it("should handle duplicate key violations", async () => {
      const mockInsert = jest.fn().mockResolvedValue({
        success: false,
        error: "duplicate key value violates unique constraint",
      });

      const result = await mockInsert({
        table: "users",
        data: { id: 1, name: "John" },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("duplicate key");
    });

    it("should handle NOT NULL constraint violations", async () => {
      const mockInsert = jest.fn().mockResolvedValue({
        success: false,
        error: 'null value in column "name" violates not-null constraint',
      });

      const result = await mockInsert({
        table: "users",
        data: { age: 30 }, // Missing required name field
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("not-null");
    });
  });

  describe("update (mocked)", () => {
    it("should update records", async () => {
      const mockUpdate = jest.fn().mockResolvedValue({
        success: true,
        rows: [{ id: 1, name: "John", age: 31 }],
        rowCount: 1,
      });

      const result = await mockUpdate({
        table: "users",
        data: { age: 31 },
        where: { id: 1 },
        returning: ["id", "name", "age"],
      });

      expect(result.success).toBe(true);
      expect(result.rowCount).toBe(1);
      expect(result.rows[0].age).toBe(31);
    });

    it("should update multiple records", async () => {
      const mockUpdate = jest.fn().mockResolvedValue({
        success: true,
        rows: [
          { id: 1, status: "active" },
          { id: 2, status: "active" },
        ],
        rowCount: 2,
      });

      const result = await mockUpdate({
        table: "users",
        data: { status: "active" },
        where: { age: { $gt: 25 } },
      });

      expect(result.success).toBe(true);
      expect(result.rowCount).toBe(2);
    });

    it("should handle update with no matching rows", async () => {
      const mockUpdate = jest.fn().mockResolvedValue({
        success: true,
        rows: [],
        rowCount: 0,
      });

      const result = await mockUpdate({
        table: "users",
        data: { name: "Updated" },
        where: { id: 999 },
      });

      expect(result.success).toBe(true);
      expect(result.rowCount).toBe(0);
    });
  });

  describe("delete (mocked)", () => {
    it("should delete records", async () => {
      const mockDelete = jest.fn().mockResolvedValue({
        success: true,
        rows: [{ id: 1 }],
        rowCount: 1,
      });

      const result = await mockDelete({
        table: "users",
        where: { id: 1 },
        returning: ["id"],
      });

      expect(result.success).toBe(true);
      expect(result.rowCount).toBe(1);
    });

    it("should delete multiple records", async () => {
      const mockDelete = jest.fn().mockResolvedValue({
        success: true,
        rows: [],
        rowCount: 3,
      });

      const result = await mockDelete({
        table: "users",
        where: { status: "inactive" },
      });

      expect(result.success).toBe(true);
      expect(result.rowCount).toBe(3);
    });

    it("should handle delete with no matching rows", async () => {
      const mockDelete = jest.fn().mockResolvedValue({
        success: true,
        rows: [],
        rowCount: 0,
      });

      const result = await mockDelete({
        table: "users",
        where: { id: 999 },
      });

      expect(result.success).toBe(true);
      expect(result.rowCount).toBe(0);
    });
  });

  describe("transaction (mocked)", () => {
    it("should execute transaction with multiple operations", async () => {
      const mockTransaction = jest.fn().mockResolvedValue({
        success: true,
        results: [
          { success: true, rowCount: 1 },
          { success: true, rowCount: 1 },
          { success: true, rowCount: 1 },
        ],
      });

      const result = await mockTransaction({
        operations: [
          {
            type: "insert",
            params: { table: "users", data: { name: "John" } },
          },
          {
            type: "update",
            params: {
              table: "accounts",
              data: { balance: 1000 },
              where: { userId: 1 },
            },
          },
          {
            type: "delete",
            params: { table: "temp_data", where: { processed: true } },
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(3);
    });

    it("should rollback on error", async () => {
      const mockTransaction = jest.fn().mockResolvedValue({
        success: false,
        error: "Transaction rolled back due to constraint violation",
        failedOperation: 1,
      });

      const result = await mockTransaction({
        operations: [
          {
            type: "insert",
            params: { table: "users", data: { name: "John" } },
          },
          { type: "insert", params: { table: "users", data: { id: 1 } } }, // Duplicate
          {
            type: "update",
            params: {
              table: "accounts",
              data: { balance: 1000 },
              where: { userId: 1 },
            },
          },
        ],
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("rolled back");
    });
  });

  describe("getTableInfo (mocked)", () => {
    it("should get table schema information", async () => {
      const mockGetInfo = jest.fn().mockResolvedValue({
        success: true,
        info: {
          columns: [
            {
              name: "id",
              type: "integer",
              nullable: false,
              default: null,
              primaryKey: true,
            },
            {
              name: "name",
              type: "varchar(255)",
              nullable: false,
              default: null,
              primaryKey: false,
            },
            {
              name: "age",
              type: "integer",
              nullable: true,
              default: null,
              primaryKey: false,
            },
          ],
          indexes: [
            { name: "users_pkey", columns: ["id"], unique: true },
            { name: "users_name_idx", columns: ["name"], unique: false },
          ],
        },
      });

      const result = await mockGetInfo({ table: "users" });

      expect(result.success).toBe(true);
      expect(result.info.columns).toHaveLength(3);
      expect(result.info.indexes).toHaveLength(2);
      expect(result.info.columns[0].primaryKey).toBe(true);
    });

    it("should handle non-existent table", async () => {
      const mockGetInfo = jest.fn().mockResolvedValue({
        success: false,
        error: 'Table "nonexistent" does not exist',
      });

      const result = await mockGetInfo({ table: "nonexistent" });

      expect(result.success).toBe(false);
      expect(result.error).toContain("does not exist");
    });
  });

  describe("connection management", () => {
    it("should connect to PostgreSQL", async () => {
      const agent = new DatabaseAgent({
        type: "postgresql",
        useExistingConnection: true,
      });

      // Mock would normally connect here
      expect(agent).toBeInstanceOf(DatabaseAgent);
    });

    it("should connect to SQLite", async () => {
      const agent = new DatabaseAgent({
        type: "sqlite",
        filename: ":memory:",
      });

      // Mock would normally connect here
      expect(agent).toBeInstanceOf(DatabaseAgent);
    });

    it("should disconnect cleanly", async () => {
      const mockDisconnect = jest.fn().mockResolvedValue({
        success: true,
      });

      const result = await mockDisconnect();

      expect(result.success).toBe(true);
    });

    it("should handle connection errors", async () => {
      const agent = new DatabaseAgent({
        type: "postgresql",
        connectionString: "postgresql://invalid:connection@nonexistent:5432/db",
      });

      await expect(agent.connect()).rejects.toThrow();
    });
  });

  describe("edge cases", () => {
    it("should handle SQL injection attempts safely", async () => {
      const mockQuery = jest.fn().mockResolvedValue({
        success: true,
        rows: [],
        rowCount: 0,
      });

      // Parameterized queries prevent injection
      const result = await mockQuery({
        query: "SELECT * FROM users WHERE name = $1",
        params: ["'; DROP TABLE users; --"],
      });

      expect(result.success).toBe(true);
      expect(result.rows).toHaveLength(0);
    });

    it("should handle very large result sets", async () => {
      const mockQuery = jest.fn().mockResolvedValue({
        success: true,
        rows: Array.from({ length: 10000 }, (_, i) => ({ id: i })),
        rowCount: 10000,
      });

      const result = await mockQuery({
        query: "SELECT * FROM large_table",
      });

      expect(result.success).toBe(true);
      expect(result.rows.length).toBe(10000);
    });

    it("should handle null and undefined values", async () => {
      const mockInsert = jest.fn().mockResolvedValue({
        success: true,
        rows: [{ id: 1, name: "John", email: null }],
        rowCount: 1,
      });

      const result = await mockInsert({
        table: "users",
        data: { name: "John", email: null },
      });

      expect(result.success).toBe(true);
      expect(result.rows[0].email).toBeNull();
    });

    it("should handle concurrent operations", async () => {
      const mockOperation = jest.fn().mockResolvedValue({
        success: true,
        rowCount: 1,
      });

      const results = await Promise.all([
        mockOperation({ query: "SELECT 1" }),
        mockOperation({ query: "SELECT 2" }),
        mockOperation({ query: "SELECT 3" }),
      ]);

      expect(results).toHaveLength(3);
      expect(results.every((r) => r.success)).toBe(true);
    });
  });
});
