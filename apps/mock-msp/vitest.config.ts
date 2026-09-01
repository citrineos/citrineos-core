// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { defineConfig } from 'vitest/config';

const ci = !!process.env.CI;

// Hermetic suite only (test/**). Live and browser specs have their own configs
// and file suffixes so neither this nor the root vitest run sweeps them in.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    exclude: ['**/node_modules/**', 'dist/**', 'e2e/**', 'test-live/**'],
    pool: 'forks',
    retry: 0,
    testTimeout: 20_000,
    reporters: ci ? ['default', 'junit'] : ['default'],
    outputFile: { junit: 'reports/junit.xml' },
    coverage: {
      enabled: ci,
      provider: 'v8',
      include: ['src/**'],
      reporter: ['text-summary', 'html', 'json-summary'],
      reportsDirectory: 'reports/coverage',
    },
  },
});
