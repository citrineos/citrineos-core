import type { JestConfigWithTsJest } from 'ts-jest';

const jestConfig: JestConfigWithTsJest = {
  testEnvironment: 'node',
  transform: {
    '^.+.tsx?$': ['ts-jest', {}],
  },
  displayName: 'Transactions Module',
  coveragePathIgnorePatterns: ['/node_modules/', '/test/'],
};

export default jestConfig;
