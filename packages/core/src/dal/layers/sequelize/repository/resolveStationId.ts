// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { Transaction } from 'sequelize';
import { ChargingStation } from '../model/Location/ChargingStation.js';

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
