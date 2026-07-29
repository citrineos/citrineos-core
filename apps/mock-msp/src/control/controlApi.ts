// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// FILE: apps/mock-msp/src/control/controlApi.ts   (owner: build:control)
// ----------------------------------------------------------------------------
// The /_mock control API — the test-harness driver surface. Plain JSON, NEVER
// OCPI-enveloped, NEVER OCPI-authenticated (optional shared-secret preHandler).
// Mounted as an encapsulated Fastify plugin under the '/_mock' prefix so its
// preHandler hook is scoped and cannot leak onto the /ocpi routes.
//
// It reaches into ctx.store (recorder + domain + waiter), ctx.faults (adversary)
// and ctx.client (actor). It does NOT register OCPI routes and does NOT run the
// dispatcher pipeline — control exchanges are meta-operations on the recorder
// itself and are deliberately NOT recorded (so they never pollute the OCPI trace
// that tests assert on, nor wake waitForReceived waiters).
//
// Route map (union of the build:control task + the frozen controlApi spec):
//   INSPECTION
//     GET    /_mock/health                     up + registration/faults summary
//     GET    /_mock/registration               current RegistrationState
//     GET    /_mock/state                       full DomainState snapshot
//     GET    /_mock/state/:module               one domain slice
//     GET    /_mock/exchanges[?filter|params]   query recorded exchanges
//     GET    /_mock/exchanges/:id               one exchange
//     GET    /_mock/received/:module            inbound exchanges for a module
//     GET    /_mock/findings   DELETE /_mock/findings
//   WAIT (the async primitive)
//     POST   /_mock/exchanges/wait {filter,timeoutMs}
//     GET    /_mock/wait?...&timeoutMs=
//   CONTROL — lifecycle / actor
//     POST   /_mock/reset {keepRegistration?}
//     GET|POST /_mock/scenario                  read / hot-load a Scenario
//     POST   /_mock/scenarios/:id/evaluate      run the expect[] oracle
//     POST   /_mock/register?mode=  /_mock/reregister  /_mock/unregister
//     POST   /_mock/authorize {default,byUid}   set tokens/authorize policy live
//     POST   /_mock/commands/:type              send a command to Citrine
//     POST   /_mock/emit/command {type,payload} alias of the above
//     POST   /_mock/emit/token {..TokenDTO}     PUT a token to Citrine's receiver
//     POST   /_mock/pull/:module                GET Citrine's CPO SENDER endpoint
//   ADVERSARY — faults
//     GET /_mock/faults  POST /_mock/faults  POST /_mock/fault
//     DELETE /_mock/faults  DELETE /_mock/faults/:id
// ============================================================================
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { ZodTypeAny } from 'zod';
import type {
  DomainState,
  Exchange,
  ExchangeFilter,
  FaultRule,
  MockContext,
  Scenario,
} from '../core/types.js';
import {
  CommandType,
  ModuleId,
  OcpiEmptyResponseSchema,
  TokenType,
  TokenDTOSchema,
  StartSessionSchema,
  StopSessionSchema,
  ReserveNowSchema,
  CancelReservationSchema,
  UnlockConnectorSchema,
} from '../ocpi/barrel.js';
import { uuid } from '../core/ids.js';
import {
  ScenarioSchema,
  FaultRuleInputSchema,
  AuthorizePolicySchema,
  applyScenario,
  evaluateExpectations,
  getScenarioRuntime,
  resetScenarioRuntime,
  setAuthorizePolicy,
} from './scenario.js';

// ---------------------------------------------------------------------------
// small helpers
// ---------------------------------------------------------------------------
type Query = Record<string, string | undefined>;

function errorBody(
  error: string,
  err: unknown,
  extra?: Record<string, unknown>,
): Record<string, unknown> {
  return { error, message: err instanceof Error ? err.message : String(err), ...extra };
}

function mapObj<T>(m: Map<string, T>): Record<string, T> {
  return Object.fromEntries(m.entries()) as Record<string, T>;
}

function serializeDomain(d: DomainState): Record<string, unknown> {
  return {
    registration: d.registration,
    locations: mapObj(d.locations),
    sessions: mapObj(d.sessions),
    cdrs: mapObj(d.cdrs),
    tariffs: mapObj(d.tariffs),
    tokens: mapObj(d.tokens),
    authorizations: mapObj(d.authorizations),
    commands: mapObj(d.commands),
  };
}

/** Build an ExchangeFilter from GET query params, or a whole ?filter=<json>. */
function filterFromQuery(q: Query): ExchangeFilter {
  if (typeof q.filter === 'string' && q.filter.trim().startsWith('{')) {
    try {
      return JSON.parse(q.filter) as ExchangeFilter;
    } catch {
      /* fall through to param parsing */
    }
  }
  const f: ExchangeFilter = {};
  const num = (v: string | undefined): number | undefined =>
    v != null && v !== '' && !Number.isNaN(Number(v)) ? Number(v) : undefined;

  if (q.direction === 'inbound' || q.direction === 'outbound') f.direction = q.direction;
  if (q.module) f.module = q.module as ExchangeFilter['module'];
  if (q.operation) f.operation = q.operation;
  if (q.method) f.method = q.method.toUpperCase();
  if (q.pathMatches) f.pathMatches = q.pathMatches;
  if (num(q.minSeq) !== undefined) f.minSeq = num(q.minSeq);
  if (num(q.httpStatus) !== undefined) f.httpStatus = num(q.httpStatus);
  if (num(q.ocpiStatusCode) !== undefined) f.ocpiStatusCode = num(q.ocpiStatusCode);
  if (q.validationOk === 'true' || q.validationOk === 'false')
    f.validationOk = q.validationOk === 'true';
  if (num(q.limit) !== undefined) f.limit = num(q.limit);
  if (num(q.offset) !== undefined) f.offset = num(q.offset);

  const fromCc = q['from.cc'] ?? q.fromCc;
  const fromParty = q['from.party'] ?? q.fromParty;
  if (fromCc || fromParty) f.from = { cc: fromCc, party: fromParty };
  const toCc = q['to.cc'] ?? q.toCc;
  const toParty = q['to.party'] ?? q.toParty;
  if (toCc || toParty) f.to = { cc: toCc, party: toParty };

  return f;
}

function normalizeCommandType(v: string | undefined): CommandType | undefined {
  if (!v) return undefined;
  const up = v.toUpperCase();
  return (Object.values(CommandType) as string[]).includes(up) ? (up as CommandType) : undefined;
}

function normalizeModuleId(v: string | undefined): ModuleId | undefined {
  const low = (v ?? '').toLowerCase();
  return (Object.values(ModuleId) as string[]).includes(low) ? (low as ModuleId) : undefined;
}

const commandSchemas: Record<string, ZodTypeAny> = {
  [CommandType.START_SESSION]: StartSessionSchema,
  [CommandType.STOP_SESSION]: StopSessionSchema,
  [CommandType.RESERVE_NOW]: ReserveNowSchema,
  [CommandType.CANCEL_RESERVATION]: CancelReservationSchema,
  [CommandType.UNLOCK_CONNECTOR]: UnlockConnectorSchema,
};

/**
 * Schema-valid default command bodies so the dashboard "Send command" button is a
 * clean exercise of Citrine's sync ACCEPTED/REJECTED/NOT_SUPPORTED path instead of
 * a 400 on an empty {}. The caller's explicit payload is merged OVER these defaults
 * (caller wins), and `response_url` is intentionally omitted — the actor mints it.
 */
function commandDefaults(): Partial<Record<CommandType, Record<string, unknown>>> {
  const now = new Date().toISOString();
  const token = {
    country_code: 'US',
    party_id: 'TST',
    uid: 'MOCK-RFID-001',
    type: TokenType.RFID,
    contract_id: 'MOCKCONTRACT-001',
    issuer: 'MockMSP',
    valid: true,
    whitelist: 'ALWAYS',
    last_updated: now,
  };
  return {
    [CommandType.START_SESSION]: {
      token,
      location_id: 'LOC1',
      evse_uid: 'EVSE1',
      connector_id: '1',
    },
    [CommandType.STOP_SESSION]: { session_id: 'SESSION1' },
    [CommandType.CANCEL_RESERVATION]: { reservation_id: 'RES1' },
    [CommandType.UNLOCK_CONNECTOR]: {
      location_id: 'LOC1',
      evse_uid: 'EVSE1',
      connector_id: '1',
    },
    [CommandType.RESERVE_NOW]: {
      token,
      expiry_date: new Date(Date.now() + 3600_000).toISOString(),
      reservation_id: 'RES1',
      location_id: 'LOC1',
    },
  };
}

function healthPayload(ctx: MockContext): Record<string, unknown> {
  const reg = ctx.store.domain.registration;
  const rt = getScenarioRuntime();
  return {
    status: 'up',
    party: `${ctx.identity.country_code}/${ctx.identity.party_id}`,
    role: ctx.identity.role,
    registration: { status: reg.status, registeredAt: reg.registeredAt },
    scenario: rt.name,
    exchanges: ctx.store.query({}).length,
    findings: ctx.store.findings.length,
    faults: ctx.faults.list().length,
    authorize: rt.authorize.default,
  };
}

interface WaitBody {
  filter?: ExchangeFilter;
  timeoutMs?: number;
}
async function waitHandler(
  ctx: MockContext,
  body: WaitBody,
  reply: FastifyReply,
): Promise<unknown> {
  const filter = body.filter ?? {};
  const timeoutMs = typeof body.timeoutMs === 'number' ? body.timeoutMs : 5000;
  try {
    return await ctx.store.waitForReceived(filter, timeoutMs);
  } catch (err) {
    const nearMisses = (err as { nearMisses?: unknown[] })?.nearMisses ?? [];
    return reply.code(408).send(errorBody('timeout', err, { nearMisses, filter, timeoutMs }));
  }
}

async function emitCommand(
  ctx: MockContext,
  typeRaw: string | undefined,
  payload: unknown,
  reply: FastifyReply,
): Promise<unknown> {
  const type = normalizeCommandType(typeRaw);
  if (!type) {
    return reply
      .code(400)
      .send({ error: 'unknown_command_type', got: typeRaw, valid: Object.values(CommandType) });
  }
  // Best-effort validation against the reused ocpi-base schema. response_url is
  // minted by the actor (OcpiClient.sendCommand), so we probe with a placeholder
  // and never block on its absence — the report just surfaces any real drift.
  const schema = commandSchemas[type];
  const explicit = (payload && typeof payload === 'object' ? payload : {}) as Record<
    string,
    unknown
  >;
  // Merge a schema-valid per-type default UNDER the caller's payload (caller wins),
  // so an empty {} yields a clean, valid command instead of a 400. response_url is
  // NOT included here — the actor (OcpiClient.sendCommand) mints it.
  const src: Record<string, unknown> = { ...(commandDefaults()[type] ?? {}), ...explicit };
  const probe = { response_url: 'https://mock.invalid/cb', ...src };
  const parsed = schema.safeParse(probe);
  const payloadValidation = parsed.success
    ? { ok: true as const }
    : { ok: false as const, issues: parsed.error.issues };

  try {
    const result = await ctx.client.sendCommand(type, src);
    return { command: type, sync: result.sync, responseUrl: result.responseUrl, payloadValidation };
  } catch (err) {
    return reply.code(502).send(errorBody('command_send_failed', err, { payloadValidation }));
  }
}

async function emitToken(
  ctx: MockContext,
  body: Record<string, unknown>,
  reply: FastifyReply,
): Promise<unknown> {
  const now = new Date().toISOString();
  const base = {
    country_code: ctx.identity.country_code,
    party_id: ctx.identity.party_id,
    uid: `MOCK-${uuid().slice(0, 8)}`,
    type: TokenType.RFID,
    contract_id: `MOCKCONTRACT-${uuid().slice(0, 8)}`,
    issuer: ctx.identity.business_details.name,
    valid: true,
    whitelist: 'ALWAYS',
    last_updated: now,
  };
  const token = { ...base, ...body } as Record<string, unknown>;

  const parsed = TokenDTOSchema.safeParse(token);
  if (!parsed.success) {
    return reply.code(400).send({ error: 'invalid_token', issues: parsed.error.issues, token });
  }

  const ep = ctx.store.domain.registration.cpoEndpoints.find(
    (e) => e.identifier === ModuleId.Tokens || e.identifier === 'tokens',
  );
  const endpointBase = ep?.url ?? `${ctx.config.citrineOcpiBaseUrl}/2.2.1/tokens`;
  const url = `${endpointBase}/${token.country_code}/${token.party_id}/${token.uid}`;

  try {
    const ex = await ctx.client.call({
      method: 'PUT',
      url,
      module: ModuleId.Tokens,
      operation: 'tokens.push',
      functional: true,
      body: token,
      responseSchema: OcpiEmptyResponseSchema,
    });
    return { pushed: true, url, tokenUid: token.uid, exchange: ex };
  } catch (err) {
    return reply.code(502).send(errorBody('token_push_failed', err, { url }));
  }
}

function armFault(ctx: MockContext, body: unknown, reply: FastifyReply): unknown {
  const parsed = FaultRuleInputSchema.safeParse(body);
  if (!parsed.success) {
    return reply.code(400).send({ error: 'invalid_fault', issues: parsed.error.issues });
  }
  const rule: FaultRule = {
    id: parsed.data.id ?? `fault-${uuid().slice(0, 8)}`,
    enabled: parsed.data.enabled ?? true,
    match: parsed.data.match as ExchangeFilter,
    scope: parsed.data.scope,
    action: parsed.data.action as FaultRule['action'],
  };
  ctx.faults.arm(rule);
  return { armed: rule.id, rule };
}

// ---------------------------------------------------------------------------
// PROVOKE — make Citrine push to us (Hasura write -> pgNotify -> OCPI broadcast).
// This is a CONTROL action (a raw fetch to Hasura), deliberately NOT routed
// through ctx.client, so it is never recorded as an OCPI exchange. The resulting
// Citrine push arrives INBOUND on /ocpi/2.2.1/emsp/locations and IS recorded by
// the dispatcher — that inbound exchange is the observable "both directions" proof.
// ---------------------------------------------------------------------------
interface HasuraResult {
  status: number;
  json: Record<string, unknown>;
}

async function hasuraFetch(url: string, query: string, variables?: unknown): Promise<HasuraResult> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(variables !== undefined ? { query, variables } : { query }),
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { status: res.status, json };
}

/** A GraphQL response carries `errors` on failure even with HTTP 200. */
function hasuraErrors(r: HasuraResult): unknown[] | undefined {
  const errs = (r.json as { errors?: unknown[] }).errors;
  return Array.isArray(errs) && errs.length ? errs : undefined;
}

async function nextLocationId(url: string): Promise<number> {
  const r = await hasuraFetch(url, '{ Locations_aggregate { aggregate { max { id } } } }');
  if (hasuraErrors(r))
    throw new Error('Hasura aggregate query failed: ' + JSON.stringify(hasuraErrors(r)));
  const max = (
    (
      (r.json.data as Record<string, unknown> | undefined)?.Locations_aggregate as
        | Record<string, unknown>
        | undefined
    )?.aggregate as Record<string, unknown> | undefined
  )?.max as { id?: number } | undefined;
  return (max?.id ?? 0) + 1;
}

async function provoke(ctx: MockContext, what: string, reply: FastifyReply): Promise<unknown> {
  const url = ctx.config.citrineHasuraUrl;

  if (what === 'location-nudge') {
    // Bump name + updatedAt on an existing Location -> Citrine broadcasts a PATCH.
    const stamp = new Date().toISOString();
    const query =
      'mutation Nudge($name: String!, $ts: timestamptz!) {' +
      ' update_Locations(where: { id: { _eq: 2 } }, _set: { name: $name, updatedAt: $ts })' +
      ' { affected_rows returning { id name updatedAt } } }';
    const variables = { name: `Nudge probe ${stamp}`, ts: stamp };
    let r: HasuraResult;
    try {
      r = await hasuraFetch(url, query, variables);
    } catch (err) {
      return reply.code(502).send(errorBody('provoke_failed', err, { what }));
    }
    if (hasuraErrors(r)) {
      return reply.code(502).send({ error: 'hasura_error', what, issues: hasuraErrors(r) });
    }
    const affected =
      ((
        (r.json.data as Record<string, unknown> | undefined)?.update_Locations as
          | Record<string, unknown>
          | undefined
      )?.affected_rows as number | undefined) ?? 0;
    return {
      provoked: true,
      what,
      hasuraStatus: r.status,
      mutationSummary: `update_Locations id=2 -> affected_rows=${affected}; expect inbound PATCH /ocpi/2.2.1/emsp/locations/US/S44/2`,
    };
  }

  if (what === 'location-add') {
    // Insert a new Location with 4-decimal coordinates -> Citrine broadcasts a PUT,
    // surfacing the GeoLocationSchema coordinates bug. jsonb (facilities/openingHours)
    // MUST be native JSON (variables form) or the mapper throws and no PUT fires.
    let id: number;
    try {
      id = await nextLocationId(url);
    } catch (err) {
      return reply.code(502).send(errorBody('provoke_failed', err, { what }));
    }
    const stamp = new Date().toISOString();
    const query =
      'mutation Add($obj: Locations_insert_input!) { insert_Locations_one(object: $obj) { id name } }';
    const variables = {
      obj: {
        id,
        name: `Provoke Add ${id}`,
        address: '9 Volt Way',
        city: 'Oakland',
        postalCode: '94607',
        state: 'CA',
        country: 'USA',
        timeZone: 'America/Los_Angeles',
        publishUpstream: true,
        parkingType: 'AlongMotorway',
        facilities: ['Cafe'],
        coordinates: { type: 'Point', coordinates: [-122.4194, 37.7749] },
        openingHours: { twentyfourSeven: true },
        tenantId: 1,
        createdAt: stamp,
        updatedAt: stamp,
      },
    };
    let r: HasuraResult;
    try {
      r = await hasuraFetch(url, query, variables);
    } catch (err) {
      return reply.code(502).send(errorBody('provoke_failed', err, { what }));
    }
    if (hasuraErrors(r)) {
      return reply.code(502).send({ error: 'hasura_error', what, issues: hasuraErrors(r) });
    }
    return {
      provoked: true,
      what,
      hasuraStatus: r.status,
      mutationSummary: `insert_Locations_one id=${id} (4-decimal coords) -> expect inbound PUT /ocpi/2.2.1/emsp/locations/US/S44/${id} with coordinates finding`,
    };
  }

  return reply.code(400).send({
    error: 'unknown_provoke',
    what,
    valid: ['location-add', 'location-nudge'],
  });
}

// ---------------------------------------------------------------------------
// COVERAGE — pure read over the recorder: module x direction pass/fail matrix.
// lastOk = validation.ok of the most-recent exchange for that module+direction
// (null when never exercised).
// ---------------------------------------------------------------------------
const COVERAGE_MODULES = [
  'locations',
  'tariffs',
  'sessions',
  'cdrs',
  'tokens',
  'commands',
  'credentials',
  'versions',
  'chargingprofiles',
] as const;

function directionCell(exchanges: Exchange[]): { count: number; lastOk: boolean | null } {
  if (exchanges.length === 0) return { count: 0, lastOk: null };
  const last = exchanges[exchanges.length - 1];
  return { count: exchanges.length, lastOk: last.validation.ok !== false };
}

function buildCoverage(ctx: MockContext): Record<string, unknown> {
  const all = ctx.store.query({});
  const modules = COVERAGE_MODULES.map((module) => {
    const inbound = all.filter((e) => e.module === module && e.direction === 'inbound');
    const outbound = all.filter((e) => e.module === module && e.direction === 'outbound');
    return { module, inbound: directionCell(inbound), outbound: directionCell(outbound) };
  });
  return { modules, generatedAt: new Date().toISOString() };
}

// ---------------------------------------------------------------------------
// registerControlApi — the export the integrator (server.ts) wires in.
// ---------------------------------------------------------------------------
export function registerControlApi(app: FastifyInstance, ctx: MockContext): void {
  app.register(
    async (mock) => {
      // Optional shared-secret guard, scoped to this encapsulated plugin only.
      if (ctx.config.controlSecret) {
        mock.addHook('preHandler', async (req: FastifyRequest, reply: FastifyReply) => {
          if (req.headers['x-mock-control-secret'] !== ctx.config.controlSecret) {
            return reply
              .code(401)
              .send({ error: 'unauthorized', message: 'invalid or missing x-mock-control-secret' });
          }
          return undefined;
        });
      }

      // ---- INSPECTION -----------------------------------------------------
      mock.get('/health', async () => healthPayload(ctx));
      mock.get('/registration', async () => ctx.store.domain.registration);
      mock.get('/state', async () => serializeDomain(ctx.store.domain));
      mock.get('/state/:module', async (req, reply) => {
        const key = (req.params as { module: string }).module;
        const d = ctx.store.domain;
        switch (key) {
          case 'registration':
            return d.registration;
          case 'locations':
            return mapObj(d.locations);
          case 'sessions':
            return mapObj(d.sessions);
          case 'cdrs':
            return mapObj(d.cdrs);
          case 'tariffs':
            return mapObj(d.tariffs);
          case 'tokens':
            return mapObj(d.tokens);
          case 'authorizations':
            return mapObj(d.authorizations);
          case 'commands':
            return mapObj(d.commands);
          default:
            return reply.code(404).send({ error: 'unknown_module', module: key });
        }
      });
      mock.get('/findings', async () => ctx.store.findings);
      mock.delete('/findings', async () => {
        ctx.store.findings.length = 0;
        return { cleared: true };
      });

      mock.get('/exchanges', async (req) => ctx.store.query(filterFromQuery(req.query as Query)));
      mock.get('/exchanges/:id', async (req, reply) => {
        const ex = ctx.store.get((req.params as { id: string }).id);
        if (!ex) return reply.code(404).send({ error: 'not_found' });
        return ex;
      });
      mock.get('/received/:module', async (req) => {
        const f = filterFromQuery(req.query as Query);
        f.module = (req.params as { module: string }).module as ExchangeFilter['module'];
        if (f.direction === undefined) f.direction = 'inbound';
        return ctx.store.query(f);
      });

      // ---- WAIT -----------------------------------------------------------
      mock.post('/exchanges/wait', async (req, reply) =>
        waitHandler(ctx, (req.body as WaitBody | undefined) ?? {}, reply),
      );
      mock.get('/wait', async (req, reply) => {
        const q = req.query as Query;
        const timeoutMs = q.timeoutMs ? Number(q.timeoutMs) : 5000;
        return waitHandler(ctx, { filter: filterFromQuery(q), timeoutMs }, reply);
      });

      // ---- CONTROL: lifecycle --------------------------------------------
      mock.post('/reset', async (req) => {
        const body = (req.body as { keepRegistration?: boolean } | undefined) ?? {};
        const keepRegistration = body.keepRegistration === true;
        ctx.store.reset({ keepRegistration });
        ctx.faults.clear();
        resetScenarioRuntime();
        return { reset: true, keepRegistration };
      });

      // ---- CONTROL: scenario ---------------------------------------------
      mock.get('/scenario', async () => getScenarioRuntime());
      mock.post('/scenario', async (req, reply) => {
        const parsed = ScenarioSchema.safeParse(req.body);
        if (!parsed.success) {
          return reply.code(400).send({ error: 'invalid_scenario', issues: parsed.error.issues });
        }
        applyScenario(ctx, parsed.data as Scenario);
        return { applied: parsed.data.name, runtime: getScenarioRuntime() };
      });
      mock.post('/scenarios/:id/evaluate', async (_req, reply) => {
        const scn = getScenarioRuntime().activeScenario;
        if (!scn) return reply.code(409).send({ error: 'no_active_scenario' });
        return evaluateExpectations(ctx, scn);
      });

      // ---- CONTROL: registration handshake -------------------------------
      mock.post('/register', async (req, reply) => {
        const q = req.query as Query;
        const bodyMode = (req.body as { mode?: string } | undefined)?.mode;
        const mode = (q.mode ?? bodyMode) as 'msp-initiated' | 'cpo-initiated' | undefined;
        // If credentials are already established (e.g. via the DB seed), the OCPI
        // handshake has nothing to do — there is no CREDENTIALS_TOKEN_A to generate.
        // Report that plainly instead of surfacing a scary 502 to the operator.
        const current = ctx.store.domain.registration;
        if (current?.status === 'registered') {
          return { registered: true, alreadyRegistered: true, registration: current };
        }
        try {
          const reg = await ctx.client.register(mode ? { mode } : undefined);
          return { registered: true, registration: reg };
        } catch (err) {
          return reply.code(502).send(errorBody('register_failed', err));
        }
      });
      mock.post('/reregister', async (_req, reply) => {
        try {
          return { registration: await ctx.client.reregister() };
        } catch (err) {
          return reply.code(502).send(errorBody('reregister_failed', err));
        }
      });
      mock.post('/unregister', async (_req, reply) => {
        try {
          await ctx.client.unregister();
          return { unregistered: true, registration: ctx.store.domain.registration };
        } catch (err) {
          return reply.code(502).send(errorBody('unregister_failed', err));
        }
      });

      // ---- CONTROL: authorize policy -------------------------------------
      mock.post('/authorize', async (req, reply) => {
        const parsed = AuthorizePolicySchema.safeParse(req.body);
        if (!parsed.success) {
          return reply.code(400).send({ error: 'invalid_authorize', issues: parsed.error.issues });
        }
        setAuthorizePolicy(parsed.data);
        return { authorize: getScenarioRuntime().authorize };
      });

      // ---- CONTROL: actor emit -------------------------------------------
      mock.post('/commands/:type', async (req, reply) =>
        emitCommand(ctx, (req.params as { type: string }).type, req.body, reply),
      );
      mock.post('/emit/command', async (req, reply) => {
        const body = (req.body as Record<string, unknown> | undefined) ?? {};
        const type = (body.type ?? body.command) as string | undefined;
        const payload = body.payload ?? body;
        return emitCommand(ctx, type, payload, reply);
      });
      mock.post('/emit/token', async (req, reply) =>
        emitToken(ctx, (req.body as Record<string, unknown> | undefined) ?? {}, reply),
      );
      mock.post('/pull/:module', async (req, reply) => {
        const mod = normalizeModuleId((req.params as { module: string }).module);
        if (!mod) {
          return reply.code(400).send({
            error: 'unknown_module',
            valid: [ModuleId.Locations, ModuleId.Sessions, ModuleId.Cdrs, ModuleId.Tariffs],
          });
        }
        const params = (req.body as Record<string, string> | undefined) ?? undefined;
        try {
          const ex = await ctx.client.pull(mod, params);
          return { pulled: mod, exchange: ex };
        } catch (err) {
          return reply.code(502).send(errorBody('pull_failed', err));
        }
      });

      // ---- PROVOKE / COVERAGE (Citrine -> mock; both-directions proof) ----
      mock.post('/provoke/:what', async (req, reply) =>
        provoke(ctx, (req.params as { what: string }).what, reply),
      );
      mock.get('/coverage', async () => buildCoverage(ctx));

      // ---- ADVERSARY: faults ---------------------------------------------
      mock.get('/faults', async () => ctx.faults.list());
      mock.post('/faults', async (req, reply) => armFault(ctx, req.body, reply));
      mock.post('/fault', async (req, reply) => armFault(ctx, req.body, reply));
      mock.delete('/faults', async () => {
        ctx.faults.clear();
        return { cleared: true };
      });
      mock.delete('/faults/:id', async (req) => {
        const id = (req.params as { id: string }).id;
        ctx.faults.disarm(id);
        return { disarmed: id };
      });
    },
    { prefix: '/_mock' },
  );
}
