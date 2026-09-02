// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../fixtures';
import { AuthorizationsListPage } from '../../pages/authorizations/list-page';
import { AuthorizationFormPage } from '../../pages/authorizations/form-page';
import { deleteAuthorization } from '../../fixtures/seeded-data';
import { shortId } from '../../utils/random';

test.use({ storageState: 'playwright/.auth/admin.json' });

test.describe('authorizations › CRUD', () => {
  test('E2E-100: Authorizations list renders', async ({ page }) => {
    const list = new AuthorizationsListPage(page);
    await list.goto();
    await expect(list.heading).toBeVisible();
    await expect(list.addButton).toBeVisible();
  });

  test('E2E-101: Create authorization via UI redirects + appears in list', async ({
    page,
    apiClient,
  }) => {
    const idToken = `${shortId().toUpperCase()}-RFID`;
    const form = new AuthorizationFormPage(page);
    await form.gotoNew();
    await form.fill({
      idToken,
      idTokenType: 'ISO14443',
      status: 'Accepted',
    });
    await form.submit();

    const list = new AuthorizationsListPage(page);
    await list.goto();
    // The list sorts idToken ascending with 10 rows per page — search first
    // so other rows can't paginate ours away.
    await list.searchInput.fill(idToken);
    await expect(list.rowByIdToken(idToken)).toBeVisible({ timeout: 30_000 });

    // Cleanup.
    const { Authorizations } = await apiClient.gql<{
      Authorizations: { id: number }[];
    }>(
      `query LookupAuth($idToken: citext!) {
         Authorizations(where: { idToken: { _eq: $idToken } }) { id }
       }`,
      { idToken },
    );
    if (Authorizations[0]) {
      await deleteAuthorization(apiClient, Authorizations[0].id).catch(() => undefined);
    }
  });

  test('E2E-102: Edit form pre-fills, persists a status change, and reloads with the new value', async ({
    page,
    seededAuthorization,
  }) => {
    const form = new AuthorizationFormPage(page);
    await form.gotoEdit(seededAuthorization.id);
    // Anchor on the ID Token input with the seeded value as the
    // deterministic load signal — edit headings vary by render path.
    await expect(form.idTokenInput).toHaveValue(seededAuthorization.idToken, {
      timeout: 30_000,
    });

    // Seeded status is Accepted; flip to Blocked and verify it persists.
    await form.selectStatus('Blocked');
    await form.submit();

    await form.gotoEdit(seededAuthorization.id);
    await expect(form.statusCombobox).toContainText(/blocked/i, {
      timeout: 30_000,
    });
  });

  test('E2E-103: Delete authorization via UI detail redirects to list and removes the row', async ({
    page,
    apiClient,
  }) => {
    // Inline-seed so the UI delete owns the lifecycle.
    const idToken = `${shortId().toUpperCase()}-DEL`;
    const now = new Date().toISOString();
    const { insert_Authorizations_one: created } = await apiClient.gql<{
      insert_Authorizations_one: { id: number };
    }>(
      `mutation SeedForUiDelete($obj: Authorizations_insert_input!) {
         insert_Authorizations_one(object: $obj) { id }
       }`,
      {
        obj: {
          idToken,
          idTokenType: 'ISO14443',
          status: 'Accepted',
          createdAt: now,
          updatedAt: now,
        },
      },
    );

    try {
      await page.goto(`/authorizations/${created.id}`);
      const deleteButton = page.getByRole('button', { name: /^delete/i });
      await expect(deleteButton).toBeVisible({ timeout: 30_000 });
      await deleteButton.click();

      await page.waitForURL(/\/authorizations$/, { timeout: 30_000 });
      const list = new AuthorizationsListPage(page);
      await expect(list.heading).toBeVisible();
      await expect(list.rowByIdToken(idToken)).toHaveCount(0);
    } finally {
      await deleteAuthorization(apiClient, created.id).catch(() => undefined);
    }
  });

  test('E2E-104: Create authorization with empty required fields stays on form', async ({
    page,
  }) => {
    const form = new AuthorizationFormPage(page);
    await form.gotoNew();
    await form.submitButton.click();
    await expect(page).toHaveURL(/\/authorizations\/new/);
    await expect(form.heading).toBeVisible();
  });
});
