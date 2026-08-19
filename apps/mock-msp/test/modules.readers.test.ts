// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// The inbound OCPI routes modules.functional.test.ts does not touch: versions,
// locations/tariffs/sessions/cdrs/chargingprofiles readers + writers, the tokens
// list, and the commands result callback.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import type { MockContext } from '../src/core/types.js';
import { CommandType } from '../src/ocpi/barrel.js';
import {
  makeServer,
  startStubCpo,
  ocpiEnvelope,
  authHeader,
  functionalHeaders,
  registrationHeaders,
  validSession,
  SEED_TOKEN_WE_ACCEPT,
  type StubCpo,
} from './harness.js';

const TS = '2026-01-01T10:00:00.000Z';

function validConnector(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: '1',
    standard: 'IEC_62196_T2',
    format: 'SOCKET',
    power_type: 'AC_3_PHASE',
    max_voltage: 230,
    max_amperage: 32,
    last_updated: TS,
    ...overrides,
  };
}

function validEvse(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    uid: 'EVSE1',
    status: 'AVAILABLE',
    connectors: [validConnector()],
    last_updated: TS,
    ...overrides,
  };
}

function validLocation(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    country_code: 'US',
    party_id: 'S44',
    id: 'LOC1',
    publish: true,
    address: '1 Main St',
    city: 'Oakland',
    country: 'USA',
    coordinates: { latitude: '37.77490', longitude: '-122.41940' },
    time_zone: 'America/Los_Angeles',
    evses: [validEvse()],
    last_updated: TS,
    ...overrides,
  };
}

function validTariff(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'TAR1',
    country_code: 'US',
    party_id: 'S44',
    currency: 'USD',
    elements: [{ price_components: [{ type: 'ENERGY', price: 0.25, step_size: 1 }] }],
    last_updated: TS,
    ...overrides,
  };
}

function validCdr(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    country_code: 'US',
    party_id: 'S44',
    id: 'CDR-1',
    start_date_time: TS,
    end_date_time: '2026-01-01T11:00:00.000Z',
    session_id: 'SESSION-1',
    cdr_token: {
      uid: 'TOKEN-1',
      type: 'RFID',
      contract_id: 'CONTRACT-1',
      country_code: 'US',
      party_id: 'TST',
    },
    auth_method: 'WHITELIST',
    cdr_location: {
      id: 'LOC1',
      address: '1 Main St',
      city: 'Oakland',
      country: 'USA',
      coordinates: { latitude: '37.77490', longitude: '-122.41940' },
      evse_uid: 'EVSE1',
      evse_id: 'US*S44*E1',
      connector_id: '1',
      connector_standard: 'IEC_62196_T2',
      connector_format: 'SOCKET',
      connector_power_type: 'AC_3_PHASE',
    },
    currency: 'USD',
    charging_periods: [{ start_date_time: TS, dimensions: [{ type: 'ENERGY', volume: 12.5 }] }],
    total_cost: { excl_vat: 3.13 },
    total_energy: 12.5,
    total_time: 1,
    last_updated: TS,
    ...overrides,
  };
}

function validActiveChargingProfile(): Record<string, unknown> {
  return {
    start_date_time: TS,
    charging_profile: {
      charging_rate_unit: 'W',
      charging_profile_period: [{ start_period: 0, limit: 11000 }],
    },
  };
}

function validToken(uid: string): Record<string, unknown> {
  return {
    country_code: 'US',
    party_id: 'TST',
    uid,
    type: 'RFID',
    contract_id: `CONTRACT-${uid}`,
    issuer: 'TestMobilitySolutions',
    valid: true,
    whitelist: 'ALLOWED',
    last_updated: TS,
  };
}

describe('inbound readers + writers', () => {
  let app: FastifyInstance;
  let ctx: MockContext;

  beforeEach(async () => {
    ({ app, ctx } = makeServer());
    await app.ready();
  });
  afterEach(async () => {
    await app.close();
  });

  function lastInbound(operation: string) {
    const ex = ctx.store.query({ direction: 'inbound', operation }).at(-1);
    expect(ex, `no inbound exchange recorded for ${operation}`).toBeDefined();
    return ex!;
  }

  function expectDetected(operation: string) {
    const ex = lastInbound(operation);
    expect(ex.validation.ok).toBe(false);
    expect(ex.findings.some((f) => f.severity === 'error' && f.kind === 'body')).toBe(true);
    return ex;
  }

  function inject(
    method: 'GET' | 'PUT' | 'PATCH' | 'POST' | 'DELETE',
    url: string,
    body?: unknown,
  ) {
    return app.inject({
      method,
      url,
      headers: functionalHeaders(ctx.config),
      payload: body === undefined ? undefined : JSON.stringify(body),
    });
  }

  // ---- versions -----------------------------------------------------------

  describe('versions', () => {
    it('GET /ocpi/versions lists 2.2.1 pointing at the details url under publicBaseUrl', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/ocpi/versions',
        headers: registrationHeaders(),
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().status_code).toBe(1000);
      expect(res.json().data).toEqual([
        { version: '2.2.1', url: `${ctx.config.publicBaseUrl}/versions/2.2.1` },
      ]);
      expect(lastInbound('versions.list').findings).toHaveLength(0);
    });

    it('GET /ocpi/versions/2.2.1 advertises the 8 endpoints in split {identifier, role} form', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/ocpi/versions/2.2.1',
        headers: registrationHeaders(),
      });
      expect(res.statusCode).toBe(200);
      const data = res.json().data;
      expect(data.version).toBe('2.2.1');
      const v = `${ctx.config.publicBaseUrl}/2.2.1`;
      const e = `${v}/emsp`;
      expect(data.endpoints).toEqual([
        { identifier: 'credentials', role: 'SENDER', url: `${v}/credentials` },
        { identifier: 'locations', role: 'RECEIVER', url: `${e}/locations` },
        { identifier: 'tariffs', role: 'RECEIVER', url: `${e}/tariffs` },
        { identifier: 'sessions', role: 'RECEIVER', url: `${e}/sessions` },
        { identifier: 'cdrs', role: 'RECEIVER', url: `${e}/cdrs` },
        { identifier: 'chargingprofiles', role: 'RECEIVER', url: `${e}/chargingprofiles` },
        { identifier: 'tokens', role: 'SENDER', url: `${e}/tokens` },
        { identifier: 'commands', role: 'SENDER', url: `${e}/commands` },
      ]);
      expect(lastInbound('versions.details').findings).toHaveLength(0);
    });

    it('versions reflect a different publicBaseUrl verbatim', async () => {
      await app.close();
      ({ app, ctx } = makeServer({ publicBaseUrl: 'https://msp.example.test/ocpi' }));
      await app.ready();
      const res = await app.inject({
        method: 'GET',
        url: '/ocpi/versions/2.2.1',
        headers: registrationHeaders(),
      });
      const urls = (res.json().data.endpoints as Array<{ url: string }>).map((x) => x.url);
      expect(urls.every((u) => u.startsWith('https://msp.example.test/ocpi/2.2.1/'))).toBe(true);
    });

    it('registration endpoints also accept the transient TOKEN_A; functional ones do not', async () => {
      ctx.store.domain.registration.tokenA = 'TOKEN-A-FOR-HANDSHAKE';
      const versions = await app.inject({
        method: 'GET',
        url: '/ocpi/versions',
        headers: registrationHeaders('TOKEN-A-FOR-HANDSHAKE'),
      });
      expect(versions.statusCode).toBe(200);
      const functional = await app.inject({
        method: 'GET',
        url: '/ocpi/2.2.1/emsp/tokens',
        headers: functionalHeaders(ctx.config, 'TOKEN-A-FOR-HANDSHAKE'),
      });
      expect(functional.statusCode).toBe(401);
      expect(functional.json().status_code).toBe(2002);
    });
  });

  // ---- locations ----------------------------------------------------------

  describe('locations', () => {
    const base = '/ocpi/2.2.1/emsp/locations/US/S44';

    it('PUT at all three depths stores under distinct keys and GET reads each back', async () => {
      const loc = validLocation();
      const evse = validEvse({ uid: 'EVSE2' });
      const conn = validConnector({ id: '2' });
      for (const [url, body] of [
        [`${base}/LOC1`, loc],
        [`${base}/LOC1/EVSE2`, evse],
        [`${base}/LOC1/EVSE2/2`, conn],
      ] as const) {
        const res = await inject('PUT', url, body);
        expect(res.statusCode).toBe(200);
        expect(res.json().status_code).toBe(1000);
        expect(res.json().data).toBeUndefined();
      }
      for (const op of [
        'locations.put.location',
        'locations.put.evse',
        'locations.put.connector',
      ]) {
        expect(lastInbound(op).validation.ok).toBe(true);
      }
      expect([...ctx.store.domain.locations.keys()].sort()).toEqual([
        'US/S44/LOC1',
        'US/S44/LOC1/EVSE2',
        'US/S44/LOC1/EVSE2/2',
      ]);

      expect((await inject('GET', `${base}/LOC1`)).json().data).toEqual(loc);
      expect((await inject('GET', `${base}/LOC1/EVSE2`)).json().data).toEqual(evse);
      expect((await inject('GET', `${base}/LOC1/EVSE2/2`)).json().data).toEqual(conn);
      for (const op of [
        'locations.get.location',
        'locations.get.evse',
        'locations.get.connector',
      ]) {
        expect(lastInbound(op).response.ocpiStatusCode).toBe(1000);
      }
    });

    it('GET of an unknown object at any depth answers 2003 (unknown location) with HTTP 200', async () => {
      for (const url of [`${base}/NOPE`, `${base}/NOPE/E`, `${base}/NOPE/E/1`]) {
        const res = await inject('GET', url);
        expect(res.statusCode).toBe(200);
        expect(res.json().status_code).toBe(2003);
        expect(res.json().data).toBeUndefined();
      }
    });

    it('PATCH shallow-merges onto the stored object at each depth', async () => {
      await inject('PUT', `${base}/LOC1`, validLocation({ name: 'Before' }));
      await inject('PUT', `${base}/LOC1/EVSE1`, validEvse());
      await inject('PUT', `${base}/LOC1/EVSE1/1`, validConnector());

      await inject('PATCH', `${base}/LOC1`, { name: 'After', last_updated: TS });
      await inject('PATCH', `${base}/LOC1/EVSE1`, { status: 'CHARGING', last_updated: TS });
      await inject('PATCH', `${base}/LOC1/EVSE1/1`, { max_amperage: 16, last_updated: TS });

      const loc = ctx.store.domain.locations.get('US/S44/LOC1') as Record<string, unknown>;
      expect(loc.name).toBe('After');
      expect(loc.address).toBe('1 Main St');
      const evse = ctx.store.domain.locations.get('US/S44/LOC1/EVSE1') as Record<string, unknown>;
      expect(evse.status).toBe('CHARGING');
      expect(evse.uid).toBe('EVSE1');
      const conn = ctx.store.domain.locations.get('US/S44/LOC1/EVSE1/1') as Record<string, unknown>;
      expect(conn.max_amperage).toBe(16);
      expect(conn.standard).toBe('IEC_62196_T2');
      for (const op of [
        'locations.patch.location',
        'locations.patch.evse',
        'locations.patch.connector',
      ]) {
        const ex = lastInbound(op);
        expect(ex.validation.ok).toBe(true);
        expect(ex.response.ocpiStatusCode).toBe(1000);
      }
    });

    it('PATCH of an object never PUT stores the partial as-is', async () => {
      await inject('PATCH', `${base}/LOC9`, { name: 'Only a name' });
      expect(ctx.store.domain.locations.get('US/S44/LOC9')).toEqual({ name: 'Only a name' });
    });

    it('invalid PUT bodies at each depth are still 1000 but detected and stored', async () => {
      // Missing required fields / wrong enum / wrong type respectively.
      await inject('PUT', `${base}/BAD1`, { id: 'BAD1' });
      await inject('PUT', `${base}/BAD1/E1`, validEvse({ status: 'SLEEPING' }));
      await inject('PUT', `${base}/BAD1/E1/1`, validConnector({ max_voltage: '230' }));
      for (const op of [
        'locations.put.location',
        'locations.put.evse',
        'locations.put.connector',
      ]) {
        const ex = expectDetected(op);
        expect(ex.response.httpStatus).toBe(200);
        expect(ex.response.ocpiStatusCode).toBe(1000);
      }
      expect(ctx.store.domain.locations.size).toBe(3);
    });

    it('invalid PATCH bodies (partial schema still typed) are detected', async () => {
      // 4-decimal coordinates fail GeoLocationSchema's 5-7 decimal regex.
      await inject('PATCH', `${base}/LOC1`, {
        coordinates: { latitude: '37.7749', longitude: '-122.4194' },
      });
      await inject('PATCH', `${base}/LOC1/EVSE1`, { connectors: [] });
      await inject('PATCH', `${base}/LOC1/EVSE1/1`, { format: 'PLUG' });
      for (const op of [
        'locations.patch.location',
        'locations.patch.evse',
        'locations.patch.connector',
      ]) {
        expectDetected(op);
      }
    });
  });

  // ---- tariffs ------------------------------------------------------------

  describe('tariffs', () => {
    const url = '/ocpi/2.2.1/emsp/tariffs/US/S44/TAR1';

    it('PUT stores the tariff, GET reads it back, DELETE removes it', async () => {
      const tariff = validTariff();
      const put = await inject('PUT', url, tariff);
      expect(put.json().status_code).toBe(1000);
      expect(put.json().data).toBeUndefined();
      expect(lastInbound('tariffs.put').validation.ok).toBe(true);
      expect(ctx.store.domain.tariffs.get('US:S44:TAR1')).toEqual(tariff);

      const get = await inject('GET', url);
      expect(get.json().status_code).toBe(1000);
      expect(get.json().data).toEqual(tariff);

      const del = await inject('DELETE', url);
      expect(del.json().status_code).toBe(1000);
      expect(del.json().data).toBeUndefined();
      expect(ctx.store.domain.tariffs.has('US:S44:TAR1')).toBe(false);
    });

    it('DELETE is idempotent: an unknown tariff still answers the empty 1000 envelope', async () => {
      const del = await inject('DELETE', '/ocpi/2.2.1/emsp/tariffs/US/S44/NEVER-PUT');
      expect(del.statusCode).toBe(200);
      expect(del.json().status_code).toBe(1000);
      expect(lastInbound('tariffs.delete').findings).toHaveLength(0);
    });

    it('GET of an unknown tariff answers 2000 with HTTP 200', async () => {
      const get = await inject('GET', '/ocpi/2.2.1/emsp/tariffs/US/S44/NEVER-PUT');
      expect(get.statusCode).toBe(200);
      expect(get.json().status_code).toBe(2000);
    });

    it('an invalid tariff is detected but still stored verbatim', async () => {
      const bad = validTariff({ elements: [], currency: 'DOLLARS' });
      const put = await inject('PUT', url, bad);
      expect(put.json().status_code).toBe(1000);
      expectDetected('tariffs.put');
      expect(ctx.store.domain.tariffs.get('US:S44:TAR1')).toEqual(bad);
    });
  });

  // ---- sessions -----------------------------------------------------------

  describe('sessions', () => {
    const url = '/ocpi/2.2.1/emsp/sessions/US/TST/SESSION-1';

    it('PATCH shallow-merges onto the stored session (charging-period patch shape included)', async () => {
      await inject('PUT', url, validSession());
      const periods = [{ start_date_time: TS, dimensions: [{ type: 'ENERGY', volume: 1.5 }] }];
      const res = await inject('PATCH', url, {
        kwh: 20,
        status: 'COMPLETED',
        charging_periods: periods,
      });
      expect(res.json().status_code).toBe(1000);
      expect(res.json().data).toBeUndefined();
      expect(lastInbound('sessions.patch').validation.ok).toBe(true);

      const stored = ctx.store.domain.sessions.get('US/TST/SESSION-1') as Record<string, unknown>;
      expect(stored.kwh).toBe(20);
      expect(stored.status).toBe('COMPLETED');
      expect(stored.charging_periods).toEqual(periods);
      expect(stored.id).toBe('SESSION-1');
      expect(stored.cdr_token).toEqual(validSession().cdr_token);
    });

    it('PATCH of an unknown session stores the partial as-is', async () => {
      await inject('PATCH', '/ocpi/2.2.1/emsp/sessions/US/TST/NEW', { kwh: 1 });
      expect(ctx.store.domain.sessions.get('US/TST/NEW')).toEqual({ kwh: 1 });
    });

    it('an invalid PATCH is detected', async () => {
      await inject('PUT', url, validSession());
      await inject('PATCH', url, { kwh: 'lots', status: 'NAPPING' });
      expectDetected('sessions.patch');
    });

    it('GET returns the stored session; unknown ids answer 2000 with HTTP 404', async () => {
      const session = validSession();
      await inject('PUT', url, session);
      const found = await inject('GET', url);
      expect(found.statusCode).toBe(200);
      expect(found.json().status_code).toBe(1000);
      expect(found.json().data).toEqual(session);

      const missing = await inject('GET', '/ocpi/2.2.1/emsp/sessions/US/TST/NOPE');
      expect(missing.statusCode).toBe(404);
      expect(missing.json().status_code).toBe(2000);
    });

    it('PUT charging_preferences is recorded and acknowledged with the empty envelope', async () => {
      const res = await inject('PUT', `${url}/charging_preferences`, {
        profile_type: 'REGULAR',
        departure_time: '2026-01-01T18:00:00.000Z',
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().status_code).toBe(1000);
      expect(res.json().data).toBeUndefined();
      const ex = lastInbound('sessions.put.charging_preferences');
      expect((ex.request.body as { profile_type?: string }).profile_type).toBe('REGULAR');
      expect(ex.validation.ok).toBe(true);
    });
  });

  // ---- cdrs ---------------------------------------------------------------

  describe('cdrs', () => {
    it('POST stores the CDR by id, answers the empty envelope + a Location header at the GET url', async () => {
      const cdr = validCdr();
      const res = await inject('POST', '/ocpi/2.2.1/emsp/cdrs', cdr);
      expect(res.statusCode).toBe(200);
      expect(res.json().status_code).toBe(1000);
      expect(res.json().data).toBeUndefined();
      expect(res.headers.location).toBe(`${ctx.config.publicBaseUrl}/2.2.1/emsp/cdrs/CDR-1`);
      expect(lastInbound('cdrs.post').validation.ok).toBe(true);
      expect(ctx.store.domain.cdrs.get('CDR-1')).toEqual(cdr);

      const get = await inject('GET', '/ocpi/2.2.1/emsp/cdrs/CDR-1');
      expect(get.statusCode).toBe(200);
      expect(get.json().status_code).toBe(1000);
      expect(get.json().data).toEqual(cdr);
      expect(lastInbound('cdrs.get').response.ocpiStatusCode).toBe(1000);
    });

    it('GET of an unknown CDR answers 2000 with HTTP 404', async () => {
      const get = await inject('GET', '/ocpi/2.2.1/emsp/cdrs/NOPE');
      expect(get.statusCode).toBe(404);
      expect(get.json().status_code).toBe(2000);
    });

    it('an invalid CDR with an id is detected yet stored; one without an id is not stored', async () => {
      const withId = validCdr({ charging_periods: [], total_cost: 'free' });
      await inject('POST', '/ocpi/2.2.1/emsp/cdrs', withId);
      expectDetected('cdrs.post');
      expect(ctx.store.domain.cdrs.get('CDR-1')).toEqual(withId);

      const res = await inject('POST', '/ocpi/2.2.1/emsp/cdrs', { total_energy: 1 });
      expect(res.json().status_code).toBe(1000);
      expect(res.headers.location).toBe(`${ctx.config.publicBaseUrl}/2.2.1/emsp/cdrs/`);
      expectDetected('cdrs.post');
      expect(ctx.store.domain.cdrs.size).toBe(1);
    });
  });

  // ---- chargingprofiles ---------------------------------------------------

  describe('chargingprofiles', () => {
    it('PUT /:session_id validates an ActiveChargingProfile and acks with the empty envelope', async () => {
      const res = await inject(
        'PUT',
        '/ocpi/2.2.1/emsp/chargingprofiles/SESSION-1',
        validActiveChargingProfile(),
      );
      expect(res.statusCode).toBe(200);
      expect(res.json().status_code).toBe(1000);
      expect(res.json().data).toBeUndefined();
      const ex = lastInbound('chargingprofiles.put');
      expect(ex.validation.ok).toBe(true);
      expect(ex.findings.filter((f) => f.severity === 'error')).toHaveLength(0);
    });

    it('PUT /:session_id with an invalid body is detected', async () => {
      await inject('PUT', '/ocpi/2.2.1/emsp/chargingprofiles/SESSION-1', {
        start_date_time: TS,
        charging_profile: { charging_rate_unit: 42 },
      });
      expectDetected('chargingprofiles.put');
    });

    it('POST /:session_id/:uid (result callback) is recorded and acked without a request schema', async () => {
      const res = await inject('POST', '/ocpi/2.2.1/emsp/chargingprofiles/SESSION-1/CB-1', {
        result: 'ACCEPTED',
        profile: validActiveChargingProfile(),
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().status_code).toBe(1000);
      expect(res.json().data).toBeUndefined();
      const ex = lastInbound('chargingprofiles.result.callback');
      expect(ex.request.path).toBe('/ocpi/2.2.1/emsp/chargingprofiles/SESSION-1/CB-1');
      expect(ex.validation.ok).toBe(true);
      expect(ex.findings.filter((f) => f.severity === 'error')).toHaveLength(0);
    });
  });

  // ---- tokens list --------------------------------------------------------

  describe('tokens list', () => {
    it('GET lists the tokens we own (empty until pushed)', async () => {
      const empty = await inject('GET', '/ocpi/2.2.1/emsp/tokens');
      expect(empty.statusCode).toBe(200);
      expect(empty.json().status_code).toBe(1000);
      expect(empty.json().data).toEqual([]);

      ctx.store.domain.tokens.set('TOK-1', validToken('TOK-1'));
      ctx.store.domain.tokens.set('TOK-2', validToken('TOK-2'));
      const listed = await inject('GET', '/ocpi/2.2.1/emsp/tokens');
      expect(listed.json().data.map((t: { uid: string }) => t.uid)).toEqual(['TOK-1', 'TOK-2']);
      expect(lastInbound('tokens.list').findings).toHaveLength(0);
    });
  });
});

// ---- commands result callback ---------------------------------------------

describe('commands result callback', () => {
  let app: FastifyInstance;
  let ctx: MockContext;
  let cpo: StubCpo;

  // Citrine sends this callback with from/to reversed (from=eMSP, to=CPO).
  function reversedCallbackHeaders(token = SEED_TOKEN_WE_ACCEPT): Record<string, string> {
    return {
      authorization: authHeader(token),
      'content-type': 'application/json',
      'x-request-id': 'cb-req',
      'x-correlation-id': 'cb-cor',
      'ocpi-from-country-code': ctx.config.countryCode,
      'ocpi-from-party-id': ctx.config.partyId,
      'ocpi-to-country-code': ctx.config.cpoCountryCode,
      'ocpi-to-party-id': ctx.config.cpoPartyId,
    };
  }

  beforeEach(async () => {
    cpo = await startStubCpo((req) => {
      if (req.method === 'POST' && req.path.startsWith('/ocpi/2.2.1/commands/')) {
        return { json: ocpiEnvelope({ result: 'ACCEPTED', timeout: 30 }) };
      }
      return undefined;
    });
    ({ app, ctx } = makeServer({ citrineOcpiBaseUrl: cpo.baseUrl }));
    await app.ready();
  });
  afterEach(async () => {
    await app.close();
    await cpo.close();
  });

  it('accepts a result with reversed routing headers for an unknown uid and records an info finding', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/ocpi/2.2.1/emsp/commands/START_SESSION/not-a-uid-we-sent',
      headers: reversedCallbackHeaders(),
      payload: JSON.stringify({ result: 'ACCEPTED' }),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().status_code).toBe(1000);
    expect(res.json().data).toBeUndefined();

    const ex = ctx.store.query({ direction: 'inbound', operation: 'commands.result' }).at(-1)!;
    expect(ex.validation.ok).toBe(true);
    expect(ex.flowId).toBeUndefined();
    expect(ex.findings.filter((f) => f.severity === 'error')).toHaveLength(0);
    const info = ctx.store.findings.find(
      (f) => f.severity === 'info' && f.module === 'commands' && f.seq === ex.seq,
    );
    expect(info?.detail).toContain('START_SESSION/not-a-uid-we-sent');
    expect(info?.detail).toContain('no matching PendingCommand');
  });

  it('stitches a correlated result onto the PendingCommand flow and wakes awaitResult', async () => {
    const sent = await ctx.client.sendCommand(CommandType.START_SESSION, {
      location_id: '1',
      evse_uid: 'cp001::1',
    });
    const pending = [...ctx.store.domain.commands.values()].at(-1)!;
    expect(sent.responseUrl).toBe(pending.responseUrl);
    const cbPath = new URL(pending.responseUrl).pathname;
    expect(cbPath).toBe(`/ocpi/2.2.1/emsp/commands/START_SESSION/${pending.commandId}`);

    const awaiting = sent.awaitResult(2000);
    const res = await app.inject({
      method: 'POST',
      url: cbPath,
      headers: reversedCallbackHeaders(),
      payload: JSON.stringify({ result: 'ACCEPTED', message: { language: 'en', text: 'ok' } }),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().status_code).toBe(1000);

    const woke = await awaiting;
    expect(woke.operation).toBe('commands.result');
    expect(woke.flowId).toBe(pending.commandId);
    expect((woke.request.body as { result: string }).result).toBe('ACCEPTED');
    expect(ctx.store.findings.some((f) => f.detail.includes('no matching PendingCommand'))).toBe(
      false,
    );
  });

  it('still validates the body: a bad CommandResult is recorded as drift', async () => {
    await app.inject({
      method: 'POST',
      url: '/ocpi/2.2.1/emsp/commands/STOP_SESSION/whatever',
      headers: reversedCallbackHeaders(),
      payload: JSON.stringify({ result: 'MAYBE' }),
    });
    const ex = ctx.store.query({ direction: 'inbound', operation: 'commands.result' }).at(-1)!;
    expect(ex.validation.ok).toBe(false);
    expect(ex.findings.some((f) => f.severity === 'error' && f.kind === 'body')).toBe(true);
    expect(ex.response.ocpiStatusCode).toBe(1000);
  });

  it('rejects the callback without the token we accept (401 / 2002)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/ocpi/2.2.1/emsp/commands/START_SESSION/whatever',
      headers: reversedCallbackHeaders('WRONG-TOKEN'),
      payload: JSON.stringify({ result: 'ACCEPTED' }),
    });
    expect(res.statusCode).toBe(401);
    expect(res.json().status_code).toBe(2002);
  });
});
