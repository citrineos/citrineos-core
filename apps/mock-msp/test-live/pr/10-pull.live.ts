// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// The Actor pulling Citrine's SENDER endpoints: every list answers 2xx and
// parses against the ocpi-base schemas, except where a documented defect is
// allowlisted.
import { describe, expect, it } from 'vitest';
import type { Exchange } from '../../src/core/types.js';
import { classify } from '../support/known-findings.js';
import { ctl, ctlGet } from '../support/live-client.js';

function unexplained(ex: Exchange): string[] {
  return ex.findings.filter((f) => f.severity === 'error' && !classify(f)).map((f) => f.detail);
}

describe('pulls', () => {
  for (const module of ['locations', 'tariffs', 'sessions', 'cdrs']) {
    it(`pull ${module}`, async () => {
      const r = await ctl<{ pulled: string; exchange: Exchange }>(`/pull/${module}`, {});
      expect(r.status).toBe(200);
      expect(r.body.pulled).toBe(module);
      const ex = r.body.exchange;
      expect(ex.direction).toBe('outbound');
      expect(ex.response.httpStatus).toBe(200);
      expect(unexplained(ex)).toEqual([]);
    });
  }

  it('discover/evse resolves the seeded station', async () => {
    const r = await ctlGet<any>('/discover/evse');
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({
      discovered: true,
      location_id: '1',
      evse_uid: 'cp001::1',
      connector_id: '1',
    });
  });
});
