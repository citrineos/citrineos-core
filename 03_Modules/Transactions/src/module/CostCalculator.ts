import { ITariffRepository, Tariff } from '@citrineos/data';
import { ILogObj, Logger } from 'tslog';
import { TransactionService } from './TransactionService';
import { Money } from '@citrineos/base';

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
   * Computes the cost based on `stationId` and `totalKwh`.
   * If `totalKwh` is not provided, it is calculated for given transaction.
   *
   * @param stationId - The identifier of the station.
   * @param transactionDbId - The identifier of the transaction.
   * @param totalKwh - Optional. The total kilowatt-hours.
   *
   * @returns A promise that resolves to the total cost.
   */
  async calculateTotalCost(
    tenantId: number,
    stationId: string,
    transactionDbId: number,
    totalKwh?: number | null,
  ): Promise<number> {
    if (totalKwh === undefined || totalKwh === null) {
      const kwh = await this._transactionService.recalculateTotalKwh(tenantId, transactionDbId);
      return this._calculateTotalCost(tenantId, stationId, kwh);
    }
    return this._calculateTotalCost(tenantId, stationId, totalKwh);
  }

  private async _calculateTotalCost(
    tenantId: number,
    stationId: string,
    totalKwh: number,
  ): Promise<number> {
    // TODO: This is a temp workaround. We need to refactor the calculation of totalCost when tariff
    //  implementation is finalized
    this._logger.debug(`Calculating total cost for ${stationId} station and ${totalKwh} kWh`);
    const tariff: Tariff | undefined = await this._tariffRepository.findByStationId(
      tenantId,
      stationId,
    );
    if (tariff) {
      this._logger.debug(`Tariff ${tariff.id} found for ${stationId} station`);
      return Money.of(tariff.pricePerKwh, tariff.currency)
        .multiply(totalKwh)
        .roundToCurrencyScale()
        .toNumber();
    } else {
      this._logger.error(`Tariff not found for ${stationId} station`);
      return 0;
    }
  }
}
