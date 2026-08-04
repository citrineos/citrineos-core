// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../fixtures';
import { ChargingStationDetailPage } from '../../pages/charging-stations/detail.page';
import { ModalHarness } from '../../pages/components/modal.po';

test.use({ storageState: 'playwright/.auth/admin.json' });

test.describe('charging-stations › UnlockConnector command', () => {
  test('E2E-086: UnlockConnector modal opens with a connector selector @everest', async ({
    page,
    everestStation,
  }) => {
    const detail = new ChargingStationDetailPage(page);
    await detail.goto(everestStation.id);

    await detail.commandBar.openViaOtherCommands(/unlock connector/i);
    const modal = new ModalHarness(page, /unlock connector/i);
    await modal.expectOpen();
    // Smoke depth: the EVerest manager image does not reliably ACK
    // UnlockConnector — the command dispatches but no OCPP response returns
    // within the toast budget (confirmed across clean-station runs and
    // retries). So we assert the connector selector renders, mirroring the
    // RemoteStart smoke specs (E2E-074/075), instead of waiting on an ack
    // that never arrives.
    const evseSelect = modal.dialog.getByRole('combobox').first();
    await evseSelect.click();
    await page.getByRole('option').first().click();
    await expect(modal.submitButton).toBeVisible();
    await modal.cancel();
  });

  test('E2E-086b: UnlockConnector form blocks dispatch when the station has no connectors', async ({
    page,
    seededStation,
  }) => {
    const detail = new ChargingStationDetailPage(page);
    await detail.goto(seededStation.id);

    await detail.commandBar.openViaOtherCommands(/unlock connector/i);
    const modal = new ModalHarness(page, /unlock connector/i);
    await modal.expectOpen();

    // The seeded station is created without EVSEs/Connectors. The Connector
    // combobox has no options, so the form cannot be completed and the modal
    // stays mounted instead of dispatching to the OCPP backend. This modal
    // renders no field-level message on an empty submit, so the mounted
    // dialog is the strongest available signal here.
    const connectorCombobox = modal.dialog.getByRole('combobox').first();
    await expect(connectorCombobox).toBeVisible();
    await modal.submitButton.click();
    await expect(modal.dialog).toBeVisible({ timeout: 15_000 });
  });
});
