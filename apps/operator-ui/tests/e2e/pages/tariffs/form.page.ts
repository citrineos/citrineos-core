// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { type Locator, type Page, expect } from '@playwright/test';

export interface TariffFormPayload {
  readonly currency?: string;
  readonly pricePerKwh?: number;
  readonly pricePerMin?: number;
  readonly pricePerSession?: number;
  readonly taxRate?: number;
}

export class TariffFormPage {
  static readonly newPath = '/tariffs/new';
  static editPath(id: number | string): string {
    return `/tariffs/${id}/edit`;
  }

  readonly heading: Locator;
  readonly currencyInput: Locator;
  readonly pricePerKwhInput: Locator;
  readonly pricePerMinInput: Locator;
  readonly pricePerSessionInput: Locator;
  readonly taxRateInput: Locator;
  readonly submitButton: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', {
      name: /(create|edit) tariff/i,
    });
    // Form labels: "Currency (3-letter code)", "Price per kWh",
    // "Price per min", "Price per session", "Tax Rate (%)".
    this.currencyInput = this.fieldGroup('Currency (3-letter code)').getByRole('textbox').first();
    this.pricePerKwhInput = this.fieldGroup('Price per kWh').getByRole('spinbutton').first();
    this.pricePerMinInput = this.fieldGroup('Price per min').getByRole('spinbutton').first();
    this.pricePerSessionInput = this.fieldGroup('Price per session')
      .getByRole('spinbutton')
      .first();
    this.taxRateInput = this.fieldGroup('Tax Rate (%)').getByRole('spinbutton').first();
    this.submitButton = page.getByRole('button', { name: /^(save|submit)/i });
  }

  fieldGroup(labelText: string): Locator {
    return this.page
      .getByRole('group')
      .filter({ has: this.page.getByText(labelText, { exact: true }) });
  }

  async gotoNew(): Promise<void> {
    await this.page.goto(TariffFormPage.newPath, {
      waitUntil: 'domcontentloaded',
    });
    await this.expectLoaded();
  }

  async gotoEdit(id: number | string): Promise<void> {
    await this.page.goto(TariffFormPage.editPath(id), {
      waitUntil: 'domcontentloaded',
    });
    await this.expectLoaded();
  }

  async expectLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible({ timeout: 30_000 });
    await expect(this.currencyInput).toBeVisible({ timeout: 30_000 });
  }

  async fill(payload: TariffFormPayload): Promise<void> {
    if (payload.currency !== undefined) {
      await this.currencyInput.fill(payload.currency);
    }
    if (payload.pricePerKwh !== undefined) {
      await this.pricePerKwhInput.fill(String(payload.pricePerKwh));
    }
    if (payload.pricePerMin !== undefined) {
      await this.pricePerMinInput.fill(String(payload.pricePerMin));
    }
    if (payload.pricePerSession !== undefined) {
      await this.pricePerSessionInput.fill(String(payload.pricePerSession));
    }
    if (payload.taxRate !== undefined) {
      await this.taxRateInput.fill(String(payload.taxRate));
    }
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
    await this.page
      .getByRole('region', { name: /notifications/i })
      .getByText(/(success|created|updated|saved)/i)
      .first()
      .waitFor({ state: 'visible', timeout: 30_000 });
  }
}
