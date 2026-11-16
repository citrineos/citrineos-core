// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { asc, eq } from 'drizzle-orm';
import type { PaymentDatabase } from '../db/database.js';
import { paymentAccountTable } from '../db/schema.js';
import type {
  PaymentAccountCreate,
  PaymentAccountDto,
  PaymentAccountUpdate,
} from '../types/index.js';
import { translateConstraintErrors } from './errors.js';
import type { IPaymentAccountRepository } from './interfaces.js';

export class DrizzlePaymentAccountRepository implements IPaymentAccountRepository {
  constructor(private readonly _db: PaymentDatabase) {}

  async create(tenantId: number, input: PaymentAccountCreate): Promise<PaymentAccountDto> {
    const [created] = await translateConstraintErrors(() =>
      this._db
        .insert(paymentAccountTable)
        .values({
          tenantId,
          stripeAccountId: input.stripeAccountId,
          scanAndChargeEnabled: input.scanAndChargeEnabled ?? false,
          termsUrl: input.termsUrl ?? null,
        })
        .returning(),
    );
    return created;
  }

  async findByTenantId(tenantId: number): Promise<PaymentAccountDto | undefined> {
    const [account] = await this._db
      .select()
      .from(paymentAccountTable)
      .where(eq(paymentAccountTable.tenantId, tenantId))
      .limit(1);
    return account;
  }

  async findByStripeAccountId(stripeAccountId: string): Promise<PaymentAccountDto | undefined> {
    const [account] = await this._db
      .select()
      .from(paymentAccountTable)
      .where(eq(paymentAccountTable.stripeAccountId, stripeAccountId))
      .limit(1);
    return account;
  }

  async list(tenantId?: number): Promise<PaymentAccountDto[]> {
    return await this._db
      .select()
      .from(paymentAccountTable)
      .where(tenantId === undefined ? undefined : eq(paymentAccountTable.tenantId, tenantId))
      .orderBy(asc(paymentAccountTable.tenantId));
  }

  async update(
    tenantId: number,
    changes: PaymentAccountUpdate,
  ): Promise<PaymentAccountDto | undefined> {
    const [updated] = await translateConstraintErrors(() =>
      this._db
        .update(paymentAccountTable)
        .set(changes)
        .where(eq(paymentAccountTable.tenantId, tenantId))
        .returning(),
    );
    return updated;
  }

  async delete(tenantId: number): Promise<boolean> {
    const deleted = await this._db
      .delete(paymentAccountTable)
      .where(eq(paymentAccountTable.tenantId, tenantId))
      .returning({ id: paymentAccountTable.id });
    return deleted.length > 0;
  }
}
