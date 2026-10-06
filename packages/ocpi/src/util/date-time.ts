// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// OCPI DateTime is RFC 3339 string(25) in UTC. GraphQL and pg NOTIFY hand timestamptz columns
// over as strings with microseconds and a numeric offset (up to 32 characters, and "+00:00 is
// not the same as UTC" per the spec); a Date serialises to the conformant form. A value that
// cannot form a Date would otherwise serialise as null — last_updated is required — so fail loud.
export function toOcpiDateTime(value: Date | string): Date {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new TypeError(`Not a timestamp: ${String(value)}`);
  }
  return date;
}

// Partial (PATCH) objects may legitimately omit the timestamp; an absent value stays absent.
export function toOptionalOcpiDateTime(value: Date | string | null | undefined): Date | undefined {
  return value == null ? undefined : toOcpiDateTime(value);
}
