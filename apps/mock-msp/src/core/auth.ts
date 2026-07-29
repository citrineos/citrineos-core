// ============================================================================
// FILE: apps/mock-msp/src/core/auth.ts
// Inbound auth guard mirroring Citrine's AuthMiddleware + AuthToken decorator:
//   - Authorization header format is literally `Token <base64(rawToken)>`.
//   - Citrine base64-ENCODES outbound (BaseClientApi.getHeaders) and
//     base64-DECODES inbound (extractToken -> base64Decode) then matches the
//     decoded plaintext against a stored token.
// The mock mirrors this exactly so a token we issue Citrine round-trips, and a
// token Citrine issues us is accepted. Also provides the outbound header builder
// used by the OcpiClient (Actor).
// ============================================================================
import type { AuthMode, MockContext, OcpiRoute } from './types.js';

const TOKEN_PREFIX = 'Token ';

/** base64-encode a raw token exactly like ocpi-base `base64Encode`. */
export function base64Encode(input: string): string {
  return Buffer.from(input, 'utf-8').toString('base64');
}

/** base64-decode a wire token exactly like ocpi-base `base64Decode` (lenient). */
export function base64Decode(input: string): string {
  return Buffer.from(input, 'base64').toString('utf-8');
}

/** Build the outbound `Authorization` header value for a raw token. */
export function encodeToken(rawToken: string): string {
  return `${TOKEN_PREFIX}${base64Encode(rawToken)}`;
}

/** Alias kept for the OcpiClient call-site readability. */
export const buildOutboundAuthHeader = encodeToken;

export interface DecodedAuth {
  /** The plaintext token after stripping `Token ` and base64-decoding. */
  token?: string;
  /** True when the header was absent or not in `Token <base64>` shape. */
  malformed: boolean;
}

/**
 * Strip the `Token ` prefix and base64-decode the remainder. Mirrors
 * ocpi-base `extractToken`. base64 decoding in Node is lenient and will not
 * throw for arbitrary input, so a garbage token simply fails the later
 * equality check rather than being flagged malformed here.
 */
export function decodeAuthHeader(header?: string): DecodedAuth {
  if (!header) return { malformed: true };
  if (!header.startsWith(TOKEN_PREFIX)) return { malformed: true };
  const b64 = header.slice(TOKEN_PREFIX.length).trim();
  if (!b64) return { malformed: true };
  try {
    return { token: base64Decode(b64), malformed: false };
  } catch {
    return { malformed: true };
  }
}

/**
 * The set of plaintext tokens we accept on an inbound request. Registration
 * endpoints (versions/credentials) additionally accept the transient TOKEN_A
 * so the CPO can drive the handshake before TOKEN_C exists.
 */
export function validInboundTokens(ctx: MockContext, auth: AuthMode): string[] {
  const reg = ctx.store.domain.registration;
  const tokens: string[] = [];
  if (reg.tokenWeAccept) tokens.push(reg.tokenWeAccept);
  if (auth === 'registration' && reg.tokenA) tokens.push(reg.tokenA);
  return tokens;
}

export interface InboundAuthResult {
  rawHeader?: string;
  decodedToken?: string;
  verified: boolean;
}

/**
 * Verify an inbound request's Authorization header against the tokens the mock
 * currently accepts, honoring the route's AuthMode (registration also accepts
 * TOKEN_A). Never throws — returns a structured result the dispatcher acts on.
 */
export function verifyInbound(ctx: MockContext, route: OcpiRoute): InboundAuthResult {
  const rawHeader = ctx.req?.headers['authorization'];
  const { token, malformed } = decodeAuthHeader(rawHeader);
  if (malformed || !token) {
    return { rawHeader, verified: false };
  }
  const verified = validInboundTokens(ctx, route.auth).includes(token);
  return { rawHeader, decodedToken: token, verified };
}
