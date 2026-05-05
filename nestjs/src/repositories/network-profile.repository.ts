// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDb } from '@db/drizzle.module';
import {
  chargingStationNetworkProfiles,
  type NewChargingStationNetworkProfile,
} from '@entities/charging-station-network-profile.entity';
import {
  setNetworkProfiles,
  type NewSetNetworkProfile,
} from '@entities/set-network-profile.entity';

/**
 * SetNetworkProfile + ChargingStationNetworkProfile persistence.
 *
 * `SetNetworkProfile` is the dispatch row created by the CSMS request
 * (carrying the proposed config). `ChargingStationNetworkProfile` is the
 * upsert row promoted on the response when the charger Accepts —
 * keyed by `(stationId, configurationSlot)`.
 */
@Injectable()
export class NetworkProfileRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async insertDispatch(data: NewSetNetworkProfile): Promise<{ id: number }> {
    const [row] = await this.db
      .insert(setNetworkProfiles)
      .values(data)
      .returning({ id: setNetworkProfiles.id });
    return row;
  }

  async findDispatchByCorrelationId(tenantId: number, correlationId: string) {
    return this.db.query.setNetworkProfiles.findFirst({
      where: and(
        eq(setNetworkProfiles.tenantId, tenantId),
        eq(setNetworkProfiles.correlationId, correlationId),
      ),
    });
  }

  async upsertActive(data: NewChargingStationNetworkProfile): Promise<void> {
    await this.db
      .insert(chargingStationNetworkProfiles)
      .values(data)
      .onConflictDoUpdate({
        target: [
          chargingStationNetworkProfiles.stationId,
          chargingStationNetworkProfiles.configurationSlot,
          chargingStationNetworkProfiles.tenantId,
        ],
        set: {
          setNetworkProfileId: data.setNetworkProfileId,
          websocketServerConfigId: data.websocketServerConfigId,
          updatedAt: new Date(),
        },
      });
  }
}
