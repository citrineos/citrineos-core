// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { type Locator, type Page, expect } from '@playwright/test';

// ModalHarness — generic Radix Dialog wrapper used by both bespoke OCPP
// command specs and the parametric harness. Every form field is reached
// via getByLabel or getByRole; never by nth-child / placeholder fallbacks.
// Command submission waits for a server-side toast as the async-completion
// signal before asserting modal closure.

export interface FillFormFields {
  readonly [labelPattern: string]: string;
}

export class ModalHarness {
  readonly dialog: Locator;
  readonly title: Locator;
  readonly closeButton: Locator;
  readonly cancelButton: Locator;
  readonly submitButton: Locator;

  constructor(
    private readonly page: Page,
    titlePattern: RegExp | string,
  ) {
    this.dialog = page.getByRole('dialog');
    this.title = this.dialog.getByRole('heading').filter({
      hasText: titlePattern instanceof RegExp ? titlePattern : new RegExp(titlePattern, 'i'),
    });
    this.closeButton = this.dialog.getByRole('button', { name: /^close$/i });
    this.cancelButton = this.dialog.getByRole('button', { name: /^cancel$/i });
    this.submitButton = this.dialog.getByRole('button', {
      name: /^(submit|send|save|confirm|start|stop|reset|trigger|update|set|get|unlock|delete|install|sign|clear)/i,
    });
  }

  async expectOpen(): Promise<void> {
    await expect(this.dialog).toBeVisible({ timeout: 15_000 });
    await expect(this.title).toBeVisible({ timeout: 15_000 });
  }

  async expectClosed(): Promise<void> {
    await expect(this.dialog).toBeHidden({ timeout: 15_000 });
  }

  async fill(label: RegExp | string, value: string): Promise<void> {
    const target = this.dialog.getByLabel(label instanceof RegExp ? label : new RegExp(label, 'i'));
    await target.fill(value);
  }

  async select(label: RegExp | string, optionName: RegExp | string): Promise<void> {
    const labelPattern = label instanceof RegExp ? label : new RegExp(label, 'i');
    // shadcn FormField wraps each control in a [role="group"] containing
    // both the visible label text and the combobox. The combobox itself
    // takes its accessible name from the current value, not the label, so
    // we anchor on the group's label text and pick its first combobox.
    const trigger = this.dialog
      .getByRole('group')
      .filter({ hasText: labelPattern })
      .getByRole('combobox')
      .first();
    await trigger.click();
    await this.page
      .getByRole('option', {
        name: optionName instanceof RegExp ? optionName : new RegExp(optionName, 'i'),
      })
      .click();
  }

  async cancel(): Promise<void> {
    if (await this.cancelButton.isVisible().catch(() => false)) {
      await this.cancelButton.click();
    } else {
      await this.closeButton.click();
    }
    await this.expectClosed();
  }

  // Submits the modal's form and waits for the Sonner toast region to surface
  // a message. This is the async-ack signal for OCPP commands; the
  // modal-close-race never fires because we wait for the server's
  // confirmation first.
  async submitAndWaitForToast(
    toastPattern: RegExp = /success|accepted|sent|started|stopped|reset|completed|received/i,
    timeout = 30_000,
  ): Promise<void> {
    await this.submitButton.click();
    const toastRegion = this.page.getByRole('region', {
      name: /notifications/i,
    });
    await expect(toastRegion).toContainText(toastPattern, { timeout });
  }

  async submitExpectingError(
    errorPattern: RegExp = /failed|error|invalid|denied/i,
    timeout = 30_000,
  ): Promise<void> {
    await this.submitButton.click();
    const toastRegion = this.page.getByRole('region', {
      name: /notifications/i,
    });
    // The destructive toast is the contract; whether the modal stays open or
    // auto-closes depends on the per-modal handler. Both are acceptable
    // observable behaviours per the OCPP command pipeline.
    await expect(toastRegion).toContainText(errorPattern, { timeout });
  }

  validationError(fieldLabel: RegExp | string): Locator {
    return this.dialog
      .locator('[role="alert"], [aria-live="polite"], [data-slot="form-message"]')
      .filter({
        hasText: fieldLabel instanceof RegExp ? fieldLabel : new RegExp(fieldLabel, 'i'),
      });
  }
}
