// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { type Locator, type Page, expect } from '@playwright/test';

export class TransactionsListPage {
  static readonly path = '/transactions';

  readonly heading: Locator;
  readonly searchInput: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: /^transactions$/i }).first();
    this.searchInput = page.getByRole('textbox', {
      name: /search transactions/i,
    });
  }

  async goto(): Promise<void> {
    await this.page.goto(TransactionsListPage.path, {
      waitUntil: 'domcontentloaded',
    });
    await this.expectLoaded();
  }

  async expectLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible({ timeout: 30_000 });
  }

  rowByTransactionId(transactionId: string): Locator {
    return this.page.getByRole('row').filter({ hasText: transactionId });
  }

  rowByStationId(stationId: string): Locator {
    return this.page.getByRole('row').filter({ hasText: stationId });
  }
}
