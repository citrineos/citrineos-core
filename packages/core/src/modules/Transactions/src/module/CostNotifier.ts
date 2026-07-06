// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { OCPPVersionType } from '@citrineos/base';
import type { ITransactionEventRepository } from '@dal/interfaces/repositories.js';
import { Transaction } from '@dal/layers/sequelize/model/TransactionEvent/index.js';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import { CostCalculator } from './CostCalculator.js';
import { Scheduler } from './Scheduler.js';

/** The computed cost update to send to a charging station. */
export interface CostUpdate {
  ocppConnectionName: string;
  tenantId: number;
  totalCost: number;
  transactionId: string;
  protocol: OCPPVersionType;
}

/**
 * Sends a computed {@link CostUpdate} to the charging station. Supplied by the
 * Transactions module (which owns the OCPP send semantics) so that
 * {@link CostNotifier} does not hold a back-reference to the module.
 */
export type CostUpdatedNotifier = (update: CostUpdate) => Promise<void>;

export class CostNotifier extends Scheduler {
  private readonly _transactionEventRepository: ITransactionEventRepository;
  private readonly _costCalculator: CostCalculator;
  private readonly _notifyCostUpdated: CostUpdatedNotifier;

  constructor({
    transactionEventRepository,
    costCalculator,
    costUpdatedNotifier,
    logger,
  }: {
    transactionEventRepository: ITransactionEventRepository;
    costCalculator: CostCalculator;
    costUpdatedNotifier: CostUpdatedNotifier;
    logger: Logger<ILogObj>;
  }) {
    super(logger);
    this._transactionEventRepository = transactionEventRepository;
    this._costCalculator = costCalculator;
    this._notifyCostUpdated = costUpdatedNotifier;
  }

  /**
   * Repeatedly sends a CostUpdated call for an ongoing transaction based on the intervalSeconds.
   * Stops sending requests once the transaction becomes inactive.
   *
   * @param ocppConnectionName - The connection name of the charging station
   * @param {string} transactionId - The identifier of the transaction.
   * @param {number} intervalSeconds - The costUpdated interval in seconds.
   * @param {number} tenantId - The identifier of the tenant.
   * @return {void} This function does not return anything.
   */
  notifyWhileActive(
    ocppConnectionName: string,
    transactionId: string,
    tenantId: number,
    intervalSeconds: number,
    protocol: OCPPVersionType,
  ): void {
    this._logger.debug(
      `Scheduling periodic cost notifications for ${ocppConnectionName} station, ${transactionId} transaction, ${tenantId} tenant`,
    );
    this.schedule(
      this._key(ocppConnectionName, transactionId),
      () => this._tryNotify(ocppConnectionName, transactionId, tenantId, protocol),
      intervalSeconds,
    );
  }

  async calculateCostAndNotify(
    transaction: Transaction,
    tenantId: number,
    protocol: OCPPVersionType,
  ): Promise<void> {
    const cost = await this._costCalculator.calculateTotalCost(
      tenantId,
      transaction.connectorId,
      transaction.totalKwh!,
    );

    await this._transactionEventRepository.updateTransactionTotalCostById(
      tenantId,
      cost,
      transaction.id,
    );

    await this._notifyCostUpdated({
      ocppConnectionName: transaction.ocppConnectionName,
      tenantId,
      totalCost: cost,
      transactionId: transaction.transactionId,
      protocol,
    });
    this._logger.debug(
      `Sent CostUpdated call for ${transaction.transactionId} transaction with ${cost} cost`,
    );
  }

  private async _tryNotify(
    ocppConnectionName: string,
    transactionId: string,
    tenantId: number,
    protocol: OCPPVersionType,
  ) {
    try {
      const transaction =
        await this._transactionEventRepository.readTransactionByStationIdAndTransactionId(
          tenantId,
          ocppConnectionName,
          transactionId,
        );

      if (!transaction) {
        this._logger.error(
          `Transaction NOT FOUND in DB. Searched for ocppConnectionName: "${ocppConnectionName}", transactionId: "${transactionId}"`,
        );
        this.unschedule(this._key(ocppConnectionName, transactionId));
        return;
      }

      if (!transaction?.isActive) {
        this._logger.debug(
          `Unscheduling periodic cost notifications for ${ocppConnectionName} station, ${transactionId} transaction, ${tenantId} tenant`,
        );
        this.unschedule(this._key(ocppConnectionName, transactionId));
        return;
      }

      await this.calculateCostAndNotify(transaction, tenantId, protocol);
    } catch (error) {
      this._logger.error(`Failed to send CostUpdated call for ${transactionId} transaction`, error);
      this.unschedule(this._key(ocppConnectionName, transactionId));
    }
  }

  private _key(ocppConnectionName: string, transactionId: string) {
    return `${ocppConnectionName}:${transactionId}`;
  }
}
