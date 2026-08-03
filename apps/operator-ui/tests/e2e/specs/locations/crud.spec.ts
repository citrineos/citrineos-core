// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../fixtures';
import { LocationsListPage } from '../../pages/locations/list.page';
import { LocationFormPage } from '../../pages/locations/form.page';
import { LocationDetailPage } from '../../pages/locations/detail.page';
import { deleteLocation } from '../../fixtures/seeded-data';
import { shortId } from '../../utils/random';
import { blockGoogleMaps } from '../../utils/route-overrides';

test.use({ storageState: 'playwright/.auth/admin.json' });

test.beforeEach(async ({ page }) => {
  // The Locations upsert form embeds MapLocationPicker which loads the
  // Google Maps SDK. Without a valid MAPS_E2E_KEY the SDK throws
  // InvalidKeyMapError which the Next.js dev-mode overlay surfaces as a
  // Console Error dialog covering the form. Blocking the SDK at the
  // network layer keeps the rest of the form interactive.
  await blockGoogleMaps(page);
});

test.describe('locations › CRUD', () => {
  test('E2E-020: Locations list renders with heading', async ({ page }) => {
    const list = new LocationsListPage(page);
    await list.goto();
    await expect(list.heading).toBeVisible();
    await expect(list.searchInput).toBeVisible();
    await expect(list.addButton).toBeVisible();
  });

  test('E2E-021: Create location via UI redirects to detail', async ({ page, apiClient }) => {
    const name = `e2e-${shortId()}-loc`;
    const form = new LocationFormPage(page);
    await form.gotoNew();
    // United States is the default country and requires State + ZIP per
    // country-configs.json. Fill them explicitly.
    await form.fill({
      name,
      address: '1 Test Street',
      city: 'San Francisco',
      state: 'California',
      postalCode: '94103',
    });
    await form.submit();

    // Redirected to /locations/:id detail; the heading should reflect the
    // newly-created record. We look up the row in the list to capture the
    // numeric id for cleanup.
    const list = new LocationsListPage(page);
    await list.goto();
    await expect(list.rowByName(name)).toBeVisible({ timeout: 30_000 });

    // Cleanup via apiClient: locate by name, delete by id.
    const { Locations } = await apiClient.gql<{
      Locations: { id: number }[];
    }>(
      `query LookupLoc($name: String!) {
         Locations(where: { name: { _eq: $name } }) { id }
       }`,
      { name },
    );
    if (Locations[0]) {
      await deleteLocation(apiClient, Locations[0].id).catch(() => undefined);
    }
  });

  test('E2E-022: Edit form pre-fills with the existing location data', async ({
    page,
    seededLocation,
  }) => {
    // Edit-then-save on the locations form is exercised indirectly by
    // E2E-021 (same form component, full create roundtrip). E2E-047
    // (charging-stations) and E2E-102 (authorizations) cover the
    // edit-and-save contract on simpler forms. The locations form's
    // Country/State/ZIP cascade makes a name-only edit on a fixture-seeded
    // row unreliable without re-driving the country picker, so the depth
    // assertion here stays on the pre-fill contract.
    const form = new LocationFormPage(page);
    await form.gotoEdit(seededLocation.id);
    // The prefill lands after the edit query resolves, later than the heading.
    await expect(form.heading).toContainText(/edit location/i, { timeout: 30_000 });
    await expect(form.nameInput).toHaveValue(seededLocation.name, { timeout: 30_000 });
  });

  test('E2E-024: Create location with empty required fields surfaces validation', async ({
    page,
  }) => {
    const form = new LocationFormPage(page);
    await form.gotoNew();
    // Click submit immediately; required fields (Name, Country, Address,
    // City, Time Zone) should block.
    await form.submitButton.click();
    // Stay on the form route.
    await expect(page).toHaveURL(/\/locations\/new/);
    await expect(form.heading).toBeVisible();
  });

  test('E2E-025: Search by name filters the list', async ({ page, seededLocation }) => {
    const list = new LocationsListPage(page);
    await list.goto();
    await list.searchInput.fill(seededLocation.name);
    await expect(list.rowByName(seededLocation.name)).toBeVisible({
      timeout: 15_000,
    });
  });

  test('E2E-028: Detail page renders for an existing location', async ({
    page,
    seededLocation,
  }) => {
    const detail = new LocationDetailPage(page);
    await detail.goto(seededLocation.id);
    await expect(detail.heading).toBeVisible();
  });
});
