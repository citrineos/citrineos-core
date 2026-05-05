import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DrizzleDb, DRIZZLE } from '@db/drizzle.module';
import { securityEvents } from '@entities/security-event.entity';

export interface CreateSecurityEventDto {
  stationId: string;
  type: string;
  timestamp: string;
  techInfo?: string | null;
  tenantId: number;
}

/**
 * Drizzle-backed repository for the SecurityEvent entity.
 * Centralises every read/write path for this table so handlers and
 * services don’t reach for the Drizzle client directly.
 */
@Injectable()
export class SecurityEventRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async create(data: CreateSecurityEventDto): Promise<void> {
    await this.db.insert(securityEvents).values({
      stationId: data.stationId,
      type: data.type,
      timestamp: new Date(data.timestamp),
      techInfo: data.techInfo ?? null,
      tenantId: data.tenantId,
    });
  }

  async findByStationId(stationId: string) {
    return this.db.select().from(securityEvents).where(eq(securityEvents.stationId, stationId));
  }

  async findAll() {
    return this.db.select().from(securityEvents);
  }
}
