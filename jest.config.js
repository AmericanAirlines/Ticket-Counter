module.exports = {
  globals: {
    'ts-jest': {
      tsconfig: './tsconfig.json',
    },
  },
  moduleFileExtensions: ['js', 'json', 'ts'],
  roots: ['src'],
  transform: {
    '^.+\\.(ts)$': 'ts-jest',
  },
  testMatch: ['**/*.test.(ts|js)'],
  testEnvironment: 'node',
  preset: 'ts-jest',
  collectCoverageFrom: [
    './src/**/*.ts',
    '!./src/tests/**',
    '!./src/logger.ts',
    '!./src/index.ts',
    '!./src/app.ts',
    '!./src/env.ts',
    '!./src/database.ts',
    '!./src/migrations/**',
    '!./src/entities/*.ts',
  ],
  coverageDirectory: './coverage',
  coverageThreshold: {
    global: {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100,
    },
  },
};
