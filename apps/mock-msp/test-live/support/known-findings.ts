// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// Error-level findings the live lane tolerates because they are documented
// CitrineOS defects (README "Real Citrine OCPI rough-edges"). Anything else at
// error severity fails the lane. Entries with `mustOccur` are asserted to still
// show up in a full run, so a fixed bug cannot leave a stale entry behind.
import type { Finding } from '../../src/core/types.js';

export interface KnownFinding {
  id: string;
  note: string;
  mustOccur?: boolean;
  match(f: Finding): boolean;
}

interface ZodIssueLike {
  path?: Array<string | number>;
  message?: string;
}

function issuePaths(f: Finding): string[] {
  return ((f.issues ?? []) as ZodIssueLike[]).map((i) => (i.path ?? []).join('.'));
}

export const KNOWN_FINDINGS: KnownFinding[] = [
  {
    id: 'coordinates-4-decimals',
    note: 'GeoLocation latitude/longitude emitted with 4 decimals (README #9)',
    match: (f) =>
      f.module === 'locations' &&
      f.kind === 'body' &&
      issuePaths(f).some((p) => /coordinates\.(latitude|longitude)$/.test(p)),
  },
  {
    id: 'cdrs-envelope-incomplete',
    note: 'GET /cdrs omits status_code/timestamp from the envelope (README #10)',
    match: (f) =>
      f.module === 'cdrs' &&
      f.kind === 'body' &&
      issuePaths(f).some((p) => p === 'status_code' || p === 'timestamp'),
  },
  {
    id: 'patch-omits-valid-blocks-token',
    note: 'tokens PATCH without `valid` blocks the token (README #11); the mock flags it itself',
    match: (f) => f.module === 'tokens' && f.isKnownCitrineBug === true,
  },
  {
    id: 'probe-evse-availability',
    note: 'busy connector published as UNKNOWN (README #12)',
    match: (f) => f.detail.startsWith('Spec probe [evse-availability]'),
  },
  {
    id: 'probe-pagination-total',
    note: 'X-Total-Count is the page size, not the result-set size (README #12)',
    match: (f) => f.detail.startsWith('Spec probe [pagination-total]'),
  },
  {
    id: 'probe-string-location-id',
    note: 'non-numeric location_id returns 500 (README #12)',
    match: (f) => f.detail.startsWith('Spec probe [string-location-id]'),
  },
];

export function classify(f: Finding): KnownFinding | undefined {
  return KNOWN_FINDINGS.find((k) => k.match(f));
}

/** Error findings nobody has accounted for. */
export function unexpectedErrors(all: Finding[]): Finding[] {
  return all.filter((f) => f.severity === 'error' && !classify(f));
}

export function unseenMustOccur(all: Finding[]): KnownFinding[] {
  return KNOWN_FINDINGS.filter((k) => k.mustOccur && !all.some((f) => k.match(f)));
}
