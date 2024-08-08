import { ITransactionEventRepository } from '@citrineos/data';
import { AbstractModule, CallAction } from '@citrineos/base';
import { ILogObj, Logger } from 'tslog';
import { CostCalculator } from './CostCalculator';

export class PeriodicCostNotifier {
  private _registry: Map<string, NodeJS.Timeout> = new Map();

  private readonly _logger: Logger<ILogObj>;

  private readonly _transactionEventRepository: ITransactionEventRepository;
  private readonly _module: AbstractModule;
  private readonly _costCalculator: CostCalculator;

  constructor(
    module: AbstractModule,
    transactionEventRepository: ITransactionEventRepository,
    costCalculator: CostCalculator,
    logger?: Logger<ILogObj>,
  ) {
    this._transactionEventRepository = transactionEventRepository;
    this._module = module;
    this._costCalculator = costCalculator;
    this._logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });
  }

  /**
   * Repeatedly sends a CostUpdated call for an ongoing transaction based on the intervalSeconds.
   * Stops sending requests once the transaction becomes inactive.
   *
   * @param {string} stationId - The identifier of the client connection.
   * @param {string} transactionId - The identifier of the transaction.
   * @param {number} intervalSeconds - The costUpdated interval in seconds.
   * @param {string} tenantId - The identifier of the tenant.
   * @return {void} This function does not return anything.
   */
  notifyWhileActive(
    stationId: string,
    transactionId: string,
    tenantId: string,
    intervalSeconds: number,
  ): void {
    if (this._isAlreadyRegistered(stationId, transactionId)) {
      return;
    }
    this._logger.debug(
      `Registering periodic cost notifications for ${stationId} station, ${transactionId} transaction, ${tenantId} tenant`,
    );
    this._register(
      stationId,
      transactionId,
      setInterval(
        () => this._tryNotify(stationId, transactionId, tenantId),
        intervalSeconds * 1000,
      ),
    );
  }

  private async _tryNotify(
    stationId: string,
    transactionId: string,
    tenantId: string,
  ) {
    try {
      const transaction =
        await this._transactionEventRepository.readTransactionByStationIdAndTransactionId(
          stationId,
          transactionId,
        );

      if (!transaction?.isActive) {
        this._logger.debug(
          `Unregistering periodic cost notifications for ${stationId} station, ${transactionId} transaction, ${tenantId} tenant`,
        );
        this._unregister(stationId, transactionId);
        return;
      }

      const cost = await this._costCalculator.calculateTotalCost(
        transaction.stationId,
        transaction.id,
      );
      await this._module.sendCall(
        transaction.stationId,
        tenantId,
        CallAction.CostUpdated,
        {
          totalCost: cost,
          transactionId: transaction.transactionId,
        },
      );
      this._logger.debug(
        `Sent CostUpdated call for ${transaction.transactionId} transaction with ${cost} cost`,
      );
    } catch (error) {
      this._logger.error(
        `Failed to send CostUpdated call for ${transactionId} transaction`,
        error,
      );
    }
  }

  private _register(
    stationId: string,
    transactionId: string,
    timeout: NodeJS.Timeout,
  ) {
    const key = this._key(stationId, transactionId);
    this._registry.set(key, timeout);
  }

  private _unregister(stationId: string, transactionId: string) {
    const key = this._key(stationId, transactionId);
    clearInterval(this._registry.get(key));
    this._registry.delete(key);
  }

  private _isAlreadyRegistered(stationId: string, transactionId: string) {
    const key = this._key(stationId, transactionId);
    return this._registry.has(key);
  }

  private _key(stationId: string, transactionId: string) {
    return `${stationId}:${transactionId}`;
  }
}
