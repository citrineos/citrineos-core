import type { JestConfigWithTsJest } from 'ts-jest';

const jestConfig: JestConfigWithTsJest = {
    testEnvironment: 'node',
    transform: {
        '^.+.tsx?$': ['ts-jest', {}],
    },
    displayName: 'OcppRouter Module',
};

export default jestConfig;
