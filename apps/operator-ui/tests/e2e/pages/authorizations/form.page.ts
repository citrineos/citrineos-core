// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { type Locator, type Page, expect } from '@playwright/test';

// AuthorizationFormPage — fields: ID Token, ID Token Type, Status, Cache
// Expiry DateTime, plus a dynamic Additional Info field-array. submit()
// awaits a success toast.

export interface AuthorizationFormPayload {
  readonly idToken?: string;
  readonly idTokenType?: string;
  readonly status?: string;
}

export class AuthorizationFormPage {
  static readonly newPath = '/authorizations/new';
  static editPath(id: number | string): string {
    return `/authorizations/${id}/edit`;
  }

  readonly heading: Locator;
  readonly idTokenInput: Locator;
  readonly idTokenTypeCombobox: Locator;
  readonly statusCombobox: Locator;
  readonly submitButton: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', {
      name: /(create|edit) authorization/i,
    });
    this.idTokenInput = this.fieldGroup('ID Token').getByRole('textbox').first();
    this.idTokenTypeCombobox = this.fieldGroup('ID Token Type').getByRole('combobox').first();
    this.statusCombobox = this.fieldGroup('Status').getByRole('combobox').first();
    this.submitButton = page.getByRole('button', { name: /^(save|submit)/i });
  }

  fieldGroup(labelText: string): Locator {
    return this.page
      .getByRole('group')
      .filter({ has: this.page.getByText(labelText, { exact: true }) });
  }

  async gotoNew(): Promise<void> {
    await this.page.goto(AuthorizationFormPage.newPath, {
      waitUntil: 'domcontentloaded',
    });
    await this.expectLoaded();
  }

  async gotoEdit(id: number | string): Promise<void> {
    await this.page.goto(AuthorizationFormPage.editPath(id), {
      waitUntil: 'domcontentloaded',
    });
    await this.expectLoaded();
  }

  async expectLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible({ timeout: 30_000 });
    await expect(this.idTokenInput).toBeVisible({ timeout: 30_000 });
  }

  async fill(payload: AuthorizationFormPayload): Promise<void> {
    if (payload.idToken !== undefined) {
      await this.idTokenInput.fill(payload.idToken);
    }
    if (payload.idTokenType !== undefined) {
      await this.selectIdTokenType(payload.idTokenType);
    }
    if (payload.status !== undefined) {
      await this.selectStatus(payload.status);
    }
  }

  async selectIdTokenType(value: string): Promise<void> {
    await this.idTokenTypeCombobox.click();
    await this.page
      .getByRole('option', { name: new RegExp(`^${value}$`, 'i') })
      .first()
      .click();
  }

  async selectStatus(value: string): Promise<void> {
    await this.statusCombobox.click();
    await this.page
      .getByRole('option', { name: new RegExp(`^${value}$`, 'i') })
      .first()
      .click();
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
