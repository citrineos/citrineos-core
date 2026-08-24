// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// The adversary panel: per-kind parameter inputs, the quick-fill chips, arming
// a rule from the builder and seeing it trip on a real inbound CDR, and the
// per-rule / clear-all disarm buttons.
import { expect, test } from '@playwright/test';
import {
  armFault,
  ctlJson,
  functionalHeaders,
  resetKeepingScenario,
  validCdr,
} from './support/arrange.js';
import { MockPage } from './support/mock-page.js';

const PARAM_IDS: Record<string, string[]> = {
  passthrough: [],
  delay: ['fbMs'],
  abort: [],
  unauthorized: [],
  httpStatus: ['fbStatus'],
  ocpiStatus: ['fbCode', 'fbMsg'],
  malformBody: ['fbMut', 'fbPath'],
  dropHeaders: ['fbHdrs'],
  oversizeToken: [],
};

test.describe('dashboard fault builder', () => {
  let mock: MockPage;

  test.beforeEach(async ({ page, request }) => {
    await resetKeepingScenario(request);
    mock = new MockPage(page);
    await mock.open();
  });

  test.afterEach(() => {
    expect(mock.pageErrors).toEqual([]);
  });

  test('each fault kind renders only its own parameter inputs', async ({ page }) => {
    for (const [kind, ids] of Object.entries(PARAM_IDS)) {
      await mock.selectFaultKind(kind);
      await expect(mock.fbParams.locator('input, select')).toHaveCount(ids.length);
      for (const id of ids) await expect(page.locator(`#${id}`)).toBeVisible();
    }
  });

  test('chips prefill the builder but do not arm anything', async ({ page, request }) => {
    await mock.button('slow 2s').click();
    await expect(mock.fbKind).toHaveValue('delay');
    await expect(mock.fbModule).toHaveValue('');
    await expect(page.locator('#fbMs')).toHaveValue('2000');

    await mock.button('malform CDR').click();
    await expect(mock.fbModule).toHaveValue('cdrs');
    await expect(mock.fbKind).toHaveValue('malformBody');
    await expect(page.locator('#fbMut')).toHaveValue('dropRequired');

    await mock.button('drop headers').click();
    await expect(mock.fbModule).toHaveValue('locations');
    await expect(mock.fbDir).toHaveValue('outbound');
    await expect(mock.fbKind).toHaveValue('dropHeaders');
    await expect(page.locator('#fbHdrs')).toHaveValue('X-Request-ID,X-Correlation-ID');

    await mock.refresh();
    await expect(mock.cFault).toHaveText('0');
    await expect(mock.faultEntries()).toHaveCount(0);
    expect(await ctlJson(request, '/faults', {}, 'GET')).toEqual([]);
  });

  test('an armed cdrs ocpiStatus rule trips on the next CDR and can be disarmed', async ({
    request,
  }) => {
    await mock.fbModule.selectOption('cdrs');
    await mock.selectFaultKind('ocpiStatus');
    await mock.button('Arm fault').click();
    await expect(mock.toast.filter({ hasText: 'arm fault ✓' })).toBeVisible();

    await expect(mock.faultEntries()).toHaveCount(1);
    await expect(mock.faultEntries().first().locator('.pill')).toHaveText('ocpiStatus');
    await expect(mock.faultEntries().first().locator('.mono')).toHaveText('cdrs');
    await expect(mock.cFault).toHaveText('1');
    await expect(mock.cFault).toHaveClass(/warn/);

    const res = await request.post('/ocpi/2.2.1/emsp/cdrs', {
      headers: functionalHeaders(),
      data: JSON.stringify(validCdr('CDR-E2E-FAULT')),
    });
    expect(res.status()).toBe(200);
    expect((await res.json()).status_code).toBe(3001);

    await mock.refresh();
    const row = mock.rows.first();
    await expect(row).toHaveClass(/faulted/);
    await expect(row).toContainText('cdrs.post');
    await expect(row.locator('td').nth(8)).toHaveText('3001');
    await expect(row.locator('td').nth(8).locator('.pill')).toHaveClass(/\br\b/);
    // the payload was valid; only the reply was tampered with
    await expect(row.locator('td').nth(9)).toHaveText('✓');
    await expect(row.locator('td').nth(10)).toContainText('fault:ocpiStatus');

    await mock.freezePolling();
    await mock.faultEntries().first().getByRole('button', { name: '✕' }).click();
    await expect(mock.toast.filter({ hasText: 'disarm ✓' })).toBeVisible();
    await expect(mock.faultEntries()).toHaveCount(0);
    await expect(mock.cFault).toHaveText('0');
  });

  test('clear all removes every armed rule', async ({ request }) => {
    await armFault(request, { match: { module: 'cdrs' }, action: { kind: 'delay', ms: 10 } });
    await armFault(request, {
      match: { module: 'locations', direction: 'outbound' },
      action: { kind: 'dropHeaders', headers: ['X-Request-ID'] },
    });
    await mock.refresh();
    await expect(mock.faultEntries()).toHaveCount(2);
    await expect(mock.faultEntries().locator('.pill')).toHaveText(['delay', 'dropHeaders']);
    await expect(mock.cFault).toHaveText('2');

    await mock.button('Clear all').click();
    await expect(mock.toast.filter({ hasText: 'clear faults ✓' })).toBeVisible();
    await expect(mock.faultEntries()).toHaveCount(0);
    await expect(mock.cFault).toHaveText('0');
  });
});
