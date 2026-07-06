// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../fixtures';
import { OverviewPage } from '../../pages/overview.page';

test.use({ storageState: 'playwright/.auth/admin.json' });

test.setTimeout(90_000);

test.describe('overview › locale', () => {
  test('E2E-018: language switcher changes UI language and persists across reload', async ({
    page,
  }) => {
    const overview = new OverviewPage(page);
    await overview.goto();

    // Default locale is English: the Locations card heading is rendered in English.
    await expect(page.getByRole('heading', { name: /^locations$/i })).toBeVisible();

    // Switch to Brazilian Portuguese via the sidebar language switcher.
    await page.getByRole('button', { name: /^language$/i }).click();
    await page.getByRole('menuitemradio', { name: /portugu[êe]s \(brasil\)/i }).click();

    // The UI re-renders with pt-BR messages.
    const ptHeading = page.getByRole('heading', { name: /^locais$/i });
    await expect(ptHeading).toBeVisible({ timeout: 30_000 });

    // The selection is stored in the NEXT_LOCALE cookie and survives a reload.
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 60_000 });
    await expect(ptHeading).toBeVisible({ timeout: 60_000 });

    // Switch back to English from the localized UI (the switcher label is now "Idioma").
    await page.getByRole('button', { name: /^idioma$/i }).click();
    await page.getByRole('menuitemradio', { name: /^english$/i }).click();
    await expect(page.getByRole('heading', { name: /^locations$/i })).toBeVisible({
      timeout: 30_000,
    });
    // No reset needed: each test loads a fresh context from admin.json
    // storageState, so the locale cookie cannot leak into another test.
  });
});
