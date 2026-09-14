// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { type Locator, type Page, expect } from '@playwright/test';

export class ChargingStationsListPage {
  static readonly path = '/charging-stations';
  static readonly urlGlob = '**/charging-stations';

  readonly heading: Locator;
  readonly searchInput: Locator;
  readonly addStationButton: Locator;
  readonly noResultsMessage: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: /charging stations/i }).first();
    this.searchInput = page.getByRole('textbox', {
      name: /search charging stations/i,
    });
    this.addStationButton = page.getByRole('button', {
      name: /add charging station/i,
    });
    this.noResultsMessage = page.getByText(/no results found/i);
  }

  async goto(): Promise<void> {
    await this.page.goto(ChargingStationsListPage.path, {
      waitUntil: 'domcontentloaded',
    });
    await this.expectLoaded();
  }

  async expectLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible({ timeout: 30_000 });
  }

  rowById(stationId: string): Locator {
    // Station IDs render as link/text inside the table; match the row that
    // contains the id literally. The Refine table uses <table> semantics so
    // role-based row matching is robust.
    return this.page.getByRole('row').filter({ hasText: stationId });
  }

  async openDetailById(stationId: string): Promise<void> {
    await this.rowById(stationId).getByRole('link').first().click();
    await this.page.waitForURL(/\/charging-stations\//, { timeout: 30_000 });
  }
}
