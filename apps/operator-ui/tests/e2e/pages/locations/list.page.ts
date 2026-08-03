// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { type Locator, type Page, expect } from '@playwright/test';

// LocationsListPage — the list page renders a heading "Locations", an
// "Add Location" button (gated by CanAccess CREATE), and a DebounceSearch
// wired to the Locations Hasura query. The Refine Table renders standard
// <table>/<row> roles so list traversal is via getByRole.
export class LocationsListPage {
  static readonly path = '/locations';
  static readonly urlGlob = '**/locations';

  readonly heading: Locator;
  readonly searchInput: Locator;
  readonly addButton: Locator;
  readonly noResultsMessage: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: /^locations$/i }).first();
    this.searchInput = page.getByRole('textbox', {
      name: /search locations/i,
    });
    this.addButton = page.getByRole('button', { name: /add location/i });
    this.noResultsMessage = page.getByText(/no results found/i);
  }

  async goto(): Promise<void> {
    await this.page.goto(LocationsListPage.path, {
      waitUntil: 'domcontentloaded',
    });
    await this.expectLoaded();
  }

  async expectLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible({ timeout: 30_000 });
  }

  rowByName(name: string): Locator {
    return this.page.getByRole('row').filter({ hasText: name });
  }

  rowById(id: number | string): Locator {
    return this.page.getByRole('row').filter({ hasText: String(id) });
  }

  async openDetailByName(name: string): Promise<void> {
    await this.rowByName(name).getByRole('link').first().click();
    await this.page.waitForURL(/\/locations\/\d+/, { timeout: 30_000 });
  }
}
