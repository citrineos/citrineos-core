// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// FILE: apps/mock-msp/src/modules/locations.ts
// ----------------------------------------------------------------------------
// Locations RECEIVER (client-owned push). Citrine (CPO) PUT/PATCHes client-owned
// Location / EVSE / Connector objects to us at three path depths:
//   PUT|PATCH /ocpi/2.2.1/emsp/locations/:country_code/:party_id/:location_id
//   PUT|PATCH .../:location_id/:evse_uid
//   PUT|PATCH .../:location_id/:evse_uid/:connector_id
// Plus GET readers at each depth for /_mock inspection completeness (Citrine's
// own client-owned GETs are dead code — it never calls these).
//
// This file exports ONE `ModuleDef` (locationsModule). Handlers are PURE:
// they read ctx.req.params/body, mutate ctx.store.domain.locations, and return
// an OcpiReply via ctx.ok/ctx.empty/ctx.error. The dispatcher owns auth, routing
// headers, inbound body validation (via route.requestSchema -> Finding on drift,
// 2001 under strictInbound), envelope building, header echo, and recording.
//
// Zero schema drift: every request/response schema below is a reused
// @citrineos/ocpi-base schema (imported from the barrel), never redefined.
// ============================================================================
import {
  OcpiEmptyResponseSchema,
  OcpiResponseSchema,
  OcpiResponseStatusCode,
  LocationDTOSchema,
  EvseDTOSchema,
  ConnectorDTOSchema,
  ModuleId,
} from '../ocpi/barrel.js';
import type { MockContext, ModuleDef, OcpiReply } from '../core/types.js';

// ---- Response envelopes for the GET readers (compose from reused schemas) ---
// These mirror ocpi-base's own LocationResponseSchema / EvseResponseSchema /
// ConnectorResponseSchema (= OcpiResponseSchema(<DTO>)) without adding a second
// import site for the *ResponseSchema names (not re-exported by the barrel).
const LocationGetResponseSchema = OcpiResponseSchema(LocationDTOSchema);
const EvseGetResponseSchema = OcpiResponseSchema(EvseDTOSchema);
const ConnectorGetResponseSchema = OcpiResponseSchema(ConnectorDTOSchema);

// ---- Store keying: identity is the full URL path ---------------------------
// A location key ("US/TST/LOC1"), an evse key ("US/TST/LOC1/EVSE1") and a
// connector key ("US/TST/LOC1/EVSE1/1") are distinct exact strings, so a single
// flat Map<string, unknown> holds all three depths without collision. Query by
// exact key or by prefix from /_mock.
function locationKey(params: Record<string, string | undefined>): string {
  return [
    params.country_code,
    params.party_id,
    params.location_id,
    params.evse_uid,
    params.connector_id,
  ]
    .filter((seg): seg is string => seg !== undefined && seg !== '')
    .join('/');
}

// PUT = replace; PATCH = shallow-merge onto whatever we already hold (or store
// the partial as-is if this is the first we've seen of this object).
function upsert(ctx: MockContext, patch: boolean): OcpiReply {
  const params = (ctx.req?.params ?? {}) as Record<string, string | undefined>;
  const body = ctx.req?.body;
  const key = locationKey(params);
  if (patch) {
    const existing = ctx.store.domain.locations.get(key);
    const merged =
      existing && typeof existing === 'object' && body && typeof body === 'object'
        ? { ...(existing as Record<string, unknown>), ...(body as Record<string, unknown>) }
        : body;
    ctx.store.domain.locations.set(key, merged);
  } else {
    ctx.store.domain.locations.set(key, body);
  }
  return ctx.empty();
}

// GET reader: return the stored object or 2003 (ClientUnknownLocation) if absent.
function read(ctx: MockContext): OcpiReply {
  const params = (ctx.req?.params ?? {}) as Record<string, string | undefined>;
  const key = locationKey(params);
  const stored = ctx.store.domain.locations.get(key);
  if (stored === undefined) {
    return ctx.error(OcpiResponseStatusCode.ClientUnknownLocation, 'Unknown location');
  }
  return ctx.ok(stored);
}

// ============================================================================
// ModuleDef — the shape the registry (integrate owner) binds through dispatch.
// ============================================================================
export const locationsModule: ModuleDef = {
  id: ModuleId.Locations,
  mount: '/ocpi/2.2.1/emsp/locations',
  routes: [
    // ---- Location depth --------------------------------------------------
    {
      module: ModuleId.Locations,
      method: 'PUT',
      path: '/:country_code/:party_id/:location_id',
      operation: 'locations.put.location',
      auth: 'functional',
      requireRoutingHeaders: true,
      requestSchema: LocationDTOSchema,
      responseSchema: OcpiEmptyResponseSchema,
      handle: (ctx) => upsert(ctx, false),
    },
    {
      module: ModuleId.Locations,
      method: 'PATCH',
      path: '/:country_code/:party_id/:location_id',
      operation: 'locations.patch.location',
      auth: 'functional',
      requireRoutingHeaders: true,
      requestSchema: LocationDTOSchema.partial(),
      responseSchema: OcpiEmptyResponseSchema,
      handle: (ctx) => upsert(ctx, true),
    },
    {
      module: ModuleId.Locations,
      method: 'GET',
      path: '/:country_code/:party_id/:location_id',
      operation: 'locations.get.location',
      auth: 'functional',
      requireRoutingHeaders: true,
      responseSchema: LocationGetResponseSchema,
      handle: read,
    },
    // ---- EVSE depth ------------------------------------------------------
    {
      module: ModuleId.Locations,
      method: 'PUT',
      path: '/:country_code/:party_id/:location_id/:evse_uid',
      operation: 'locations.put.evse',
      auth: 'functional',
      requireRoutingHeaders: true,
      requestSchema: EvseDTOSchema,
      responseSchema: OcpiEmptyResponseSchema,
      handle: (ctx) => upsert(ctx, false),
    },
    {
      module: ModuleId.Locations,
      method: 'PATCH',
      path: '/:country_code/:party_id/:location_id/:evse_uid',
      operation: 'locations.patch.evse',
      auth: 'functional',
      requireRoutingHeaders: true,
      requestSchema: EvseDTOSchema.partial(),
      responseSchema: OcpiEmptyResponseSchema,
      handle: (ctx) => upsert(ctx, true),
    },
    {
      module: ModuleId.Locations,
      method: 'GET',
      path: '/:country_code/:party_id/:location_id/:evse_uid',
      operation: 'locations.get.evse',
      auth: 'functional',
      requireRoutingHeaders: true,
      responseSchema: EvseGetResponseSchema,
      handle: read,
    },
    // ---- Connector depth -------------------------------------------------
    {
      module: ModuleId.Locations,
      method: 'PUT',
      path: '/:country_code/:party_id/:location_id/:evse_uid/:connector_id',
      operation: 'locations.put.connector',
      auth: 'functional',
      requireRoutingHeaders: true,
      requestSchema: ConnectorDTOSchema,
      responseSchema: OcpiEmptyResponseSchema,
      handle: (ctx) => upsert(ctx, false),
    },
    {
      module: ModuleId.Locations,
      method: 'PATCH',
      path: '/:country_code/:party_id/:location_id/:evse_uid/:connector_id',
      operation: 'locations.patch.connector',
      auth: 'functional',
      requireRoutingHeaders: true,
      requestSchema: ConnectorDTOSchema.partial(),
      responseSchema: OcpiEmptyResponseSchema,
      handle: (ctx) => upsert(ctx, true),
    },
    {
      module: ModuleId.Locations,
      method: 'GET',
      path: '/:country_code/:party_id/:location_id/:evse_uid/:connector_id',
      operation: 'locations.get.connector',
      auth: 'functional',
      requireRoutingHeaders: true,
      responseSchema: ConnectorGetResponseSchema,
      handle: read,
    },
  ],
};
