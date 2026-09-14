// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../fixtures';
import { ChargingStationsListPage } from '../../pages/charging-stations/list-page';

test.use({ storageState: 'playwright/.auth/admin.json' });

test.describe('charging-stations › list', () => {
  test('E2E-040: Charging stations list renders with heading + search + add button', async ({
    page,
  }) => {
    const list = new ChargingStationsListPage(page);
    await list.goto();
    await expect(list.heading).toBeVisible();
    await expect(list.searchInput).toBeVisible();
    await expect(list.addStationButton).toBeVisible();
  });

  test('E2E-041: Search by station id filters the list', async ({ page, seededStation }) => {
    const list = new ChargingStationsListPage(page);
    await list.goto();
    await list.searchInput.fill(seededStation.ocppConnectionName);
    await expect(list.rowById(seededStation.ocppConnectionName)).toBeVisible({
      timeout: 15_000,
    });
  });

  test('E2E-042: Search returns no-results when no station matches', async ({ page }) => {
    const list = new ChargingStationsListPage(page);
    await list.goto();
    await list.searchInput.fill('e2e-nonexistent-cp-XXXXXXXX');
    await expect(list.noResultsMessage).toBeVisible({ timeout: 15_000 });
    await expect(list.rowById('e2e-nonexistent-cp-XXXXXXXX')).toHaveCount(0);
  });

  test('E2E-045: Online indicator visible on @everest cp001 row @everest', async ({
    page,
    everestStation,
  }) => {
    const list = new ChargingStationsListPage(page);
    await list.goto();
    const row = list.rowById(everestStation.ocppConnectionName);
    await expect(row).toBeVisible({ timeout: 30_000 });
    // The row contains a status indicator (text or color); we accept
    // either as evidence the indicator rendered.
    await expect(row).toContainText(/(online|offline|unknown)/i);
  });
});
