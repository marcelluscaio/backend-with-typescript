/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  clearMocks: true,
  globalSetup: '<rootDir>/tests/helpers/global-setup.ts',
  globalTeardown: '<rootDir>/tests/helpers/global-teardown.ts',
  setupFilesAfterEnv: ['<rootDir>/tests/helpers/jest-setup.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/server.ts', '!src/docs/**'],
  coverageDirectory: 'coverage',
  testTimeout: 30000,
};
