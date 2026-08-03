// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'url';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: [], // optional, see below
    include: ['**/*.(test|spec).{ts,tsx}'],
    // operator-ui owns its own Playwright e2e specs; vitest can't run them
    // (they call @playwright/test's test.use(), which only works under the
    // Playwright runner). Run them via `pnpm --filter @citrineos/operator-ui test:e2e`.
    exclude: ['**/node_modules/**', '**/dist/**', '**/.next/**', 'apps/operator-ui/**'],
    // The testcontainers-backed integration suites annotate their beforeAll
    // with 90s but leave beforeEach/afterAll on the 5s/10s defaults, which CI
    // load intermittently blows (truncate cascade, container stop). Raised
    // globally — passing unit suites never wait on a timeout, this only
    // bounds failures.
    testTimeout: 30_000,
    hookTimeout: 60_000,
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
  },
  resolve: {
    // Mirror TypeScript path aliases for testing (point to source files, not built files)
    alias: {
      '@': fileURLToPath(new URL('./packages/core/src', import.meta.url)),
      '@test': fileURLToPath(new URL('./packages/core/test', import.meta.url)),
      '@dal': fileURLToPath(new URL('./packages/core/src/dal', import.meta.url)),
      '@handlers': fileURLToPath(new URL('./packages/core/src/handlers', import.meta.url)),
      '@modules': fileURLToPath(new URL('./packages/core/src/modules', import.meta.url)),
      '@util': fileURLToPath(new URL('./packages/core/src/util', import.meta.url)),
      '@ocpp': fileURLToPath(new URL('./packages/base/src/ocpp', import.meta.url)),
      '@config': fileURLToPath(new URL('./packages/base/src/config', import.meta.url)),
      '@interfaces': fileURLToPath(new URL('./packages/base/src/interfaces', import.meta.url)),
      '@base-util': fileURLToPath(new URL('./packages/base/src/util', import.meta.url)),
      '@citrineos/core': fileURLToPath(new URL('./packages/core/index.ts', import.meta.url)),
    },
  },
});
