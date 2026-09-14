// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../fixtures';
import { LoginPage } from '../../pages/login-page';
import { OverviewPage } from '../../pages/overview-page';
import { readEnv } from '../../utils/env';

// Login flow specs run without storage state — they ARE the login flow.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('auth › login', () => {
  test('E2E-001: admin can sign in with valid credentials and land on /overview', async ({
    page,
  }) => {
    const login = new LoginPage(page);
    const overview = new OverviewPage(page);

    await login.goto();
    await login.login(readEnv('E2E_ADMIN_EMAIL'), readEnv('E2E_ADMIN_PASSWORD'));

    await page.waitForURL(OverviewPage.urlGlob, {
      timeout: 30_000,
      waitUntil: 'domcontentloaded',
    });
    await overview.expectLoaded();

    const cookies = await page.context().cookies();
    expect(
      cookies.some((c) => /next-auth/.test(c.name)),
      'NextAuth session cookie should be set after login',
    ).toBe(true);
  });

  test('E2E-002: login rejects invalid credentials and stays on /login', async ({ page }) => {
    const login = new LoginPage(page);

    await login.goto();
    await login.login(readEnv('E2E_ADMIN_EMAIL'), 'wrong-password-on-purpose');

    // The current UI does not surface an inline error alert with role="alert"
    // for invalid creds; it relies on staying on /login. We assert exactly
    // that observable behaviour: URL unchanged, form re-enabled.
    await expect(page).toHaveURL(/\/login(\?.*)?$/);
    await expect(login.submitButton).toBeEnabled();
    await expect(login.emailInput).toHaveValue(readEnv('E2E_ADMIN_EMAIL'));
  });

  test('E2E-003: login validates required fields client-side', async ({ page }) => {
    const login = new LoginPage(page);

    await login.goto();
    await login.submitButton.click();

    await expect(page).toHaveURL(/\/login(\?.*)?$/);
    await expect(login.emailInput)
      .toBeFocused()
      .catch(async () => {
        // Some browsers focus the first invalid input; others surface inline errors.
        // Either is acceptable client-side validation evidence.
        await expect(login.emailInput).toHaveAttribute('aria-invalid', 'true');
      });
  });
});
