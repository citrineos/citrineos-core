// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { type Locator, type Page, expect } from '@playwright/test';

export class TariffsListPage {
  static readonly path = '/tariffs';

  readonly heading: Locator;
  readonly addButton: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: /^tariffs$/i }).first();
    // Tariffs list uses translate('actions.create') + 'Tariff' → "Create Tariff".
    this.addButton = page.getByRole('button', {
      name: /(add|create) tariff/i,
    });
  }

  async goto(): Promise<void> {
    await this.page.goto(TariffsListPage.path, {
      waitUntil: 'domcontentloaded',
    });
    await this.expectLoaded();
  }

  async expectLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible({ timeout: 30_000 });
  }
}
