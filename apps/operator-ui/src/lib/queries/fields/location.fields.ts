// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * Reusable GraphQL selection-set snippets for the `Locations` type, as plain strings interpolated
 * directly into a `gql` selection:
 *
 *   gql`query { Locations_by_pk(id: $id) { ${LOCATION_CORE_FIELDS} } }`
 *
 * These are field lists only (no nested relations to other entities such as `chargingPool`), so a
 * query composes cross-entity nesting itself — which keeps these snippets free of imports from other
 * entities and therefore free of circular dependencies. Compose subsets by concatenating snippets,
 * e.g. `${LOCATION_CORE_FIELDS} ${LOCATION_DETAIL_FIELDS}`.
 */

/** Core scalar fields common to every place a Location is selected. */
export const LOCATION_CORE_FIELDS = `
  id
  name
  address
  city
  postalCode
  state
  country
  coordinates
  createdAt
  updatedAt
`;

/** Detail-only fields, added on top of {@link LOCATION_CORE_FIELDS} on the Locations pages. */
export const LOCATION_DETAIL_FIELDS = `
  facilities
  timeZone
  parkingType
  openingHours
`;
