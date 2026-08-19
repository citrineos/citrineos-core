// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// The actor / charging / probe / session buttons with nothing listening on the
// Citrine and Hasura URLs: every click must settle into a toast and a rendered
// outcome instead of a hung request or a page error.
import { expect, test } from '@playwright/test';
import { playCitrine, resetKeepingScenario } from './support/arrange.js';
import { MockPage } from './support/mock-page.js';

test.describe('dashboard actions against an unreachable Citrine', () => {
  let mock: MockPage;

  test.beforeEach(async ({ page, request }) => {
    await resetKeepingScenario(request);
    mock = new MockPage(page);
    await mock.open();
  });

  test.afterEach(() => {
    expect(mock.pageErrors).toEqual([]);
  });

  test('register short-circuits because the mock is already registered', async () => {
    await mock.button(/^Register$/).click();
    await expect(mock.toast.filter({ hasText: 'register ✓' })).toBeVisible();
    await expect(mock.regBadge).toHaveText('registered');
    // the short-circuit never talks to Citrine, so nothing is recorded
    await mock.refresh();
    await expect(mock.cExch).toHaveText('0');
  });

  test('pull locations resolves with a failed outbound exchange', async () => {
    await mock.button('Pull locations from Citrine').click();
    // the client records the transport failure as a finding on the exchange
    // rather than throwing, so the control call itself succeeds
    await expect(mock.toast.filter({ hasText: 'pull locations ✓' })).toBeVisible();
    await expect(mock.rows).toHaveCount(1);
    const row = mock.rows.first();
    await expect(row.locator('.dir')).toHaveText('M→C');
    await expect(row).toContainText('pull.locations');
    await expect(row.locator('td').nth(10)).toHaveText('1 err');
    await expect(mock.cFind).toHaveText('1');
  });

  test('push a token resolves with a failed outbound exchange', async () => {
    await mock.button('Push a token').click();
    await expect(mock.toast.filter({ hasText: 'push token ✓' })).toBeVisible();
    await expect(mock.rows).toHaveCount(1);
    const row = mock.rows.first();
    await expect(row.locator('.dir')).toHaveText('M→C');
    await expect(row).toContainText('tokens.push');
    await expect(row.locator('td').nth(10)).toHaveText('1 err');
  });

  test('send command reports the sync reply Citrine did not give', async () => {
    await mock.button('Send command').click();
    // sendCommand resolves with the transport error as its sync body, so the
    // dashboard reads no result and falls back to "sent"
    const toast = mock.toast.filter({ hasText: 'START_SESSION → Citrine replied: sent' });
    await expect(toast).toBeVisible();
    await expect(toast).toHaveClass(/err/);
    await expect(mock.rows).toHaveCount(1);
    await expect(mock.rows.first()).toContainText('command.START_SESSION');
  });

  test('send command rejects a payload that is not JSON', async () => {
    await mock.cmdPayload.fill('{ not json');
    await mock.button('Send command').click();
    await expect(mock.toast.filter({ hasText: 'payload is not valid JSON' })).toBeVisible();
    await mock.refresh();
    await expect(mock.cExch).toHaveText('0');
  });

  test('spec probes run and report the pagination probe failing', async () => {
    await mock.button('Run spec probes').click();
    // probe 1 cannot see a busy connector (Hasura unreachable) and probe 3 sees
    // HTTP 0, so both pass; only the pagination probe fails on the missing header
    await expect(mock.probeOut).toContainText('1 of 3 failing');
    await expect(mock.probeOut.getByText('PASS', { exact: true })).toHaveCount(2);
    await expect(mock.probeOut.getByText('FAIL', { exact: true })).toHaveCount(1);
    await expect(mock.probeOut).toContainText('Pagination reports the full total');
    await expect(mock.toast.filter({ hasText: 'spec probes: 1 failing' })).toBeVisible();
    await expect(mock.rows).toHaveCount(3);
  });

  test('discover evse fails cleanly', async () => {
    await mock.button('Discover EVSE').click();
    await expect(mock.chOut).toContainText('Discover EVSE — failed');
    await expect(mock.chOut).toContainText('discover_failed');
    await expect(mock.toast.filter({ hasText: 'Discover EVSE failed' })).toBeVisible();
  });

  test('plug in car fails cleanly without the everest broker', async () => {
    await mock.button('Plug in car').click();
    // docker exec is bounded server-side; give it room on a slow host
    await expect(mock.chOut).toContainText('Plug in car — failed', { timeout: 40_000 });
    await expect(mock.chOut).toContainText(/docker_unavailable|mqtt_failed/);
    await expect(mock.toast.filter({ hasText: 'Plug in car failed' })).toBeVisible();
    await expect(mock.identity).toHaveText('US/TST · EMSP');
  });

  test('start charging renders the unaccepted reply', async () => {
    await mock.button('Start charging').click();
    // /charge/start answers 200 with no sync result, which the panel judges as not ok
    await expect(mock.chOut.locator('div').first()).toHaveText('Start charging');
    await expect(mock.chOut).toContainText('"command": "START_SESSION"');
    const toast = mock.toast.filter({ hasText: 'Start charging ✗' });
    await expect(toast).toBeVisible();
    await expect(toast).toHaveClass(/err/);
  });

  test('reset clears the recorder and the scenario badge', async ({ request }) => {
    await playCitrine(request);
    await mock.refresh();
    await expect(mock.cExch).toHaveText('3');

    await mock.button('Reset recorder + state').click();
    await expect(mock.toast.filter({ hasText: 'reset ✓' })).toBeVisible();
    await expect(mock.cExch).toHaveText('0');
    await expect(mock.cFind).toHaveText('0');
    await expect(mock.cFault).toHaveText('0');
    await expect(mock.rows).toHaveCount(0);
    await expect(mock.scenarioBadge).toHaveText('');

    await resetKeepingScenario(request);
    await mock.refresh();
    await expect(mock.scenarioBadge).toHaveText('scenario: preregistered');
  });
});
