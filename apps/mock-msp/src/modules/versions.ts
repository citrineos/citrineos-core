// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// Versions Sender module: the endpoints Citrine (CPO) fetches during OCPI
// registration/version discovery against our mock eMSP.
//
//   GET /ocpi/versions        -> version list       [{ version, url }]
//   GET /ocpi/versions/2.2.1  -> version details    { version, endpoints[] }
//
// Both replies are enveloped by the dispatcher via ctx.ok(); responseSchema is
// the reused @citrineos/ocpi-base schema Citrine parses with, so any drift in
// our output would surface as a self-check Finding. The endpoint set is
// data-driven from config.publicBaseUrl via buildEndpointCatalog() — SPLIT
// {identifier, role} form (never the DB's combined `locations_RECEIVER`) and it
// always includes a `credentials` endpoint so the CPO can locate the handshake.
// ============================================================================
import type { ModuleDef, MockContext, OcpiReply } from '../core/types.js';
import {
  OcpiResponseSchema,
  VersionListResponseDTOSchema,
  VersionDetailsDTOSchema,
} from '../ocpi/barrel.js';
import { VERSION, buildEndpointCatalog, versionDetailsUrl } from '../identity.js';

// Composed locally: there is no ready-made barrel envelope for version details.
const VersionDetailsResponseSchema = OcpiResponseSchema(VersionDetailsDTOSchema);

// GET /ocpi/versions -> list of supported versions (just 2.2.1) each pointing at
// its own version-details URL.
function handleVersionsList(ctx: MockContext): OcpiReply {
  const base = ctx.config.publicBaseUrl;
  return ctx.ok([{ version: VERSION, url: versionDetailsUrl(base) }]);
}

// GET /ocpi/versions/2.2.1 -> our full eMSP endpoint catalog.
function handleVersionDetails(ctx: MockContext): OcpiReply {
  const base = ctx.config.publicBaseUrl;
  return ctx.ok({ version: VERSION, endpoints: buildEndpointCatalog(base) });
}

export const versionsModule: ModuleDef = {
  id: 'versions',
  mount: '/ocpi/versions',
  routes: [
    {
      module: 'versions',
      method: 'GET',
      path: '',
      operation: 'versions.list',
      auth: 'registration',
      requireRoutingHeaders: false,
      responseSchema: VersionListResponseDTOSchema,
      handle: handleVersionsList,
    },
    {
      module: 'versions',
      method: 'GET',
      path: '/2.2.1',
      operation: 'versions.details',
      auth: 'registration',
      requireRoutingHeaders: false,
      responseSchema: VersionDetailsResponseSchema,
      handle: handleVersionDetails,
    },
  ],
};
