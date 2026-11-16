// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { EvseLocation } from '../api';

/** A location's address as two lines: the street, then postcode, city and country. */
export function addressLines(location: EvseLocation | null | undefined): string[] {
  if (!location) {
    return [];
  }
  const place = [[location.postalCode, location.city].filter(Boolean).join(' '), location.country]
    .filter(Boolean)
    .join(', ');
  return [location.address, place].filter((line): line is string => Boolean(line));
}

/** The lines of an address, each on its own line, so it breaks where the address does. */
export function AddressLines({ lines }: { lines: string[] }) {
  return (
    <>
      {lines.map((line) => (
        <span key={line} className="block text-balance">
          {line}
        </span>
      ))}
    </>
  );
}
