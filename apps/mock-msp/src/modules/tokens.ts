// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// FILE: apps/mock-msp/src/modules/tokens.ts   (owner: build:tokens)
// ----------------------------------------------------------------------------
// eMSP Tokens SENDER interface (mounted at /ocpi/2.2.1/emsp/tokens):
//   POST /:token_uid/authorize?type=<TokenType>  (optional LocationReferences body)
//       -> real-time authorize. Citrine (CPO) calls this; we answer with a full
//          AuthorizationInfo. Citrine's Zod REQUIRES both `token` (full TokenDTO)
//          and `authorization_reference`, so we ALWAYS include them — omitting
//          either makes Citrine's schema.parse throw (a bug the mock must not trip).
//   GET  ''  -> list of tokens we own (dead code on Citrine's side; hosted so
//          nothing 404s and /_mock can inspect it).
//
// The `allowed` decision is driven by the scenario / control authorize policy
// (default ALLOWED). The FaultEngine can additionally perturb the wire response
// at the dispatcher layer — that is NOT this file's concern; here we always emit
// the schema-valid baseline.
//
// Also exposes pushTokenToCpo(ctx, token): the Actor helper the control API calls
// to PUSH one of our tokens to Citrine's CPO Tokens RECEIVER
// (PUT {citrine}/2.2.1/tokens/{cc}/{party}/{uid}). The outbound wire mechanics
// live in OcpiClient (owned by build:middleware); this is a thin, typed wrapper.
//
// Import rules honored: every ocpi-base schema/type comes ONLY from ../ocpi/barrel.js;
// shared types from ../core/types.js. WhitelistType is not re-exported by the barrel,
// so we use its literal enum VALUE ('ALLOWED') which z.nativeEnum(WhitelistType)
// accepts verbatim — we do NOT redefine any schema.
// ============================================================================
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import {
  ModuleId,
  TokenType,
  TokenDTOSchema,
  AuthorizationInfoAllowed,
  AuthorizationInfoResponseSchema,
  LocationReferencesSchema,
  OcpiResponseSchema,
  OcpiEmptyResponseSchema,
} from '../ocpi/barrel.js';
import type { ModuleDef, MockContext, OcpiReply, Exchange } from '../core/types.js';
import { resolveAuthorize } from '../control/scenario.js';

// WhitelistType is not exported through the barrel; 'ALLOWED' is
// WhitelistType.ALLOWED and z.nativeEnum(WhitelistType) inside TokenDTOSchema
// accepts the raw string value. (If the integrator later adds WhitelistType to
// the barrel, swap this for the enum member — behavior is identical.)
const WHITELIST_ALLOWED = 'ALLOWED';

// ---------------------------------------------------------------------------
// Authorize policy resolution
// ---------------------------------------------------------------------------
// The authorize `allowed` decision is owned by the scenario runtime singleton in
// src/control/scenario.ts — that is the ONE place applyScenario and the control
// API (POST /_mock/authorize) write the policy. We read it here via the exported
// resolveAuthorize(uid) so the tokens/authorize reply always reflects the active
// scenario / control state (default ALLOWED). toAllowed() maps the resolved raw
// string onto the reused ocpi-base AuthorizationInfoAllowed enum (any unknown
// value defensively falls back to ALLOWED).
function toAllowed(value: string): AuthorizationInfoAllowed {
  const match = (Object.values(AuthorizationInfoAllowed) as string[]).find((v) => v === value);
  return (match as AuthorizationInfoAllowed | undefined) ?? AuthorizationInfoAllowed.Allowed;
}

// ---------------------------------------------------------------------------
// Response schema for the (Citrine-never-calls-it) GET list. Composed locally
// from barrel primitives; a bare enveloped array is sufficient for the mock.
// ---------------------------------------------------------------------------
const TokenListResponseSchema = OcpiResponseSchema(z.array(TokenDTOSchema));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function isTokenType(v: string | undefined): v is TokenType {
  return v !== undefined && (Object.values(TokenType) as string[]).includes(v);
}

// Build the full TokenDTO echoed inside AuthorizationInfo.token. Echoes a token
// we already own (pushed earlier) when we have one; otherwise synthesizes a
// schema-valid token for the authorized uid using our own eMSP identity.
function buildAuthorizeToken(ctx: MockContext, uid: string, type: TokenType): unknown {
  const stored = ctx.store.domain.tokens.get(uid);
  if (stored && typeof stored === 'object') return stored;

  const id = ctx.identity;
  return {
    country_code: id.country_code,
    party_id: id.party_id,
    uid,
    type,
    contract_id: `${id.country_code}-${id.party_id}-${uid}`.slice(0, 36),
    issuer: id.business_details.name,
    valid: true,
    whitelist: WHITELIST_ALLOWED,
    last_updated: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Handlers (pure: read ctx.req, mutate ctx.store.domain, return an OcpiReply)
// ---------------------------------------------------------------------------
function authorizeHandler(ctx: MockContext): OcpiReply {
  const params = ctx.req?.params ?? {};
  const query = ctx.req?.query ?? {};
  const uid = params.token_uid ?? '';

  const typeRaw = query.type;
  const type = isTokenType(typeRaw) ? typeRaw : TokenType.RFID;

  // Optional LocationReferences body: echo it back into AuthorizationInfo.location
  // when present and valid; ignore anything else (absent body is the common case).
  const locParsed = LocationReferencesSchema.safeParse(ctx.req?.body);
  const location = locParsed.success ? locParsed.data : undefined;

  const allowed = toAllowed(resolveAuthorize(uid));
  const token = buildAuthorizeToken(ctx, uid, type);
  const authorizationReference = `AUTH-${randomUUID()}`;

  // AuthorizationInfo: allowed + full token + authorization_reference are ALL
  // required by Citrine's Zod. info/location are optional; add info only for a
  // non-ALLOWED outcome (Citrine reads data.info?.text).
  const authInfo: Record<string, unknown> = {
    allowed,
    token,
    authorization_reference: authorizationReference,
  };
  if (allowed !== AuthorizationInfoAllowed.Allowed) {
    authInfo.info = { language: 'en', text: `Authorization result: ${allowed}` };
  }
  if (location) {
    authInfo.location = location;
  }

  // Record the authorize outcome into domain state for /_mock inspection.
  ctx.store.domain.authorizations.set(uid, {
    uid,
    type,
    allowed,
    authorization_reference: authorizationReference,
    at: new Date().toISOString(),
  });

  return ctx.ok(authInfo);
}

function listHandler(ctx: MockContext): OcpiReply {
  const tokens = [...ctx.store.domain.tokens.values()].filter((t) => typeof t === 'object');
  return ctx.ok(tokens);
}

// ---------------------------------------------------------------------------
// Actor helper: PUSH a token to Citrine's CPO Tokens RECEIVER.
// PUT {citrine}/2.2.1/tokens/{cc}/{party}/{uid}. Path cc/party use OUR identity
// (US/TST) so they match the OCPI-from headers the OcpiClient sets on functional
// calls (Citrine's putToken rejects a mismatch with WrongClientAccessException).
// ---------------------------------------------------------------------------
export async function pushTokenToCpo(ctx: MockContext, token: unknown): Promise<Exchange> {
  const parsed = TokenDTOSchema.parse(token); // validate & normalize before sending
  ctx.store.domain.tokens.set(parsed.uid, parsed);

  const id = ctx.identity;
  const url = `${ctx.config.citrineOcpiBaseUrl}/2.2.1/tokens/${id.country_code}/${id.party_id}/${parsed.uid}`;

  return ctx.client.call({
    method: 'PUT',
    url,
    module: ModuleId.Tokens,
    operation: 'tokens.push',
    functional: true,
    body: parsed,
    responseSchema: OcpiEmptyResponseSchema,
  });
}

// ---------------------------------------------------------------------------
// Actor helper: PATCH one of our tokens at the CPO (partial update — the
// canonical case is blocking a lost card with {valid:false}). Citrine's PATCH
// is fully wired (TokensModuleApi PATCH -> TokensService.patchToken), so this
// is a real round-trip, not a probe. last_updated is stamped unless
// opts.omitLastUpdated — omitting it is itself a known-bug trigger: Citrine's
// TokensMapper maps an ABSENT `valid` to status Invalid and applies it
// unconditionally, silently blocking the token (see the known-bugs scenario).
// The patch is merged into our stored expected copy so verifyTokenAtCpo can
// diff Citrine's readback against what we believe the token now is.
// ---------------------------------------------------------------------------
const TokenPatchSchema = TokenDTOSchema.partial();
const TokenReadResponseSchema = OcpiResponseSchema(TokenDTOSchema);

export async function patchTokenAtCpo(
  ctx: MockContext,
  uid: string,
  patch: unknown,
  opts?: { omitLastUpdated?: boolean },
): Promise<Exchange> {
  const parsed = TokenPatchSchema.parse(patch ?? {});
  const body: Record<string, unknown> = { ...parsed };
  if (!opts?.omitLastUpdated && body.last_updated === undefined) {
    body.last_updated = new Date().toISOString();
  }

  // Merge into the local expected copy (upsert a minimal shell if we never
  // pushed this uid — verify will then report drift on the missing fields).
  const existing = ctx.store.domain.tokens.get(uid);
  const merged =
    existing && typeof existing === 'object'
      ? { ...(existing as Record<string, unknown>), ...body }
      : { uid, ...body };
  ctx.store.domain.tokens.set(uid, merged);

  const id = ctx.identity;
  const url = `${ctx.config.citrineOcpiBaseUrl}/2.2.1/tokens/${id.country_code}/${id.party_id}/${uid}`;
  return ctx.client.call({
    method: 'PATCH',
    url,
    module: ModuleId.Tokens,
    operation: 'tokens.patch',
    functional: true,
    body,
    responseSchema: OcpiEmptyResponseSchema,
  });
}

// ---------------------------------------------------------------------------
// Actor helper: GET our token back from the CPO and diff it against the copy
// we pushed/patched. Field-by-field over the set Citrine actually persists on
// its Authorization row; last_updated is excluded (server-regenerated), and
// fields Citrine is known not to round-trip (energy_contract) degrade to an
// 'info' finding instead of 'error'. The special case: `valid` served false
// while we expect true right after a valid-omitting PATCH is Citrine's
// TokensMapper bug — flagged isKnownCitrineBug.
// ---------------------------------------------------------------------------
export interface TokenDrift {
  field: string;
  severity: 'info' | 'error';
  expected: unknown;
  served: unknown;
  isKnownCitrineBug?: boolean;
}

const TOKEN_COMPARE_FIELDS = [
  'uid',
  'country_code',
  'party_id',
  'type',
  'contract_id',
  'issuer',
  'valid',
  'whitelist',
  'visual_number',
  'language',
  'group_id',
] as const;
const TOKEN_INFO_ONLY_FIELDS = new Set(['energy_contract']);

export async function verifyTokenAtCpo(
  ctx: MockContext,
  uid: string,
): Promise<{ exchange: Exchange; drift: TokenDrift[] }> {
  const id = ctx.identity;
  const url = `${ctx.config.citrineOcpiBaseUrl}/2.2.1/tokens/${id.country_code}/${id.party_id}/${uid}`;
  const exchange = await ctx.client.call({
    method: 'GET',
    url,
    module: ModuleId.Tokens,
    operation: 'tokens.get',
    functional: true,
    responseSchema: TokenReadResponseSchema,
  });

  const drift: TokenDrift[] = [];
  const expected = ctx.store.domain.tokens.get(uid) as Record<string, unknown> | undefined;
  const body = exchange.response.body as { data?: Record<string, unknown> } | undefined;
  const served = body && typeof body === 'object' ? body.data : undefined;

  if (!expected) {
    drift.push({
      field: '*',
      severity: 'error',
      expected: undefined,
      served,
      isKnownCitrineBug: false,
    });
  } else if (!served || typeof served !== 'object') {
    drift.push({
      field: '*',
      severity: 'error',
      expected,
      served: served ?? `HTTP ${exchange.response.httpStatus}`,
    });
  } else {
    const fields: string[] = [...TOKEN_COMPARE_FIELDS, ...TOKEN_INFO_ONLY_FIELDS];
    for (const field of fields) {
      // Citrine serves never-sent optional fields as explicit null — null and
      // absent are the same statement ("no value"), not drift.
      const want = expected[field] ?? undefined;
      const got = served[field] ?? undefined;
      if (want === undefined && got === undefined) continue;
      if (JSON.stringify(want) === JSON.stringify(got)) continue;
      const infoOnly = TOKEN_INFO_ONLY_FIELDS.has(field);
      const knownValidBug = field === 'valid' && want !== false && got === false;
      drift.push({
        field,
        severity: infoOnly ? 'info' : 'error',
        expected: want,
        served: got,
        ...(knownValidBug ? { isKnownCitrineBug: true } : {}),
      });
    }
  }

  for (const d of drift) {
    if (d.severity !== 'error') continue;
    ctx.store.addFinding({
      severity: 'error',
      kind: 'body',
      module: ModuleId.Tokens,
      seq: exchange.seq,
      detail:
        `Token readback drift on '${d.field}': pushed=${JSON.stringify(d.expected)} served=${JSON.stringify(d.served)}` +
        (d.isKnownCitrineBug
          ? ' — known Citrine bug: TokensMapper maps an absent `valid` in a PATCH to status Invalid (TokensMapper.ts:149)'
          : ''),
      ...(d.isKnownCitrineBug ? { isKnownCitrineBug: true } : {}),
    });
  }

  return { exchange, drift };
}

// ---------------------------------------------------------------------------
// Module definition (the integrator registers `tokensModule` via the registry)
// ---------------------------------------------------------------------------
export const tokensModule: ModuleDef = {
  id: ModuleId.Tokens,
  mount: '/ocpi/2.2.1/emsp/tokens',
  routes: [
    {
      module: ModuleId.Tokens,
      method: 'POST',
      path: '/:token_uid/authorize',
      operation: 'tokens.authorize',
      auth: 'functional',
      requireRoutingHeaders: true,
      // Body is optional per OCPI; .optional() => absent body is fine, a present
      // body must be a valid LocationReferences (drift -> Finding).
      requestSchema: LocationReferencesSchema.optional(),
      responseSchema: AuthorizationInfoResponseSchema,
      handle: authorizeHandler,
    },
    {
      module: ModuleId.Tokens,
      method: 'GET',
      path: '',
      operation: 'tokens.list',
      auth: 'functional',
      requireRoutingHeaders: true,
      responseSchema: TokenListResponseSchema,
      handle: listHandler,
    },
  ],
};
