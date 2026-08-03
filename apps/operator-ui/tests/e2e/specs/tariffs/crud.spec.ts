// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../fixtures';
import { TariffsListPage } from '../../pages/tariffs/list.page';
import { TariffFormPage } from '../../pages/tariffs/form.page';

test.use({ storageState: 'playwright/.auth/admin.json' });

test.describe('tariffs › CRUD', () => {
  test('E2E-110: Tariffs list renders', async ({ page }) => {
    const list = new TariffsListPage(page);
    await list.goto();
    await expect(list.heading).toBeVisible();
    await expect(list.addButton).toBeVisible();
  });

  test('E2E-111: Create tariff via UI surfaces success toast', async ({ page, apiClient }) => {
    // XTS is the ISO currency code reserved for testing, and the price is
    // unique per attempt — the old fixed USD@0.35 collided with rows a failed
    // attempt (or another run) left behind, and its cleanup deleted every
    // matching tariff in the DB, not just ours.
    const distinctivePrice = Number(`0.${Date.now().toString().slice(-6)}`);
    const form = new TariffFormPage(page);
    await form.gotoNew();
    await form.fill({
      currency: 'XTS',
      pricePerKwh: distinctivePrice,
    });
    await form.submit();

    // Cleanup: the price is unique, so this can only match our own row.
    await apiClient
      .gql(
        `mutation Cleanup($price: numeric!) {
           delete_Tariffs(where: { currency: { _eq: "XTS" }, pricePerKwh: { _eq: $price } }) {
             affected_rows
           }
         }`,
        { price: distinctivePrice },
      )
      .catch(() => undefined);
  });

  test('E2E-113: Delete tariff via UI detail redirects to list and removes the row', async ({
    page,
    apiClient,
  }) => {
    const distinctivePrice = Number(`0.${Date.now().toString().slice(-6)}`);
    const now = new Date().toISOString();
    const { insert_Tariffs_one: created } = await apiClient.gql<{
      insert_Tariffs_one: { id: number };
    }>(
      `mutation SeedForUiDelete($obj: Tariffs_insert_input!) {
         insert_Tariffs_one(object: $obj) { id }
       }`,
      {
        obj: {
          currency: 'XTS',
          pricePerKwh: distinctivePrice,
          createdAt: now,
          updatedAt: now,
        },
      },
    );

    try {
      await page.goto(`/tariffs/${created.id}`);
      const deleteButton = page.getByRole('button', { name: /^delete/i });
      await expect(deleteButton).toBeVisible({ timeout: 30_000 });
      await deleteButton.click();

      await page.waitForURL(/\/tariffs$/, { timeout: 30_000 });
      const list = new TariffsListPage(page);
      await expect(list.heading).toBeVisible();
      await expect(page.getByRole('row').filter({ hasText: String(created.id) })).toHaveCount(0);
    } finally {
      await apiClient
        .gql(
          `mutation Cleanup($id: Int!) {
             delete_Tariffs_by_pk(id: $id) { id }
           }`,
          { id: created.id },
        )
        .catch(() => undefined);
    }
  });
});
