/**
 * Google Sheets Agent for spreadsheet automation
 * Integrates with Google Sheets API v4
 * Supports OAuth2 and Service Account authentication
 * Phase 10: Workspace Automation - Integration Agents
 */

import { google, sheets_v4 } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { logger } from "../../../utils/logger";

/**
 * Authentication configuration for Google Sheets
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
export interface SheetsAuthConfig {
  authType: "oauth2" | "serviceAccount";
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  serviceAccountKey?: string | object;
  accessToken?: string;
  refreshToken?: string;
}

export interface SheetRange {
  spreadsheetId: string;
  range: string; // A1 notation (e.g., 'Sheet1!A1:D10')
  sheetName?: string;
}

export interface SheetData {
  values: unknown[][];
  range: string;
  majorDimension?: "ROWS" | "COLUMNS";
}

export interface SheetInfo {
  spreadsheetId: string;
  title: string;
  sheets: Array<{
    sheetId: number;
    title: string;
    index: number;
    rowCount: number;
    columnCount: number;
  }>;
}

/**
 * Google Sheets Agent Implementation
 * Provides comprehensive Google Sheets API integration
 */
export class SheetsAgent {
  private auth: OAuth2Client | null = null;
  private sheets: sheets_v4.Sheets | null = null;
  private authenticated: boolean = false;

  constructor(private config: SheetsAuthConfig) {}

  /**
   * Authenticate with Google Sheets API
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
      logger.error("Google Sheets authentication failed", { error });
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
      this.sheets = google.sheets({ version: "v4", auth: this.auth });
      this.authenticated = true;
      logger.info("Google Sheets OAuth2 authenticated with existing tokens");
      return { success: true };
    }

    // Generate auth URL for user consent
    const authUrl = this.auth.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive.file",
      ],
    });

    logger.info("Google Sheets OAuth2 auth URL generated", { authUrl });
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
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive.file",
      ],
    });

    this.sheets = google.sheets({ version: "v4", auth });
    this.authenticated = true;
    logger.info("Google Sheets authenticated with service account");
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
    this.sheets = google.sheets({ version: "v4", auth: this.auth });
    this.authenticated = true;

    logger.info("Google Sheets OAuth2 credentials set successfully");

    return {
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token || undefined,
    };
  }

  /**
   * Read data from a Google Sheet
   */
  async readSheet(params: SheetRange): Promise<SheetData> {
    this.ensureAuthenticated();

    logger.info("Reading Google Sheet", {
      spreadsheetId: params.spreadsheetId,
      range: params.range,
    });

    const response = await this.sheets!.spreadsheets.values.get({
      spreadsheetId: params.spreadsheetId,
      range: params.range,
    });

    const values = (response.data.values || []) as unknown[][];

    logger.info("Google Sheet read successfully", {
      rowCount: values.length,
      columnCount: values[0]?.length || 0,
    });

    return {
      values,
      range: response.data.range!,
      majorDimension:
        (response.data.majorDimension as "ROWS" | "COLUMNS") || "ROWS",
    };
  }

  /**
   * Write data to a Google Sheet (overwrites range)
   */
  async writeSheet(
    params: SheetRange & { data: unknown[][] },
  ): Promise<{ updatedCells: number }> {
    this.ensureAuthenticated();

    logger.info("Writing to Google Sheet", {
      spreadsheetId: params.spreadsheetId,
      range: params.range,
      rows: params.data.length,
    });

    const response = await this.sheets!.spreadsheets.values.update({
      spreadsheetId: params.spreadsheetId,
      range: params.range,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: params.data,
      },
    });

    const updatedCells = response.data.updatedCells || 0;
    logger.info("Google Sheet written successfully", { updatedCells });

    return { updatedCells };
  }

  /**
   * Append rows to the end of a sheet
   */
  async appendRows(
    params: SheetRange & { data: unknown[][] },
  ): Promise<{ updatedCells: number; updatedRange: string }> {
    this.ensureAuthenticated();

    logger.info("Appending rows to Google Sheet", {
      spreadsheetId: params.spreadsheetId,
      range: params.range,
      rows: params.data.length,
    });

    const response = await this.sheets!.spreadsheets.values.append({
      spreadsheetId: params.spreadsheetId,
      range: params.range,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: params.data,
      },
    });

    const updatedCells = response.data.updates?.updatedCells || 0;
    const updatedRange = response.data.updates?.updatedRange || params.range;

    logger.info("Rows appended to Google Sheet successfully", {
      updatedCells,
      updatedRange,
    });

    return { updatedCells, updatedRange };
  }

  /**
   * Update specific cells in a sheet
   */
  async updateCells(params: {
    spreadsheetId: string;
    updates: Array<{ range: string; values: unknown[][] }>;
  }): Promise<{ totalUpdatedCells: number }> {
    this.ensureAuthenticated();

    logger.info("Updating cells in Google Sheet", {
      spreadsheetId: params.spreadsheetId,
      updateCount: params.updates.length,
    });

    const response = await this.sheets!.spreadsheets.values.batchUpdate({
      spreadsheetId: params.spreadsheetId,
      requestBody: {
        valueInputOption: "USER_ENTERED",
        data: params.updates.map((update) => ({
          range: update.range,
          values: update.values,
        })),
      },
    });

    const totalUpdatedCells = response.data.totalUpdatedCells || 0;
    logger.info("Cells updated in Google Sheet successfully", {
      totalUpdatedCells,
    });

    return { totalUpdatedCells };
  }

  /**
   * Create a new sheet within a spreadsheet
   */
  async createSheet(params: {
    spreadsheetId: string;
    title: string;
    rowCount?: number;
    columnCount?: number;
  }): Promise<{ sheetId: number; title: string }> {
    this.ensureAuthenticated();

    logger.info("Creating new sheet in Google Spreadsheet", {
      spreadsheetId: params.spreadsheetId,
      title: params.title,
    });

    const response = await this.sheets!.spreadsheets.batchUpdate({
      spreadsheetId: params.spreadsheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: params.title,
                gridProperties: {
                  rowCount: params.rowCount || 1000,
                  columnCount: params.columnCount || 26,
                },
              },
            },
          },
        ],
      },
    });

    const sheetId =
      response.data.replies?.[0]?.addSheet?.properties?.sheetId ?? 0;
    const title =
      response.data.replies?.[0]?.addSheet?.properties?.title ?? "Unknown";

    logger.info("Sheet created successfully", { sheetId, title });

    return { sheetId, title };
  }

  /**
   * List all sheets in a spreadsheet
   */
  async listSheets(params: {
    spreadsheetId: string;
  }): Promise<SheetInfo["sheets"]> {
    this.ensureAuthenticated();

    logger.info("Listing sheets in Google Spreadsheet", {
      spreadsheetId: params.spreadsheetId,
    });

    const response = await this.sheets!.spreadsheets.get({
      spreadsheetId: params.spreadsheetId,
    });

    const sheets = (response.data.sheets || []).map((sheet) => ({
      sheetId: sheet.properties?.sheetId ?? 0,
      title: sheet.properties?.title ?? "Unknown",
      index: sheet.properties?.index ?? 0,
      rowCount: sheet.properties?.gridProperties?.rowCount || 0,
      columnCount: sheet.properties?.gridProperties?.columnCount || 0,
    }));

    logger.info("Sheets listed successfully", { count: sheets.length });

    return sheets;
  }

  /**
   * Get spreadsheet information and metadata
   */
  async getSheetInfo(params: { spreadsheetId: string }): Promise<SheetInfo> {
    this.ensureAuthenticated();

    logger.info("Getting Google Spreadsheet info", {
      spreadsheetId: params.spreadsheetId,
    });

    const response = await this.sheets!.spreadsheets.get({
      spreadsheetId: params.spreadsheetId,
    });

    const sheets = (response.data.sheets || []).map((sheet) => ({
      sheetId: sheet.properties?.sheetId ?? 0,
      title: sheet.properties?.title ?? "Unknown",
      index: sheet.properties?.index ?? 0,
      rowCount: sheet.properties?.gridProperties?.rowCount || 0,
      columnCount: sheet.properties?.gridProperties?.columnCount || 0,
    }));

    const info: SheetInfo = {
      spreadsheetId: response.data.spreadsheetId ?? "",
      title: response.data.properties?.title ?? "Unknown",
      sheets,
    };

    logger.info("Spreadsheet info retrieved successfully", {
      title: info.title,
      sheetCount: sheets.length,
    });

    return info;
  }

  /**
   * Ensure authentication is complete before API calls
   */
  private ensureAuthenticated(): void {
    if (!this.authenticated || !this.sheets) {
      throw new Error("Not authenticated. Call authenticate() first.");
    }
  }

  /**
   * Disconnect and cleanup
   */
  async disconnect(): Promise<void> {
    this.auth = null;
    this.sheets = null;
    this.authenticated = false;
    logger.info("Google Sheets agent disconnected");
  }
}

// Singleton instance for convenience (optional - can create multiple instances)
let defaultSheetsAgent: SheetsAgent | null = null;

export function getSheetsAgent(config?: SheetsAuthConfig): SheetsAgent {
  if (!defaultSheetsAgent && config) {
    defaultSheetsAgent = new SheetsAgent(config);
  } else if (!defaultSheetsAgent) {
    throw new Error(
      "SheetsAgent not initialized. Provide config on first call.",
    );
  }
  return defaultSheetsAgent;
}
