// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../fixtures';
import { OverviewPage } from '../../pages/overview.page';
import { LoginPage } from '../../pages/login.page';

test.use({ storageState: 'playwright/.auth/admin.json' });

test.describe('auth › logout', () => {
  test('E2E-004: authenticated admin signs out and lands on /login', async ({ page }) => {
    const overview = new OverviewPage(page);
    const login = new LoginPage(page);

    await overview.goto();
    await overview.signOut();

    await page.waitForURL(/\/login(\?.*)?$/, { timeout: 30_000 });
    await expect(login.submitButton).toBeVisible();
  });

  test('E2E-005: when Keycloak is the auth provider, sign-out hits the realm logout endpoint', async ({
    page,
  }) => {
    // Keycloak is a first-class auth provider (AuthProviderTypeEnum = 'keycloak' | 'generic').
    // When NEXT_PUBLIC_AUTH_PROVIDER=keycloak, the server stamps a realm end-session URL onto
    // the session (`${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/logout`) and
    // the logout handler hard-navigates the browser to it — exactly the redirect asserted below.
    //
    // This stays a conditional skip rather than an always-on test because it needs external infra
    // that CI does not provision: a running Keycloak server + realm + client/secret, plus an
    // `admin.json` storage state captured against a real Keycloak login (admin.setup.ts performs
    // the generic credentials login, not an OIDC one). CI runs the generic credentials provider,
    // so E2E_AUTH_PROVIDER is unset and this test is gated off. Set E2E_AUTH_PROVIDER=keycloak
    // against a Keycloak-backed deployment to exercise the realm logout flow.
    test.skip(
      process.env.E2E_AUTH_PROVIDER !== 'keycloak',
      'Keycloak realm not provisioned; generic auth in use.',
    );

    const overview = new OverviewPage(page);
    const login = new LoginPage(page);

    const redirects: string[] = [];
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) redirects.push(frame.url());
    });

    await overview.goto();
    await overview.signOut();

    await page.waitForURL(/\/login(\?.*)?$/, { timeout: 30_000 });
    await expect(login.submitButton).toBeVisible();
    expect(
      redirects.some((u) => /protocol\/openid-connect\/logout/.test(u)),
      'redirect chain should include Keycloak end_session endpoint',
    ).toBe(true);
  });
});
