import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DrizzleDb, DRIZZLE } from '@db/drizzle.module';
import { eventData, NewEventData } from '@entities/event-data.entity';

/**
 * Drizzle-backed repository for the EventData entity.
 * Centralises every read/write path for this table so handlers and
 * services don’t reach for the Drizzle client directly.
 */
@Injectable()
export class EventDataRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async insert(data: NewEventData) {
    await this.db.insert(eventData).values(data);
  }

  async findByStation(tenantId: number, stationId: string) {
    return this.db
      .select()
      .from(eventData)
      .where(and(eq(eventData.stationId, stationId), eq(eventData.tenantId, tenantId)));
  }
}
