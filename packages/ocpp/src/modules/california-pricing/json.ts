// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/** Recursively sorts object keys so two structurally-equal JSON values serialize identically. */
function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }
  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = canonicalize((value as Record<string, unknown>)[key]);
        return acc;
      }, {});
  }
  return value;
}

/**
 * Compares two JSON strings by value, tolerating whitespace and key-order differences.
 * Falls back to string equality when either side is not valid JSON.
 */
export function sameJson(a: string, b: string): boolean {
  try {
    return (
      JSON.stringify(canonicalize(JSON.parse(a))) === JSON.stringify(canonicalize(JSON.parse(b)))
    );
  } catch {
    return a === b;
  }
}
