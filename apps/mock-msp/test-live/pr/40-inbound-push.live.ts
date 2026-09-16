// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// Citrine -> mock: a Hasura write fires Citrine's broadcaster, which calls our
// locations RECEIVER. This is what proves host.docker.internal, the routing
// headers and the inbound token on real traffic.
import { describe, expect, it } from 'vitest';
import { classify } from '../support/known-findings.js';
import { ctl, hasura, maxSeq, waitFor } from '../support/live-client.js';

describe('inbound push', () => {
  it('location-add ends up as a PUT on our locations receiver', async () => {
    const floor = await maxSeq();
    const p = await ctl<any>('/provoke/location-add', {});
    expect(p.status).toBe(200);
    expect(p.body.provoked).toBe(true);
    const ex = await waitFor(
      { direction: 'inbound', module: 'locations', method: 'PUT', minSeq: floor + 1 },
      30_000,
    );
    expect(ex.operation).toBe('locations.put.location');
    expect(ex.request.ocpi.from).toEqual({ cc: 'US', party: 'S44' });
    expect(ex.request.ocpi.to).toEqual({ cc: 'US', party: 'TST' });
    expect(ex.request.ocpi.tokenValid).not.toBe(false);
    expect(ex.response.httpStatus).toBe(200);
    expect((ex.request.body as any).id).toBeTruthy();
    const unexplained = ex.findings.filter((f) => f.severity === 'error' && !classify(f));
    expect(unexplained).toEqual([]);
  });

  it('location-nudge ends up as a PATCH', async () => {
    // nudge updates Location id=2; on a fresh DB the add above created it
    const row = await hasura<any>('{ Locations(where: {id: {_eq: 2}}) { id } }');
    if (!row.data?.Locations?.length) {
      expect((await ctl<any>('/provoke/location-add', {})).status).toBe(200);
    }
    const floor = await maxSeq();
    const p = await ctl<any>('/provoke/location-nudge', {});
    expect(p.status).toBe(200);
    expect(p.body.mutationSummary).toContain('affected_rows=1');
    const ex = await waitFor(
      { direction: 'inbound', module: 'locations', method: 'PATCH', minSeq: floor + 1 },
      30_000,
    );
    expect(ex.operation).toBe('locations.patch.location');
    expect(ex.request.path).toBe('/ocpi/2.2.1/emsp/locations/US/S44/2');
    expect(ex.response.httpStatus).toBe(200);
  });
});
