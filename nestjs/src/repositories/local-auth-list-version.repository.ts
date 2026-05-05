// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDb } from '@db/drizzle.tokens';
import {
  localAuthListVersions,
  NewLocalAuthListVersion,
} from '@entities/local-auth-list-version.entity';

/**
 * Per-station local-auth-list version tracking. Mirrors legacy
 * `core/src/dal/repository/LocalAuthListVersion.ts`.
 *
 * Used by the EVDriver SendLocalList / GetLocalListVersion flow:
 *   - SendLocalList REST → records the new version on success
 *   - GetLocalListVersion REST → reads the cached version (no charger
 *     round-trip required for the simple case; the actual list contents
 *     live in the operator's authorization repository)
 */
@Injectable()
export class LocalAuthListVersionRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async findByStation(tenantId: number, stationId: string) {
    const rows = await this.db
      .select()
      .from(localAuthListVersions)
      .where(
        and(
          eq(localAuthListVersions.tenantId, tenantId),
          eq(localAuthListVersions.stationId, stationId),
        ),
      )
      .limit(1);
    return rows[0];
  }

  async upsertVersion(data: NewLocalAuthListVersion): Promise<void> {
    await this.db
      .insert(localAuthListVersions)
      .values(data)
      .onConflictDoUpdate({
        target: [localAuthListVersions.stationId, localAuthListVersions.tenantId],
        set: { versionNumber: data.versionNumber, updatedAt: new Date() },
      });
  }
}
