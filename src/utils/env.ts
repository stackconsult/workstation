import { logger } from "./logger";

interface EnvironmentConfig {
  jwtSecret: string;
  jwtExpiration: string;
  sessionSecret: string;
  port: number;
  nodeEnv: string;
  dbConfig: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
  };
  corsOrigins: string[];
}

/**
 * Validates environment variables and provides sensible defaults
 * FAIL FAST: Critical errors will throw and prevent server startup
 */
export function validateEnvironment(): EnvironmentConfig {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Get NODE_ENV first as it affects other validation
  const nodeEnv = process.env.NODE_ENV || "development";
  const validEnvironments = ["development", "production", "test"];
  if (!validEnvironments.includes(nodeEnv)) {
    warnings.push(
      `NODE_ENV has unexpected value: ${nodeEnv}. Valid values: ${validEnvironments.join(", ")}`,
    );
  }

  // JWT_SECRET validation (relaxed for test environment)
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    if (nodeEnv === "production") {
      errors.push("JWT_SECRET environment variable is required in production");
    } else if (nodeEnv !== "test") {
      warnings.push(
        "JWT_SECRET not set - using default (only acceptable in development/test)",
      );
    }
  } else if (
    jwtSecret ===
    "default-secret-change-this-in-production-use-at-least-32-characters"
  ) {
    if (nodeEnv === "production") {
      errors.push(
        "JWT_SECRET must be changed from default value in production",
      );
    } else {
      warnings.push(
        "Using default JWT_SECRET - only acceptable in development",
      );
    }
  } else if (jwtSecret.length < 32 && nodeEnv === "production") {
    warnings.push(
      `JWT_SECRET should be at least 32 characters (current: ${jwtSecret.length})`,
    );
  }

  // SESSION_SECRET validation - MUST be different from JWT_SECRET
  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) {
    if (nodeEnv === "production") {
      errors.push(
        "SESSION_SECRET environment variable is required in production",
      );
    } else if (nodeEnv !== "test") {
      warnings.push(
        "SESSION_SECRET not set - using default (only acceptable in development/test)",
      );
    }
  } else if (sessionSecret === jwtSecret && nodeEnv === "production") {
    errors.push(
      "SESSION_SECRET must be different from JWT_SECRET in production (security requirement)",
    );
  } else if (
    sessionSecret &&
    sessionSecret.length < 32 &&
    nodeEnv === "production"
  ) {
    warnings.push(
      `SESSION_SECRET should be at least 32 characters (current: ${sessionSecret.length})`,
    );
  }

  // JWT_EXPIRATION validation
  const jwtExpiration = process.env.JWT_EXPIRATION || "24h";
  const validExpirationPattern = /^\d+[smhd]$/;
  if (!validExpirationPattern.test(jwtExpiration)) {
    warnings.push(
      `JWT_EXPIRATION has invalid format: ${jwtExpiration}. Using default: 24h`,
    );
  }

  // PORT validation
  const portStr = process.env.PORT || "3000";
  const port = parseInt(portStr, 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    errors.push(`Invalid PORT value: ${portStr}. Must be between 1 and 65535`);
  }

  // Database configuration validation
  const dbHost = process.env.DB_HOST || "localhost";
  const dbPortStr = process.env.DB_PORT || "5432";
  const dbPort = parseInt(dbPortStr, 10);
  const dbName = process.env.DB_NAME || "workstation_saas";
  const dbUser = process.env.DB_USER || "postgres";
  const dbPassword = process.env.DB_PASSWORD || "";

  if (isNaN(dbPort) || dbPort < 1 || dbPort > 65535) {
    errors.push(
      `Invalid DB_PORT value: ${dbPortStr}. Must be between 1 and 65535`,
    );
  }

  if (!dbPassword && nodeEnv === "production") {
    errors.push("DB_PASSWORD is required in production");
  }

  // CORS validation
  const corsOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim())
    : nodeEnv === "production"
      ? [] // No origins in production by default - must be explicitly set
      : [
          "http://localhost:3000",
          "http://localhost:3001",
          "http://localhost:7042",
        ];

  if (corsOrigins.length === 0 && nodeEnv === "production") {
    errors.push(
      "ALLOWED_ORIGINS must be explicitly set in production for CORS security",
    );
  }

  // Production-specific checks
  if (nodeEnv === "production") {
    if (!process.env.JWT_SECRET) {
      errors.push("JWT_SECRET must be explicitly set in production");
    }
    if (!process.env.SESSION_SECRET) {
      errors.push("SESSION_SECRET must be explicitly set in production");
    }
    if (!process.env.DB_PASSWORD) {
      errors.push("DB_PASSWORD must be explicitly set in production");
    }
    if (!process.env.ALLOWED_ORIGINS) {
      errors.push("ALLOWED_ORIGINS must be explicitly set in production");
    }
  }

  // Log warnings
  warnings.forEach((warning) => {
    logger.warn("Environment configuration warning", { warning });
  });

  // Throw errors if any
  if (errors.length > 0) {
    const errorMessage =
      "Environment validation failed:\n" +
      errors.map((e) => `  - ${e}`).join("\n");
    logger.error("Environment validation failed", { errors });
    throw new Error(errorMessage);
  }

  return {
    jwtSecret:
      jwtSecret ||
      "default-secret-change-this-in-production-use-at-least-32-characters",
    sessionSecret:
      sessionSecret ||
      jwtSecret ||
      "default-session-secret-change-this-in-production",
    jwtExpiration,
    port,
    nodeEnv,
    dbConfig: {
      host: dbHost,
      port: dbPort,
      name: dbName,
      user: dbUser,
      password: dbPassword,
    },
    corsOrigins,
  };
}

/**
 * Prints environment configuration summary
 */
export function printEnvironmentSummary(config: EnvironmentConfig): void {
  logger.info("Environment configuration loaded", {
    nodeEnv: config.nodeEnv,
    port: config.port,
    jwtExpiration: config.jwtExpiration,
    jwtSecretLength: config.jwtSecret.length,
    sessionSecretLength: config.sessionSecret.length,
    dbHost: config.dbConfig.host,
    dbPort: config.dbConfig.port,
    dbName: config.dbConfig.name,
    corsOriginsCount: config.corsOrigins.length,
  });

  if (config.nodeEnv !== "production" && config.nodeEnv !== "test") {
    console.log("\n🔧 Environment Configuration");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`  Node Environment: ${config.nodeEnv}`);
    console.log(`  Port: ${config.port}`);
    console.log(`  JWT Expiration: ${config.jwtExpiration}`);
    console.log(`  JWT Secret Length: ${config.jwtSecret.length} characters`);
    console.log(
      `  Session Secret Length: ${config.sessionSecret.length} characters`,
    );
    console.log(
      `  Database: ${config.dbConfig.user}@${config.dbConfig.host}:${config.dbConfig.port}/${config.dbConfig.name}`,
    );
    console.log(`  CORS Origins: ${config.corsOrigins.length} configured`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  }
}
