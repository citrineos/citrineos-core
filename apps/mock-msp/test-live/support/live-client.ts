// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// Thin fetch helpers for the live suites. Nothing here imports the mock; the
// tests only talk to a running mock (MOCK_MSP_BASE_URL) and to Hasura.
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Exchange, ExchangeFilter, Finding } from '../../src/core/types.js';

export const BASE = (process.env.MOCK_MSP_BASE_URL ?? 'http://127.0.0.1:8083').replace(/\/$/, '');
export const HASURA = process.env.HASURA_URL ?? 'http://localhost:8090/v1/graphql';
const SECRET = process.env.MOCK_MSP_CONTROL_SECRET;
const SCENARIOS = resolve(dirname(fileURLToPath(import.meta.url)), '../../scenarios');

// ExchangeFilter.module is the RouteModule enum; plain strings read better in tests.
export type LiveFilter = Omit<ExchangeFilter, 'module'> & { module?: string };

export interface Res<T = unknown> {
  status: number;
  body: T;
  headers: Headers;
}

export function headers(extra: Record<string, string> = {}): Record<string, string> {
  const h: Record<string, string> = { 'content-type': 'application/json', ...extra };
  if (SECRET) h['x-mock-control-secret'] = SECRET;
  return h;
}

async function parse<T>(res: Response): Promise<Res<T>> {
  const text = await res.text();
  let body: unknown = text;
  try {
    body = text ? JSON.parse(text) : undefined;
  } catch {
    /* keep raw text */
  }
  return { status: res.status, body: body as T, headers: res.headers };
}

/** Any request to the mock, path relative to its origin (e.g. '/_mock/health'). */
export async function mock<T = unknown>(
  path: string,
  init: { method?: string; body?: unknown; headers?: Record<string, string> } = {},
): Promise<Res<T>> {
  const res = await fetch(`${BASE}${path}`, {
    method: init.method ?? 'GET',
    headers: headers(init.headers),
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  return parse<T>(res);
}

/** POST to the control API. `/_mock` is added here. */
export function ctl<T = unknown>(path: string, body: unknown = {}): Promise<Res<T>> {
  return mock<T>(`/_mock${path}`, { method: 'POST', body });
}

export function ctlGet<T = unknown>(path: string): Promise<Res<T>> {
  return mock<T>(`/_mock${path}`);
}

export function ctlDelete<T = unknown>(path: string): Promise<Res<T>> {
  return mock<T>(`/_mock${path}`, { method: 'DELETE' });
}

/** Long-poll for a recorded exchange. Resolves the exchange or throws with the near misses. */
export async function waitFor(filter: LiveFilter, timeoutMs = 20_000): Promise<Exchange> {
  const r = await ctl<Exchange & { error?: string; nearMisses?: unknown[] }>('/exchanges/wait', {
    filter,
    timeoutMs,
  });
  if (r.status !== 200) {
    throw new Error(
      `no exchange matched ${JSON.stringify(filter)} within ${timeoutMs}ms: ${JSON.stringify(r.body)}`,
    );
  }
  return r.body;
}

export async function exchanges(filter: LiveFilter = {}): Promise<Exchange[]> {
  const r = await ctlGet<Exchange[]>(
    `/exchanges?filter=${encodeURIComponent(JSON.stringify(filter))}`,
  );
  return r.body;
}

export async function findings(): Promise<Finding[]> {
  return (await ctlGet<Finding[]>('/findings')).body;
}

export async function maxSeq(): Promise<number> {
  const r = await ctlGet<{ gen: { maxSeq: number } }>('/status');
  return r.body.gen.maxSeq;
}

export async function health(): Promise<Record<string, any>> {
  return (await ctlGet<Record<string, any>>('/health')).body;
}

export function scenarioFile(name: string): Record<string, unknown> {
  return JSON.parse(readFileSync(resolve(SCENARIOS, `${name}.json`), 'utf-8')) as Record<
    string,
    unknown
  >;
}

/** Hot-load one of the shipped scenario fixtures. */
export async function loadScenario(name: string): Promise<Res<{ applied: string }>> {
  return ctl<{ applied: string }>('/scenario', scenarioFile(name));
}

/**
 * Reset the recorder but keep the registration and re-apply the scenario:
 * /_mock/reset also clears the active scenario, which would make
 * /_mock/scenarios/:id/evaluate answer 409 and blank the dashboard badge.
 */
export async function resetKeepingScenario(name = 'preregistered'): Promise<void> {
  const r = await ctl('/reset', { keepRegistration: true });
  if (r.status !== 200) throw new Error(`reset failed: ${r.status}`);
  const s = await loadScenario(name);
  if (s.status !== 200) throw new Error(`scenario reload failed: ${JSON.stringify(s.body)}`);
}

export async function hasura<T = any>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<{ data?: T; errors?: unknown[] }> {
  const res = await fetch(HASURA, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(variables ? { query, variables } : { query }),
  });
  return (await res.json()) as { data?: T; errors?: unknown[] };
}

export const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

/** Protocols OCPI can actually dispatch a command to (CommandExecutor.handlerRegistry). */
const COMMANDABLE = ['ocpp1.6', 'ocpp2.0.1'];

/**
 * The protocol cp001 negotiated. Core advertises every version in
 * OCPP_VERSION_LIST on :8081, so a current EVerest lands on ocpp2.1 - and OCPI
 * registers command handlers for 1.6 and 2.0.1 only, so every command comes
 * back FAILED "Charging station communication failed". Charge tests check this
 * first and skip with the reason rather than failing opaquely.
 */
export async function stationProtocol(): Promise<string> {
  const r = await hasura<any>(
    '{ ChargingStations(where: {ocppConnectionName: {_eq: "cp001"}}) { protocol } }',
  );
  if (r.errors) throw new Error(`hasura rejected the station query: ${JSON.stringify(r.errors)}`);
  const rows = r.data?.ChargingStations;
  if (!Array.isArray(rows) || rows.length === 0)
    throw new Error('no cp001 row in ChargingStations');
  const protocol = rows[0]?.protocol;
  if (!protocol) throw new Error('cp001 has no protocol recorded - has it connected yet?');
  return protocol;
}

/**
 * Throws when the answer cannot be determined: only a station that really is on
 * a protocol OCPI cannot command may skip a test, never a broken environment.
 */
export async function commandableProtocol(): Promise<{ ok: boolean; reason: string }> {
  const protocol = await stationProtocol();
  if (COMMANDABLE.includes(protocol)) return { ok: true, reason: '' };
  return {
    ok: false,
    reason:
      `cp001 negotiated ${protocol}; OCPI only maps command handlers for ` +
      `${COMMANDABLE.join(' / ')}, so commands cannot reach it`,
  };
}
