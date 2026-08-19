// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { test } from '../../fixtures';
import { ChargingStationDetailPage } from '../../pages/charging-stations/detail.page';
import { ModalHarness } from '../../pages/components/modal.po';

// Core-profile OCPP 2.0.1 commands that the EVerest manager answers with a
// real CALLRESULT. These move from open-and-cancel smoke (parametric harness)
// to deep coverage: submit against the live station and assert the
// server-ack success toast. Commands the manager does not reliably answer
// (Unlock, certificate/firmware/log/network-profile flows) stay smoke.

test.use({ storageState: 'playwright/.auth/admin.json' });

test.describe('charging-stations › deep command ACKs @everest', () => {
  test('E2E-153: ClearCache submits and is acknowledged @everest', async ({
    page,
    everestStation,
  }) => {
    const detail = new ChargingStationDetailPage(page);
    await detail.goto(everestStation.id);
    await detail.commandBar.openViaOtherCommands(/clear cache/i);
    const modal = new ModalHarness(page, /clear cache/i);
    await modal.expectOpen();
    await modal.submitAndWaitForToast();
  });

  test('E2E-154: GetBaseReport submits and is acknowledged @everest', async ({
    page,
    everestStation,
  }) => {
    const detail = new ChargingStationDetailPage(page);
    await detail.goto(everestStation.id);
    await detail.commandBar.openViaOtherCommands(/get base report/i);
    const modal = new ModalHarness(page, /get base report/i);
    await modal.expectOpen();
    // Defaults: requestId=1, FullInventory — submit as-is.
    await modal.submitAndWaitForToast();
  });

  test('E2E-155: GetTransactionStatus submits and is acknowledged @everest', async ({
    page,
    everestStation,
  }) => {
    const detail = new ChargingStationDetailPage(page);
    await detail.goto(everestStation.id);
    await detail.commandBar.openViaOtherCommands(/get transaction status/i);
    const modal = new ModalHarness(page, /get transaction status/i);
    await modal.expectOpen();
    await modal.submitAndWaitForToast();
  });

  test('E2E-096: GetInstalledCertificateIds submits and is acknowledged @everest', async ({
    page,
    everestStation,
  }) => {
    const detail = new ChargingStationDetailPage(page);
    await detail.goto(everestStation.id);
    await detail.commandBar.openViaOtherCommands(/get installed certificate/i);
    const modal = new ModalHarness(page, /installed certificate/i);
    await modal.expectOpen();
    await modal.submitAndWaitForToast();
  });
});
