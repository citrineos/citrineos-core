// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { SendLocalListDto } from '@citrineos/types';
import {
  type SendLocalListEntity,
  sendLocalListTable,
  tenantSendLocalListTable,
} from '../../db/drizzle/schema/send-local-list.js';
import { type Explicit } from '../../db/drizzle/types.js';
import { DrizzleRepository } from './base.js';

// ─── Mapper ──────────────────────────────────────────────────────────────────
// Maps a Drizzle entity (DB row) to the external SendLocalListDto contract.
export function toSendLocalListDto(entity: SendLocalListEntity): SendLocalListDto {
  const dto: Explicit<SendLocalListDto> = {
    id: entity.id,
    ocppConnectionName: entity.ocppConnectionName ?? '',
    correlationId: entity.correlationId ?? '',
    versionNumber: entity.versionNumber ?? 0,
    updateType: entity.updateType ?? '',
    // Relation, not a scalar column.
    localAuthorizationList: undefined,
    // customData is not persisted as a column.
    customData: undefined,
    tenantId: entity.tenantId,
    tenant: undefined,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
  return dto;
}

export class DrizzleSendLocalListRepository extends DrizzleRepository<
  typeof sendLocalListTable,
  SendLocalListDto
> {
  protected getTable(tenantId: number): typeof sendLocalListTable {
    return this.useTenantSchema ? tenantSendLocalListTable(tenantId) : sendLocalListTable;
  }

  protected toDto(row: SendLocalListEntity): SendLocalListDto {
    return toSendLocalListDto(row);
  }

  // Domain query/write methods intentionally omitted — stub outline only.
}
