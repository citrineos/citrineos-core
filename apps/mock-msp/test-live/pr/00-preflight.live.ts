// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// Is the stack the one the rest of the live suite assumes: mock up and
// preregistered, Citrine OCPI + Hasura reachable, the seed rows in place.
import { describe, expect, it } from 'vitest';
import { ctlGet, exchanges, hasura, health } from '../support/live-client.js';

describe('preflight', () => {
  it('mock is up, registered, running the preregistered scenario', async () => {
    const h = await health();
    expect(h.status).toBe('up');
    expect(h.party).toBe('US/TST');
    expect(h.registration.status).toBe('registered');
    expect(h.scenario).toBe('preregistered');
  });

  it('status sees Citrine OCPI and Hasura, no charger', async () => {
    const r = await ctlGet<any>('/status?fresh=1');
    expect(r.status).toBe(200);
    expect(r.body.citrine.ocpi.state).toBe('up');
    expect(r.body.citrine.hasura.state).toBe('up');
    expect(['down', 'unavailable']).toContain(r.body.everest.state);
    expect(r.body.mock.defaults.evseUid).toBe('cp001::1');
    expect(r.body.mock.registration).toBe('registered');
  });

  it('seed rows are present', async () => {
    const r = await hasura<any>(`{
      TenantPartners(where: {partyId: {_eq: "TST"}, countryCode: {_eq: "US"}}) { id }
      Authorizations(where: {idToken: {_eq: "DEADBEEF"}}) { id status }
      ChargingStations(where: {ocppConnectionName: {_eq: "cp001"}}) { id }
      Locations(where: {id: {_eq: 1}}) { id }
    }`);
    expect(r.errors).toBeUndefined();
    expect(r.data.TenantPartners).toHaveLength(1);
    expect(r.data.Authorizations[0]?.status).toBe('Accepted');
    expect(r.data.ChargingStations).toHaveLength(1);
    expect(r.data.Locations).toHaveLength(1);
  });

  it('control calls are not recorded as exchanges', async () => {
    const before = (await exchanges()).length;
    await health();
    await ctlGet('/findings');
    await ctlGet('/coverage');
    expect((await exchanges()).length).toBe(before);
  });
});
