// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDb } from '@db/drizzle.tokens';
import { remoteCommands, NewRemoteCommand } from '@entities/remote-command.entity';

/**
 * One row per CSMS-initiated CALL round-trip. Inserted by `RemoteCallsService`
 * before the CALL goes out (status='pending'); updated by the response
 * handler chain once the charger ACKs.
 */
@Injectable()
export class RemoteCommandRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async create(data: NewRemoteCommand): Promise<void> {
    await this.db.insert(remoteCommands).values(data);
  }

  async complete(args: {
    correlationId: string;
    tenantId: number;
    result: 'accepted' | 'rejected' | 'failed' | 'timeout';
    responsePayload?: Record<string, unknown>;
    reason?: string;
  }): Promise<void> {
    await this.db
      .update(remoteCommands)
      .set({
        result: args.result,
        responsePayload: args.responsePayload ?? null,
        reason: args.reason ?? null,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(remoteCommands.correlationId, args.correlationId),
          eq(remoteCommands.tenantId, args.tenantId),
        ),
      );
  }

  async findByStation(tenantId: number, stationId: string, limit = 100) {
    return this.db
      .select()
      .from(remoteCommands)
      .where(and(eq(remoteCommands.tenantId, tenantId), eq(remoteCommands.stationId, stationId)))
      .orderBy(desc(remoteCommands.requestedAt))
      .limit(limit);
  }
}
