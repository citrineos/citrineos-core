// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { ISubscriptionRepository } from '@/dal/index.js';
import type { SubscriptionDto } from '@citrineos/base';
import { and, eq } from 'drizzle-orm';
import {
  type SubscriptionEntity,
  subscriptionTable,
  tenantSubscriptionTable,
} from '../schema/Subscription.js';
import { type Explicit } from '../types.js';
import { DrizzleRepository } from './Base.js';

// ─── Mapper ──────────────────────────────────────────────────────────────────
// Maps a Drizzle entity (DB row) to the external SubscriptionDto contract, keeping
// the ORM type contained to the DAL layer. Explicit<SubscriptionDto> forces every
// field to be consciously declared — see ../types.ts for the rationale.
export function toSubscriptionDto(entity: SubscriptionEntity): SubscriptionDto {
  const dto: Explicit<SubscriptionDto> = {
    id: entity.id,
    ocppConnectionName: entity.ocppConnectionName,
    onConnect: entity.onConnect,
    onClose: entity.onClose,
    onMessage: entity.onMessage,
    sentMessage: entity.sentMessage,
    messageRegexFilter: entity.messageRegexFilter ?? null,
    url: entity.url,
    tenantId: entity.tenantId,
    tenant: undefined,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
  return dto;
}

export class DrizzleSubscriptionRepository
  extends DrizzleRepository<typeof subscriptionTable, SubscriptionDto>
  implements ISubscriptionRepository
{
  protected getTable(tenantId: number): typeof subscriptionTable {
    return this.useTenantSchema ? tenantSubscriptionTable(tenantId) : subscriptionTable;
  }

  protected toDto(row: SubscriptionEntity): SubscriptionDto {
    return toSubscriptionDto(row);
  }

  // ─── ISubscriptionRepository methods ─────────────────────────────────────

  async create(tenantId: number, value: SubscriptionDto): Promise<SubscriptionDto> {
    // Delegates to base.insert() which handles tenantId injection and event emission.
    // Booleans default to false to match the Sequelize model column defaults.
    return this.insert(tenantId, {
      ocppConnectionName: value.ocppConnectionName,
      onConnect: value.onConnect ?? false,
      onClose: value.onClose ?? false,
      onMessage: value.onMessage ?? false,
      sentMessage: value.sentMessage ?? false,
      messageRegexFilter: value.messageRegexFilter ?? null,
      url: value.url,
    });
  }

  async readAllByStationId(
    tenantId: number,
    ocppConnectionName: string,
  ): Promise<SubscriptionDto[]> {
    const table = this.getTable(tenantId);

    const conditions = [eq(table.ocppConnectionName, ocppConnectionName)];
    if (!this.useTenantSchema) {
      conditions.push(eq(table.tenantId, tenantId));
    }

    const rows = await this.db
      .select()
      .from(table)
      .where(and(...conditions));
    return rows.map((row) => this.toDto(row as SubscriptionEntity));
  }

  async deleteByKey(tenantId: number, key: string): Promise<SubscriptionDto | undefined> {
    return this.deleteById(tenantId, Number(key));
  }
}

export default DrizzleSubscriptionRepository;
