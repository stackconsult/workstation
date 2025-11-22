/**
 * Jest test setup file
 * Mocks external dependencies that cause ESM import issues
 */

/// <reference types="jest" />

// Mock ioredis to avoid Redis connection issues in tests
jest.mock('ioredis', () => {
  const mockRedis = jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    incr: jest.fn().mockResolvedValue(1),
    expire: jest.fn().mockResolvedValue(1),
    ttl: jest.fn().mockResolvedValue(-1),
    keys: jest.fn().mockResolvedValue([]),
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    quit: jest.fn().mockResolvedValue('OK'),
  }));
  mockRedis.prototype.on = jest.fn();
  return mockRedis;
});

// Mock @octokit/rest to avoid ESM import issues in tests
jest.mock('@octokit/rest', () => {
  return {
    Octokit: jest.fn().mockImplementation(() => ({
      rest: {
        pulls: {
          list: jest.fn().mockResolvedValue({ data: [] }),
          create: jest.fn().mockResolvedValue({ data: { number: 1 } }),
        },
        repos: {
          get: jest.fn().mockResolvedValue({ data: { default_branch: 'main' } }),
        },
      },
    })),
  };
});

// Suppress console logs during tests unless they're errors
const originalConsole = { ...console };
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  error: originalConsole.error, // Keep error logs
};
