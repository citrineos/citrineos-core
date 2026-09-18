// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { defineConfig } from 'vitest/config';
import { BaseSequencer, type TestSpecification } from 'vitest/node';

// Live suites share one mock process and one Citrine, so files run one at a
// time in filename order (the numeric prefixes are the execution order).
class ByPath extends BaseSequencer {
  async sort(files: TestSpecification[]): Promise<TestSpecification[]> {
    return [...files].sort((a, b) => a.moduleId.localeCompare(b.moduleId));
  }
}

const ci = !!process.env.CI;

export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/*.live.ts'], // scoped by --dir test-live/pr or test-live/everest
    exclude: ['**/node_modules/**', 'dist/**'],
    globalSetup: ['test-live/support/global-setup.ts'],
    fileParallelism: false,
    sequence: { concurrent: false, sequencer: ByPath },
    retry: 0,
    testTimeout: 60_000,
    hookTimeout: 120_000,
    reporters: ci ? ['default', 'junit'] : ['default'],
    outputFile: { junit: 'reports/junit-live.xml' },
  },
});
