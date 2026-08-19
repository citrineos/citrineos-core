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

export const CLIENT_TOKEN =
  process.env.MOCK_MSP_CLIENT_TOKEN ?? 'abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567';

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

/** Headers for a functional OCPI call from the CPO (US/S44) to the mock (US/TST). */
export function functionalHeaders(token = CLIENT_TOKEN): Record<string, string> {
  return {
    authorization: tokenHeader(token),
    'content-type': 'application/json',
    'x-request-id': rid(),
    'x-correlation-id': rid(),
    'ocpi-from-country-code': 'US',
    'ocpi-from-party-id': 'S44',
    'ocpi-to-country-code': 'US',
    'ocpi-to-party-id': 'TST',
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
    country_code: 'US',
    party_id: 'S44',
    id,
    start_date_time: '2026-07-17T09:00:00.000Z',
    kwh: 18.5,
    cdr_token: {
      uid: '04E7F5A2B37C80',
      type: 'RFID',
      contract_id: 'USTST-C-00042',
      country_code: 'US',
      party_id: 'TST',
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
    country_code: 'US',
    party_id: 'S44',
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
  let res = await request.put(`/ocpi/2.2.1/emsp/sessions/US/S44/${sessionId}`, {
    headers: functionalHeaders(),
    data: JSON.stringify(validSession(sessionId)),
  });
  if (res.status() !== 200) throw new Error(`session put -> ${res.status()}`);
  res = await request.put(`/ocpi/2.2.1/emsp/sessions/US/S44/${sessionId}-401`, {
    headers: functionalHeaders('not-the-token'),
    data: JSON.stringify({ id: `${sessionId}-401` }),
  });
  if (res.status() !== 401) throw new Error(`bad-token put -> ${res.status()}`);
  res = await request.put(`/ocpi/2.2.1/emsp/locations/US/S44/${locationId}`, {
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
