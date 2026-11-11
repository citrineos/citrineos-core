// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { PaymentAccount } from '../models/index.js';
import type {
  PaymentAccountCreate,
  PaymentAccountDto,
  PaymentAccountUpdate,
} from '../types/index.js';
import type { IPaymentAccountRepository } from './interfaces.js';

export class SequelizePaymentAccountRepository implements IPaymentAccountRepository {
  async create(tenantId: number, input: PaymentAccountCreate): Promise<PaymentAccountDto> {
    return await PaymentAccount.create({
      tenantId,
      stripeAccountId: input.stripeAccountId,
      scanAndChargeEnabled: input.scanAndChargeEnabled ?? false,
      termsUrl: input.termsUrl ?? null,
    });
  }

  async findByTenantId(tenantId: number): Promise<PaymentAccountDto | undefined> {
    return (await PaymentAccount.findOne({ where: { tenantId } })) ?? undefined;
  }

  async findByStripeAccountId(stripeAccountId: string): Promise<PaymentAccountDto | undefined> {
    return (await PaymentAccount.findOne({ where: { stripeAccountId } })) ?? undefined;
  }

  async list(tenantId?: number): Promise<PaymentAccountDto[]> {
    return await PaymentAccount.findAll({
      where: tenantId === undefined ? {} : { tenantId },
      order: [['tenantId', 'ASC']],
    });
  }

  async update(
    tenantId: number,
    changes: PaymentAccountUpdate,
  ): Promise<PaymentAccountDto | undefined> {
    const [, updated] = await PaymentAccount.update(changes, {
      where: { tenantId },
      returning: true,
    });
    return updated[0];
  }

  async delete(tenantId: number): Promise<boolean> {
    return (await PaymentAccount.destroy({ where: { tenantId } })) > 0;
  }
}
