// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { test } from '../../fixtures';
import { ChargingStationDetailPage } from '../../pages/charging-stations/detail.page';
import { ModalHarness } from '../../pages/components/modal.po';

test.use({ storageState: 'playwright/.auth/admin.json' });

// A reboot-causing Reset (Immediate always; OnIdle on an idle station) reboots
// the EVerest manager container, dropping cp001's OCPP link for >150s in CI. The
// reset tests run LAST in the @everest lane, so the only test that can land on a
// reconnecting station is the *next* reset test — its per-test everestStation
// online guard waits for cp001 to come back (RECONNECT_TIMEOUT_MS). Because that
// reconnect exceeds the default 180s test budget, this describe runs with an
// extended timeout (so the guard can finish inside one attempt) plus retries as
// a backstop. The contract under test is that the Reset is ACKnowledged (the
// success toast); the reboot is a side effect we simply let settle.
test.describe('charging-stations › Reset command @everest', () => {
  test.describe.configure({ retries: 2, timeout: 240_000 });

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
    await modal.submitAndWaitForToast();
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
    await modal.submitAndWaitForToast();
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
    // The modal stays open and an error toast appears.
    await modal.submitExpectingError();
  });
});
