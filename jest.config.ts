// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
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
