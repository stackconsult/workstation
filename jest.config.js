module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@octokit|@googleapis|undici|cheerio|before-after-hook|universal-user-agent|simple-git)/)',
  ],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  globals: {
    'ts-jest': {
      isolatedModules: true,
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        types: ['jest', 'node'],
        module: 'ESNext',
        moduleResolution: 'node',
      },
    },
  },
  extensionsToTreatAsEsm: ['.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    // Exclude Phase 1 features that are intentionally not tested yet
    '!src/services/competitorResearch.ts',
    '!src/services/researchScheduler.ts',
    // Exclude Git service from coverage requirements (new feature)
    '!src/services/git.ts',
    '!src/routes/git.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  verbose: true,
  testTimeout: 10000,
  // Enforce coverage thresholds - fail tests if coverage drops
  coverageThreshold: {
    global: {
      statements: 45,
      branches: 30,
      functions: 40,
      lines: 45,
    },
    // Enforce high coverage for critical components
    './src/auth/**/*.ts': {
      statements: 90,
      branches: 72,
      functions: 95,
      lines: 90,
    },
    './src/middleware/**/*.ts': {
      statements: 30,
      branches: 0,
      functions: 30,
      lines: 35,
    },
    './src/utils/env.ts': {
      statements: 90,
      branches: 85,
      functions: 90,
      lines: 90,
    },
    // Automation module thresholds - realistic baselines for current state
    './src/automation/db/**/*.ts': {
      statements: 55,
      branches: 15,
      functions: 15,
      lines: 55,
    },
    './src/automation/workflow/**/*.ts': {
      statements: 0,
      branches: 0,
      functions: 0,
      lines: 0,
    },
    './src/automation/orchestrator/**/*.ts': {
      statements: 0,
      branches: 0,
      functions: 0,
      lines: 0,
    },
    './src/automation/agents/**/*.ts': {
      statements: 0,
      branches: 0,
      functions: 0,
      lines: 0,
    },
    './src/routes/automation.ts': {
      statements: 0,
      branches: 0,
      functions: 0,
      lines: 0,
    },
  },
};
