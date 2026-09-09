// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { Page } from '@playwright/test';

const FIRST_LOGIN_KEY_PREFIX = 'firstLoginHelp:';

export async function clearWelcomeFlag(page: Page): Promise<void> {
  await page.evaluate((prefix) => {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) keys.push(key);
    }
    for (const key of keys) localStorage.removeItem(key);
  }, FIRST_LOGIN_KEY_PREFIX);
}

// Removes the first-login flags BEFORE any app code runs on the next
// navigation. clearWelcomeFlag above runs after goto, which races the layout
// effect: the effect can re-write the flag (it writes on show) between the
// clear and the following reload, and then the modal never renders. Init
// scripts run ahead of the bundle, so this can't lose that race. One-shot via
// a sessionStorage marker so a later reload in the same context keeps the
// re-written flag — "dismissal persists across reload" stays testable.
export async function clearWelcomeFlagBeforeLoad(page: Page): Promise<void> {
  await page.addInitScript((prefix) => {
    if (sessionStorage.getItem('e2eWelcomeCleared')) return;
    sessionStorage.setItem('e2eWelcomeCleared', '1');
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) keys.push(key);
    }
    for (const key of keys) localStorage.removeItem(key);
  }, FIRST_LOGIN_KEY_PREFIX);
}

export async function setWelcomeFlag(page: Page, userId: string, value: boolean): Promise<void> {
  await page.evaluate(
    ([prefix, id, v]) => {
      localStorage.setItem(`${prefix}${id}`, String(v));
    },
    [FIRST_LOGIN_KEY_PREFIX, userId, value] as const,
  );
}

export async function clearAllStorage(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}
