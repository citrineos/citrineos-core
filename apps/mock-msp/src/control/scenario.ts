// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// ----------------------------------------------------------------------------
// Scenario = the single checked-in file that is simultaneously the adversary
// config, the registration state, and the assertion oracle. This module owns:
//   - the zod schema that validates a Scenario (+ FaultRule / ExchangeFilter /
//     authorize-policy sub-schemas), reusing the ocpi-base AuthorizationInfoAllowed
//     enum for the authorize values (zero drift);
//   - loadScenario(path)   -> read + validate a Scenario JSON;
//   - applyScenario(ctx,s) -> mutate registration state, set the authorize policy,
//     arm the scenario's faults;
//   - evaluateExpectations(ctx,s) -> run the expect[] oracle over the recorded
//     trace and return a pass/fail report;
//   - a process-singleton "scenario runtime" (authorize policy + strictInbound +
//     active scenario) that the tokens module reads via getScenarioRuntime() /
//     resolveAuthorize() so tokens/authorize answers ALLOWED|BLOCKED|... per policy.
//
// Imports: ocpi-base ONLY through ../ocpi/barrel.js; shared types from
// ../core/types.js; zod directly (the catalog 4.1.12 instance).
// ============================================================================
import { z } from 'zod';
import { readFileSync } from 'node:fs';
import { AuthorizationInfoAllowed } from '../ocpi/barrel.js';
import type { MockContext, Scenario, ExchangeFilter, Exchange } from '../core/types.js';

// ---------------------------------------------------------------------------
// zod schemas (Scenario + friends). FaultRule / ExchangeFilter / Scenario are
// mock-local shapes (NOT ocpi objects), so we author their validators here; the
// authorize VALUES reuse the ocpi-base enum so only genuine OCPI values pass.
// ---------------------------------------------------------------------------

const allowedValues = Object.values(AuthorizationInfoAllowed) as [string, ...string[]];

/** ALLOWED | BLOCKED | EXPIRED | NO_CREDIT | NOT_ALLOWED (reused from ocpi-base). */
export const AllowedSchema = z.enum(allowedValues);

/** POST /_mock/authorize body + Scenario.authorize. */
export const AuthorizePolicySchema = z.object({
  default: AllowedSchema,
  byUid: z.record(z.string(), AllowedSchema).optional(),
});

const exchangeFilterSchema = z.object({
  direction: z.enum(['inbound', 'outbound']).optional(),
  module: z.string().optional(),
  operation: z.string().optional(),
  method: z.string().optional(),
  pathMatches: z.string().optional(),
  minSeq: z.number().int().optional(),
  httpStatus: z.number().int().optional(),
  ocpiStatusCode: z.number().int().optional(),
  validationOk: z.boolean().optional(),
  from: z.object({ cc: z.string().optional(), party: z.string().optional() }).optional(),
  to: z.object({ cc: z.string().optional(), party: z.string().optional() }).optional(),
  bodyMatch: z.unknown().optional(),
  labels: z.array(z.string()).optional(),
  limit: z.number().int().optional(),
  offset: z.number().int().optional(),
});

const faultScopeSchema = z.object({
  times: z.number().int().optional(),
  afterSeq: z.number().int().optional(),
  probability: z.number().optional(),
});

const faultActionSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('passthrough') }),
  z.object({ kind: z.literal('delay'), ms: z.number().int().nonnegative() }),
  z.object({ kind: z.literal('abort') }),
  z.object({ kind: z.literal('unauthorized') }),
  z.object({
    kind: z.literal('httpStatus'),
    status: z.number().int(),
    body: z.unknown().optional(),
  }),
  z.object({
    kind: z.literal('ocpiStatus'),
    status_code: z.number().int(),
    status_message: z.string().optional(),
  }),
  z.object({
    kind: z.literal('malformBody'),
    mutation: z.enum(['dropRequired', 'wrongType', 'injectData', 'emptyObject', 'notJson']),
    targetPath: z.string().optional(),
  }),
  z.object({ kind: z.literal('dropHeaders'), headers: z.array(z.string()) }),
  z.object({ kind: z.literal('oversizeToken') }),
]);

/** Full FaultRule (id + enabled required) — used inside Scenario.faults. */
export const FaultRuleSchema = z.object({
  id: z.string(),
  enabled: z.boolean(),
  match: exchangeFilterSchema,
  scope: faultScopeSchema.optional(),
  action: faultActionSchema,
});

/** POST /_mock/fault(s) body — id/enabled optional, control fills defaults. */
export const FaultRuleInputSchema = z.object({
  id: z.string().optional(),
  enabled: z.boolean().optional(),
  match: exchangeFilterSchema,
  scope: faultScopeSchema.optional(),
  action: faultActionSchema,
});

const businessDetailsSchema = z.object({
  name: z.string(),
  website: z.string().optional(),
  logo: z
    .object({
      url: z.string(),
      type: z.string(),
      category: z.string(),
      width: z.number().optional(),
      height: z.number().optional(),
    })
    .optional(),
});

const identityPartialSchema = z.object({
  country_code: z.string().optional(),
  party_id: z.string().optional(),
  role: z.literal('EMSP').optional(),
  business_details: businessDetailsSchema.optional(),
  version: z.literal('2.2.1').optional(),
});

const expectationSchema = z.object({
  on: z.string(),
  assert: z.string(),
  detail: z.string().optional(),
});

/** The authoritative Scenario validator. */
export const ScenarioSchema = z.object({
  name: z.string(),
  identity: identityPartialSchema.optional(),
  registration: z.enum(['unregistered', 'preregistered']),
  authorize: AuthorizePolicySchema.optional(),
  faults: z.array(FaultRuleSchema).optional(),
  strictInbound: z.boolean().optional(),
  expect: z.array(expectationSchema).optional(),
});

// ---------------------------------------------------------------------------
// Scenario runtime singleton — the authorize policy + strictInbound flag + the
// active scenario. Lives here (not on DomainState) so both the
// control API and the tokens module can read one source of truth via imports.
// ---------------------------------------------------------------------------
export interface ScenarioRuntimeState {
  name: string | null;
  authorize: { default: string; byUid: Record<string, string> };
  strictInbound: boolean;
  activeScenario: Scenario | null;
}

function defaultRuntime(): ScenarioRuntimeState {
  return {
    name: null,
    authorize: { default: AuthorizationInfoAllowed.Allowed, byUid: {} },
    strictInbound: false,
    activeScenario: null,
  };
}

let runtime: ScenarioRuntimeState = defaultRuntime();

/** Read the current scenario runtime (tokens module + control API call this). */
export function getScenarioRuntime(): ScenarioRuntimeState {
  return runtime;
}

export function setScenarioRuntime(next: ScenarioRuntimeState): void {
  runtime = next;
}

export function resetScenarioRuntime(): void {
  runtime = defaultRuntime();
}

/** Live-update just the authorize policy (POST /_mock/authorize). */
export function setAuthorizePolicy(policy: {
  default: string;
  byUid?: Record<string, string>;
}): void {
  runtime = { ...runtime, authorize: { default: policy.default, byUid: policy.byUid ?? {} } };
}

/**
 * Resolve the AuthorizationInfoAllowed value for a token uid: a per-uid override
 * wins, else the scenario default. The tokens module MUST call this so its
 * tokens/{uid}/authorize reply reflects the active scenario.
 */
export function resolveAuthorize(tokenUid: string): string {
  return runtime.authorize.byUid[tokenUid] ?? runtime.authorize.default;
}

/** Whether a schema-invalid inbound body should be rejected (2001) vs recorded. */
export function isStrictInbound(): boolean {
  return runtime.strictInbound;
}

// ---------------------------------------------------------------------------
// loadScenario / applyScenario
// ---------------------------------------------------------------------------
export function loadScenario(path: string): Scenario {
  const raw = readFileSync(path, 'utf-8');
  const json: unknown = JSON.parse(raw);
  return ScenarioSchema.parse(json) as Scenario;
}

/**
 * Apply a scenario to the shared context: install/clear registration, publish
 * the authorize policy + strictInbound into the runtime, and (re)arm the fault
 * rules on the FaultEngine. Optional identity override is shallow-merged.
 */
export function applyScenario(ctx: MockContext, scn: Scenario): void {
  const reg = ctx.store.domain.registration;

  if (scn.registration === 'preregistered') {
    // Skip the handshake: adopt the seed bootstrap tokens, mark registered.
    reg.status = 'registered';
    reg.tokenWeAccept = ctx.config.bootstrapTokenWeAccept;
    reg.tokenWePresent = ctx.config.bootstrapTokenWePresent;
    reg.registeredAt = new Date().toISOString();
  } else {
    // Fresh state to drive the full credentials handshake.
    reg.status = 'unregistered';
    reg.tokenWeAccept = ctx.config.bootstrapTokenWeAccept;
    reg.tokenWePresent = ctx.config.bootstrapTokenWePresent;
    reg.tokenA = undefined;
    reg.cpoVersionsUrl = undefined;
    reg.cpoCredentialsUrl = undefined;
    reg.cpoEndpoints = [];
    reg.registeredAt = undefined;
  }

  if (scn.identity) {
    Object.assign(ctx.identity, scn.identity);
  }

  setScenarioRuntime({
    name: scn.name,
    authorize: {
      default: scn.authorize?.default ?? AuthorizationInfoAllowed.Allowed,
      byUid: scn.authorize?.byUid ?? {},
    },
    strictInbound: scn.strictInbound ?? false,
    activeScenario: scn,
  });

  // The dispatcher reads the strictInbound flag straight off this runtime
  // singleton via isStrictInbound(), so setScenarioRuntime() above is the single
  // source of truth — no separate store flag to keep in sync.
  ctx.faults.loadScenarioFaults(scn.faults ?? []);
}

// ---------------------------------------------------------------------------
// evaluateExpectations — the assertion oracle.
//
// Each expectation is { on, assert, detail? }. `on` selects the relevant
// exchanges (a bare operation/module substring, or a JSON ExchangeFilter);
// `assert` is a tiny predicate evaluated over that set. Supported asserts:
//   bare:  received | notReceived | hasFinding | hasError | valid | invalid
//   cmp:   <metric> <op> <value>  where
//          metric is one of count | findings | globalFindings | httpStatus |
//                   ocpiStatusCode | validationOk
//                 | a DOTTED PATH resolved against the last matched exchange
//                   (e.g. validation.ok, response.body.data.allowed,
//                    response.httpStatus) or, when it starts with `registration.`,
//                   against store.domain (e.g. registration.status)
//          op     is one of == != > >= < <=
// This grammar is intentionally small and permissive; unknown asserts fail
// with an explanatory `observed` string rather than throwing.
// ---------------------------------------------------------------------------
export interface ExpectationResult {
  on: string;
  assert: string;
  detail?: string;
  pass: boolean;
  observed: string;
}
export interface EvaluationReport {
  scenario: string;
  passed: boolean;
  total: number;
  failures: number;
  results: ExpectationResult[];
}

function resolveOn(ctx: MockContext, on: string): Exchange[] {
  const trimmed = on.trim();
  if (trimmed.startsWith('{')) {
    try {
      const f = JSON.parse(trimmed) as ExchangeFilter;
      return ctx.store.query(f);
    } catch {
      return [];
    }
  }
  const all = ctx.store.query({});
  return all.filter(
    (ex) => ex.operation === trimmed || ex.operation.includes(trimmed) || ex.module === trimmed,
  );
}

/** Walk a dotted path against an object; undefined if any segment is missing. */
function deepGet(root: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc === null || typeof acc !== 'object') return undefined;
    return (acc as Record<string, unknown>)[key];
  }, root);
}

function metric(name: string, exchanges: Exchange[], ctx: MockContext): unknown {
  const last = exchanges[exchanges.length - 1];
  switch (name.toLowerCase()) {
    case 'count':
      return exchanges.length;
    case 'findings':
      return exchanges.reduce((s, e) => s + e.findings.length, 0);
    case 'globalfindings':
      return ctx.store.findings.length;
    case 'httpstatus':
      return last?.response.httpStatus;
    case 'ocpistatuscode':
      return last?.response.ocpiStatusCode;
    case 'validationok':
      return last?.validation.ok;
    default:
      break;
  }
  // Dotted-path metrics. `registration.*` resolves against the live domain state
  // (it is global, not tied to any one exchange); everything else resolves
  // against the LAST matched exchange (e.g. validation.ok, response.body.data.x).
  if (name.includes('.')) {
    if (name.split('.')[0] === 'registration') {
      return deepGet(ctx.store.domain, name);
    }
    if (last === undefined) return undefined;
    return deepGet(last, name);
  }
  return undefined;
}

function parseScalar(raw: string): unknown {
  const s = raw.trim().replace(/^['"]|['"]$/g, '');
  if (s === 'true') return true;
  if (s === 'false') return false;
  if (s !== '' && !Number.isNaN(Number(s))) return Number(s);
  return s;
}

function compare(lhs: unknown, op: string, rhs: unknown): boolean {
  switch (op) {
    case '==':
      return String(lhs) === String(rhs);
    case '!=':
      return String(lhs) !== String(rhs);
    case '>':
      return Number(lhs) > Number(rhs);
    case '>=':
      return Number(lhs) >= Number(rhs);
    case '<':
      return Number(lhs) < Number(rhs);
    case '<=':
      return Number(lhs) <= Number(rhs);
    default:
      return false;
  }
}

function evalAssert(
  exchanges: Exchange[],
  assert: string,
  ctx: MockContext,
): { pass: boolean; observed: string } {
  const a = assert.trim();
  const cmp = a.match(/^([A-Za-z_][\w.]*)\s*(==|!=|>=|<=|>|<)\s*(.+)$/);
  if (cmp) {
    const [, lhsName, op, rhsRaw] = cmp;
    const lhs = metric(lhsName, exchanges, ctx);
    const rhs = parseScalar(rhsRaw);
    return { pass: compare(lhs, op, rhs), observed: `${lhsName}=${JSON.stringify(lhs)}` };
  }
  switch (a.toLowerCase()) {
    case 'received':
    case 'exists':
    case 'any':
      return { pass: exchanges.length > 0, observed: `count=${exchanges.length}` };
    case 'notreceived':
    case 'none':
      return { pass: exchanges.length === 0, observed: `count=${exchanges.length}` };
    case 'hasfinding':
    case 'finding': {
      const n = exchanges.reduce((s, e) => s + e.findings.length, 0);
      return { pass: n > 0, observed: `findings=${n}` };
    }
    case 'haserror': {
      const n = exchanges.reduce(
        (s, e) => s + e.findings.filter((f) => f.severity === 'error').length,
        0,
      );
      return { pass: n > 0, observed: `errorFindings=${n}` };
    }
    case 'invalid':
    case 'validationfailed': {
      const n = exchanges.filter((e) => e.validation.ok === false).length;
      return { pass: n > 0, observed: `invalid=${n}` };
    }
    case 'valid':
    case 'validationok': {
      const n = exchanges.filter((e) => e.validation.ok === true).length;
      return {
        pass: exchanges.length > 0 && n === exchanges.length,
        observed: `ok=${n}/${exchanges.length}`,
      };
    }
    default:
      return { pass: false, observed: `unsupported assert: ${a}` };
  }
}

export function evaluateExpectations(ctx: MockContext, scn: Scenario): EvaluationReport {
  const expectations = scn.expect ?? [];
  const results: ExpectationResult[] = expectations.map((e) => {
    const exchanges = resolveOn(ctx, e.on);
    const { pass, observed } = evalAssert(exchanges, e.assert, ctx);
    return { on: e.on, assert: e.assert, detail: e.detail, pass, observed };
  });
  const failures = results.filter((r) => !r.pass).length;
  return {
    scenario: scn.name,
    passed: failures === 0,
    total: results.length,
    failures,
    results,
  };
}
