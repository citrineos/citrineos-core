import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DrizzleDb, DRIZZLE } from '@db/drizzle.module';
import { meterValues, NewMeterValueRow } from '@entities/meter-value.entity';

/**
 * Drizzle-backed repository for the MeterValue entity.
 * Centralises every read/write path for this table so handlers and
 * services don’t reach for the Drizzle client directly.
 */
@Injectable()
export class MeterValueRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async insert(data: NewMeterValueRow) {
    await this.db.insert(meterValues).values(data);
  }

  async findByTransaction(tenantId: number, transactionId: string) {
    return this.db
      .select()
      .from(meterValues)
      .where(and(eq(meterValues.transactionId, transactionId), eq(meterValues.tenantId, tenantId)));
  }
}
