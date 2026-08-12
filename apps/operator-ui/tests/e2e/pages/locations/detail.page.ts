// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { type Locator, type Page, expect } from '@playwright/test';

// LocationDetailPage — read-only detail card with an edit button gated by
// CanAccess. There is no delete control on the locations detail surface
// (see src/lib/client/pages/locations/detail/location.detail.card.tsx).
// The map renders Leaflet markers via `.leaflet-marker-icon` — exposed for
// E2E-029/030 (map.spec.ts).

export class LocationDetailPage {
  static path(id: number | string): string {
    return `/locations/${id}`;
  }
  static readonly urlGlob = '**/locations/*';

  readonly heading: Locator;
  readonly editButton: Locator;
  readonly mapMarkers: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading').first();
    this.editButton = page.getByRole('button', { name: /^edit/i });
    this.mapMarkers = page.locator('.leaflet-marker-icon');
  }

  async goto(id: number | string): Promise<void> {
    await this.page.goto(LocationDetailPage.path(id), {
      waitUntil: 'domcontentloaded',
    });
    await this.expectLoaded();
  }

  async expectLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible({ timeout: 30_000 });
  }

  async clickEdit(): Promise<void> {
    await this.editButton.click();
    await this.page.waitForURL(/\/locations\/\d+\/edit/, { timeout: 30_000 });
  }
}
