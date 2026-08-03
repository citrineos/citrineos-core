// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type {
  DeleteCertificateAttemptDto,
  DeleteCertificateStatusEnumType,
  HashAlgorithmEnumType,
} from '@citrineos/types';
import {
  type DeleteCertificateAttemptEntity,
  deleteCertificateAttemptTable,
  tenantDeleteCertificateAttemptTable,
} from '../schema/DeleteCertificateAttempt.js';
import { type Explicit } from '../types.js';
import { DrizzleRepository } from './Base.js';

// ─── Mapper ──────────────────────────────────────────────────────────────────
// Maps a Drizzle entity (DB row) to the external DeleteCertificateAttemptDto contract.
export function toDeleteCertificateAttemptDto(
  entity: DeleteCertificateAttemptEntity,
): DeleteCertificateAttemptDto {
  const dto: Explicit<DeleteCertificateAttemptDto> = {
    id: entity.id,
    stationId: entity.stationId ?? null,
    ocppConnectionName: entity.ocppConnectionName,
    hashAlgorithm: entity.hashAlgorithm as HashAlgorithmEnumType,
    issuerNameHash: entity.issuerNameHash ?? null,
    issuerKeyHash: entity.issuerKeyHash ?? null,
    serialNumber: entity.serialNumber ?? null,
    status: (entity.status as DeleteCertificateStatusEnumType | null) ?? null,
    tenantId: entity.tenantId,
    tenant: undefined,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
  return dto;
}

export class DrizzleDeleteCertificateAttemptRepository extends DrizzleRepository<
  typeof deleteCertificateAttemptTable,
  DeleteCertificateAttemptDto
> {
  protected getTable(tenantId: number): typeof deleteCertificateAttemptTable {
    return this.useTenantSchema
      ? tenantDeleteCertificateAttemptTable(tenantId)
      : deleteCertificateAttemptTable;
  }

  protected toDto(row: DeleteCertificateAttemptEntity): DeleteCertificateAttemptDto {
    return toDeleteCertificateAttemptDto(row);
  }

  // Domain query/write methods intentionally omitted — stub outline only.
}
