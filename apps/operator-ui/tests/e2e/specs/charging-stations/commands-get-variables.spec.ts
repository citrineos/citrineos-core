// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../fixtures';
import { ChargingStationDetailPage } from '../../pages/charging-stations/detail-page';
import { ModalHarness } from '../../pages/components/modal-po';

test.use({ storageState: 'playwright/.auth/admin.json' });

test.describe('charging-stations › GetVariables command', () => {
  test('E2E-079: GetVariables modal opens with at least one variable-row form @everest', async ({
    page,
    everestStation,
  }) => {
    const detail = new ChargingStationDetailPage(page);
    await detail.goto(everestStation.id);

    await detail.commandBar.openViaOtherCommands(/get variables/i);
    const modal = new ModalHarness(page, /get variables/i);
    await modal.expectOpen();
    // Component and Variable comboboxes are populated dynamically by a
    // GetBaseReport flow that EVerest's manager image does not initiate at
    // boot, so a true happy-path submit is not feasible without that
    // round-trip. Smoke depth: assert the field-array form renders.
    await expect(
      modal.dialog.getByRole('group').filter({ hasText: /component #1/i }),
    ).toBeVisible();
    await expect(modal.dialog.getByRole('group').filter({ hasText: /variable #1/i })).toBeVisible();
    await modal.cancel();
  });

  test('E2E-080: GetVariables validation when no rows present', async ({ page, seededStation }) => {
    const detail = new ChargingStationDetailPage(page);
    await detail.goto(seededStation.id);

    await detail.commandBar.openViaOtherCommands(/get variables/i);
    const modal = new ModalHarness(page, /get variables/i);
    await modal.expectOpen();
    // Component + Variable in the field-array row are required; the form
    // blocks dispatch and keeps the modal mounted.
    await modal.expectBlockedSubmit();
  });
});
