// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type {
  CertificateDto,
  CertificateUseEnumType,
  HashAlgorithmEnumType,
  InstalledCertificateCreate,
  InstalledCertificateDto,
} from '@citrineos/types';
import {
  type InstalledCertificateEntity,
  installedCertificateTable,
  tenantInstalledCertificateTable,
} from '../schema/InstalledCertificate.js';
import { type CertificateEntity, certificateTable } from '../schema/Certificate.js';
import { chargingStationTable } from '../schema/ChargingStation.js';
import { type Explicit } from '../types.js';
import { DrizzleRepository } from './Base.js';
import { toCertificateDto } from './Certificate.js';
import { type IInstalledCertificateRepository } from '@/dal/index.js';
import { and, eq } from 'drizzle-orm';

type InstalledCertificateHashData = Pick<
  InstalledCertificateDto,
  'hashAlgorithm' | 'issuerNameHash' | 'issuerKeyHash' | 'serialNumber'
>;
type InstalledCertificateCreateInput = Omit<InstalledCertificateCreate, 'hashAlgorithm'> & {
  hashAlgorithm?: HashAlgorithmEnumType;
  certificateId?: number | null;
};

// ─── Mapper ──────────────────────────────────────────────────────────────────
// Maps a Drizzle entity (DB row) to the external InstalledCertificateDto contract.
// Note: stationId and certificateId columns are not part of the DTO contract.
export function toInstalledCertificateDto(
  entity: InstalledCertificateEntity,
): InstalledCertificateDto {
  const dto: Explicit<InstalledCertificateDto> = {
    id: entity.id,
    ocppConnectionName: entity.ocppConnectionName,
    hashAlgorithm: entity.hashAlgorithm as HashAlgorithmEnumType,
    issuerNameHash: entity.issuerNameHash ?? null,
    issuerKeyHash: entity.issuerKeyHash ?? null,
    serialNumber: entity.serialNumber ?? null,
    certificateType: entity.certificateType as CertificateUseEnumType,
    tenantId: entity.tenantId,
    tenant: undefined,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
  return dto;
}

export class DrizzleInstalledCertificateRepository
  extends DrizzleRepository<typeof installedCertificateTable, InstalledCertificateDto>
  implements IInstalledCertificateRepository
{
  protected getTable(tenantId: number): typeof installedCertificateTable {
    return this.useTenantSchema
      ? tenantInstalledCertificateTable(tenantId)
      : installedCertificateTable;
  }

  protected toDto(row: InstalledCertificateEntity): InstalledCertificateDto {
    return toInstalledCertificateDto(row);
  }

  async findByStationAndType(
    tenantId: number,
    ocppConnectionName: string,
    certificateType: CertificateUseEnumType,
  ): Promise<InstalledCertificateDto | undefined> {
    const rows = await this.db
      .select()
      .from(installedCertificateTable)
      .where(
        and(
          eq(installedCertificateTable.tenantId, tenantId),
          eq(installedCertificateTable.ocppConnectionName, ocppConnectionName),
          eq(installedCertificateTable.certificateType, certificateType),
        ),
      )
      .limit(1);

    return rows[0] ? this.toDto(rows[0]) : undefined;
  }

  async findByIdAndStation(
    tenantId: number,
    id: number,
    ocppConnectionName: string,
  ): Promise<InstalledCertificateDto | undefined> {
    const rows = await this.db
      .select()
      .from(installedCertificateTable)
      .where(
        and(
          eq(installedCertificateTable.tenantId, tenantId),
          eq(installedCertificateTable.id, id),
          eq(installedCertificateTable.ocppConnectionName, ocppConnectionName),
        ),
      )
      .limit(1);

    return rows[0] ? this.toDto(rows[0]) : undefined;
  }

  async getLinkedCertificate(
    tenantId: number,
    installedCertificateId: number,
  ): Promise<CertificateDto | undefined> {
    // certificateId isn't part of the InstalledCertificateDto, so read the FK column directly.
    const installedRows = await this.db
      .select({ certificateId: installedCertificateTable.certificateId })
      .from(installedCertificateTable)
      .where(
        and(
          eq(installedCertificateTable.id, installedCertificateId),
          eq(installedCertificateTable.tenantId, tenantId),
        ),
      )
      .limit(1);

    const certificateId = installedRows[0]?.certificateId;
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

  async createInstalledCertificate(
    tenantId: number,
    input: InstalledCertificateCreateInput,
  ): Promise<InstalledCertificateDto> {
    // Resolve stationId from ocppConnectionName + tenantId (replaces the old @BeforeCreate hook).
    const stationId = await this.resolveStationId(tenantId, input.ocppConnectionName);
    return await this.insert(tenantId, { ...input, stationId });
  }

  async setCertificateId(
    tenantId: number,
    id: number,
    certificateId: number,
  ): Promise<InstalledCertificateDto | undefined> {
    return await this.updateById(tenantId, id, { certificateId });
  }

  async updateHashData(
    tenantId: number,
    id: number,
    hashData: InstalledCertificateHashData,
  ): Promise<InstalledCertificateDto | undefined> {
    return await this.updateById(tenantId, id, {
      hashAlgorithm: hashData.hashAlgorithm,
      issuerNameHash: hashData.issuerNameHash,
      issuerKeyHash: hashData.issuerKeyHash,
      serialNumber: hashData.serialNumber,
    });
  }

  async findAllByStation(
    tenantId: number,
    ocppConnectionName: string,
  ): Promise<InstalledCertificateDto[]> {
    const rows = (await this.db
      .select()
      .from(installedCertificateTable)
      .where(
        and(
          eq(installedCertificateTable.tenantId, tenantId),
          eq(installedCertificateTable.ocppConnectionName, ocppConnectionName),
        ),
      )) as InstalledCertificateEntity[];

    return rows.map((row) => this.toDto(row));
  }

  async deleteByStation(
    tenantId: number,
    ocppConnectionName: string,
  ): Promise<InstalledCertificateDto[]> {
    return await this.deleteWhere(
      and(
        eq(installedCertificateTable.tenantId, tenantId),
        eq(installedCertificateTable.ocppConnectionName, ocppConnectionName),
      ),
    );
  }

  async deleteByStationAndType(
    tenantId: number,
    ocppConnectionName: string,
    certificateType: CertificateUseEnumType,
  ): Promise<InstalledCertificateDto[]> {
    return await this.deleteWhere(
      and(
        eq(installedCertificateTable.tenantId, tenantId),
        eq(installedCertificateTable.ocppConnectionName, ocppConnectionName),
        eq(installedCertificateTable.certificateType, certificateType),
      ),
    );
  }

  async deleteByStationAndHashData(
    tenantId: number,
    ocppConnectionName: string,
    hashData: InstalledCertificateHashData,
  ): Promise<InstalledCertificateDto[]> {
    return await this.deleteWhere(
      and(
        eq(installedCertificateTable.tenantId, tenantId),
        eq(installedCertificateTable.ocppConnectionName, ocppConnectionName),
        eq(installedCertificateTable.hashAlgorithm, hashData.hashAlgorithm),
        eq(installedCertificateTable.issuerNameHash, hashData.issuerNameHash ?? ''),
        eq(installedCertificateTable.issuerKeyHash, hashData.issuerKeyHash ?? ''),
        eq(installedCertificateTable.serialNumber, hashData.serialNumber ?? ''),
      ),
    );
  }

  private async deleteWhere(where: ReturnType<typeof and>): Promise<InstalledCertificateDto[]> {
    const rows = (await this.db
      .delete(installedCertificateTable)
      .where(where)
      .returning()) as InstalledCertificateEntity[];

    const dtos = rows.map((row) => this.toDto(row));
    if (dtos.length > 0) {
      this.emit('deleted', dtos);
    }
    return dtos;
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
