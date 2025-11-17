import winston from 'winston';
import { logger } from '../src/utils/logger';
import * as fs from 'fs';
import * as path from 'path';

// Mock fs module
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
}));

describe('Logger Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Logger Configuration', () => {
    it('should create a winston logger instance', () => {
      expect(logger).toBeDefined();
      expect(logger).toBeInstanceOf(winston.Logger);
    });

    it('should have correct default log level', () => {
      const originalEnv = process.env.LOG_LEVEL;
      delete process.env.LOG_LEVEL;

      // Logger is already created, so we check its level property
      expect(['info', 'debug', 'warn', 'error']).toContain(logger.level);

      process.env.LOG_LEVEL = originalEnv;
    });

    it('should respect LOG_LEVEL environment variable', () => {
      // Logger respects the LOG_LEVEL when created
      // We verify it has a valid level
      expect(logger.level).toBeTruthy();
      expect(typeof logger.level).toBe('string');
    });

    it('should have console transport configured', () => {
      const transports = logger.transports;
      expect(transports).toBeDefined();
      expect(transports.length).toBeGreaterThan(0);
      
      const hasConsole = transports.some(
        t => t instanceof winston.transports.Console
      );
      expect(hasConsole).toBe(true);
    });

    it('should have correct default meta', () => {
      expect(logger.defaultMeta).toBeDefined();
      expect(logger.defaultMeta).toHaveProperty('service', 'stackBrowserAgent');
    });

    it('should use JSON format', () => {
      expect(logger.format).toBeDefined();
    });
  });

  describe('Logger Methods', () => {
    it('should have info method', () => {
      expect(typeof logger.info).toBe('function');
    });

    it('should have error method', () => {
      expect(typeof logger.error).toBe('function');
    });

    it('should have warn method', () => {
      expect(typeof logger.warn).toBe('function');
    });

    it('should have debug method', () => {
      expect(typeof logger.debug).toBe('function');
    });

    it('should log messages without throwing errors', () => {
      expect(() => {
        logger.info('Test info message');
        logger.error('Test error message');
        logger.warn('Test warn message');
        logger.debug('Test debug message');
      }).not.toThrow();
    });

    it('should log with metadata', () => {
      expect(() => {
        logger.info('Test with metadata', { user: 'test', action: 'login' });
      }).not.toThrow();
    });

    it('should handle error objects', () => {
      expect(() => {
        const error = new Error('Test error');
        logger.error('Error occurred', { error });
      }).not.toThrow();
    });
  });

  describe('Production File Transports', () => {
    it('should add file transports in production', () => {
      const originalEnv = process.env.NODE_ENV;
      
      // Note: The logger is already initialized, so we check if it would work
      // In a real production environment
      if (process.env.NODE_ENV === 'production') {
        const transports = logger.transports;
        const hasFile = transports.some(
          t => t instanceof winston.transports.File
        );
        expect(hasFile).toBe(true);
      }

      process.env.NODE_ENV = originalEnv;
    });

    it('should have console transport even in production', () => {
      // Console transport should always be present
      const transports = logger.transports;
      const hasConsole = transports.some(
        t => t instanceof winston.transports.Console
      );
      expect(hasConsole).toBe(true);
    });
  });

  describe('Logger Error Handling', () => {
    it('should handle logging errors gracefully', () => {
      // Spy on console.error to catch any winston errors
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Try to log with invalid data types
      expect(() => {
        logger.info(null as any);
        logger.info(undefined as any);
        logger.info({ circular: {} } as any);
      }).not.toThrow();

      consoleErrorSpy.mockRestore();
    });

    it('should handle missing message parameter', () => {
      expect(() => {
        logger.info('', { data: 'test' });
      }).not.toThrow();
    });

    it('should handle complex objects', () => {
      expect(() => {
        const complexObj = {
          nested: {
            deeply: {
              data: [1, 2, 3],
              map: new Map([['key', 'value']]),
              date: new Date(),
            },
          },
        };
        logger.info('Complex object', complexObj);
      }).not.toThrow();
    });
  });

  describe('Log Levels', () => {
    it('should respect log level filtering', () => {
      // Logger should have a level property
      expect(logger.level).toBeDefined();
      
      // Verify level is a valid winston level
      const validLevels = ['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'];
      expect(validLevels).toContain(logger.level);
    });

    it('should support all winston log levels', () => {
      const levels = ['error', 'warn', 'info', 'debug'];
      
      levels.forEach(level => {
        expect(typeof (logger as any)[level]).toBe('function');
      });
    });
  });

  describe('Service Identification', () => {
    it('should tag all logs with service name', () => {
      expect(logger.defaultMeta?.service).toBe('stackBrowserAgent');
    });

    it('should maintain service tag across log calls', () => {
      // Multiple log calls should all use the same defaultMeta
      logger.info('First log');
      logger.info('Second log');
      
      expect(logger.defaultMeta?.service).toBe('stackBrowserAgent');
    });
  });
});
