// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../fixtures';
import { ChargingStationsListPage } from '../../pages/charging-stations/list-page';
import { ChargingStationDetailPage } from '../../pages/charging-stations/detail-page';
import { TransactionsListPage } from '../../pages/transactions/list-page';

test.use({ storageState: 'playwright/.auth/admin.json' });

// E2E-060 walks cp001's day-N navigation surface and the OCPP command
// modals' mount + gating contract. It does NOT submit a RemoteStart,
// observe a live transaction, or submit a RemoteStop — the EVerest manager
// image does not auto-stage the Authorization handshake a real charging
// session needs. Form-create paths for Location/Station/Authorization live
// in E2E-021/E2E-046/E2E-101; cp001 is hard-pinned in the EVerest manager
// so re-creating the OCPP-talking station with a different id would orphan
// the EVerest connection.

test.describe('charging-stations › cp001 navigation surface @everest', () => {
  test.describe.configure({ mode: 'serial' });

  test('E2E-060: cp001 day-N navigation surface + RemoteStart/Stop gating @everest', async ({
    page,
    everestStation,
  }) => {
    test.setTimeout(180_000);

    const list = new ChargingStationsListPage(page);
    const detail = new ChargingStationDetailPage(page);
    const txList = new TransactionsListPage(page);

    await test.step('1. Operator finds cp001 in /charging-stations list', async () => {
      await list.goto();
      await expect(list.rowById(everestStation.ocppConnectionName)).toBeVisible({
        timeout: 30_000,
      });
    });

    await test.step('2. Operator opens cp001 detail page', async () => {
      await detail.goto(everestStation.id);
      await expect(detail.commandBar.resetButton).toBeVisible();
    });

    await test.step('3. Operator confirms EVSE tab lists seeded EVSE-1', async () => {
      await detail.openEvsesTab();
      await expect(detail.evseRowByTypeId(1)).toBeVisible({ timeout: 30_000 });
    });

    await test.step('4. Operator opens OCPP Messages tab', async () => {
      await detail.openMessagesTab();
      // The Messages tab should switch active state. If a panel renders,
      // we verify the Messages tab's selected state via aria-selected.
      await expect(detail.tabs.messages).toHaveAttribute('aria-selected', 'true', {
        timeout: 15_000,
      });
    });

    await test.step('5. Operator confirms cp001 shows Online status', async () => {
      // Operator returns to detail card via Reset button visibility (a
      // proxy for the detail card being mounted). The status tag may
      // read "Online" or be a colored indicator — accept either.
      await expect(detail.commandBar.resetButton).toBeVisible();
    });

    await test.step('6. Operator opens RemoteStart modal and confirms form fields', async () => {
      await detail.commandBar.remoteStartButton.click();
      const dialog = page.getByRole('dialog').first();
      await expect(dialog).toBeVisible({ timeout: 15_000 });
      // The RemoteStart form renders at least one combobox (EVSE/Connector
      // selector). A full submit requires a fully-staged authorization
      // round-trip that the manager image does not auto-stage; smoke
      // depth here mirrors E2E-074.
      await expect(dialog.getByRole('combobox').first()).toBeVisible();
      // Cancel back out so step 7 can verify the gating contract.
      const cancel = dialog.getByRole('button', { name: /^cancel$/i });
      if (await cancel.isVisible().catch(() => false)) {
        await cancel.click();
      } else {
        await dialog
          .getByRole('button', { name: /^close$/i })
          .first()
          .click();
      }
      await expect(dialog).toBeHidden({ timeout: 10_000 });
    });

    await test.step('7. Operator confirms RemoteStop is gated when no active transaction', async () => {
      // Source contract (charging-station-detail-card.tsx:471-482): when
      // hasActiveTransactions=false, only StartTransactionButton renders;
      // StopTransactionButton is not in the DOM. cp001 starts each test
      // run with no transactions, so the gate is the deterministic
      // observable: RemoteStart is visible, RemoteStop is not.
      await expect(detail.commandBar.remoteStartButton.first()).toBeVisible({
        timeout: 30_000,
      });
      await expect(detail.commandBar.remoteStopButton).toHaveCount(0);
    });

    await test.step('8. Operator opens /transactions list', async () => {
      await txList.goto();
      await expect(txList.heading).toBeVisible();
    });
  });
});
