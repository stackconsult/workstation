import jwt, { SignOptions } from 'jsonwebtoken';
import type { StringValue } from 'ms';
import { Request, Response, NextFunction } from 'express';

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';

export interface JWTPayload {
  userId: string;
  role?: string;
  [key: string]: string | number | boolean | undefined;
}

// Extend Express Request interface to include user property
export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

/**
 * Generate a JWT token
 * @param payload - Data to encode in the token
 * @returns Signed JWT token
 */
export function generateToken(payload: JWTPayload): string {
  const expiresIn: StringValue = (process.env.JWT_EXPIRATION || '24h') as StringValue;
  const options: SignOptions = {
    expiresIn,
  };
  return jwt.sign(payload, JWT_SECRET, options);
}

/**
 * Verify and decode a JWT token
 * @param token - JWT token to verify
 * @returns Decoded payload or null if invalid
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Express middleware to authenticate requests using JWT
 */
export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  const payload = verifyToken(token);
  
  if (!payload) {
    res.status(403).json({ error: 'Invalid or expired token' });
    return;
  }

  // Attach payload to request object for use in routes
  (req as AuthenticatedRequest).user = payload;
  next();
}

/**
 * Generate a token for testing/demo purposes
 * @param userId - User identifier
 * @param role - Optional user role
 * @returns JWT token
 */
export function generateDemoToken(userId: string = 'demo-user', role: string = 'user'): string {
  return generateToken({ userId, role });
}
