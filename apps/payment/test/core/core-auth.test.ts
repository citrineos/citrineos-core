// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import { LocalDevCoreAuth, StaticCoreAuth } from '../../src/core/core-auth.js';

function aJwt(exp: number): string {
  const part = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${part({ alg: 'RS256' })}.${part({ exp, tenant_id: '1' })}.signature`;
}

function aDevCore(expiresInSeconds = 3600) {
  const requests: unknown[] = [];
  let now = 1_000_000_000_000;
  const fetchFn: typeof fetch = async (input, init) => {
    requests.push({ url: String(input), body: JSON.parse(String(init?.body)) });
    return Response.json({ accessToken: aJwt(now / 1000 + expiresInSeconds) + requests.length });
  };
  const auth = new LocalDevCoreAuth('http://core:8080', ['admin'], fetchFn, () => now);
  return { auth, requests, advance: (ms: number) => (now += ms) };
}

describe('StaticCoreAuth', () => {
  it('sends a tenant its own headers, and every other tenant the shared ones', async () => {
    const auth = new StaticCoreAuth({ Authorization: 'a' }, { '2': { Authorization: 'b' } });

    expect(await auth.headersFor(2)).toEqual({ Authorization: 'b' });
    expect(await auth.headersFor(3)).toEqual({ Authorization: 'a' });
  });
});

describe('LocalDevCoreAuth', () => {
  it('mints a token per tenant from Core and keeps it', async () => {
    const { auth, requests } = aDevCore();

    const first = await auth.headersFor(1);
    expect(await auth.headersFor(1)).toEqual(first);
    await auth.headersFor(2);

    expect(requests).toEqual([
      { url: 'http://core:8080/dev/token', body: { roles: ['admin'], tenantId: 1 } },
      { url: 'http://core:8080/dev/token', body: { roles: ['admin'], tenantId: 2 } },
    ]);
    expect(first.Authorization).toMatch(/^Bearer /);
  });

  it('mints once for requests made at the same time', async () => {
    const { auth, requests } = aDevCore();

    await Promise.all([auth.headersFor(1), auth.headersFor(1), auth.headersFor(1)]);

    expect(requests).toHaveLength(1);
  });

  it('renews a token a minute before it expires, and when Core refused it', async () => {
    const { auth, requests, advance } = aDevCore(600);
    await auth.headersFor(1);

    advance(500_000);
    await auth.headersFor(1);
    expect(requests).toHaveLength(1);

    advance(50_000);
    await auth.headersFor(1);
    expect(requests).toHaveLength(2);

    auth.invalidate(1);
    await auth.headersFor(1);
    expect(requests).toHaveLength(3);
  });

  it('fails when Core does not mint, and tries again next time', async () => {
    let fail = true;
    const auth = new LocalDevCoreAuth('http://core:8080', ['admin'], async () =>
      fail
        ? new Response('no dev endpoint', { status: 404 })
        : Response.json({ accessToken: 'opaque' }),
    );

    await expect(auth.headersFor(1)).rejects.toThrow('404');
    fail = false;
    expect(await auth.headersFor(1)).toEqual({ Authorization: 'Bearer opaque' });
  });
});
