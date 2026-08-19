// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// @everest — the charging panel end to end against the live stack with the
// EVerest simulator online: discover, plug, start, stop, unplug.
import { expect, test } from '@playwright/test';
import { ctlJson } from './support/arrange.js';
import { MockPage } from './support/mock-page.js';

test.describe('dashboard charging panel against everest', () => {
  let mock: MockPage;

  test.beforeEach(async ({ page, request }) => {
    test.skip(!process.env.E2E_MOCK_URL, 'needs E2E_MOCK_URL pointing at a mock wired to Citrine');
    await ctlJson(request, '/reset', { keepRegistration: true });
    mock = new MockPage(page);
    await mock.open();
    await expect(mock.regBadge).toHaveText('registered');
  });

  test.afterEach(() => {
    expect(mock.pageErrors).toEqual([]);
  });

  test('@everest discover, plug, start, stop and unplug a simulated session', async () => {
    test.setTimeout(180_000);
    const title = mock.chOut.locator('div').first();

    await test.step('discover the seeded evse', async () => {
      await mock.button('Discover EVSE').click();
      await expect(title).toHaveText('Discover EVSE', { timeout: 30_000 });
      await expect(mock.chOut).toContainText('"evse_uid": "cp001::1"');
      await expect(mock.toast.filter({ hasText: 'Discover EVSE ✓' })).toBeVisible();
    });

    await test.step('plug in the car', async () => {
      await mock.button('Plug in car').click();
      await expect(title).toHaveText('Plug in car', { timeout: 40_000 });
      await expect(mock.chOut).toContainText('"plugged": true');
    });

    await test.step('start charging', async () => {
      await mock.button('Start charging').click();
      // the control call itself awaits the async CommandResult and the pushed Session
      await expect(title).toHaveText('Start charging', { timeout: 70_000 });
      await expect(mock.chOut).toContainText('"result": "ACCEPTED"');
      await expect(mock.chOut).toContainText('"session":', { timeout: 60_000 });
      await expect(mock.chOut).not.toContainText('sessionPending');
      await expect(mock.toast.filter({ hasText: /^Start charging → ACCEPTED ✓$/ })).toBeVisible();
    });

    await test.step('stop charging', async () => {
      await mock.button('Stop charging').click();
      await expect(title).toHaveText('Stop charging', { timeout: 70_000 });
      await expect(mock.chOut).toContainText('"result": "ACCEPTED"');
      // the CDR usually only exists once the car unplugs; pending is fine here
      await expect(mock.chOut).toContainText(/"cdr":|"cdrSource":|"cdrPending":/, {
        timeout: 60_000,
      });
    });

    await test.step('unplug', async () => {
      await mock.button('Unplug').click();
      await expect(title).toHaveText('Unplug', { timeout: 40_000 });
      await expect(mock.chOut).toContainText('"unplugged": true');
    });

    await mock.refresh();
    await expect(mock.rows.filter({ hasText: 'command.START_SESSION' })).not.toHaveCount(0);
    await expect(mock.rows.filter({ hasText: 'sessions.put' })).not.toHaveCount(0);
  });
});
