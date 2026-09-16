// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// The dashboard loads, the header/cards/coverage grid render from a fresh
// recorder, the poll loop honours the live toggle, and the command payload
// textarea follows the selected command type.
import { expect, test } from '@playwright/test';
import { resetKeepingScenario } from './support/arrange.js';
import { MockPage } from './support/mock-page.js';

const COVERAGE_MODULES = [
  'locations',
  'tariffs',
  'sessions',
  'cdrs',
  'tokens',
  'commands',
  'credentials',
  'versions',
  'chargingprofiles',
];

test.describe('dashboard smoke', () => {
  let mock: MockPage;

  test.beforeEach(async ({ page, request }) => {
    await resetKeepingScenario(request);
    mock = new MockPage(page);
  });

  test.afterEach(() => {
    expect(mock?.pageErrors ?? []).toEqual([]);
  });

  test('serves the dashboard at / and /_mock/ui', async ({ page }) => {
    await mock.open('/');
    await expect(page).toHaveTitle('mock-msp · OCPI dashboard');
    await expect(mock.identity).toHaveText('US/TST · EMSP');

    await mock.open('/_mock/ui');
    await expect(page).toHaveTitle('mock-msp · OCPI dashboard');
    await expect(mock.identity).toHaveText('US/TST · EMSP');
  });

  test('header shows the party, registration and scenario badges', async () => {
    await mock.open();
    await expect(mock.identity).toHaveText('US/TST · EMSP');
    await expect(mock.regBadge).toHaveText('registered');
    await expect(mock.regBadge).toHaveClass(/reg-registered/);
    await expect(mock.scenarioBadge).toHaveText('scenario: preregistered');
  });

  test('cards start from zero after a reset', async () => {
    await mock.open();
    await expect(mock.cExch).toHaveText('0');
    await expect(mock.cFind).toHaveText('0');
    await expect(mock.cFault).toHaveText('0');
    await expect(mock.cReg).toHaveText('registered');
    await expect(mock.cReg).toHaveClass(/ok/);
    await expect(mock.cAuth).toHaveText('ALLOWED');
  });

  test('coverage grid lists every module with both directions unexercised', async () => {
    await mock.open();
    await expect(mock.covGrid.locator('.rl')).toHaveText(COVERAGE_MODULES);
    const cells = mock.covGrid.locator('.covcell');
    await expect(cells).toHaveCount(COVERAGE_MODULES.length * 2);
    await expect(cells).toHaveText(Array<string>(COVERAGE_MODULES.length * 2).fill('—'));
    await expect(cells).toHaveClass(Array<RegExp>(COVERAGE_MODULES.length * 2).fill(/covcell m/));
  });

  test('stamp advances while live, freezes when unticked, and refresh still works', async ({
    page,
  }) => {
    await mock.open();
    await expect(mock.stamp).toHaveText(/^updated \d\d:\d\d:\d\d$/);
    const first = await mock.stamp.textContent();
    await expect(mock.stamp).not.toHaveText(first ?? '');

    await mock.autoChk.uncheck();
    // a poll may already be in flight, so settle on a stable value instead of
    // guessing how long it takes to land
    let frozen = '';
    await expect
      .poll(
        async () => {
          const a = await mock.stamp.textContent();
          await page.waitForTimeout(600);
          const b = await mock.stamp.textContent();
          frozen = b ?? '';
          return a === b;
        },
        { timeout: 15_000 },
      )
      .toBe(true);
    await page.waitForTimeout(3000);
    await expect(mock.stamp).toHaveText(frozen);

    await mock.refresh();
    await expect(mock.stamp).not.toHaveText(frozen);
  });

  test('command payload is seeded per command type', async () => {
    await mock.open();
    const start = JSON.parse(await mock.cmdPayload.inputValue());
    expect(start).toMatchObject({
      location_id: '1',
      evse_uid: 'cp001::1',
      connector_id: '1',
      token: { uid: 'DEADBEEF', type: 'RFID', country_code: 'US', party_id: 'TST' },
    });

    await mock.cmdType.selectOption('STOP_SESSION');
    await expect(mock.cmdPayload).toHaveValue(
      JSON.stringify({ session_id: 'MOCK-SESSION-001' }, null, 2),
    );
  });
});
