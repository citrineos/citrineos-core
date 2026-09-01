// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type {
  CertificateDto,
  CertificateUseEnumType,
  InstallCertificateAttemptCreate,
  InstallCertificateAttemptDto,
  InstallCertificateStatusEnumType,
} from '@citrineos/types';
import {
  type InstallCertificateAttemptEntity,
  installCertificateAttemptTable,
  tenantInstallCertificateAttemptTable,
} from '../../db/drizzle/schema/InstallCertificateAttempt.js';
import { type CertificateEntity, certificateTable } from '../../db/drizzle/schema/Certificate.js';
import { chargingStationTable } from '../../db/drizzle/schema/ChargingStation.js';
import { type Explicit } from '../../db/drizzle/types.js';
import { DrizzleRepository } from './Base.js';
import { toCertificateDto } from './Certificate.js';
import { type IInstallCertificateAttemptRepository } from '../../../index.js';
import { and, eq, isNull } from 'drizzle-orm';

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

export class DrizzleInstallCertificateAttemptRepository
  extends DrizzleRepository<typeof installCertificateAttemptTable, InstallCertificateAttemptDto>
  implements IInstallCertificateAttemptRepository
{
  protected getTable(tenantId: number): typeof installCertificateAttemptTable {
    return this.useTenantSchema
      ? tenantInstallCertificateAttemptTable(tenantId)
      : installCertificateAttemptTable;
  }

  protected toDto(row: InstallCertificateAttemptEntity): InstallCertificateAttemptDto {
    return toInstallCertificateAttemptDto(row);
  }

  async findPendingByStationTypeAndCertHash(
    tenantId: number,
    ocppConnectionName: string,
    certificateType: CertificateUseEnumType,
    certificateFileHash: string,
    requestId?: number | null,
  ): Promise<InstallCertificateAttemptDto | undefined> {
    // Filter attempts by their linked certificate's file hash (Drizzle has no lazy `include`,
    // so this is an explicit inner join on the FK).
    const rows = (await this.db
      .select({ attempt: installCertificateAttemptTable })
      .from(installCertificateAttemptTable as any)
      .innerJoin(
        certificateTable as any,
        eq(installCertificateAttemptTable.certificateId, certificateTable.id),
      )
      .where(
        and(
          eq(installCertificateAttemptTable.tenantId, tenantId),
          eq(installCertificateAttemptTable.ocppConnectionName, ocppConnectionName),
          eq(installCertificateAttemptTable.certificateType, certificateType),
          isNull(installCertificateAttemptTable.status),
          eq(certificateTable.certificateFileHash, certificateFileHash),
          requestId != null ? eq(installCertificateAttemptTable.requestId, requestId) : undefined,
        ),
      )
      .limit(1)) as { attempt: InstallCertificateAttemptEntity }[];

    return rows[0] ? this.toDto(rows[0].attempt) : undefined;
  }

  async findPendingByStation(
    tenantId: number,
    ocppConnectionName: string,
    requestId?: number | null,
    certificateType?: CertificateUseEnumType,
  ): Promise<InstallCertificateAttemptDto | undefined> {
    const rows = await this.db
      .select()
      .from(installCertificateAttemptTable)
      .where(
        and(
          eq(installCertificateAttemptTable.tenantId, tenantId),
          eq(installCertificateAttemptTable.ocppConnectionName, ocppConnectionName),
          isNull(installCertificateAttemptTable.status),
          requestId != null ? eq(installCertificateAttemptTable.requestId, requestId) : undefined,
          certificateType != null
            ? eq(installCertificateAttemptTable.certificateType, certificateType)
            : undefined,
        ),
      )
      .limit(1);

    return rows[0] ? this.toDto(rows[0]) : undefined;
  }

  async createAttempt(
    tenantId: number,
    input: InstallCertificateAttemptCreate,
  ): Promise<InstallCertificateAttemptDto> {
    // Resolve stationId from ocppConnectionName + tenantId when the caller doesn't supply it.
    const stationId =
      input.stationId ?? (await this.resolveStationId(tenantId, input.ocppConnectionName));
    // Base insert spreads { ...values, tenantId } and emits 'created'.
    return await this.insert(tenantId, { ...input, stationId });
  }

  async updateStatus(
    tenantId: number,
    id: number,
    status: InstallCertificateStatusEnumType,
  ): Promise<InstallCertificateAttemptDto | undefined> {
    return await this.updateById(tenantId, id, { status });
  }

  async getLinkedCertificate(
    tenantId: number,
    attemptId: number,
  ): Promise<CertificateDto | undefined> {
    const attemptRows = await this.db
      .select({ certificateId: installCertificateAttemptTable.certificateId })
      .from(installCertificateAttemptTable)
      .where(
        and(
          eq(installCertificateAttemptTable.id, attemptId),
          eq(installCertificateAttemptTable.tenantId, tenantId),
        ),
      )
      .limit(1);

    const certificateId = attemptRows[0]?.certificateId;
    if (certificateId == null) {
      return undefined;
    }

    const certRows = (await this.db
      .select()
      .from(certificateTable)
      .where(and(eq(certificateTable.id, certificateId), eq(certificateTable.tenantId, tenantId)))
      .limit(1)) as CertificateEntity[];

    return certRows[0] ? toCertificateDto(certRows[0]) : undefined;
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
