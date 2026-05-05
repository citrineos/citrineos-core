// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDb } from '@db/drizzle.tokens';
import {
  chargingStationSecurityInfos,
  NewChargingStationSecurityInfo,
} from '@entities/charging-station-security-info.entity';

/**
 * Per-station security material lookup. Mirrors legacy
 * `core/src/dal/repository/ChargingStationSecurityInfo.ts`.
 *
 * Used by `SignedMeterValueValidator` to find the public-key file id
 * configured for a station, then load the PEM via `FileStorage`.
 */
@Injectable()
export class ChargingStationSecurityInfoRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async findByStation(tenantId: number, stationId: string) {
    const rows = await this.db
      .select()
      .from(chargingStationSecurityInfos)
      .where(
        and(
          eq(chargingStationSecurityInfos.tenantId, tenantId),
          eq(chargingStationSecurityInfos.stationId, stationId),
        ),
      )
      .limit(1);
    return rows[0];
  }

  /**
   * Find-or-create. Returns the existing row's `publicKeyFileId` if set,
   * otherwise inserts with the supplied id and returns it.
   */
  async readOrCreate(args: {
    tenantId: number;
    stationId: string;
    publicKeyFileId: string;
  }): Promise<string | null> {
    const existing = await this.findByStation(args.tenantId, args.stationId);
    if (existing) return existing.publicKeyFileId;
    const data: NewChargingStationSecurityInfo = {
      stationId: args.stationId,
      tenantId: args.tenantId,
      publicKeyFileId: args.publicKeyFileId,
    };
    await this.db.insert(chargingStationSecurityInfos).values(data);
    return args.publicKeyFileId;
  }
}
