// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// WireLogger output: NDJSON lines on stdout, pretty lines on stderr, redaction,
// child bindings, and the MOCK_MSP_NDJSON switch in buildContext.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import type { Exchange, Store } from '../src/core/types.js';
import { createWireLogger } from '../src/core/wireLog.js';
import { createStore } from '../src/core/Store.js';
import { ModuleId } from '../src/ocpi/barrel.js';
import { buildContext } from '../src/context.js';
import { buildServer } from '../src/server.js';
import { resetScenarioRuntime } from '../src/control/scenario.js';
import { makeConfig, registrationHeaders } from './harness.js';

function sampleExchange(store: Store, overrides: Partial<Exchange> = {}): Exchange {
  const ex = store.open({
    direction: 'inbound',
    module: ModuleId.Sessions,
    operation: 'sessions.put',
  });
  ex.request = {
    method: 'PUT',
    url: 'http://127.0.0.1/ocpi/2.2.1/emsp/sessions/US/TST/S1?x=1',
    path: '/ocpi/2.2.1/emsp/sessions/US/TST/S1',
    query: { x: '1' },
    headers: { Authorization: 'Token abc', 'x-request-id': 'r1', 'Content-Type': 'json' },
    rawBody: '{"id":"S1"}',
    body: { id: 'S1' },
    ocpi: { requestId: 'r1', token: 'secret-token-value', from: { cc: 'US', party: 'S44' } },
  };
  ex.response = {
    httpStatus: 200,
    headers: { 'content-type': 'application/json' },
    body: { status_code: 1000 },
    ocpiStatusCode: 1000,
  };
  ex.timing = { receivedAt: ex.timing.receivedAt, respondedAt: 'later', durationMs: 3 };
  return { ...ex, ...overrides };
}

describe('WireLogger', () => {
  let stdoutLines: string[];
  let stderrLines: string[];
  let restoreStdout: () => void;

  beforeEach(() => {
    stdoutLines = [];
    stderrLines = [];
    const original = process.stdout.write.bind(process.stdout);
    process.stdout.write = ((chunk: unknown) => {
      stdoutLines.push(String(chunk));
      return true;
    }) as typeof process.stdout.write;
    restoreStdout = () => {
      process.stdout.write = original;
    };
    vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      stderrLines.push(args.map(String).join(' '));
    });
  });
  afterEach(() => {
    restoreStdout();
    vi.restoreAllMocks();
  });

  it('ndjson: one JSON line per recorded exchange with the redacted wire fields', () => {
    const store = createStore(makeConfig());
    const log = createWireLogger({ ndjson: true, pretty: false, bindings: { party: 'US/TST' } });
    const ex = sampleExchange(store);

    log.record(ex);

    expect(stdoutLines).toHaveLength(1);
    expect(stdoutLines[0].endsWith('\n')).toBe(true);
    const line = JSON.parse(stdoutLines[0]);
    expect(line).toMatchObject({
      party: 'US/TST',
      seq: ex.seq,
      id: ex.id,
      direction: 'inbound',
      module: ModuleId.Sessions,
      operation: 'sessions.put',
      request: {
        method: 'PUT',
        url: ex.request.url,
        path: ex.request.path,
        query: { x: '1' },
        headers: { Authorization: 'Token ***', 'x-request-id': 'r1', 'Content-Type': 'json' },
        body: { id: 'S1' },
        ocpi: { requestId: 'r1', token: 'sec***', from: { cc: 'US', party: 'S44' } },
      },
      response: { httpStatus: 200, ocpiStatusCode: 1000, body: { status_code: 1000 } },
      validation: { ok: true },
      findings: [],
      timing: { durationMs: 3 },
    });
    // rawBody is deliberately not part of the structured line.
    expect(line.request).not.toHaveProperty('rawBody');
    expect(line).not.toHaveProperty('fault');
    expect(stderrLines).toHaveLength(0);

    log.record(sampleExchange(store));
    log.record(sampleExchange(store));
    expect(stdoutLines).toHaveLength(3);
  });

  it('ndjson: short tokens are fully redacted, fault + flowId are carried through', () => {
    const store = createStore(makeConfig());
    const log = createWireLogger({ ndjson: true, pretty: false });
    const ex = sampleExchange(store, {
      flowId: 'flow-1',
      fault: { ruleId: 'r', kind: 'delay', detail: { ms: 5 } },
    });
    ex.request.ocpi.token = 'abcdef';
    log.record(ex);
    const line = JSON.parse(stdoutLines[0]);
    expect(line.request.ocpi.token).toBe('***');
    expect(line.flowId).toBe('flow-1');
    expect(line.fault).toEqual({ ruleId: 'r', kind: 'delay', detail: { ms: 5 } });
    expect(line.party).toBeUndefined();
  });

  it('pretty (default on) writes a one-line summary to stderr and nothing to stdout', () => {
    const store = createStore(makeConfig());
    const log = createWireLogger({});
    const ex = sampleExchange(store, {
      validation: { ok: false, issues: [] },
      fault: { ruleId: 'r', kind: 'ocpiStatus', detail: {} },
      findings: [
        { severity: 'warn', kind: 'body', module: ModuleId.Sessions, seq: 1, detail: 'x' },
        { severity: 'warn', kind: 'body', module: ModuleId.Sessions, seq: 1, detail: 'y' },
      ],
    });
    log.record(ex);
    expect(stdoutLines).toHaveLength(0);
    expect(stderrLines).toHaveLength(1);
    expect(stderrLines[0]).toBe(
      `[wire] <-- PUT /ocpi/2.2.1/emsp/sessions/US/TST/S1 -> 200 ocpi=1000 INVALID FAULT:ocpiStatus findings:2 req=r1 3ms seq=${ex.seq}`,
    );
  });

  it('pretty: outbound arrow and dashes for a never-sent exchange', () => {
    const store = createStore(makeConfig());
    const log = createWireLogger({ pretty: true });
    const ex = sampleExchange(store, { direction: 'outbound' });
    ex.response = { httpStatus: 0, headers: {}, body: undefined };
    ex.request.ocpi.requestId = undefined;
    ex.timing = { receivedAt: ex.timing.receivedAt };
    log.record(ex);
    expect(stderrLines[0]).toBe(
      `[wire] --> PUT /ocpi/2.2.1/emsp/sessions/US/TST/S1 -> - ocpi=- seq=${ex.seq}`,
    );
  });

  it('pretty off + ndjson off emits nothing at all', () => {
    const store = createStore(makeConfig());
    const log = createWireLogger({ pretty: false, ndjson: false });
    log.record(sampleExchange(store));
    log.record(sampleExchange(store));
    expect(stdoutLines).toHaveLength(0);
    expect(stderrLines).toHaveLength(0);
  });

  it('child() merges bindings into every NDJSON line without touching the parent', () => {
    const store = createStore(makeConfig());
    const parent = createWireLogger({ ndjson: true, pretty: false, bindings: { party: 'US/TST' } });
    const child = parent.child({ scenario: 'unregistered', party: 'XX/YYY' });

    child.record(sampleExchange(store));
    parent.record(sampleExchange(store));

    const [childLine, parentLine] = stdoutLines.map((l) => JSON.parse(l));
    expect(childLine.scenario).toBe('unregistered');
    expect(childLine.party).toBe('XX/YYY');
    expect(parentLine.scenario).toBeUndefined();
    expect(parentLine.party).toBe('US/TST');
  });
});

describe('buildContext wiring (MOCK_MSP_NDJSON)', () => {
  let app: FastifyInstance | undefined;
  let stdoutLines: string[];
  let restoreStdout: () => void;
  const savedEnv = process.env.MOCK_MSP_NDJSON;

  beforeEach(() => {
    stdoutLines = [];
    const original = process.stdout.write.bind(process.stdout);
    process.stdout.write = ((chunk: unknown) => {
      stdoutLines.push(String(chunk));
      return true;
    }) as typeof process.stdout.write;
    restoreStdout = () => {
      process.stdout.write = original;
    };
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(async () => {
    await app?.close();
    app = undefined;
    restoreStdout();
    vi.restoreAllMocks();
    if (savedEnv === undefined) delete process.env.MOCK_MSP_NDJSON;
    else process.env.MOCK_MSP_NDJSON = savedEnv;
  });

  async function boot(ndjson: string | undefined): Promise<FastifyInstance> {
    if (ndjson === undefined) delete process.env.MOCK_MSP_NDJSON;
    else process.env.MOCK_MSP_NDJSON = ndjson;
    resetScenarioRuntime();
    const ctx = buildContext(makeConfig());
    app = buildServer(ctx);
    await app.ready();
    return app;
  }

  it('MOCK_MSP_NDJSON=1: OCPI exchanges are emitted, control calls are not', async () => {
    const server = await boot('1');
    await server.inject({ method: 'GET', url: '/_mock/health' });
    await server.inject({ method: 'GET', url: '/_mock/exchanges' });
    expect(stdoutLines).toHaveLength(0);

    await server.inject({ method: 'GET', url: '/ocpi/versions', headers: registrationHeaders() });
    const jsonLines = stdoutLines.filter((l) => l.startsWith('{'));
    expect(jsonLines).toHaveLength(1);
    const line = JSON.parse(jsonLines[0]);
    expect(line.party).toBe('US/TST');
    expect(line.direction).toBe('inbound');
    expect(line.operation).toBe('versions.list');
    expect(line.request.headers.authorization).toBe('Token ***');

    // Control traffic after the fact still stays off the wire log.
    await server.inject({ method: 'POST', url: '/_mock/reset', payload: {} });
    expect(stdoutLines.filter((l) => l.startsWith('{'))).toHaveLength(1);
  });

  it('MOCK_MSP_NDJSON unset: nothing on stdout', async () => {
    const server = await boot(undefined);
    await server.inject({ method: 'GET', url: '/ocpi/versions', headers: registrationHeaders() });
    expect(stdoutLines.filter((l) => l.startsWith('{'))).toHaveLength(0);
  });

  it('MOCK_MSP_NDJSON=true is not the switch (only "1")', async () => {
    const server = await boot('true');
    await server.inject({ method: 'GET', url: '/ocpi/versions', headers: registrationHeaders() });
    expect(stdoutLines.filter((l) => l.startsWith('{'))).toHaveLength(0);
  });
});
