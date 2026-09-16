// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// The optional x-mock-control-secret guard on the /_mock plugin.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { makeServer, registrationHeaders } from './harness.js';

const SECRET = 's3cret';

describe('/_mock control secret', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    ({ app } = makeServer({ controlSecret: SECRET }));
    await app.ready();
  });
  afterEach(async () => {
    await app.close();
  });

  const guarded: Array<{ method: 'GET' | 'POST' | 'DELETE'; url: string }> = [
    { method: 'GET', url: '/_mock/health' },
    { method: 'GET', url: '/_mock/registration' },
    { method: 'GET', url: '/_mock/state' },
    { method: 'GET', url: '/_mock/state/sessions' },
    { method: 'GET', url: '/_mock/exchanges' },
    { method: 'GET', url: '/_mock/exchanges/nope' },
    { method: 'GET', url: '/_mock/received/sessions' },
    { method: 'GET', url: '/_mock/findings' },
    { method: 'DELETE', url: '/_mock/findings' },
    { method: 'POST', url: '/_mock/exchanges/wait' },
    { method: 'GET', url: '/_mock/wait?timeoutMs=10' },
    { method: 'POST', url: '/_mock/reset' },
    { method: 'GET', url: '/_mock/scenario' },
    { method: 'POST', url: '/_mock/scenario' },
    { method: 'POST', url: '/_mock/scenarios/x/evaluate' },
    { method: 'POST', url: '/_mock/register' },
    { method: 'POST', url: '/_mock/reregister' },
    { method: 'POST', url: '/_mock/unregister' },
    { method: 'POST', url: '/_mock/authorize' },
    { method: 'POST', url: '/_mock/commands/START_SESSION' },
    { method: 'POST', url: '/_mock/emit/command' },
    { method: 'POST', url: '/_mock/emit/token' },
    { method: 'POST', url: '/_mock/emit/token-patch' },
    { method: 'POST', url: '/_mock/verify/token' },
    { method: 'POST', url: '/_mock/pull/locations' },
    { method: 'GET', url: '/_mock/discover/evse' },
    { method: 'POST', url: '/_mock/charge/start' },
    { method: 'POST', url: '/_mock/charge/stop' },
    { method: 'POST', url: '/_mock/everest/plug' },
    { method: 'POST', url: '/_mock/everest/unplug' },
    { method: 'GET', url: '/_mock/probes' },
    { method: 'POST', url: '/_mock/provoke/locations' },
    { method: 'GET', url: '/_mock/coverage' },
    { method: 'GET', url: '/_mock/status' },
    { method: 'GET', url: '/_mock/faults' },
    { method: 'POST', url: '/_mock/faults' },
    { method: 'POST', url: '/_mock/fault' },
    { method: 'DELETE', url: '/_mock/faults' },
    { method: 'DELETE', url: '/_mock/faults/some-id' },
  ];

  it('rejects every /_mock route without the header', async () => {
    for (const { method, url } of guarded) {
      const res = await app.inject({ method, url });
      expect(res.statusCode, `${method} ${url}`).toBe(401);
      expect(res.json(), `${method} ${url}`).toMatchObject({ error: 'unauthorized' });
    }
  });

  it('rejects every /_mock route with a wrong secret', async () => {
    for (const { method, url } of guarded) {
      const res = await app.inject({
        method,
        url,
        headers: { 'x-mock-control-secret': 'nope' },
      });
      expect(res.statusCode, `${method} ${url}`).toBe(401);
      expect(res.json().error, `${method} ${url}`).toBe('unauthorized');
    }
  });

  it('serves the control API with the right secret', async () => {
    const h = { 'x-mock-control-secret': SECRET };
    const health = await app.inject({ method: 'GET', url: '/_mock/health', headers: h });
    expect(health.statusCode).toBe(200);
    expect(health.json().status).toBe('up');

    const reset = await app.inject({
      method: 'POST',
      url: '/_mock/reset',
      headers: { ...h, 'content-type': 'application/json' },
      payload: '{}',
    });
    expect(reset.statusCode).toBe(200);
    expect(reset.json().reset).toBe(true);

    const faults = await app.inject({ method: 'GET', url: '/_mock/faults', headers: h });
    expect(faults.statusCode).toBe(200);
    expect(faults.json()).toEqual([]);
  });

  it('leaves the OCPI routes and the dashboard alone', async () => {
    const versions = await app.inject({
      method: 'GET',
      url: '/ocpi/versions',
      headers: registrationHeaders(),
    });
    expect(versions.statusCode).toBe(200);
    expect(versions.json().status_code).toBe(1000);

    const root = await app.inject({ method: 'GET', url: '/' });
    expect(root.statusCode).toBe(200);
    expect(root.headers['content-type']).toMatch(/^text\/html/);
  });
});

describe('/_mock without a control secret configured', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    ({ app } = makeServer());
    await app.ready();
  });
  afterEach(async () => {
    await app.close();
  });

  it('needs no header', async () => {
    const health = await app.inject({ method: 'GET', url: '/_mock/health' });
    expect(health.statusCode).toBe(200);
    const faults = await app.inject({ method: 'GET', url: '/_mock/faults' });
    expect(faults.statusCode).toBe(200);
  });

  it('ignores a stray header', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/_mock/health',
      headers: { 'x-mock-control-secret': 'whatever' },
    });
    expect(res.statusCode).toBe(200);
  });
});
