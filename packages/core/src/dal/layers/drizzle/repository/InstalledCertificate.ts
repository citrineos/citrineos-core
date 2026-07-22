// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type {
  BootstrapConfig,
  CertificateUseEnumType,
  HashAlgorithmEnumType,
  InstalledCertificateDto,
} from '@citrineos/base';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import {
  type InstalledCertificateEntity,
  installedCertificateTable,
  tenantInstalledCertificateTable,
} from '../schema/InstalledCertificate.js';
import { type Explicit } from '../types.js';
import { DrizzleRepository } from './Base.js';

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

export class DrizzleInstalledCertificateRepository extends DrizzleRepository<
  typeof installedCertificateTable,
  InstalledCertificateDto
> {
  constructor(
    config: BootstrapConfig,
    logger?: Logger<ILogObj>,
    db?: NodePgDatabase,
    useTenantSchema = false,
  ) {
    super(config, logger, db, useTenantSchema);
  }

  protected getTable(tenantId: number): typeof installedCertificateTable {
    return this.useTenantSchema
      ? tenantInstalledCertificateTable(tenantId)
      : installedCertificateTable;
  }

  protected toDto(row: InstalledCertificateEntity): InstalledCertificateDto {
    return toInstalledCertificateDto(row);
  }

  // Domain query/write methods intentionally omitted — stub outline only.
}
