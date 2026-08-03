// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { type Locator, type Page, expect } from '@playwright/test';

export class AuthorizationsListPage {
  static readonly path = '/authorizations';

  readonly heading: Locator;
  readonly searchInput: Locator;
  readonly addButton: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: /^authorizations$/i }).first();
    this.searchInput = page.getByRole('textbox', {
      name: /search authorizations/i,
    });
    this.addButton = page.getByRole('button', { name: /add authorization/i });
  }

  async goto(): Promise<void> {
    await this.page.goto(AuthorizationsListPage.path, {
      waitUntil: 'domcontentloaded',
    });
    await this.expectLoaded();
  }

  async expectLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible({ timeout: 30_000 });
  }

  rowByIdToken(idToken: string): Locator {
    return this.page.getByRole('row').filter({ hasText: idToken });
  }
}
