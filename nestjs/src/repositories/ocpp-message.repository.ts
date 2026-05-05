// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Inject, Injectable } from '@nestjs/common';
import { eq, and, desc, gte, type SQL } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDb } from '@db/drizzle.tokens';
import { ocppMessages, NewOcppMessageRow } from '@entities/ocpp-message.entity';

/**
 * Persists every OCPP frame (Call/CallResult/CallError) for audit purposes.
 * Mirrors legacy `core/src/dal/layers/sequelize/model/OCPPMessage.ts`.
 *
 * Origin values match the legacy `MessageOrigin` enum: `cs` (charger sent) or
 * `csms` (CSMS sent — i.e. CSMS-initiated CALL or response to a charger CALL).
 */
@Injectable()
export class OcppMessageRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async create(data: NewOcppMessageRow): Promise<void> {
    await this.db.insert(ocppMessages).values(data);
  }

  async findByCorrelationId(tenantId: number, correlationId: string) {
    return this.db.query.ocppMessages.findMany({
      where: and(
        eq(ocppMessages.correlationId, correlationId),
        eq(ocppMessages.tenantId, tenantId),
      ),
      orderBy: [desc(ocppMessages.createdAt)],
    });
  }

  /**
   * Filtered station query — used by the REST endpoint. All filter fields
   * are optional and AND together. Results are sorted newest-first and
   * capped at `limit`.
   */
  async findByStation(
    tenantId: number,
    stationId: string,
    opts: { action?: string; state?: string; since?: Date; limit?: number } = {},
  ) {
    const conditions: SQL[] = [
      eq(ocppMessages.stationId, stationId),
      eq(ocppMessages.tenantId, tenantId),
    ];
    if (opts.action) conditions.push(eq(ocppMessages.action, opts.action));
    if (opts.state !== undefined) conditions.push(eq(ocppMessages.state, opts.state));
    if (opts.since) conditions.push(gte(ocppMessages.createdAt, opts.since));

    return this.db
      .select()
      .from(ocppMessages)
      .where(and(...conditions))
      .orderBy(desc(ocppMessages.createdAt))
      .limit(opts.limit ?? 100);
  }
}
