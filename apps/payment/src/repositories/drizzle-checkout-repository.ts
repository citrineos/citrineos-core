// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { and, asc, count, desc, eq, inArray, lt } from 'drizzle-orm';
import type { PaymentDatabase } from '../db/database.js';
import { checkoutTable } from '../db/schema.js';
import type { CheckoutCreate, CheckoutDto, CheckoutUpdate } from '../types/index.js';
import { CheckoutStatus } from '../types/index.js';
import type { CheckoutFilter, ICheckoutRepository } from './interfaces.js';

export class DrizzleCheckoutRepository implements ICheckoutRepository {
  constructor(private readonly _db: PaymentDatabase) {}

  async create(tenantId: number, input: CheckoutCreate): Promise<CheckoutDto> {
    const [created] = await this._db
      .insert(checkoutTable)
      .values({
        tenantId,
        stripeAccountId: input.stripeAccountId,
        flow: input.flow,
        status: CheckoutStatus.Created,
        connectorId: input.connectorId,
        tariffId: input.tariffSnapshot.id,
        tariffSnapshot: input.tariffSnapshot,
        transactionDatabaseId: input.transactionDatabaseId ?? null,
        currency: input.tariffSnapshot.currency,
      })
      .returning();
    return created;
  }

  async findById(tenantId: number, id: number): Promise<CheckoutDto | undefined> {
    return await this._findOne(and(eq(checkoutTable.id, id), eq(checkoutTable.tenantId, tenantId)));
  }

  async findByPublicId(publicId: string): Promise<CheckoutDto | undefined> {
    return await this._findOne(eq(checkoutTable.publicId, publicId));
  }

  async findByTransactionDatabaseId(
    tenantId: number,
    transactionDatabaseId: number,
  ): Promise<CheckoutDto | undefined> {
    return await this._findOne(
      and(
        eq(checkoutTable.tenantId, tenantId),
        eq(checkoutTable.transactionDatabaseId, transactionDatabaseId),
      ),
    );
  }

  async update(
    tenantId: number,
    id: number,
    changes: CheckoutUpdate,
  ): Promise<CheckoutDto | undefined> {
    const [updated] = await this._db
      .update(checkoutTable)
      .set(changes)
      .where(and(eq(checkoutTable.id, id), eq(checkoutTable.tenantId, tenantId)))
      .returning();
    return updated;
  }

  async transition(
    tenantId: number,
    id: number,
    from: CheckoutStatus[],
    changes: CheckoutUpdate & { status: CheckoutStatus },
  ): Promise<CheckoutDto | undefined> {
    if (!from.length) {
      return undefined;
    }
    // One conditional UPDATE: of two concurrent transitions out of the same status, one matches.
    const [updated] = await this._db
      .update(checkoutTable)
      .set(changes)
      .where(
        and(
          eq(checkoutTable.id, id),
          eq(checkoutTable.tenantId, tenantId),
          inArray(checkoutTable.status, from),
        ),
      )
      .returning();
    return updated;
  }

  async list(filter: CheckoutFilter): Promise<CheckoutDto[]> {
    return await this._db
      .select()
      .from(checkoutTable)
      .where(
        and(
          filter.tenantId === undefined ? undefined : eq(checkoutTable.tenantId, filter.tenantId),
          filter.statuses === undefined
            ? undefined
            : inArray(checkoutTable.status, filter.statuses),
          filter.transactionDatabaseId === undefined
            ? undefined
            : eq(checkoutTable.transactionDatabaseId, filter.transactionDatabaseId),
          filter.beforeId === undefined ? undefined : lt(checkoutTable.id, filter.beforeId),
        ),
      )
      .orderBy(desc(checkoutTable.id))
      .limit(filter.limit);
  }

  async findStale(statuses: CheckoutStatus[], before: Date, limit: number): Promise<CheckoutDto[]> {
    if (!statuses.length) {
      return [];
    }
    return await this._db
      .select()
      .from(checkoutTable)
      .where(and(inArray(checkoutTable.status, statuses), lt(checkoutTable.updatedAt, before)))
      .orderBy(asc(checkoutTable.updatedAt))
      .limit(limit);
  }

  async countByStatus(tenantId: number, statuses: CheckoutStatus[]): Promise<number> {
    if (!statuses.length) {
      return 0;
    }
    const [result] = await this._db
      .select({ count: count() })
      .from(checkoutTable)
      .where(and(eq(checkoutTable.tenantId, tenantId), inArray(checkoutTable.status, statuses)));
    return result?.count ?? 0;
  }

  private async _findOne(
    where: ReturnType<typeof and> | ReturnType<typeof eq>,
  ): Promise<CheckoutDto | undefined> {
    const [checkout] = await this._db.select().from(checkoutTable).where(where).limit(1);
    return checkout;
  }
}
