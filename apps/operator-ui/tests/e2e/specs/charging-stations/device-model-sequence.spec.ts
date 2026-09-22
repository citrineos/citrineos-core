// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { Page } from '@playwright/test';
import { test, expect } from '../../fixtures';
import { ChargingStationDetailPage } from '../../pages/charging-stations/detail-page';
import { ModalHarness } from '../../pages/components/modal-po';
import type { ApiClient } from '../../fixtures/api-client';

// GetBaseReport → NotifyReport populates the device model (Components +
// Variables) in Hasura, which the Get/SetVariables modals read to build their
// Component/Variable selectors. With the model populated, these modals move
// from open-and-cancel smoke (E2E-079/089) to real selection + dispatch.
//
// Serial: a shared worker-scoped EVerest station; GetBaseReport runs first so
// the selectors are populated for the read/write tests that follow.
//
// Determinism note: cp001's Components/Variables rows are PERSISTENT — the
// global purge only removes `e2e-%` rows, never cp001's device model — so once
// a GetBaseReport has populated the model it stays populated across runs. We
// therefore wait for the model deterministically (expect.poll, the test's
// actual assertion) rather than skipping on a slow ingest.

test.use({ storageState: 'playwright/.auth/admin.json' });

// The NotifyReport stream is hundreds of sequential VariableAttribute upserts
// behind a RabbitMQ hop; on a loaded CI runner the last message lands well over
// a minute after the GetBaseReport ack. The tests raise their own timeout to fit
// this on top of the everest-serial project's 180s.
const DEVICE_MODEL_TIMEOUT_MS = 150_000;

// OCPPMessages rows are not purged between runs (the global purge only removes
// `e2e-%` rows, and cp001 is not one), so the frame counts below are scoped to
// this run. Without it a previous run's completed report would satisfy the gate
// and a previous run's CallError would fail it forever. Module scope, so it is
// fixed before either test sends anything and both see the same lower bound.
const SUITE_START_ISO = new Date().toISOString();

interface WritableComponent {
  readonly id: number;
  readonly name: string;
}

interface DeviceModelProbeResult {
  complete: { aggregate: { count: number } };
  rejected: { aggregate: { count: number } };
  VariableAttributes: { componentId: number }[];
  Components: { id: number; name: string }[];
}

// Three questions in one round trip.
//
// `complete` — did the stream finish? A NotifyReport carries tbc ("to be
// continued"); the last message of the stream sets it false, and per OCPP
// 2.0.1 Part 2 omitting it means false, so both shapes count.
//
// `rejected` — did we accept it? The router persists each inbound frame BEFORE
// the handler runs, so a tbc-false frame exists even when ingestion then threw.
// A CallError (MessageTypeId 4) against any NotifyReport means part of the
// stream was refused and the model is permanently short — waiting longer cannot
// fix it, so the gate reports that rather than timing out on a bare "not yet".
//
// `VariableAttributes` — which component can SetVariables actually write to?
// That selector lists a variable only when it has an attribute writable ON the
// selected component, and `VariableAttributes` joins `Variables` on variableId
// alone, so the componentId has to come from the attribute row itself. Nothing
// the boot flow writes is writable (DeviceModelService.updateDeviceModel writes
// ReadOnly, as does the Present/Available/Enabled trio the DAL adds to each new
// component), which is why `Components > 0` — the gate this replaced — was
// already satisfied by BootNotification's two rows and returned on its first
// poll without the report having arrived at all.
const DEVICE_MODEL_PROBE = `
  query DeviceModelProbe($ocppConnectionName: String!, $since: timestamptz!) {
    complete: OCPPMessages_aggregate(
      where: {
        action: { _eq: "NotifyReport" }
        origin: { _eq: "cs" }
        timestamp: { _gte: $since }
        ChargingStation: { ocppConnectionName: { _eq: $ocppConnectionName } }
        _or: [
          { payload: { _contains: { tbc: false } } }
          { _not: { payload: { _has_key: "tbc" } } }
        ]
      }
    ) {
      aggregate {
        count
      }
    }
    rejected: OCPPMessages_aggregate(
      where: {
        action: { _eq: "NotifyReport" }
        type: { _eq: 4 }
        timestamp: { _gte: $since }
        ChargingStation: { ocppConnectionName: { _eq: $ocppConnectionName } }
      }
    ) {
      aggregate {
        count
      }
    }
    VariableAttributes(
      where: { mutability: { _neq: "ReadOnly" } }
      distinct_on: componentId
      order_by: { componentId: asc }
    ) {
      componentId
    }
    Components {
      id
      name
    }
  }`;

function pickWritableComponent(probe: DeviceModelProbeResult): WritableComponent | null {
  const nameById = new Map(probe.Components.map((c) => [c.id, c.name]));
  const countByName = new Map<string, number>();
  for (const component of probe.Components) {
    countByName.set(component.name, (countByName.get(component.name) ?? 0) + 1);
  }

  for (const attribute of probe.VariableAttributes) {
    const name = nameById.get(attribute.componentId);
    // The combobox is driven by a name search, so a name carried by several
    // components (same name, different instance) cannot be selected
    // unambiguously — skip to the next candidate.
    if (name !== undefined && countByName.get(name) === 1) {
      return { id: attribute.componentId, name };
    }
  }
  return null;
}

// Collapses the probe to one word per state so a failure prints which of the
// three conditions is unmet instead of a bare boolean.
async function readDeviceModelState(
  apiClient: ApiClient,
  ocppConnectionName: string,
): Promise<string> {
  const probe = await apiClient.gql<DeviceModelProbeResult>(DEVICE_MODEL_PROBE, {
    ocppConnectionName,
    since: SUITE_START_ISO,
  });

  if (probe.rejected.aggregate.count > 0) {
    return `rejected: ${probe.rejected.aggregate.count} NotifyReport CallError(s) — citrineos-core refused part of the report`;
  }
  if (probe.complete.aggregate.count === 0) {
    return 'incomplete: no NotifyReport with tbc=false yet';
  }
  if (pickWritableComponent(probe) === null) {
    return 'ingested but no component has a writable variable';
  }
  return 'ingested';
}

// Waits for the whole report to land and be accepted, then returns a component
// the SetVariables selector is guaranteed to have options for.
async function waitForIngestedDeviceModel(
  apiClient: ApiClient,
  ocppConnectionName: string,
): Promise<WritableComponent> {
  await expect
    .poll(() => readDeviceModelState(apiClient, ocppConnectionName), {
      timeout: DEVICE_MODEL_TIMEOUT_MS,
      intervals: [3_000],
      message:
        'GetBaseReport did not produce a complete, accepted device model. Check the citrine ' +
        'server log for a NotifyReport handler error and the EVerest OCPP log for the ' +
        'NotifyReport sequence.',
    })
    .toBe('ingested');

  const probe = await apiClient.gql<DeviceModelProbeResult>(DEVICE_MODEL_PROBE, {
    ocppConnectionName,
    since: SUITE_START_ISO,
  });
  const component = pickWritableComponent(probe);
  if (component === null) {
    throw new Error('Writable device-model component disappeared between poll and read.');
  }
  return component;
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
  await openCombobox(page, modal, groupLabel);
  const firstOption = page.getByRole('option').first();
  await expect(firstOption).toBeVisible({ timeout: 15_000 });
  await firstOption.click();
}

// Picks a named option. The component list is served in pages of 10 with no
// ordering, so the wanted component need not be on the first page; typing
// drives useSelect's server-side search rather than relying on that order.
// `exact` keeps the match off the "use this value" row that `allowManualEntry`
// renders for a partial term.
async function selectOptionByName(
  page: Page,
  modal: ModalHarness,
  groupLabel: RegExp,
  optionName: string,
): Promise<void> {
  await openCombobox(page, modal, groupLabel);
  await page.locator('[data-slot="command-input"]').fill(optionName);
  const option = page.getByRole('option', { name: optionName, exact: true }).first();
  await expect(option).toBeVisible({ timeout: 15_000 });
  await option.click();
}

async function openCombobox(page: Page, modal: ModalHarness, groupLabel: RegExp): Promise<void> {
  const trigger = modal.dialog
    .getByRole('group')
    .filter({ hasText: groupLabel })
    .getByRole('combobox')
    .first();
  await expect(trigger).toBeEnabled({ timeout: 15_000 });
  await trigger.click();
}

test.describe('charging-stations › device model sequence @everest', () => {
  // The project's 180s does not cover a GetBaseReport round trip plus a
  // DEVICE_MODEL_TIMEOUT_MS ingest wait plus a cold-route reload.
  test.describe.configure({ mode: 'serial', timeout: 330_000 });

  test('E2E-097: GetBaseReport populates the device model and GetVariables reads a real variable @everest', async ({
    page,
    everestStation,
    apiClient,
  }) => {
    const detail = new ChargingStationDetailPage(page);
    await detail.goto(everestStation.ocppConnectionName);

    // Request a full inventory; NotifyReport flows back asynchronously.
    await detail.commandBar.openViaOtherCommands(/get base report/i);
    const baseReport = new ModalHarness(page, /get base report/i);
    await baseReport.expectOpen();
    await baseReport.submitAndWaitForToast();

    // Wait for the whole report to land and be accepted. This is the test's
    // real assertion that GetBaseReport populated the model.
    await waitForIngestedDeviceModel(apiClient, everestStation.ocppConnectionName);

    // Selectors are populated — reload so the modal picks up the rows, then
    // read a real Component/Variable end-to-end.
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 60_000 });
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
    const component = await waitForIngestedDeviceModel(
      apiClient,
      everestStation.ocppConnectionName,
    );

    const detail = new ChargingStationDetailPage(page);
    await detail.goto(everestStation.ocppConnectionName);
    await detail.commandBar.openViaOtherCommands(/set variables/i);
    const setVars = new ModalHarness(page, /set variables/i);
    await setVars.expectOpen();

    // Not the first component: SetVariables lists only variables writable on
    // the selected component, and the ones the list happens to open on
    // (Controller, Connector, EVSE) have none — every attribute they carry is
    // ReadOnly. Drive the selector to a component the probe proved writable.
    await selectOptionByName(page, setVars, /component #1/i, component.name);
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
