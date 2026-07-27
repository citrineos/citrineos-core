// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { CertificateUseEnumType, InstallCertificateAttemptDto, InstallCertificateStatusEnumType } from '@citrineos/types';
import {
  type InstallCertificateAttemptEntity,
  installCertificateAttemptTable,
  tenantInstallCertificateAttemptTable,
} from '../schema/InstallCertificateAttempt.js';
import { type Explicit } from '../types.js';
import { DrizzleRepository } from './Base.js';

// ─── Mapper ──────────────────────────────────────────────────────────────────
// Maps a Drizzle entity (DB row) to the external InstallCertificateAttemptDto contract.
export function toInstallCertificateAttemptDto(
  entity: InstallCertificateAttemptEntity,
): InstallCertificateAttemptDto {
  const dto: Explicit<InstallCertificateAttemptDto> = {
    id: entity.id,
    stationId: entity.stationId ?? null,
    ocppConnectionName: entity.ocppConnectionName,
    certificateType: entity.certificateType as CertificateUseEnumType,
    certificateId: entity.certificateId ?? null,
    requestId: entity.requestId ?? null,
    status: (entity.status as InstallCertificateStatusEnumType | null) ?? null,
    tenantId: entity.tenantId,
    tenant: undefined,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
  return dto;
}

export class DrizzleInstallCertificateAttemptRepository extends DrizzleRepository<
  typeof installCertificateAttemptTable,
  InstallCertificateAttemptDto
> {
  protected getTable(tenantId: number): typeof installCertificateAttemptTable {
    return this.useTenantSchema
      ? tenantInstallCertificateAttemptTable(tenantId)
      : installCertificateAttemptTable;
  }

  protected toDto(row: InstallCertificateAttemptEntity): InstallCertificateAttemptDto {
    return toInstallCertificateAttemptDto(row);
  }

  // Domain query/write methods intentionally omitted — stub outline only.
}
