// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { defineConfig, devices } from '@playwright/test';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const isCI = !!process.env.CI;

// Without E2E_MOCK_URL the suite boots its own mock (no Citrine behind it) on
// 18083; with it, the specs run against whatever mock is already up (the live
// and everest lanes).
const external = process.env.E2E_MOCK_URL;
const port = Number(process.env.E2E_MOCK_PORT ?? 18083);
const baseURL = external ?? `http://127.0.0.1:${port}`;

const reporters: NonNullable<Parameters<typeof defineConfig>[0]['reporter']> = [
  ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ['list'],
  ['junit', { outputFile: 'reports/e2e-junit.xml' }],
];
if (isCI) reporters.push(['github']);

export default defineConfig({
  testDir: './e2e',
  testMatch: /.*\.e2e\.ts/,
  outputDir: './test-results',
  fullyParallel: false,
  workers: 1,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  failOnFlakyTests: isCI,
  timeout: 60_000,
  reporter: reporters,
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    locale: 'en-US',
    timezoneId: 'UTC',
    viewport: { width: 1440, height: 900 },
  },
  projects: [
    {
      name: 'dashboard',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
      grepInvert: /@live|@everest/,
    },
    {
      name: 'dashboard-live',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
      grep: /@live/,
    },
    {
      name: 'dashboard-everest',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
      grep: /@everest/,
      timeout: 180_000,
    },
  ],
  webServer: external
    ? undefined
    : {
        command: 'node dist/index.js',
        cwd: here,
        url: `${baseURL}/_mock/health`,
        reuseExistingServer: !isCI,
        timeout: 60_000,
        stdout: 'pipe',
        stderr: 'pipe',
        env: {
          MOCK_MSP_PORT: String(port),
          MOCK_MSP_HOST: '127.0.0.1',
          MOCK_MSP_SCENARIO: 'scenarios/preregistered.json',
          MOCK_MSP_LOG_LEVEL: 'warn',
          // nothing listens on these; the actor buttons must fail cleanly
          CITRINE_OCPI_BASE_URL: 'http://127.0.0.1:1/ocpi',
          CITRINE_HASURA_URL: 'http://127.0.0.1:1/v1/graphql',
          ...(process.env.MOCK_MSP_CONTROL_SECRET
            ? { MOCK_MSP_CONTROL_SECRET: process.env.MOCK_MSP_CONTROL_SECRET }
            : {}),
        },
      },
});
