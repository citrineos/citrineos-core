// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDb } from '@db/drizzle.tokens';
import { messageInfos, type MessageInfo, type NewMessageInfo } from '@entities/message-info.entity';

/**
 * MessageInfo persistence — the per-station list of display messages
 * the charger has reported via NotifyDisplayMessages or that the CSMS
 * has installed via SetDisplayMessage.
 *
 * The wire `id` field is unique per `(stationId, tenantId)`, so we
 * upsert on that natural key. `databaseId` is the local serial PK.
 */
@Injectable()
export class MessageInfoRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async findByStationAndDisplayId(
    tenantId: number,
    stationId: string,
    id: number,
  ): Promise<MessageInfo | undefined> {
    return this.db.query.messageInfos.findFirst({
      where: and(
        eq(messageInfos.tenantId, tenantId),
        eq(messageInfos.stationId, stationId),
        eq(messageInfos.id, id),
      ),
    });
  }

  async upsert(data: NewMessageInfo): Promise<MessageInfo> {
    if (data.id !== null && data.id !== undefined && data.stationId) {
      const existing = await this.findByStationAndDisplayId(
        data.tenantId ?? 1,
        data.stationId,
        data.id,
      );
      if (existing) {
        const [row] = await this.db
          .update(messageInfos)
          .set({ ...data, updatedAt: new Date() })
          .where(eq(messageInfos.databaseId, existing.databaseId))
          .returning();
        return row;
      }
    }
    const [row] = await this.db.insert(messageInfos).values(data).returning();
    return row;
  }

  /**
   * Mark every MessageInfo on a station inactive. Used by the
   * SetDisplayMessage / ClearDisplayMessage response handlers to invalidate
   * the local cache before re-fetching via GetDisplayMessages — mirrors
   * legacy `_messageInfoRepository.deactivateAllByStationId`.
   */
  async deactivateAllByStationId(tenantId: number, stationId: string): Promise<void> {
    await this.db
      .update(messageInfos)
      .set({ active: false, updatedAt: new Date() })
      .where(and(eq(messageInfos.tenantId, tenantId), eq(messageInfos.stationId, stationId)));
  }
}
