// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../fixtures';
import { OverviewPage } from '../../pages/overview.page';

test.use({ storageState: 'playwright/.auth/admin.json' });

test.describe('overview › dashboard', () => {
  test('E2E-010: KPI cards render their headings on /overview', async ({
    page,
    seededLocation,
    seededStation,
    seededTransaction,
  }) => {
    void seededLocation;
    void seededStation;
    void seededTransaction;

    const overview = new OverviewPage(page);
    await overview.goto();

    await expect(overview.kpiOnlineHeading).toBeVisible();
    await expect(overview.kpiActiveTransactionsHeading).toBeVisible();
    await expect(overview.kpiPluginSuccessHeading).toBeVisible();
    await expect(overview.kpiChargerActivityHeading).toBeVisible();
    await expect(overview.locationsCardHeading).toBeVisible();
  });

  test('E2E-011: Locations card mounts the Google map surface when MAPS_E2E_KEY is provisioned', async ({
    page,
    seededLocation,
  }) => {
    // The Locations card renders LocationMapV2, which fetches the Maps key via a
    // server action and then mounts `<APIProvider><Map/></APIProvider>`. The
    // Google Maps SDK only stamps its `.gm-style` tile container onto the DOM
    // once it authenticates a valid key; with the placeholder key the backend
    // ships by default (`YOUR_GOOGLE_MAPS_API_KEY`) `gm_authFailure` fires and
    // that surface never appears. So `.gm-style` is the one signal that the
    // key-gated map actually rendered — the static card heading is not (it is
    // already covered by E2E-010).
    //
    // This stays a conditional skip rather than an always-on test because it
    // needs an external secret CI does not provision: a real, billing-enabled
    // Google Maps API key. There is no key-independent way to assert the map
    // surface without faking the very SDK under test, so the test is gated on
    // the key being present. Provision MAPS_E2E_KEY (and wire it through as
    // GOOGLE_MAPS_API_KEY for the UI under test) to exercise the live render.
    test.skip(
      !process.env.MAPS_E2E_KEY,
      'MAPS_E2E_KEY not provisioned; the Google Maps SDK cannot authenticate and the map surface never mounts.',
    );
    void seededLocation;

    const overview = new OverviewPage(page);
    await overview.goto();

    await expect(overview.locationsMapSurface).toBeVisible({ timeout: 30_000 });
  });

  test('E2E-012: Active Transactions card surfaces an active session', async ({
    page,
    seededLocation,
    seededStation,
    seededTransaction,
  }) => {
    void seededLocation;
    void seededStation;

    const overview = new OverviewPage(page);
    await overview.goto();

    await expect(overview.kpiActiveTransactionsHeading).toBeVisible();
    await expect(page.getByText(seededTransaction.transactionId, { exact: false })).toBeVisible({
      timeout: 30_000,
    });
  });

  test('E2E-014: KPI headings render even with no fixture-seeded data', async ({ page }) => {
    const overview = new OverviewPage(page);
    await overview.goto();

    await expect(overview.kpiOnlineHeading).toBeVisible();
    await expect(overview.kpiActiveTransactionsHeading).toBeVisible();
    await expect(overview.kpiPluginSuccessHeading).toBeVisible();
    await expect(overview.kpiChargerActivityHeading).toBeVisible();
  });
});
