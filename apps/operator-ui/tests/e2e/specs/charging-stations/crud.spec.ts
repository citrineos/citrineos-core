// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../fixtures';
import { ChargingStationsListPage } from '../../pages/charging-stations/list.page';
import { ChargingStationFormPage } from '../../pages/charging-stations/form.page';
import { deleteStation } from '../../fixtures/seeded-data';
import { shortId } from '../../utils/random';

test.use({ storageState: 'playwright/.auth/admin.json' });

test.describe('charging-stations › CRUD', () => {
  test('E2E-046: Create charging station via UI redirects + appears in list', async ({
    page,
    seededLocation,
    apiClient,
  }) => {
    const name = `e2e-${shortId()}-cp`;
    const form = new ChargingStationFormPage(page);
    await form.gotoNew();
    await form.fill({
      name,
      locationName: seededLocation.name,
    });
    await form.submit();

    const list = new ChargingStationsListPage(page);
    await list.goto();
    await expect(list.rowById(name)).toBeVisible({ timeout: 30_000 });

    // Cleanup via apiClient (no UI delete on charging-stations list).
    const { ChargingStations } = await apiClient.gql<{
      ChargingStations: { id: number }[];
    }>(
      `query LookupCS($name: String!) {
         ChargingStations(where: { ocppConnectionName: { _eq: $name } }) { id }
       }`,
      { name },
    );
    if (ChargingStations[0]) {
      await deleteStation(apiClient, ChargingStations[0].id).catch(() => undefined);
    }
  });

  test('E2E-047: Edit form pre-fills, persists a floor-level change, and reloads with the new value', async ({
    page,
    seededStation,
  }) => {
    const form = new ChargingStationFormPage(page);
    await form.gotoEdit(seededStation.id);
    // The prefill lands after the edit query resolves, later than the heading.
    await expect(form.heading).toContainText(/edit charging\s*station/i, { timeout: 30_000 });
    await expect(form.nameInput).toHaveValue(seededStation.ocppConnectionName, {
      timeout: 30_000,
    });

    // floorLevel is optional and the seed leaves it empty; the Name column is
    // immutable on edit, so floorLevel is the safe mutable target.
    const newFloor = 'e2e-floor-3';
    await form.floorLevelInput.fill(newFloor);
    await form.submit();

    await form.gotoEdit(seededStation.id);
    await expect(form.floorLevelInput).toHaveValue(newFloor, {
      timeout: 30_000,
    });
  });

  test('E2E-048: Delete charging station via UI redirects to list and removes the row', async ({
    page,
    seededLocation,
    apiClient,
  }) => {
    // Inline-seed so the UI delete owns the lifecycle (no fixture-teardown
    // race against the form-driven mutation).
    const name = `e2e-${shortId()}-cp`;
    const { insert_ChargingStations_one: created } = await apiClient.gql<{
      insert_ChargingStations_one: { id: number };
    }>(
      `mutation SeedForUiDelete($obj: ChargingStations_insert_input!) {
         insert_ChargingStations_one(object: $obj) { id }
       }`,
      {
        obj: {
          ocppConnectionName: name,
          locationId: seededLocation.id,
          isOnline: false,
          protocol: 'ocpp2.0.1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
    );

    try {
      await page.goto(`/charging-stations/${created.id}`);
      const deleteButton = page.getByRole('button', { name: /^delete/i });
      await expect(deleteButton).toBeEnabled({ timeout: 30_000 });
      await deleteButton.click();

      await page.waitForURL(/\/charging-stations$/, { timeout: 30_000 });
      const list = new ChargingStationsListPage(page);
      await expect(list.heading).toBeVisible();
      await expect(list.rowById(name)).toHaveCount(0);
    } finally {
      // Safety net if the UI delete didn't fire.
      await deleteStation(apiClient, created.id).catch(() => undefined);
    }
  });
});
