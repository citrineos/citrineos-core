// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// @live — the actor buttons against a real CitrineOS stack (E2E_MOCK_URL points
// at a mock that is registered with it). Register/Unregister are deliberately
// not clicked: they would disturb the shared registration.
import { expect, type Locator, test } from '@playwright/test';
import { ctlJson } from './support/arrange.js';
import { MockPage } from './support/mock-page.js';

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
const EXERCISED = /^[✓✗] \d+$/;

function covCell(mock: MockPage, module: string, dir: 'inbound' | 'outbound'): Locator {
  const i = MODULES.indexOf(module) * 2 + (dir === 'inbound' ? 0 : 1);
  return mock.covGrid.locator('.covcell').nth(i);
}

test.describe('dashboard against a live stack', () => {
  let mock: MockPage;

  test.beforeEach(async ({ page, request }) => {
    test.skip(!process.env.E2E_MOCK_URL, 'needs E2E_MOCK_URL pointing at a mock wired to Citrine');
    // plain reset: re-applying the scenario would put the bootstrap tokens back,
    // and the re-register test below rotates them with Citrine
    await ctlJson(request, '/reset', { keepRegistration: true });
    mock = new MockPage(page);
    await mock.open();
    await expect(mock.regBadge).toHaveText('registered');
  });

  test.afterEach(() => {
    expect(mock?.pageErrors ?? []).toEqual([]);
  });

  test('@live pull all lights up the outbound coverage column', async () => {
    await mock.button('Pull all').click();
    for (const m of ['locations', 'sessions', 'cdrs', 'tariffs']) {
      await expect(mock.toast.filter({ hasText: `pull ${m} ✓` })).toBeVisible({
        timeout: 30_000,
      });
    }
    await mock.refresh();
    for (const m of ['locations', 'sessions', 'cdrs', 'tariffs']) {
      await expect(covCell(mock, m, 'outbound')).toHaveText(EXERCISED);
      await expect(mock.rows.filter({ hasText: `pull.${m}` })).not.toHaveCount(0);
    }
  });

  test('@live push a token records an outbound tokens exchange', async () => {
    await mock.button('Push a token').click();
    await expect(mock.toast.filter({ hasText: 'push token ✓' })).toBeVisible({ timeout: 30_000 });
    await mock.refresh();
    await expect(covCell(mock, 'tokens', 'outbound')).toHaveText(EXERCISED);
    const row = mock.rows.filter({ hasText: 'tokens.push' }).first();
    await expect(row.locator('.dir')).toHaveText('M→C');
  });

  test('@live spec probes report a verdict per probe', async () => {
    await mock.button('Run spec probes').click();
    await expect(mock.probeOut).toContainText(/\d+ of 3 failing/, { timeout: 60_000 });
    await expect(mock.probeOut.getByText(/^(PASS|FAIL)$/)).toHaveCount(3);
    await expect(mock.probeOut).toContainText('EVSE availability reflects the charger');
    await expect(mock.probeOut).toContainText('Pagination reports the full total');
    await expect(mock.probeOut).toContainText('A string location_id is handled');
    await expect(mock.toast.filter({ hasText: /^spec probes: \d+ failing$/ })).toBeVisible();
  });

  test('@live provoking a new location makes Citrine push it to the mock', async () => {
    await mock.button('Make Citrine push a new location').click();
    await expect(mock.toast.filter({ hasText: 'provoke location-add ✓' })).toBeVisible({
      timeout: 30_000,
    });
    const inboundLocations = mock.rows
      .filter({ has: mock.page.locator('.dir', { hasText: 'C→M' }) })
      .filter({ hasText: 'locations' });
    await expect(inboundLocations).not.toHaveCount(0, { timeout: 30_000 });
    await expect(covCell(mock, 'locations', 'inbound')).toHaveText(EXERCISED);
  });

  test('@live re-register rotates credentials with Citrine', async () => {
    await mock.button('Re-register').click();
    await expect(mock.toast.filter({ hasText: 're-register ✓' })).toBeVisible({ timeout: 30_000 });
    await expect(mock.regBadge).toHaveText('registered');
    await expect(mock.rows.filter({ hasText: 'credentials.put' })).not.toHaveCount(0);
  });
});
