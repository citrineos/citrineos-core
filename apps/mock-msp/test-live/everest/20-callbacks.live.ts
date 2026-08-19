// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// What Citrine called back on us during the cycles: the async command results
// and, if real-time auth went through the mock, the authorize calls.
import { describe, expect, it } from 'vitest';
import { exchanges } from '../support/live-client.js';

describe('callbacks', () => {
  it('command results came back for START and STOP', async () => {
    const results = await exchanges({ direction: 'inbound', module: 'commands' });
    const types = results.map((e) => e.request.path.split('/').slice(-2)[0]);
    expect(types).toContain('START_SESSION');
    expect(types).toContain('STOP_SESSION');
    for (const e of results) {
      expect(e.response.httpStatus).toBe(200);
      expect(e.validation.ok).not.toBe(false);
    }
  });

  it('any real-time authorize was answered ALLOWED and parsed', async () => {
    const auths = await exchanges({ direction: 'inbound', operation: 'tokens.authorize' });
    for (const e of auths) {
      expect(e.response.httpStatus).toBe(200);
      expect(e.validation.ok).not.toBe(false);
      expect((e.response.body as any).data.allowed).toBe('ALLOWED');
    }
  });
});
