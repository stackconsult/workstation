/**
 * Authentication Routes
 * User registration, login, logout, and session management
 */

import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import {
  generateToken,
  authenticateToken,
  AuthenticatedRequest,
} from "../auth/jwt";
import db from "../db/connection";
import { logger } from "../utils/logger";

const router = Router();

/**
 * Register new user
 * POST /api/auth/register
 */
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { email, password, fullName } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required",
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

    // Check if user exists
    const existingUser = await db.query(
      "SELECT id FROM users WHERE email = $1",
      [email.toLowerCase()],
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: "User already exists",
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate license key
    const licenseKey = `WS-${uuidv4().substring(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

    // Create user
    const result = await db.query(
      `INSERT INTO users (email, password_hash, full_name, license_key)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, full_name, access_level, license_key, created_at`,
      [email.toLowerCase(), passwordHash, fullName || null, licenseKey],
    );

    const user = result.rows[0];

    // Generate JWT
    const token = generateToken({
      userId: user.id,
      email: user.email,
      accessLevel: user.access_level,
    });

    // Create session
    await db.query(
      `INSERT INTO user_sessions (user_id, token, expires_at, ip_address, user_agent)
       VALUES ($1, $2, NOW() + INTERVAL '30 days', $3, $4)`,
      [user.id, token, req.ip, req.headers["user-agent"]],
    );

    logger.info("User registered", { userId: user.id, email: user.email });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          accessLevel: user.access_level,
          licenseKey: user.license_key,
        },
        token,
      },
    });
  } catch (error) {
    logger.error("Registration error", { error });
    res.status(500).json({
      success: false,
      error: "Registration failed",
    });
  }
});

/**
 * Login
 * POST /api/auth/login
 */
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required",
      });
    }

    // Find user
    const result = await db.query(
      "SELECT * FROM users WHERE email = $1 AND is_active = true",
      [email.toLowerCase()],
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    const user = result.rows[0];

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    // Generate JWT
    const token = generateToken({
      userId: user.id,
      email: user.email,
      accessLevel: user.access_level,
    });

    // Create session
    await db.query(
      `INSERT INTO user_sessions (user_id, token, expires_at, ip_address, user_agent)
       VALUES ($1, $2, NOW() + INTERVAL '30 days', $3, $4)`,
      [user.id, token, req.ip, req.headers["user-agent"]],
    );

    // Update last login
    await db.query("UPDATE users SET last_login = NOW() WHERE id = $1", [
      user.id,
    ]);

    logger.info("User logged in", { userId: user.id, email: user.email });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          accessLevel: user.access_level,
          licenseKey: user.license_key,
          githubUsername: user.github_username,
          avatarUrl: user.avatar_url,
        },
        token,
      },
    });
  } catch (error) {
    logger.error("Login error", { error });
    res.status(500).json({
      success: false,
      error: "Login failed",
    });
  }
});

/**
 * Logout
 * POST /api/auth/logout
 */
router.post(
  "/logout",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const token = req.headers.authorization?.split(" ")[1];

      if (token) {
        await db.query(
          "UPDATE user_sessions SET is_valid = false WHERE token = $1",
          [token],
        );
      }

      logger.info("User logged out", { userId: req.user?.userId });

      res.json({
        success: true,
        message: "Logged out successfully",
      });
    } catch (error) {
      logger.error("Logout error", { error });
      res.status(500).json({
        success: false,
        error: "Logout failed",
      });
    }
  },
);

/**
 * Get current user
 * GET /api/auth/me
 */
router.get(
  "/me",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const result = await db.query(
        `SELECT id, email, full_name, access_level, license_key, github_username,
              avatar_url, created_at, last_login, is_verified
       FROM users WHERE id = $1 AND is_active = true`,
        [req.user?.userId],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      const user = result.rows[0];

      // Get subscription info
      const subscription = await db.query(
        `SELECT type, plan, status, purchased_at, expires_at
       FROM subscriptions
       WHERE user_id = $1 AND status = 'active'
       ORDER BY purchased_at DESC
       LIMIT 1`,
        [user.id],
      );

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            fullName: user.full_name,
            accessLevel: user.access_level,
            licenseKey: user.license_key,
            githubUsername: user.github_username,
            avatarUrl: user.avatar_url,
            createdAt: user.created_at,
            lastLogin: user.last_login,
            isVerified: user.is_verified,
          },
          subscription: subscription.rows[0] || null,
        },
      });
    } catch (error) {
      logger.error("Get user error", { error });
      res.status(500).json({
        success: false,
        error: "Failed to get user",
      });
    }
  },
);

/**
 * Verify email token (placeholder for email verification)
 * GET /api/auth/verify/:token
 */
router.get("/verify/:token", async (req: Request, res: Response) => {
  try {
    // TODO: Implement email verification logic
    res.json({
      success: true,
      message: "Email verification endpoint (not yet implemented)",
    });
  } catch (error) {
    logger.error("Email verification error", { error });
    res.status(500).json({
      success: false,
      error: "Verification failed",
    });
  }
});

export default router;
