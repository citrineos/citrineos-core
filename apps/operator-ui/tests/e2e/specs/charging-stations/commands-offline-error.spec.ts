// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { test } from '../../fixtures';
import { ChargingStationDetailPage } from '../../pages/charging-stations/detail-page';
import { ModalHarness } from '../../pages/components/modal-po';

test.use({ storageState: 'playwright/.auth/admin.json' });

test.describe('charging-stations › offline command rejection', () => {
  test('E2E-081: A command submitted against an offline station does not crash the page', async ({
    page,
    seededStation,
  }) => {
    const detail = new ChargingStationDetailPage(page);
    await detail.goto(seededStation.id);

    await detail.commandBar.resetButton.click();
    const modal = new ModalHarness(page, /reset/i);
    await modal.expectOpen();
    await modal.select(/reset type/i, /^onidle$/i);
    // The seeded station has no live OCPP session — submitting a command
    // surfaces a destructive toast via the async OCPP ack pipeline.
    await modal.submitExpectingError(
      /failed|error|invalid|denied|timeout|offline|disconnected|unreachable|rejected/i,
      60_000,
    );
  });
});
