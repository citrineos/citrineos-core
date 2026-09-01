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
    // core advertises every OCPP version on :8081, so a current EVerest can land
    // on ocpp2.1 - and OCPI only maps command handlers for 1.6 / 2.0.1, which
    // makes every charging button fail with a generic communication error
    const hasura = process.env.HASURA_URL ?? 'http://localhost:8090/v1/graphql';
    const res = await request.post(hasura, {
      data: {
        query: '{ ChargingStations(where: {ocppConnectionName: {_eq: "cp001"}}) { protocol } }',
      },
    });
    const body = await res.json();
    const protocol = body?.data?.ChargingStations?.[0]?.protocol;
    // only a genuinely uncommandable protocol may skip; anything else is a fault
    expect(protocol, `could not read cp001's protocol: ${JSON.stringify(body)}`).toBeTruthy();
    test.skip(
      !['ocpp1.6', 'ocpp2.0.1'].includes(protocol),
      `cp001 negotiated ${protocol}; OCPI has no command handler for it`,
    );
    await ctlJson(request, '/reset', { keepRegistration: true });
    mock = new MockPage(page);
    await mock.open();
    await expect(mock.regBadge).toHaveText('registered');
  });

  test.afterEach(() => {
    expect(mock?.pageErrors ?? []).toEqual([]);
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
