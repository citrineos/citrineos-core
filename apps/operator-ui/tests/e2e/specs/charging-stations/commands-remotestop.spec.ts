// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../fixtures';
import { ChargingStationDetailPage } from '../../pages/charging-stations/detail-page';
import { ModalHarness } from '../../pages/components/modal-po';

test.use({ storageState: 'playwright/.auth/admin.json' });

// Source contract (charging-station-detail-card.tsx:471-482):
// StopTransactionButton only renders when hasActiveTransactions === true.
// Specs that exercise the modal therefore seed a transaction first via the
// seededTransaction fixture; specs that only verify the gating behaviour
// observe the rendering invariant directly.

test.describe('charging-stations › RemoteStop command', () => {
  test('E2E-077: With no active transaction, EVerest station surfaces StartTransaction (RemoteStop is gated) @everest', async ({
    page,
    everestStation,
  }) => {
    const detail = new ChargingStationDetailPage(page);
    await detail.goto(everestStation.id);

    // The detail page mutually-exclusively renders StartTransaction (when
    // hasActiveTransactions=false) or StopTransaction (when true). The
    // EVerest cp001 starts with no transaction, so the gating contract is
    // that StartTransaction is shown and StopTransaction is not in the DOM.
    await expect(detail.commandBar.remoteStartButton.first()).toBeVisible({
      timeout: 60_000,
    });
    await expect(detail.commandBar.remoteStopButton).toHaveCount(0);
  });

  test('E2E-077b: RemoteStop modal opens when station has an active transaction', async ({
    page,
    seededTransaction,
    seededStation,
  }) => {
    // seededTransaction fixture seeds an active transaction on seededStation,
    // which causes the StopTransactionButton to render.
    expect(seededTransaction.stationId).toBe(seededStation.id);

    const detail = new ChargingStationDetailPage(page);
    await detail.goto(seededStation.id);

    await detail.commandBar.remoteStopButton.click();
    const modal = new ModalHarness(page, /(remote stop|stop transaction)/i);
    await modal.expectOpen();
    // Submit-against-offline error toast is covered by E2E-073 (Reset).
    await modal.cancel();
  });

  test('E2E-078: When no transaction exists, StopTransaction button is gated and StartTransaction is shown', async ({
    page,
    seededStation,
  }) => {
    const detail = new ChargingStationDetailPage(page);
    await detail.goto(seededStation.id);

    // hasActiveTransactions === false → StartTransactionButton is shown,
    // StopTransactionButton is not rendered. This is the source-level
    // guarantee that prevents an operator submitting RemoteStop with no
    // transaction selected.
    await expect(detail.commandBar.remoteStartButton.first()).toBeVisible({
      timeout: 60_000,
    });
    await expect(detail.commandBar.remoteStopButton).toHaveCount(0);
  });
});
