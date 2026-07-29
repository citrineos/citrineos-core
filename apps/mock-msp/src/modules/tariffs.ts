// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// FILE: apps/mock-msp/src/modules/tariffs.ts   (owner: build:tariffs)
// ----------------------------------------------------------------------------
// Tariffs RECEIVER interface the CPO (Citrine) pushes to us.
//
// Live wire behavior (recon:modules §4 — TariffsBroadcaster.broadcastToClients):
//   PUT    /ocpi/2.2.1/emsp/tariffs/{country_code}/{party_id}/{tariff_id}  body=Tariff
//   DELETE /ocpi/2.2.1/emsp/tariffs/{country_code}/{party_id}/{tariff_id}
// Both are answered with the EMPTY envelope (OcpiEmptyResponseSchema). The
// dead-code TariffsClientApi.putTariff declares TariffResponse, but the LIVE
// broadcaster path parses OcpiEmptyResponseSchema — so we reply ctx.empty()
// (data OMITTED; returning data:{} or data:null would fail Citrine's z.undefined()).
//
// A GET reader at the same path is added for /_mock inspection completeness only
// — Citrine never calls it (its client-owned GET is dead code, recon:modules §4).
//
// This file only EXPORTS a ModuleDef. The integrator binds each route through the
// dispatcher (auth 'functional' + strict OCPI-* routing headers, inbound
// requestSchema validation -> Finding on drift, responseSchema self-check + fault
// target, X-Request-ID/X-Correlation-ID echo). Handlers stay pure: read
// ctx.req.params/body, mutate ctx.store.domain.tariffs, return an OcpiReply.
// ============================================================================
import {
  ModuleId,
  OcpiEmptyResponseSchema,
  OcpiResponseSchema,
  OcpiResponseStatusCode,
  TariffDTOSchema,
} from '../ocpi/barrel.js';
import type { MockContext, ModuleDef, OcpiReply } from '../core/types.js';

// Envelope Citrine parses a GET reader response with (composed from the reused
// ocpi-base factory + the reused TariffDTOSchema — not a locally invented schema).
const TariffGetResponseSchema = OcpiResponseSchema(TariffDTOSchema);

// Stable domain-map key = the path identity {country_code}/{party_id}/{tariff_id}.
function tariffKey(cc: string, party: string, id: string): string {
  return `${cc}:${party}:${id}`;
}

function keyFromCtx(ctx: MockContext): { cc: string; party: string; id: string; key: string } {
  const p = ctx.req?.params ?? {};
  const cc = p.cc ?? '';
  const party = p.party ?? '';
  const id = p.id ?? '';
  return { cc, party, id, key: tariffKey(cc, party, id) };
}

// ---- Handlers --------------------------------------------------------------

// PUT: upsert the pushed Tariff. Body already validated against TariffDTOSchema
// by the dispatcher (drift => recorded Finding); we simply store it verbatim.
function putTariff(ctx: MockContext): OcpiReply {
  const { key } = keyFromCtx(ctx);
  ctx.store.domain.tariffs.set(key, ctx.req?.body);
  return ctx.empty();
}

// DELETE: remove the Tariff. Idempotent — a delete of an unknown id still
// succeeds with the empty envelope (matches broadcaster expectation).
function deleteTariff(ctx: MockContext): OcpiReply {
  const { key } = keyFromCtx(ctx);
  ctx.store.domain.tariffs.delete(key);
  return ctx.empty();
}

// GET: /_mock inspection reader (Citrine never calls this). Returns the stored
// Tariff wrapped in the standard OCPI envelope, or a 2000 error if unknown.
function getTariff(ctx: MockContext): OcpiReply {
  const { key } = keyFromCtx(ctx);
  const stored = ctx.store.domain.tariffs.get(key);
  if (stored === undefined) {
    return ctx.error(OcpiResponseStatusCode.ClientGenericError, 'Unknown tariff');
  }
  return ctx.ok(stored);
}

// ---- ModuleDef (the only export the registry consumes) ---------------------
export const tariffsModule: ModuleDef = {
  id: ModuleId.Tariffs,
  mount: '/ocpi/2.2.1/emsp/tariffs',
  routes: [
    {
      module: ModuleId.Tariffs,
      method: 'PUT',
      path: '/:cc/:party/:id',
      operation: 'tariffs.put',
      auth: 'functional',
      requireRoutingHeaders: true,
      requestSchema: TariffDTOSchema,
      responseSchema: OcpiEmptyResponseSchema,
      handle: putTariff,
    },
    {
      module: ModuleId.Tariffs,
      method: 'DELETE',
      path: '/:cc/:party/:id',
      operation: 'tariffs.delete',
      auth: 'functional',
      requireRoutingHeaders: true,
      responseSchema: OcpiEmptyResponseSchema,
      handle: deleteTariff,
    },
    {
      module: ModuleId.Tariffs,
      method: 'GET',
      path: '/:cc/:party/:id',
      operation: 'tariffs.get',
      auth: 'functional',
      requireRoutingHeaders: true,
      responseSchema: TariffGetResponseSchema,
      handle: getTariff,
    },
  ],
};
