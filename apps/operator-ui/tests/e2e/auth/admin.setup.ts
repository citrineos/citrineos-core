// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { test as setup, expect } from '@playwright/test';
import { resolve } from 'node:path';
import { LoginPage } from '../pages/login.page';
import { OverviewPage } from '../pages/overview.page';
import { readEnv } from '../utils/env';

const ADMIN_STORAGE_STATE = resolve(
  __dirname,
  '..',
  '..',
  '..',
  'playwright',
  '.auth',
  'admin.json',
);

setup.use({ storageState: { cookies: [], origins: [] } });

setup('authenticate as admin and persist storage state', async ({ page }) => {
  const login = new LoginPage(page);
  const overview = new OverviewPage(page);

  await login.goto();
  await login.login(readEnv('E2E_ADMIN_EMAIL'), readEnv('E2E_ADMIN_PASSWORD'));

  await page.waitForURL(OverviewPage.urlGlob, {
    timeout: 45_000,
    waitUntil: 'domcontentloaded',
  });
  await overview.expectLoaded();

  const cookies = await page.context().cookies();
  expect(
    cookies.some((c) => /next-auth/.test(c.name)),
    'NextAuth session cookie should be set after login',
  ).toBe(true);

  // The first-login effect writes `firstLoginHelp:1` when it shows the
  // welcome modal (identity id is always '1' under the generic auth
  // provider). Both the flag and the dismissal must be in the captured
  // state: a snapshot taken before the effect fires would put the modal
  // overlay in front of every test that loads it. expectLoaded() may have
  // won its race against the dialog, so give the late mount a real window.
  await page.waitForFunction(() => localStorage.getItem('firstLoginHelp:1') !== null, undefined, {
    timeout: 30_000,
  });
  await overview.dismissWelcomeIfPresent(10_000);

  const state = await page.context().storageState({ path: ADMIN_STORAGE_STATE });
  const origin = state.origins.find((o) => o.origin.includes('localhost'));
  expect(
    origin?.localStorage.some((entry) => entry.name === 'firstLoginHelp:1'),
    'captured storage state must contain the dismissed-welcome flag',
  ).toBe(true);
});
