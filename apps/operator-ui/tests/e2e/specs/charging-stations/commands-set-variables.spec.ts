// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../fixtures';
import { ChargingStationDetailPage } from '../../pages/charging-stations/detail-page';
import { ModalHarness } from '../../pages/components/modal-po';

test.use({ storageState: 'playwright/.auth/admin.json' });

test.describe('charging-stations › SetVariables command', () => {
  test('E2E-089: SetVariables modal opens with a variable-assignment form @everest', async ({
    page,
    everestStation,
  }) => {
    const detail = new ChargingStationDetailPage(page);
    await detail.goto(everestStation.id);

    await detail.commandBar.openViaOtherCommands(/set variables/i);
    const modal = new ModalHarness(page, /set variables/i);
    await modal.expectOpen();
    // Component / Variable comboboxes depend on a GetBaseReport/NotifyReport
    // round-trip that EVerest's manager image does not initiate at boot;
    // smoke depth is sufficient — confirm the field-array renders.
    await expect(
      modal.dialog.getByRole('group').filter({ hasText: /component #1/i }),
    ).toBeVisible();
    await expect(modal.dialog.getByRole('group').filter({ hasText: /variable #1/i })).toBeVisible();
    await modal.cancel();
  });

  test('E2E-089b: SetVariables validation blocks submit with empty rows', async ({
    page,
    seededStation,
  }) => {
    const detail = new ChargingStationDetailPage(page);
    await detail.goto(seededStation.id);

    await detail.commandBar.openViaOtherCommands(/set variables/i);
    const modal = new ModalHarness(page, /set variables/i);
    await modal.expectOpen();
    // Component + Variable + AttributeValue in the field-array row are
    // required; the form blocks dispatch and keeps the modal mounted.
    await modal.expectBlockedSubmit();
  });
});
