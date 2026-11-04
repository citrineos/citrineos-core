// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { and, eq } from 'drizzle-orm';
import {
  chargingStationTable,
  tenantChargingStationTable,
} from '../../db/drizzle/schema/charging-station.js';
import type { DrizzleExecutor } from './base.js';

export function chargingStationTableFor(
  tenantId: number,
  useTenantSchema: boolean,
): typeof chargingStationTable {
  return useTenantSchema ? tenantChargingStationTable(tenantId) : chargingStationTable;
}

export async function resolveStationId(
  db: DrizzleExecutor,
  tenantId: number,
  ocppConnectionName: string | undefined | null,
  useTenantSchema = false,
): Promise<number | undefined> {
  if (!ocppConnectionName) {
    return undefined;
  }

  const stations = chargingStationTableFor(tenantId, useTenantSchema);
  const rows = await db
    .select({ id: stations.id })
    .from(stations)
    .where(
      and(
        eq(stations.ocppConnectionName, ocppConnectionName),
        // Isolation lives at the schema level in schema-per-tenant mode.
        useTenantSchema ? undefined : eq(stations.tenantId, tenantId),
      ),
    )
    .limit(1);

  return rows[0]?.id;
}

export async function resolveStationIdOrThrow(
  db: DrizzleExecutor,
  tenantId: number,
  ocppConnectionName: string | undefined | null,
  purpose: string,
  useTenantSchema = false,
): Promise<number> {
  const stationId = await resolveStationId(db, tenantId, ocppConnectionName, useTenantSchema);
  if (stationId === undefined) {
    throw new Error(
      `Cannot ${purpose}: no charging station named ` +
        `'${ocppConnectionName}' exists in tenant ${tenantId}.`,
    );
  }
  return stationId;
}
