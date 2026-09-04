// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// Injected faults via the FaultEngine (the Adversary). With no fault armed
//     the mock emits its clean baseline; once a rule is armed the dispatcher
//     perturbs exactly that response and stamps exchange.fault. Proves the
//     adversary is inert by default and manifests on the wire when armed.
// ============================================================================
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { ModuleId } from '@citrineos/ocpi-base';
import type { MockContext, FaultRule } from '../src/core/types.js';
import {
  makeServer,
  registrationHeaders,
  functionalHeaders,
  validSession,
  SEED_TOKEN_WE_ACCEPT,
} from './harness.js';

describe('FaultEngine injection', () => {
  let app: FastifyInstance;
  let ctx: MockContext;

  beforeEach(async () => {
    ({ app, ctx } = makeServer());
    await app.ready();
  });
  afterEach(async () => {
    await app.close();
  });

  it('baseline (no fault): versions.list returns a clean 1000 envelope', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/ocpi/versions',
      headers: registrationHeaders(SEED_TOKEN_WE_ACCEPT),
    });
    expect(res.json().status_code).toBe(1000);
    const ex = ctx.store.query({ direction: 'inbound', operation: 'versions.list' }).at(-1)!;
    expect(ex.fault).toBeUndefined();
  });

  it('ocpiStatus fault forces a wrong OCPI status_code (3001) into the envelope', async () => {
    const rule: FaultRule = {
      id: 'force-3001',
      enabled: true,
      match: { direction: 'inbound', module: 'versions', method: 'GET' },
      action: { kind: 'ocpiStatus', status_code: 3001, status_message: 'injected server error' },
    };
    ctx.faults.arm(rule);

    const res = await app.inject({
      method: 'GET',
      url: '/ocpi/versions',
      headers: registrationHeaders(SEED_TOKEN_WE_ACCEPT),
    });

    // The envelope is still well-formed HTTP 200, but the OCPI code is wrong.
    expect(res.statusCode).toBe(200);
    expect(res.json().status_code).toBe(3001);

    const ex = ctx.store.query({ direction: 'inbound', operation: 'versions.list' }).at(-1)!;
    expect(ex.fault).toBeDefined();
    expect(ex.fault!.ruleId).toBe('force-3001');
    expect(ex.fault!.kind).toBe('ocpiStatus');
    expect(ex.response.ocpiStatusCode).toBe(3001);
  });

  it('httpStatus fault returns a non-2xx HTTP status', async () => {
    ctx.faults.arm({
      id: 'force-503',
      enabled: true,
      match: { direction: 'inbound', module: 'versions', method: 'GET' },
      action: {
        kind: 'httpStatus',
        status: 503,
        body: { status_code: 3000, timestamp: new Date().toISOString() },
      },
    });

    const res = await app.inject({
      method: 'GET',
      url: '/ocpi/versions',
      headers: registrationHeaders(SEED_TOKEN_WE_ACCEPT),
    });
    expect(res.statusCode).toBe(503);
    const ex = ctx.store.query({ direction: 'inbound', operation: 'versions.list' }).at(-1)!;
    expect(ex.fault!.kind).toBe('httpStatus');
  });

  it('malformBody(dropRequired) removes status_code -> a malformed envelope on the wire', async () => {
    ctx.faults.arm({
      id: 'drop-status-code',
      enabled: true,
      match: { direction: 'inbound', module: ModuleId.Sessions, method: 'PUT' },
      action: { kind: 'malformBody', mutation: 'dropRequired', targetPath: 'status_code' },
    });

    const res = await app.inject({
      method: 'PUT',
      url: '/ocpi/2.2.1/emsp/sessions/US/TST/SESSION-1',
      headers: functionalHeaders(ctx.config),
      payload: JSON.stringify(validSession()),
    });

    const body = res.json();
    expect(body.status_code).toBeUndefined(); // required key stripped by the fault
    const ex = ctx.store.query({ direction: 'inbound', operation: 'sessions.put' }).at(-1)!;
    expect(ex.fault!.kind).toBe('malformBody');
  });

  it('scoped fault (times:1) fires once then stops', async () => {
    ctx.faults.arm({
      id: 'once',
      enabled: true,
      match: { direction: 'inbound', module: 'versions', method: 'GET' },
      scope: { times: 1 },
      action: { kind: 'ocpiStatus', status_code: 3001 },
    });

    const first = await app.inject({
      method: 'GET',
      url: '/ocpi/versions',
      headers: registrationHeaders(),
    });
    const second = await app.inject({
      method: 'GET',
      url: '/ocpi/versions',
      headers: registrationHeaders(),
    });

    expect(first.json().status_code).toBe(3001); // faulted
    expect(second.json().status_code).toBe(1000); // scope exhausted -> clean
  });

  it('disarming a fault restores the clean baseline', async () => {
    ctx.faults.arm({
      id: 'temp',
      enabled: true,
      match: { direction: 'inbound', module: 'versions', method: 'GET' },
      action: { kind: 'ocpiStatus', status_code: 3001 },
    });
    ctx.faults.disarm('temp');
    const res = await app.inject({
      method: 'GET',
      url: '/ocpi/versions',
      headers: registrationHeaders(),
    });
    expect(res.json().status_code).toBe(1000);
  });
});
