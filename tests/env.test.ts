/// <reference types="jest" />
import { validateEnvironment, printEnvironmentSummary } from '../src/utils/env';
import { logger } from '../src/utils/logger';

// Mock the logger
jest.mock('../src/utils/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('Environment Configuration', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('validateEnvironment', () => {
    it('should return valid config with all environment variables set', () => {
      process.env.NODE_ENV = 'development';
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.JWT_EXPIRATION = '24h';
      process.env.PORT = '3000';

      const config = validateEnvironment();

      expect(config).toEqual({
        jwtSecret: 'a'.repeat(32),
        jwtExpiration: '24h',
        port: 3000,
        nodeEnv: 'development',
      });
    });

    it('should use default values when optional variables are missing', () => {
      process.env.NODE_ENV = 'test';
      delete process.env.JWT_SECRET;
      delete process.env.JWT_EXPIRATION;
      delete process.env.PORT;

      const config = validateEnvironment();

      expect(config.nodeEnv).toBe('test');
      expect(config.jwtExpiration).toBe('24h');
      expect(config.port).toBe(3000);
      expect(config.jwtSecret).toBeTruthy();
    });

    it('should throw error in production without JWT_SECRET', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.JWT_SECRET;

      expect(() => validateEnvironment()).toThrow('Environment validation failed');
      expect(() => validateEnvironment()).toThrow('JWT_SECRET must be explicitly set in production');
    });

    it('should reject default JWT_SECRET in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.JWT_SECRET = 'default-secret-change-this-in-production-use-at-least-32-characters';

      expect(() => validateEnvironment()).toThrow('JWT_SECRET must be changed from default value in production');
    });

    it('should warn about short JWT_SECRET in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.JWT_SECRET = 'short12345678901234567890abc';  // 29 chars - less than 32

      const config = validateEnvironment();

      expect(logger.warn).toHaveBeenCalledWith(
        'Environment configuration warning',
        expect.objectContaining({
          warning: expect.stringContaining('JWT_SECRET should be at least 32 characters'),
        })
      );
      expect(config.jwtSecret).toBe('short12345678901234567890abc');
    });

    it('should validate PORT range', () => {
      process.env.NODE_ENV = 'test';
      process.env.PORT = '70000';

      expect(() => validateEnvironment()).toThrow('Invalid PORT value');
      expect(() => validateEnvironment()).toThrow('Must be between 1 and 65535');
    });

    it('should reject invalid PORT format', () => {
      process.env.NODE_ENV = 'test';
      process.env.PORT = 'invalid';

      expect(() => validateEnvironment()).toThrow('Invalid PORT value');
    });

    it('should reject PORT less than 1', () => {
      process.env.NODE_ENV = 'test';
      process.env.PORT = '0';

      expect(() => validateEnvironment()).toThrow('Invalid PORT value');
    });

    it('should accept valid PORT values', () => {
      process.env.NODE_ENV = 'test';
      
      const validPorts = ['80', '443', '3000', '8080', '65535'];
      validPorts.forEach(port => {
        process.env.PORT = port;
        const config = validateEnvironment();
        expect(config.port).toBe(parseInt(port));
      });
    });

    it('should warn about invalid NODE_ENV', () => {
      process.env.NODE_ENV = 'staging';
      process.env.JWT_SECRET = 'a'.repeat(32);

      const config = validateEnvironment();

      expect(logger.warn).toHaveBeenCalledWith(
        'Environment configuration warning',
        expect.objectContaining({
          warning: expect.stringContaining('NODE_ENV has unexpected value'),
        })
      );
      expect(config.nodeEnv).toBe('staging');
    });

    it('should default NODE_ENV to development', () => {
      delete process.env.NODE_ENV;
      delete process.env.JWT_SECRET;

      const config = validateEnvironment();

      expect(config.nodeEnv).toBe('development');
    });

    it('should validate JWT_EXPIRATION format', () => {
      process.env.NODE_ENV = 'test';
      
      const validExpirations = ['1h', '24h', '7d', '30m', '60s'];
      validExpirations.forEach(expiration => {
        process.env.JWT_EXPIRATION = expiration;
        const config = validateEnvironment();
        expect(config.jwtExpiration).toBe(expiration);
      });
    });

    it('should warn about invalid JWT_EXPIRATION format', () => {
      process.env.NODE_ENV = 'test';
      process.env.JWT_EXPIRATION = 'invalid-format';

      const config = validateEnvironment();

      expect(logger.warn).toHaveBeenCalledWith(
        'Environment configuration warning',
        expect.objectContaining({
          warning: expect.stringContaining('JWT_EXPIRATION has invalid format'),
        })
      );
      // Should still use the invalid value but warn
      expect(config.jwtExpiration).toBe('invalid-format');
    });

    it('should handle test environment gracefully', () => {
      process.env.NODE_ENV = 'test';
      delete process.env.JWT_SECRET;

      expect(() => validateEnvironment()).not.toThrow();
      
      const config = validateEnvironment();
      expect(config.nodeEnv).toBe('test');
      expect(config.jwtSecret).toBeTruthy();
    });

    it('should warn in development without JWT_SECRET', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.JWT_SECRET;

      const config = validateEnvironment();

      expect(logger.warn).toHaveBeenCalledWith(
        'Environment configuration warning',
        expect.objectContaining({
          warning: expect.stringContaining('JWT_SECRET not set'),
        })
      );
      expect(config.jwtSecret).toBeTruthy();
    });

    it('should log all errors before throwing', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.JWT_SECRET;
      process.env.PORT = 'invalid';

      expect(() => validateEnvironment()).toThrow();

      expect(logger.error).toHaveBeenCalledWith(
        'Environment validation failed',
        expect.objectContaining({
          errors: expect.arrayContaining([
            expect.stringContaining('JWT_SECRET'),
            expect.stringContaining('PORT'),
          ]),
        })
      );
    });
  });

  describe('printEnvironmentSummary', () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should log environment summary', () => {
      const config = {
        jwtSecret: 'a'.repeat(32),
        jwtExpiration: '24h',
        port: 3000,
        nodeEnv: 'development',
      };

      printEnvironmentSummary(config);

      expect(logger.info).toHaveBeenCalledWith(
        'Environment configuration loaded',
        {
          nodeEnv: 'development',
          port: 3000,
          jwtExpiration: '24h',
          jwtSecretLength: 32,
        }
      );
    });

    it('should print to console in development', () => {
      const config = {
        jwtSecret: 'a'.repeat(32),
        jwtExpiration: '24h',
        port: 3000,
        nodeEnv: 'development',
      };

      printEnvironmentSummary(config);

      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
      expect(output).toContain('Environment Configuration');
      expect(output).toContain('Port: 3000');
      expect(output).toContain('JWT Expiration: 24h');
    });

    it('should not print to console in production', () => {
      const config = {
        jwtSecret: 'a'.repeat(32),
        jwtExpiration: '24h',
        port: 3000,
        nodeEnv: 'production',
      };

      printEnvironmentSummary(config);

      expect(consoleSpy).not.toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalled();
    });

    it('should not print to console in test', () => {
      const config = {
        jwtSecret: 'a'.repeat(32),
        jwtExpiration: '24h',
        port: 3000,
        nodeEnv: 'test',
      };

      printEnvironmentSummary(config);

      expect(consoleSpy).not.toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalled();
    });

    it('should mask JWT secret length in logs', () => {
      const config = {
        jwtSecret: 'a'.repeat(64),
        jwtExpiration: '24h',
        port: 3000,
        nodeEnv: 'development',
      };

      printEnvironmentSummary(config);

      expect(logger.info).toHaveBeenCalledWith(
        'Environment configuration loaded',
        expect.objectContaining({
          jwtSecretLength: 64,
        })
      );

      // Verify secret itself is not logged
      expect(logger.info).not.toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          jwtSecret: expect.anything(),
        })
      );
    });
  });
});
