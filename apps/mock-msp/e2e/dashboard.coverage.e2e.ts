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

/** A schema-valid CDR (the one scripts/demo-seed.sh posts in its adversary step). */
function validCdr(id: string): Record<string, unknown> {
  return {
    country_code: 'US',
    party_id: 'S44',
    id,
    start_date_time: '2026-07-17T09:00:00.000Z',
    end_date_time: '2026-07-17T10:00:00.000Z',
    session_id: 'SESSION-DEMO-1',
    cdr_token: {
      uid: '04E7F5A2B37C80',
      type: 'RFID',
      contract_id: 'USTST-C-00042',
      country_code: 'US',
      party_id: 'TST',
    },
    auth_method: 'WHITELIST',
    authorization_reference: 'AUTH-DEMO-0001',
    cdr_location: {
      id: 'LOC-DEMO-1',
      name: 'Demo Depot',
      address: '1 Market St',
      city: 'San Francisco',
      postal_code: '94105',
      state: 'CA',
      country: 'USA',
      coordinates: { latitude: '37.774929', longitude: '-122.419418' },
      evse_uid: 'EVSE-DEMO-1',
      evse_id: 'US*S44*E00001',
      connector_id: '1',
      connector_standard: 'IEC_62196_T2',
      connector_format: 'SOCKET',
      connector_power_type: 'AC_3_PHASE',
    },
    currency: 'USD',
    charging_periods: [
      {
        start_date_time: '2026-07-17T09:00:00.000Z',
        dimensions: [{ type: 'ENERGY', volume: 18.5 }],
      },
    ],
    total_cost: { excl_vat: 7.25, incl_vat: 8.7 },
    total_energy: 18.5,
    total_time: 1,
    last_updated: '2026-07-17T10:00:05.000Z',
  };
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
    expect(mock.pageErrors).toEqual([]);
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
