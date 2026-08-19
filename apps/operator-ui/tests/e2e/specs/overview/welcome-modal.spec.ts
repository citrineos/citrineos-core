// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../fixtures';
import { OverviewPage } from '../../pages/overview.page';
import { clearWelcomeFlagBeforeLoad } from '../../utils/storage';
import { blockGoogleMaps } from '../../utils/route-overrides';

test.use({ storageState: 'playwright/.auth/admin.json' });

test.describe('overview › welcome modal', () => {
  // Keep the live Maps SDK (no key in CI) out of these navigations.
  test.beforeEach(async ({ page }) => {
    await blockGoogleMaps(page);
  });
  test('E2E-015: first sign-in shows the welcome modal; dismissal persists across reload', async ({
    page,
  }) => {
    const overview = new OverviewPage(page);

    // Strip the first-login flag before any app code runs so this navigation
    // behaves like a genuine first visit. Clearing after goto used to race
    // the layout effect, which re-writes the flag the moment it shows the
    // modal — the reload then found the flag and the dialog never rendered.
    await clearWelcomeFlagBeforeLoad(page);
    await page.goto(OverviewPage.path, { waitUntil: 'domcontentloaded', timeout: 60_000 });

    await expect(overview.welcomeDialog).toBeVisible({ timeout: 60_000 });
    await overview.welcomeCloseButton.click();
    await expect(overview.welcomeDialog).toBeHidden({ timeout: 15_000 });

    await page.reload({ waitUntil: 'domcontentloaded', timeout: 60_000 });
    await overview.expectLoaded();
    await expect(overview.welcomeDialog).toBeHidden();
  });

  test('E2E-016: welcome modal does not reappear when navigating between routes', async ({
    page,
  }) => {
    const overview = new OverviewPage(page);
    await overview.goto();
    await expect(overview.welcomeDialog).toBeHidden();

    await page.goto('/charging-stations');
    await page.waitForURL(/\/charging-stations(\?.*)?$/);

    await overview.goto();
    await expect(overview.welcomeDialog).toBeHidden();
  });
});
