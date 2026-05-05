import { Inject, Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { sql } from 'drizzle-orm';
import { DrizzleDb, DRIZZLE } from '@db/drizzle.module';

/**
 * Terminus health indicator surfaced through the /health endpoint.
 * Returns "up"/"down" plus structured details so operator probes can
 * distinguish between subsystems.
 */
@Injectable()
export class DrizzleHealthIndicator extends HealthIndicator {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.db.execute(sql`SELECT 1`);
      return this.getStatus(key, true);
    } catch (err) {
      return this.getStatus(key, false, { message: (err as Error).message });
    }
  }
}
