import jwt, { SignOptions, VerifyOptions } from "jsonwebtoken";
import type { StringValue } from "ms";
import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

// JWT configuration - enforce secret in production
if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("JWT_SECRET environment variable is required in production");
}

// Use a more secure default for development/test only
const JWT_SECRET =
  process.env.JWT_SECRET ||
  "dev-secret-min-32-chars-long-for-testing-only-" + Math.random().toString(36);

// Allowed JWT algorithms (prevent 'none' algorithm attack)
const ALLOWED_ALGORITHMS: jwt.Algorithm[] = ["HS256", "HS384", "HS512"];

export interface JWTPayload {
  userId: string;
  role?: string;
  [key: string]: string | number | boolean | undefined;
}

// Extend Express Request interface to include user property
// Note: This now uses Express.User which includes userId
export interface AuthenticatedRequest extends Request {
  user?: Express.User;
}

/**
 * Generate a JWT token with secure settings
 * @param payload - Data to encode in the token
 * @returns Signed JWT token
 */
export function generateToken(payload: JWTPayload): string {
  // Sanitize userId to prevent injection attacks
  if (payload.userId && typeof payload.userId === "string") {
    payload.userId = payload.userId.trim().replace(/[<>]/g, "");
  }

  const expiresIn: StringValue = (process.env.JWT_EXPIRATION ||
    "24h") as StringValue;
  const options: SignOptions = {
    expiresIn,
    algorithm: "HS256", // Explicitly set algorithm
  };

  logger.debug("Generating JWT token", {
    userId: payload.userId,
    algorithm: "HS256",
  });
  return jwt.sign(payload, JWT_SECRET, options);
}

/**
 * Verify and decode a JWT token with algorithm validation
 * @param token - JWT token to verify
 * @returns Decoded payload or null if invalid
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const options: VerifyOptions = {
      algorithms: ALLOWED_ALGORITHMS, // Prevent 'none' algorithm attack
    };
    return jwt.verify(token, JWT_SECRET, options) as JWTPayload;
  } catch (error) {
    logger.debug("Token verification failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return null;
  }
}

/**
 * Express middleware to authenticate requests using JWT
 */
export function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ error: "No token provided" });
    return;
  }

  const payload = verifyToken(token);

  if (!payload) {
    res.status(403).json({ error: "Invalid or expired token" });
    return;
  }

  // Attach payload to request object for use in routes
  // Cast to Express.User to ensure compatibility
  (req as AuthenticatedRequest).user = payload as unknown as Express.User;
  next();
}

/**
 * Generate a token for testing/demo purposes
 * @param userId - User identifier
 * @param role - Optional user role
 * @returns JWT token
 */
export function generateDemoToken(
  userId: string = "demo-user",
  role: string = "user",
): string {
  return generateToken({ userId, role });
}
