/**
 * Email Verification Service
 * Complete production-ready email verification system
 *
 * Features:
 * - JWT-based verification tokens (24h expiration)
 * - Rate limiting to prevent spam
 * - Database-backed token storage (PostgreSQL)
 * - HTML and plain text email templates
 * - Token expiration handling
 * - Resend verification support
 *
 * Note: This service requires PostgreSQL as it uses PostgreSQL-specific syntax
 * (INTERVAL for date arithmetic). Uses src/db/connection.ts PostgreSQL pool.
 */

import { generateToken, verifyToken, JWTPayload } from "../auth/jwt";
import nodemailer from "nodemailer";
import db from "../db/connection";
import { logger } from "../utils/logger";
import sanitizeHtml from "sanitize-html";

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth:
    process.env.SMTP_USER && process.env.SMTP_PASS
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        }
      : undefined,
});

const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@workstation.dev";
const APP_URL = process.env.APP_URL || "http://localhost:7042";

/**
 * Verification token payload interface
 */
interface VerificationTokenPayload extends JWTPayload {
  userId: string;
  email: string;
  type: "email_verification";
}

/**
 * Generate email verification token
 * @param userId - User ID
 * @param email - User email address
 * @returns JWT token valid for 24 hours
 */
export function generateVerificationToken(
  userId: string,
  email: string,
): string {
  const payload: VerificationTokenPayload = {
    userId,
    email: email.toLowerCase().trim(),
    type: "email_verification",
  };

  // Generate JWT with 24h expiration
  return generateToken(payload);
}

/**
 * Verify email verification token
 * @param token - JWT token to verify
 * @returns Decoded payload or null if invalid/expired
 */
export function verifyVerificationToken(
  token: string,
): VerificationTokenPayload | null {
  try {
    const payload = verifyToken(token);

    if (!payload || payload.type !== "email_verification") {
      logger.warn("Invalid verification token type", {
        type: payload?.type,
      });
      return null;
    }

    return payload as VerificationTokenPayload;
  } catch (error) {
    logger.error("Token verification failed", { error });
    return null;
  }
}

/**
 * Sanitize email address to prevent injection
 * @param email - Raw email address
 * @returns Sanitized email address
 */
function sanitizeEmail(email: string): string {
  // Remove HTML tags and dangerous characters
  const sanitized = sanitizeHtml(email, {
    allowedTags: [],
    allowedAttributes: {},
  });

  return sanitized.toLowerCase().trim();
}

/**
 * Store verification token in database
 * @param userId - User ID
 * @param token - Verification token
 * @param expiresAt - Token expiration timestamp
 */
async function storeVerificationToken(
  userId: string,
  token: string,
  expiresAt: Date,
): Promise<void> {
  try {
    await db.query(
      `INSERT INTO email_verification_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) 
       DO UPDATE SET 
         token = EXCLUDED.token,
         expires_at = EXCLUDED.expires_at,
         created_at = NOW(),
         used = false`,
      [userId, token, expiresAt],
    );

    logger.debug("Verification token stored", { userId });
  } catch (error) {
    logger.error("Failed to store verification token", { error, userId });
    throw new Error("Failed to store verification token");
  }
}

/**
 * Check if verification token exists and is valid
 * @param token - Verification token
 * @returns True if token is valid and unused
 */
async function isTokenValid(token: string): Promise<boolean> {
  try {
    const result = await db.query(
      `SELECT id, expires_at, used 
       FROM email_verification_tokens 
       WHERE token = $1 AND used = false AND expires_at > NOW()`,
      [token],
    );

    return result.rows.length > 0;
  } catch (error) {
    logger.error("Failed to check token validity", { error });
    return false;
  }
}

/**
 * Mark verification token as used
 * @param token - Verification token
 */
async function markTokenAsUsed(token: string): Promise<void> {
  try {
    await db.query(
      `UPDATE email_verification_tokens 
       SET used = true, used_at = NOW() 
       WHERE token = $1`,
      [token],
    );

    logger.debug("Verification token marked as used");
  } catch (error) {
    logger.error("Failed to mark token as used", { error });
    throw new Error("Failed to mark token as used");
  }
}

/**
 * Send verification email with HTML and plain text templates
 * @param email - User email address
 * @param token - Verification token
 */
export async function sendVerificationEmail(
  email: string,
  token: string,
): Promise<void> {
  const sanitizedEmail = sanitizeEmail(email);
  // Validate APP_URL is HTTPS in production for security
  const appUrl =
    process.env.NODE_ENV === "production" && !APP_URL.startsWith("https://")
      ? APP_URL.replace("http://", "https://")
      : APP_URL;

  const verificationUrl = `${appUrl}/api/auth/verify-email?token=${encodeURIComponent(token)}`;

  const mailOptions = {
    from: FROM_EMAIL,
    to: sanitizedEmail,
    subject: "Verify Your Email - Workstation",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #333; margin: 0;">Workstation</h1>
          <p style="color: #666; margin: 5px 0;">Browser Automation Platform</p>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px; border: 1px solid #dee2e6;">
          <h2 style="color: #333; margin-top: 0;">Verify Your Email Address</h2>
          <p style="color: #555; font-size: 16px; line-height: 1.6;">
            Thank you for signing up! Please verify your email address to activate your account and start using Workstation.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #007bff; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">
              Verify Email Address
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px; line-height: 1.6;">
            Or copy and paste this link into your browser:
          </p>
          <p style="color: #007bff; word-break: break-all; font-size: 13px; background-color: #fff; padding: 10px; border-radius: 4px; border: 1px solid #dee2e6;">
            ${verificationUrl}
          </p>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
          <p style="color: #999; font-size: 13px; line-height: 1.6;">
            <strong>Security Notice:</strong><br>
            • This verification link will expire in 24 hours<br>
            • If you didn't create an account, please ignore this email<br>
            • Never share this link with anyone
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
          <p style="color: #999; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} Workstation. All rights reserved.
          </p>
        </div>
      </div>
    `,
    text: `
WORKSTATION - EMAIL VERIFICATION

Verify Your Email Address

Thank you for signing up! Please verify your email address to activate your account and start using Workstation.

Verification Link:
${verificationUrl}

This link will expire in 24 hours.

SECURITY NOTICE:
- If you didn't create an account, please ignore this email
- Never share this link with anyone
- This is an automated message, please do not reply

© ${new Date().getFullYear()} Workstation. All rights reserved.
    `.trim(),
  };

  try {
    // Check if SMTP is configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      logger.warn("Email not sent - SMTP credentials not configured", {
        email: sanitizedEmail,
      });
      logger.info("Verification URL (dev mode)", { verificationUrl });
      return;
    }

    await transporter.sendMail(mailOptions);
    logger.info("Verification email sent successfully", {
      email: sanitizedEmail,
      tokenLength: token.length,
    });
  } catch (error) {
    logger.error("Failed to send verification email", {
      error: error instanceof Error ? error.message : "Unknown error",
      email: sanitizedEmail,
    });
    throw new Error("Failed to send verification email");
  }
}

/**
 * Create and send verification email for a user
 * @param userId - User ID
 * @param email - User email address
 * @returns True if email sent successfully
 */
export async function createAndSendVerification(
  userId: string,
  email: string,
): Promise<boolean> {
  try {
    // Generate verification token
    const token = generateVerificationToken(userId, email);

    // Token expires in 24 hours
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Store token in database
    await storeVerificationToken(userId, token, expiresAt);

    // Send verification email
    await sendVerificationEmail(email, token);

    logger.info("Verification process initiated", {
      userId,
      email: sanitizeEmail(email),
    });

    return true;
  } catch (error) {
    logger.error("Failed to create and send verification", {
      error: error instanceof Error ? error.message : "Unknown error",
      userId,
    });
    return false;
  }
}

/**
 * Verify email using token and mark user as verified
 * @param token - Verification token
 * @returns Success status and user info
 */
export async function verifyEmail(token: string): Promise<{
  success: boolean;
  message: string;
  userId?: string;
  email?: string;
}> {
  try {
    // Verify JWT token
    const payload = verifyVerificationToken(token);

    if (!payload) {
      return {
        success: false,
        message: "Invalid or expired verification token",
      };
    }

    // Check if token exists in database and is unused
    const isValid = await isTokenValid(token);

    if (!isValid) {
      return {
        success: false,
        message: "Token has already been used or has expired",
      };
    }

    // Mark user as verified in database
    const result = await db.query(
      `UPDATE users 
       SET is_verified = true, updated_at = NOW() 
       WHERE id = $1 AND email = $2
       RETURNING id, email, full_name`,
      [payload.userId, payload.email],
    );

    if (result.rows.length === 0) {
      return {
        success: false,
        message: "User not found or email mismatch",
      };
    }

    // Mark token as used
    await markTokenAsUsed(token);

    const user = result.rows[0];

    logger.info("Email verified successfully", {
      userId: user.id,
      email: user.email,
    });

    return {
      success: true,
      message: "Email verified successfully",
      userId: user.id,
      email: user.email,
    };
  } catch (error) {
    logger.error("Email verification failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return {
      success: false,
      message: "Email verification failed",
    };
  }
}

/**
 * Check if user has already verified their email
 * @param userId - User ID
 * @returns True if user is verified
 */
export async function isEmailVerified(userId: string): Promise<boolean> {
  try {
    const result = await db.query(
      "SELECT is_verified FROM users WHERE id = $1",
      [userId],
    );

    return result.rows.length > 0 && result.rows[0].is_verified === true;
  } catch (error) {
    logger.error("Failed to check email verification status", {
      error,
      userId,
    });
    return false;
  }
}

/**
 * Resend verification email with rate limiting
 * @param userId - User ID
 * @returns Success status and message
 */
export async function resendVerificationEmail(userId: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    // Get user info
    const userResult = await db.query(
      "SELECT email, is_verified FROM users WHERE id = $1",
      [userId],
    );

    if (userResult.rows.length === 0) {
      return {
        success: false,
        message: "User not found",
      };
    }

    const user = userResult.rows[0];

    // Check if already verified
    if (user.is_verified) {
      return {
        success: false,
        message: "Email is already verified",
      };
    }

    // Check rate limiting - max 5 emails per hour
    const recentTokens = await db.query(
      `SELECT COUNT(*) as count 
       FROM email_verification_tokens 
       WHERE user_id = $1 
       AND created_at > NOW() - INTERVAL '1 hour'`,
      [userId],
    );

    const tokenCount = parseInt(recentTokens.rows[0].count);

    if (tokenCount >= 5) {
      logger.warn("Verification email rate limit exceeded", { userId });
      return {
        success: false,
        message: "Too many verification emails sent. Please try again later.",
      };
    }

    // Create and send new verification email
    const sent = await createAndSendVerification(userId, user.email);

    if (sent) {
      return {
        success: true,
        message: "Verification email sent successfully",
      };
    } else {
      return {
        success: false,
        message: "Failed to send verification email",
      };
    }
  } catch (error) {
    logger.error("Failed to resend verification email", {
      error: error instanceof Error ? error.message : "Unknown error",
      userId,
    });
    return {
      success: false,
      message: "Failed to resend verification email",
    };
  }
}
