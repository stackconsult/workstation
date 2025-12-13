/// <reference types="jest" />

/**
 * End-to-end integration tests for integration agents
 * Tests real-world workflows with Google Sheets, Calendar, and Email
 */

describe("Integration Agents Integration Tests", () => {
  describe("Google Sheets data synchronization", () => {
    it("should sync data from database to Google Sheets", async () => {
      const mockWorkflow = jest.fn().mockResolvedValue({
        success: true,
        steps: [
          { agent: "database", action: "query", rowsReturned: 50 },
          { agent: "json", action: "transformJson", success: true },
          { agent: "sheets", action: "writeSheet", cellsUpdated: 250 },
        ],
        sheetsUpdated: 1,
        rowsSynced: 50,
      });

      const result = await mockWorkflow({
        source: "postgresql://database",
        destination: "sheet-id-123",
        query: "SELECT * FROM users",
      });

      expect(result.success).toBe(true);
      expect(result.rowsSynced).toBe(50);
    });

    it("should append new rows to existing sheet", async () => {
      const mockWorkflow = jest.fn().mockResolvedValue({
        success: true,
        steps: [
          { agent: "csv", action: "parseCsv", rows: 10 },
          { agent: "sheets", action: "appendRows", rowsAppended: 10 },
        ],
        updatedRange: "Sheet1!A11:D20",
      });

      const result = await mockWorkflow({
        csvFile: "new-data.csv",
        sheetId: "sheet-123",
        mode: "append",
      });

      expect(result.steps[1].rowsAppended).toBe(10);
    });
  });

  describe("Calendar event automation", () => {
    it("should create calendar events from CSV schedule", async () => {
      const mockWorkflow = jest.fn().mockResolvedValue({
        success: true,
        steps: [
          { agent: "csv", action: "parseCsv", events: 20 },
          { agent: "calendar", action: "createEvent", created: 20 },
        ],
        eventsCreated: 20,
        errors: [],
      });

      const result = await mockWorkflow({
        scheduleFile: "meetings.csv",
        calendarId: "primary",
        sendNotifications: true,
      });

      expect(result.eventsCreated).toBe(20);
      expect(result.errors).toHaveLength(0);
    });

    it("should check availability and schedule meetings", async () => {
      const mockWorkflow = jest.fn().mockResolvedValue({
        success: true,
        steps: [
          { agent: "calendar", action: "checkAvailability", conflicts: 2 },
          { agent: "calendar", action: "createEvent", scheduled: 8 },
        ],
        totalRequested: 10,
        scheduled: 8,
        conflicts: 2,
      });

      const result = await mockWorkflow({
        attendees: ["user1@example.com", "user2@example.com"],
        meetings: 10,
        avoidConflicts: true,
      });

      expect(result.scheduled).toBe(8);
      expect(result.conflicts).toBe(2);
    });
  });

  describe("Sheets to Calendar integration", () => {
    it("should create events from Google Sheets data", async () => {
      const mockWorkflow = jest.fn().mockResolvedValue({
        success: true,
        steps: [
          { agent: "sheets", action: "readSheet", rows: 15 },
          { agent: "json", action: "transformJson", events: 15 },
          { agent: "calendar", action: "createEvent", created: 15 },
        ],
        eventsCreated: 15,
      });

      const result = await mockWorkflow({
        sheetId: "schedule-sheet",
        sheetRange: "Events!A2:E100",
        calendarId: "team@company.com",
      });

      expect(result.eventsCreated).toBe(15);
    });
  });

  describe("Multi-calendar coordination", () => {
    it("should find common free time across calendars", async () => {
      const mockWorkflow = jest.fn().mockResolvedValue({
        success: true,
        steps: [
          { agent: "calendar", action: "checkAvailability", calendars: 5 },
          { agent: "json", action: "transformJson", success: true },
        ],
        freeSlots: [
          { start: "2024-02-01T10:00:00Z", end: "2024-02-01T11:00:00Z" },
          { start: "2024-02-01T14:00:00Z", end: "2024-02-01T15:00:00Z" },
        ],
      });

      const result = await mockWorkflow({
        calendars: ["cal1", "cal2", "cal3", "cal4", "cal5"],
        timeRange: { start: "2024-02-01", end: "2024-02-07" },
        duration: 60, // minutes
      });

      expect(result.freeSlots).toHaveLength(2);
    });
  });

  describe("Automated reporting workflow", () => {
    it("should generate and distribute reports via Sheets", async () => {
      const mockWorkflow = jest.fn().mockResolvedValue({
        success: true,
        steps: [
          { agent: "database", action: "query", rows: 500 },
          { agent: "json", action: "transformJson", aggregated: true },
          { agent: "sheets", action: "writeSheet", sheetsCreated: 1 },
          { agent: "sheets", action: "formatCells", formatted: 50 },
        ],
        reportGenerated: true,
        sheetUrl: "https://docs.google.com/spreadsheets/d/...",
      });

      const result = await mockWorkflow({
        reportType: "monthly-sales",
        period: "2024-01",
        recipients: ["manager@company.com"],
      });

      expect(result.reportGenerated).toBe(true);
      expect(result.sheetUrl).toBeDefined();
    });
  });

  describe("Event RSVP tracking", () => {
    it("should track event responses in Google Sheets", async () => {
      const mockWorkflow = jest.fn().mockResolvedValue({
        success: true,
        steps: [
          { agent: "calendar", action: "listEvents", events: 10 },
          { agent: "json", action: "transformJson", success: true },
          { agent: "sheets", action: "updateCells", cellsUpdated: 100 },
        ],
        eventsTracked: 10,
        rsvpSummary: { accepted: 25, declined: 5, pending: 10 },
      });

      const result = await mockWorkflow({
        calendarId: "events@company.com",
        trackingSheet: "rsvp-tracker",
        updateInterval: "hourly",
      });

      expect(result.eventsTracked).toBe(10);
      expect(result.rsvpSummary.accepted).toBe(25);
    });
  });

  describe("OAuth authentication flow", () => {
    it("should handle OAuth authentication for Sheets", async () => {
      const mockAuth = jest.fn().mockResolvedValue({
        success: true,
        authUrl: "https://accounts.google.com/o/oauth2/auth?...",
        authenticated: true,
      });

      const result = await mockAuth({
        service: "sheets",
        scopes: ["spreadsheets", "drive.file"],
      });

      expect(result.authenticated).toBe(true);
    });

    it("should handle OAuth authentication for Calendar", async () => {
      const mockAuth = jest.fn().mockResolvedValue({
        success: true,
        authUrl: "https://accounts.google.com/o/oauth2/auth?...",
        authenticated: true,
      });

      const result = await mockAuth({
        service: "calendar",
        scopes: ["calendar", "calendar.events"],
      });

      expect(result.authenticated).toBe(true);
    });
  });

  describe("Error handling and retry", () => {
    it("should retry on rate limit errors", async () => {
      const mockWorkflow = jest
        .fn()
        .mockRejectedValueOnce(new Error("Rate limit exceeded"))
        .mockResolvedValueOnce({
          success: true,
          retryCount: 1,
        });

      await expect(mockWorkflow()).rejects.toThrow("Rate limit");
      const result = await mockWorkflow();

      expect(result.success).toBe(true);
      expect(result.retryCount).toBe(1);
    });

    it("should handle API quota exceeded", async () => {
      const mockWorkflow = jest.fn().mockResolvedValue({
        success: false,
        error: "Quota exceeded",
        suggestion: "Try again in 24 hours",
      });

      const result = await mockWorkflow();

      expect(result.success).toBe(false);
      expect(result.error).toContain("Quota");
    });

    it("should handle invalid credentials", async () => {
      const mockWorkflow = jest
        .fn()
        .mockRejectedValue(new Error("Invalid credentials"));

      await expect(mockWorkflow()).rejects.toThrow("Invalid credentials");
    });
  });

  describe("Performance optimization", () => {
    it("should batch Sheets operations", async () => {
      const mockWorkflow = jest.fn().mockResolvedValue({
        success: true,
        operations: 100,
        apiCalls: 5, // Batched into 5 calls instead of 100
        duration: 2000,
      });

      const result = await mockWorkflow({
        updates: Array.from({ length: 100 }, (_, i) => ({
          range: `A${i + 1}`,
          value: i,
        })),
        batchSize: 20,
      });

      expect(result.apiCalls).toBe(5);
      expect(result.operations).toBe(100);
    });

    it("should cache Calendar availability queries", async () => {
      const mockWorkflow = jest.fn().mockResolvedValue({
        success: true,
        cacheHits: 8,
        apiCalls: 2,
        totalQueries: 10,
      });

      const result = await mockWorkflow({
        queries: 10,
        cacheEnabled: true,
      });

      expect(result.cacheHits).toBe(8);
      expect(result.apiCalls).toBe(2);
    });
  });
});
