// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// The control-secret box: it persists to localStorage and is sent on every
// /_mock call; with MOCK_MSP_CONTROL_SECRET set, a wrong value turns the header
// into "server down" and the right one recovers it.
import { expect, test } from '@playwright/test';
import { resetKeepingScenario } from './support/arrange.js';
import { MockPage, SECRET_KEY } from './support/mock-page.js';

const SECRET = process.env.MOCK_MSP_CONTROL_SECRET;

test.describe('dashboard control secret', () => {
  let mock: MockPage;

  test.beforeEach(async ({ page, request }) => {
    await resetKeepingScenario(request);
    mock = new MockPage(page);
  });

  test.afterEach(() => {
    expect(mock?.pageErrors ?? []).toEqual([]);
  });

  test('typing a secret stores it, sends it, and survives a reload', async ({ page }) => {
    const value = SECRET ?? 'typed-in-the-box';
    // plain navigation: nothing pre-seeded in localStorage
    await page.goto('/');
    await expect(mock.secret).toHaveValue('');

    const withHeader = page.waitForRequest(
      (r) => r.url().includes('/_mock/health') && r.headers()['x-mock-control-secret'] === value,
    );
    await mock.secret.fill(value);
    await mock.secret.blur();
    await withHeader;
    expect(await page.evaluate((k) => localStorage.getItem(k), SECRET_KEY)).toBe(value);

    await page.reload();
    await expect(mock.secret).toHaveValue(value);
    await expect(mock.identity).toHaveText('US/TST · EMSP');
  });

  test('a wrong secret takes the header down and the right one brings it back', async ({
    page,
    request,
  }) => {
    test.skip(!SECRET, 'needs MOCK_MSP_CONTROL_SECRET on the mock');
    expect((await request.get('/_mock/health')).status()).toBe(401);

    await mock.open();
    await expect(mock.regBadge).toHaveText('registered');

    await mock.secret.fill('not-the-secret');
    await mock.secret.blur();
    await expect(mock.regBadge).toHaveText('server down');
    await expect(mock.regBadge).toHaveClass(/down/);

    await mock.secret.fill(SECRET!);
    await mock.secret.blur();
    await expect(mock.regBadge).toHaveText('registered');
    await expect(mock.regBadge).toHaveClass(/reg-registered/);
    expect(await page.evaluate((k) => localStorage.getItem(k), SECRET_KEY)).toBe(SECRET);
  });
});
