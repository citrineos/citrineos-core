// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import { resolve } from 'node:path';

dotenv.config({ path: resolve(__dirname, '.env.test') });

const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';
const isCI = !!process.env.CI;

const reporters: NonNullable<Parameters<typeof defineConfig>[0]['reporter']> = [
  ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ['list'],
  ['junit', { outputFile: 'reports/junit.xml' }],
];
if (isCI) reporters.push(['github']);

export default defineConfig({
  testDir: './tests/e2e/specs',
  outputDir: './test-results',

  // File-level parallelism: tests within a file stay sequential, so
  // same-file tests can never race each other's rows.
  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  // A retry-rescued test still fails the job on CI. Green-with-a-flaky-
  // annotation is how E2E-071 stayed invisible for weeks — the retry remains
  // as diagnostics (trace/video of both attempts), not as absolution.
  failOnFlakyTests: isCI,
  // CI runs a production `next start` (managed-server), so the old dev-mode
  // recompile-loop hazard doesn't apply there — 3 workers share the 4-vCPU
  // runner with the docker stack. Local default stays 1: `next dev` compiles
  // routes on demand and does not take concurrency well.
  workers: process.env.E2E_WORKERS ? Number(process.env.E2E_WORKERS) : isCI ? 3 : 1,

  // 150s default test timeout: expectLoaded budgets up to 90s for cold-route
  // Next.js compilation + the useOne(ChargingStation) query under heavy
  // concurrency; the rest of a typical spec needs ~60s.
  timeout: 150_000,

  reporter: reporters,

  globalSetup: './tests/e2e/auth/global-setup.ts',
  globalTeardown: './tests/e2e/auth/global-teardown.ts',

  expect: {
    // Default for every assertion that doesn't pass its own timeout. Most of
    // the suite asserts on query-bound UI (Refine + Hasura round trips), and
    // under CI load 10s was regularly too tight — genuinely slow spots get an
    // explicit 60s at the call site instead.
    timeout: 30_000,
  },

  use: {
    baseURL,
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // retain-on-failure records every test and discards on pass — several
    // concurrent encoders don't fit the runner alongside the stack.
    video: 'on-first-retry',
    locale: 'en-US',
    timezoneId: 'UTC',
    viewport: { width: 1440, height: 900 },
  },

  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      testDir: './tests/e2e/auth',
    },
    {
      name: 'chromium-desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
        storageState: 'playwright/.auth/admin.json',
      },
      dependencies: ['setup'],
      // Skip everest-tagged specs on the per-PR lane; they only run on
      // the everest-serial project (workers=1) so EVerest's single mutable
      // OCPP session is never raced.
      grepInvert: /@everest/,
    },
    {
      // EVerest lane — workers=1, longer timeout, runs nightly.
      name: 'everest-serial',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
        storageState: 'playwright/.auth/admin.json',
      },
      dependencies: ['setup'],
      workers: 1,
      timeout: 180_000,
      fullyParallel: false,
      grep: /@everest/,
    },
  ],
});
