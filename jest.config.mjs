/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'node',
  transform: {
    "^.+\\.js$": ['babel-jest']
  },
  moduleFileExtensions: ['js'],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/prisma/',
    '/__tests__/fixtures/'
  ],
  testPathIgnorePatterns: [
    '/node_modules/'
  ],
  testMatch: [
    '**/__tests__/**/*.test.js'
  ],
  setupFilesAfterEnv: ['./test/setup.mjs'],
  transformIgnorePatterns: [],
  injectGlobals: true,
  testEnvironmentOptions: {
    jest: true
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  }
};

export default config;
