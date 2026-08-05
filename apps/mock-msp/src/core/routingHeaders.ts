// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// Parse / strictly-require / echo the OCPI routing + message-id headers.
//   Inbound header keys arrive already lowercased by Fastify.
//   - registration endpoints (versions/credentials): NO routing-header check.
//   - functional endpoints: STRICT check — OCPI-from = CPO (US/S44),
//     OCPI-to = us (US/TST). Mismatch is a Finding + 401 (mirrors Citrine's
//     AuthMiddleware which 401s on routing-header mismatch).
//   - callback (command result): relaxed — Citrine reverses from/to
//     on the async command callback, so we must NOT strict-validate it.
// Every response echoes X-Request-ID + X-Correlation-ID (load-bearing) and
// propagates any OCPI-* routing headers that were present on the request.
// ============================================================================
import type { OcpiHeaderInfo } from './types.js';
import { uuid } from './ids.js';

/** Lowercase inbound header names (Fastify lowercases request header keys). */
export const HDR = {
  requestId: 'x-request-id',
  correlationId: 'x-correlation-id',
  fromCc: 'ocpi-from-country-code',
  fromParty: 'ocpi-from-party-id',
  toCc: 'ocpi-to-country-code',
  toParty: 'ocpi-to-party-id',
} as const;

/** Canonical (wire) header names to set on our outgoing responses. */
export const HDR_CANON = {
  requestId: 'X-Request-ID',
  correlationId: 'X-Correlation-ID',
  fromCc: 'OCPI-from-country-code',
  fromParty: 'OCPI-from-party-id',
  toCc: 'OCPI-to-country-code',
  toParty: 'OCPI-to-party-id',
} as const;

type Headers = Record<string, string>;

/** Extract the OCPI header info block recorded on every Exchange. */
export function parseRouting(headers: Headers): OcpiHeaderInfo {
  const fromCc = headers[HDR.fromCc];
  const fromParty = headers[HDR.fromParty];
  const toCc = headers[HDR.toCc];
  const toParty = headers[HDR.toParty];
  return {
    requestId: headers[HDR.requestId],
    correlationId: headers[HDR.correlationId],
    from: fromCc || fromParty ? { cc: fromCc ?? '', party: fromParty ?? '' } : undefined,
    to: toCc || toParty ? { cc: toCc ?? '', party: toParty ?? '' } : undefined,
  };
}

export interface Party {
  cc: string;
  party: string;
}
export interface RoutingCheck {
  ok: boolean;
  from: Party;
  to: Party;
  problems: string[];
}

/**
 * Strictly require the four OCPI routing headers to be present and to equal the
 * expected identities. Returns problems rather than throwing.
 */
export function requireStrict(
  headers: Headers,
  expected: { from: Party; to: Party },
): RoutingCheck {
  const from: Party = { cc: headers[HDR.fromCc] ?? '', party: headers[HDR.fromParty] ?? '' };
  const to: Party = { cc: headers[HDR.toCc] ?? '', party: headers[HDR.toParty] ?? '' };
  const problems: string[] = [];

  const checks: Array<[string, string, string]> = [
    [HDR_CANON.fromCc, from.cc, expected.from.cc],
    [HDR_CANON.fromParty, from.party, expected.from.party],
    [HDR_CANON.toCc, to.cc, expected.to.cc],
    [HDR_CANON.toParty, to.party, expected.to.party],
  ];
  for (const [name, actual, want] of checks) {
    if (!actual) problems.push(`${name} missing`);
    else if (actual !== want) problems.push(`${name}=${actual} expected ${want}`);
  }
  return { ok: problems.length === 0, from, to, problems };
}

/**
 * Build the response headers the finalizer always sets: echo X-Request-ID /
 * X-Correlation-ID (or mint fresh ones if the caller omitted them) and
 * propagate any OCPI-* routing headers that were present on the request.
 */
export function echoHeaders(reqHeaders: Headers): Headers {
  const out: Headers = {};
  out[HDR_CANON.requestId] = reqHeaders[HDR.requestId] ?? uuid();
  out[HDR_CANON.correlationId] = reqHeaders[HDR.correlationId] ?? uuid();
  if (reqHeaders[HDR.fromCc]) out[HDR_CANON.fromCc] = reqHeaders[HDR.fromCc];
  if (reqHeaders[HDR.fromParty]) out[HDR_CANON.fromParty] = reqHeaders[HDR.fromParty];
  if (reqHeaders[HDR.toCc]) out[HDR_CANON.toCc] = reqHeaders[HDR.toCc];
  if (reqHeaders[HDR.toParty]) out[HDR_CANON.toParty] = reqHeaders[HDR.toParty];
  return out;
}
