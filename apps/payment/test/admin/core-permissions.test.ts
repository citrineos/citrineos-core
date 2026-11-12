// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import { CorePermissions } from '../../src/admin/core-permissions.js';

const CORE = 'http://core.test:8080';

/** Core's `GET /permissions/user`: answers in order, and records what it was sent. */
function aCore(...answers: Response[]) {
  const requests: { url: string; authorization: string | null }[] = [];
  const fetchFn: typeof fetch = async (input, init) => {
    requests.push({
      url: String(input),
      authorization: new Headers(init?.headers).get('Authorization'),
    });
    const answer = answers.shift();
    if (!answer) {
      throw new Error('Core was asked more often than expected');
    }
    return answer;
  };
  return { fetchFn, requests };
}

const granted = () =>
  Response.json({
    tenantId: '3',
    roles: ['user'],
    resources: {},
    permissions: ['payment.checkouts.get'],
    enforcing: true,
  });

describe('CorePermissions', () => {
  it('asks Core with the caller’s own credentials, and reads the tenant and permissions', async () => {
    const core = aCore(granted());

    expect(await new CorePermissions(CORE, core.fetchFn).forCaller('Bearer t1')).toEqual({
      tenantId: 3,
      permissions: ['payment.checkouts.get'],
      enforcing: true,
    });
    expect(core.requests).toEqual([
      { url: `${CORE}/permissions/user`, authorization: 'Bearer t1' },
    ]);
  });

  it('asks without credentials when the caller sent none', async () => {
    const core = aCore(Response.json({ tenantId: '1', permissions: [], enforcing: false }));

    expect(await new CorePermissions(CORE, core.fetchFn).forCaller(undefined)).toMatchObject({
      enforcing: false,
    });
    expect(core.requests[0].authorization).toBeNull();
  });

  it.each([401, 403])('takes Core’s %i as credentials it does not accept', async (status) => {
    const core = aCore(new Response('no', { status }));

    expect(await new CorePermissions(CORE, core.fetchFn).forCaller('Bearer t1')).toBeUndefined();
  });

  it.each([
    ['Core fails', new Response('down', { status: 503 })],
    ['Core names no tenant', Response.json({ permissions: [], enforcing: true })],
  ])('fails when %s', async (_name, answer) => {
    await expect(
      new CorePermissions(CORE, aCore(answer).fetchFn).forCaller('Bearer t1'),
    ).rejects.toThrow();
  });

  it('keeps an answer for 30 seconds per caller', async () => {
    let now = 0;
    const core = aCore(granted(), granted(), granted());
    const permissions = new CorePermissions(CORE, core.fetchFn, () => now);

    await permissions.forCaller('Bearer t1');
    now = 29_999;
    await permissions.forCaller('Bearer t1');
    expect(core.requests).toHaveLength(1);

    await permissions.forCaller('Bearer t2');
    now = 30_000;
    await permissions.forCaller('Bearer t1');
    expect(core.requests.map((request) => request.authorization)).toEqual([
      'Bearer t1',
      'Bearer t2',
      'Bearer t1',
    ]);
  });
});
