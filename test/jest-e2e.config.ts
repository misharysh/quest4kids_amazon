export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '../',
  testRegex: '.e2e-spec.ts$',
  moduleFileExtensions: ['ts', 'js', 'json'],

  setupFilesAfterEnv: ['<rootDir>/test/jest-setup.ts'],

  moduleNameMapper: { '^src/(.*)$': '<rootDir>/src/$1' },

  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.json',
        isolatedModules: false,
      },
    ],
  },

  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: 'coverage-e2e',
};
