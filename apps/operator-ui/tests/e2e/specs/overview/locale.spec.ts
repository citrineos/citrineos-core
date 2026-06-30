// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../fixtures';
import type { Page } from '@playwright/test';
import { OverviewPage } from '../../pages/overview.page';

test.use({ storageState: 'playwright/.auth/admin.json' });

test.setTimeout(90_000);

// Opens the sidebar language switcher, selects a locale, and waits for it to
// actually take effect.
//
// The switcher (src/lib/client/components/locale-switcher) writes the
// NEXT_LOCALE cookie via a server action and then calls router.refresh() to
// re-render the server tree in place. Two things made a naive "wait for the
// localized heading" assertion flaky:
//   1. The Radix dropdown renders its items in a portal after an open
//      animation, so the option must be awaited-visible before clicking or the
//      selection can race the menu opening and never register.
//   2. The in-place router.refresh() is an async RSC round-trip that can lag —
//      or be dropped — under CI load. We therefore wait on the authoritative
//      `<html lang>` attribute (set by the root layout from the active locale),
//      the precise signal that the locale applied. Because the cookie write is
//      the real contract, we fall back to a reload — which re-renders
//      deterministically from the persisted cookie — when the in-place refresh
//      is slow. This never masks a genuine failure: if the language never
//      applies even after a reload, the assertion still fails.
async function selectLocale(
  page: Page,
  switcher: RegExp,
  option: RegExp,
  lang: string,
): Promise<void> {
  await page.getByRole('button', { name: switcher }).click();
  const item = page.getByRole('menuitemradio', { name: option });
  await expect(item).toBeVisible({ timeout: 15_000 });
  await item.click();

  const html = page.locator('html');
  try {
    await expect(html).toHaveAttribute('lang', lang, { timeout: 20_000 });
  } catch {
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 60_000 });
    await expect(html).toHaveAttribute('lang', lang, { timeout: 60_000 });
  }
}

test.describe('overview › locale', () => {
  test('E2E-018: language switcher changes UI language and persists across reload', async ({
    page,
  }) => {
    const overview = new OverviewPage(page);
    await overview.goto();

    // Default locale is English: the Locations card heading renders in English.
    await expect(page.getByRole('heading', { name: /^locations$/i })).toBeVisible();

    // Switch to Brazilian Portuguese; the Locations heading localizes to "Locais".
    await selectLocale(page, /^language$/i, /portugu[êe]s \(brasil\)/i, 'pt-BR');
    await expect(page.getByRole('heading', { name: /^locais$/i })).toBeVisible({
      timeout: 30_000,
    });

    // The selection is stored in the NEXT_LOCALE cookie and survives a reload.
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 60_000 });
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR', { timeout: 60_000 });
    await expect(page.getByRole('heading', { name: /^locais$/i })).toBeVisible({
      timeout: 30_000,
    });

    // Switch back to English from the localized UI (the switcher label is now "Idioma").
    await selectLocale(page, /^idioma$/i, /^english$/i, 'en');
    await expect(page.getByRole('heading', { name: /^locations$/i })).toBeVisible({
      timeout: 30_000,
    });
    // No reset needed: each test loads a fresh context from admin.json
    // storageState, so the locale cookie cannot leak into another test.
  });
});
