// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { fileURLToPath } from 'url';
import { defineConfig } from 'vitest/config';

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

// tsconfig.test.base.json mirrors this map for the typechecker; the two must stay in sync.
const alias = {
  '@': r('./packages/core/src'),
  '@test': r('./packages/core/test'),
  '@dal': r('./packages/core/src/dal'),
  '@handlers': r('./packages/core/src/handlers'),
  '@modules': r('./packages/core/src/modules'),
  '@util': r('./packages/core/src/util'),
  '@ocpp': r('./packages/base/src/ocpp'),
  '@config': r('./packages/base/src/config'),
  '@interfaces': r('./packages/base/src/interfaces'),
  '@base-util': r('./packages/base/src/util'),
  '@citrineos/core': r('./packages/core/index.ts'),
};

const testGlob = ['**/*.{test,spec}.{ts,tsx}'];
const sharedExclude = ['**/node_modules/**', '**/dist/**', '**/.next/**'];

const typecheck = (extraExclude: string[] = [], tsconfig = './tsconfig.json') => ({
  enabled: true,
  checker: 'tsc' as const,
  tsconfig,
  include: testGlob,
  exclude: [...sharedExclude, ...extraExclude],
  ignoreSourceErrors: false,
});

// One project per package that has tests. Projects (rather than a single root
// config) are required because typecheck.tsconfig is resolved per project
// root, and operator-ui needs different compiler settings from the node
// packages. A new package with tests needs an entry here plus its own
// tsconfig.test.json.
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'core',
          root: r('./packages/core'),
          environment: 'node',
          include: testGlob,
          exclude: sharedExclude,
          typecheck: typecheck(),
        },
        resolve: { alias },
      },
      {
        test: {
          name: 'base',
          root: r('./packages/base'),
          environment: 'node',
          include: testGlob,
          exclude: sharedExclude,
          typecheck: typecheck(),
        },
        resolve: { alias },
      },
      {
        test: {
          name: 'ocpi-base',
          root: r('./packages/ocpi-base'),
          environment: 'node',
          include: testGlob,
          exclude: sharedExclude,
          typecheck: typecheck(),
        },
        resolve: { alias },
      },
      {
        test: {
          name: 'mock-msp',
          root: r('./apps/mock-msp'),
          environment: 'node',
          include: testGlob,
          exclude: sharedExclude,
          typecheck: typecheck(),
        },
        resolve: { alias },
      },
      {
        // operator-ui owns its own Playwright e2e specs; vitest can't run them
        // (they call @playwright/test's test.use(), which only works under the
        // Playwright runner). Only that tests/ tree is excluded — unit tests
        // co-located under src do run here.
        test: {
          name: 'operator-ui',
          root: r('./apps/operator-ui'),
          environment: 'node',
          include: testGlob,
          exclude: [...sharedExclude, 'tests/**'],
          // The e2e specs stay excluded from the vitest typecheck report for
          // the same reason. tsconfig.test.json still has them in scope, so
          // they remain typechecked by `pnpm typecheck:test`.
          typecheck: typecheck(['tests/**']),
        },
      },
    ],

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
});
