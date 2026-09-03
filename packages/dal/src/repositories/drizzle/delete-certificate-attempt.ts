// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type {
  DeleteCertificateAttemptCreate,
  DeleteCertificateAttemptDto,
  DeleteCertificateStatusEnumType,
  HashAlgorithmEnumType,
} from '@citrineos/types';
import {
  type DeleteCertificateAttemptEntity,
  deleteCertificateAttemptTable,
  tenantDeleteCertificateAttemptTable,
} from '../../db/drizzle/schema/delete-certificate-attempt.js';
import { chargingStationTable } from '../../db/drizzle/schema/charging-station.js';
import { type Explicit } from '../../db/drizzle/types.js';
import { DrizzleRepository } from './base.js';
import { type IDeleteCertificateAttemptRepository } from '../../../index.js';
import { and, eq, isNull } from 'drizzle-orm';

type DeleteCertificateHashData = Pick<
  DeleteCertificateAttemptDto,
  'hashAlgorithm' | 'issuerNameHash' | 'issuerKeyHash' | 'serialNumber'
>;

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

export class DrizzleDeleteCertificateAttemptRepository
  extends DrizzleRepository<typeof deleteCertificateAttemptTable, DeleteCertificateAttemptDto>
  implements IDeleteCertificateAttemptRepository
{
  protected getTable(tenantId: number): typeof deleteCertificateAttemptTable {
    return this.useTenantSchema
      ? tenantDeleteCertificateAttemptTable(tenantId)
      : deleteCertificateAttemptTable;
  }

  protected toDto(row: DeleteCertificateAttemptEntity): DeleteCertificateAttemptDto {
    return toDeleteCertificateAttemptDto(row);
  }

  async findPendingByStationAndHashData(
    tenantId: number,
    ocppConnectionName: string,
    hashData: DeleteCertificateHashData,
  ): Promise<DeleteCertificateAttemptDto | undefined> {
    const rows = await this.db
      .select()
      .from(deleteCertificateAttemptTable)
      .where(
        and(
          eq(deleteCertificateAttemptTable.tenantId, tenantId),
          eq(deleteCertificateAttemptTable.ocppConnectionName, ocppConnectionName),
          eq(deleteCertificateAttemptTable.hashAlgorithm, hashData.hashAlgorithm),
          eq(deleteCertificateAttemptTable.issuerNameHash, hashData.issuerNameHash ?? ''),
          eq(deleteCertificateAttemptTable.issuerKeyHash, hashData.issuerKeyHash ?? ''),
          eq(deleteCertificateAttemptTable.serialNumber, hashData.serialNumber ?? ''),
          isNull(deleteCertificateAttemptTable.status),
        ),
      )
      .limit(1);

    return rows[0] ? this.toDto(rows[0]) : undefined;
  }

  async findPendingByStation(
    tenantId: number,
    ocppConnectionName: string,
  ): Promise<DeleteCertificateAttemptDto | undefined> {
    const rows = await this.db
      .select()
      .from(deleteCertificateAttemptTable)
      .where(
        and(
          eq(deleteCertificateAttemptTable.tenantId, tenantId),
          eq(deleteCertificateAttemptTable.ocppConnectionName, ocppConnectionName),
          isNull(deleteCertificateAttemptTable.status),
        ),
      )
      .limit(1);

    return rows[0] ? this.toDto(rows[0]) : undefined;
  }

  async createAttempt(
    tenantId: number,
    input: DeleteCertificateAttemptCreate,
  ): Promise<DeleteCertificateAttemptDto> {
    const stationId =
      input.stationId ?? (await this.resolveStationId(tenantId, input.ocppConnectionName));
    // Base insert spreads { ...values, tenantId } and emits 'created'.
    return await this.insert(tenantId, { ...input, stationId });
  }

  async updateStatus(
    tenantId: number,
    id: number,
    status: DeleteCertificateStatusEnumType,
  ): Promise<DeleteCertificateAttemptDto | undefined> {
    return await this.updateById(tenantId, id, { status });
  }

  private async resolveStationId(
    tenantId: number,
    ocppConnectionName: string,
  ): Promise<number | null> {
    const rows = await this.db
      .select({ id: chargingStationTable.id })
      .from(chargingStationTable)
      .where(
        and(
          eq(chargingStationTable.ocppConnectionName, ocppConnectionName),
          eq(chargingStationTable.tenantId, tenantId),
        ),
      )
      .limit(1);

    return rows[0]?.id ?? null;
  }
}
