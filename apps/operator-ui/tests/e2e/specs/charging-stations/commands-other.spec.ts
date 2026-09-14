// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../fixtures';
import { ChargingStationDetailPage } from '../../pages/charging-stations/detail-page';

test.use({ storageState: 'playwright/.auth/admin.json' });

test.describe('charging-stations › OtherCommandsModal dispatcher', () => {
  test('E2E-088: OtherCommandsModal opens and exposes a list of secondary commands', async ({
    page,
    seededStation,
  }) => {
    const detail = new ChargingStationDetailPage(page);
    await detail.goto(seededStation.id);

    await detail.commandBar.otherCommandsButton.click();

    // The dispatcher modal renders a Radix Dialog containing a list of
    // command entries. Confirm at least one of the expected command labels
    // is present (we don't pick one — that's per-modal coverage in the
    // bespoke or parametric specs).
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 15_000 });
    const knownCommands = page.getByText(
      /(get variables|set variables|trigger message|change availability|change configuration|update firmware|unlock connector|data transfer)/i,
    );
    await expect(knownCommands.first()).toBeVisible();
  });
});
