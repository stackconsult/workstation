import { IncomingMessage } from "http";
import { verifyToken } from "../auth/jwt";
import { URL } from "url";

export interface AuthenticatedWebSocket {
  user?: {
    userId: string;
    role?: string;
  };
}

/**
 * WebSocket authentication middleware
 * Validates JWT token from query parameter or upgrade headers
 */
export async function authenticateWebSocket(
  req: IncomingMessage,
): Promise<{ authenticated: boolean; user?: any; error?: string }> {
  try {
    //Extract token from query parameter
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    let token = url.searchParams.get("token");

    // Fallback to Authorization header
    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return {
        authenticated: false,
        error: "No authentication token provided",
      };
    }

    // Verify JWT token
    const decoded = verifyToken(token);

    if (!decoded || !decoded.userId) {
      return {
        authenticated: false,
        error: "Invalid token",
      };
    }

    return {
      authenticated: true,
      user: {
        userId: decoded.userId,
        role: decoded.role,
      },
    };
  } catch (error) {
    return {
      authenticated: false,
      error: `Authentication failed: ${(error as Error).message}`,
    };
  }
}

/**
 * WebSocket connection rate limiter
 * Track connections per user and enforce limits
 */
export class WebSocketRateLimiter {
  private connections: Map<string, number> = new Map();
  private messages: Map<string, { count: number; resetTime: number }> =
    new Map();

  private readonly maxConnectionsPerUser = 10;
  private readonly maxMessagesPerMinute = 100;
  private readonly messageWindowMs = 60000; // 1 minute

  /**
   * Check if user can establish new connection
   */
  canConnect(userId: string): boolean {
    const current = this.connections.get(userId) || 0;
    return current < this.maxConnectionsPerUser;
  }

  /**
   * Track new connection
   */
  trackConnection(userId: string): void {
    const current = this.connections.get(userId) || 0;
    this.connections.set(userId, current + 1);
  }

  /**
   * Remove connection tracking
   */
  untrackConnection(userId: string): void {
    const current = this.connections.get(userId) || 0;
    if (current > 0) {
      this.connections.set(userId, current - 1);
    }
  }

  /**
   * Check if user can send message
   */
  canSendMessage(userId: string): boolean {
    const now = Date.now();
    const userMessages = this.messages.get(userId);

    if (!userMessages || now > userMessages.resetTime) {
      // New window
      this.messages.set(userId, {
        count: 1,
        resetTime: now + this.messageWindowMs,
      });
      return true;
    }

    if (userMessages.count >= this.maxMessagesPerMinute) {
      return false;
    }

    userMessages.count++;
    return true;
  }

  /**
   * Get connection count for user
   */
  getConnectionCount(userId: string): number {
    return this.connections.get(userId) || 0;
  }

  /**
   * Get message count for user in current window
   */
  getMessageCount(userId: string): number {
    const userMessages = this.messages.get(userId);
    if (!userMessages || Date.now() > userMessages.resetTime) {
      return 0;
    }
    return userMessages.count;
  }
}

// Singleton instance
export const wsRateLimiter = new WebSocketRateLimiter();
