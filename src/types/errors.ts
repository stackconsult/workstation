/**
 * Error Codes and Types
 * Machine-readable error codes for consistent error handling and internationalization
 */

/**
 * Standardized error codes for the application
 */
export enum ErrorCode {
  // Authentication errors (1xxx)
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  USER_ALREADY_EXISTS = "USER_ALREADY_EXISTS",
  USER_NOT_FOUND = "USER_NOT_FOUND",
  EMAIL_NOT_VERIFIED = "EMAIL_NOT_VERIFIED",
  WEAK_PASSWORD = "WEAK_PASSWORD",
  INVALID_EMAIL_FORMAT = "INVALID_EMAIL_FORMAT",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  TOKEN_INVALID = "TOKEN_INVALID",

  // Workspace errors (2xxx)
  WORKSPACE_NOT_FOUND = "WORKSPACE_NOT_FOUND",
  WORKSPACE_ALREADY_ACTIVATED = "WORKSPACE_ALREADY_ACTIVATED",
  WORKSPACE_ACCESS_DENIED = "WORKSPACE_ACCESS_DENIED",
  INVALID_WORKSPACE_CREDENTIALS = "INVALID_WORKSPACE_CREDENTIALS",

  // Integration errors (3xxx)
  SLACK_OAUTH_FAILED = "SLACK_OAUTH_FAILED",
  SLACK_OAUTH_DENIED = "SLACK_OAUTH_DENIED",
  SLACK_INTEGRATION_ERROR = "SLACK_INTEGRATION_ERROR",
  INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS",

  // Validation errors (4xxx)
  MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD",
  INVALID_INPUT_FORMAT = "INVALID_INPUT_FORMAT",

  // Server errors (5xxx)
  DATABASE_ERROR = "DATABASE_ERROR",
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
}

/**
 * Standardized error response structure
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: string;
    field?: string;
    requestId?: string;
    retryable?: boolean;
    nextSteps?: string[];
  };
}

/**
 * Standardized success response structure
 */
export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
  requestId?: string;
}

/**
 * Helper function to create error responses
 */
export function createErrorResponse(
  code: ErrorCode,
  message: string,
  options?: {
    details?: string;
    field?: string;
    requestId?: string;
    retryable?: boolean;
    nextSteps?: string[];
  },
): ErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
      ...options,
    },
  };
}

/**
 * Helper function to create success responses
 */
export function createSuccessResponse<T>(
  data: T,
  options?: {
    message?: string;
    requestId?: string;
  },
): SuccessResponse<T> {
  return {
    success: true,
    data,
    ...options,
  };
}

/**
 * Password validation rules
 */
export interface PasswordValidationRules {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumber: boolean;
  requireSpecialChar: boolean;
}

export const DEFAULT_PASSWORD_RULES: PasswordValidationRules = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: true,
};

/**
 * Password validation result
 */
export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
  strength: "weak" | "fair" | "good" | "strong";
}

/**
 * Validate password against rules
 */
export function validatePassword(
  password: string,
  rules: PasswordValidationRules = DEFAULT_PASSWORD_RULES,
): PasswordValidationResult {
  const errors: string[] = [];

  // Trim to avoid whitespace-only passwords and use trimmed version for all checks
  const trimmed = password.trim();

  if (trimmed.length === 0) {
    return {
      valid: false,
      errors: ["Password cannot be empty or contain only whitespace"],
      strength: "weak",
    };
  }

  if (trimmed.length < rules.minLength) {
    errors.push(`Password must be at least ${rules.minLength} characters long`);
  }

  if (rules.requireUppercase && !/[A-Z]/.test(trimmed)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (rules.requireLowercase && !/[a-z]/.test(trimmed)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (rules.requireNumber && !/\d/.test(trimmed)) {
    errors.push("Password must contain at least one number");
  }

  if (
    rules.requireSpecialChar &&
    !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(trimmed)
  ) {
    errors.push("Password must contain at least one special character");
  }

  // Calculate strength using trimmed password
  let strength: "weak" | "fair" | "good" | "strong" = "weak";
  const hasUpper = /[A-Z]/.test(trimmed);
  const hasLower = /[a-z]/.test(trimmed);
  const hasNumber = /\d/.test(trimmed);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(trimmed);
  const criteriaCount = [hasUpper, hasLower, hasNumber, hasSpecial].filter(
    Boolean,
  ).length;

  if (errors.length === 0) {
    if (trimmed.length >= 12 && criteriaCount === 4) {
      strength = "strong";
    } else if (trimmed.length >= 10 && criteriaCount >= 3) {
      strength = "good";
    } else {
      strength = "fair";
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    strength,
  };
}
