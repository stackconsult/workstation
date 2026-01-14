/**
 * Authentication Routes
 * User registration, login, logout, OAuth, and password reset
 */

import { Router, Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import {
  generateToken,
  authenticateToken,
  AuthenticatedRequest,
} from "../auth/jwt";
import passport from "../auth/passport";
import db from "../db/connection";
import { logger } from "../utils/logger";
import { sendPasswordResetEmail } from "../services/email";
import {
  createAndSendVerification,
  verifyEmail,
  resendVerificationEmail,
} from "../services/email-verification";
import {
  ErrorCode,
  createErrorResponse,
  createSuccessResponse,
  validatePassword,
} from "../types/errors";

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
      return res.status(400).json(
        createErrorResponse(
          ErrorCode.MISSING_REQUIRED_FIELD,
          "Email and password are required",
          {
            nextSteps: ["Provide both email and password to register"],
          },
        ),
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json(
        createErrorResponse(
          ErrorCode.INVALID_EMAIL_FORMAT,
          "Invalid email format",
          {
            field: "email",
            nextSteps: ["Use a valid email address (e.g., user@example.com)"],
          },
        ),
      );
    }

    // Password strength validation
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json(
        createErrorResponse(
          ErrorCode.WEAK_PASSWORD,
          "Password does not meet security requirements",
          {
            field: "password",
            details: passwordValidation.errors.join(". "),
            nextSteps: [
              "Use at least 8 characters",
              "Include uppercase and lowercase letters",
              "Include at least one number",
              "Include at least one special character (!@#$%^&*)",
            ],
          },
        ),
      );
    }

    // Check if user exists
    const existingUser = await db.query(
      "SELECT id FROM users WHERE email = $1",
      [email.toLowerCase()],
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json(
        createErrorResponse(
          ErrorCode.USER_ALREADY_EXISTS,
          "An account with this email already exists",
          {
            field: "email",
            nextSteps: [
              "Try logging in instead",
              "Use password reset if you forgot your password",
              "Contact support if you need help accessing your account",
            ],
          },
        ),
      );
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

    // Send verification email asynchronously (don't block registration)
    createAndSendVerification(user.id, user.email).catch((error) => {
      logger.error("Failed to send verification email during registration", {
        error: error instanceof Error ? error.message : "Unknown error",
        userId: user.id,
      });
    });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          accessLevel: user.access_level,
          licenseKey: user.license_key,
          isVerified: false,
        },
        token,
      },
      message:
        "Registration successful. Please check your email to verify your account.",
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
 * Change password (authenticated users)
 * POST /api/auth/change-password
 */
router.post(
  "/change-password",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user?.userId;
      const requestId = req.requestId;

      // Validation
      if (!currentPassword || !newPassword) {
        return res.status(400).json(
          createErrorResponse(
            ErrorCode.MISSING_REQUIRED_FIELD,
            "Current password and new password are required",
            {
              requestId,
              nextSteps: ["Provide both current and new password"],
            },
          ),
        );
      }

      // Validate new password strength
      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.valid) {
        return res.status(400).json(
          createErrorResponse(
            ErrorCode.WEAK_PASSWORD,
            "New password does not meet security requirements",
            {
              field: "newPassword",
              details: passwordValidation.errors.join(". "),
              requestId,
              nextSteps: [
                "Use at least 8 characters",
                "Include uppercase and lowercase letters",
                "Include at least one number",
                "Include at least one special character (!@#$%^&*)",
              ],
            },
          ),
        );
      }

      // Get current user
      const userResult = await db.query(
        "SELECT id, email, password_hash FROM users WHERE id = $1",
        [userId],
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json(
          createErrorResponse(ErrorCode.USER_NOT_FOUND, "User not found", {
            requestId,
            nextSteps: ["Please login again"],
          }),
        );
      }

      const user = userResult.rows[0];

      // Verify current password
      const validPassword = await bcrypt.compare(
        currentPassword,
        user.password_hash,
      );
      if (!validPassword) {
        return res.status(401).json(
          createErrorResponse(
            ErrorCode.INVALID_CREDENTIALS,
            "Current password is incorrect",
            {
              field: "currentPassword",
              requestId,
              retryable: true,
              nextSteps: [
                "Check your current password",
                "Use password reset if you forgot your password",
              ],
            },
          ),
        );
      }

      // Check if new password is same as current
      const samePassword = await bcrypt.compare(
        newPassword,
        user.password_hash,
      );
      if (samePassword) {
        return res.status(400).json(
          createErrorResponse(
            ErrorCode.INVALID_INPUT_FORMAT,
            "New password must be different from current password",
            {
              field: "newPassword",
              requestId,
              nextSteps: ["Choose a different password"],
            },
          ),
        );
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, 10);

      // Update password
      await db.query(
        "UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2",
        [newPasswordHash, userId],
      );

      // Invalidate all other sessions (optional security measure)
      const currentToken = req.headers.authorization?.split(" ")[1];
      await db.query(
        "UPDATE user_sessions SET is_valid = false WHERE user_id = $1 AND token != $2",
        [userId, currentToken],
      );

      logger.info("Password changed successfully", {
        userId,
        email: user.email,
      });

      res.json(
        createSuccessResponse(
          {
            message: "Password changed successfully",
            sessionsInvalidated: true,
          },
          {
            message:
              "Your password has been updated. All other sessions have been logged out for security.",
            requestId,
          },
        ),
      );
    } catch (error) {
      logger.error("Password change error", {
        error,
        userId: req.user?.userId,
      });
      res.status(500).json(
        createErrorResponse(
          ErrorCode.INTERNAL_SERVER_ERROR,
          "Failed to change password",
          {
            requestId: req.requestId,
            retryable: true,
            nextSteps: [
              "Try again in a few moments",
              "Contact support if the problem persists",
            ],
          },
        ),
      );
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
 * Verify email using token
 * GET /api/auth/verify-email?token=xxx
 */
router.get("/verify-email", async (req: Request, res: Response) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== "string") {
      return res.status(400).json({
        success: false,
        error: "Verification token is required",
      });
    }

    // Verify email using token
    const result = await verifyEmail(token);

    if (result.success) {
      logger.info("Email verified successfully via endpoint", {
        userId: result.userId,
        email: result.email,
      });

      // Return HTML response for better UX
      return res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verified - Workstation</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
            }
            .container {
              background: white;
              border-radius: 12px;
              box-shadow: 0 10px 40px rgba(0,0,0,0.1);
              padding: 40px;
              max-width: 500px;
              text-align: center;
            }
            .success-icon {
              font-size: 64px;
              color: #28a745;
              margin-bottom: 20px;
            }
            h1 {
              color: #333;
              margin: 0 0 10px 0;
              font-size: 28px;
            }
            p {
              color: #666;
              font-size: 16px;
              line-height: 1.6;
              margin: 0 0 30px 0;
            }
            .btn {
              display: inline-block;
              background-color: #007bff;
              color: white;
              padding: 12px 32px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: bold;
              transition: background-color 0.3s;
            }
            .btn:hover {
              background-color: #0056b3;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="success-icon">✓</div>
            <h1>Email Verified Successfully!</h1>
            <p>Your email address has been verified. You can now access all features of Workstation.</p>
            <a href="${process.env.APP_URL || "http://localhost:7042"}" class="btn">Go to Dashboard</a>
          </div>
        </body>
        </html>
      `);
    } else {
      logger.warn("Email verification failed via endpoint", {
        error: result.message,
      });

      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verification Failed - Workstation</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
            }
            .container {
              background: white;
              border-radius: 12px;
              box-shadow: 0 10px 40px rgba(0,0,0,0.1);
              padding: 40px;
              max-width: 500px;
              text-align: center;
            }
            .error-icon {
              font-size: 64px;
              color: #dc3545;
              margin-bottom: 20px;
            }
            h1 {
              color: #333;
              margin: 0 0 10px 0;
              font-size: 28px;
            }
            p {
              color: #666;
              font-size: 16px;
              line-height: 1.6;
              margin: 0 0 30px 0;
            }
            .btn {
              display: inline-block;
              background-color: #007bff;
              color: white;
              padding: 12px 32px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: bold;
              transition: background-color 0.3s;
              margin: 0 5px;
            }
            .btn:hover {
              background-color: #0056b3;
            }
            .btn-secondary {
              background-color: #6c757d;
            }
            .btn-secondary:hover {
              background-color: #5a6268;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="error-icon">✗</div>
            <h1>Verification Failed</h1>
            <p>${result.message}</p>
            <a href="${process.env.APP_URL || "http://localhost:7042"}/api/auth/resend-verification" class="btn btn-secondary">Resend Verification Email</a>
            <a href="${process.env.APP_URL || "http://localhost:7042"}" class="btn">Go to Home</a>
          </div>
        </body>
        </html>
      `);
    }
  } catch (error) {
    logger.error("Email verification error", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return res.status(500).json({
      success: false,
      error: "Verification failed due to server error",
    });
  }
});

/**
 * Resend verification email
 * POST /api/auth/resend-verification
 */
router.post(
  "/resend-verification",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "Authentication required",
        });
      }

      // Resend verification email with rate limiting
      const result = await resendVerificationEmail(userId);

      if (result.success) {
        logger.info("Verification email resent", { userId });
        return res.json({
          success: true,
          message: result.message,
        });
      } else {
        logger.warn("Failed to resend verification email", {
          userId,
          reason: result.message,
        });
        return res.status(400).json({
          success: false,
          error: result.message,
        });
      }
    } catch (error) {
      logger.error("Resend verification error", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return res.status(500).json({
        success: false,
        error: "Failed to resend verification email",
      });
    }
  },
);

/**
 * Verify email token (legacy endpoint - redirects to new endpoint)
 * GET /api/auth/verify/:token
 */
router.get("/verify/:token", async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    // Redirect to new endpoint with query parameter
    res.redirect(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
  } catch (error) {
    logger.error("Email verification redirect error", { error });
    res.status(500).json({
      success: false,
      error: "Verification failed",
    });
  }
});

/**
 * Request password reset
 * POST /api/auth/password-reset/request
 */
router.post("/password-reset/request", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required",
      });
    }

    // Find user
    const result = await db.query(
      "SELECT id, email FROM users WHERE email = $1 AND is_active = true",
      [email.toLowerCase()],
    );

    // Always return success for security (don't reveal if email exists)
    if (result.rows.length === 0) {
      logger.info("Password reset requested for non-existent email", { email });
      return res.json({
        success: true,
        message: "If the email exists, a password reset link has been sent",
      });
    }

    const user = result.rows[0];

    // Generate reset token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    // Store token
    await db.query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at, ip_address)
       VALUES ($1, $2, $3, $4)`,
      [user.id, token, expiresAt, req.ip],
    );

    // Send email
    await sendPasswordResetEmail(user.email, token);

    logger.info("Password reset requested", {
      userId: user.id,
      email: user.email,
    });

    res.json({
      success: true,
      message: "If the email exists, a password reset link has been sent",
    });
  } catch (error) {
    logger.error("Password reset request error", { error });
    res.status(500).json({
      success: false,
      error: "Failed to request password reset",
    });
  }
});

/**
 * Reset password with token
 * POST /api/auth/password-reset/confirm
 */
router.post("/password-reset/confirm", async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        error: "Token and new password are required",
      });
    }

    // Password strength validation
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 8 characters long",
      });
    }

    // Find valid token
    const tokenResult = await db.query(
      `SELECT id, user_id, expires_at, used_at
       FROM password_reset_tokens
       WHERE token = $1`,
      [token],
    );

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid reset token",
      });
    }

    const resetToken = tokenResult.rows[0];

    // Check if token is expired
    if (new Date() > new Date(resetToken.expires_at)) {
      return res.status(400).json({
        success: false,
        error: "Reset token has expired",
      });
    }

    // Check if token was already used
    if (resetToken.used_at) {
      return res.status(400).json({
        success: false,
        error: "Reset token has already been used",
      });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update user password
    await db.query("UPDATE users SET password_hash = $1 WHERE id = $2", [
      passwordHash,
      resetToken.user_id,
    ]);

    // Mark token as used
    await db.query(
      "UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1",
      [resetToken.id],
    );

    logger.info("Password reset successful", { userId: resetToken.user_id });

    res.json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    logger.error("Password reset confirmation error", { error });
    res.status(500).json({
      success: false,
      error: "Failed to reset password",
    });
  }
});

/**
 * Google OAuth - Initiate
 * GET /api/auth/google
 */
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

/**
 * Google OAuth - Callback
 * GET /api/auth/google/callback
 */
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login?error=oauth_failed",
  }),
  (req: Request, res: Response) => {
    // Generate JWT token
    const user = req.user as Express.User;
    const token = generateToken({
      userId: (user as { id: string }).id,
      email: (user as { email: string }).email,
      accessLevel: (user as { access_level: string }).access_level,
    });

    // Redirect to frontend with token
    res.redirect(`/auth/success?token=${token}`);
  },
);

/**
 * GitHub OAuth - Initiate
 * GET /api/auth/github
 */
router.get(
  "/github",
  passport.authenticate("github", { scope: ["user:email"] }),
);

/**
 * GitHub OAuth - Callback
 * GET /api/auth/github/callback
 */
router.get(
  "/github/callback",
  passport.authenticate("github", {
    session: false,
    failureRedirect: "/login?error=oauth_failed",
  }),
  (req: Request, res: Response) => {
    // Generate JWT token
    const user = req.user as Express.User;
    const token = generateToken({
      userId: (user as { id: string }).id,
      email: (user as { email: string }).email,
      accessLevel: (user as { access_level: string }).access_level,
    });

    // Redirect to frontend with token
    res.redirect(`/auth/success?token=${token}`);
  },
);

/**
 * Local Passport authentication
 * POST /api/auth/passport/login
 */
router.post(
  "/passport/login",
  (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate(
      "local",
      (err: Error, user: Express.User, info: { message?: string }) => {
        if (err) {
          logger.error("Passport authentication error", { error: err });
          return res.status(500).json({
            success: false,
            error: "Authentication failed",
          });
        }

        if (!user) {
          return res.status(401).json({
            success: false,
            error: info?.message || "Invalid credentials",
          });
        }

        // Generate JWT token
        const token = generateToken({
          userId: (user as { id: string }).id,
          email: (user as { email: string }).email,
          accessLevel: (user as { access_level: string }).access_level,
        });

        res.json({
          success: true,
          data: {
            user,
            token,
          },
        });
      },
    )(req, res, next);
  },
);

export default router;
