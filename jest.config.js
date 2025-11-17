module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    // Exclude Phase 1 features that are intentionally not tested yet
    '!src/services/competitorResearch.ts',
    '!src/services/researchScheduler.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  verbose: true,
  testTimeout: 10000,
  // Enforce coverage thresholds - fail tests if coverage drops
  // These are progressive targets that increase over time
  coverageThreshold: {
    global: {
      statements: 55,
      branches: 36,  // Current level: 36.61% - set slightly below to allow CI to pass
      functions: 50,
      lines: 55,
    },
    // Enforce high coverage for critical components
    './src/auth/**/*.ts': {
      statements: 95,
      branches: 88,
      functions: 95,
      lines: 95,
    },
    './src/middleware/**/*.ts': {
      statements: 95,
      branches: 90,
      functions: 95,
      lines: 95,
    },
    './src/utils/env.ts': {
      statements: 90,
      branches: 85,
      functions: 90,
      lines: 90,
    },
  },
};
