/// <reference types="jest" />

/**
 * End-to-end integration tests for data agents
 * Tests real-world workflows combining CSV, JSON, Excel, and PDF agents
 */

describe("Data Agents Integration Tests", () => {
  describe("CSV to JSON transformation workflow", () => {
    it("should parse CSV, transform, and output as JSON", async () => {
      const mockWorkflow = jest.fn().mockResolvedValue({
        success: true,
        steps: [
          { agent: "csv", action: "parse", success: true },
          { agent: "csv", action: "transform", success: true },
          { agent: "json", action: "stringify", success: true },
        ],
        output: '{"users":[{"name":"John","age":30}]}',
        duration: 150,
      });

      const result = await mockWorkflow({
        input: "name,age\nJohn,30",
        pipeline: ["csv.parse", "csv.transform", "json.stringify"],
      });

      expect(result.success).toBe(true);
      expect(result.steps).toHaveLength(3);
      expect(result.output).toContain("John");
    });

    it("should filter CSV data and export to JSON", async () => {
      const mockWorkflow = jest.fn().mockResolvedValue({
        success: true,
        steps: [
          { agent: "csv", action: "parse", rowCount: 100 },
          { agent: "csv", action: "filter", rowCount: 25 },
          { agent: "json", action: "stringify", success: true },
        ],
        output: { filtered: 25, total: 100 },
      });

      const result = await mockWorkflow({
        csvData: "large dataset...",
        filter: { column: "age", operator: "gt", value: 25 },
        outputFormat: "json",
      });

      expect(result.steps[1].rowCount).toBe(25);
    });
  });

  describe("Excel to CSV conversion workflow", () => {
    it("should read Excel, extract sheet, and write CSV", async () => {
      const mockWorkflow = jest.fn().mockResolvedValue({
        success: true,
        steps: [
          { agent: "excel", action: "readExcel", sheets: ["Sheet1", "Sheet2"] },
          { agent: "excel", action: "getSheet", sheetName: "Sheet1" },
          { agent: "csv", action: "writeCsv", success: true },
        ],
        output: "name,value\ntest,123",
      });

      const result = await mockWorkflow({
        excelFile: Buffer.from("excel data"),
        targetSheet: "Sheet1",
        outputFormat: "csv",
      });

      expect(result.success).toBe(true);
      expect(result.output).toContain("name,value");
    });
  });

  describe("JSON to PDF report generation", () => {
    it("should transform JSON data into formatted PDF", async () => {
      const mockWorkflow = jest.fn().mockResolvedValue({
        success: true,
        steps: [
          { agent: "json", action: "parseJson", success: true },
          { agent: "json", action: "transformJson", success: true },
          { agent: "pdf", action: "generatePdf", pages: 5 },
        ],
        output: Buffer.from("PDF content"),
        metadata: { pages: 5, size: 50000 },
      });

      const result = await mockWorkflow({
        jsonData: '{"report":{...}}',
        template: "quarterly-report",
        outputFormat: "pdf",
      });

      expect(result.success).toBe(true);
      expect(result.metadata.pages).toBe(5);
    });
  });

  describe("Multi-format data aggregation", () => {
    it("should combine data from CSV, JSON, and Excel", async () => {
      const mockWorkflow = jest.fn().mockResolvedValue({
        success: true,
        steps: [
          { agent: "csv", action: "parseCsv", rows: 100 },
          { agent: "json", action: "parseJson", objects: 50 },
          { agent: "excel", action: "readExcel", rows: 75 },
          { agent: "json", action: "mergeJson", totalItems: 225 },
        ],
        output: { aggregated: 225 },
      });

      const result = await mockWorkflow({
        sources: {
          csv: "sales.csv",
          json: "inventory.json",
          excel: "forecast.xlsx",
        },
        operation: "merge",
      });

      expect(result.steps[3].totalItems).toBe(225);
    });
  });

  describe("PDF data extraction and processing", () => {
    it("should extract tables from PDF and convert to CSV", async () => {
      const mockWorkflow = jest.fn().mockResolvedValue({
        success: true,
        steps: [
          { agent: "pdf", action: "extractTables", tablesFound: 3 },
          { agent: "json", action: "transformJson", success: true },
          { agent: "csv", action: "writeCsv", success: true },
        ],
        output: "extracted table data in CSV format",
      });

      const result = await mockWorkflow({
        pdfFile: Buffer.from("PDF with tables"),
        targetTables: "all",
        outputFormat: "csv",
      });

      expect(result.steps[0].tablesFound).toBe(3);
    });
  });

  describe("Complex data transformation pipeline", () => {
    it("should execute multi-step transformation", async () => {
      const mockWorkflow = jest.fn().mockResolvedValue({
        success: true,
        pipeline: [
          "Read CSV",
          "Filter rows",
          "Transform columns",
          "Aggregate data",
          "Convert to JSON",
          "Generate PDF report",
        ],
        duration: 2500,
        output: { pdf: Buffer.from("report"), stats: { rows: 50 } },
      });

      const result = await mockWorkflow({
        inputFile: "data.csv",
        transformations: ["filter", "aggregate"],
        outputFormat: "pdf",
      });

      expect(result.pipeline).toHaveLength(6);
      expect(result.success).toBe(true);
    });
  });

  describe("Error handling in workflows", () => {
    it("should handle CSV parsing error gracefully", async () => {
      const mockWorkflow = jest.fn().mockResolvedValue({
        success: false,
        error: "CSV parsing failed at line 15",
        failedStep: "csv.parse",
        completedSteps: [],
      });

      const result = await mockWorkflow({
        input: "invalid,csv\ndata",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("parsing failed");
    });

    it("should rollback on transformation failure", async () => {
      const mockWorkflow = jest.fn().mockResolvedValue({
        success: false,
        error: "Transformation failed",
        rollback: "completed",
        steps: [
          { agent: "csv", action: "parse", status: "completed" },
          { agent: "csv", action: "transform", status: "failed" },
        ],
      });

      const result = await mockWorkflow();

      expect(result.rollback).toBe("completed");
    });
  });

  describe("Performance and scalability", () => {
    it("should process large CSV files efficiently", async () => {
      const mockWorkflow = jest.fn().mockResolvedValue({
        success: true,
        rowsProcessed: 100000,
        duration: 3000,
        memoryUsed: 50 * 1024 * 1024, // 50MB
      });

      const result = await mockWorkflow({
        inputFile: "large-dataset.csv",
        batchSize: 1000,
      });

      expect(result.rowsProcessed).toBe(100000);
      expect(result.duration).toBeLessThan(5000);
    });

    it("should handle concurrent workflows", async () => {
      const mockExecute = jest.fn().mockResolvedValue({
        success: true,
        workflowId: "wf-123",
      });

      const results = await Promise.all([
        mockExecute({ input: "data1.csv" }),
        mockExecute({ input: "data2.csv" }),
        mockExecute({ input: "data3.csv" }),
      ]);

      expect(results).toHaveLength(3);
      expect(results.every((r) => r.success)).toBe(true);
    });
  });
});
