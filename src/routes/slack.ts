/**
 * Slack Integration Routes
 * OAuth flow and Slack app configuration
 */

import { Router, Request, Response } from "express";
import { WebClient } from "@slack/web-api";
import { authenticateToken, AuthenticatedRequest } from "../auth/jwt";
import db from "../db/connection";
import { logger } from "../utils/logger";
import { initializeSlackApp } from "../services/slack";
import {
  ErrorCode,
  createErrorResponse,
  createSuccessResponse,
} from "../types/errors";

const router = Router();

const SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID || "";
const SLACK_CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET || "";
const SLACK_REDIRECT_URI =
  process.env.SLACK_REDIRECT_URI ||
  "http://localhost:3000/api/slack/oauth/callback";

/**
 * Initiate Slack OAuth
 * GET /api/slack/oauth/authorize
 */
router.get(
  "/oauth/authorize",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const workspaceId = req.query.workspace_id as string;

      if (!workspaceId) {
        return res.status(400).json({
          success: false,
          error: "workspace_id is required",
        });
      }

      // Verify user has access to workspace
      const accessCheck = await db.query(
        `SELECT role FROM workspace_members
       WHERE workspace_id = $1 AND user_id = $2 AND role IN ('owner', 'admin')`,
        [workspaceId, req.user?.userId],
      );

      if (accessCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          error: "Only workspace owners and admins can connect Slack",
        });
      }

      // Build Slack OAuth URL
      const scopes = [
        "chat:write",
        "commands",
        "channels:read",
        "channels:history",
        "users:read",
        "users:read.email",
        "app_mentions:read",
      ].join(",");

      const state = Buffer.from(
        JSON.stringify({
          workspaceId,
          userId: req.user?.userId,
          timestamp: Date.now(),
        }),
      ).toString("base64");

      const oauthUrl =
        `https://slack.com/oauth/v2/authorize?` +
        `client_id=${SLACK_CLIENT_ID}` +
        `&scope=${scopes}` +
        `&redirect_uri=${encodeURIComponent(SLACK_REDIRECT_URI)}` +
        `&state=${state}`;

      res.json({
        success: true,
        data: {
          authUrl: oauthUrl,
        },
      });
    } catch (error) {
      logger.error("Slack OAuth initiate error", { error });
      res.status(500).json({
        success: false,
        error: "Failed to initiate Slack OAuth",
      });
    }
  },
);

/**
 * Slack OAuth callback
 * GET /api/slack/oauth/callback
 */
router.get("/oauth/callback", async (req: Request, res: Response) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      logger.error("Slack OAuth error", { error });
      return res.redirect(`/settings/integrations?error=slack_oauth_denied`);
    }

    if (!code || !state) {
      return res.status(400).json({
        success: false,
        error: "Missing code or state parameter",
      });
    }

    // Decode state
    const stateData = JSON.parse(
      Buffer.from(state as string, "base64").toString(),
    );
    const { workspaceId, userId } = stateData;

    // Exchange code for token
    const client = new WebClient();
    const result = await client.oauth.v2.access({
      client_id: SLACK_CLIENT_ID,
      client_secret: SLACK_CLIENT_SECRET,
      code: code as string,
      redirect_uri: SLACK_REDIRECT_URI,
    });

    if (!result.ok) {
      throw new Error("Failed to exchange code for token");
    }

    // Store Slack credentials
    await db.query(
      `UPDATE workspaces
       SET slack_team_id = $1,
           slack_access_token = $2,
           slack_bot_token = $3,
           slack_channel = $4,
           updated_at = NOW()
       WHERE id = $5`,
      [
        result.team?.id,
        result.access_token,
        result.access_token, // In v2, access_token is the bot token
        result.incoming_webhook?.channel || null,
        workspaceId,
      ],
    );

    logger.info("Slack OAuth completed", {
      workspaceId,
      userId,
      slackTeamId: result.team?.id,
    });

    // Initialize Slack app for this workspace
    let appInitialized = false;
    if (result.access_token && process.env.SLACK_SIGNING_SECRET) {
      try {
        initializeSlackApp({
          workspaceId,
          slackTeamId: result.team?.id || "",
          botToken: result.access_token,
          signingSecret: process.env.SLACK_SIGNING_SECRET,
        });
        appInitialized = true;
      } catch (error) {
        logger.error("Failed to initialize Slack app", { error, workspaceId });
        // Continue - credentials are saved, app can be initialized later
      }
    }

    // Redirect with success message and status
    const status = appInitialized ? "connected" : "connected_pending";
    res.redirect(
      `/settings/integrations?success=slack_${status}&team=${result.team?.name || "Unknown"}`,
    );
  } catch (error) {
    logger.error("Slack OAuth callback error", { error });
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res.redirect(
      `/settings/integrations?error=slack_oauth_failed&details=${encodeURIComponent(errorMessage)}`,
    );
  }
});

/**
 * Get Slack integration status
 * GET /api/slack/status/:workspaceId
 */
router.get(
  "/status/:workspaceId",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { workspaceId } = req.params;

      // Verify user has access
      const accessCheck = await db.query(
        `SELECT role FROM workspace_members
       WHERE workspace_id = $1 AND user_id = $2`,
        [workspaceId, req.user?.userId],
      );

      if (accessCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          error: "Access denied",
        });
      }

      // Get Slack integration status
      const result = await db.query(
        `SELECT
         slack_team_id,
         slack_channel,
         CASE 
           WHEN slack_bot_token IS NOT NULL THEN true 
           ELSE false 
         END as is_connected
       FROM workspaces
       WHERE id = $1`,
        [workspaceId],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Workspace not found",
        });
      }

      const workspace = result.rows[0];

      res.json({
        success: true,
        data: {
          isConnected: workspace.is_connected,
          slackTeamId: workspace.slack_team_id,
          slackChannel: workspace.slack_channel,
        },
      });
    } catch (error) {
      logger.error("Get Slack status error", { error });
      res.status(500).json({
        success: false,
        error: "Failed to get Slack status",
      });
    }
  },
);

/**
 * Disconnect Slack integration
 * DELETE /api/slack/disconnect/:workspaceId
 */
router.delete(
  "/disconnect/:workspaceId",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { workspaceId } = req.params;

      // Verify user is owner or admin
      const accessCheck = await db.query(
        `SELECT role FROM workspace_members
       WHERE workspace_id = $1 AND user_id = $2 AND role IN ('owner', 'admin')`,
        [workspaceId, req.user?.userId],
      );

      if (accessCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          error: "Only workspace owners and admins can disconnect Slack",
        });
      }

      // Remove Slack credentials
      await db.query(
        `UPDATE workspaces
       SET slack_team_id = NULL,
           slack_access_token = NULL,
           slack_bot_token = NULL,
           slack_webhook_url = NULL,
           slack_channel = NULL,
           updated_at = NOW()
       WHERE id = $1`,
        [workspaceId],
      );

      logger.info("Slack disconnected", {
        workspaceId,
        userId: req.user?.userId,
      });

      res.json({
        success: true,
        message: "Slack integration disconnected",
      });
    } catch (error) {
      logger.error("Slack disconnect error", { error });
      res.status(500).json({
        success: false,
        error: "Failed to disconnect Slack",
      });
    }
  },
);

/**
 * Test Slack connection
 * POST /api/slack/test/:workspaceId
 */
router.post(
  "/test/:workspaceId",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { workspaceId } = req.params;
      const requestId = req.requestId;

      // Verify user has access
      const accessCheck = await db.query(
        `SELECT role FROM workspace_members
       WHERE workspace_id = $1 AND user_id = $2`,
        [workspaceId, req.user?.userId],
      );

      if (accessCheck.rows.length === 0) {
        return res.status(403).json(
          createErrorResponse(
            ErrorCode.WORKSPACE_ACCESS_DENIED,
            "You do not have access to this workspace",
            {
              requestId,
              nextSteps: [
                "Request access from the workspace owner",
                "Verify you are logged in with the correct account",
              ],
            },
          ),
        );
      }

      // Get Slack bot token
      const result = await db.query(
        "SELECT slack_bot_token, slack_channel, slack_team_id, name FROM workspaces WHERE id = $1",
        [workspaceId],
      );

      if (result.rows.length === 0 || !result.rows[0].slack_bot_token) {
        return res.status(400).json(
          createErrorResponse(
            ErrorCode.SLACK_INTEGRATION_ERROR,
            "Slack is not connected to this workspace",
            {
              requestId,
              nextSteps: [
                "Connect Slack via OAuth in workspace settings",
                "Contact workspace administrator to set up Slack integration",
              ],
            },
          ),
        );
      }

      const {
        slack_bot_token,
        slack_channel,
        slack_team_id,
        name: workspaceName,
      } = result.rows[0];
      const targetChannel = slack_channel || "#general";

      // Send test message
      const client = new WebClient(slack_bot_token);
      const messageResult = await client.chat.postMessage({
        channel: targetChannel,
        text: `✅ Slack integration is working! This is a test message from ${workspaceName} workspace.`,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*✅ Slack Integration Test Successful*\n\nYour Slack integration for *${workspaceName}* workspace is working correctly!`,
            },
          },
          {
            type: "context",
            elements: [
              {
                type: "mrkdwn",
                text: `Workspace: ${workspaceName} | Team ID: ${slack_team_id} | Sent at: ${new Date().toISOString()}`,
              },
            ],
          },
        ],
      });

      logger.info("Slack test message sent", {
        workspaceId,
        channel: targetChannel,
        messageTs: messageResult.ts,
      });

      res.json(
        createSuccessResponse(
          {
            channel: targetChannel,
            teamId: slack_team_id,
            messageTimestamp: messageResult.ts,
            testPassed: true,
          },
          {
            message: `Test message sent successfully to ${targetChannel}`,
            requestId,
          },
        ),
      );
    } catch (error) {
      logger.error("Slack test error", {
        error,
        workspaceId: req.params.workspaceId,
      });

      // Classify Slack API errors using structured error response
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      const slackError = (error as any)?.data?.error; // Slack API structured error code

      // Categorize based on Slack error codes
      const isAuthError =
        slackError === "invalid_auth" ||
        slackError === "token_revoked" ||
        slackError === "token_expired" ||
        slackError === "not_authed";

      const isChannelError =
        slackError === "channel_not_found" ||
        slackError === "is_archived" ||
        slackError === "channel_not_member";

      const errorCode = ErrorCode.SLACK_INTEGRATION_ERROR;
      let nextSteps = [
        "Try again in a few moments",
        "Verify Slack integration is still connected",
        "Reconnect Slack if the problem persists",
      ];

      if (isAuthError) {
        nextSteps = [
          "Reconnect Slack integration (OAuth token may have expired)",
          "Contact workspace administrator to refresh Slack connection",
        ];
      } else if (isChannelError) {
        nextSteps = [
          "Verify the Slack channel exists and is not archived",
          "Update the Slack channel in workspace settings",
          "Use a different channel for notifications",
        ];
      }

      res.status(500).json(
        createErrorResponse(errorCode, "Failed to send test message to Slack", {
          details: errorMessage,
          requestId: req.requestId,
          retryable: !isAuthError,
          nextSteps,
        }),
      );
    }
  },
);

export default router;
