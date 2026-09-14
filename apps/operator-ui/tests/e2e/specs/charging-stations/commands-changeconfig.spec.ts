// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../fixtures';
import { ChargingStationDetailPage } from '../../pages/charging-stations/detail-page';
import { ModalHarness } from '../../pages/components/modal-po';
import {
  deleteLocation,
  deleteStation,
  seedLocation,
  seedStation,
} from '../../fixtures/seeded-data';

test.use({ storageState: 'playwright/.auth/admin.json' });

test.describe('charging-stations › Change Availability + Configuration', () => {
  test('E2E-082: ChangeAvailability 2.0.1 modal happy path @everest', async ({
    page,
    everestStation,
  }) => {
    const detail = new ChargingStationDetailPage(page);
    await detail.goto(everestStation.id);

    await detail.commandBar.openViaOtherCommands(/change availability/i);
    const modal = new ModalHarness(page, /change availability/i);
    await modal.expectOpen();
    const select = modal.dialog.getByRole('combobox').first();
    await select.click();
    const firstOption = page.getByRole('option').first();
    await firstOption.click();
    await modal.submitAndWaitForToast();
  });

  test('E2E-082b: ChangeConfiguration 1.6 modal validation blocks empty submit', async ({
    page,
    apiClient,
  }) => {
    // ChangeConfiguration is OCPP 1.6-only; seed a 1.6 station inline so the
    // OtherCommandsModal dispatcher exposes the 1.6 menu items.
    const location = await seedLocation(apiClient);
    const station = await seedStation(apiClient, location.id, {
      protocol: 'ocpp1.6',
    });

    try {
      const detail = new ChargingStationDetailPage(page);
      await detail.goto(station.id);

      await detail.commandBar.openViaOtherCommands(/change configuration/i);
      const modal = new ModalHarness(page, /change configuration/i);
      await modal.expectOpen();
      // Required Key field is empty — validation keeps the modal mounted.
      await modal.expectBlockedSubmit();
    } finally {
      await deleteStation(apiClient, station.id).catch(() => undefined);
      await deleteLocation(apiClient, location.id).catch(() => undefined);
    }
  });

  test('E2E-083: ChangeAvailability against an offline station fails gracefully', async ({
    page,
    seededStation,
  }) => {
    const detail = new ChargingStationDetailPage(page);
    await detail.goto(seededStation.id);

    await detail.commandBar.openViaOtherCommands(/change availability/i);
    const modal = new ModalHarness(page, /change availability/i);
    await modal.expectOpen();
    const select = modal.dialog.getByRole('combobox').first();
    if (await select.isVisible().catch(() => false)) {
      await select.click();
      const firstOption = page.getByRole('option').first();
      if (await firstOption.isVisible().catch(() => false)) {
        await firstOption.click();
      } else {
        await select.press('Escape');
      }
    }
    // Offline station — the OCPP backend surfaces a destructive toast.
    await modal.submitExpectingError(
      /failed|error|invalid|denied|timeout|offline|disconnected|unreachable|rejected/i,
      60_000,
    );
  });
});
