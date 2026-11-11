// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type {
  CheckoutCreate,
  CheckoutDto,
  CheckoutStatus,
  CheckoutUpdate,
  PaymentAccountCreate,
  PaymentAccountDto,
  PaymentAccountUpdate,
} from '../types/index.js';

export interface CheckoutFilter {
  /** Every tenant's when absent. */
  tenantId?: number;
  statuses?: CheckoutStatus[];
  /** Core's database id of the transaction the checkout paid for. */
  transactionDatabaseId?: number;
  /** Newest first; continue a page with the smallest id seen. */
  beforeId?: number;
  limit: number;
}

export interface IPaymentAccountRepository {
  create(tenantId: number, input: PaymentAccountCreate): Promise<PaymentAccountDto>;
  findByTenantId(tenantId: number): Promise<PaymentAccountDto | undefined>;
  /**
   * Not tenant-scoped: a Stripe webhook names the connected account, and this is how its tenant
   * is found.
   */
  findByStripeAccountId(stripeAccountId: string): Promise<PaymentAccountDto | undefined>;
  /** Every tenant's when `tenantId` is absent. */
  list(tenantId?: number): Promise<PaymentAccountDto[]>;
  update(tenantId: number, changes: PaymentAccountUpdate): Promise<PaymentAccountDto | undefined>;
  /** Whether there was one to delete. */
  delete(tenantId: number): Promise<boolean>;
}

export interface ICheckoutRepository {
  create(tenantId: number, input: CheckoutCreate): Promise<CheckoutDto>;
  findById(tenantId: number, id: number): Promise<CheckoutDto | undefined>;
  /**
   * Not tenant-scoped: drivers hold only the public id, and this is how its tenant is found.
   */
  findByPublicId(publicId: string): Promise<CheckoutDto | undefined>;
  findByTransactionDatabaseId(
    tenantId: number,
    transactionDatabaseId: number,
  ): Promise<CheckoutDto | undefined>;
  update(tenantId: number, id: number, changes: CheckoutUpdate): Promise<CheckoutDto | undefined>;
  /**
   * Applies `changes` only while the checkout is in one of the `from` statuses, so a step that
   * arrives twice (a redelivered message, a retried webhook) runs once. Returns undefined when the
   * checkout was not in `from`.
   */
  transition(
    tenantId: number,
    id: number,
    from: CheckoutStatus[],
    changes: CheckoutUpdate & { status: CheckoutStatus },
  ): Promise<CheckoutDto | undefined>;
  list(filter: CheckoutFilter): Promise<CheckoutDto[]>;
  /** Not tenant-scoped: for the sweep, the checkouts in `statuses` not changed since `before`. */
  findStale(statuses: CheckoutStatus[], before: Date, limit: number): Promise<CheckoutDto[]>;
  countByStatus(tenantId: number, statuses: CheckoutStatus[]): Promise<number>;
}
