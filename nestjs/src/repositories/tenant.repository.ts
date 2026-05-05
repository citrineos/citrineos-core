import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DrizzleDb, DRIZZLE } from '@db/drizzle.module';
import { tenants } from '@entities/tenant.entity';

/**
 * Drizzle-backed repository for the Tenant entity.
 * Centralises every read/write path for this table so handlers and
 * services don’t reach for the Drizzle client directly.
 */
@Injectable()
export class TenantRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async findAll() {
    return this.db.select().from(tenants);
  }

  async findById(id: number) {
    return this.db.query.tenants.findFirst({ where: eq(tenants.id, id) });
  }

  async create(data: Omit<typeof tenants.$inferInsert, 'id'>) {
    const [row] = await this.db.insert(tenants).values(data).returning();
    return row;
  }

  async update(id: number, data: Partial<typeof tenants.$inferInsert>) {
    const [row] = await this.db
      .update(tenants)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(tenants.id, id))
      .returning();
    return row;
  }

  async delete(id: number) {
    await this.db.delete(tenants).where(eq(tenants.id, id));
  }
}
