/**
 * Google Calendar Agent for calendar and event automation
 * Integrates with Google Calendar API v3
 * Supports OAuth2 and Service Account authentication
 * Phase 10: Workspace Automation - Integration Agents
 */

import { google, calendar_v3 } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { logger } from "../../../utils/logger";

/**
 * Authentication configuration for Google Calendar
 *
 * Environment variables required:
 * - GOOGLE_CLIENT_ID: OAuth2 client ID
 * - GOOGLE_CLIENT_SECRET: OAuth2 client secret
 * - GOOGLE_REDIRECT_URI: OAuth2 redirect URI (e.g., http://localhost:3000/oauth2callback)
 * - GOOGLE_SERVICE_ACCOUNT_KEY: Service account JSON key (alternative to OAuth2)
 *
 * OAuth2 Flow:
 * 1. Call authenticate() to get auth URL
 * 2. User visits URL and grants permissions
 * 3. Exchange code for tokens using setCredentials()
 */
export interface CalendarAuthConfig {
  authType: "oauth2" | "serviceAccount";
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  serviceAccountKey?: string | object;
  accessToken?: string;
  refreshToken?: string;
}

export interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string; // RFC3339 timestamp
    date?: string; // YYYY-MM-DD for all-day events
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    optional?: boolean;
    responseStatus?: "needsAction" | "declined" | "tentative" | "accepted";
  }>;
  recurrence?: string[]; // RRULE format
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: "email" | "popup";
      minutes: number;
    }>;
  };
  colorId?: string;
  status?: "confirmed" | "tentative" | "cancelled";
}

export interface EventListParams {
  calendarId?: string; // Default: 'primary'
  timeMin?: string; // RFC3339 timestamp
  timeMax?: string; // RFC3339 timestamp
  maxResults?: number;
  orderBy?: "startTime" | "updated";
  showDeleted?: boolean;
  singleEvents?: boolean; // Expand recurring events
}

export interface FreeBusyQuery {
  timeMin: string; // RFC3339 timestamp
  timeMax: string; // RFC3339 timestamp
  calendarIds: string[];
  timeZone?: string;
}

export interface FreeBusyResult {
  calendars: {
    [calendarId: string]: {
      busy: Array<{
        start: string;
        end: string;
      }>;
      errors?: Array<{
        domain: string;
        reason: string;
      }>;
    };
  };
}

/**
 * Google Calendar Agent Implementation
 * Provides comprehensive Google Calendar API integration
 */
export class CalendarAgent {
  private auth: OAuth2Client | null = null;
  private calendar: calendar_v3.Calendar | null = null;
  private authenticated: boolean = false;

  constructor(private config: CalendarAuthConfig) {}

  /**
   * Authenticate with Google Calendar API
   * Returns authorization URL for OAuth2 flow
   */
  async authenticate(): Promise<{ authUrl?: string; success: boolean }> {
    try {
      if (this.config.authType === "oauth2") {
        return await this.authenticateOAuth2();
      } else if (this.config.authType === "serviceAccount") {
        return await this.authenticateServiceAccount();
      } else {
        throw new Error(`Unsupported auth type: ${this.config.authType}`);
      }
    } catch (error) {
      logger.error("Google Calendar authentication failed", { error });
      throw error;
    }
  }

  /**
   * Authenticate using OAuth2
   * Returns auth URL for user consent
   */
  private async authenticateOAuth2(): Promise<{
    authUrl?: string;
    success: boolean;
  }> {
    const { clientId, clientSecret, redirectUri, accessToken, refreshToken } =
      this.config;

    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error(
        "OAuth2 requires clientId, clientSecret, and redirectUri",
      );
    }

    this.auth = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    // If we have tokens, set them
    if (accessToken) {
      this.auth.setCredentials({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      this.calendar = google.calendar({ version: "v3", auth: this.auth });
      this.authenticated = true;
      logger.info("Google Calendar OAuth2 authenticated with existing tokens");
      return { success: true };
    }

    // Generate auth URL for user consent
    const authUrl = this.auth.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/calendar",
        "https://www.googleapis.com/auth/calendar.events",
      ],
    });

    logger.info("Google Calendar OAuth2 auth URL generated", { authUrl });
    return { authUrl, success: false };
  }

  /**
   * Authenticate using Service Account
   */
  private async authenticateServiceAccount(): Promise<{ success: boolean }> {
    const { serviceAccountKey } = this.config;

    if (!serviceAccountKey) {
      throw new Error("Service account requires serviceAccountKey");
    }

    // Parse key if it's a string
    const keyData =
      typeof serviceAccountKey === "string"
        ? JSON.parse(serviceAccountKey)
        : serviceAccountKey;

    const auth = new google.auth.GoogleAuth({
      credentials: keyData,
      scopes: [
        "https://www.googleapis.com/auth/calendar",
        "https://www.googleapis.com/auth/calendar.events",
      ],
    });

    this.calendar = google.calendar({ version: "v3", auth });
    this.authenticated = true;
    logger.info("Google Calendar authenticated with service account");
    return { success: true };
  }

  /**
   * Set OAuth2 credentials after user authorization
   * Call this with the authorization code from redirect
   */
  async setCredentials(
    code: string,
  ): Promise<{ accessToken: string; refreshToken?: string }> {
    if (!this.auth) {
      throw new Error(
        "OAuth2 client not initialized. Call authenticate() first.",
      );
    }

    const { tokens } = await this.auth.getToken(code);
    this.auth.setCredentials(tokens);
    this.calendar = google.calendar({ version: "v3", auth: this.auth });
    this.authenticated = true;

    logger.info("Google Calendar OAuth2 credentials set successfully");

    return {
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token || undefined,
    };
  }

  /**
   * Create a calendar event
   */
  async createEvent(
    params: CalendarEvent & { calendarId?: string },
  ): Promise<{ eventId: string; htmlLink: string }> {
    this.ensureAuthenticated();

    const calendarId = params.calendarId || "primary";

    logger.info("Creating calendar event", {
      calendarId,
      summary: params.summary,
      start: params.start,
    });

    const response = await this.calendar!.events.insert({
      calendarId,
      requestBody: {
        summary: params.summary,
        description: params.description,
        location: params.location,
        start: params.start,
        end: params.end,
        attendees: params.attendees,
        recurrence: params.recurrence,
        reminders: params.reminders,
        colorId: params.colorId,
        status: params.status,
      },
    });

    const eventId = response.data.id!;
    const htmlLink = response.data.htmlLink!;

    logger.info("Calendar event created successfully", { eventId, htmlLink });

    return { eventId, htmlLink };
  }

  /**
   * List calendar events in a date range
   */
  async listEvents(params: EventListParams): Promise<CalendarEvent[]> {
    this.ensureAuthenticated();

    const calendarId = params.calendarId || "primary";

    logger.info("Listing calendar events", {
      calendarId,
      timeMin: params.timeMin,
      timeMax: params.timeMax,
    });

    const response = await this.calendar!.events.list({
      calendarId,
      timeMin: params.timeMin,
      timeMax: params.timeMax,
      maxResults: params.maxResults || 100,
      singleEvents: params.singleEvents !== false, // Default: true
      orderBy: params.orderBy || "startTime",
      showDeleted: params.showDeleted || false,
    });

    const events: CalendarEvent[] = (response.data.items || []).map((item) => ({
      id: item.id || undefined,
      summary: item.summary || "No title",
      description: item.description || undefined,
      location: item.location || undefined,
      start: {
        dateTime: item.start?.dateTime || undefined,
        date: item.start?.date || undefined,
        timeZone: item.start?.timeZone || undefined,
      },
      end: {
        dateTime: item.end?.dateTime || undefined,
        date: item.end?.date || undefined,
        timeZone: item.end?.timeZone || undefined,
      },
      attendees: item.attendees?.map((attendee) => ({
        email: attendee.email!,
        displayName: attendee.displayName || undefined,
        optional: attendee.optional || undefined,
        responseStatus: attendee.responseStatus as
          | "needsAction"
          | "declined"
          | "tentative"
          | "accepted"
          | undefined,
      })),
      recurrence: item.recurrence || undefined,
      reminders: item.reminders as CalendarEvent["reminders"],
      colorId: item.colorId || undefined,
      status: item.status as CalendarEvent["status"],
    }));

    logger.info("Calendar events listed successfully", {
      count: events.length,
    });

    return events;
  }

  /**
   * Get a specific event by ID
   */
  async getEvent(params: {
    calendarId?: string;
    eventId: string;
  }): Promise<CalendarEvent> {
    this.ensureAuthenticated();

    const calendarId = params.calendarId || "primary";

    logger.info("Getting calendar event", {
      calendarId,
      eventId: params.eventId,
    });

    const response = await this.calendar!.events.get({
      calendarId,
      eventId: params.eventId,
    });

    const item = response.data;

    const event: CalendarEvent = {
      id: item.id || undefined,
      summary: item.summary || "No title",
      description: item.description || undefined,
      location: item.location || undefined,
      start: {
        dateTime: item.start?.dateTime || undefined,
        date: item.start?.date || undefined,
        timeZone: item.start?.timeZone || undefined,
      },
      end: {
        dateTime: item.end?.dateTime || undefined,
        date: item.end?.date || undefined,
        timeZone: item.end?.timeZone || undefined,
      },
      attendees: item.attendees?.map((attendee) => ({
        email: attendee.email!,
        displayName: attendee.displayName || undefined,
        optional: attendee.optional || undefined,
        responseStatus: attendee.responseStatus as
          | "needsAction"
          | "declined"
          | "tentative"
          | "accepted"
          | undefined,
      })),
      recurrence: item.recurrence || undefined,
      reminders: item.reminders as CalendarEvent["reminders"],
      colorId: item.colorId || undefined,
      status: item.status as CalendarEvent["status"],
    };

    logger.info("Calendar event retrieved successfully", { eventId: event.id });

    return event;
  }

  /**
   * Update an existing event
   */
  async updateEvent(
    params: CalendarEvent & { calendarId?: string; eventId: string },
  ): Promise<{ eventId: string; htmlLink: string }> {
    this.ensureAuthenticated();

    const calendarId = params.calendarId || "primary";

    logger.info("Updating calendar event", {
      calendarId,
      eventId: params.eventId,
      summary: params.summary,
    });

    const response = await this.calendar!.events.update({
      calendarId,
      eventId: params.eventId,
      requestBody: {
        summary: params.summary,
        description: params.description,
        location: params.location,
        start: params.start,
        end: params.end,
        attendees: params.attendees,
        recurrence: params.recurrence,
        reminders: params.reminders,
        colorId: params.colorId,
        status: params.status,
      },
    });

    const eventId = response.data.id!;
    const htmlLink = response.data.htmlLink!;

    logger.info("Calendar event updated successfully", { eventId, htmlLink });

    return { eventId, htmlLink };
  }

  /**
   * Delete an event
   */
  async deleteEvent(params: {
    calendarId?: string;
    eventId: string;
  }): Promise<{ success: boolean }> {
    this.ensureAuthenticated();

    const calendarId = params.calendarId || "primary";

    logger.info("Deleting calendar event", {
      calendarId,
      eventId: params.eventId,
    });

    await this.calendar!.events.delete({
      calendarId,
      eventId: params.eventId,
    });

    logger.info("Calendar event deleted successfully", {
      eventId: params.eventId,
    });

    return { success: true };
  }

  /**
   * Check availability (free/busy status) for calendars in a time range
   */
  async checkAvailability(params: FreeBusyQuery): Promise<FreeBusyResult> {
    this.ensureAuthenticated();

    logger.info("Checking calendar availability", {
      timeMin: params.timeMin,
      timeMax: params.timeMax,
      calendarCount: params.calendarIds.length,
    });

    const response = await this.calendar!.freebusy.query({
      requestBody: {
        timeMin: params.timeMin,
        timeMax: params.timeMax,
        timeZone: params.timeZone || "UTC",
        items: params.calendarIds.map((id) => ({ id })),
      },
    });

    const result: FreeBusyResult = {
      calendars: {},
    };

    // Parse response
    if (response.data.calendars) {
      for (const [calendarId, calendarData] of Object.entries(
        response.data.calendars,
      )) {
        result.calendars[calendarId] = {
          busy: (calendarData.busy || []).map((period) => ({
            start: period.start!,
            end: period.end!,
          })),
          errors:
            calendarData.errors as FreeBusyResult["calendars"][string]["errors"],
        };
      }
    }

    logger.info("Calendar availability checked successfully", {
      calendarCount: Object.keys(result.calendars).length,
    });

    return result;
  }

  /**
   * Ensure authentication is complete before API calls
   */
  private ensureAuthenticated(): void {
    if (!this.authenticated || !this.calendar) {
      throw new Error("Not authenticated. Call authenticate() first.");
    }
  }

  /**
   * Disconnect and cleanup
   */
  async disconnect(): Promise<void> {
    this.auth = null;
    this.calendar = null;
    this.authenticated = false;
    logger.info("Google Calendar agent disconnected");
  }
}

// Singleton instance for convenience (optional - can create multiple instances)
let defaultCalendarAgent: CalendarAgent | null = null;

export function getCalendarAgent(config?: CalendarAuthConfig): CalendarAgent {
  if (!defaultCalendarAgent && config) {
    defaultCalendarAgent = new CalendarAgent(config);
  } else if (!defaultCalendarAgent) {
    throw new Error(
      "CalendarAgent not initialized. Provide config on first call.",
    );
  }
  return defaultCalendarAgent;
}
