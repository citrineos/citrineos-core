// ============================================================================
// FILE: apps/mock-msp/src/modules/chargingprofiles.ts
// ChargingProfiles RECEIVER (eMSP side). Mounted at /ocpi/2.2.1/emsp/chargingprofiles.
//
// Owner: build:chargingprofiles. Exports a single `chargingprofilesModule: ModuleDef`
// for the integrator to register via src/core/registry.ts. Pure handlers — they read
// ctx.req / mutate nothing the type system forbids and return an OcpiReply; the
// dispatcher owns auth, routing-header checks, recording, schema validation, faults,
// and header echoing. Never touch Fastify req/reply here.
//
// ----------------------------------------------------------------------------
// CANDIDATE GAP (recon #7): Citrine's CPO seed advertises a chargingprofiles
// RECEIVER endpoint for the eMSP (apps/ocpi-server/seeders/20250806120002-
// default-tenant-partner.ts registers CHARGING_PROFILES_RECEIVER at
// .../emsp/chargingprofiles), BUT the CPO->eMSP push that would exercise it is
// dead code on Citrine's side:
//   * ChargingProfilesClientApi (the PUT .../chargingprofiles/{session_id} push of
//     an ActiveChargingProfile) is ENTIRELY COMMENTED OUT.
//   * ChargingProfilesService.{get,put,delete}ChargingProfile have their
//     commandExecutor calls commented out; CommandExecutor.execute{Get,Put,Clear}
//     ChargingProfile are empty stubs; AsyncResponder (which would POST an
//     ActiveChargingProfileResult / ChargingProfileResult / ClearChargingProfileResult
//     back to a response_url) is fully commented out.
// => Current Citrine sends ZERO traffic to either route below. We host them anyway so
//    nothing 404s and so that, if Citrine ever wires this module up, the mock records
//    + schema-validates the payload (drift becomes a Finding, exactly like every other
//    module). This asymmetry — advertised but never driven — is itself a candidate
//    Citrine gap the harness may want to assert on.
// ============================================================================

import type { ModuleDef, MockContext, OcpiReply } from '../core/types.js';
import { ActiveChargingProfileSchema, OcpiEmptyResponseSchema, ModuleId } from '../ocpi/barrel.js';

// PUT /ocpi/2.2.1/emsp/chargingprofiles/:session_id
// Body: ActiveChargingProfile ({ start_date_time, charging_profile }). This is the
// CPO -> eMSP push of the active charging profile result for a session. Reused
// ocpi-base ActiveChargingProfileSchema is the request validator (zero schema drift);
// a validation failure is recorded as a Finding by the dispatcher.
function handlePutChargingProfile(ctx: MockContext): OcpiReply {
  // session_id is available at ctx.req.params.session_id; the full inbound Exchange
  // (headers, raw + parsed body, validation result) is captured by the recorder, so
  // there is nothing to persist here beyond acknowledging receipt. DomainState has no
  // dedicated chargingprofiles map (frozen types), and this route expects zero
  // traffic, so we intentionally do not stash domain state — the exchange record IS
  // the observability surface (queryable via /_mock/exchanges?module=chargingprofiles).
  return ctx.empty();
}

// POST /ocpi/2.2.1/emsp/chargingprofiles/:session_id/:uid
// Stub for a response_url-style async callback. No charging-profile *result* schema is
// re-exported by ocpi-base's barrel, and Citrine's AsyncResponder for this module is
// commented out, so we host the route (empty-envelope ack) without a requestSchema.
function handleChargingProfileCallback(ctx: MockContext): OcpiReply {
  return ctx.empty();
}

export const chargingprofilesModule: ModuleDef = {
  id: ModuleId.ChargingProfiles,
  mount: '/ocpi/2.2.1/emsp/chargingprofiles',
  routes: [
    {
      module: ModuleId.ChargingProfiles,
      method: 'PUT',
      path: '/:session_id',
      operation: 'chargingprofiles.put',
      auth: 'functional',
      requireRoutingHeaders: true,
      requestSchema: ActiveChargingProfileSchema,
      responseSchema: OcpiEmptyResponseSchema,
      handle: handlePutChargingProfile,
    },
    {
      module: ModuleId.ChargingProfiles,
      method: 'POST',
      path: '/:session_id/:uid',
      operation: 'chargingprofiles.result.callback',
      auth: 'functional',
      requireRoutingHeaders: true,
      // No requestSchema: ocpi-base does not re-export a charging-profile-result
      // object schema, and this callback is never driven by current Citrine.
      responseSchema: OcpiEmptyResponseSchema,
      handle: handleChargingProfileCallback,
    },
  ],
};
