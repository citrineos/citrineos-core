// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// Wire trace after three Citrine-shaped inbound exchanges: row contents and
// order, the direction / search / problems-only filters, the expandable detail
// row and the findings panel.
import { expect, type Locator, test } from '@playwright/test';
import { playCitrine, resetKeepingScenario } from './support/arrange.js';
import { MockPage } from './support/mock-page.js';

// column order of #rows: seq, time, dir, module, operation, method, path, http, ocpi, valid, flags
const COL = { module: 3, http: 7, ocpi: 8, valid: 9, flags: 10 };
const cell = (row: Locator, col: number): Locator => row.locator('td').nth(col);

test.describe('dashboard wire trace', () => {
  let mock: MockPage;

  test.beforeEach(async ({ page, request }) => {
    await resetKeepingScenario(request);
    await playCitrine(request);
    mock = new MockPage(page);
    await mock.open();
  });

  test.afterEach(() => {
    expect(mock.pageErrors).toEqual([]);
  });

  test('shows the three exchanges newest first with their verdicts', async () => {
    await expect(mock.cExch).toHaveText('3');
    await expect(mock.cFind).toHaveText('2');
    await expect(mock.cFind).toHaveClass(/err/);
    await expect(mock.rows).toHaveCount(3);
    await expect(mock.shownCount).toHaveText('3 / 3 shown');
    await expect(mock.emptyMsg).toBeHidden();

    const [location, rejected, session] = [0, 1, 2].map((i) => mock.rows.nth(i));
    await expect(cell(location, COL.module)).toHaveText('locations');
    await expect(cell(location, COL.http)).toHaveText('200');
    await expect(cell(location, COL.ocpi)).toHaveText('1000');
    await expect(cell(location, COL.valid)).toHaveText('✗ invalid');
    await expect(cell(location, COL.flags)).toHaveText('1 err');

    await expect(cell(rejected, COL.module)).toHaveText('sessions');
    await expect(cell(rejected, COL.http)).toHaveText('401');
    await expect(cell(rejected, COL.ocpi)).toHaveText('2002');
    // no request schema was run on a rejected request, so the valid column is blank
    await expect(cell(rejected, COL.valid)).toHaveText('—');
    await expect(cell(rejected, COL.flags)).toHaveText('1 err');

    await expect(cell(session, COL.module)).toHaveText('sessions');
    await expect(cell(session, COL.http)).toHaveText('200');
    await expect(cell(session, COL.valid)).toHaveText('✓');
    await expect(cell(session, COL.flags)).toHaveText('');

    for (const row of [location, rejected, session]) {
      await expect(row.locator('.dir')).toHaveText('C→M');
    }
  });

  test('problems only hides the valid session row', async () => {
    await mock.fFail.check();
    await expect(mock.rows).toHaveCount(2);
    await expect(mock.shownCount).toHaveText('2 / 3 shown');
    await expect(mock.rows.filter({ hasText: '✓' })).toHaveCount(0);

    await mock.fFail.uncheck();
    await expect(mock.rows).toHaveCount(3);
  });

  test('direction filter keeps inbound rows and empties on outbound', async () => {
    await mock.fDir.selectOption('inbound');
    await expect(mock.rows).toHaveCount(3);
    await expect(mock.shownCount).toHaveText('3 / 3 shown');

    await mock.fDir.selectOption('outbound');
    await expect(mock.rows).toHaveCount(0);
    await expect(mock.shownCount).toHaveText('0 / 3 shown');
    // the empty message is about the recorder, not the filter
    await expect(mock.emptyMsg).toBeHidden();
  });

  test('search narrows by module', async () => {
    await mock.fSearch.fill('locations');
    await expect(mock.rows).toHaveCount(1);
    await expect(mock.shownCount).toHaveText('1 / 3 shown');
    await expect(cell(mock.rows.first(), COL.module)).toHaveText('locations');

    await mock.fSearch.fill('');
    await expect(mock.rows).toHaveCount(3);
  });

  test('clicking a row opens its detail and clicking again closes it', async () => {
    await mock.freezePolling();
    const location = mock.rows.filter({ hasText: 'locations' });
    await location.click();

    const detail = mock.detailRow();
    await expect(detail).toHaveCount(1);
    await expect(detail.locator('h4').first()).toContainText('request PUT');
    await expect(detail.locator('h4').nth(1)).toContainText('response · http 200 · ocpi 1000');
    await expect(detail.locator('pre')).toHaveCount(2);
    await expect(detail.locator('pre').first()).toContainText('"latitude": "1.0"');
    await expect(detail.locator('.f')).toContainText('body');
    await expect(detail.locator('ul.issues .ipath')).toHaveText([
      'coordinates.latitude',
      'coordinates.longitude',
    ]);

    await location.click();
    await expect(detail).toHaveCount(0);
  });

  test('findings panel lists the auth and body findings newest first', async () => {
    const entries = mock.findings.locator('.f');
    await expect(entries).toHaveCount(2);
    await expect(entries.nth(0)).toContainText('locations');
    await expect(entries.nth(0)).toContainText('body');
    await expect(entries.nth(0)).toHaveClass(/error/);
    await expect(entries.nth(1)).toContainText('sessions');
    await expect(entries.nth(1)).toContainText('auth');
    await expect(entries.nth(1)).toHaveClass(/error/);
  });

  test('empty message returns after a reset', async ({ request }) => {
    await resetKeepingScenario(request);
    await mock.refresh();
    await expect(mock.rows).toHaveCount(0);
    await expect(mock.emptyMsg).toBeVisible();
    await expect(mock.shownCount).toHaveText('0 / 0 shown');
    await expect(mock.cExch).toHaveText('0');
    await expect(mock.findings).toContainText('None');
  });
});
