import type { JestConfigWithTsJest } from 'ts-jest';

const jestConfig: JestConfigWithTsJest = {
  testEnvironment: 'node',
  transform: {
    '^.+.tsx?$': ['ts-jest', {}],
  },
  projects: [
    '<rootDir>/03_Modules/*',
    '<rootDir>/02_Util/jest.config.ts',
    '<rootDir>/00_Base/jest.config.ts',
    '<rootDir>/01_Data/jest.config.ts',
  ],
};

export default jestConfig;
