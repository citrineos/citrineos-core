import { Inject, Injectable } from '@nestjs/common';
import { DrizzleDb, DRIZZLE } from '@db/drizzle.module';
import {
  statusNotifications,
  NewStatusNotificationRow,
} from '@entities/status-notification.entity';

/**
 * Drizzle-backed repository for the StatusNotification entity.
 * Centralises every read/write path for this table so handlers and
 * services don’t reach for the Drizzle client directly.
 */
@Injectable()
export class StatusNotificationRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async insert(data: NewStatusNotificationRow): Promise<{ id: number }> {
    const [row] = await this.db
      .insert(statusNotifications)
      .values(data)
      .returning({ id: statusNotifications.id });
    return row;
  }
}
