// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { type NetworkAlertConfigDto, NetworkAlertConfigSchema } from '@citrineos/types';
import { eq } from 'drizzle-orm';
import { networkAlertConfigTable } from '../../db/drizzle/schema/network-alert-config.js';
import type { INetworkAlertConfigRepository } from '../repositories.js';
import { DrizzleRepository } from './base.js';

type NetworkAlertConfigRow = typeof networkAlertConfigTable.$inferSelect;

// Parsed rather than assembled field by field: the DTO is a union keyed on `type`, and parsing is
// what proves a row's `rules` match its type.
export function toNetworkAlertConfigDto(entity: NetworkAlertConfigRow): NetworkAlertConfigDto {
  return NetworkAlertConfigSchema.parse(entity);
}

export class DrizzleNetworkAlertConfigRepository
  extends DrizzleRepository<typeof networkAlertConfigTable, NetworkAlertConfigDto>
  implements INetworkAlertConfigRepository
{
  // No schema-per-tenant variant: the network alert tables are row-level only.
  protected getTable(_tenantId: number): typeof networkAlertConfigTable {
    return networkAlertConfigTable;
  }

  protected toDto(row: NetworkAlertConfigRow): NetworkAlertConfigDto {
    return toNetworkAlertConfigDto(row);
  }

  async readByTenant(tenantId: number): Promise<NetworkAlertConfigDto[]> {
    const rows = await this.db
      .select()
      .from(networkAlertConfigTable)
      .where(eq(networkAlertConfigTable.tenantId, tenantId));
    return rows.map(toNetworkAlertConfigDto);
  }
}
