// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { TenantPartnerDto } from '@citrineos/types';
import {
  type TenantPartnerEntity,
  tenantPartnerTable,
  tenantTenantPartnerTable,
} from '../../db/drizzle/schema/tenant-partner.js';
import { type Explicit } from '../../db/drizzle/types.js';
import { DrizzleRepository } from './base.js';

// ─── Mapper ──────────────────────────────────────────────────────────────────
// Maps a Drizzle entity (DB row) to the external TenantPartnerDto contract.
export function toTenantPartnerDto(entity: TenantPartnerEntity): TenantPartnerDto {
  const dto: Explicit<TenantPartnerDto> = {
    id: entity.id,
    countryCode: entity.countryCode ?? null,
    partyId: entity.partyId ?? null,
    partnerProfileOCPI: entity.partnerProfileOCPI as TenantPartnerDto['partnerProfileOCPI'],
    tenantId: entity.tenantId,
    tenant: undefined,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
  return dto;
}

export class DrizzleTenantPartnerRepository extends DrizzleRepository<
  typeof tenantPartnerTable,
  TenantPartnerDto
> {
  protected getTable(tenantId: number): typeof tenantPartnerTable {
    return this.useTenantSchema ? tenantTenantPartnerTable(tenantId) : tenantPartnerTable;
  }

  protected toDto(row: TenantPartnerEntity): TenantPartnerDto {
    return toTenantPartnerDto(row);
  }

  // Domain query/write methods intentionally omitted — stub outline only.
}
