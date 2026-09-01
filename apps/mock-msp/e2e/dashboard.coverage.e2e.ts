// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// The coverage matrix: cell colour/count per module and direction after the
// three Citrine exchanges, and that a tripped fault does not mark a cell red.
import { expect, type Locator, test } from '@playwright/test';
import {
  armFault,
  ctlJson,
  functionalHeaders,
  playCitrine,
  resetKeepingScenario,
  validCdr,
} from './support/arrange.js';
import { MockPage } from './support/mock-page.js';

// row order of buildCoverage(); the grid is flat: label, inbound cell, outbound cell
const MODULES = [
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

function covCell(mock: MockPage, module: string, dir: 'inbound' | 'outbound'): Locator {
  const i = MODULES.indexOf(module) * 2 + (dir === 'inbound' ? 0 : 1);
  return mock.covGrid.locator('.covcell').nth(i);
}

test.describe('dashboard coverage matrix', () => {
  let mock: MockPage;

  test.beforeEach(async ({ page, request }) => {
    await resetKeepingScenario(request);
    await playCitrine(request);
    mock = new MockPage(page);
    await mock.open();
  });

  test.afterEach(() => {
    expect(mock?.pageErrors ?? []).toEqual([]);
  });

  test('inbound cells follow the last exchange per module, outbound stays grey', async () => {
    await expect(mock.covGrid.locator('.rl')).toHaveText(MODULES);

    // two session PUTs landed; the most recent is the 401 one, which never ran a
    // request schema, so its validation defaults to ok and the cell stays green
    await expect(covCell(mock, 'sessions', 'inbound')).toHaveText('✓ 2');
    await expect(covCell(mock, 'sessions', 'inbound')).toHaveClass(/\bg\b/);
    await expect(covCell(mock, 'locations', 'inbound')).toHaveText('✗ 1');
    await expect(covCell(mock, 'locations', 'inbound')).toHaveClass(/\br\b/);

    for (const m of MODULES.filter((x) => x !== 'sessions' && x !== 'locations')) {
      await expect(covCell(mock, m, 'inbound')).toHaveText('—');
      await expect(covCell(mock, m, 'inbound')).toHaveClass(/\bm\b/);
    }
    for (const m of MODULES) {
      await expect(covCell(mock, m, 'outbound')).toHaveText('—');
      await expect(covCell(mock, m, 'outbound')).toHaveClass(/\bm\b/);
    }
  });

  test('a tripped fault leaves the cdrs cell green because validation still passed', async ({
    request,
  }) => {
    await armFault(request, {
      match: { module: 'cdrs', direction: 'inbound' },
      action: { kind: 'ocpiStatus', status_code: 3001 },
    });
    const res = await request.post('/ocpi/2.2.1/emsp/cdrs', {
      headers: functionalHeaders(),
      data: JSON.stringify(validCdr('CDR-E2E-COV')),
    });
    expect(res.status()).toBe(200);
    expect((await res.json()).status_code).toBe(3001);

    const coverage = await ctlJson<{ modules: Array<Record<string, unknown>> }>(
      request,
      '/coverage',
      {},
      'GET',
    );
    expect(coverage.modules.find((m) => m.module === 'cdrs')).toMatchObject({
      inbound: { count: 1, lastOk: true },
      outbound: { count: 0, lastOk: null },
    });

    await mock.refresh();
    await expect(covCell(mock, 'cdrs', 'inbound')).toHaveText('✓ 1');
    await expect(covCell(mock, 'cdrs', 'inbound')).toHaveClass(/\bg\b/);
    await expect(mock.rows.first()).toHaveClass(/faulted/);
    await expect(mock.rows.first()).toContainText('fault:ocpiStatus');
  });
});
