import type { JestConfigWithTsJest } from 'ts-jest';

const jestConfig: JestConfigWithTsJest = {
  testEnvironment: 'node',
  transform: {
    '^.+.tsx?$': ['ts-jest', {}],
  },
  projects: ['<rootDir>/03_Modules/*', '<rootDir>/02_Util/jest.config.ts'],
};

export default jestConfig;
