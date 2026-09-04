// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { ITariffRepository } from '@citrineos/dal';
import type { TariffDto } from '@citrineos/types';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import { TransactionService } from './transaction-service.js';
import { Transaction } from '@citrineos/dal';
import { baseCalculateTotalCost } from '@citrineos/base';

export class CostCalculator {
  private readonly _logger: Logger<ILogObj>;

  private readonly _tariffRepository: ITariffRepository;
  private readonly _transactionService: TransactionService;

  constructor({
    tariffRepository,
    transactionService,
    logger,
  }: {
    tariffRepository: ITariffRepository;
    transactionService: TransactionService;
    logger: Logger<ILogObj>;
  }) {
    this._tariffRepository = tariffRepository;
    this._transactionService = transactionService;
    this._logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });
  }

  /**
   * Calculates the total cost for a transaction (excluding VAT).
   *
   * Computes the cost based on Tariff of connector and session information.
   *
   * @param tenantId - The tenant ID.
   * @param transaction - Transaction to calculate for.
   *
   * @returns A promise that resolves to the total cost.
   */
  async calculateTotalCost(tenantId: number, transaction: Transaction): Promise<number> {
    if (transaction.connectorId == null) {
      this._logger.error('Cannot calculate cost: connectorId is not set on transaction');
      return 0;
    }
    if (transaction.totalKwh == null) {
      this._logger.error('Cannot calculate cost: totalKwh not found');
      return 0;
    }
    if (transaction.timeSpentCharging == null) {
      this._logger.error('Cannot calculate cost: timeSpentCharging not found');
      return 0;
    }
    this._logger.debug(`Calculating total cost for connector ${transaction.connectorId}`);
    const tariff: TariffDto | undefined = await this._tariffRepository.findByConnectorId(
      tenantId,
      transaction.connectorId,
    );
    if (!tariff) {
      this._logger.error(`Tariff not found for connector ${transaction.connectorId}`);
      return 0;
    }
    const price = baseCalculateTotalCost(
      transaction.totalKwh,
      transaction.timeSpentCharging / 60,
      tariff.pricePerSession,
      tariff.pricePerKwh,
      tariff.pricePerMin,
      tariff.currency,
      tariff.taxRate,
    );
    return price.excl_vat;
  }
}
