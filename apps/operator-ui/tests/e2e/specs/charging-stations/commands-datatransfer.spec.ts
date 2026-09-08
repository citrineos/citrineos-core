// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../fixtures';
import { ChargingStationDetailPage } from '../../pages/charging-stations/detail-page';
import { ModalHarness } from '../../pages/components/modal-po';

test.use({ storageState: 'playwright/.auth/admin.json' });

test.describe('charging-stations › DataTransfer command', () => {
  test('E2E-087: DataTransfer modal accepts a vendor id and submits @everest', async ({
    page,
    everestStation,
  }) => {
    const detail = new ChargingStationDetailPage(page);
    await detail.goto(everestStation.id);

    await detail.commandBar.openViaOtherCommands(/data transfer/i);
    const modal = new ModalHarness(page, /data transfer/i);
    await modal.expectOpen();
    const vendorInput = modal.dialog.getByRole('textbox', { name: /vendor/i }).first();
    await vendorInput.fill('e2e-vendor');
    await modal.submitAndWaitForToast();
  });

  test('E2E-087b: DataTransfer modal validation blocks empty submit', async ({
    page,
    seededStation,
  }) => {
    const detail = new ChargingStationDetailPage(page);
    await detail.goto(seededStation.id);

    await detail.commandBar.openViaOtherCommands(/data transfer/i);
    const modal = new ModalHarness(page, /data transfer/i);
    await modal.expectOpen();
    // Vendor Id is required; client-side validation keeps the modal mounted
    // until the operator fills it in.
    await modal.expectBlockedSubmit();
  });
});
