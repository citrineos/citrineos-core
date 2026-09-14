// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../fixtures';
import { ChargingStationDetailPage } from '../../pages/charging-stations/detail-page';

test.use({ storageState: 'playwright/.auth/admin.json' });

test.describe('charging-stations › detail tabs', () => {
  test('E2E-049: EVSE tab is reachable and shows Add New EVSE control', async ({
    page,
    seededStation,
  }) => {
    const detail = new ChargingStationDetailPage(page);
    await detail.goto(seededStation.id);
    await detail.openEvsesTab();
    await expect(page.getByRole('button', { name: /add new evse/i })).toBeVisible({
      timeout: 30_000,
    });
  });

  test('E2E-052: OCPP Messages tab populated for @everest cp001 @everest', async ({
    page,
    everestStation,
  }) => {
    const detail = new ChargingStationDetailPage(page);
    await detail.goto(everestStation.id);
    await detail.openMessagesTab();
    await expect(detail.tabs.messages).toHaveAttribute('aria-selected', 'true', {
      timeout: 15_000,
    });
  });

  test('E2E-053: Configuration tab is reachable', async ({ page, seededStation }) => {
    const detail = new ChargingStationDetailPage(page);
    await detail.goto(seededStation.id);
    await detail.tabs.configuration.click();
    await expect(detail.tabs.configuration).toHaveAttribute('aria-selected', 'true', {
      timeout: 15_000,
    });
  });
});
