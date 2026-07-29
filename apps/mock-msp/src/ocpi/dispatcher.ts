// ============================================================================
// FILE: apps/mock-msp/src/ocpi/dispatcher.ts
// The uniform per-request pipeline, CALLED BY the registry (integrate owner):
//   dispatch(route, ctx, freq, freply)
//     build OcpiRequest -> open Exchange -> auth -> routing headers ->
//     record + conformance(requestSchema) -> handle -> self-check(responseSchema)
//     -> fault injection -> echo X-Request-ID/X-Correlation-ID + reply.headers
//     -> send -> record + wire-log.
// It NEVER touches the Fastify app / server / registry / module files — it only
// receives one route + one (req, reply) pair and drives the machines on ctx.
// ============================================================================
import type { FastifyReply, FastifyRequest } from 'fastify';
import type {
  Exchange,
  Finding,
  MockContext,
  OcpiReply,
  OcpiRequest,
  OcpiRoute,
} from '../core/types.js';
import { buildBody, empty, error, ok } from '../core/envelope.js';
import { OcpiResponseStatusCode, buildOcpiResponse } from './barrel.js';
import { verifyInbound } from '../core/auth.js';
import { echoHeaders, parseRouting, requireStrict } from '../core/routingHeaders.js';
import { check as conformanceCheck, safeValidate } from '../core/conformance.js';
import { dropHeaderCI, mutateJson, oversizeTokenBody } from '../core/faults.js';
import { isStrictInbound } from '../control/scenario.js';

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// Request normalization
// ---------------------------------------------------------------------------

function buildOcpiRequest(freq: FastifyRequest): OcpiRequest {
  const headers: Record<string, string> = {};
  for (const [k, v] of Object.entries(freq.headers)) {
    if (v === undefined) continue;
    headers[k.toLowerCase()] = Array.isArray(v) ? v.join(',') : String(v);
  }
  const query: Record<string, string> = {};
  const q = freq.query as Record<string, unknown> | undefined;
  if (q) {
    for (const [k, v] of Object.entries(q)) {
      query[k] = Array.isArray(v) ? String(v[0]) : String(v);
    }
  }
  const params: Record<string, string> = {};
  const p = freq.params as Record<string, unknown> | undefined;
  if (p) {
    for (const [k, v] of Object.entries(p)) params[k] = String(v);
  }
  const url = freq.url;
  const path = url.split('?')[0];
  const rawBody = (freq as unknown as { rawBody?: string }).rawBody ?? '';
  return { method: freq.method, url, path, params, query, headers, rawBody, body: freq.body };
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export async function dispatch(
  route: OcpiRoute,
  ctx: MockContext,
  freq: FastifyRequest,
  freply: FastifyReply,
): Promise<void> {
  const store = ctx.store;
  const req = buildOcpiRequest(freq);
  const ex = store.open({ direction: 'inbound', module: route.module, operation: route.operation });
  ex.request = {
    method: req.method,
    url: req.url,
    path: req.path,
    query: req.query,
    headers: req.headers,
    rawBody: req.rawBody,
    body: req.body,
    ocpi: parseRouting(req.headers),
  };

  // Per-request context: shallow-clone the singleton, fill request-scoped fields.
  // ctx.findings aliases the exchange's own findings array (single source).
  const rctx: MockContext = {
    ...ctx,
    req,
    route,
    event: ex,
    findings: ex.findings,
    ok,
    empty,
    error,
  };

  let reply: OcpiReply = error(OcpiResponseStatusCode.ServerGenericError, 'unhandled', 200);
  let skipSelfCheck = false;

  try {
    // ---- auth ----
    if (route.auth !== 'none') {
      const authRes = verifyInbound(rctx, route);
      rctx.auth = authRes;
      ex.request.ocpi.token = authRes.decodedToken;
      ex.request.ocpi.tokenValid = authRes.verified;
      if (!authRes.verified) {
        pushFinding(rctx, {
          severity: 'error',
          kind: 'auth',
          module: route.module,
          seq: ex.seq,
          detail: authRes.decodedToken
            ? 'Inbound token did not match any accepted token'
            : 'Missing or malformed Authorization header',
        });
        reply = error(OcpiResponseStatusCode.ClientNotEnoughInformation, 'Not Authorized', 401);
        await finalize(rctx, freply, reply, { skipSelfCheck: true, skipFault: true });
        return;
      }
    }

    // ---- routing headers (strict only on functional endpoints) ----
    if (route.requireRoutingHeaders && route.auth === 'functional') {
      const expected = {
        from: { cc: ctx.config.cpoCountryCode, party: ctx.config.cpoPartyId },
        to: { cc: ctx.config.countryCode, party: ctx.config.partyId },
      };
      const rc = requireStrict(req.headers, expected);
      rctx.routing = { from: rc.from, to: rc.to };
      if (!rc.ok) {
        pushFinding(rctx, {
          severity: 'error',
          kind: 'header',
          module: route.module,
          seq: ex.seq,
          detail: `Routing header check failed: ${rc.problems.join('; ')}`,
        });
        reply = error(
          OcpiResponseStatusCode.ClientNotEnoughInformation,
          'Invalid or missing routing headers',
          401,
        );
        await finalize(rctx, freply, reply, { skipSelfCheck: true, skipFault: true });
        return;
      }
    } else {
      rctx.routing = { from: ex.request.ocpi.from, to: ex.request.ocpi.to };
    }

    // ---- record inbound conformance (headers + body vs requestSchema) ----
    for (const f of conformanceCheck(rctx, route.requestSchema)) pushFinding(rctx, f);
    if (route.requestSchema && req.body !== undefined) {
      const v = safeValidate(route.requestSchema, req.body);
      ex.validation = { schema: route.operation, ok: v.ok, issues: v.issues };
    }

    // ---- strictInbound scenario option: reject schema-invalid bodies ----
    // Read the single source of truth (the scenario runtime singleton) rather
    // than a store cast, so a strictInbound scenario actually rejects invalid
    // inbound bodies with 2001 instead of the flag being inert.
    const strictInbound = isStrictInbound();
    if (strictInbound && ex.validation.ok === false) {
      reply = error(
        OcpiResponseStatusCode.ClientInvalidOrMissingParameters,
        'Invalid or missing parameters',
        200,
      );
      skipSelfCheck = true;
    } else {
      // ---- handle ----
      reply = await route.handle(rctx);
    }
  } catch (err) {
    pushFinding(rctx, {
      severity: 'error',
      kind: 'status',
      module: route.module,
      seq: ex.seq,
      detail: `Handler threw: ${String(err)}`,
    });
    reply = error(OcpiResponseStatusCode.ServerGenericError, 'Internal mock error', 200);
    skipSelfCheck = true;
  }

  await finalize(rctx, freply, reply, { skipSelfCheck });
}

// ---------------------------------------------------------------------------
// Finalizer: self-check -> fault -> headers -> send -> record
// ---------------------------------------------------------------------------

interface FinalizeOpts {
  skipSelfCheck?: boolean;
  skipFault?: boolean;
}

async function finalize(
  ctx: MockContext,
  freply: FastifyReply,
  reply: OcpiReply,
  opts: FinalizeOpts,
): Promise<void> {
  const ex = ctx.event!;
  const route = ctx.route!;
  const store = ctx.store;

  let bodyToSend: unknown = buildBody(reply);
  let httpStatus = reply.httpStatus ?? 200;
  const responseHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...echoHeaders(ctx.req!.headers),
    ...(reply.headers ?? {}),
  };

  // ---- self-check our own baseline reply against the reused ocpi-base schema ----
  if (!opts.skipSelfCheck && route.responseSchema) {
    const v = safeValidate(route.responseSchema, bodyToSend);
    if (!v.ok) {
      pushFinding(ctx, {
        severity: 'warn',
        kind: 'body',
        module: route.module,
        seq: ex.seq,
        detail: 'Mock baseline response failed its own responseSchema self-check (mock bug)',
        issues: v.issues,
      });
    }
  }

  // ---- fault injection ----
  if (!opts.skipFault) {
    const decision = ctx.faults.decide(
      { direction: 'inbound', module: route.module, method: ctx.req!.method, path: ctx.req!.path },
      ex,
    );
    if (decision) {
      const action = decision.action;
      ex.fault = { ruleId: decision.rule.id, kind: action.kind, detail: action };
      switch (action.kind) {
        case 'passthrough':
          break;
        case 'delay':
          await sleep(action.ms);
          break;
        case 'abort': {
          ex.response = { httpStatus: 0, headers: {}, body: undefined };
          finalizeTiming(ex);
          store.record(ex);
          ctx.log.record(ex);
          try {
            freply.hijack();
            (freply.raw as unknown as { destroy: () => void }).destroy();
          } catch {
            /* socket already gone */
          }
          return;
        }
        case 'unauthorized':
          httpStatus = 401;
          bodyToSend = buildOcpiResponse(
            OcpiResponseStatusCode.ClientNotEnoughInformation,
            undefined,
            'Not Authorized',
          );
          break;
        case 'httpStatus':
          httpStatus = action.status;
          if (action.body !== undefined) bodyToSend = action.body;
          break;
        case 'ocpiStatus':
          if (bodyToSend && typeof bodyToSend === 'object') {
            (bodyToSend as Record<string, unknown>).status_code = action.status_code;
            if (action.status_message !== undefined) {
              (bodyToSend as Record<string, unknown>).status_message = action.status_message;
            }
          }
          break;
        case 'malformBody':
          bodyToSend = mutateJson(bodyToSend, action.mutation, action.targetPath);
          break;
        case 'dropHeaders':
          for (const h of action.headers) dropHeaderCI(responseHeaders, h);
          break;
        case 'oversizeToken':
          bodyToSend = oversizeTokenBody(bodyToSend);
          break;
      }
    }
  }

  // ---- send ----
  for (const [k, v] of Object.entries(responseHeaders)) freply.header(k, v);
  ex.response = {
    httpStatus,
    headers: responseHeaders,
    body: bodyToSend,
    ocpiStatusCode: extractOcpiCode(bodyToSend),
  };
  finalizeTiming(ex);
  freply.status(httpStatus).send(bodyToSend);
  store.record(ex);
  ctx.log.record(ex);
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function pushFinding(ctx: MockContext, finding: Finding): void {
  // ctx.findings aliases ctx.event.findings, so push once + record globally.
  ctx.event?.findings.push(finding);
  ctx.store.addFinding(finding);
}

function finalizeTiming(ex: Exchange): void {
  const respondedAt = new Date().toISOString();
  ex.timing.respondedAt = respondedAt;
  ex.timing.durationMs = Date.parse(respondedAt) - Date.parse(ex.timing.receivedAt);
}

function extractOcpiCode(body: unknown): number | undefined {
  if (body && typeof body === 'object' && 'status_code' in body) {
    const code = (body as { status_code?: unknown }).status_code;
    return typeof code === 'number' ? code : undefined;
  }
  return undefined;
}
