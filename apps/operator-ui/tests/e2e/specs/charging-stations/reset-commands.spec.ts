// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { test } from '../../fixtures';
import { ChargingStationDetailPage } from '../../pages/charging-stations/detail.page';
import { ModalHarness } from '../../pages/components/modal.po';
import { waitForEverestOffline } from '../../fixtures/everest';

test.use({ storageState: 'playwright/.auth/admin.json' });

// A reboot-causing Reset (Immediate always; OnIdle on an idle station) reboots
// the EVerest manager container, dropping cp001's OCPP link for >150s in CI. The
// reset tests run LAST in the @everest lane, so the only test that can land on a
// reconnecting station is the *next* reset test — its everestStation guard waits
// for cp001 to come back (and restarts the manager if it wedges) under the
// fixture's own timeout, so the reconnect never eats the test budget.
//
// The contract under test is that the Reset was accepted OR observably
// executed: an immediate reboot can kill the socket before the CALLRESULT
// flushes, so the ack toast is not guaranteed even on success — the station
// visibly dropping offline is equally hard proof the command worked (a
// recorded run rebooted the charger and never showed the toast).
async function submitResetAndConfirm(modal: ModalHarness): Promise<void> {
  await modal.markToastsStale();
  await modal.submitButton.click();
  await Promise.any([
    modal.newToastVisible(/success|accepted|sent|reset|completed|received/i, 60_000),
    waitForEverestOffline(60_000),
  ]);
  // The reboot trails the ack by a few seconds. Returning before the link
  // drops lets the next test's online guard sample the pre-reboot window and
  // walk straight into the outage mid-test. Hold until the drop is observed;
  // if it never comes the reset simply didn't reboot and there is nothing to
  // shield the next test from.
  await waitForEverestOffline(120_000).catch(() => undefined);
}

test.describe('charging-stations › Reset command @everest', () => {
  test.describe.configure({ retries: 2 });

  test('E2E-070: Reset Hard happy path against EVerest station', async ({
    page,
    everestStation,
  }) => {
    const detail = new ChargingStationDetailPage(page);
    await detail.goto(everestStation.id);

    await detail.commandBar.resetButton.click();
    const modal = new ModalHarness(page, /reset/i);
    await modal.expectOpen();
    await modal.select(/reset type/i, /^immediate$/i);
    await submitResetAndConfirm(modal);
  });

  test('E2E-071: Reset OnIdle variant against EVerest station', async ({
    page,
    everestStation,
  }) => {
    const detail = new ChargingStationDetailPage(page);
    await detail.goto(everestStation.id);

    await detail.commandBar.resetButton.click();
    const modal = new ModalHarness(page, /reset/i);
    await modal.expectOpen();
    await modal.select(/reset type/i, /^onidle$/i);
    await submitResetAndConfirm(modal);
  });
});

test.describe('charging-stations › Reset validation + offline', () => {
  test('E2E-073: Reset against an offline (unseeded-EVerest) station fails gracefully', async ({
    page,
    seededStation,
  }) => {
    const detail = new ChargingStationDetailPage(page);
    await detail.goto(seededStation.id);

    await detail.commandBar.resetButton.click();
    const modal = new ModalHarness(page, /reset/i);
    await modal.expectOpen();
    await modal.select(/reset type/i, /^onidle$/i);

    // Without an active OCPP session, the command pipeline returns a failure.
    // The modal stays open and an error toast appears. 60s: doomed commands
    // queue behind the shared core pipeline under load.
    await modal.submitExpectingError(undefined, 60_000);
  });
});
