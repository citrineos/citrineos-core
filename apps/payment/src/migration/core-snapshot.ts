// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { Sequelize } from '@citrineos/dal';
import { QueryTypes } from 'sequelize';
import type { CoreSnapshot } from './types.js';

function num(value: unknown): number | null {
  return value === null || value === undefined ? null : Number(value);
}

/**
 * Every tenant's stations, EVSEs, connectors, tariffs, locations, running sessions and payment
 * accounts, read in one go.
 */
export async function readCoreSnapshot(
  sequelize: Sequelize,
  idTokenPrefix: string,
): Promise<CoreSnapshot> {
  const select = <T extends object>(sql: string, replacements: Record<string, unknown> = {}) =>
    sequelize.query<T>(sql, { type: QueryTypes.SELECT, replacements });

  const tenants = await select<{ id: number; name: string }>('SELECT id, name FROM "Tenants"');
  const stations = await select<CoreSnapshot['stations'][number]>(
    'SELECT id, "tenantId", "ocppConnectionName", "locationId" FROM "ChargingStations"',
  );
  const evses = await select<CoreSnapshot['evses'][number]>(
    'SELECT id, "tenantId", "stationId", "evseTypeId", "evseId" FROM "Evses" WHERE removed IS NOT TRUE',
  );
  const connectors = await select<CoreSnapshot['connectors'][number]>(
    'SELECT id, "tenantId", "evseId", "stationId", "connectorId", "evseTypeConnectorId", "tariffId" FROM "Connectors"',
  );
  const tariffs = await select<Record<string, unknown>>(
    `SELECT id, "tenantId", currency, "pricePerKwh", "pricePerMin", "pricePerSession", "taxRate",
            "authorizationAmount", "paymentFee" FROM "Tariffs"`,
  );
  const locations = await select<CoreSnapshot['locations'][number]>(
    'SELECT id, "tenantId", address, "postalCode", city, state, country FROM "Locations"',
  );
  const active = await select<{
    stationId: number;
    transactionId: string;
    remoteStartId: number | null;
  }>(
    `SELECT "stationId", "transactionId", "remoteStartId" FROM "Transactions"
      WHERE "isActive" AND "stationId" IS NOT NULL`,
  );
  const accounts = await select<CoreSnapshot['paymentAccounts'][number]>(
    'SELECT "tenantId", "stripeAccountId" FROM "PaymentAccounts"',
  );
  const [issued] = await select<{ max: string | null }>(
    `SELECT max(substr("idToken", length(:prefix) + 1)::bigint) AS max FROM "Authorizations"
      WHERE left("idToken", length(:prefix)) = :prefix
        AND substr("idToken", length(:prefix) + 1) ~ '^[0-9]{1,12}$'`,
    { prefix: idTokenPrefix },
  );
  const [sequence] = await select<{ next: string }>(
    `SELECT CASE WHEN is_called THEN last_value + 1 ELSE last_value END AS next
       FROM "Checkouts_id_seq"`,
  );

  return {
    tenants: tenants.map((tenant) => ({ id: Number(tenant.id), name: tenant.name })),
    stations,
    evses,
    connectors,
    tariffs: tariffs.map((row) => ({
      id: Number(row.id),
      tenantId: Number(row.tenantId),
      currency: String(row.currency),
      pricePerKwh: num(row.pricePerKwh),
      pricePerMin: num(row.pricePerMin),
      pricePerSession: num(row.pricePerSession),
      taxRate: num(row.taxRate),
      authorizationAmount: num(row.authorizationAmount),
      paymentFee: num(row.paymentFee),
    })),
    locations,
    activeTransactions: active.map((transaction) => ({
      stationId: Number(transaction.stationId),
      transactionId: transaction.transactionId,
      remoteStartId: num(transaction.remoteStartId),
    })),
    paymentAccounts: accounts,
    highestIssuedCheckoutId: num(issued?.max) ?? 0,
    nextCheckoutId: Number(sequence?.next ?? 1),
  };
}
