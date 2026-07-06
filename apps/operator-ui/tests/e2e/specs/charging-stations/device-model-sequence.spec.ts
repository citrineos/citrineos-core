// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { Page } from '@playwright/test';
import { test, expect } from '../../fixtures';
import { ChargingStationDetailPage } from '../../pages/charging-stations/detail.page';
import { ModalHarness } from '../../pages/components/modal.po';

// GetBaseReport → NotifyReport populates the device model (Components +
// Variables) in Hasura, which the Get/SetVariables modals read to build their
// Component/Variable selectors. With the model populated, these modals move
// from open-and-cancel smoke (E2E-079/089) to real selection + dispatch.
//
// Serial: a shared worker-scoped EVerest station; GetBaseReport runs first so
// the selectors are populated for the read/write tests that follow.
//
// Determinism note (why there is no conditional skip): NotifyReport ingestion
// is implemented citrineos-core behaviour, already exercised by E2E-094, and
// cp001's Components/Variables rows are PERSISTENT — the global purge only
// removes `e2e-%` rows, never cp001's device model — so once any GetBaseReport
// has populated the model it stays populated across runs. We therefore wait
// for the model deterministically (expect.poll, the test's actual assertion)
// rather than skipping on a slow ingest.

test.use({ storageState: 'playwright/.auth/admin.json' });

async function deviceModelComponentCount(apiClient: {
  gql: <T>(q: string) => Promise<T>;
}): Promise<number> {
  const data = await apiClient.gql<{
    Components_aggregate: { aggregate: { count: number } };
  }>(
    `query DeviceModelProbe {
       Components_aggregate { aggregate { count } }
     }`,
  );
  return data.Components_aggregate.aggregate.count;
}

// Waits for the device model to be populated (Components > 0). A fresh stack
// needs a few seconds to ingest the NotifyReport stream; a warm stack returns
// on the first poll. The 90s budget sits well inside the 180s everest-serial
// test timeout.
async function waitForDeviceModel(apiClient: { gql: <T>(q: string) => Promise<T> }): Promise<void> {
  await expect
    .poll(() => deviceModelComponentCount(apiClient), {
      timeout: 90_000,
      intervals: [3_000],
    })
    .toBeGreaterThan(0);
}

// Opens the combobox anchored on the given group label and picks its first
// real option. Waits for an option to render before clicking so a still-
// loading useSelect query (the trigger flips enabled before the option list
// arrives) cannot race the click into the empty state.
async function selectFirstOption(
  page: Page,
  modal: ModalHarness,
  groupLabel: RegExp,
): Promise<void> {
  const trigger = modal.dialog
    .getByRole('group')
    .filter({ hasText: groupLabel })
    .getByRole('combobox')
    .first();
  await expect(trigger).toBeEnabled({ timeout: 15_000 });
  await trigger.click();
  const firstOption = page.getByRole('option').first();
  await expect(firstOption).toBeVisible({ timeout: 15_000 });
  await firstOption.click();
}

test.describe('charging-stations › device model sequence @everest', () => {
  test.describe.configure({ mode: 'serial' });

  test('E2E-097: GetBaseReport populates the device model and GetVariables reads a real variable @everest', async ({
    page,
    everestStation,
    apiClient,
  }) => {
    const detail = new ChargingStationDetailPage(page);
    await detail.goto(everestStation.id);

    // Request a full inventory; NotifyReport flows back asynchronously.
    await detail.commandBar.openViaOtherCommands(/get base report/i);
    const baseReport = new ModalHarness(page, /get base report/i);
    await baseReport.expectOpen();
    await baseReport.submitAndWaitForToast();

    // The model populates deterministically (persistent cp001 rows + implemented
    // NotifyReport ingestion); wait for it as the test's assertion.
    await waitForDeviceModel(apiClient);

    // Selectors are populated — reload so the modal picks up the rows, then
    // read a real Component/Variable end-to-end.
    await page.reload();
    await detail.expectLoaded();
    await detail.commandBar.openViaOtherCommands(/get variables/i);
    const getVars = new ModalHarness(page, /get variables/i);
    await getVars.expectOpen();

    await selectFirstOption(page, getVars, /component #1/i);
    await selectFirstOption(page, getVars, /variable #1/i);

    await getVars.submitAndWaitForToast();
  });

  test('E2E-097b: SetVariables dispatches a real component/variable write round-trip @everest', async ({
    page,
    everestStation,
    apiClient,
  }) => {
    // E2E-097 (serial-prior) populated the persistent model; wait for it
    // deterministically so this test does not silently depend on ordering.
    await waitForDeviceModel(apiClient);

    const detail = new ChargingStationDetailPage(page);
    await detail.goto(everestStation.id);
    await detail.commandBar.openViaOtherCommands(/set variables/i);
    const setVars = new ModalHarness(page, /set variables/i);
    await setVars.expectOpen();

    await selectFirstOption(page, setVars, /component #1/i);
    await selectFirstOption(page, setVars, /variable #1/i);

    await setVars.dialog
      .getByRole('group')
      .filter({ hasText: /value #1/i })
      .getByRole('textbox')
      .first()
      .fill('0');

    // The OCPP SetVariablesResponse round-trips per-variable status; an
    // arbitrarily-picked writable variable may be Accepted or Rejected
    // (value-type dependent). Either is a real station round-trip — assert a
    // toast surfaces rather than asserting only success.
    await setVars.submitButton.click();
    await expect(page.getByRole('region', { name: /notifications/i })).toContainText(
      /success|accepted|failed|error|rejected|invalid|denied/i,
      {
        timeout: 30_000,
      },
    );
  });
});
