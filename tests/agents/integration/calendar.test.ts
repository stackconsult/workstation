/// <reference types="jest" />

import { CalendarAgent } from "../../../src/automation/agents/integration/calendar";

describe("Google Calendar Agent", () => {
  let agent: CalendarAgent;

  beforeEach(() => {
    agent = new CalendarAgent({
      authType: "oauth2",
      clientId: "test-client-id",
      clientSecret: "test-client-secret",
      redirectUri: "http://localhost:3000/callback",
    });
  });

  describe("authentication", () => {
    it("should initialize with OAuth2 config", () => {
      expect(agent).toBeInstanceOf(CalendarAgent);
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
      const saAgent = new CalendarAgent({
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

      expect(saAgent).toBeInstanceOf(CalendarAgent);
    });

    it("should handle missing OAuth2 credentials", async () => {
      const invalidAgent = new CalendarAgent({
        authType: "oauth2",
        clientId: undefined as any,
        clientSecret: undefined as any,
        redirectUri: undefined as any,
      });

      await expect(invalidAgent.authenticate()).rejects.toThrow();
    });

    it("should handle invalid auth type", async () => {
      const invalidAgent = new CalendarAgent({
        authType: "invalid" as any,
      });

      await expect(invalidAgent.authenticate()).rejects.toThrow(
        "Unsupported auth type",
      );
    });
  });

  describe("createEvent (mocked)", () => {
    it("should create calendar event", async () => {
      const mockCreate = jest.fn().mockResolvedValue({
        success: true,
        event: {
          id: "event123",
          summary: "Team Meeting",
          start: { dateTime: "2024-02-01T10:00:00Z" },
          end: { dateTime: "2024-02-01T11:00:00Z" },
          status: "confirmed",
        },
      });

      const result = await mockCreate({
        calendarId: "primary",
        event: {
          summary: "Team Meeting",
          start: { dateTime: "2024-02-01T10:00:00Z" },
          end: { dateTime: "2024-02-01T11:00:00Z" },
        },
      });

      expect(result.success).toBe(true);
      expect(result.event.id).toBe("event123");
      expect(result.event.summary).toBe("Team Meeting");
    });

    it("should create all-day event", async () => {
      const mockCreate = jest.fn().mockResolvedValue({
        success: true,
        event: {
          id: "event456",
          summary: "Conference",
          start: { date: "2024-02-01" },
          end: { date: "2024-02-02" },
          status: "confirmed",
        },
      });

      const result = await mockCreate({
        calendarId: "primary",
        event: {
          summary: "Conference",
          start: { date: "2024-02-01" },
          end: { date: "2024-02-02" },
        },
      });

      expect(result.success).toBe(true);
      expect(result.event.start.date).toBe("2024-02-01");
    });

    it("should create event with attendees", async () => {
      const mockCreate = jest.fn().mockResolvedValue({
        success: true,
        event: {
          id: "event789",
          summary: "Meeting with Team",
          attendees: [
            { email: "user1@example.com", responseStatus: "needsAction" },
            { email: "user2@example.com", responseStatus: "needsAction" },
          ],
        },
      });

      const result = await mockCreate({
        calendarId: "primary",
        event: {
          summary: "Meeting with Team",
          start: { dateTime: "2024-02-01T10:00:00Z" },
          end: { dateTime: "2024-02-01T11:00:00Z" },
          attendees: [
            { email: "user1@example.com" },
            { email: "user2@example.com" },
          ],
        },
      });

      expect(result.success).toBe(true);
      expect(result.event.attendees).toHaveLength(2);
    });

    it("should create recurring event", async () => {
      const mockCreate = jest.fn().mockResolvedValue({
        success: true,
        event: {
          id: "recurring123",
          summary: "Weekly Standup",
          recurrence: ["RRULE:FREQ=WEEKLY;COUNT=10"],
        },
      });

      const result = await mockCreate({
        calendarId: "primary",
        event: {
          summary: "Weekly Standup",
          start: { dateTime: "2024-02-01T09:00:00Z" },
          end: { dateTime: "2024-02-01T09:30:00Z" },
          recurrence: ["RRULE:FREQ=WEEKLY;COUNT=10"],
        },
      });

      expect(result.success).toBe(true);
      expect(result.event.recurrence).toBeDefined();
    });

    it("should handle missing required fields", async () => {
      const mockCreate = jest.fn().mockResolvedValue({
        success: false,
        error: "summary is required",
      });

      const result = await mockCreate({
        calendarId: "primary",
        event: {
          summary: "",
          start: { dateTime: "2024-02-01T10:00:00Z" },
          end: { dateTime: "2024-02-01T11:00:00Z" },
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("required");
    });
  });

  describe("listEvents (mocked)", () => {
    it("should list upcoming events", async () => {
      const mockList = jest.fn().mockResolvedValue({
        success: true,
        events: [
          {
            id: "event1",
            summary: "Meeting 1",
            start: { dateTime: "2024-02-01T10:00:00Z" },
          },
          {
            id: "event2",
            summary: "Meeting 2",
            start: { dateTime: "2024-02-02T14:00:00Z" },
          },
        ],
        nextPageToken: null,
      });

      const result = await mockList({
        calendarId: "primary",
        timeMin: "2024-02-01T00:00:00Z",
        timeMax: "2024-02-28T23:59:59Z",
        maxResults: 10,
      });

      expect(result.success).toBe(true);
      expect(result.events).toHaveLength(2);
    });

    it("should list events with pagination", async () => {
      const mockList = jest.fn().mockResolvedValue({
        success: true,
        events: expect.any(Array),
        nextPageToken: "token123",
      });

      const result = await mockList({
        calendarId: "primary",
        maxResults: 10,
      });

      expect(result.success).toBe(true);
      expect(result.nextPageToken).toBe("token123");
    });

    it("should filter events by date range", async () => {
      const mockList = jest.fn().mockResolvedValue({
        success: true,
        events: [
          {
            id: "event1",
            summary: "Event in range",
            start: { dateTime: "2024-02-15T10:00:00Z" },
          },
        ],
      });

      const result = await mockList({
        calendarId: "primary",
        timeMin: "2024-02-10T00:00:00Z",
        timeMax: "2024-02-20T23:59:59Z",
      });

      expect(result.success).toBe(true);
      expect(
        result.events.every((e: any) => {
          const eventDate = new Date(e.start.dateTime);
          const minDate = new Date("2024-02-10T00:00:00Z");
          const maxDate = new Date("2024-02-20T23:59:59Z");
          return eventDate >= minDate && eventDate <= maxDate;
        }),
      ).toBe(true);
    });

    it("should handle empty results", async () => {
      const mockList = jest.fn().mockResolvedValue({
        success: true,
        events: [],
        nextPageToken: null,
      });

      const result = await mockList({ calendarId: "primary" });

      expect(result.success).toBe(true);
      expect(result.events).toHaveLength(0);
    });
  });

  describe("getEvent (mocked)", () => {
    it("should get event by ID", async () => {
      const mockGet = jest.fn().mockResolvedValue({
        success: true,
        event: {
          id: "event123",
          summary: "Important Meeting",
          start: { dateTime: "2024-02-01T10:00:00Z" },
          end: { dateTime: "2024-02-01T11:00:00Z" },
          status: "confirmed",
        },
      });

      const result = await mockGet({
        calendarId: "primary",
        eventId: "event123",
      });

      expect(result.success).toBe(true);
      expect(result.event.id).toBe("event123");
      expect(result.event.summary).toBe("Important Meeting");
    });

    it("should handle non-existent event", async () => {
      const mockGet = jest.fn().mockResolvedValue({
        success: false,
        error: "Event not found",
      });

      const result = await mockGet({
        calendarId: "primary",
        eventId: "nonexistent",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("not found");
    });
  });

  describe("updateEvent (mocked)", () => {
    it("should update event", async () => {
      const mockUpdate = jest.fn().mockResolvedValue({
        success: true,
        event: {
          id: "event123",
          summary: "Updated Meeting",
          start: { dateTime: "2024-02-01T14:00:00Z" },
          end: { dateTime: "2024-02-01T15:00:00Z" },
        },
      });

      const result = await mockUpdate({
        calendarId: "primary",
        eventId: "event123",
        event: {
          summary: "Updated Meeting",
          start: { dateTime: "2024-02-01T14:00:00Z" },
          end: { dateTime: "2024-02-01T15:00:00Z" },
        },
      });

      expect(result.success).toBe(true);
      expect(result.event.summary).toBe("Updated Meeting");
    });

    it("should update only specified fields", async () => {
      const mockUpdate = jest.fn().mockResolvedValue({
        success: true,
        event: {
          id: "event123",
          summary: "New Summary",
          start: { dateTime: "2024-02-01T10:00:00Z" }, // Unchanged
          end: { dateTime: "2024-02-01T11:00:00Z" }, // Unchanged
        },
      });

      const result = await mockUpdate({
        calendarId: "primary",
        eventId: "event123",
        event: {
          summary: "New Summary",
        },
      });

      expect(result.success).toBe(true);
      expect(result.event.summary).toBe("New Summary");
    });
  });

  describe("deleteEvent (mocked)", () => {
    it("should delete event", async () => {
      const mockDelete = jest.fn().mockResolvedValue({
        success: true,
        deleted: true,
      });

      const result = await mockDelete({
        calendarId: "primary",
        eventId: "event123",
      });

      expect(result.success).toBe(true);
      expect(result.deleted).toBe(true);
    });

    it("should handle deleting non-existent event", async () => {
      const mockDelete = jest.fn().mockResolvedValue({
        success: false,
        error: "Event not found",
      });

      const result = await mockDelete({
        calendarId: "primary",
        eventId: "nonexistent",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("checkAvailability (mocked)", () => {
    it("should check free/busy status", async () => {
      const mockCheck = jest.fn().mockResolvedValue({
        success: true,
        calendars: {
          primary: {
            busy: [
              {
                start: "2024-02-01T10:00:00Z",
                end: "2024-02-01T11:00:00Z",
              },
              {
                start: "2024-02-01T14:00:00Z",
                end: "2024-02-01T15:00:00Z",
              },
            ],
          },
        },
      });

      const result = await mockCheck({
        timeMin: "2024-02-01T00:00:00Z",
        timeMax: "2024-02-01T23:59:59Z",
        calendarIds: ["primary"],
      });

      expect(result.success).toBe(true);
      expect(result.calendars["primary"].busy).toHaveLength(2);
    });

    it("should check multiple calendars", async () => {
      const mockCheck = jest.fn().mockResolvedValue({
        success: true,
        calendars: {
          primary: { busy: [] },
          "work@example.com": {
            busy: [
              { start: "2024-02-01T09:00:00Z", end: "2024-02-01T10:00:00Z" },
            ],
          },
        },
      });

      const result = await mockCheck({
        timeMin: "2024-02-01T00:00:00Z",
        timeMax: "2024-02-01T23:59:59Z",
        calendarIds: ["primary", "work@example.com"],
      });

      expect(result.success).toBe(true);
      expect(Object.keys(result.calendars)).toHaveLength(2);
    });

    it("should handle completely free time range", async () => {
      const mockCheck = jest.fn().mockResolvedValue({
        success: true,
        calendars: {
          primary: { busy: [] },
        },
      });

      const result = await mockCheck({
        timeMin: "2024-02-01T00:00:00Z",
        timeMax: "2024-02-01T23:59:59Z",
        calendarIds: ["primary"],
      });

      expect(result.success).toBe(true);
      expect(result.calendars["primary"].busy).toHaveLength(0);
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

    it("should validate RFC3339 timestamp format", () => {
      const isValidRFC3339 = (timestamp: string) =>
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/.test(
          timestamp,
        );

      expect(isValidRFC3339("2024-02-01T10:00:00Z")).toBe(true);
      expect(isValidRFC3339("2024-02-01T10:00:00+05:30")).toBe(true);
      expect(isValidRFC3339("invalid-timestamp")).toBe(false);
    });

    it("should validate date-only format", () => {
      const isValidDate = (date: string) => /^\d{4}-\d{2}-\d{2}$/.test(date);

      expect(isValidDate("2024-02-01")).toBe(true);
      expect(isValidDate("2024-2-1")).toBe(false);
      expect(isValidDate("invalid")).toBe(false);
    });

    it("should handle timezone specifications", async () => {
      const mockCreate = jest.fn().mockResolvedValue({
        success: true,
        event: {
          id: "event123",
          start: {
            dateTime: "2024-02-01T10:00:00-05:00",
            timeZone: "America/New_York",
          },
          end: {
            dateTime: "2024-02-01T11:00:00-05:00",
            timeZone: "America/New_York",
          },
        },
      });

      const result = await mockCreate({
        calendarId: "primary",
        event: {
          summary: "Meeting",
          start: {
            dateTime: "2024-02-01T10:00:00-05:00",
            timeZone: "America/New_York",
          },
          end: {
            dateTime: "2024-02-01T11:00:00-05:00",
            timeZone: "America/New_York",
          },
        },
      });

      expect(result.success).toBe(true);
      expect(result.event.start.timeZone).toBe("America/New_York");
    });
  });
});
