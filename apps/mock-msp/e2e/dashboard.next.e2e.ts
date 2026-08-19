// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// The redesign preview at /_mock/ui2 loads and polls without throwing. Skipped
// once the route is gone (dashboard.next.html removed at cutover).
import { expect, test } from '@playwright/test';
import { resetKeepingScenario } from './support/arrange.js';
import { MockPage } from './support/mock-page.js';

test.describe('dashboard redesign preview', () => {
  let mock: MockPage;

  test.beforeEach(async ({ page, request }) => {
    await resetKeepingScenario(request);
    mock = new MockPage(page);
  });

  test.afterEach(() => {
    expect(mock.pageErrors).toEqual([]);
  });

  test('GET /_mock/ui2 renders and survives a few polls', async ({ page, request }) => {
    const res = await request.get('/_mock/ui2');
    test.skip(res.status() === 404, '/_mock/ui2 is gone (post-cutover)');
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('text/html');

    // the preview polls /_mock/status every 2s; two answered polls cover ~3s
    const polls = page
      .waitForResponse((r) => r.url().includes('/_mock/status'))
      .then(() => page.waitForResponse((r) => r.url().includes('/_mock/status')));
    await mock.open('/_mock/ui2');
    await expect(page).toHaveTitle(/mock-msp/);
    await expect(mock.identity).toHaveText('US/TST · EMSP');
    await polls;
  });
});
