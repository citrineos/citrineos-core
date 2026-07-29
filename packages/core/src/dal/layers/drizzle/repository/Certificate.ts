// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type {
  BootstrapConfig,
  CertificateDto,
  CountryName,
  SignatureAlgorithm,
} from '@citrineos/base';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import {
  type CertificateEntity,
  certificateTable,
  tenantCertificateTable,
} from '../schema/Certificate.js';
import { type Explicit } from '../types.js';
import { DrizzleRepository } from './Base.js';

// ─── Mapper ──────────────────────────────────────────────────────────────────
// Maps a Drizzle entity (DB row) to the external CertificateDto contract.
export function toCertificateDto(entity: CertificateEntity): CertificateDto {
  const dto: Explicit<CertificateDto> = {
    id: entity.id,
    serialNumber: entity.serialNumber ?? 0,
    issuerName: entity.issuerName ?? '',
    organizationName: entity.organizationName ?? '',
    commonName: entity.commonName ?? '',
    keyLength: entity.keyLength ?? null,
    // Drizzle returns timestamp as JS Date (mode: 'date'); DTO contract is ISO string.
    validBefore: entity.validBefore ? entity.validBefore.toISOString() : null,
    signatureAlgorithm: (entity.signatureAlgorithm as SignatureAlgorithm | null) ?? null,
    countryName: (entity.countryName as CountryName | null) ?? null,
    isCA: entity.isCA ?? undefined,
    pathLen: entity.pathLen ?? null,
    certificateFileId: entity.certificateFileId ?? null,
    certificateFileHash: entity.certificateFileHash ?? null,
    privateKeyFileId: entity.privateKeyFileId ?? null,
    signedBy: entity.signedBy ?? null,
    tenantId: entity.tenantId,
    tenant: undefined,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
  return dto;
}

export class DrizzleCertificateRepository extends DrizzleRepository<
  typeof certificateTable,
  CertificateDto
> {
  constructor(
    config: BootstrapConfig,
    logger?: Logger<ILogObj>,
    db?: NodePgDatabase,
    useTenantSchema = false,
  ) {
    super(config, logger, db, useTenantSchema);
  }

  protected getTable(tenantId: number): typeof certificateTable {
    return this.useTenantSchema ? tenantCertificateTable(tenantId) : certificateTable;
  }

  protected toDto(row: CertificateEntity): CertificateDto {
    return toCertificateDto(row);
  }

  // Domain query/write methods intentionally omitted — stub outline only.
}
