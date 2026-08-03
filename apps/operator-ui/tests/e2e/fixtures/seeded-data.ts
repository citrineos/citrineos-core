// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { ApiClient } from './api-client';
import { shortId } from '../utils/random';

// Schema reference for seeds + lookups:
//   ChargingStations.id                 — int auto-inc PK
//   ChargingStations.ocppConnectionName — string identifier (the OCPP name
//                                         the charger uses when it connects)
//   Child tables (Transactions, Connectors, Evses, StatusNotifications,
//   LatestStatusNotifications, OCPPMessages, …):
//     stationId          — int FK to ChargingStations.id
//     ocppConnectionName — string identifier (populated by a BEFORE INSERT/
//                          UPDATE trigger `populate_station_id` when the row
//                          is written with `stationId` null, so seeds may
//                          set `ocppConnectionName` alone and the trigger
//                          fills in the int FK from tenant + connection
//                          name).

function nowIso(): string {
  return new Date().toISOString();
}

export interface SeededLocation {
  readonly id: number;
  readonly name: string;
}

export interface SeededStation {
  readonly id: number;
  readonly ocppConnectionName: string;
  readonly locationId: number;
}

export interface SeededTransaction {
  readonly transactionId: string;
  readonly id: number;
  readonly stationId: number;
  readonly ocppConnectionName: string;
}

// Minimal authorization for OCPP RemoteStart command flows.
export interface SeededAuthorization {
  readonly id: number;
  readonly idToken: string;
  readonly idTokenType: string;
  readonly status: string;
}

export async function seedLocation(
  api: ApiClient,
  overrides: Partial<{
    name: string;
    address: string;
    city: string;
    country: string;
  }> = {},
): Promise<SeededLocation> {
  const name = overrides.name ?? `${shortId()}-loc`;
  const now = nowIso();
  const data = await api.gql<{
    insert_Locations_one: { id: number; name: string };
  }>(
    `mutation SeedLocation($obj: Locations_insert_input!) {
       insert_Locations_one(object: $obj) { id name }
     }`,
    {
      obj: {
        name,
        address: overrides.address ?? '1 Test Street',
        city: overrides.city ?? 'Testville',
        country: overrides.country ?? 'US',
        createdAt: now,
        updatedAt: now,
      },
    },
  );
  return {
    id: data.insert_Locations_one.id,
    name: data.insert_Locations_one.name,
  };
}

export async function deleteLocation(api: ApiClient, id: number): Promise<void> {
  // Hasura exposes Locations.id as Int — declaring it bigint! makes the
  // mutation fail validation before it runs, so every seeded location leaked.
  await api.gql(
    `mutation DeleteLocation($id: Int!) {
       delete_Locations_by_pk(id: $id) { id }
     }`,
    { id },
  );
}

export async function seedStation(
  api: ApiClient,
  locationId: number,
  overrides: Partial<{
    ocppConnectionName: string;
    isOnline: boolean;
    protocol: string;
  }> = {},
): Promise<SeededStation> {
  const ocppConnectionName = overrides.ocppConnectionName ?? `${shortId()}-cp`;
  const now = nowIso();
  const data = await api.gql<{
    insert_ChargingStations_one: { id: number; ocppConnectionName: string };
  }>(
    `mutation SeedStation($obj: ChargingStations_insert_input!) {
       insert_ChargingStations_one(object: $obj) { id ocppConnectionName }
     }`,
    {
      obj: {
        ocppConnectionName,
        locationId,
        isOnline: overrides.isOnline ?? true,
        protocol: overrides.protocol ?? 'ocpp2.0.1',
        createdAt: now,
        updatedAt: now,
      },
    },
  );
  return {
    id: data.insert_ChargingStations_one.id,
    ocppConnectionName: data.insert_ChargingStations_one.ocppConnectionName,
    locationId,
  };
}

export async function deleteStation(api: ApiClient, id: number): Promise<void> {
  await api.gql(
    `mutation DeleteStation($id: Int!) {
       delete_ChargingStations_by_pk(id: $id) { id }
     }`,
    { id },
  );
}

export async function seedTransaction(
  api: ApiClient,
  ocppConnectionName: string,
  overrides: Partial<{
    transactionId: string;
    isActive: boolean;
    totalKwh: number;
  }> = {},
): Promise<SeededTransaction> {
  const transactionId = overrides.transactionId ?? `${shortId()}-tx`;
  const now = nowIso();
  // The Transactions table's int `stationId` FK is populated by the
  // populate_station_id trigger from `ocppConnectionName` + tenant.
  const data = await api.gql<{
    insert_Transactions_one: {
      id: number;
      stationId: number;
      transactionId: string;
    };
  }>(
    `mutation SeedTransaction($obj: Transactions_insert_input!) {
       insert_Transactions_one(object: $obj) { id stationId transactionId }
     }`,
    {
      obj: {
        transactionId,
        ocppConnectionName,
        isActive: overrides.isActive ?? true,
        totalKwh: overrides.totalKwh ?? 0,
        createdAt: now,
        updatedAt: now,
      },
    },
  );
  return {
    transactionId,
    id: data.insert_Transactions_one.id,
    stationId: data.insert_Transactions_one.stationId,
    ocppConnectionName,
  };
}

// Seeds a sequence of MeterValues rows under an existing transaction so
// the transaction detail page's Recharts surfaces (Energy / Power /
// Current / State of Charge) have data points to render. Each row carries
// a `sampledValue` JSON array with one entry per measurand. The chart
// component requires a `context` of Transaction.Begin / Sample.Periodic /
// Transaction.End for a row to be plotted.
export async function seedMeterValues(
  api: ApiClient,
  transactionDatabaseId: number,
  count = 6,
): Promise<void> {
  const baseTime = Date.now();
  const rows = Array.from({ length: count }, (_, i) => {
    const ts = new Date(baseTime + i * 60_000).toISOString();
    const energyKwh = i * 0.5; // 0, 0.5, 1.0, 1.5, ...
    const powerKw = 7.2;
    const context =
      i === 0 ? 'Transaction.Begin' : i === count - 1 ? 'Transaction.End' : 'Sample.Periodic';
    return {
      transactionDatabaseId,
      timestamp: ts,
      sampledValue: [
        {
          value: energyKwh,
          context,
          measurand: 'Energy.Active.Import.Register',
          unitOfMeasure: { unit: 'kWh' },
        },
        {
          value: powerKw,
          context,
          measurand: 'Power.Active.Import',
          unitOfMeasure: { unit: 'kW' },
        },
      ],
      createdAt: ts,
      updatedAt: ts,
    };
  });
  await api.gql(
    `mutation SeedMeterValues($rows: [MeterValues_insert_input!]!) {
       insert_MeterValues(objects: $rows) { affected_rows }
     }`,
    { rows },
  );
}

export async function deleteMeterValuesForTransaction(
  api: ApiClient,
  transactionDatabaseId: number,
): Promise<void> {
  await api.gql(
    `mutation DeleteMeterValues($id: Int!) {
       delete_MeterValues(where: { transactionDatabaseId: { _eq: $id } }) { affected_rows }
     }`,
    { id: transactionDatabaseId },
  );
}

export async function deleteTransaction(api: ApiClient, transactionId: string): Promise<void> {
  await api.gql(
    `mutation DeleteTransaction($transactionId: String!) {
       delete_Transactions(where: { transactionId: { _eq: $transactionId } }) { affected_rows }
     }`,
    { transactionId },
  );
}

// Authorization seed helpers. The default token type is `Central` (the
// semantically correct type for CSMS-issued tokens — see citrineos-core's
// validator: ISO14443 enforces 8/14-hex format, Central accepts the
// readable identifier shape these tests produce).
export async function seedAuthorization(
  api: ApiClient,
  overrides: Partial<{
    idToken: string;
    idTokenType: string;
    status: string;
  }> = {},
): Promise<SeededAuthorization> {
  const idToken = overrides.idToken ?? `${shortId().toUpperCase()}-RFID`;
  const idTokenType = overrides.idTokenType ?? 'Central';
  const status = overrides.status ?? 'Accepted';
  const now = nowIso();
  const data = await api.gql<{
    insert_Authorizations_one: {
      id: number;
      idToken: string;
      idTokenType: string;
      status: string;
    };
  }>(
    `mutation SeedAuthorization($obj: Authorizations_insert_input!) {
       insert_Authorizations_one(object: $obj) { id idToken idTokenType status }
     }`,
    {
      obj: {
        idToken,
        idTokenType,
        status,
        createdAt: now,
        updatedAt: now,
      },
    },
  );
  return {
    id: data.insert_Authorizations_one.id,
    idToken: data.insert_Authorizations_one.idToken,
    idTokenType: data.insert_Authorizations_one.idTokenType,
    status: data.insert_Authorizations_one.status,
  };
}

export async function deleteAuthorization(api: ApiClient, id: number): Promise<void> {
  await api.gql(
    `mutation DeleteAuthorization($id: Int!) {
       delete_Authorizations_by_pk(id: $id) { id }
     }`,
    { id },
  );
}

export async function purgeAllE2eRows(api: ApiClient): Promise<void> {
  // Stale-row purge for accumulated test data. Used by globalSetup and
  // globalTeardown. Order respects FK constraints AND a CitrineOS Core
  // Postgres trigger on child tables that fails the delete unless
  // StatusNotifications referencing the station are cleared first.
  //
  // The `e2e-` prefix marker is on `ocppConnectionName` (a string column).
  // `stationId` is the int FK and is not _like-matchable, so all the cleanup
  // filters target `ocppConnectionName` instead.
  await api
    .gql(
      `mutation PurgeStatusNotifications {
         delete_StatusNotifications(where: { ocppConnectionName: { _like: "e2e-%" } }) { affected_rows }
       }`,
    )
    .catch(() => undefined);

  await api
    .gql(
      `mutation PurgeLatestStatusNotifications {
         delete_LatestStatusNotifications(where: { ocppConnectionName: { _like: "e2e-%" } }) { affected_rows }
       }`,
    )
    .catch(() => undefined);

  await api
    .gql<{ Transactions: { transactionId: string }[] }>(
      `query StaleTransactions {
         Transactions(where: { transactionId: { _like: "e2e-%" } }) { transactionId }
       }`,
    )
    .then(async ({ Transactions }) => {
      for (const t of Transactions) {
        await deleteTransaction(api, t.transactionId).catch(() => undefined);
      }
    })
    .catch(() => undefined);

  await api
    .gql<{ ChargingStations: { id: number }[] }>(
      `query StaleStations {
         ChargingStations(where: { ocppConnectionName: { _like: "e2e-%" } }) { id }
       }`,
    )
    .then(async ({ ChargingStations }) => {
      for (const s of ChargingStations) {
        await deleteStation(api, s.id).catch(() => undefined);
      }
    })
    .catch(() => undefined);

  // Authorizations: every e2e-seeded token starts with E2E- (the old
  // "%-RFID" match was over-broad — on a shared DB it would take out any
  // authorization whose token merely ends in -RFID).
  await api
    .gql(
      `mutation PurgeAuthorizations {
         delete_Authorizations(
           where: { _or: [
             { idToken: { _ilike: "E2E-%" } },
             { idToken: { _eq: "_PROBE_E2E_AUTH" } }
           ] }
         ) { affected_rows }
       }`,
    )
    .catch(() => undefined);

  await api
    .gql(
      `mutation PurgeLocations {
         delete_Locations(where: { name: { _like: "e2e-%" } }) { affected_rows }
       }`,
    )
    .catch(() => undefined);

  // Partners register under the reserved ZZ country code and tariffs under the
  // XTS test currency (see the partners/tariffs specs) — both markers exist so
  // rows a crashed run leaves behind can be swept here without touching real
  // data.
  await api
    .gql(
      `mutation PurgeTenantPartners {
         delete_TenantPartners(where: { countryCode: { _eq: "ZZ" } }) { affected_rows }
       }`,
    )
    .catch(() => undefined);

  await api
    .gql(
      `mutation PurgeTariffs {
         delete_Tariffs(where: { currency: { _eq: "XTS" } }) { affected_rows }
       }`,
    )
    .catch(() => undefined);
}
