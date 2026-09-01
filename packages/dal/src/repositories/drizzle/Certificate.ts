// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type {
  CertificateCreate,
  CertificateDto,
  CountryName,
  SignatureAlgorithm,
} from '@citrineos/types';
import {
  type CertificateEntity,
  certificateTable,
  tenantCertificateTable,
} from '../../db/drizzle/schema/Certificate.js';
import { type Explicit } from '../../db/drizzle/types.js';
import { DrizzleRepository } from './Base.js';
import { type ICertificateRepository } from '../../../index.js';
import { and, eq } from 'drizzle-orm';

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

// Required to convert the DTO's ISO-string validBefore back into a JS Date, since
// the Drizzle column is timestamp mode: 'date'.
function toCertificateEntity(value: object): CertificateEntity {
  const v = value as { validBefore?: string | Date | null };
  if (typeof v.validBefore === 'string') {
    return { ...value, validBefore: new Date(v.validBefore) } as CertificateEntity;
  }
  return value as CertificateEntity;
}

export class DrizzleCertificateRepository
  extends DrizzleRepository<typeof certificateTable, CertificateDto>
  implements ICertificateRepository
{
  protected getTable(tenantId: number): typeof certificateTable {
    return this.useTenantSchema ? tenantCertificateTable(tenantId) : certificateTable;
  }

  protected toDto(row: CertificateEntity): CertificateDto {
    return toCertificateDto(row);
  }

  async findByFileHash(tenantId: number, hash: string): Promise<CertificateDto | undefined> {
    const rows = await this.db
      .select()
      .from(certificateTable)
      .where(
        and(
          eq(certificateTable.tenantId, tenantId),
          eq(certificateTable.certificateFileHash, hash),
        ),
      )
      .limit(1);

    return rows[0] ? this.toDto(rows[0]) : undefined;
  }

  async createCertificate(tenantId: number, input: CertificateCreate): Promise<CertificateDto> {
    // Base insert spreads { ...values, tenantId } and emits 'created'.
    return await this.insert(tenantId, toCertificateEntity(input));
  }

  async createOrUpdateCertificate(
    tenantId: number,
    input: CertificateCreate,
  ): Promise<CertificateDto> {
    let savedCertificate: CertificateDto | undefined;
    let certificateExists = false;

    await this.db.transaction(async (tx) => {
      const existing = await tx
        .select({ id: certificateTable.id })
        .from(certificateTable)
        .where(
          and(
            eq(certificateTable.tenantId, tenantId),
            eq(certificateTable.serialNumber, input.serialNumber),
            eq(certificateTable.issuerName, input.issuerName),
          ),
        )
        .limit(1);

      certificateExists = existing.length > 0;

      const entityToSave = toCertificateEntity({ ...input, tenantId });

      if (certificateExists) {
        const rows = (await tx
          .update(certificateTable)
          .set(entityToSave)
          .where(
            and(
              eq(certificateTable.tenantId, tenantId),
              eq(certificateTable.serialNumber, input.serialNumber),
              eq(certificateTable.issuerName, input.issuerName),
            ),
          )
          .returning()) as CertificateEntity[];

        savedCertificate = rows[0] ? this.toDto(rows[0]) : undefined;
      } else {
        const rows = (await tx
          .insert(certificateTable)
          .values(entityToSave)
          .returning()) as CertificateEntity[];

        savedCertificate = this.toDto(rows[0]);
      }
    });

    if (savedCertificate) {
      this.emit(certificateExists ? 'updated' : 'created', [savedCertificate]);
    }

    return savedCertificate!;
  }
}
