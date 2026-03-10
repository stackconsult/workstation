/**
 * Express type augmentation for Passport and JWT
 */

declare global {
  namespace Express {
    // Passport User type - compatible with JWTPayload
    // Must include userId for JWT compatibility
    interface User {
      userId: string; // Required by JWTPayload
      id: string;
      email: string;
      full_name?: string;
      access_level?: string;
      role?: string;
      github_username?: string;
      avatar_url?: string;
      [key: string]: string | number | boolean | undefined;
    }

    // Request extensions
    interface Request {
      requestId?: string;
    }
  }
}

// Extend the module to make TypeScript happy
export {};
