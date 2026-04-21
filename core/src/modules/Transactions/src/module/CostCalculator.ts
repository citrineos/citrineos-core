// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { Money } from '@citrineos/base';
import type { ITariffRepository } from '@dal/interfaces/repositories.js';
import { Tariff } from '@dal/layers/sequelize/model/Tariff/index.js';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import { TransactionService } from './TransactionService.js';

export class CostCalculator {
  private readonly _logger: Logger<ILogObj>;

  private readonly _tariffRepository: ITariffRepository;
  private readonly _transactionService: TransactionService;

  constructor(
    tariffRepository: ITariffRepository,
    transactionService: TransactionService,
    logger?: Logger<ILogObj>,
  ) {
    this._tariffRepository = tariffRepository;
    this._transactionService = transactionService;
    this._logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });
  }

  /**
   * Calculates the total cost for a transaction.
   *
   * Computes the cost based on `connectorId` and `totalKwh`.
   *
   * @param connectorId - The database ID of the connector.
   * @param totalKwh - The total kilowatt-hours.
   *
   * @returns A promise that resolves to the total cost.
   */
  async calculateTotalCost(
    tenantId: number,
    connectorId: number | undefined,
    totalKwh: number,
  ): Promise<number> {
    if (connectorId == null) {
      this._logger.error('Cannot calculate cost: connectorId is not set on transaction');
      return 0;
    }
    this._logger.debug(`Calculating total cost for connector ${connectorId} and ${totalKwh} kWh`);
    const tariff: Tariff | undefined = await this._tariffRepository.findByConnectorId(
      tenantId,
      connectorId,
    );
    if (tariff) {
      this._logger.debug(`Tariff ${tariff.id} found for connector ${connectorId}`);
      return Money.of(tariff.pricePerKwh, tariff.currency)
        .multiply(totalKwh)
        .roundToCurrencyScale()
        .toNumber();
    } else {
      this._logger.error(`Tariff not found for connector ${connectorId}`);
      return 0;
    }
  }
}
