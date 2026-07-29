// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// FILE: apps/mock-msp/src/modules/credentials.ts
// ----------------------------------------------------------------------------
// OCPI 2.2.1 Credentials handshake, RECEIVER side (Citrine/CPO -> our mock eMSP).
// Mounted at /ocpi/2.2.1/credentials (auth:'registration', no routing headers).
//
//   GET    -> our current CredentialsDTO (token we ACCEPT + our versions url + role)
//   POST   -> register: CPO sends us { token, url, roles }. We store the token the
//             CPO issued us (tokenWePresent), fetch the CPO's versions + version
//             details back through the outbound OcpiClient (using that token), mint
//             a fresh TOKEN_C we issue to the CPO (tokenWeAccept, <=64 chars), mark
//             registered, and answer with our own CredentialsDTO. If already
//             registered -> 2000 (ClientGenericError), per OCPI.
//   PUT    -> re-register: same as POST but allowed regardless of current state
//             (rotates our token + re-fetches the CPO's fresh version details).
//   DELETE -> unregister: wipe the exchanged tokens + discovered CPO endpoints and
//             return to 'unregistered'; reply is an EMPTY envelope.
//
// Token direction (load-bearing — verified against ocpi-base auth + the seed):
//   registration.tokenWePresent  = token the CPO issued to us (body.token).
//                                  We present Token base64(this) when calling the CPO.
//   registration.tokenWeAccept   = token WE issue to the CPO (TOKEN_C). The CPO
//                                  presents Token base64(this) on inbound calls to us.
//
// Handlers are PURE: they read ctx.req.body, mutate ctx.store.domain.registration,
// and return an OcpiReply via ctx.ok/ctx.empty/ctx.error. The dispatcher owns auth,
// inbound body validation (route.requestSchema -> Finding on drift), envelope
// building, header echo and recording. Every schema is a reused ocpi-base schema
// imported from the barrel — zero schema drift.
//
// The mock-INITIATED handshake (register() driven by the actor) lives in the
// outbound OcpiClient (src/core/client.ts); this file is only the inbound side.
// ============================================================================
import {
  CredentialsDTOSchema,
  CredentialsResponseSchema,
  OcpiEmptyResponseSchema,
  OcpiResponseStatusCode,
  ModuleId,
  Role,
} from '../ocpi/barrel.js';
import type { CredentialsDTO } from '../ocpi/barrel.js';
import type { MockContext, ModuleDef, OcpiReply, Exchange, CpoEndpoint } from '../core/types.js';
import { VERSION, versionsListUrl } from '../identity.js';
import { uuid } from '../core/ids.js';

// ---- Our own CredentialsDTO (what GET returns and what we answer POST/PUT with).
// token = the token the CPO must present to reach us (registration.tokenWeAccept).
// roles = our single EMSP identity (US/TST TestMobilitySolutions), from ctx.identity.
function ourCredentials(ctx: MockContext, token: string): CredentialsDTO {
  const id = ctx.identity;
  return {
    token,
    url: versionsListUrl(ctx.config.publicBaseUrl),
    roles: [
      {
        role: Role.EMSP,
        party_id: id.party_id,
        country_code: id.country_code,
        business_details: id.business_details,
      },
    ],
  } as CredentialsDTO;
}

// ---- Pull `data` out of a recorded outbound Exchange (versions / details reply).
function exchangeData(ex: Exchange): unknown {
  const body = ex?.response?.body as { data?: unknown } | undefined;
  return body?.data;
}

// ---- Call the CPO back (versions -> 2.2.1 version details) using the token the
// CPO just handed us, and persist the discovered endpoints. Best-effort: the
// outbound calls are themselves recorded by the OcpiClient, so a failure is
// visible in the trace; we still complete our side of the handshake on the wire.
async function discoverCpoEndpoints(
  ctx: MockContext,
  versionsUrl: string,
  token: string,
): Promise<void> {
  const reg = ctx.store.domain.registration;
  reg.cpoVersionsUrl = versionsUrl;
  try {
    const versionsEx = await ctx.client.getVersions(versionsUrl, token);
    const versions = exchangeData(versionsEx) as
      | Array<{ version: string; url: string }>
      | undefined;
    const match = Array.isArray(versions) ? versions.find((v) => v.version === VERSION) : undefined;
    if (!match?.url) {
      ctx.store.addFinding({
        severity: 'warn',
        kind: 'status',
        module: 'credentials',
        seq: ctx.event?.seq ?? 0,
        detail: `CPO versions list did not advertise ${VERSION}`,
      });
      return;
    }
    const detailsEx = await ctx.client.getVersionDetails(match.url, token);
    const details = exchangeData(detailsEx) as
      | { version: string; endpoints: CpoEndpoint[] }
      | undefined;
    const endpoints = details?.endpoints;
    if (Array.isArray(endpoints)) {
      reg.cpoEndpoints = endpoints.map((e) => ({
        identifier: e.identifier,
        role: e.role,
        url: e.url,
      }));
      const creds = endpoints.find((e) => e.identifier === ModuleId.Credentials);
      if (creds) reg.cpoCredentialsUrl = creds.url;
    }
  } catch (err) {
    ctx.store.addFinding({
      severity: 'warn',
      kind: 'status',
      module: 'credentials',
      seq: ctx.event?.seq ?? 0,
      detail: `CPO version discovery failed: ${(err as Error)?.message ?? String(err)}`,
    });
  }
}

// ---- Shared POST/PUT body: store the CPO's token, discover its endpoints, rotate
// a fresh TOKEN_C, mark registered, and answer with our own credentials.
async function performRegistration(ctx: MockContext, body: CredentialsDTO): Promise<OcpiReply> {
  const reg = ctx.store.domain.registration;
  reg.tokenWePresent = body.token; // token the CPO issued to us; we present it back
  reg.tokenA = undefined; // handshake token consumed
  await discoverCpoEndpoints(ctx, body.url, body.token);
  const ourToken = uuid(); // TOKEN_C — 36 chars, well within the 64-char cap
  reg.tokenWeAccept = ourToken; // the CPO presents this on future inbound calls
  reg.status = 'registered';
  reg.registeredAt = new Date().toISOString();
  return ctx.ok(ourCredentials(ctx, ourToken));
}

// GET /ocpi/2.2.1/credentials -> the credentials the CPO uses to reach us.
function handleGet(ctx: MockContext): OcpiReply {
  const reg = ctx.store.domain.registration;
  return ctx.ok(ourCredentials(ctx, reg.tokenWeAccept));
}

// POST /ocpi/2.2.1/credentials -> initial registration (rejects if already done).
async function handlePost(ctx: MockContext): Promise<OcpiReply> {
  const parsed = CredentialsDTOSchema.safeParse(ctx.req?.body);
  if (!parsed.success) {
    return ctx.error(
      OcpiResponseStatusCode.ClientInvalidOrMissingParameters,
      'Invalid CredentialsDTO body',
    );
  }
  if (ctx.store.domain.registration.status === 'registered') {
    return ctx.error(OcpiResponseStatusCode.ClientGenericError, 'Client already registered');
  }
  return performRegistration(ctx, parsed.data as CredentialsDTO);
}

// PUT /ocpi/2.2.1/credentials -> re-register (fetch fresh details; rotate token).
async function handlePut(ctx: MockContext): Promise<OcpiReply> {
  const parsed = CredentialsDTOSchema.safeParse(ctx.req?.body);
  if (!parsed.success) {
    return ctx.error(
      OcpiResponseStatusCode.ClientInvalidOrMissingParameters,
      'Invalid CredentialsDTO body',
    );
  }
  return performRegistration(ctx, parsed.data as CredentialsDTO);
}

// DELETE /ocpi/2.2.1/credentials -> unregister: wipe exchanged tokens + endpoints.
// tokenWeAccept is rotated to a fresh unknowable value so the CPO's old TOKEN_C
// stops authenticating; tokenWePresent is cleared. Reply is an EMPTY envelope.
function handleDelete(ctx: MockContext): OcpiReply {
  const reg = ctx.store.domain.registration;
  reg.status = 'unregistered';
  reg.tokenWePresent = '';
  reg.tokenWeAccept = uuid();
  reg.tokenA = undefined;
  reg.cpoVersionsUrl = undefined;
  reg.cpoCredentialsUrl = undefined;
  reg.cpoEndpoints = [];
  reg.registeredAt = undefined;
  return ctx.empty('Unregistered');
}

// ============================================================================
// ModuleDef — the shape the registry (integrate owner) binds through dispatch.
// ============================================================================
export const credentialsModule: ModuleDef = {
  id: 'credentials',
  mount: '/ocpi/2.2.1/credentials',
  routes: [
    {
      module: 'credentials',
      method: 'GET',
      path: '',
      operation: 'credentials.get',
      auth: 'registration',
      requireRoutingHeaders: false,
      responseSchema: CredentialsResponseSchema,
      handle: handleGet,
    },
    {
      module: 'credentials',
      method: 'POST',
      path: '',
      operation: 'credentials.post',
      auth: 'registration',
      requireRoutingHeaders: false,
      requestSchema: CredentialsDTOSchema,
      responseSchema: CredentialsResponseSchema,
      handle: handlePost,
    },
    {
      module: 'credentials',
      method: 'PUT',
      path: '',
      operation: 'credentials.put',
      auth: 'registration',
      requireRoutingHeaders: false,
      requestSchema: CredentialsDTOSchema,
      responseSchema: CredentialsResponseSchema,
      handle: handlePut,
    },
    {
      module: 'credentials',
      method: 'DELETE',
      path: '',
      operation: 'credentials.delete',
      auth: 'registration',
      requireRoutingHeaders: false,
      responseSchema: OcpiEmptyResponseSchema,
      handle: handleDelete,
    },
  ],
};
