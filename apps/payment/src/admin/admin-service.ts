// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { childLogger } from '@citrineos/base';
import type { ILogObj, Logger } from 'tslog';
import type { ICheckoutRepository, IPaymentAccountRepository } from '../repositories/index.js';
import { cancelCheckout } from '../services/cancel-checkout.js';
import { PaymentError, PaymentErrorCode } from '../services/errors.js';
import type {
  ReconcileOutcome,
  ReconciliationService,
} from '../services/reconciliation-service.js';
import type { IPaymentProvider } from '../stripe/payment-provider.js';
import type { CheckoutDto, CheckoutStatus, PaymentAccountDto } from '../types/index.js';
import { CheckoutStatus as Status, OPEN_CHECKOUT_STATUSES } from '../types/index.js';
import type { AdminPrincipal } from './admin-auth.js';
import { AdminScope } from './admin-auth.js';

export interface PaymentAccountInput {
  stripeAccountId: string;
  scanAndChargeEnabled?: boolean;
  termsUrl?: string | null;
}

export interface PaymentAccountView {
  tenantId: number;
  stripeAccountId: string;
  scanAndChargeEnabled: boolean;
  termsUrl: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface CheckoutQuery {
  tenantId?: number;
  status?: CheckoutStatus[];
  beforeId?: number;
  limit?: number;
}

export interface CheckoutPage {
  checkouts: CheckoutDto[];
  /** Pass as `beforeId` for the next page; null on the last one. */
  nextBeforeId: number | null;
}

/** An operator may release the hold of a checkout that has not started charging, or failed. */
const CANCELLABLE: CheckoutStatus[] = [
  Status.Created,
  Status.Authorized,
  Status.StartRequested,
  Status.Failed,
];

const DEFAULT_PAGE = 50;
const MAX_PAGE = 200;

export interface AdminServiceDependencies {
  checkoutRepository: ICheckoutRepository;
  paymentAccountRepository: IPaymentAccountRepository;
  payments: IPaymentProvider;
  reconciliationService: ReconciliationService;
  logger?: Logger<ILogObj>;
}

/** What /api/admin does: tenants' payment accounts, and checkouts that need a hand. */
export class AdminService {
  private readonly _checkouts: ICheckoutRepository;
  private readonly _accounts: IPaymentAccountRepository;
  private readonly _payments: IPaymentProvider;
  private readonly _reconciliation: ReconciliationService;
  private readonly _logger: Logger<ILogObj>;

  constructor(dependencies: AdminServiceDependencies) {
    this._checkouts = dependencies.checkoutRepository;
    this._accounts = dependencies.paymentAccountRepository;
    this._payments = dependencies.payments;
    this._reconciliation = dependencies.reconciliationService;
    this._logger = childLogger(dependencies.logger, this.constructor.name);
  }

  async listAccounts(principal: AdminPrincipal): Promise<PaymentAccountView[]> {
    const accounts = await this._accounts.list(
      principal.scope === AdminScope.Tenant ? principal.tenantId : undefined,
    );
    return accounts.map(view);
  }

  async getAccount(principal: AdminPrincipal, tenantId: number): Promise<PaymentAccountView> {
    this._authorize(principal, tenantId);
    const account = await this._accounts.findByTenantId(tenantId);
    if (!account) {
      throw new PaymentError(
        PaymentErrorCode.NotFound,
        `Tenant ${tenantId} has no payment account`,
      );
    }
    return view(account);
  }

  /** Creates the tenant's account, or changes it. */
  async putAccount(
    principal: AdminPrincipal,
    tenantId: number,
    input: PaymentAccountInput,
  ): Promise<{ account: PaymentAccountView; created: boolean }> {
    this._authorize(principal, tenantId);
    const termsUrl = input.termsUrl === undefined ? undefined : webPage(input.termsUrl);
    const existing = await this._accounts.findByTenantId(tenantId);
    try {
      if (!existing) {
        const created = await this._accounts.create(tenantId, {
          stripeAccountId: input.stripeAccountId,
          scanAndChargeEnabled: input.scanAndChargeEnabled,
          termsUrl,
        });
        this._logger.info(`Tenant ${tenantId} takes payments on ${created.stripeAccountId}`);
        return { account: view(created), created: true };
      }
      if (existing.stripeAccountId !== input.stripeAccountId) {
        await this._refuseWhileOpen(tenantId, 'change its Stripe account');
      }
      const updated = await this._accounts.update(tenantId, {
        stripeAccountId: input.stripeAccountId,
        ...(input.scanAndChargeEnabled !== undefined && {
          scanAndChargeEnabled: input.scanAndChargeEnabled,
        }),
        ...(termsUrl !== undefined && { termsUrl }),
      });
      if (!updated) {
        throw new PaymentError(
          PaymentErrorCode.NotFound,
          `Tenant ${tenantId} has no payment account`,
        );
      }
      return { account: view(updated), created: false };
    } catch (error) {
      // By name: the DAL may load its own copy of Sequelize, whose classes instanceof misses.
      const name = error instanceof Error ? error.name : '';
      if (name === 'SequelizeForeignKeyConstraintError') {
        throw new PaymentError(PaymentErrorCode.NotFound, `No tenant ${tenantId}`);
      }
      if (name === 'SequelizeUniqueConstraintError') {
        throw new PaymentError(
          PaymentErrorCode.Conflict,
          `Stripe account ${input.stripeAccountId} belongs to another tenant`,
        );
      }
      throw error;
    }
  }

  async deleteAccount(principal: AdminPrincipal, tenantId: number): Promise<void> {
    this._authorize(principal, tenantId);
    await this._refuseWhileOpen(tenantId, 'stop taking payments');
    if (!(await this._accounts.delete(tenantId))) {
      throw new PaymentError(
        PaymentErrorCode.NotFound,
        `Tenant ${tenantId} has no payment account`,
      );
    }
    this._logger.info(`Tenant ${tenantId} no longer takes payments`);
  }

  async listCheckouts(principal: AdminPrincipal, query: CheckoutQuery): Promise<CheckoutPage> {
    if (query.tenantId !== undefined) {
      this._authorize(principal, query.tenantId);
    }
    const limit = Math.min(query.limit ?? DEFAULT_PAGE, MAX_PAGE);
    const checkouts = await this._checkouts.list({
      tenantId: principal.scope === AdminScope.Tenant ? principal.tenantId : query.tenantId,
      statuses: query.status,
      beforeId: query.beforeId,
      limit,
    });
    return {
      checkouts,
      nextBeforeId: checkouts.length === limit ? checkouts[checkouts.length - 1].id : null,
    };
  }

  async getCheckout(principal: AdminPrincipal, publicId: string): Promise<CheckoutDto> {
    const checkout = await this._checkouts.findByPublicId(publicId);
    // Another tenant's checkout is not acknowledged to exist.
    if (
      !checkout ||
      (principal.scope === AdminScope.Tenant && checkout.tenantId !== principal.tenantId)
    ) {
      throw new PaymentError(PaymentErrorCode.NotFound, 'No such checkout');
    }
    return checkout;
  }

  /** Moves the checkout on from Core's data now, as the sweep would; also retries a failed capture. */
  async settle(
    principal: AdminPrincipal,
    publicId: string,
  ): Promise<{ outcome: ReconcileOutcome; checkout: CheckoutDto }> {
    const checkout = await this.getCheckout(principal, publicId);
    const outcome = await this._reconciliation.reconcile(checkout, true);
    return { outcome, checkout: await this.getCheckout(principal, publicId) };
  }

  /** Releases the hold of a checkout that never started charging, or whose capture failed. */
  async cancel(principal: AdminPrincipal, publicId: string): Promise<CheckoutDto> {
    const checkout = await this.getCheckout(principal, publicId);
    const cancelled = await cancelCheckout(
      { checkouts: this._checkouts, payments: this._payments, logger: this._logger },
      checkout,
      CANCELLABLE,
    );
    if (!cancelled) {
      throw new PaymentError(
        PaymentErrorCode.Conflict,
        `A ${checkout.status} checkout cannot be cancelled; only ${CANCELLABLE.join(', ')} can`,
      );
    }
    this._logger.info(`Checkout ${publicId} was cancelled by an admin`);
    return cancelled;
  }

  private _authorize(principal: AdminPrincipal, tenantId: number): void {
    if (principal.scope === AdminScope.Tenant && principal.tenantId !== tenantId) {
      throw new PaymentError(
        PaymentErrorCode.Forbidden,
        `This token administers tenant ${principal.tenantId} only`,
      );
    }
  }

  /** Webhooks find an open checkout's tenant through its Stripe account, so it has to stay. */
  private async _refuseWhileOpen(tenantId: number, change: string): Promise<void> {
    const open = await this._checkouts.countByStatus(tenantId, OPEN_CHECKOUT_STATUSES);
    if (open > 0) {
      throw new PaymentError(
        PaymentErrorCode.Conflict,
        `Tenant ${tenantId} has ${open} open checkout(s); it cannot ${change} until they settle`,
      );
    }
  }
}

function view(account: PaymentAccountDto): PaymentAccountView {
  return {
    tenantId: account.tenantId,
    stripeAccountId: account.stripeAccountId,
    scanAndChargeEnabled: account.scanAndChargeEnabled,
    termsUrl: account.termsUrl,
    createdAt: account.createdAt ?? null,
    updatedAt: account.updatedAt ?? null,
  };
}

/** Terms are linked to from drivers' browsers, so only a web address will do. */
function webPage(url: string | null): string | null {
  if (url === null || url === '') {
    return null;
  }
  try {
    if (['http:', 'https:'].includes(new URL(url).protocol)) {
      return url;
    }
  } catch {
    // Reported below.
  }
  throw new PaymentError(PaymentErrorCode.Invalid, 'termsUrl must be an http(s) address');
}
