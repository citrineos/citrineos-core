// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { fileURLToPath } from 'url';
import { defineConfig } from 'vitest/config';

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

// Mirror TypeScript path aliases for testing (point to source files, not built files).
// tsconfig.test.base.json mirrors this map for the typechecker; the two must stay in sync.
const alias = {
  '@': r('./packages/ocpp/src'),
  '@test': r('./packages/ocpp/test'),
  '@dal': r('./packages/dal/src'),
  '@handlers': r('./packages/ocpp/src/handlers'),
  '@modules': r('./packages/ocpp/src/modules'),
  '@util': r('./packages/ocpp/src/util'),
  '@services': r('./packages/ocpp/src/services'),
  '@ocpp': r('./packages/base/src/ocpp'),
  '@config': r('./packages/base/src/config'),
  '@interfaces': r('./packages/base/src/interfaces'),
  '@base-util': r('./packages/base/src/util'),
  '@citrineos/dal': r('./packages/dal/index.ts'),
  '@citrineos/ocpp': r('./packages/ocpp/index.ts'),
};

const testGlob = ['**/*.{test,spec}.{ts,tsx}'];
const sharedExclude = ['**/node_modules/**', '**/dist/**', '**/.next/**'];

// Typecheck settings shared by every project.
const typecheck = (extraExclude: string[] = [], tsconfig = './tsconfig.json') => ({
  enabled: true,
  checker: 'tsc' as const,
  tsconfig,
  include: testGlob,
  exclude: [...sharedExclude, ...extraExclude],
  ignoreSourceErrors: false,
});

// These MUST be set per project: a `projects` array does not inherit
// testTimeout/hookTimeout from the root test block, so leaving them
// only at the root drops every suite back to the 10s default.
const TIMEOUTS = { testTimeout: 30_000, hookTimeout: 60_000 };

const nodeProject = (name: string, root: string, extraExclude: string[] = []) => ({
  test: {
    name,
    root: r(root),
    environment: 'node' as const,
    include: testGlob,
    exclude: [...sharedExclude, ...extraExclude],
    typecheck: typecheck(extraExclude),
    ...TIMEOUTS,
  },
  resolve: { alias },
});

// One project per package that has tests. Projects (rather than a single root
// config) are required because typecheck.tsconfig is resolved per project
// root, and operator-ui needs different compiler settings from the node
// packages. A new package with tests needs an entry here.
export default defineConfig({
  test: {
    projects: [
      nodeProject('ocpp', './packages/ocpp'),
      nodeProject('dal', './packages/dal'),
      nodeProject('base', './packages/base'),
      nodeProject('ocpi-base', './packages/ocpi-base'),
      nodeProject('mock-msp', './apps/mock-msp'),
      // operator-ui owns its own Playwright e2e specs; vitest can't run them
      // (they call @playwright/test's test.use(), which only works under the
      // Playwright runner). Only that tests/ tree is excluded — unit tests
      // co-located under src do run here. They stay in tsconfig.json's scope
      // so `pnpm typecheck:test` still covers them.
      nodeProject('operator-ui', './apps/operator-ui', ['tests/**']),
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
