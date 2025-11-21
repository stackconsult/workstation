/**
 * Jest test setup file
 * Mocks external dependencies that cause ESM import issues
 */

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
