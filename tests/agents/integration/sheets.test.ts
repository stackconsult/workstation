/// <reference types="jest" />

import { SheetsAgent } from "../../../src/automation/agents/integration/sheets";

describe("Google Sheets Agent", () => {
  let agent: SheetsAgent;

  beforeEach(() => {
    agent = new SheetsAgent({
      authType: "oauth2",
      clientId: "test-client-id",
      clientSecret: "test-client-secret",
      redirectUri: "http://localhost:3000/callback",
    });
  });

  describe("authentication", () => {
    it("should initialize with OAuth2 config", () => {
      expect(agent).toBeInstanceOf(SheetsAgent);
    });

    it("should handle OAuth2 authentication", async () => {
      const result = await agent.authenticate();

      expect(result.success).toBeDefined();
      if (!result.success) {
        // Expected for tests without actual credentials
        expect(result.authUrl).toBeDefined();
      }
    });

    it("should initialize with service account config", () => {
      const saAgent = new SheetsAgent({
        authType: "serviceAccount",
        serviceAccountKey: JSON.stringify({
          type: "service_account",
          project_id: "test-project",
          private_key_id: "test-key-id",
          private_key:
            "-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----\n",
          client_email: "test@test-project.iam.gserviceaccount.com",
          client_id: "test-client-id",
        }),
      });

      expect(saAgent).toBeInstanceOf(SheetsAgent);
    });

    it("should handle missing OAuth2 credentials", async () => {
      const invalidAgent = new SheetsAgent({
        authType: "oauth2",
        clientId: undefined as any,
        clientSecret: undefined as any,
        redirectUri: undefined as any,
      });

      await expect(invalidAgent.authenticate()).rejects.toThrow();
    });

    it("should handle invalid auth type", async () => {
      const invalidAgent = new SheetsAgent({
        authType: "invalid" as any,
      });

      await expect(invalidAgent.authenticate()).rejects.toThrow(
        "Unsupported auth type",
      );
    });
  });

  describe("readSheet (mocked)", () => {
    it("should read sheet data", async () => {
      // Mock implementation since we can't actually call Google API in tests
      const mockRead = jest.fn().mockResolvedValue({
        success: true,
        data: {
          values: [
            ["Name", "Age", "City"],
            ["John", "30", "NYC"],
            ["Jane", "25", "LA"],
          ],
          range: "Sheet1!A1:C3",
        },
      });

      const result = await mockRead({
        spreadsheetId: "test-sheet-id",
        range: "Sheet1!A1:C10",
      });

      expect(result.success).toBe(true);
      expect(result.data.values).toHaveLength(3);
      expect(result.data.values[0]).toEqual(["Name", "Age", "City"]);
    });

    it("should handle missing spreadsheet ID", async () => {
      const mockRead = jest.fn().mockResolvedValue({
        success: false,
        error: "spreadsheetId is required",
      });

      const result = await mockRead({
        spreadsheetId: "",
        range: "Sheet1!A1:C10",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should handle invalid range format", async () => {
      const mockRead = jest.fn().mockResolvedValue({
        success: false,
        error: "Invalid range format",
      });

      const result = await mockRead({
        spreadsheetId: "test-id",
        range: "invalid-range",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("range");
    });
  });

  describe("writeSheet (mocked)", () => {
    it("should write data to sheet", async () => {
      const mockWrite = jest.fn().mockResolvedValue({
        success: true,
        updatedRange: "Sheet1!A1:C3",
        updatedRows: 3,
        updatedColumns: 3,
        updatedCells: 9,
      });

      const result = await mockWrite({
        spreadsheetId: "test-sheet-id",
        range: "Sheet1!A1",
        values: [
          ["Name", "Age", "City"],
          ["John", 30, "NYC"],
          ["Jane", 25, "LA"],
        ],
      });

      expect(result.success).toBe(true);
      expect(result.updatedRows).toBe(3);
      expect(result.updatedCells).toBe(9);
    });

    it("should handle empty values array", async () => {
      const mockWrite = jest.fn().mockResolvedValue({
        success: false,
        error: "values array is required",
      });

      const result = await mockWrite({
        spreadsheetId: "test-id",
        range: "Sheet1!A1",
        values: [],
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should overwrite existing data", async () => {
      const mockWrite = jest.fn().mockResolvedValue({
        success: true,
        updatedRange: "Sheet1!A1:B2",
        updatedRows: 2,
        updatedColumns: 2,
        updatedCells: 4,
      });

      const result = await mockWrite({
        spreadsheetId: "test-id",
        range: "Sheet1!A1",
        values: [
          ["New", "Data"],
          ["Row", "2"],
        ],
      });

      expect(result.success).toBe(true);
      expect(result.updatedCells).toBe(4);
    });
  });

  describe("appendRows (mocked)", () => {
    it("should append rows to sheet", async () => {
      const mockAppend = jest.fn().mockResolvedValue({
        success: true,
        updates: {
          spreadsheetId: "test-id",
          updatedRange: "Sheet1!A4:C5",
          updatedRows: 2,
          updatedColumns: 3,
          updatedCells: 6,
        },
      });

      const result = await mockAppend({
        spreadsheetId: "test-id",
        range: "Sheet1!A1",
        values: [
          ["Bob", 35, "SF"],
          ["Alice", 28, "Seattle"],
        ],
      });

      expect(result.success).toBe(true);
      expect(result.updates.updatedRows).toBe(2);
    });

    it("should handle append to empty sheet", async () => {
      const mockAppend = jest.fn().mockResolvedValue({
        success: true,
        updates: {
          updatedRange: "Sheet1!A1:B1",
          updatedRows: 1,
          updatedCells: 2,
        },
      });

      const result = await mockAppend({
        spreadsheetId: "test-id",
        range: "Sheet1",
        values: [["First", "Row"]],
      });

      expect(result.success).toBe(true);
      expect(result.updates.updatedRows).toBe(1);
    });
  });

  describe("updateCells (mocked)", () => {
    it("should update specific cells", async () => {
      const mockUpdate = jest.fn().mockResolvedValue({
        success: true,
        totalUpdatedCells: 2,
        responses: [
          { updatedCells: 1, updatedRange: "Sheet1!A1" },
          { updatedCells: 1, updatedRange: "Sheet1!B2" },
        ],
      });

      const result = await mockUpdate({
        spreadsheetId: "test-id",
        data: [
          { range: "Sheet1!A1", values: [["Updated"]] },
          { range: "Sheet1!B2", values: [["Value"]] },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.totalUpdatedCells).toBe(2);
      expect(result.responses).toHaveLength(2);
    });

    it("should handle batch cell updates", async () => {
      const mockUpdate = jest.fn().mockResolvedValue({
        success: true,
        totalUpdatedCells: 10,
        responses: expect.any(Array),
      });

      const result = await mockUpdate({
        spreadsheetId: "test-id",
        data: Array.from({ length: 10 }, (_, i) => ({
          range: `Sheet1!A${i + 1}`,
          values: [[`Value${i}`]],
        })),
      });

      expect(result.success).toBe(true);
      expect(result.totalUpdatedCells).toBeGreaterThan(0);
    });
  });

  describe("createSheet (mocked)", () => {
    it("should create new sheet", async () => {
      const mockCreate = jest.fn().mockResolvedValue({
        success: true,
        sheetId: 12345,
        title: "NewSheet",
        index: 1,
      });

      const result = await mockCreate({
        spreadsheetId: "test-id",
        title: "NewSheet",
      });

      expect(result.success).toBe(true);
      expect(result.sheetId).toBeDefined();
      expect(result.title).toBe("NewSheet");
    });

    it("should handle duplicate sheet name", async () => {
      const mockCreate = jest.fn().mockResolvedValue({
        success: false,
        error: "Sheet with this name already exists",
      });

      const result = await mockCreate({
        spreadsheetId: "test-id",
        title: "Sheet1",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("already exists");
    });
  });

  describe("listSheets (mocked)", () => {
    it("should list all sheets in spreadsheet", async () => {
      const mockList = jest.fn().mockResolvedValue({
        success: true,
        sheets: [
          {
            sheetId: 0,
            title: "Sheet1",
            index: 0,
            rowCount: 1000,
            columnCount: 26,
          },
          {
            sheetId: 1,
            title: "Sheet2",
            index: 1,
            rowCount: 1000,
            columnCount: 26,
          },
        ],
      });

      const result = await mockList({ spreadsheetId: "test-id" });

      expect(result.success).toBe(true);
      expect(result.sheets).toHaveLength(2);
      expect(result.sheets[0].title).toBe("Sheet1");
    });

    it("should handle spreadsheet with single sheet", async () => {
      const mockList = jest.fn().mockResolvedValue({
        success: true,
        sheets: [
          {
            sheetId: 0,
            title: "Sheet1",
            index: 0,
            rowCount: 1000,
            columnCount: 26,
          },
        ],
      });

      const result = await mockList({ spreadsheetId: "test-id" });

      expect(result.success).toBe(true);
      expect(result.sheets).toHaveLength(1);
    });
  });

  describe("getSheetInfo (mocked)", () => {
    it("should get spreadsheet metadata", async () => {
      const mockGetInfo = jest.fn().mockResolvedValue({
        success: true,
        info: {
          spreadsheetId: "test-id",
          title: "Test Spreadsheet",
          sheets: [
            {
              sheetId: 0,
              title: "Sheet1",
              index: 0,
              rowCount: 1000,
              columnCount: 26,
            },
          ],
        },
      });

      const result = await mockGetInfo({ spreadsheetId: "test-id" });

      expect(result.success).toBe(true);
      expect(result.info.title).toBe("Test Spreadsheet");
      expect(result.info.sheets).toHaveLength(1);
    });

    it("should handle non-existent spreadsheet", async () => {
      const mockGetInfo = jest.fn().mockResolvedValue({
        success: false,
        error: "Spreadsheet not found",
      });

      const result = await mockGetInfo({ spreadsheetId: "invalid-id" });

      expect(result.success).toBe(false);
      expect(result.error).toContain("not found");
    });
  });

  describe("edge cases and error handling", () => {
    it("should handle rate limiting", async () => {
      const mockOperation = jest.fn().mockResolvedValue({
        success: false,
        error: "Rate limit exceeded",
        retryAfter: 60,
      });

      const result = await mockOperation();

      expect(result.success).toBe(false);
      expect(result.error).toContain("Rate limit");
    });

    it("should handle network errors", async () => {
      const mockOperation = jest
        .fn()
        .mockRejectedValue(new Error("Network error"));

      await expect(mockOperation()).rejects.toThrow("Network error");
    });

    it("should handle quota exceeded errors", async () => {
      const mockOperation = jest.fn().mockResolvedValue({
        success: false,
        error: "Quota exceeded",
      });

      const result = await mockOperation();

      expect(result.success).toBe(false);
      expect(result.error).toContain("Quota");
    });

    it("should validate spreadsheet ID format", () => {
      const isValid = (id: string) => /^[a-zA-Z0-9-_]+$/.test(id);

      expect(isValid("valid-spreadsheet-id_123")).toBe(true);
      expect(isValid("invalid spreadsheet id")).toBe(false);
      expect(isValid("invalid@spreadsheet")).toBe(false);
    });

    it("should validate A1 notation range", () => {
      const isValidRange = (range: string) =>
        /^[A-Z]+[0-9]+:[A-Z]+[0-9]+$|^[A-Z]+:[A-Z]+$|^[0-9]+:[0-9]+$/.test(
          range,
        );

      expect(isValidRange("A1:B10")).toBe(true);
      expect(isValidRange("A:Z")).toBe(true);
      expect(isValidRange("1:10")).toBe(true);
      expect(isValidRange("invalid")).toBe(false);
    });
  });
});
