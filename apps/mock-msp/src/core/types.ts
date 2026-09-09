// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// ============================================================================
import type { FastifyInstance } from 'fastify';
import type { ZodTypeAny } from 'zod';
import { ModuleId, OcpiResponseStatusCode, CommandType } from '../ocpi/barrel.js';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type Direction = 'inbound' | 'outbound';
// registration = versions/credentials (no routing-hdr check, also accept tokenA);
// functional   = token + strict OCPI-* routing headers;
// callback     = token only, routing headers NOT strictly validated (command result);
// none         = /_mock (not routed through the dispatcher).
export type AuthMode = 'registration' | 'functional' | 'callback' | 'none';
export type RouteModule = ModuleId | 'versions' | 'credentials';

// ---- Identity & config -----------------------------------------------------
export interface BusinessDetails {
  name: string;
  website?: string;
  logo?: { url: string; type: string; category: string; width?: number; height?: number };
}
export interface OcpiIdentity {
  country_code: string; // 'US'
  party_id: string; // 'TST'
  role: 'EMSP';
  business_details: BusinessDetails;
  version: '2.2.1';
}
export interface MockConfig {
  port: number; // 8083
  host: string; // '0.0.0.0'
  publicBaseUrl: string; // 'http://host.docker.internal:8083/ocpi' (advertised)
  citrineOcpiBaseUrl: string; // 'http://localhost:8085/ocpi'
  // Citrine serves the OCPI version list at a TENANT-SCOPED path
  // ('/ocpi/versions/{tenantId}'), not the bare '/ocpi/versions' — the spec hands
  // this URL over during the handshake rather than fixing it. Optional: when unset
  // the client falls back to `${citrineOcpiBaseUrl}/versions`.
  citrineVersionsUrl?: string; // 'http://localhost:8085/ocpi/versions/1'
  citrineHasuraUrl: string; // 'http://localhost:8090/v1/graphql' (provoke: Hasura -> Citrine push)
  countryCode: string; // 'US'
  partyId: string; // 'TST'
  cpoCountryCode: string; // 'US'
  cpoPartyId: string; // 'S44'
  bootstrapTokenWeAccept: string; // seed credentials.token
  bootstrapTokenWePresent: string; // seed serverCredentials.token
  scenarioPath?: string;
  autoRegister: boolean;
  logLevel: string;
  controlSecret?: string;
  // Command-identity defaults for START_SESSION / UNLOCK_CONNECTOR / RESERVE_NOW so an
  // OCPI command maps to the seeded station EVerest registers as (cp001). Overridable
  // via MOCK_MSP_DEFAULT_*; GET /_mock/discover/evse can also read them live from a
  // locations pull. Optional so test fixtures may omit them (handlers fall back to the
  // same literals). evse_uid must be `${ocppConnectionName}::${evseId}` for the CPO's
  // EXTRACT_STATION_ID split; the token must be authorizable by Citrine (DEADBEEF is
  // the seeded, Accepted ISO14443 authorization; RFID maps to OCPP ISO14443).
  defaultLocationId?: string; // '1'
  defaultEvseUid?: string; // 'cp001::1'
  defaultConnectorId?: string; // '1'
  defaultTokenUid?: string; // 'DEADBEEF'
  defaultTokenType?: string; // 'RFID'
}

// ---- Registration / domain state ------------------------------------------
export interface CpoEndpoint {
  identifier: string;
  role: string;
  url: string;
}
export interface RegistrationState {
  status: 'unregistered' | 'registered';
  tokenWeAccept: string; // inbound: Citrine presents Token base64(this)
  tokenWePresent: string; // outbound: we present Token base64(this)
  tokenA?: string; // transient handshake token, valid until first creds POST consumed
  cpoVersionsUrl?: string;
  cpoCredentialsUrl?: string;
  cpoEndpoints: CpoEndpoint[];
  registeredAt?: string;
}
export interface PendingCommand {
  commandId: string;
  type: CommandType;
  responseUrl: string;
  sentAt: string;
}
export interface DomainState {
  registration: RegistrationState;
  locations: Map<string, unknown>;
  sessions: Map<string, unknown>;
  cdrs: Map<string, unknown>;
  tariffs: Map<string, unknown>;
  tokens: Map<string, unknown>;
  authorizations: Map<string, unknown>;
  commands: Map<string, PendingCommand>;
}

// ---- Exchange (atom of recorder / logger / waiter / snapshot) ---------------
export interface OcpiHeaderInfo {
  requestId?: string;
  correlationId?: string;
  from?: { cc: string; party: string };
  to?: { cc: string; party: string };
  token?: string;
  tokenValid?: boolean;
}
export interface Finding {
  severity: 'info' | 'warn' | 'error';
  kind: 'header' | 'body' | 'auth' | 'status';
  module: RouteModule | 'unknown';
  seq: number;
  detail: string;
  issues?: unknown[];
  isKnownCitrineBug?: boolean;
}
export interface Exchange {
  seq: number;
  id: string; // `${seq}-${uuid}`
  direction: Direction;
  module: RouteModule | 'control' | 'unknown';
  operation: string; // 'locations.put.evse', 'command.START_SESSION'
  request: {
    method: string;
    url: string;
    path: string;
    query: Record<string, string>;
    headers: Record<string, string>;
    rawBody: string;
    body: unknown;
    ocpi: OcpiHeaderInfo;
  };
  response: {
    httpStatus: number;
    headers: Record<string, string>;
    body: unknown;
    ocpiStatusCode?: number;
  };
  validation: { schema?: string; ok: boolean; issues?: unknown[] };
  fault?: { ruleId: string; kind: string; detail: unknown };
  findings: Finding[];
  timing: { receivedAt: string; respondedAt?: string; durationMs?: number };
  flowId?: string; // correlation chain id
  scenario?: string;
}
export interface ExchangeFilter {
  direction?: Direction;
  module?: RouteModule | 'control';
  operation?: string;
  method?: string;
  pathMatches?: string; // regex source
  minSeq?: number; // inclusive "since" cursor for waitForReceived
  httpStatus?: number;
  ocpiStatusCode?: number;
  validationOk?: boolean;
  from?: { cc?: string; party?: string };
  to?: { cc?: string; party?: string };
  bodyMatch?: unknown; // deep-partial JSON subset match
  labels?: string[];
  limit?: number;
  offset?: number;
}

// ---- OcpiReply: pure handler intent; core builds the envelope --------------
export interface OcpiReply {
  statusCode: OcpiResponseStatusCode; // OCPI code inside the envelope (default 1000)
  data?: unknown; // omitted when empty:true
  status_message?: string;
  httpStatus?: number; // default 200
  headers?: Record<string, string>; // e.g. { Location: '<cdr get url>' }
  empty?: boolean; // true => build via buildOcpiEmptyResponse (no data)
}

// ---- Normalized request handed to module handlers --------------------------
export interface OcpiRequest {
  method: string;
  url: string;
  path: string;
  params: Record<string, string>;
  query: Record<string, string>;
  headers: Record<string, string>;
  rawBody: string;
  body: unknown;
}

// ---- MockContext: threaded into every handler and the control API ----------
export interface MockContext {
  config: MockConfig;
  identity: OcpiIdentity;
  store: Store;
  faults: FaultEngine;
  client: OcpiClient;
  log: WireLogger;
  // Per-request fields (populated by the dispatcher; undefined at singleton scope):
  req?: OcpiRequest;
  route?: OcpiRoute;
  event?: Exchange;
  auth?: { rawHeader?: string; decodedToken?: string; verified: boolean };
  routing?: { from?: { cc: string; party: string }; to?: { cc: string; party: string } };
  findings?: Finding[];
  // Envelope helpers (bound from envelope.ts, attached per request):
  ok(data?: unknown, status_message?: string): OcpiReply;
  empty(status_message?: string): OcpiReply;
  error(code: OcpiResponseStatusCode, status_message?: string, httpStatus?: number): OcpiReply;
}

// ---- Module registration signature (the spine) -----------------------------
export interface OcpiRoute {
  module: RouteModule;
  method: HttpMethod;
  path: string; // fastify path RELATIVE to def.mount, e.g. '/:cc/:party/:id'
  operation: string; // stable id, e.g. 'locations.put.connector'
  auth: AuthMode;
  requireRoutingHeaders: boolean;
  requestSchema?: ZodTypeAny; // reused ocpi-base schema -> inbound validation (records Finding)
  responseSchema: ZodTypeAny; // reused ocpi-base schema -> baseline self-check + fault target
  handle(ctx: MockContext): OcpiReply | Promise<OcpiReply>;
}
export interface ModuleDef {
  id: RouteModule;
  mount: string; // absolute mount, e.g. '/ocpi/2.2.1/emsp/locations'
  routes: OcpiRoute[];
}
// Implemented by registry.ts.
export type RegisterModule = (app: FastifyInstance, def: ModuleDef, ctx: MockContext) => void;

// ---- Store (recorder + domain + waiter) ------------------------------------
export interface Store {
  open(partial: Partial<Exchange> & Pick<Exchange, 'direction' | 'module' | 'operation'>): Exchange;
  record(x: Exchange): Exchange;
  query(f: ExchangeFilter): Exchange[];
  get(id: string): Exchange | undefined;
  // Resolves with the first Exchange matching f (scanning from f.minSeq inclusive so
  // already-arrived traffic is caught); rejects on timeout with nearest near-misses.
  waitForReceived(f: ExchangeFilter, timeoutMs: number): Promise<Exchange>;
  // Cheap size / newest-seq reads (avoid a full query({}) filter+sort just for length).
  count(): number;
  maxSeq(): number;
  domain: DomainState;
  findings: Finding[];
  addFinding(f: Finding): void;
  reset(opts?: { keepRegistration?: boolean }): void;
}

// ---- FaultEngine (adversary) — pure matcher; dispatcher applies the action --
export type FaultAction =
  | { kind: 'passthrough' }
  | { kind: 'delay'; ms: number }
  | { kind: 'abort' } // destroy socket, no response
  | { kind: 'unauthorized' } // 401 + 2002 envelope
  | { kind: 'httpStatus'; status: number; body?: unknown } // non-2xx
  | { kind: 'ocpiStatus'; status_code: number; status_message?: string } // valid envelope, wrong code
  | {
      kind: 'malformBody';
      mutation: 'dropRequired' | 'wrongType' | 'injectData' | 'emptyObject' | 'notJson';
      targetPath?: string;
    }
  | { kind: 'dropHeaders'; headers: string[] }
  | { kind: 'oversizeToken' }; // credentials only: token > 64 chars
export interface FaultRule {
  id: string;
  enabled: boolean;
  match: ExchangeFilter;
  scope?: { times?: number; afterSeq?: number; probability?: number };
  action: FaultAction;
}
export interface FaultTarget {
  direction: Direction;
  module: RouteModule | 'control';
  method: string;
  path: string;
}
export interface FaultDecision {
  rule: FaultRule;
  action: FaultAction;
}
export interface FaultEngine {
  arm(rule: FaultRule): void;
  disarm(id: string): void;
  clear(): void;
  list(): FaultRule[];
  loadScenarioFaults(rules: FaultRule[]): void;
  // Returns the first armed rule matching target (honoring scope/hit-counters), or undefined.
  decide(target: FaultTarget, ex: Exchange): FaultDecision | undefined;
}

// ---- OcpiClient (actor) ----------------------------------------------------
export interface OutboundCall {
  method: HttpMethod;
  url: string;
  module: RouteModule;
  operation: string;
  functional: boolean; // add OCPI-* routing headers when true
  body?: unknown;
  responseSchema?: ZodTypeAny; // validate Citrine's response (drift => Finding)
  presentToken?: string; // overrides registration.tokenWePresent (e.g. TOKEN_A)
  // When the response status equals this, the generic "Citrine returned HTTP N"
  // warn finding is suppressed (schema validation still runs). For probes whose
  // EXPECTED outcome is a non-2xx — e.g. the stale-token 401 check after a
  // credentials rotation — where the warn would be noise on a passing probe.
  expectHttpStatus?: number;
}
export interface RegisterOptions {
  tokenA?: string;
  mode?: 'msp-initiated' | 'cpo-initiated';
}
export interface CommandSendResult {
  sync: unknown; // Citrine's sync CommandResponse
  responseUrl: string;
  awaitResult(timeoutMs?: number): Promise<Exchange>;
}
export interface OcpiClient {
  call(spec: OutboundCall): Promise<Exchange>;
  getVersions(url: string, token?: string): Promise<Exchange>;
  getVersionDetails(url: string, token?: string): Promise<Exchange>;
  register(opts?: RegisterOptions): Promise<RegistrationState>;
  reregister(): Promise<RegistrationState>;
  // Rotate our credentials AT the CPO: PUT a fresh token to cpoCredentialsUrl,
  // adopt the CPO's newly-minted server token, then probe that the OLD token is
  // rejected (401). reregister() stays discovery-only; the control API composes
  // reregister + rotateCredentials for the dashboard's Re-register button.
  rotateCredentials(): Promise<RegistrationState>;
  unregister(): Promise<void>;
  sendCommand(type: CommandType, payload: unknown): Promise<CommandSendResult>;
  pull(module: ModuleId, params?: Record<string, string>): Promise<Exchange>;
}

// ---- WireLogger ------------------------------------------------------------
export interface WireLogger {
  record(x: Exchange): void;
  child(bindings: Record<string, unknown>): WireLogger;
}

// ---- Scenario --------------------------------------------------------------
export interface Scenario {
  name: string;
  identity?: Partial<OcpiIdentity>;
  registration: 'unregistered' | 'preregistered';
  authorize?: { default: string; byUid?: Record<string, string> };
  faults?: FaultRule[];
  strictInbound?: boolean;
  expect?: { on: string; assert: string; detail?: string }[];
}
