// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../fixtures';
import { ChargingStationDetailPage } from '../../pages/charging-stations/detail.page';
import { ModalHarness } from '../../pages/components/modal.po';

test.use({ storageState: 'playwright/.auth/admin.json' });

test.describe('charging-stations › RemoteStart command', () => {
  test('E2E-074: RemoteStart modal opens against EVerest with form rendered @everest', async ({
    page,
    everestStation,
  }) => {
    const detail = new ChargingStationDetailPage(page);
    await detail.goto(everestStation.id);

    await detail.commandBar.remoteStartButton.click();
    const modal = new ModalHarness(page, /(remote start|start transaction)/i);
    await modal.expectOpen();
    // Smoke depth: confirm the form rendered. A successful RemoteStart
    // submit requires a fully-staged Authorization → SetVariables →
    // RequestStartTransaction handshake that EVerest's manager image does
    // not auto-stage.
    await expect(modal.dialog.getByRole('combobox').first()).toBeVisible();
    await modal.cancel();
  });

  test('E2E-075: RemoteStart 2.0.1 EVSE variant @everest', async ({
    page,
    everestStation,
    seededAuthorization,
  }) => {
    void seededAuthorization;
    const detail = new ChargingStationDetailPage(page);
    await detail.goto(everestStation.id);

    await detail.commandBar.remoteStartButton.click();
    const modal = new ModalHarness(page, /(remote start|start transaction)/i);
    await modal.expectOpen();
    // Smoke check: the form rendered, includes at least one combobox.
    await expect(modal.dialog.getByRole('combobox').first()).toBeVisible();
    await modal.cancel();
  });

  test('E2E-076: RemoteStart validation when id token is empty', async ({
    page,
    seededStation,
  }) => {
    const detail = new ChargingStationDetailPage(page);
    await detail.goto(seededStation.id);

    await detail.commandBar.remoteStartButton.click();
    const modal = new ModalHarness(page, /(remote start|start transaction)/i);
    await modal.expectOpen();

    // The id token textbox is required; client-side validation rejects the
    // empty submit before the command reaches the OCPP backend.
    await modal.expectBlockedSubmit();
  });
});
