// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type {
  ChargingNeedsDto,
  EnergyTransferModeEnumType,
  OCPP2_request_types,
} from '@citrineos/types';
import {
  type ChargingNeedsEntity,
  chargingNeedsTable,
  tenantChargingNeedsTable,
} from '../../db/drizzle/schema/charging-needs.js';
import { type Explicit } from '../../db/drizzle/types.js';
import { and, desc, eq } from 'drizzle-orm';
import { evseTable, tenantEvseTable } from '../../db/drizzle/schema/evse.js';
import { tenantTransactionTable, transactionTable } from '../../db/drizzle/schema/transaction.js';
import type { IChargingNeedsRepository } from '../repositories.js';
import { DrizzleRepository } from './base.js';
import { resolveStationIdOrThrow } from './resolve-station-id.js';

// ─── Mapper ──────────────────────────────────────────────────────────────────
// Maps a Drizzle entity (DB row) to the external ChargingNeedsDto contract.
export function toChargingNeedsDto(entity: ChargingNeedsEntity): ChargingNeedsDto {
  const dto: Explicit<ChargingNeedsDto> = {
    id: entity.id,
    acChargingParameters: entity.acChargingParameters,
    dcChargingParameters: entity.dcChargingParameters,
    // Drizzle returns timestamp as JS Date (mode: 'date'); DTO contract is ISO string.
    departureTime: entity.departureTime ? entity.departureTime.toISOString() : null,
    requestedEnergyTransfer: entity.requestedEnergyTransfer as EnergyTransferModeEnumType,
    maxScheduleTuples: entity.maxScheduleTuples,
    evseId: entity.evseId!,
    transactionDatabaseId: entity.transactionDatabaseId!,
    transactionCreatedAt: entity.transactionCreatedAt,
    tenantId: entity.tenantId,
    tenant: undefined,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
  return dto;
}

export class DrizzleChargingNeedsRepository
  extends DrizzleRepository<typeof chargingNeedsTable, ChargingNeedsDto>
  implements IChargingNeedsRepository
{
  protected getTable(tenantId: number): typeof chargingNeedsTable {
    return this.useTenantSchema ? tenantChargingNeedsTable(tenantId) : chargingNeedsTable;
  }

  protected toDto(row: ChargingNeedsEntity): ChargingNeedsDto {
    return toChargingNeedsDto(row);
  }

  private getTransactionTable(tenantId: number): typeof transactionTable {
    return this.useTenantSchema ? tenantTransactionTable(tenantId) : transactionTable;
  }

  private getEvseTable(tenantId: number): typeof evseTable {
    return this.useTenantSchema ? tenantEvseTable(tenantId) : evseTable;
  }

  async createChargingNeeds(
    tenantId: number,
    chargingNeedsReq: OCPP2_request_types.NotifyEVChargingNeedsRequest,
    ocppConnectionName: string,
  ): Promise<ChargingNeedsDto> {
    const stationId = await resolveStationIdOrThrow(
      this.db,
      tenantId,
      ocppConnectionName,
      'record charging needs',
      this.useTenantSchema,
    );

    const transactions = this.getTransactionTable(tenantId);
    const evses = this.getEvseTable(tenantId);
    // The request names the OCPP evse number, which lives on Evses.evseTypeId; the
    // transaction stores the Evses primary key.
    const rows = (await this.db
      .select({
        id: transactions.id,
        evseId: transactions.evseId,
        createdAt: transactions.createdAt,
      })
      .from(transactions)
      .innerJoin(
        evses,
        and(
          eq(transactions.evseId, evses.id),
          eq(evses.evseTypeId, chargingNeedsReq.evseId),
          this.tenantFilter(evses, tenantId),
        ),
      )
      .where(
        and(
          eq(transactions.stationId, stationId),
          eq(transactions.isActive, true),
          this.tenantFilter(transactions, tenantId),
        ),
      )
      .limit(1)) as { id: number; evseId: number | null; createdAt: Date }[];

    const activeTransaction = rows[0];
    if (!activeTransaction) {
      throw new Error(
        `No active transaction found on station ${ocppConnectionName} evse ${chargingNeedsReq.evseId}`,
      );
    }

    const needs = chargingNeedsReq.chargingNeeds;
    return await this.insert(tenantId, {
      acChargingParameters: needs.acChargingParameters ?? null,
      dcChargingParameters: needs.dcChargingParameters ?? null,
      departureTime: needs.departureTime ? new Date(needs.departureTime) : null,
      requestedEnergyTransfer: needs.requestedEnergyTransfer,
      maxScheduleTuples: chargingNeedsReq.maxScheduleTuples ?? null,
      evseId: activeTransaction.evseId,
      transactionDatabaseId: activeTransaction.id,
      transactionCreatedAt: activeTransaction.createdAt,
    });
  }

  async findChargingNeedsByEvseDBIdAndTransactionDBId(
    tenantId: number,
    evseDBId: number,
    transactionDataBaseId: number,
  ): Promise<ChargingNeedsDto | undefined> {
    const chargingNeeds = this.getTable(tenantId);
    const rows = (await this.db
      .select()
      .from(chargingNeeds)
      .where(
        and(
          eq(chargingNeeds.evseId, evseDBId),
          eq(chargingNeeds.transactionDatabaseId, transactionDataBaseId),
          this.tenantFilter(chargingNeeds, tenantId),
        ),
      )
      .orderBy(desc(chargingNeeds.createdAt))
      .limit(1)) as ChargingNeedsEntity[];

    return rows[0] ? toChargingNeedsDto(rows[0]) : undefined;
  }
}
