// ============================================================================
// FILE: apps/mock-msp/src/modules/sessions.ts   (owner: build:sessions)
// ----------------------------------------------------------------------------
// Sessions RECEIVER interface the CPO (Citrine) pushes client-owned Session
// objects to. Base mount: /ocpi/2.2.1/emsp/sessions.
//
//   PUT   /:country_code/:party_id/:session_id   full Session upsert
//   PATCH /:country_code/:party_id/:session_id   partial update (also the
//                                                 charging-period patch shape
//                                                 { charging_periods: [...] })
//   GET   /:country_code/:party_id/:session_id   read a stored Session (for
//                                                 /_mock completeness; Citrine
//                                                 never calls this — dead code)
//   PUT   /:country_code/:party_id/:session_id/charging_preferences
//                                                 DEFENSIVE only. Per OCPI 2.2.1
//                                                 charging_preferences is a
//                                                 SENDER method the eMSP CALLS on
//                                                 the CPO, not one the eMSP hosts,
//                                                 and recon confirms Citrine never
//                                                 pushes it here. Hosted so an
//                                                 unexpected push is recorded
//                                                 rather than 404'd.
//
// Validation reuses the ocpi-base SessionSchema verbatim (via the barrel) so any
// wire drift Citrine sends becomes a recorded Finding — zero schema drift.
// Handlers are pure (ctx) => OcpiReply: they read ctx.req and mutate
// ctx.store.domain.sessions only. The dispatcher owns auth, routing-header
// checks, recording, envelope building and X-Request-ID/X-Correlation-ID echo.
// ============================================================================
import {
  ModuleId,
  SessionSchema,
  OcpiEmptyResponseSchema,
  OcpiResponseSchema,
  OcpiResponseStatusCode,
} from '../ocpi/barrel.js';
import type { ModuleDef, MockContext, OcpiReply } from '../core/types.js';

// Stored keyed by full receiver identity so distinct parties never collide and
// the GET reader can resolve the exact object that was pushed.
function sessionKey(countryCode: string, partyId: string, sessionId: string): string {
  return `${countryCode}/${partyId}/${sessionId}`;
}

function keyFromCtx(ctx: MockContext): string {
  const p = ctx.req?.params ?? {};
  return sessionKey(p.country_code, p.party_id, p.session_id);
}

// PUT: full-object upsert. Body already validated against SessionSchema by the
// dispatcher (requestSchema); we store the parsed body verbatim.
function putSession(ctx: MockContext): OcpiReply {
  ctx.store.domain.sessions.set(keyFromCtx(ctx), ctx.req?.body);
  return ctx.empty();
}

// PATCH: partial update. Shallow-merge onto any existing session so the
// charging-period patch ({ charging_periods: [...] }) and single-field updates
// both work; if nothing is stored yet, upsert the partial as-is.
function patchSession(ctx: MockContext): OcpiReply {
  const key = keyFromCtx(ctx);
  const existing = ctx.store.domain.sessions.get(key);
  const patch = ctx.req?.body;
  const merged =
    existing && typeof existing === 'object' && patch && typeof patch === 'object'
      ? { ...(existing as Record<string, unknown>), ...(patch as Record<string, unknown>) }
      : patch;
  ctx.store.domain.sessions.set(key, merged);
  return ctx.empty();
}

// GET: read-back for /_mock inspection completeness. Citrine never invokes this
// (client-owned GET is dead code on its side); the harness normally reads via
// /_mock/state/sessions.
function getSession(ctx: MockContext): OcpiReply {
  const key = keyFromCtx(ctx);
  const found = ctx.store.domain.sessions.get(key);
  if (found === undefined) {
    return ctx.error(OcpiResponseStatusCode.ClientGenericError, `unknown session ${key}`, 404);
  }
  return ctx.ok(found);
}

// Defensive charging_preferences edge (see file header). Not part of the eMSP
// contract; recorded and acknowledged with an empty envelope so nothing 404s.
function putChargingPreferences(ctx: MockContext): OcpiReply {
  return ctx.empty();
}

export const sessionsModule: ModuleDef = {
  id: ModuleId.Sessions,
  mount: '/ocpi/2.2.1/emsp/sessions',
  routes: [
    {
      module: ModuleId.Sessions,
      method: 'PUT',
      path: '/:country_code/:party_id/:session_id',
      operation: 'sessions.put',
      auth: 'functional',
      requireRoutingHeaders: true,
      requestSchema: SessionSchema,
      responseSchema: OcpiEmptyResponseSchema,
      handle: putSession,
    },
    {
      module: ModuleId.Sessions,
      method: 'PATCH',
      path: '/:country_code/:party_id/:session_id',
      operation: 'sessions.patch',
      auth: 'functional',
      requireRoutingHeaders: true,
      requestSchema: SessionSchema.partial(),
      responseSchema: OcpiEmptyResponseSchema,
      handle: patchSession,
    },
    {
      module: ModuleId.Sessions,
      method: 'GET',
      path: '/:country_code/:party_id/:session_id',
      operation: 'sessions.get',
      auth: 'functional',
      requireRoutingHeaders: true,
      responseSchema: OcpiResponseSchema(SessionSchema),
      handle: getSession,
    },
    {
      module: ModuleId.Sessions,
      method: 'PUT',
      path: '/:country_code/:party_id/:session_id/charging_preferences',
      operation: 'sessions.put.charging_preferences',
      auth: 'functional',
      requireRoutingHeaders: true,
      responseSchema: OcpiEmptyResponseSchema,
      handle: putChargingPreferences,
    },
  ],
};
