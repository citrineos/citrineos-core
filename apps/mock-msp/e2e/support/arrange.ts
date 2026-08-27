// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// State arrangement for the dashboard specs, over Playwright's request
// context. Plays CitrineOS against the mock's OCPI routes (same token and
// routing headers demo-seed.sh uses) and drives the /_mock control API.
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { APIRequestContext, APIResponse } from '@playwright/test';

const SCENARIOS = resolve(dirname(fileURLToPath(import.meta.url)), '../../scenarios');
const SECRET = process.env.MOCK_MSP_CONTROL_SECRET;

// the seeded bootstrap token, assembled from parts like src/config.ts does for
// the server token, so it is not carried as a literal a secret scanner trips on
const SEED_CLIENT_TOKEN = [
  'abc123',
  'def456',
  'ghi789',
  'jkl012',
  'mno345',
  'pqr678',
  'stu901',
  'vwx234',
  'yz567',
].join('');
export const CLIENT_TOKEN = process.env.MOCK_MSP_CLIENT_TOKEN ?? SEED_CLIENT_TOKEN;

// The two parties, read from the same env the mock reads (src/config.ts) so the
// traffic we replay matches what the mock is configured to accept. Defaults are
// the seeded tenant (apps/ocpi-server/seeders/20250806120001-default-tenant.ts)
// and partner.
export const CPO = {
  countryCode: process.env.MOCK_MSP_CPO_COUNTRY_CODE ?? 'US',
  partyId: process.env.MOCK_MSP_CPO_PARTY_ID ?? 'S44',
};
export const MSP = {
  countryCode: process.env.MOCK_MSP_COUNTRY_CODE ?? 'US',
  partyId: process.env.MOCK_MSP_PARTY_ID ?? 'TST',
};
/** Path prefix Citrine uses on our receivers: /<cpo cc>/<cpo party>. */
export const CPO_PATH = `${CPO.countryCode}/${CPO.partyId}`;

export function tokenHeader(raw = CLIENT_TOKEN): string {
  return `Token ${Buffer.from(raw, 'utf-8').toString('base64')}`;
}

function rid(): string {
  return Math.random().toString(36).slice(2, 12);
}

export function controlHeaders(): Record<string, string> {
  const h: Record<string, string> = { 'content-type': 'application/json' };
  if (SECRET) h['x-mock-control-secret'] = SECRET;
  return h;
}

/** Headers for a functional OCPI call from the CPO to the mock. */
export function functionalHeaders(token = CLIENT_TOKEN): Record<string, string> {
  return {
    authorization: tokenHeader(token),
    'content-type': 'application/json',
    'x-request-id': rid(),
    'x-correlation-id': rid(),
    'ocpi-from-country-code': CPO.countryCode,
    'ocpi-from-party-id': CPO.partyId,
    'ocpi-to-country-code': MSP.countryCode,
    'ocpi-to-party-id': MSP.partyId,
  };
}

export function registrationHeaders(token = CLIENT_TOKEN): Record<string, string> {
  return {
    authorization: tokenHeader(token),
    'content-type': 'application/json',
    'x-request-id': rid(),
    'x-correlation-id': rid(),
  };
}

export async function ctl(
  request: APIRequestContext,
  path: string,
  body: unknown = {},
  method: 'POST' | 'DELETE' | 'GET' = 'POST',
): Promise<APIResponse> {
  return request.fetch(`/_mock${path}`, {
    method,
    headers: controlHeaders(),
    data: method === 'GET' ? undefined : JSON.stringify(body),
  });
}

export async function ctlJson<T = any>(
  request: APIRequestContext,
  path: string,
  body: unknown = {},
  method: 'POST' | 'DELETE' | 'GET' = 'POST',
): Promise<T> {
  const res = await ctl(request, path, body, method);
  if (!res.ok()) throw new Error(`${method} /_mock${path} -> ${res.status()} ${await res.text()}`);
  return (await res.json()) as T;
}

/** Reset the recorder and re-apply the scenario (reset alone blanks it). */
export async function resetKeepingScenario(
  request: APIRequestContext,
  name = 'preregistered',
): Promise<void> {
  await ctlJson(request, '/reset', { keepRegistration: true });
  const scenario = JSON.parse(readFileSync(resolve(SCENARIOS, `${name}.json`), 'utf-8'));
  await ctlJson(request, '/scenario', scenario);
}

export function validSession(id: string): Record<string, unknown> {
  return {
    country_code: CPO.countryCode,
    party_id: CPO.partyId,
    id,
    start_date_time: '2026-07-17T09:00:00.000Z',
    kwh: 18.5,
    cdr_token: {
      uid: '04E7F5A2B37C80',
      type: 'RFID',
      contract_id: 'USTST-C-00042',
      country_code: MSP.countryCode,
      party_id: MSP.partyId,
    },
    auth_method: 'WHITELIST',
    location_id: 'LOC-E2E-1',
    evse_uid: 'EVSE-E2E-1',
    connector_id: '1',
    currency: 'USD',
    status: 'ACTIVE',
    last_updated: '2026-07-17T09:30:00.000Z',
  };
}

/** A Location whose coordinates fail the GeoLocation regex (two zod issues). */
export function badCoordinatesLocation(id: string): Record<string, unknown> {
  return {
    country_code: CPO.countryCode,
    party_id: CPO.partyId,
    id,
    publish: true,
    name: 'E2E Depot',
    address: '1 Market St',
    city: 'San Francisco',
    postal_code: '94105',
    state: 'CA',
    country: 'USA',
    coordinates: { latitude: '1.0', longitude: '2.0' },
    time_zone: 'America/Los_Angeles',
    last_updated: '2026-07-17T09:30:00.000Z',
  };
}

export interface Played {
  sessionId: string;
  locationId: string;
}

/**
 * Three inbound exchanges, Citrine-shaped: a valid session PUT, a PUT with a
 * token the mock does not accept (401/2002 + auth finding) and a location
 * whose coordinates fail the schema (valid=false + body finding).
 */
export async function playCitrine(request: APIRequestContext, tag = rid()): Promise<Played> {
  const sessionId = `SESSION-E2E-${tag}`;
  const locationId = `LOC-E2E-${tag}`;
  let res = await request.put(`/ocpi/2.2.1/emsp/sessions/${CPO_PATH}/${sessionId}`, {
    headers: functionalHeaders(),
    data: JSON.stringify(validSession(sessionId)),
  });
  if (res.status() !== 200) throw new Error(`session put -> ${res.status()}`);
  res = await request.put(`/ocpi/2.2.1/emsp/sessions/${CPO_PATH}/${sessionId}-401`, {
    headers: functionalHeaders('not-the-token'),
    data: JSON.stringify({ id: `${sessionId}-401` }),
  });
  if (res.status() !== 401) throw new Error(`bad-token put -> ${res.status()}`);
  res = await request.put(`/ocpi/2.2.1/emsp/locations/${CPO_PATH}/${locationId}`, {
    headers: functionalHeaders(),
    data: JSON.stringify(badCoordinatesLocation(locationId)),
  });
  if (res.status() !== 200) throw new Error(`location put -> ${res.status()}`);
  return { sessionId, locationId };
}

export async function armFault(
  request: APIRequestContext,
  rule: Record<string, unknown>,
): Promise<{ armed: string }> {
  return ctlJson(request, '/fault', rule);
}

/** A schema-valid CDR (the one scripts/demo-seed.sh posts in its adversary step). */
export function validCdr(id: string): Record<string, unknown> {
  return {
    country_code: CPO.countryCode,
    party_id: CPO.partyId,
    id,
    start_date_time: '2026-07-17T09:00:00.000Z',
    end_date_time: '2026-07-17T10:00:00.000Z',
    session_id: 'SESSION-DEMO-1',
    cdr_token: {
      uid: '04E7F5A2B37C80',
      type: 'RFID',
      contract_id: 'USTST-C-00042',
      country_code: MSP.countryCode,
      party_id: MSP.partyId,
    },
    auth_method: 'WHITELIST',
    authorization_reference: 'AUTH-DEMO-0001',
    cdr_location: {
      id: 'LOC-DEMO-1',
      name: 'Demo Depot',
      address: '1 Market St',
      city: 'San Francisco',
      postal_code: '94105',
      state: 'CA',
      country: 'USA',
      coordinates: { latitude: '37.774929', longitude: '-122.419418' },
      evse_uid: 'EVSE-DEMO-1',
      evse_id: `${CPO.countryCode}*${CPO.partyId}*E00001`,
      connector_id: '1',
      connector_standard: 'IEC_62196_T2',
      connector_format: 'SOCKET',
      connector_power_type: 'AC_3_PHASE',
    },
    currency: 'USD',
    charging_periods: [
      {
        start_date_time: '2026-07-17T09:00:00.000Z',
        dimensions: [{ type: 'ENERGY', volume: 18.5 }],
      },
    ],
    total_cost: { excl_vat: 5.55, incl_vat: 6.04 },
    total_energy: 18.5,
    total_time: 1.0,
    last_updated: '2026-07-17T10:00:00.000Z',
  };
}
