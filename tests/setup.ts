/**
 * Jest test setup file
 * Configuration for test environment
 */

/// <reference types="jest" />

// Mock @octokit/rest to avoid ESM import issues
jest.mock("@octokit/rest", () => ({
  Octokit: jest.fn().mockImplementation(() => ({
    repos: {
      get: jest.fn(),
      listCommits: jest.fn(),
      createOrUpdateFileContents: jest.fn(),
    },
    git: {
      getRef: jest.fn(),
      createRef: jest.fn(),
      updateRef: jest.fn(),
    },
    pulls: {
      create: jest.fn(),
      merge: jest.fn(),
    },
  })),
}));

// Mock ioredis to avoid Redis connection issues in tests
jest.mock("ioredis", () => {
  const mockRedis = jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue("OK"),
    del: jest.fn().mockResolvedValue(1),
    incr: jest.fn().mockResolvedValue(1),
    expire: jest.fn().mockResolvedValue(1),
    ttl: jest.fn().mockResolvedValue(-1),
    keys: jest.fn().mockResolvedValue([]),
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    quit: jest.fn().mockResolvedValue("OK"),
  }));
  mockRedis.prototype.on = jest.fn();
  return mockRedis;
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
