// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// The Actor's full Command flow, Citrine-free: OcpiClient.sendCommand
// POSTs to the (stub) CPO and gets a sync CommandResponse; later the CPO POSTs
// the async CommandResult to the response_url the mock advertised, and
// awaitResult() (= store.waitForReceived on that url) resolves. This stitches the
// outbound send to the inbound callback through the recorder's flow chain.
// ============================================================================
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import type { MockContext } from '../src/core/types.js';
import { CommandType } from '../src/ocpi/barrel.js';
import {
  makeServer,
  startStubCpo,
  ocpiEnvelope,
  authHeader,
  SEED_TOKEN_WE_ACCEPT,
  type StubCpo,
} from './harness.js';

describe('Actor: command send + async result callback', () => {
  let app: FastifyInstance;
  let ctx: MockContext;
  let cpo: StubCpo;

  beforeEach(async () => {
    cpo = await startStubCpo((req) => {
      if (req.method === 'POST' && req.path === '/ocpi/2.2.1/commands/START_SESSION') {
        return { json: ocpiEnvelope({ result: 'ACCEPTED', timeout: 30 }) };
      }
      return undefined;
    });
    ({ app, ctx } = makeServer({
      citrineOcpiBaseUrl: cpo.baseUrl,
      // publicBaseUrl still points at the advertised host; the response_url path is
      // what matters for the in-process callback + waitForReceived correlation.
    }));
    await app.ready();
  });
  afterEach(async () => {
    await app.close();
    await cpo.close();
  });

  it('sends a command, records the pending command, and awaits the async result', async () => {
    const result = await ctx.client.sendCommand(CommandType.START_SESSION, {
      token: {
        uid: 'RFID-1',
        type: 'RFID',
        contract_id: 'C1',
        country_code: 'US',
        party_id: 'TST',
      },
      location_id: 'LOC1',
    });

    // ---- sync CommandResponse from the (stub) CPO -----------------------
    expect((result.sync as { result: string }).result).toBe('ACCEPTED');
    expect(result.responseUrl).toContain('/2.2.1/emsp/commands/START_SESSION/');

    // ---- pending command tracked for correlation ------------------------
    expect(ctx.store.domain.commands.size).toBe(1);
    const commandId = result.responseUrl.split('/').pop()!;
    expect(ctx.store.domain.commands.get(commandId)?.type).toBe(CommandType.START_SESSION);

    // ---- the outbound POST was recorded + validated ---------------------
    const outbound = ctx.store.query({ direction: 'outbound', operation: 'command.START_SESSION' });
    expect(outbound).toHaveLength(1);
    expect(outbound[0].validation.ok).not.toBe(false);

    // ---- register the awaiter, then simulate Citrine's async callback ---
    const awaiting = result.awaitResult(3000);
    const callbackPath = new URL(result.responseUrl).pathname; // /ocpi/2.2.1/emsp/commands/START_SESSION/{id}
    const cb = await app.inject({
      method: 'POST',
      url: callbackPath,
      headers: {
        authorization: authHeader(SEED_TOKEN_WE_ACCEPT),
        'content-type': 'application/json',
        'x-request-id': 'cb-req',
        'x-correlation-id': 'cb-cor',
      },
      payload: JSON.stringify({ result: 'ACCEPTED' }),
    });
    expect(cb.statusCode).toBe(200);
    expect(cb.json().status_code).toBe(1000);

    // ---- awaitResult resolves with the inbound callback exchange --------
    const ex = await awaiting;
    expect(ex.direction).toBe('inbound');
    expect(ex.operation).toBe('commands.result');
    expect((ex.request.body as { result: string }).result).toBe('ACCEPTED');
    // flow-stitched back to the original send
    expect(ex.flowId).toBe(commandId);
    expect(ex.validation.ok).toBe(true);
  });
});
