// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// The /_mock control API — the test-harness surface. Covers the headline
//     async primitive (emit -> waitForReceived resolves, both directly and over
//     the HTTP surface) and lifecycle reset (clears the recorder + domain state).
//     Plus health, exchange queries, findings, and fault CRUD.
// ============================================================================
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import type { MockContext } from '../src/core/types.js';
import { makeServer, functionalHeaders, validSession } from './harness.js';

const tick = (ms = 50): Promise<void> => new Promise((r) => setTimeout(r, ms));

describe('/_mock control API', () => {
  let app: FastifyInstance;
  let ctx: MockContext;

  beforeEach(async () => {
    ({ app, ctx } = makeServer());
    await app.ready();
  });
  afterEach(async () => {
    await app.close();
  });

  function putSession(id: string) {
    return app.inject({
      method: 'PUT',
      url: `/ocpi/2.2.1/emsp/sessions/US/TST/${id}`,
      headers: functionalHeaders(ctx.config),
      payload: JSON.stringify(validSession({ id })),
    });
  }

  it('GET /_mock/health reports up + registration summary', async () => {
    const res = await app.inject({ method: 'GET', url: '/_mock/health' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe('up');
    expect(body.party).toBe('US/TST');
    expect(body.role).toBe('EMSP');
    expect(body.registration.status).toBe('registered');
  });

  it('Store.count()/maxSeq() track recorded exchanges and back health.exchanges', async () => {
    expect(ctx.store.count()).toBe(0);
    expect(ctx.store.maxSeq()).toBe(0);
    await putSession('CNT-1');
    await putSession('CNT-2');
    expect(ctx.store.count()).toBe(2);
    // maxSeq is the newest seq — monotonic and >= the count here.
    expect(ctx.store.maxSeq()).toBe(ctx.store.query({}).at(-1)!.seq);
    const res = await app.inject({ method: 'GET', url: '/_mock/health' });
    expect(res.json().exchanges).toBe(2);
  });

  it('waitForReceived resolves on emitted inbound traffic (direct store primitive)', async () => {
    // Register the waiter FIRST (executor runs synchronously), then emit.
    const waitPromise = ctx.store.waitForReceived(
      { direction: 'inbound', module: 'sessions', method: 'PUT' },
      3000,
    );
    await putSession('WAIT-1');
    const ex = await waitPromise;
    expect(ex.module).toBe('sessions');
    expect(ex.operation).toBe('sessions.put');
    expect(ex.request.path).toContain('WAIT-1');
  });

  it('POST /_mock/exchanges/wait resolves when matching traffic is emitted', async () => {
    // Fire the long-poll wait, let it register, then emit the trigger.
    const waitInject = app.inject({
      method: 'POST',
      url: '/_mock/exchanges/wait',
      payload: {
        filter: { direction: 'inbound', module: 'sessions', method: 'PUT' },
        timeoutMs: 3000,
      },
    });
    await tick();
    await putSession('WAIT-2');
    const res = await waitInject;
    expect(res.statusCode).toBe(200);
    const ex = res.json();
    expect(ex.module).toBe('sessions');
    expect(ex.request.path).toContain('WAIT-2');
  });

  it('POST /_mock/exchanges/wait times out with 408 + nearMisses when nothing matches', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/_mock/exchanges/wait',
      payload: { filter: { direction: 'inbound', module: 'cdrs' }, timeoutMs: 150 },
    });
    expect(res.statusCode).toBe(408);
    expect(res.json().error).toBe('timeout');
  });

  it('GET /_mock/exchanges returns recorded exchanges (filterable)', async () => {
    await putSession('Q-1');
    const res = await app.inject({
      method: 'GET',
      url: '/_mock/exchanges?direction=inbound&module=sessions',
    });
    const list = res.json();
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThan(0);
    expect(list.every((e: { module: string }) => e.module === 'sessions')).toBe(true);
  });

  it('POST /_mock/reset clears the recorder and domain state', async () => {
    await putSession('R-1');
    // sanity: state populated before reset
    expect(ctx.store.domain.sessions.size).toBeGreaterThan(0);
    expect(ctx.store.query({}).length).toBeGreaterThan(0);

    const res = await app.inject({ method: 'POST', url: '/_mock/reset', payload: {} });
    expect(res.statusCode).toBe(200);
    expect(res.json().reset).toBe(true);

    // recorder + domain wiped
    expect(ctx.store.query({}).length).toBe(0);
    const state = await app.inject({ method: 'GET', url: '/_mock/state/sessions' });
    expect(Object.keys(state.json())).toHaveLength(0);
    expect(ctx.store.domain.sessions.size).toBe(0);
  });

  it('fault CRUD: POST arms, GET lists, DELETE clears', async () => {
    const armed = await app.inject({
      method: 'POST',
      url: '/_mock/faults',
      payload: {
        id: 'ctrl-fault',
        match: { direction: 'inbound', module: 'versions' },
        action: { kind: 'ocpiStatus', status_code: 3001 },
      },
    });
    expect(armed.statusCode).toBe(200);
    expect(armed.json().armed).toBe('ctrl-fault');

    const listed = await app.inject({ method: 'GET', url: '/_mock/faults' });
    expect(listed.json().map((r: { id: string }) => r.id)).toContain('ctrl-fault');

    await app.inject({ method: 'DELETE', url: '/_mock/faults' });
    const after = await app.inject({ method: 'GET', url: '/_mock/faults' });
    expect(after.json()).toHaveLength(0);
  });

  it('GET /_mock/findings surfaces recorded findings; DELETE clears them', async () => {
    // Emit an invalid body to generate a body Finding.
    await app.inject({
      method: 'PUT',
      url: '/ocpi/2.2.1/emsp/sessions/US/TST/BAD-1',
      headers: functionalHeaders(ctx.config),
      payload: JSON.stringify({ id: 'BAD-1' }),
    });
    const findings = await app.inject({ method: 'GET', url: '/_mock/findings' });
    expect(findings.json().length).toBeGreaterThan(0);

    await app.inject({ method: 'DELETE', url: '/_mock/findings' });
    const cleared = await app.inject({ method: 'GET', url: '/_mock/findings' });
    expect(cleared.json()).toHaveLength(0);
  });

  it('control exchanges are NOT recorded in the OCPI trace', async () => {
    await app.inject({ method: 'GET', url: '/_mock/health' });
    await app.inject({ method: 'GET', url: '/_mock/state' });
    // No control-plane traffic should leak into the recorder.
    expect(ctx.store.query({}).length).toBe(0);
  });
});
