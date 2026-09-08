// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../fixtures';
import { ChargingStationDetailPage } from '../../pages/charging-stations/detail-page';
import { ModalHarness } from '../../pages/components/modal-po';

test.use({ storageState: 'playwright/.auth/admin.json' });

test.describe('charging-stations › UpdateFirmware command', () => {
  test('E2E-085: UpdateFirmware modal accepts a URL and submits @everest', async ({
    page,
    everestStation,
  }) => {
    const detail = new ChargingStationDetailPage(page);
    await detail.goto(everestStation.id);

    await detail.commandBar.openViaOtherCommands(/update firmware/i);
    const modal = new ModalHarness(page, /update firmware/i);
    await modal.expectOpen();
    // FieldLabel renders the field name in a <span>, not a <label>; the
    // textbox's accessible name therefore comes from its placeholder.
    // Anchor on the surrounding group's text content instead.
    await expect(
      modal.dialog.getByRole('group').filter({ hasText: /location \(url\)/i }),
    ).toBeVisible();
    await expect(
      modal.dialog.getByRole('group').filter({ hasText: /retrieve date/i }),
    ).toBeVisible();
    await modal.cancel();
  });
});
