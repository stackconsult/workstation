// Unit tests for logger utility
import { log, setLogLevel, createLogger, type LogLevel } from '../../src/utils/logger.js';

describe('Logger', () => {
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe('setLogLevel', () => {
    it('should set the log level', () => {
      setLogLevel('debug');
      log('debug', 'test message');
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('log', () => {
    it('should log info messages', () => {
      setLogLevel('info');
      log('info', 'test info message');
      expect(consoleLogSpy).toHaveBeenCalled();
      const call = consoleLogSpy.mock.calls[0];
      expect(call[1]).toContain('[INFO]');
      expect(call[1]).toContain('test info message');
    });

    it('should log warn messages', () => {
      setLogLevel('info');
      log('warn', 'test warn message');
      expect(consoleLogSpy).toHaveBeenCalled();
      const call = consoleLogSpy.mock.calls[0];
      expect(call[1]).toContain('[WARN]');
      expect(call[1]).toContain('test warn message');
    });

    it('should log error messages', () => {
      setLogLevel('info');
      log('error', 'test error message');
      expect(consoleLogSpy).toHaveBeenCalled();
      const call = consoleLogSpy.mock.calls[0];
      expect(call[1]).toContain('[ERROR]');
      expect(call[1]).toContain('test error message');
    });

    it('should log debug messages when log level is debug', () => {
      setLogLevel('debug');
      log('debug', 'test debug message');
      expect(consoleLogSpy).toHaveBeenCalled();
      const call = consoleLogSpy.mock.calls[0];
      expect(call[1]).toContain('[DEBUG]');
      expect(call[1]).toContain('test debug message');
    });

    it('should not log debug messages when log level is info', () => {
      setLogLevel('info');
      log('debug', 'test debug message');
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should log with metadata', () => {
      setLogLevel('info');
      const metadata = { key: 'value', count: 42 };
      log('info', 'test message', metadata);
      expect(consoleLogSpy).toHaveBeenCalled();
      const call = consoleLogSpy.mock.calls[0];
      expect(call[1]).toContain('test message');
      expect(call[2]).toEqual(metadata);
    });

    it('should include timestamp in log entry', () => {
      setLogLevel('info');
      log('info', 'test message');
      expect(consoleLogSpy).toHaveBeenCalled();
      const call = consoleLogSpy.mock.calls[0];
      // Check for ISO timestamp format
      expect(call[1]).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should respect log level hierarchy', () => {
      setLogLevel('warn');
      log('debug', 'should not log');
      log('info', 'should not log');
      log('warn', 'should log');
      log('error', 'should log');
      
      expect(consoleLogSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('createLogger', () => {
    it('should create logger with context', () => {
      setLogLevel('info');
      const logger = createLogger('TestContext');
      
      logger.info('test message');
      expect(consoleLogSpy).toHaveBeenCalled();
      const call = consoleLogSpy.mock.calls[0];
      expect(call[1]).toContain('[TestContext]');
      expect(call[1]).toContain('test message');
    });

    it('should support all log levels', () => {
      setLogLevel('debug');
      const logger = createLogger('TestContext');
      
      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');
      
      expect(consoleLogSpy).toHaveBeenCalledTimes(4);
    });

    it('should include context in all log messages', () => {
      setLogLevel('info');
      const logger = createLogger('MyAgent');
      
      logger.info('first message');
      logger.warn('second message');
      logger.error('third message');
      
      consoleLogSpy.mock.calls.forEach(call => {
        expect(call[1]).toContain('[MyAgent]');
      });
    });

    it('should support metadata in context logger', () => {
      setLogLevel('info');
      const logger = createLogger('TestContext');
      const metadata = { userId: 123, action: 'test' };
      
      logger.info('test message', metadata);
      expect(consoleLogSpy).toHaveBeenCalled();
      const call = consoleLogSpy.mock.calls[0];
      expect(call[2]).toEqual(metadata);
    });
  });
});
