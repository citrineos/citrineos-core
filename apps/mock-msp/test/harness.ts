// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// Shared test scaffolding for the @citrineos/mock-msp self-tests.
//
//  - makeConfig()   : a deterministic MockConfig (silent logs, ephemeral ports).
//  - makeContext()  : assembles the same singletons buildContext() does, but with
//                     a SILENT WireLogger so the vitest output stays clean. It is
//                     otherwise identical, so buildServer(ctx) behaves exactly as
//                     in production.
//  - makeServer()   : { ctx, app } — a ready Fastify instance driven via
//                     app.inject() (in-process, no real socket needed).
//  - startStubCpo() : a tiny real HTTP server standing in for CitrineOS's CPO so
//                     the mock's OcpiClient (global fetch) has something to call
//                     during the credentials handshake / command send — no live
//                     Citrine required.
//  - request helpers + a couple of schema-valid OCPI fixtures.
// ============================================================================
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import type { FastifyInstance } from 'fastify';
import type { MockConfig, MockContext } from '../src/core/types.js';
import { buildIdentity } from '../src/identity.js';
import { createStore } from '../src/core/store.js';
import { createFaultEngine } from '../src/core/faults.js';
import { createWireLogger } from '../src/core/wire-log.js';
import { createOcpiClient } from '../src/core/client.js';
import { ok, empty, error } from '../src/core/envelope.js';
import { encodeToken } from '../src/core/auth.js';
import { buildServer } from '../src/server.js';
import { resetScenarioRuntime } from '../src/control/scenario.js';
import type { StatusProbes } from '../src/control/status-cache.js';

// The plaintext tokens the harness uses. Any consistent values work; the auth
// layer base64-encodes on the wire and decodes+compares the plaintext.
export const SEED_TOKEN_WE_ACCEPT = 'mock-test-token-we-accept';
export const SEED_TOKEN_WE_PRESENT = 'mock-test-token-we-present';

export function makeConfig(overrides: Partial<MockConfig> = {}): MockConfig {
  return {
    port: 0,
    host: '127.0.0.1',
    publicBaseUrl: 'http://127.0.0.1:8083/ocpi',
    citrineOcpiBaseUrl: 'http://127.0.0.1:1/ocpi', // unreachable unless overridden
    citrineHasuraUrl: 'http://127.0.0.1:1/v1/graphql', // unreachable unless overridden
    countryCode: 'US',
    partyId: 'TST',
    cpoCountryCode: 'US',
    cpoPartyId: 'S44',
    bootstrapTokenWeAccept: SEED_TOKEN_WE_ACCEPT,
    bootstrapTokenWePresent: SEED_TOKEN_WE_PRESENT,
    autoRegister: false,
    logLevel: 'silent',
    ...overrides,
  };
}

/** Assemble a MockContext with a SILENT logger (otherwise identical to buildContext). */
export function makeContext(config: MockConfig): MockContext {
  const identity = buildIdentity(config);
  const log = createWireLogger({ pretty: false, ndjson: false });
  const store = createStore(config);
  const faults = createFaultEngine();
  const client = createOcpiClient({ config, identity, store, faults, log });
  return { config, identity, store, faults, client, log, ok, empty, error };
}

export interface TestServer {
  ctx: MockContext;
  app: FastifyInstance;
}

export function makeServer(
  overrides: Partial<MockConfig> = {},
  probeOverride?: Partial<StatusProbes>,
): TestServer {
  // Reset the process-global scenario runtime so tests don't leak authorize
  // policy / strictInbound / active-scenario state into one another.
  resetScenarioRuntime();
  const config = makeConfig(overrides);
  const ctx = makeContext(config);
  const app = buildServer(ctx, probeOverride);
  return { ctx, app };
}

// ---- Authorization + routing header helpers --------------------------------

export function authHeader(rawToken: string): string {
  return encodeToken(rawToken);
}

/** Full functional-endpoint headers: token + strict OCPI routing (CPO -> us). */
export function functionalHeaders(
  cfg: MockConfig,
  token = SEED_TOKEN_WE_ACCEPT,
): Record<string, string> {
  return {
    authorization: authHeader(token),
    'content-type': 'application/json',
    'x-request-id': `req-${Math.random().toString(36).slice(2)}`,
    'x-correlation-id': `cor-${Math.random().toString(36).slice(2)}`,
    'ocpi-from-country-code': cfg.cpoCountryCode,
    'ocpi-from-party-id': cfg.cpoPartyId,
    'ocpi-to-country-code': cfg.countryCode,
    'ocpi-to-party-id': cfg.partyId,
  };
}

/** Registration-endpoint headers: token + message ids, no OCPI routing. */
export function registrationHeaders(token = SEED_TOKEN_WE_ACCEPT): Record<string, string> {
  return {
    authorization: authHeader(token),
    'content-type': 'application/json',
    'x-request-id': `req-${Math.random().toString(36).slice(2)}`,
    'x-correlation-id': `cor-${Math.random().toString(36).slice(2)}`,
  };
}

// ---- Stub CPO (stands in for CitrineOS during outbound calls) ---------------

export interface StubCpoRequest {
  method: string;
  path: string;
  headers: http.IncomingHttpHeaders;
  body: unknown;
}
export interface StubCpoReply {
  status?: number;
  json?: unknown;
  text?: string;
}
export interface StubCpo {
  origin: string; // http://127.0.0.1:PORT
  baseUrl: string; // http://127.0.0.1:PORT/ocpi
  requests: StubCpoRequest[];
  close(): Promise<void>;
}

/** OCPI success envelope helper for stub replies. */
export function ocpiEnvelope(data: unknown, status_code = 1000): Record<string, unknown> {
  return { status_code, status_message: 'stub', timestamp: new Date().toISOString(), data };
}

/**
 * Start a minimal real HTTP server that plays the CPO. `route` receives each
 * request and returns a reply (or undefined -> 404). Every request is recorded
 * on stub.requests for assertions.
 */
export async function startStubCpo(
  route: (req: StubCpoRequest, stub: StubCpo) => StubCpoReply | undefined,
): Promise<StubCpo> {
  const requests: StubCpoRequest[] = [];
  const stub = { requests } as StubCpo;

  const server = http.createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on('data', (c) => chunks.push(c as Buffer));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf-8');
      let body: unknown;
      try {
        body = raw ? JSON.parse(raw) : undefined;
      } catch {
        body = raw;
      }
      const path = (req.url ?? '').split('?')[0];
      const record: StubCpoRequest = {
        method: req.method ?? 'GET',
        path,
        headers: req.headers,
        body,
      };
      requests.push(record);
      const reply = route(record, stub);
      if (!reply) {
        res.statusCode = 404;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ error: 'stub_not_found', path }));
        return;
      }
      res.statusCode = reply.status ?? 200;
      if (reply.text !== undefined) {
        res.end(reply.text);
        return;
      }
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify(reply.json ?? {}));
    });
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;
  stub.origin = `http://127.0.0.1:${port}`;
  stub.baseUrl = `${stub.origin}/ocpi`;
  stub.close = () =>
    new Promise<void>((resolve, reject) => server.close((e) => (e ? reject(e) : resolve())));
  return stub;
}

// ---- Schema-valid OCPI fixtures (reused ocpi-base shapes) -------------------

/** A full, schema-valid ocpi-base Session (passes SessionSchema.parse). */
export function validSession(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    country_code: 'US',
    party_id: 'TST',
    id: 'SESSION-1',
    start_date_time: '2026-01-01T10:00:00.000Z',
    kwh: 12.5,
    cdr_token: {
      uid: 'TOKEN-1',
      type: 'RFID',
      contract_id: 'CONTRACT-1',
      country_code: 'US',
      party_id: 'TST',
    },
    auth_method: 'WHITELIST',
    location_id: 'LOC1',
    evse_uid: 'EVSE1',
    connector_id: '1',
    currency: 'USD',
    status: 'ACTIVE',
    last_updated: '2026-01-01T10:00:00.000Z',
    ...overrides,
  };
}

/** A schema-valid LocationReferences body for tokens/authorize. */
export function validLocationReferences(): Record<string, unknown> {
  return { location_id: 'LOC1', evse_uids: ['EVSE1'] };
}

/** CPO CredentialsDTO the mock stores during an inbound (CPO-initiated) handshake. */
export function cpoCredentials(versionsUrl: string, token: string): Record<string, unknown> {
  return {
    token,
    url: versionsUrl,
    roles: [
      {
        role: 'CPO',
        party_id: 'S44',
        country_code: 'US',
        business_details: { name: 'CitrineOS CPO' },
      },
    ],
  };
}

/** The version list + version details a stub CPO advertises. */
export function cpoVersionsPayloads(stubBaseUrl: string): {
  list: Record<string, unknown>;
  details: Record<string, unknown>;
} {
  const detailsUrl = `${stubBaseUrl}/versions/2.2.1`;
  return {
    list: ocpiEnvelope([{ version: '2.2.1', url: detailsUrl }]),
    details: ocpiEnvelope({
      version: '2.2.1',
      endpoints: [
        { identifier: 'credentials', role: 'SENDER', url: `${stubBaseUrl}/2.2.1/credentials` },
        { identifier: 'locations', role: 'SENDER', url: `${stubBaseUrl}/2.2.1/locations` },
        { identifier: 'commands', role: 'RECEIVER', url: `${stubBaseUrl}/2.2.1/commands` },
      ],
    }),
  };
}
