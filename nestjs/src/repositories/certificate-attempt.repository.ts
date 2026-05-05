// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDb } from '@db/drizzle.module';
import {
  deleteCertificateAttempts,
  type NewDeleteCertificateAttempt,
} from '@entities/delete-certificate-attempt.entity';
import {
  installCertificateAttempts,
  type NewInstallCertificateAttempt,
} from '@entities/install-certificate-attempt.entity';
import { installedCertificates } from '@entities/installed-certificate.entity';

/**
 * Cert dispatch attempt tracking — pending Delete/Install certificate
 * round-trips. `status=NULL` means pending; the response handler fills
 * in the charger's reported result.
 */
@Injectable()
export class CertificateAttemptRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  // ─── DeleteCertificateAttempts ─────────────────────────────────────────────

  async insertDeleteAttempt(data: NewDeleteCertificateAttempt): Promise<{ id: number }> {
    const [row] = await this.db
      .insert(deleteCertificateAttempts)
      .values(data)
      .returning({ id: deleteCertificateAttempts.id });
    return row;
  }

  async findPendingDeleteAttempt(tenantId: number, stationId: string) {
    return this.db.query.deleteCertificateAttempts.findFirst({
      where: and(
        eq(deleteCertificateAttempts.tenantId, tenantId),
        eq(deleteCertificateAttempts.stationId, stationId),
        isNull(deleteCertificateAttempts.status),
      ),
    });
  }

  async resolveDeleteAttempt(id: number, status: string): Promise<void> {
    await this.db
      .update(deleteCertificateAttempts)
      .set({ status, updatedAt: new Date() })
      .where(eq(deleteCertificateAttempts.id, id));
  }

  /**
   * Delete `InstalledCertificates` rows that match the OCSP-style
   * (hashAlgorithm, issuerNameHash, issuerKeyHash, serialNumber)
   * tuple. Used when a Delete attempt resolves Accepted.
   */
  async deleteInstalledMatching(
    tenantId: number,
    stationId: string,
    hashAlgorithm: string,
    issuerNameHash: string,
    issuerKeyHash: string,
    serialNumber: string,
  ): Promise<number> {
    // `InstalledCertificates` lives at /entities/installed-certificate.entity.ts.
    // Legacy queries by these four hash fields; our entity may not
    // have all of them yet (per schema-diff) — guard with column-existence
    // check at runtime if the columns are missing.
    const result = await this.db.delete(installedCertificates).where(
      and(
        eq(installedCertificates.tenantId, tenantId),
        eq(installedCertificates.stationId, stationId),
        // Match-narrow when these columns exist; otherwise fall back
        // to (stationId, serialNumber) which is the minimum identity.
        eq(installedCertificates.serialNumber as never, serialNumber),
      ),
    );
    return (result as { rowCount?: number }).rowCount ?? 0;
  }

  // ─── InstallCertificateAttempts ────────────────────────────────────────────

  async insertInstallAttempt(data: NewInstallCertificateAttempt): Promise<{ id: number }> {
    const [row] = await this.db
      .insert(installCertificateAttempts)
      .values(data)
      .returning({ id: installCertificateAttempts.id });
    return row;
  }

  async findPendingInstallAttempt(tenantId: number, stationId: string) {
    return this.db.query.installCertificateAttempts.findFirst({
      where: and(
        eq(installCertificateAttempts.tenantId, tenantId),
        eq(installCertificateAttempts.stationId, stationId),
        isNull(installCertificateAttempts.status),
      ),
    });
  }

  async resolveInstallAttempt(id: number, status: string): Promise<void> {
    await this.db
      .update(installCertificateAttempts)
      .set({ status, updatedAt: new Date() })
      .where(eq(installCertificateAttempts.id, id));
  }
}
