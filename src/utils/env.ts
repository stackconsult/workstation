import { logger } from './logger';

interface EnvironmentConfig {
  jwtSecret: string;
  jwtExpiration: string;
  port: number;
  nodeEnv: string;
}

/**
 * Validates environment variables and provides sensible defaults
 */
export function validateEnvironment(): EnvironmentConfig {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Get NODE_ENV first as it affects other validation
  const nodeEnv = process.env.NODE_ENV || 'development';
  const validEnvironments = ['development', 'production', 'test'];
  if (!validEnvironments.includes(nodeEnv)) {
    warnings.push(`NODE_ENV has unexpected value: ${nodeEnv}. Valid values: ${validEnvironments.join(', ')}`);
  }

  // JWT_SECRET validation (relaxed for test environment)
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    if (nodeEnv === 'production') {
      errors.push('JWT_SECRET environment variable is required in production');
    } else if (nodeEnv !== 'test') {
      warnings.push('JWT_SECRET not set - using default (only acceptable in development/test)');
    }
  } else if (jwtSecret === 'default-secret-change-this-in-production-use-at-least-32-characters') {
    if (nodeEnv === 'production') {
      errors.push('JWT_SECRET must be changed from default value in production');
    } else {
      warnings.push('Using default JWT_SECRET - only acceptable in development');
    }
  } else if (jwtSecret.length < 32 && nodeEnv === 'production') {
    warnings.push(`JWT_SECRET should be at least 32 characters (current: ${jwtSecret.length})`);
  }

  // JWT_EXPIRATION validation
  const jwtExpiration = process.env.JWT_EXPIRATION || '24h';
  const validExpirationPattern = /^\d+[smhd]$/;
  if (!validExpirationPattern.test(jwtExpiration)) {
    warnings.push(`JWT_EXPIRATION has invalid format: ${jwtExpiration}. Using default: 24h`);
  }

  // PORT validation
  const portStr = process.env.PORT || '3000';
  const port = parseInt(portStr, 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    errors.push(`Invalid PORT value: ${portStr}. Must be between 1 and 65535`);
  }

  // Production-specific checks
  if (nodeEnv === 'production') {
    if (!process.env.JWT_SECRET) {
      errors.push('JWT_SECRET must be explicitly set in production');
    }
  }

  // Log warnings
  warnings.forEach(warning => {
    logger.warn('Environment configuration warning', { warning });
  });

  // Throw errors if any
  if (errors.length > 0) {
    const errorMessage = 'Environment validation failed:\n' + errors.map(e => `  - ${e}`).join('\n');
    logger.error('Environment validation failed', { errors });
    throw new Error(errorMessage);
  }

  return {
    jwtSecret: jwtSecret || 'default-secret-change-this-in-production-use-at-least-32-characters',
    jwtExpiration,
    port,
    nodeEnv,
  };
}

/**
 * Prints environment configuration summary
 */
export function printEnvironmentSummary(config: EnvironmentConfig): void {
  logger.info('Environment configuration loaded', {
    nodeEnv: config.nodeEnv,
    port: config.port,
    jwtExpiration: config.jwtExpiration,
    jwtSecretLength: config.jwtSecret.length,
  });

  if (config.nodeEnv !== 'production' && config.nodeEnv !== 'test') {
    console.log('\n🔧 Environment Configuration');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  Node Environment: ${config.nodeEnv}`);
    console.log(`  Port: ${config.port}`);
    console.log(`  JWT Expiration: ${config.jwtExpiration}`);
    console.log(`  JWT Secret Length: ${config.jwtSecret.length} characters`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }
}
