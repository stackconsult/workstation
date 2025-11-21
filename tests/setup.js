/// <reference types="jest" />

/**
 * Jest test setup file
 * Mocks external dependencies that cause ESM import issues
 */

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
