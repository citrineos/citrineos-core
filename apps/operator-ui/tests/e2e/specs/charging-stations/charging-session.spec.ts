// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { setTimeout as delay } from 'node:timers/promises';
import { test, expect } from '../../fixtures';
import type { ApiClient } from '../../fixtures/api-client';
import { ChargingStationDetailPage } from '../../pages/charging-stations/detail.page';
import { ModalHarness } from '../../pages/components/modal.po';
import { simulatePlugIn, simulateUnplug } from '../../fixtures/everest';

// The suite's flagship live journey: a real charging session driven end-to-end
// against the EVerest simulator through the operator UI. Every other
// transaction / MeterValue test seeds rows directly via Hasura; this one
// produces them the way production does — a vehicle plugs in, the operator
// RemoteStarts with an authorized id token, the station reports a live
// transaction with MeterValues, and the operator RemoteStops it.
//
// Mechanics established against the EVerest 2025.6.x SIL stack (see
// fixtures/everest.ts):
//  - The car simulator parks at "waiting for power" on plug-in and only
//    energizes once authorized, so there is a 120 s Auth connection_timeout
//    window in which to drive the UI RemoteStart.
//  - RemoteStart MUST carry an EVSE id — libocpp rejects "No evse id given".
//  - The id token must be a `Central` token (ISO14443 requires hex); the
//    fixture seeds EVEREST-CP001-AUTH Accepted.
// The UI uses Refine useOne/useList with no subscriptions, so the detail page
// is reloaded to pick up the started transaction before RemoteStop renders.
// The detail route is navigated first so any cold Next.js compile happens
// before the vehicle plugs in, not inside the authorization window.

test.use({ storageState: 'playwright/.auth/admin.json' });

const EVEREST_AUTH_TOKEN = 'EVEREST-CP001-AUTH';

interface LiveTransaction {
  readonly id: number;
  readonly transactionId: string;
}

async function pollActiveTransaction(
  apiClient: ApiClient,
  ocppConnectionName: string,
  timeoutMs: number,
): Promise<LiveTransaction | undefined> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const { Transactions } = await apiClient.gql<{
      Transactions: { id: number; transactionId: string }[];
    }>(
      `query ActiveTxn($name: String!) {
         Transactions(
           where: { ocppConnectionName: { _eq: $name }, isActive: { _eq: true } }
           limit: 1
         ) { id transactionId }
       }`,
      { name: ocppConnectionName },
    );
    if (Transactions[0]) return Transactions[0];
    await delay(2_000);
  }
  return undefined;
}

// Live sessions create MeterValues + TransactionEvents that FK the transaction
// by its DB id; delete them before the Transaction row. Best-effort cleanup.
async function purgeTransaction(apiClient: ApiClient, id: number): Promise<void> {
  await apiClient
    .gql(
      `mutation PurgeLiveTxn($id: Int!) {
         delete_MeterValues(where: { transactionDatabaseId: { _eq: $id } }) { affected_rows }
         delete_TransactionEvents(where: { transactionDatabaseId: { _eq: $id } }) { affected_rows }
         delete_Transactions(where: { id: { _eq: $id } }) { affected_rows }
       }`,
      { id },
    )
    .catch(() => undefined);
}

test.describe('charging-stations › live charging session @everest', () => {
  // Live driving has docker-exec/MQTT and authorization-window timing in the
  // loop; retry to absorb the occasional transient, matching the other
  // EVerest specs' resilience bar.
  test.describe.configure({ retries: 2 });

  test('E2E-098: plug in → RemoteStart → live transaction with MeterValues → RemoteStop @everest', async ({
    page,
    everestStation,
    apiClient,
  }) => {
    let live: LiveTransaction | undefined;
    try {
      // Navigate first so a cold route compile is paid before the vehicle
      // plugs in (keeping the RemoteStart inside the 120 s auth window).
      const detail = new ChargingStationDetailPage(page);
      await detail.goto(everestStation.id);
      await expect(detail.commandBar.remoteStartButton.first()).toBeVisible({
        timeout: 60_000,
      });

      // A vehicle plugs into connector 1 and requests charging.
      await simulatePlugIn();

      // The operator authorizes the session via the RemoteStart modal.
      await detail.commandBar.remoteStartButton.click();
      const startModal = new ModalHarness(page, /(remote start|start transaction)/i);
      await startModal.expectOpen();

      // The form's comboboxes expose no accessible name (the placeholder is a
      // child text node), so each is reached through its labelled field group —
      // the same anchor ModalHarness.select uses. Authorization is server-
      // filtered: open it, type the token, pick the seeded Accepted row.
      await startModal.dialog
        .getByRole('group')
        .filter({ hasText: /authorization/i })
        .getByRole('combobox')
        .click();
      await page.getByPlaceholder(/search authorization/i).fill(EVEREST_AUTH_TOKEN);
      await page.getByRole('option', { name: EVEREST_AUTH_TOKEN }).click();

      // The EVSE is mandatory for a 2.0.1 RemoteStart (libocpp rejects a
      // missing evse id); cp001 has a single EVSE with type id 1.
      await startModal.dialog
        .getByRole('group')
        .filter({ hasText: /evse/i })
        .getByRole('combobox')
        .click();
      await page.getByRole('option', { name: '1', exact: true }).click();

      await startModal.submitAndWaitForToast();

      // A live transaction starts — proof the RemoteStart → Authorize →
      // TransactionEvent(Started) round-trip reached the database.
      live = await pollActiveTransaction(apiClient, everestStation.ocppConnectionName, 45_000);
      expect(live, 'a live transaction should start on the EVerest station').toBeTruthy();

      // MeterValues flow during the session — the live energy readings every
      // other meter test seeds by hand.
      await expect
        .poll(
          async () => {
            const { MeterValues_aggregate } = await apiClient.gql<{
              MeterValues_aggregate: { aggregate: { count: number } };
            }>(
              `query LiveMeter($id: Int!) {
                 MeterValues_aggregate(
                   where: { transactionDatabaseId: { _eq: $id } }
                 ) { aggregate { count } }
               }`,
              { id: live!.id },
            );
            return MeterValues_aggregate.aggregate.count;
          },
          { timeout: 40_000 },
        )
        .toBeGreaterThan(0);

      // The UI has no live updates; reload to surface the started transaction,
      // which flips the command bar from RemoteStart to RemoteStop.
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 60_000 });
      await detail.expectLoaded();
      await expect(detail.commandBar.remoteStopButton).toBeVisible({
        timeout: 30_000,
      });
      await detail.commandBar.remoteStopButton.click();

      const stopModal = new ModalHarness(page, /(remote stop|stop transaction)/i);
      await stopModal.expectOpen();
      await stopModal.dialog.getByRole('combobox').first().click();
      await page.getByRole('option', { name: live!.transactionId }).click();
      await stopModal.submitAndWaitForToast();

      // The transaction ends (isActive flips false).
      await expect
        .poll(
          async () => {
            const { Transactions } = await apiClient.gql<{
              Transactions: { isActive: boolean }[];
            }>(
              `query TxnEnded($tid: String!) {
                 Transactions(where: { transactionId: { _eq: $tid } }, limit: 1) {
                   isActive
                 }
               }`,
              { tid: live!.transactionId },
            );
            return Transactions[0]?.isActive;
          },
          { timeout: 30_000 },
        )
        .toBe(false);
    } finally {
      await simulateUnplug().catch(() => undefined);
      if (live) await purgeTransaction(apiClient, live.id);
    }
  });
});
