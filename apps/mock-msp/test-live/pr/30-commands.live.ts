// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// Commands towards Citrine with no charger online: the sync CommandResponse
// path. ACCEPTED and the async callback belong to the everest lane.
import { describe, expect, it } from 'vitest';
import { ctl, exchanges } from '../support/live-client.js';

const RESULTS = ['ACCEPTED', 'REJECTED', 'NOT_SUPPORTED', 'UNKNOWN_SESSION'];

describe('commands', () => {
  it('charge/start without a station online is not ACCEPTED', async () => {
    const r = await ctl<any>('/charge/start', { timeoutMs: 15_000 });
    expect(r.status).toBe(200);
    expect(r.body.command).toBe('START_SESSION');
    expect(RESULTS).toContain(r.body.sync.result);
    expect(r.body.sync.result).not.toBe('ACCEPTED');
    expect(r.body.commandResult).toBeUndefined();
    const ex = (await exchanges({ direction: 'outbound', operation: 'command.START_SESSION' })).at(
      -1,
    );
    expect(ex).toBeDefined();
    expect(ex!.response.httpStatus).toBe(200);
    expect(ex!.validation.ok).toBe(true);
  });

  for (const type of ['UNLOCK_CONNECTOR', 'RESERVE_NOW', 'CANCEL_RESERVATION']) {
    it(`${type} gets a schema-valid sync reply`, async () => {
      const r = await ctl<any>(`/commands/${type}`, {});
      expect(r.status).toBe(200);
      expect(r.body.command).toBe(type);
      expect(r.body.payloadValidation.ok).toBe(true);
      expect(RESULTS).toContain(r.body.sync.result);
      expect(r.body.responseUrl).toContain(`/2.2.1/emsp/commands/${type}/`);
    });
  }

  it('emit/command alias with an unknown session', async () => {
    const r = await ctl<any>('/emit/command', {
      type: 'STOP_SESSION',
      payload: { session_id: 'nope' },
    });
    expect(r.status).toBe(200);
    expect(RESULTS).toContain(r.body.sync.result);
    expect(r.body.sync.result).not.toBe('ACCEPTED');
  });

  it('unknown command type is a 400', async () => {
    const r = await ctl<any>('/commands/MAKE_COFFEE', {});
    expect(r.status).toBe(400);
    expect(r.body.error).toBe('unknown_command_type');
  });
});
