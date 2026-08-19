// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// MemoryStore on its own: ring-buffer eviction, every ExchangeFilter field
// through query(), waitForReceived timing, and reset().
import { describe, expect, it } from 'vitest';
import type { Exchange, ExchangeFilter, Store } from '../src/core/types.js';
import { createStore } from '../src/core/Store.js';
import { ModuleId } from '../src/ocpi/barrel.js';
import { makeConfig } from './harness.js';

// Mirrors the private RING_CAP in src/core/Store.ts.
const RING_CAP = 10_000;

interface Shape {
  direction?: Exchange['direction'];
  module?: Exchange['module'];
  operation?: string;
  method?: string;
  path?: string;
  url?: string;
  httpStatus?: number;
  ocpiStatusCode?: number;
  validationOk?: boolean;
  from?: { cc: string; party: string };
  to?: { cc: string; party: string };
  requestBody?: unknown;
  responseBody?: unknown;
}

function push(store: Store, s: Shape = {}): Exchange {
  const ex = store.open({
    direction: s.direction ?? 'inbound',
    module: s.module ?? ModuleId.Sessions,
    operation: s.operation ?? 'sessions.put',
  });
  ex.request.method = s.method ?? 'PUT';
  ex.request.path = s.path ?? '/ocpi/2.2.1/emsp/sessions/US/TST/S1';
  ex.request.url = s.url ?? `http://127.0.0.1${ex.request.path}`;
  ex.request.body = s.requestBody;
  ex.request.ocpi = { from: s.from, to: s.to };
  ex.response = {
    httpStatus: s.httpStatus ?? 200,
    headers: {},
    body: s.responseBody,
    ocpiStatusCode: s.ocpiStatusCode,
  };
  if (s.validationOk !== undefined) ex.validation = { ok: s.validationOk };
  return store.record(ex);
}

describe('Store ring buffer', () => {
  it('caps at RING_CAP, evicting the oldest first', () => {
    const store = createStore(makeConfig());
    const ids: string[] = [];
    const extra = 5;
    for (let i = 0; i < RING_CAP + extra; i++) {
      ids.push(push(store).id);
    }
    expect(store.count()).toBe(RING_CAP);

    const all = store.query({});
    expect(all).toHaveLength(RING_CAP);
    // The first `extra` are gone, everything after them survived in order.
    for (let i = 0; i < extra; i++) expect(store.get(ids[i])).toBeUndefined();
    expect(all[0].id).toBe(ids[extra]);
    expect(all[all.length - 1].id).toBe(ids[ids.length - 1]);
    expect(store.get(ids[extra])).toBeDefined();
    expect(store.get(ids[ids.length - 1])).toBeDefined();
    expect(store.maxSeq()).toBe(all[all.length - 1].seq);
    expect(store.maxSeq()).toBeGreaterThan(all[0].seq);
  });

  it('record() is idempotent per id and count/maxSeq stay cheap and consistent', () => {
    const store = createStore(makeConfig());
    expect(store.count()).toBe(0);
    expect(store.maxSeq()).toBe(0);
    const a = push(store);
    const b = push(store);
    store.record(a); // same id again: not duplicated
    expect(store.count()).toBe(2);
    expect(store.maxSeq()).toBe(b.seq);
    expect(b.seq).toBeGreaterThan(a.seq);
    expect(store.get(a.id)).toBe(a);
  });
});

describe('Store.query filters', () => {
  function seed(): { store: Store; a: Exchange; b: Exchange; c: Exchange; d: Exchange } {
    const store = createStore(makeConfig());
    const a = push(store, {
      direction: 'inbound',
      module: ModuleId.Sessions,
      operation: 'sessions.put',
      method: 'PUT',
      path: '/ocpi/2.2.1/emsp/sessions/US/TST/S1',
      httpStatus: 200,
      ocpiStatusCode: 1000,
      validationOk: true,
      from: { cc: 'US', party: 'S44' },
      to: { cc: 'US', party: 'TST' },
      requestBody: { id: 'S1', cdr_token: { uid: 'T1', type: 'RFID' }, kwh: 1 },
      responseBody: { status_code: 1000 },
    });
    const b = push(store, {
      direction: 'inbound',
      module: ModuleId.Cdrs,
      operation: 'cdrs.post',
      method: 'POST',
      path: '/ocpi/2.2.1/emsp/cdrs',
      httpStatus: 400,
      ocpiStatusCode: 2001,
      validationOk: false,
      from: { cc: 'DE', party: 'CPO' },
      to: { cc: 'US', party: 'TST' },
      requestBody: { id: 'C1', tags: ['x', 'y'] },
      responseBody: { status_code: 2001 },
    });
    const c = push(store, {
      direction: 'outbound',
      module: ModuleId.Commands,
      operation: 'command.START_SESSION',
      method: 'post',
      path: '/ocpi/2.2.1/commands/START_SESSION',
      url: 'http://cpo.example/ocpi/2.2.1/commands/START_SESSION',
      httpStatus: 200,
      ocpiStatusCode: 1000,
      from: { cc: 'US', party: 'TST' },
      to: { cc: 'US', party: 'S44' },
      requestBody: { response_url: 'http://x', token: { uid: 'T1' } },
      responseBody: { data: { result: 'ACCEPTED' } },
    });
    const d = push(store, {
      direction: 'outbound',
      module: ModuleId.Versions,
      operation: 'versions.list',
      method: 'GET',
      path: '/ocpi/versions',
      httpStatus: 0,
    });
    return { store, a, b, c, d };
  }

  const ids = (list: Exchange[]): string[] => list.map((e) => e.id);

  it('returns everything in seq order with an empty filter', () => {
    const { store, a, b, c, d } = seed();
    expect(ids(store.query({}))).toEqual([a.id, b.id, c.id, d.id]);
  });

  it('direction', () => {
    const { store, a, b, c, d } = seed();
    expect(ids(store.query({ direction: 'inbound' }))).toEqual([a.id, b.id]);
    expect(ids(store.query({ direction: 'outbound' }))).toEqual([c.id, d.id]);
  });

  it('module and operation', () => {
    const { store, b, c } = seed();
    expect(ids(store.query({ module: ModuleId.Cdrs }))).toEqual([b.id]);
    expect(ids(store.query({ operation: 'command.START_SESSION' }))).toEqual([c.id]);
    expect(store.query({ module: ModuleId.Sessions, operation: 'cdrs.post' })).toEqual([]);
  });

  it('method is compared case-insensitively', () => {
    const { store, b, c } = seed();
    expect(ids(store.query({ method: 'POST' }))).toEqual([b.id, c.id]);
    expect(ids(store.query({ method: 'post' }))).toEqual([b.id, c.id]);
    expect(store.query({ method: 'DELETE' })).toEqual([]);
  });

  it('pathMatches is a regex tested against path or full url', () => {
    const { store, a, b, c } = seed();
    expect(ids(store.query({ pathMatches: '/emsp/' }))).toEqual([a.id, b.id]);
    expect(ids(store.query({ pathMatches: 'sessions/US/TST/S\\d$' }))).toEqual([a.id]);
    expect(ids(store.query({ pathMatches: '^http://cpo\\.example' }))).toEqual([c.id]);
    // An invalid regex matches nothing instead of throwing.
    expect(store.query({ pathMatches: '(' })).toEqual([]);
  });

  it('minSeq is an inclusive cursor', () => {
    const { store, b, c, d } = seed();
    expect(ids(store.query({ minSeq: b.seq }))).toEqual([b.id, c.id, d.id]);
    expect(ids(store.query({ minSeq: d.seq + 1 }))).toEqual([]);
  });

  it('httpStatus / ocpiStatusCode / validationOk', () => {
    const { store, a, b, c, d } = seed();
    expect(ids(store.query({ httpStatus: 200 }))).toEqual([a.id, c.id]);
    expect(ids(store.query({ httpStatus: 0 }))).toEqual([d.id]);
    expect(ids(store.query({ ocpiStatusCode: 2001 }))).toEqual([b.id]);
    expect(ids(store.query({ validationOk: false }))).toEqual([b.id]);
    // open() defaults validation to ok:true, so c and d count as ok too.
    expect(ids(store.query({ validationOk: true }))).toEqual([a.id, c.id, d.id]);
  });

  it('from / to routing parties (each sub-field optional)', () => {
    const { store, a, b, c } = seed();
    expect(ids(store.query({ from: { party: 'S44' } }))).toEqual([a.id]);
    expect(ids(store.query({ from: { cc: 'DE' } }))).toEqual([b.id]);
    expect(ids(store.query({ to: { cc: 'US', party: 'TST' } }))).toEqual([a.id, b.id]);
    expect(ids(store.query({ to: { party: 'S44' } }))).toEqual([c.id]);
    expect(store.query({ from: { cc: 'US', party: 'CPO' } })).toEqual([]);
    // An exchange without routing info never matches a from/to constraint.
    expect(ids(store.query({ direction: 'outbound', from: { cc: 'US' } }))).toEqual([c.id]);
  });

  it('bodyMatch is a deep partial match on request or response body', () => {
    const { store, a, b, c } = seed();
    expect(ids(store.query({ bodyMatch: { id: 'S1' } }))).toEqual([a.id]);
    // nested anywhere
    expect(ids(store.query({ bodyMatch: { uid: 'T1' } }))).toEqual([a.id, c.id]);
    expect(ids(store.query({ bodyMatch: { cdr_token: { type: 'RFID' } } }))).toEqual([a.id]);
    // arrays: every needle element must appear somewhere in the target array
    expect(ids(store.query({ bodyMatch: { tags: ['y'] } }))).toEqual([b.id]);
    expect(store.query({ bodyMatch: { tags: ['z'] } })).toEqual([]);
    // response side
    expect(ids(store.query({ bodyMatch: { result: 'ACCEPTED' } }))).toEqual([c.id]);
    expect(ids(store.query({ bodyMatch: { status_code: 2001 } }))).toEqual([b.id]);
    // exact value, not coercion
    expect(store.query({ bodyMatch: { kwh: '1' } })).toEqual([]);
  });

  it('limit / offset page through the matched, sorted list', () => {
    const { store, a, b, c, d } = seed();
    expect(ids(store.query({ limit: 2 }))).toEqual([a.id, b.id]);
    expect(ids(store.query({ offset: 1, limit: 2 }))).toEqual([b.id, c.id]);
    expect(ids(store.query({ offset: 3 }))).toEqual([d.id]);
    expect(store.query({ offset: 10 })).toEqual([]);
    expect(ids(store.query({ direction: 'outbound', offset: 1 }))).toEqual([d.id]);
  });

  it('constraints combine with AND', () => {
    const { store, a } = seed();
    const f: ExchangeFilter = {
      direction: 'inbound',
      module: ModuleId.Sessions,
      method: 'put',
      httpStatus: 200,
      from: { party: 'S44' },
      bodyMatch: { id: 'S1' },
    };
    expect(ids(store.query(f))).toEqual([a.id]);
    expect(store.query({ ...f, module: ModuleId.Cdrs })).toEqual([]);
  });
});

describe('Store.waitForReceived', () => {
  it('resolves immediately with the oldest already-buffered match at or after minSeq', async () => {
    const store = createStore(makeConfig());
    const first = push(store, { module: ModuleId.Sessions });
    const second = push(store, { module: ModuleId.Sessions });
    push(store, { module: ModuleId.Cdrs });

    await expect(store.waitForReceived({ module: ModuleId.Sessions }, 50)).resolves.toBe(first);
    await expect(
      store.waitForReceived({ module: ModuleId.Sessions, minSeq: second.seq }, 50),
    ).resolves.toBe(second);
  });

  it('resolves when a matching exchange is recorded later', async () => {
    const store = createStore(makeConfig());
    const pending = store.waitForReceived(
      { direction: 'outbound', module: ModuleId.Commands },
      1000,
    );
    push(store, { direction: 'inbound', module: ModuleId.Commands }); // wrong direction, keep waiting
    const hit = push(store, { direction: 'outbound', module: ModuleId.Commands });
    await expect(pending).resolves.toBe(hit);
  });

  it('rejects after the timeout with the filter and nearMisses attached', async () => {
    const store = createStore(makeConfig());
    for (let i = 0; i < 7; i++) push(store, { module: ModuleId.Sessions, path: `/s/${i}` });
    push(store, { direction: 'outbound', module: ModuleId.Versions, path: '/out' });

    const filter: ExchangeFilter = { direction: 'inbound', module: ModuleId.Cdrs, method: 'POST' };
    const started = Date.now();
    let caught: (Error & { nearMisses?: unknown[]; filter?: ExchangeFilter }) | undefined;
    try {
      await store.waitForReceived(filter, 100);
    } catch (err) {
      caught = err as typeof caught;
    }
    expect(Date.now() - started).toBeGreaterThanOrEqual(90);
    expect(caught).toBeInstanceOf(Error);
    expect(caught!.message).toContain('timed out after 100ms');
    expect(caught!.filter).toEqual(filter);
    // Last five same-direction exchanges, newest last, each explaining the mismatch.
    const near = caught!.nearMisses as Array<{ path: string; differsBy: string[] }>;
    expect(near).toHaveLength(5);
    expect(near.map((n) => n.path)).toEqual(['/s/2', '/s/3', '/s/4', '/s/5', '/s/6']);
    expect(near[0].differsBy).toEqual(['module=sessions', 'method=PUT']);
  });
});

describe('Store.reset', () => {
  it('clears exchanges, findings, domain and rejects pending waiters', async () => {
    const store = createStore(makeConfig());
    push(store);
    store.addFinding({
      severity: 'warn',
      kind: 'body',
      module: ModuleId.Sessions,
      seq: 1,
      detail: 'x',
    });
    store.domain.sessions.set('S1', { id: 'S1' });
    store.domain.registration.status = 'unregistered';
    store.domain.registration.tokenWeAccept = 'rotated';
    const pending = store.waitForReceived({ module: ModuleId.Cdrs }, 5000);

    store.reset();

    await expect(pending).rejects.toThrow('store reset');
    expect(store.count()).toBe(0);
    expect(store.query({})).toEqual([]);
    expect(store.findings).toEqual([]);
    expect(store.domain.sessions.size).toBe(0);
    // Registration goes back to the seeded bootstrap state.
    expect(store.domain.registration.status).toBe('registered');
    expect(store.domain.registration.tokenWeAccept).toBe(makeConfig().bootstrapTokenWeAccept);
  });

  it('keepRegistration keeps the live registration object but wipes the rest', () => {
    const store = createStore(makeConfig());
    const reg = store.domain.registration;
    reg.status = 'unregistered';
    reg.tokenWePresent = 'live-token';
    reg.cpoEndpoints = [{ identifier: 'credentials', role: 'SENDER', url: 'http://x' }];
    push(store);
    store.domain.cdrs.set('C1', {});

    store.reset({ keepRegistration: true });

    expect(store.domain.registration).toBe(reg);
    expect(store.domain.registration.tokenWePresent).toBe('live-token');
    expect(store.domain.registration.cpoEndpoints).toHaveLength(1);
    expect(store.count()).toBe(0);
    expect(store.domain.cdrs.size).toBe(0);
  });
});
