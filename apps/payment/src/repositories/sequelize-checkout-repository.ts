// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Op } from 'sequelize';
import type { WhereOptions } from 'sequelize';
import { Checkout } from '../models/index.js';
import type { CheckoutCreate, CheckoutDto, CheckoutUpdate } from '../types/index.js';
import { CheckoutStatus } from '../types/index.js';
import type { CheckoutFilter, ICheckoutRepository } from './interfaces.js';

export class SequelizeCheckoutRepository implements ICheckoutRepository {
  async create(tenantId: number, input: CheckoutCreate): Promise<CheckoutDto> {
    return await Checkout.create({
      tenantId,
      stripeAccountId: input.stripeAccountId,
      flow: input.flow,
      status: CheckoutStatus.Created,
      connectorId: input.connectorId,
      tariffId: input.tariffSnapshot.id,
      tariffSnapshot: input.tariffSnapshot,
      transactionDatabaseId: input.transactionDatabaseId ?? null,
      currency: input.tariffSnapshot.currency,
    });
  }

  async findById(tenantId: number, id: number): Promise<CheckoutDto | undefined> {
    return (await Checkout.findOne({ where: { id, tenantId } })) ?? undefined;
  }

  async findByPublicId(publicId: string): Promise<CheckoutDto | undefined> {
    return (await Checkout.findOne({ where: { publicId } })) ?? undefined;
  }

  async findByTransactionDatabaseId(
    tenantId: number,
    transactionDatabaseId: number,
  ): Promise<CheckoutDto | undefined> {
    return (await Checkout.findOne({ where: { tenantId, transactionDatabaseId } })) ?? undefined;
  }

  async update(
    tenantId: number,
    id: number,
    changes: CheckoutUpdate,
  ): Promise<CheckoutDto | undefined> {
    const [, updated] = await Checkout.update(changes, {
      where: { id, tenantId },
      returning: true,
    });
    return updated[0];
  }

  async transition(
    tenantId: number,
    id: number,
    from: CheckoutStatus[],
    changes: CheckoutUpdate & { status: CheckoutStatus },
  ): Promise<CheckoutDto | undefined> {
    const [, updated] = await Checkout.update(changes, {
      where: { id, tenantId, status: from },
      returning: true,
    });
    return updated[0];
  }

  async list(filter: CheckoutFilter): Promise<CheckoutDto[]> {
    const where: WhereOptions<Checkout> = {
      ...(filter.tenantId !== undefined && { tenantId: filter.tenantId }),
      ...(filter.statuses && { status: filter.statuses }),
      ...(filter.beforeId !== undefined && { id: { [Op.lt]: filter.beforeId } }),
    };
    return await Checkout.findAll({ where, order: [['id', 'DESC']], limit: filter.limit });
  }

  async findStale(statuses: CheckoutStatus[], before: Date, limit: number): Promise<CheckoutDto[]> {
    return await Checkout.findAll({
      where: { status: statuses, updatedAt: { [Op.lt]: before } },
      order: [['updatedAt', 'ASC']],
      limit,
    });
  }

  async countByStatus(tenantId: number, statuses: CheckoutStatus[]): Promise<number> {
    return await Checkout.count({ where: { tenantId, status: statuses } });
  }
}
