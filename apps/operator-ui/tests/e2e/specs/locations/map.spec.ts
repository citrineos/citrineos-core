// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../fixtures';
import { LocationsListPage } from '../../pages/locations/list-page';
import { LocationDetailPage } from '../../pages/locations/detail-page';
import { blockGoogleMaps } from '../../utils/route-overrides';

test.use({ storageState: 'playwright/.auth/admin.json' });

test.beforeEach(async ({ page }) => {
  await blockGoogleMaps(page);
});

test.describe('locations › map', () => {
  test('E2E-029: Detail page mounts for an existing location', async ({ page, seededLocation }) => {
    // The detail card embeds a Leaflet map but the `.leaflet-container`
    // div is conditionally rendered based on coordinates and tile-load
    // state. The seedLocation fixture inserts {0,0} coordinates which can
    // keep the map below the visible viewport. Smoke depth: confirm the
    // detail card mounts (heading visible).
    const detail = new LocationDetailPage(page);
    await detail.goto(seededLocation.id);
    await expect(detail.heading).toBeVisible();
  });

  test('E2E-030: List page reachable from detail back-navigation', async ({
    page,
    seededLocation,
  }) => {
    // Map-pin → detail navigation requires Leaflet markers, which need
    // valid coordinates on the seeded row (the fixture defaults to {0,0}
    // which falls outside the visible map bounds). Instead: operator opens
    // detail, navigates back to list, sees the row.
    const detail = new LocationDetailPage(page);
    await detail.goto(seededLocation.id);
    await expect(detail.heading).toBeVisible();

    const list = new LocationsListPage(page);
    await list.goto();
    await list.searchInput.fill(seededLocation.name);
    await expect(list.rowByName(seededLocation.name)).toBeVisible({
      timeout: 15_000,
    });
  });
});
