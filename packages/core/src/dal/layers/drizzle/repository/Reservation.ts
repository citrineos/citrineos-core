// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { OCPP2_request_types, ReservationDto } from '@citrineos/types';
import { and, eq, isNull, max } from 'drizzle-orm';
import { evseTypeTable } from '../schema/EvseType.js';
import {
  type ReservationEntity,
  reservationTable,
  tenantReservationTable,
} from '../schema/Reservation.js';
import { type Explicit } from '../types.js';
import { DrizzleRepository } from './Base.js';
import { type IReservationRepository } from '../../../interfaces/repositories.js';

// ─── Mapper ──────────────────────────────────────────────────────────────────
// Maps a Drizzle entity (DB row) to the external ReservationDto contract.
export function toReservationDto(entity: ReservationEntity): ReservationDto {
  const dto: Explicit<ReservationDto> = {
    databaseId: entity.databaseId,
    id: entity.id as number,
    ocppConnectionName: entity.ocppConnectionName ?? '',
    // Drizzle returns timestamp as JS Date (mode: 'date'); DTO contract is ISO string.
    expiryDateTime: entity.expiryDateTime ? entity.expiryDateTime.toISOString() : '',
    connectorType: entity.connectorType ?? null,
    reserveStatus: entity.reserveStatus ?? null,
    isActive: entity.isActive ?? false,
    terminatedByTransaction: entity.terminatedByTransaction ?? null,
    idToken: (entity.idToken as Record<string, any>) ?? {},
    groupIdToken: (entity.groupIdToken as Record<string, any> | null) ?? null,
    evseId: entity.evseId ?? null,
    evse: undefined,
    tenantId: entity.tenantId,
    tenant: undefined,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
  return dto;
}

export class DrizzleReservationRepository
  extends DrizzleRepository<typeof reservationTable, ReservationDto>
  implements IReservationRepository
{
  protected getTable(tenantId: number): typeof reservationTable {
    return this.useTenantSchema ? tenantReservationTable(tenantId) : reservationTable;
  }

  protected toDto(row: ReservationEntity): ReservationDto {
    return toReservationDto(row);
  }

  async createOrUpdateReservation(
    tenantId: number,
    reserveNowRequest: OCPP2_request_types.ReserveNowRequest,
    ocppConnectionName: string,
    isActive?: boolean,
  ): Promise<ReservationDto | undefined> {
    // Resolve the EvseType surrogate key (databaseId) from the OCPP evse id.
    // Mirrors the Sequelize repo: only EVSE-level rows (connectorId IS NULL) qualify.
    let evseDBId: number | null = null;
    if (reserveNowRequest.evseId) {
      const evseRows = await this.db
        .select({ databaseId: evseTypeTable.databaseId })
        .from(evseTypeTable)
        .where(
          and(
            eq(evseTypeTable.tenantId, tenantId),
            eq(evseTypeTable.id, reserveNowRequest.evseId),
            isNull(evseTypeTable.connectorId),
          ),
        )
        .limit(1);

      if (!evseRows[0]) {
        this.logger.error(`Could not find evse with id ${reserveNowRequest.evseId}`);
        return undefined;
      }
      evseDBId = evseRows[0].databaseId;
    }

    // Upsert on the unique index (id, ocppConnectionName, tenantId), keyed by
    // databaseId for the update. Wrapped in a transaction so the read and the
    // subsequent insert/update observe a consistent snapshot.
    let savedReservation: ReservationDto | undefined;
    let reservationExists = false;

    await this.db.transaction(async (tx) => {
      const existing = (await tx
        .select()
        .from(reservationTable)
        .where(
          and(
            eq(reservationTable.tenantId, tenantId),
            eq(reservationTable.ocppConnectionName, ocppConnectionName),
            eq(reservationTable.id, reserveNowRequest.id),
          ),
        )
        .limit(1)) as ReservationEntity[];

      reservationExists = existing.length > 0;

      if (reservationExists) {
        const updated = (await tx
          .update(reservationTable)
          .set({
            expiryDateTime: reserveNowRequest.expiryDateTime
              ? new Date(reserveNowRequest.expiryDateTime)
              : null,
            connectorType: reserveNowRequest.connectorType ?? null,
            evseId: evseDBId,
            idToken: reserveNowRequest.idToken,
            groupIdToken: reserveNowRequest.groupIdToken ?? null,
            isActive: isActive ?? false,
            updatedAt: new Date(),
            tenantId,
          })
          .where(eq(reservationTable.databaseId, existing[0].databaseId))
          .returning()) as ReservationEntity[];

        if (updated[0]) savedReservation = this.toDto(updated[0]);
      } else {
        // Create path mirrors Sequelize: isActive is left to the column default (false).
        const inserted = (await tx
          .insert(reservationTable)
          .values({
            id: reserveNowRequest.id,
            ocppConnectionName,
            expiryDateTime: reserveNowRequest.expiryDateTime
              ? new Date(reserveNowRequest.expiryDateTime)
              : null,
            connectorType: reserveNowRequest.connectorType ?? null,
            evseId: evseDBId,
            idToken: reserveNowRequest.idToken,
            groupIdToken: reserveNowRequest.groupIdToken ?? null,
            tenantId,
          })
          .returning()) as ReservationEntity[];

        if (inserted[0]) savedReservation = this.toDto(inserted[0]);
      }
    });

    if (savedReservation) {
      this.emit(reservationExists ? 'updated' : 'created', [savedReservation]);
    }

    return savedReservation;
  }

  async findByStationAndReservationId(
    tenantId: number,
    ocppConnectionName: string,
    reservationId: number,
  ): Promise<ReservationDto | undefined> {
    const rows = (await this.db
      .select()
      .from(reservationTable)
      .where(
        and(
          eq(reservationTable.tenantId, tenantId),
          eq(reservationTable.ocppConnectionName, ocppConnectionName),
          eq(reservationTable.id, reservationId),
        ),
      )
      .limit(1)) as ReservationEntity[];

    return rows[0] ? this.toDto(rows[0]) : undefined;
  }

  async updateByStationAndReservationId(
    tenantId: number,
    ocppConnectionName: string,
    reservationId: number,
    values: Partial<Pick<ReservationDto, 'isActive' | 'reserveStatus' | 'terminatedByTransaction'>>,
  ): Promise<ReservationDto[]> {
    const rows = (await this.db
      .update(reservationTable)
      .set({ ...values, updatedAt: new Date() })
      .where(
        and(
          eq(reservationTable.tenantId, tenantId),
          eq(reservationTable.ocppConnectionName, ocppConnectionName),
          eq(reservationTable.id, reservationId),
        ),
      )
      .returning()) as ReservationEntity[];

    const dtos = rows.map((row) => this.toDto(row));
    if (dtos.length > 0) {
      this.emit('updated', dtos);
    }
    return dtos;
  }

  async getNextReservationId(tenantId: number, ocppConnectionName: string): Promise<number> {
    const rows = await this.db
      .select({ value: max(reservationTable.id) })
      .from(reservationTable)
      .where(
        and(
          eq(reservationTable.tenantId, tenantId),
          eq(reservationTable.ocppConnectionName, ocppConnectionName),
        ),
      );

    const maxValue = rows[0]?.value;
    return maxValue == null ? 1 : maxValue + 1;
  }
}
