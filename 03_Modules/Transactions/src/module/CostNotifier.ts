import { ITransactionEventRepository, Transaction } from '@citrineos/data';
import { AbstractModule, OCPP2_0_1_CallAction, OCPPVersion } from '@citrineos/base';
import { ILogObj, Logger } from 'tslog';
import { CostCalculator } from './CostCalculator';
import { Scheduler } from './Scheduler';

export class CostNotifier extends Scheduler {
  private readonly _transactionEventRepository: ITransactionEventRepository;
  private readonly _module: AbstractModule;
  private readonly _costCalculator: CostCalculator;

  constructor(
    module: AbstractModule,
    transactionEventRepository: ITransactionEventRepository,
    costCalculator: CostCalculator,
    logger?: Logger<ILogObj>,
  ) {
    super(logger);
    this._transactionEventRepository = transactionEventRepository;
    this._module = module;
    this._costCalculator = costCalculator;
  }

  /**
   * Repeatedly sends a CostUpdated call for an ongoing transaction based on the intervalSeconds.
   * Stops sending requests once the transaction becomes inactive.
   *
   * @param {string} stationId - The identifier of the client connection.
   * @param {string} transactionId - The identifier of the transaction.
   * @param {number} intervalSeconds - The costUpdated interval in seconds.
   * @param {number} tenantId - The identifier of the tenant.
   * @return {void} This function does not return anything.
   */
  notifyWhileActive(
    stationId: string,
    transactionId: string,
    tenantId: number,
    intervalSeconds: number,
  ): void {
    this._logger.debug(
      `Scheduling periodic cost notifications for ${stationId} station, ${transactionId} transaction, ${tenantId} tenant`,
    );
    this.schedule(
      this._key(stationId, transactionId),
      () => this._tryNotify(stationId, transactionId, tenantId),
      intervalSeconds,
    );
  }

  async calculateCostAndNotify(transaction: Transaction, tenantId: number): Promise<void> {
    const cost = await this._costCalculator.calculateTotalCost(
      tenantId,
      transaction.stationId,
      transaction.id,
    );

    await this._transactionEventRepository.updateTransactionTotalCostById(
      tenantId,
      cost,
      transaction.id,
    );

    await this._module.sendCall(
      transaction.stationId,
      tenantId,
      OCPPVersion.OCPP2_0_1,
      OCPP2_0_1_CallAction.CostUpdated,
      {
        totalCost: cost,
        transactionId: transaction.transactionId,
      },
    );
    this._logger.debug(
      `Sent CostUpdated call for ${transaction.transactionId} transaction with ${cost} cost`,
    );
  }

  private async _tryNotify(stationId: string, transactionId: string, tenantId: number) {
    try {
      const transaction =
        await this._transactionEventRepository.readTransactionByStationIdAndTransactionId(
          tenantId,
          stationId,
          transactionId,
        );

      if (!transaction?.isActive) {
        this._logger.debug(
          `Unscheduling periodic cost notifications for ${stationId} station, ${transactionId} transaction, ${tenantId} tenant`,
        );
        this.unschedule(this._key(stationId, transactionId));
        return;
      }

      await this.calculateCostAndNotify(transaction, tenantId);
    } catch (error) {
      this._logger.error(`Failed to send CostUpdated call for ${transactionId} transaction`, error);
    }
  }

  private _key(stationId: string, transactionId: string) {
    return `${stationId}:${transactionId}`;
  }
}
