// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Op, type Transaction } from 'sequelize';
import { ChargingStation } from '../../models/location/charging-station.js';

/**
 * Resolves ChargingStations.id for a connection name.
 */
export async function resolveStationId(
  tenantId: number,
  ocppConnectionName: string | undefined | null,
  transaction?: Transaction,
): Promise<number | undefined> {
  if (!ocppConnectionName) {
    return undefined;
  }

  const station = await ChargingStation.findOne({
    where: { ocppConnectionName, tenantId },
    attributes: ['id'],
    transaction,
  });

  return station?.id ?? undefined;
}

export async function resolveStationIdOrThrow(
  tenantId: number,
  ocppConnectionName: string | undefined | null,
  purpose: string,
  transaction?: Transaction,
): Promise<number> {
  const stationId = await resolveStationId(tenantId, ocppConnectionName, transaction);
  if (stationId === undefined) {
    throw new Error(
      `Cannot ${purpose}: no charging station named ` +
        `'${ocppConnectionName}' exists in tenant ${tenantId}.`,
    );
  }
  return stationId;
}

/**
 * Returns the resolved "stationId" for use in a `where` clause, or a condition matching
 * no rows when the name resolves to no station in the tenant.
 */
export async function stationIdFilter(
  tenantId: number,
  ocppConnectionName: string | undefined | null,
  transaction?: Transaction,
): Promise<number | { [Op.in]: number[] }> {
  const stationId = await resolveStationId(tenantId, ocppConnectionName, transaction);
  return stationId ?? { [Op.in]: [] };
}
