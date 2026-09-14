// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../fixtures';
import { ChargingStationDetailPage } from '../../pages/charging-stations/detail-page';

test.use({ storageState: 'playwright/.auth/admin.json' });

test.describe('charging-stations › admin toggles', () => {
  test('E2E-056: ForceDisconnect button visible on detail @everest', async ({
    page,
    everestStation,
  }) => {
    const detail = new ChargingStationDetailPage(page);
    await detail.goto(everestStation.id);
    // ForceDisconnect is rendered as a primary command-bar button.
    await expect(detail.commandBar.forceDisconnectButton).toBeVisible({
      timeout: 30_000,
    });
  });
});
