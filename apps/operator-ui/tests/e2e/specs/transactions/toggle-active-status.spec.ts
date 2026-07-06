// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../fixtures';
import { TransactionDetailPage } from '../../pages/transactions/detail.page';
import { ModalHarness } from '../../pages/components/modal.po';

// ToggleTransactionActiveModal smoke coverage. Its ONLY trigger lives on the
// transactions detail page (an icon Button titled "Toggle Active Status" in
// src/lib/client/pages/transactions/detail/transaction.detail.card.tsx), so it
// is unreachable from the charging-station parametric harness — this spec is
// where that modal is exercised. Mirrors the open/assert-title/close-and-unmount
// smoke style of charging-stations/commands.parametric.spec.ts.
//
// Determinism: every interaction is anchored on awaited visibility — the trigger
// is awaited before the click, the dialog heading is asserted via ModalHarness,
// and closure is verified by the heading hiding. No fixed sleeps. No mutation is
// submitted: the destructive confirm path would flip isActive and the modal
// closes only on the server's onSuccess, which is not deterministically
// assertable here, so a smoke open/close is intentionally preferred for
// stability.
//
// The seededTransaction fixture seeds an ACTIVE transaction (isActive defaults
// to true). The toggle's trigger is gated by CanAccess EDIT (covered by the
// admin storage state), not by the active flag, so an active seed both renders
// the control and matches the modal's real operating context.

test.use({ storageState: 'playwright/.auth/admin.json' });

// "Toggle Active Status" — both the icon button's accessible name (its `title`)
// and the Radix DialogTitle heading (Transactions.toggleActiveStatus), so the
// assertion anchors on the modal's own heading, never a generic dialog match.
const TOGGLE_ACTIVE_TITLE = /toggle active status/i;

test.describe('transactions › toggle active status', () => {
  test('E2E-105: ToggleTransactionActiveModal opens from the detail page and closes cleanly', async ({
    page,
    seededTransaction,
  }) => {
    const detail = new TransactionDetailPage(page);
    await detail.goto(seededTransaction.id);

    const modal = new ModalHarness(page, TOGGLE_ACTIVE_TITLE);

    // Open via the trigger and assert THIS modal's heading is shown — proving
    // the toggle dialog (not some other dialog) mounted.
    await detail.openToggleActiveModal();
    await modal.expectOpen();

    // Close via Cancel and confirm the dialog unmounts.
    await modal.cancel();
    await modal.expectClosed();

    // Re-open and close via Escape to assert the keyboard dismissal path also
    // unmounts cleanly.
    await detail.openToggleActiveModal();
    await modal.expectOpen();
    await page.keyboard.press('Escape');
    await modal.expectClosed();
    await expect(modal.title).toBeHidden({ timeout: 10_000 });
  });
});
