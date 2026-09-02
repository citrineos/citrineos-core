// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { TariffDto } from '@citrineos/types';
import { and, eq } from 'drizzle-orm';
import {
  type TariffEntity,
  tariffTable,
  tenantTariffTable,
} from '../../db/drizzle/schema/tariff.js';
import { connectorTable } from '../../db/drizzle/schema/connector.js';
import { type Explicit } from '../../db/drizzle/types.js';
import { DrizzleRepository } from './base.js';
import { type ITariffRepository } from '../repositories.js';
import type { TariffQueryString } from '../../interfaces/queries/tariff.js';

// Coerces a nullable numeric (drizzle returns DECIMAL as string) to a number|null.
function toNumberOrNull(value: string | null): number | null {
  return value != null ? Number(value) : null;
}

// ─── Mapper ──────────────────────────────────────────────────────────────────
// Maps a Drizzle entity (DB row) to the external TariffDto contract.
export function toTariffDto(entity: TariffEntity): TariffDto {
  const dto: Explicit<TariffDto> = {
    id: entity.id,
    currency: entity.currency,
    // DECIMAL columns are returned as strings by drizzle numeric().
    pricePerKwh: Number(entity.pricePerKwh),
    pricePerMin: toNumberOrNull(entity.pricePerMin),
    pricePerSession: toNumberOrNull(entity.pricePerSession),
    authorizationAmount: toNumberOrNull(entity.authorizationAmount),
    paymentFee: toNumberOrNull(entity.paymentFee),
    taxRate: toNumberOrNull(entity.taxRate),
    tariffAltText: (entity.tariffAltText as Record<string, any> | null) ?? null,
    tariffId: entity.tariffId ?? null,
    // Drizzle returns timestamp as JS Date (mode: 'date'); DTO contract is ISO string.
    validFrom: entity.validFrom ? entity.validFrom.toISOString() : null,
    description: (entity.description as any[] | null) ?? null,
    energy: entity.energy ?? null,
    chargingTime: entity.chargingTime ?? null,
    idleTime: entity.idleTime ?? null,
    fixedFee: entity.fixedFee ?? null,
    reservationTime: entity.reservationTime ?? null,
    reservationFixed: entity.reservationFixed ?? null,
    minCost: entity.minCost ?? null,
    maxCost: entity.maxCost ?? null,
    tenantId: entity.tenantId,
    tenant: undefined,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
  return dto;
}

export class DrizzleTariffRepository
  extends DrizzleRepository<typeof tariffTable, TariffDto>
  implements ITariffRepository
{
  protected getTable(tenantId: number): typeof tariffTable {
    return this.useTenantSchema ? tenantTariffTable(tenantId) : tariffTable;
  }

  protected toDto(row: TariffEntity): TariffDto {
    return toTariffDto(row);
  }


  private toTariffValues(tariff: TariffDto, tenantId: number) {
    return {
      currency: tariff.currency,
      pricePerKwh: String(tariff.pricePerKwh),
      pricePerMin: tariff.pricePerMin != null ? String(tariff.pricePerMin) : null,
      pricePerSession: tariff.pricePerSession != null ? String(tariff.pricePerSession) : null,
      authorizationAmount:
        tariff.authorizationAmount != null ? String(tariff.authorizationAmount) : null,
      paymentFee: tariff.paymentFee != null ? String(tariff.paymentFee) : null,
      taxRate: tariff.taxRate != null ? String(tariff.taxRate) : null,
      tariffAltText: tariff.tariffAltText ?? null,
      tariffId: tariff.tariffId ?? null,
      validFrom: tariff.validFrom ? new Date(tariff.validFrom) : null,
      description: tariff.description ?? null,
      energy: tariff.energy ?? null,
      chargingTime: tariff.chargingTime ?? null,
      idleTime: tariff.idleTime ?? null,
      fixedFee: tariff.fixedFee ?? null,
      reservationTime: tariff.reservationTime ?? null,
      reservationFixed: tariff.reservationFixed ?? null,
      minCost: tariff.minCost ?? null,
      maxCost: tariff.maxCost ?? null,
      tenantId,
    };
  }

  async findByConnectorId(tenantId: number, connectorId: number): Promise<TariffDto | undefined> {
    // Resolve the connector's tariff FK, then read that tariff (association join).
    const rows = (await this.db
      .select({ tariffId: connectorTable.tariffId })
      .from(connectorTable)
      .where(and(eq(connectorTable.tenantId, tenantId), eq(connectorTable.id, connectorId)))
      .limit(1)) as { tariffId: number | null }[];

    const tariffId = rows[0]?.tariffId;
    if (tariffId == null) return undefined;
    return this.findById(tenantId, tariffId);
  }

  async readAllByQuerystring(tenantId: number, query: TariffQueryString): Promise<TariffDto[]> {
    const idFilter = query.id ? eq(tariffTable.id, Number(query.id)) : undefined;
    const rows = (await this.db
      .select()
      .from(tariffTable)
      .where(and(eq(tariffTable.tenantId, tenantId), idFilter))) as TariffEntity[];

    return rows.map((row) => this.toDto(row));
  }

  async deleteAllByQuerystring(tenantId: number, query: TariffQueryString): Promise<TariffDto[]> {
    if (!query.id) {
      throw new Error('Must specify at least one query parameter');
    }
    const rows = (await this.db
      .delete(tariffTable)
      .where(and(eq(tariffTable.tenantId, tenantId), eq(tariffTable.id, Number(query.id))))
      .returning()) as TariffEntity[];

    const dtos = rows.map((row) => this.toDto(row));
    if (dtos.length > 0) {
      this.emit('deleted', dtos);
    }
    return dtos;
  }

  async upsertTariff(tenantId: number, tariff: TariffDto): Promise<TariffDto> {
    // Upsert keyed on the primary key (id). Wrapped in a transaction so the read
    // and the subsequent insert/update observe a consistent snapshot.
    let saved: TariffDto | undefined;
    let exists = false;

    await this.db.transaction(async (tx) => {
      const existing =
        tariff.id != null
          ? ((await tx
              .select()
              .from(tariffTable)
              .where(and(eq(tariffTable.tenantId, tenantId), eq(tariffTable.id, tariff.id)))
              .limit(1)) as TariffEntity[])
          : [];

      exists = existing.length > 0;
      const values = this.toTariffValues(tariff, tenantId);

      if (exists) {
        const updated = (await tx
          .update(tariffTable)
          .set({ ...values, updatedAt: new Date() } as any)
          .where(eq(tariffTable.id, existing[0].id))
          .returning()) as TariffEntity[];
        if (updated[0]) saved = this.toDto(updated[0]);
      } else {
        const inserted = (await tx
          .insert(tariffTable)
          .values((tariff.id != null ? { ...values, id: tariff.id } : values) as any)
          .returning()) as TariffEntity[];
        if (inserted[0]) saved = this.toDto(inserted[0]);
      }
    });

    if (saved) {
      this.emit(exists ? 'updated' : 'created', [saved]);
    }
    return saved!;
  }

  async upsertTariffByTariffId(tenantId: number, tariff: TariffDto): Promise<TariffDto> {
    // Upsert keyed on the (tariffId, tenantId) unique index.
    let saved: TariffDto | undefined;
    let exists = false;

    await this.db.transaction(async (tx) => {
      const existing = tariff.tariffId
        ? ((await tx
            .select()
            .from(tariffTable)
            .where(
              and(eq(tariffTable.tenantId, tenantId), eq(tariffTable.tariffId, tariff.tariffId)),
            )
            .limit(1)) as TariffEntity[])
        : [];

      exists = existing.length > 0;
      const values = this.toTariffValues(tariff, tenantId);

      if (exists) {
        const updated = (await tx
          .update(tariffTable)
          .set({ ...values, updatedAt: new Date() } as any)
          .where(eq(tariffTable.id, existing[0].id))
          .returning()) as TariffEntity[];
        if (updated[0]) saved = this.toDto(updated[0]);
      } else {
        const inserted = (await tx
          .insert(tariffTable)
          .values(values as any)
          .returning()) as TariffEntity[];
        if (inserted[0]) saved = this.toDto(inserted[0]);
      }
    });

    if (saved) {
      this.emit(exists ? 'updated' : 'created', [saved]);
    }
    return saved!;
  }
}
