// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// The poll loop under a vanished control API and under a 500 from one of its
// endpoints: the page degrades, never throws, and recovers once traffic flows.
import { expect, test } from '@playwright/test';
import { playCitrine, resetKeepingScenario } from './support/arrange.js';
import { MockPage } from './support/mock-page.js';

const MOCK_API = '**/_mock/**';

test.describe('dashboard resilience', () => {
  let mock: MockPage;

  test.beforeEach(async ({ page, request }) => {
    await resetKeepingScenario(request);
    await playCitrine(request);
    mock = new MockPage(page);
    await mock.open();
    await expect(mock.rows).toHaveCount(3);
  });

  test.afterEach(() => {
    expect(mock?.pageErrors ?? []).toEqual([]);
  });

  test('shows server down while the control api is unreachable and recovers', async ({ page }) => {
    let aborted = 0;
    await page.route(MOCK_API, (route) => {
      aborted++;
      return route.abort();
    });
    await expect(mock.regBadge).toHaveText('server down');
    await expect(mock.regBadge).toHaveClass(/down/);
    // each poll fires five requests; sit through a few cycles rather than a fixed sleep
    await expect.poll(() => aborted, { timeout: 15_000 }).toBeGreaterThanOrEqual(15);

    await page.unroute(MOCK_API);
    await expect(mock.regBadge).toHaveText('registered');
    await expect(mock.regBadge).toHaveClass(/reg-registered/);
    await expect(mock.rows).toHaveCount(3);
    await expect(mock.cExch).toHaveText('3');
  });

  test('a 500 from /_mock/exchanges blanks the table but keeps the page alive', async ({
    page,
  }) => {
    const exchanges = '**/_mock/exchanges**';
    await page.route(exchanges, (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"boom"}' }),
    );
    // the failed fetch is swallowed as an empty list, so the trace empties
    await expect(mock.rows).toHaveCount(0);
    await expect(mock.emptyMsg).toBeVisible();
    // the other endpoints still answer, so the header keeps its real data
    await expect(mock.regBadge).toHaveText('registered');
    await expect(mock.cExch).toHaveText('3');

    await page.unroute(exchanges);
    await expect(mock.rows).toHaveCount(3);
    await expect(mock.emptyMsg).toBeHidden();
  });
});
