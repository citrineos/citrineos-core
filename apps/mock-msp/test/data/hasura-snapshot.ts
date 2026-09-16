// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// The exact GraphQL the mock sends to Citrine's Hasura. Compared after
// whitespace normalisation (see hasura.contract.test.ts), so the queries are
// laid out for reading here rather than byte-for-byte.

/** POST /_mock/provoke/location-nudge */
export const LOCATION_NUDGE_QUERY = `
  mutation Nudge($name: String!, $ts: timestamptz!) {
    update_Locations(where: { id: { _eq: 2 } }, _set: { name: $name, updatedAt: $ts }) {
      affected_rows
      returning { id name updatedAt }
    }
  }
`;
export const LOCATION_NUDGE_VARIABLE_TYPES = { name: 'string', ts: 'string' } as const;

/** POST /_mock/provoke/location-add — step 1, resolve the next free id (no variables). */
export const NEXT_LOCATION_ID_QUERY = `
  { Locations_aggregate { aggregate { max { id } } } }
`;

/** POST /_mock/provoke/location-add — step 2, the insert. */
export const LOCATION_ADD_QUERY = `
  mutation Add($obj: Locations_insert_input!) {
    insert_Locations_one(object: $obj) { id name }
  }
`;
/** The Locations_insert_input the mock sends; id = max+1, stamp = the same ISO time for both dates. */
export function locationAddObject(id: number, stamp: string): Record<string, unknown> {
  return {
    id,
    name: `Provoke Add ${id}`,
    address: '9 Volt Way',
    city: 'Oakland',
    postalCode: '94607',
    state: 'CA',
    country: 'USA',
    timeZone: 'America/Los_Angeles',
    publishUpstream: true,
    parkingType: 'AlongMotorway',
    facilities: ['Cafe'],
    coordinates: { type: 'Point', coordinates: [-122.4194, 37.7749] },
    openingHours: { twentyfourSeven: true },
    tenantId: 1,
    createdAt: stamp,
    updatedAt: stamp,
  };
}

/** GET /_mock/status?fresh=1 — the one combined status query (no variables). */
export const STATUS_QUERY = `
  query MockMspStatus {
    ChargingStations(order_by: { id: asc }, limit: 5) { id ocppConnectionName isOnline }
    Connectors(order_by: { id: asc }, limit: 10) { id stationId status }
    Transactions(where: { isActive: { _eq: true } }, order_by: { id: desc }, limit: 3) {
      transactionId stationId chargingState totalKwh
    }
  }
`;

/** GET /_mock/probes — the evse-availability probe's read of the first connector (no variables). */
export const CONNECTOR_STATUS_QUERY = `
  query { Connectors(limit: 1, order_by: {id: asc}) { status } }
`;

/** Hasura table / field names each driver's recorded query text must still contain. */
export const HASURA_NAMES = {
  'location-nudge': ['Locations', 'update_Locations'],
  'location-add': ['Locations', 'Locations_aggregate', 'insert_Locations_one'],
  status: ['ChargingStations', 'Connectors', 'Transactions', 'isOnline', 'ocppConnectionName'],
  probes: ['Connectors'],
} as const;
