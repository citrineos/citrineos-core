// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { type Locator, type Page, expect } from '@playwright/test';

// PartnerFormPage — the Partners upsert form has fields for OCPI
// registration: Country Code, Party ID, Versions URL, Client Token, OCPI
// Version. The create flow has a known src bug where success redirects to
// /authorizations/:id instead of /partners/:id; the spec asserts the
// actual UI behaviour and tags // KNOWN-DRIFT.

export interface PartnerFormPayload {
  readonly countryCode?: string;
  readonly partyId?: string;
  readonly versionsUrl?: string;
  readonly clientToken?: string;
}

export class PartnerFormPage {
  static readonly newPath = '/partners/new';
  static editPath(id: number | string): string {
    return `/partners/${id}/edit`;
  }

  readonly heading: Locator;
  readonly countryCodeInput: Locator;
  readonly partyIdInput: Locator;
  readonly versionsUrlInput: Locator;
  readonly clientTokenInput: Locator;
  readonly submitButton: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', {
      name: /(create|edit) partner/i,
    });
    this.countryCodeInput = this.fieldGroup('Country Code').getByRole('textbox').first();
    this.partyIdInput = this.fieldGroup('Party ID').getByRole('textbox').first();
    this.versionsUrlInput = this.fieldGroup('Versions URL').getByRole('textbox').first();
    this.clientTokenInput = this.fieldGroup('Client Token').getByRole('textbox').first();
    this.submitButton = page.getByRole('button', { name: /^(save|submit)/i });
  }

  fieldGroup(labelText: string): Locator {
    return this.page
      .getByRole('group')
      .filter({ has: this.page.getByText(labelText, { exact: true }) });
  }

  async gotoNew(): Promise<void> {
    await this.page.goto(PartnerFormPage.newPath, {
      waitUntil: 'domcontentloaded',
    });
    await this.expectLoaded();
  }

  async expectLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible({ timeout: 30_000 });
    await expect(this.countryCodeInput).toBeVisible({ timeout: 30_000 });
  }

  async fill(payload: PartnerFormPayload): Promise<void> {
    if (payload.countryCode !== undefined) {
      await this.countryCodeInput.fill(payload.countryCode);
    }
    if (payload.partyId !== undefined) {
      await this.partyIdInput.fill(payload.partyId);
    }
    if (payload.versionsUrl !== undefined) {
      await this.versionsUrlInput.fill(payload.versionsUrl);
    }
    if (payload.clientToken !== undefined) {
      await this.clientTokenInput.fill(payload.clientToken);
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
