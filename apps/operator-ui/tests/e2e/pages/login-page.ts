// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { type Locator, type Page, expect } from '@playwright/test';

export class LoginPage {
  static readonly path = '/login';

  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorAlert: Locator;

  constructor(private readonly page: Page) {
    this.emailInput = page.getByRole('textbox', { name: /email/i });
    this.passwordInput = page.getByRole('textbox', { name: /password/i });
    this.submitButton = page.getByRole('button', { name: /sign in/i });
    this.errorAlert = page.getByRole('alert');
  }

  async goto(): Promise<void> {
    await this.page.goto(LoginPage.path, {
      waitUntil: 'domcontentloaded',
    });
    // The first visit to /login on a dev server pays the cold-compile cost
    // (20–40s). Production builds are pre-compiled, so this budget is unused
    // on `next start`. Keep it for the dev-mode path that most contributors
    // run locally.
    await expect(this.submitButton).toBeVisible({ timeout: 60_000 });
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
