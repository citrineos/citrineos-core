// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { type Locator, type Page, expect } from '@playwright/test';

// TransactionDetailPage — read-only detail card for a single transaction.
// The "Toggle Active Status" control is an icon Button (variant="ghost",
// size="icon") gated by CanAccess EDIT; it takes its accessible name from
// its `title` attribute ("Toggle Active Status") since the RefreshCw icon
// carries no text (see
// src/lib/client/pages/transactions/detail/transaction.detail.card.tsx).
// Clicking it dispatches openModal() for ModalComponentType
// .toggleTransactionActiveStatus, whose Radix Dialog heading is the same
// "Toggle Active Status" string.

export class TransactionDetailPage {
  static path(id: number | string): string {
    return `/transactions/${id}`;
  }
  static readonly urlGlob = '**/transactions/*';

  readonly heading: Locator;
  readonly toggleActiveStatusButton: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading').first();
    this.toggleActiveStatusButton = page.getByRole('button', {
      name: /toggle active status/i,
    });
  }

  async goto(id: number | string): Promise<void> {
    await this.page.goto(TransactionDetailPage.path(id), {
      waitUntil: 'domcontentloaded',
    });
    await this.expectLoaded();
  }

  async expectLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible({ timeout: 30_000 });
  }

  // Opens the ToggleTransactionActiveModal via its only trigger. Waits for the
  // control to be actionable before clicking so the click is never raced
  // against the detail card's hydration.
  async openToggleActiveModal(): Promise<void> {
    await expect(this.toggleActiveStatusButton).toBeVisible({ timeout: 30_000 });
    await this.toggleActiveStatusButton.click();
  }
}
