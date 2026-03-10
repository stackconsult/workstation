/**
 * Workspace Routes
 * Manage workspaces, activation, and multi-tenant access
 */

import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { authenticateToken, AuthenticatedRequest } from "../auth/jwt";
import db from "../db/connection";
import { logger } from "../utils/logger";
import {
  ErrorCode,
  createErrorResponse,
  createSuccessResponse,
} from "../types/errors";

const router = Router();

/**
 * List available workspaces (for admin/selection)
 * GET /api/workspaces
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const result = await db.query(
      `SELECT id, name, slug, description, is_activated, created_at
       FROM workspaces
       WHERE status = 'active'
       ORDER BY name ASC`,
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    logger.error("List workspaces error", { error });
    res.status(500).json({
      success: false,
      error: "Failed to list workspaces",
    });
  }
});

/**
 * Get workspace details
 * GET /api/workspaces/:slug
 */
router.get("/:slug", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const result = await db.query(
      `SELECT id, name, slug, description, is_activated, created_at
       FROM workspaces
       WHERE slug = $1 AND status = 'active'`,
      [slug],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Workspace not found",
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    logger.error("Get workspace error", { error });
    res.status(500).json({
      success: false,
      error: "Failed to get workspace",
    });
  }
});

/**
 * Login to workspace with generic credentials
 * POST /api/workspaces/:slug/login
 */
router.post("/:slug/login", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json(
        createErrorResponse(
          ErrorCode.MISSING_REQUIRED_FIELD,
          "Username and password are required",
          {
            nextSteps: ["Provide workspace credentials to login"],
          },
        ),
      );
    }

    const result = await db.query(
      `SELECT id, name, slug, generic_username, generic_password_hash, is_activated, owner_id
       FROM workspaces
       WHERE slug = $1 AND status = 'active'`,
      [slug],
    );

    if (result.rows.length === 0) {
      return res.status(404).json(
        createErrorResponse(
          ErrorCode.WORKSPACE_NOT_FOUND,
          `Workspace '${slug}' not found`,
          {
            details:
              "The workspace slug may be incorrect or the workspace may have been deleted",
            nextSteps: [
              "Check the workspace slug for typos",
              "Contact your administrator for the correct workspace name",
              "Visit /api/workspaces to see available workspaces",
            ],
          },
        ),
      );
    }

    const workspace = result.rows[0];

    // Check if workspace is already activated
    if (workspace.is_activated) {
      return res.status(400).json(
        createErrorResponse(
          ErrorCode.WORKSPACE_ALREADY_ACTIVATED,
          "This workspace has been activated and requires personal credentials",
          {
            details:
              "Generic credentials are disabled once a workspace is activated",
            nextSteps: [
              "Use your personal email and password to login",
              "Contact the workspace owner if you need access",
              "Use password reset if you forgot your password",
            ],
          },
        ),
      );
    }

    // Verify generic credentials
    if (username !== workspace.generic_username) {
      return res.status(401).json(
        createErrorResponse(
          ErrorCode.INVALID_WORKSPACE_CREDENTIALS,
          "Invalid credentials",
          {
            retryable: true,
            nextSteps: [
              "Check your username and password",
              "Contact your administrator for credentials",
              "Ensure you are using the generic workspace credentials, not personal credentials",
            ],
          },
        ),
      );
    }

    const validPassword = await bcrypt.compare(
      password,
      workspace.generic_password_hash,
    );
    if (!validPassword) {
      return res.status(401).json(
        createErrorResponse(
          ErrorCode.INVALID_WORKSPACE_CREDENTIALS,
          "Invalid credentials",
          {
            retryable: true,
            nextSteps: [
              "Check your username and password",
              "Contact your administrator for credentials",
              "Ensure you are using the generic workspace credentials, not personal credentials",
            ],
          },
        ),
      );
    }

    logger.info("Workspace generic login successful", {
      workspaceId: workspace.id,
      slug,
    });

    res.json(
      createSuccessResponse(
        {
          workspace: {
            id: workspace.id,
            name: workspace.name,
            slug: workspace.slug,
            isActivated: workspace.is_activated,
          },
          requiresActivation: true,
          activationUrl: `/api/workspaces/${workspace.slug}/activate`,
          nextSteps: [
            "Activate your workspace to claim it with your personal credentials",
            "Choose a secure email and password for your account",
            "After activation, use your personal credentials to login",
          ],
        },
        {
          message:
            "Generic login successful. Please activate your workspace to continue.",
        },
      ),
    );
  } catch (error) {
    logger.error("Workspace login error", { error });
    res.status(500).json(
      createErrorResponse(
        ErrorCode.DATABASE_ERROR,
        "Unable to process login request",
        {
          retryable: true,
          nextSteps: [
            "Try again in a few moments",
            "Contact support if the problem persists",
          ],
        },
      ),
    );
  }
});

/**
 * Activate workspace - update credentials and link to user account
 * POST /api/workspaces/:slug/activate
 */
router.post("/:slug/activate", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const { genericUsername, genericPassword, email, password } = req.body;

    // Validation
    if (!genericUsername || !genericPassword || !email || !password) {
      return res.status(400).json({
        success: false,
        error:
          "All fields are required: genericUsername, genericPassword, email, password",
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: "Invalid email format",
      });
    }

    // Password strength validation
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 8 characters long",
      });
    }

    // Get workspace and verify generic credentials
    const workspaceResult = await db.query(
      `SELECT id, name, slug, generic_username, generic_password_hash, is_activated
       FROM workspaces
       WHERE slug = $1 AND status = 'active'`,
      [slug],
    );

    if (workspaceResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Workspace not found",
      });
    }

    const workspace = workspaceResult.rows[0];

    if (workspace.is_activated) {
      return res.status(400).json({
        success: false,
        error: "Workspace is already activated",
      });
    }

    // Verify generic credentials
    if (genericUsername !== workspace.generic_username) {
      return res.status(401).json({
        success: false,
        error: "Invalid generic credentials",
      });
    }

    const validGenericPassword = await bcrypt.compare(
      genericPassword,
      workspace.generic_password_hash,
    );
    if (!validGenericPassword) {
      return res.status(401).json({
        success: false,
        error: "Invalid generic credentials",
      });
    }

    // Check if user already exists
    let userId: string;
    const userResult = await db.query("SELECT id FROM users WHERE email = $1", [
      email.toLowerCase(),
    ]);

    if (userResult.rows.length > 0) {
      // User exists, link workspace to existing user
      userId = userResult.rows[0].id;
    } else {
      // Create new user
      const passwordHash = await bcrypt.hash(password, 10);
      const licenseKey = `WS-${uuidv4().substring(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

      const newUserResult = await db.query(
        `INSERT INTO users (email, password_hash, license_key, is_verified)
         VALUES ($1, $2, $3, true)
         RETURNING id`,
        [email.toLowerCase(), passwordHash, licenseKey],
      );
      userId = newUserResult.rows[0].id;
    }

    // Update workspace
    await db.query(
      `UPDATE workspaces
       SET owner_id = $1, is_activated = true, activated_at = NOW()
       WHERE id = $2`,
      [userId, workspace.id],
    );

    // Add user as workspace owner
    await db.query(
      `INSERT INTO workspace_members (workspace_id, user_id, role)
       VALUES ($1, $2, 'owner')
       ON CONFLICT (workspace_id, user_id) DO UPDATE SET role = 'owner'`,
      [workspace.id, userId],
    );

    logger.info("Workspace activated", {
      workspaceId: workspace.id,
      slug,
      userId,
      email,
    });

    res.json({
      success: true,
      message: "Workspace activated successfully",
      data: {
        workspace: {
          id: workspace.id,
          name: workspace.name,
          slug: workspace.slug,
        },
        user: {
          id: userId,
          email: email.toLowerCase(),
        },
      },
    });
  } catch (error) {
    logger.error("Workspace activation error", { error });
    res.status(500).json({
      success: false,
      error: "Activation failed",
    });
  }
});

/**
 * Get user's workspaces
 * GET /api/workspaces/my
 */
router.get(
  "/my/workspaces",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId;

      const result = await db.query(
        `SELECT w.id, w.name, w.slug, w.description, wm.role, wm.joined_at, w.is_activated
       FROM workspaces w
       INNER JOIN workspace_members wm ON w.id = wm.workspace_id
       WHERE wm.user_id = $1 AND wm.is_active = true AND w.status = 'active'
       ORDER BY wm.joined_at DESC`,
        [userId],
      );

      res.json({
        success: true,
        data: result.rows,
      });
    } catch (error) {
      logger.error("Get user workspaces error", { error });
      res.status(500).json({
        success: false,
        error: "Failed to get workspaces",
      });
    }
  },
);

/**
 * Get workspace members
 * GET /api/workspaces/:slug/members
 */
router.get(
  "/:slug/members",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { slug } = req.params;
      const userId = req.user?.userId;

      // Verify user has access to workspace
      const accessCheck = await db.query(
        `SELECT wm.role
       FROM workspace_members wm
       INNER JOIN workspaces w ON wm.workspace_id = w.id
       WHERE w.slug = $1 AND wm.user_id = $2 AND wm.is_active = true`,
        [slug, userId],
      );

      if (accessCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          error: "Access denied",
        });
      }

      // Get workspace members
      const result = await db.query(
        `SELECT u.id, u.email, u.full_name, u.avatar_url, wm.role, wm.joined_at
       FROM workspace_members wm
       INNER JOIN users u ON wm.user_id = u.id
       INNER JOIN workspaces w ON wm.workspace_id = w.id
       WHERE w.slug = $1 AND wm.is_active = true
       ORDER BY wm.joined_at ASC`,
        [slug],
      );

      res.json({
        success: true,
        data: result.rows,
      });
    } catch (error) {
      logger.error("Get workspace members error", { error });
      res.status(500).json({
        success: false,
        error: "Failed to get members",
      });
    }
  },
);

export default router;
