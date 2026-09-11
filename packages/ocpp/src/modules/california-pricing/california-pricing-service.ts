// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { type IOcppSender } from '@citrineos/base';
import { EventGroup, OCPP1_6, OCPP_CallAction, OCPPVersion } from '@citrineos/types';
import type { Logger, ILogObj } from 'tslog';
import { Logger as TsLogger } from 'tslog';
import type {
  IChangeConfigurationRepository,
  IConnectorRepository,
  ITariffRepository,
  ITransactionEventRepository,
} from '@citrineos/dal';
import {
  COSTMSG_VENDOR_ID,
  CUSTOM_DISPLAY_COST_AND_PRICE_KEY,
  CostMsgId,
  DEFAULT_PRICE_KEY,
  type ChargingPrice,
  type DefaultPriceData,
  type FinalCostData,
  type RunningCostData,
  type SetUserPriceData,
} from './costmsg.js';
import { sameJson } from './json.js';
import type { CostCalculator } from '@modules/transactions/cost-calculator.js';

/**
 * Encapsulates the OCA California pricing (org.openchargealliance.costmsg) customization for
 * OCPP 1.6. Owns the enable-gate check, the CustomDisplayCostAndPrice probe, the DefaultPrice
 * ChangeConfiguration, and the construction/sending of the outbound SetUserPrice / RunningCost /
 * FinalCost DataTransfer messages. Injected into the module's observer handlers so they stay thin.
 */
export class CaliforniaPricingService {
  private readonly _logger: Logger<ILogObj>;
  private readonly _ocppSender: IOcppSender;
  private readonly _changeConfigurationRepository: IChangeConfigurationRepository;
  private readonly _tariffRepository: ITariffRepository;
  private readonly _transactionEventRepository: ITransactionEventRepository;
  private readonly _locationRepository: IConnectorRepository;
  protected _costCalculator: CostCalculator;

  constructor({
    transactionEventRepository,
    logger,
    ocppSender,
    changeConfigurationRepository,
    tariffRepository,
    locationRepository,
    costCalculator,
  }: {
    logger: Logger<ILogObj>;
    ocppSender: IOcppSender;
    changeConfigurationRepository: IChangeConfigurationRepository;
    transactionEventRepository: ITransactionEventRepository;
    tariffRepository: ITariffRepository;
    locationRepository: IConnectorRepository;
    costCalculator: CostCalculator;
  }) {
    this._logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new TsLogger<ILogObj>({ name: this.constructor.name });
    this._transactionEventRepository = transactionEventRepository;
    this._costCalculator = costCalculator;
    this._ocppSender = ocppSender;
    this._changeConfigurationRepository = changeConfigurationRepository;
    this._tariffRepository = tariffRepository;
    this._locationRepository = locationRepository;
  }

  /**
   * True when the charger reported CustomDisplayCostAndPrice=true (via GetConfiguration,
   * persisted in the ChangeConfiguration table). Gates the transaction-driven costmsg sends
   */
  async isEnabled(tenantId: number, ocppConnectionName: string): Promise<boolean> {
    const config = await this._changeConfigurationRepository.findByStationAndKey(
      tenantId,
      ocppConnectionName,
      CUSTOM_DISPLAY_COST_AND_PRICE_KEY,
    );
    return config?.value === 'true';
  }

  /** tariff for a connector, or undefined when no tariff is configured. */
  async resolvePrice(
    tenantId: number,
    ocppConnectionName: string,
    transactionId: number | undefined,
  ): Promise<ChargingPrice | undefined> {
    if (transactionId == null) {
      return undefined;
    }

    const transaction =
      await this._transactionEventRepository.readTransactionByStationIdAndTransactionId(
        tenantId,
        ocppConnectionName,
        transactionId.toString(),
      );
    if (transaction == null || transaction.connectorId == null) {
      return undefined;
    }
    const tariff = await this._tariffRepository.findByConnectorId(
      tenantId,
      transaction.connectorId,
    );
    return {
      kWhPrice: tariff?.pricePerKwh ?? 0,
      hourPrice: (tariff?.pricePerMin ?? 0) * 60,
      flatFee: tariff?.pricePerSession ?? 0,
    };
  }

  /**
   * Total cost so far. The persisted transaction is written by the primary MeterValues handler on
   * a separate queue, so it can still hold the previous interval when we get here; the reading
   * from the message being handled overrides it.
   *
   * @param currentReading - Meter register (kWh) and its timestamp, from the triggering message.
   */
  async calculateCost(
    tenantId: number,
    ocppConnectionName: string,
    transactionId: number | undefined,
    currentReading: { meterKwh: number; timestamp: string },
  ): Promise<number | undefined> {
    if (transactionId == null) {
      return undefined;
    }

    const transaction =
      await this._transactionEventRepository.readTransactionByStationIdAndTransactionId(
        tenantId,
        ocppConnectionName,
        transactionId.toString(),
      );
    if (transaction == null || transaction.connectorId == null) {
      return undefined;
    }

    transaction.totalKwh = currentReading.meterKwh - (transaction.meterStart ?? 0);
    const startTime = transaction.startTime;
    if (startTime != null) {
      transaction.timeSpentCharging = Math.max(
        0,
        Math.floor((Date.parse(currentReading.timestamp) - Date.parse(startTime)) / 1000),
      );
    }
    return await this._costCalculator.calculateTotalCost(tenantId, transaction);
  }

  async sendSetUserPrice(
    tenantId: number,
    ocppConnectionName: string,
    data: SetUserPriceData,
  ): Promise<void> {
    await this._send(tenantId, ocppConnectionName, CostMsgId.SetUserPrice, data);
  }

  async sendRunningCost(
    tenantId: number,
    ocppConnectionName: string,
    data: RunningCostData,
  ): Promise<void> {
    await this._send(tenantId, ocppConnectionName, CostMsgId.RunningCost, data);
  }

  /**
   * Resolves the station-wide DefaultPrice from its connectors' tariffs and sets it. DefaultPrice
   * is station-wide, so it only works when every connector shares the same tariff
   * if they differ, logs an error and sends nothing.
   *
   * @param reportedDefaultPrice stations reported price, if read otherwise null
   */
  async applyStationDefaultPrice(
    tenantId: number,
    ocppConnectionName: string,
    reportedDefaultPrice: string | null,
  ): Promise<void> {
    const connectors = await this._locationRepository.readConnectorsByStationId(
      tenantId,
      ocppConnectionName,
    );
    if (connectors.length === 0) {
      this._logger.warn(`No connectors found for ${ocppConnectionName}; not setting DefaultPrice.`);
      return;
    }

    const tariffIds = new Set(connectors.map((connector) => connector.tariffId ?? null));
    if (tariffIds.size > 1) {
      this._logger.error(
        `Connectors on ${ocppConnectionName} use different tariffs (${[...tariffIds].join(', ')}). ` +
          `DefaultPrice is station-wide and can not be set`,
      );
      return;
    }

    // All connectors share one tariff; load it (by connector) only when there is one to load.
    const [sharedTariffId] = [...tariffIds];
    const tariff =
      sharedTariffId != null
        ? await this._tariffRepository.findByConnectorId(tenantId, connectors[0].id!)
        : undefined;
    if (!tariff) {
      this._logger.warn(
        `No tariff configured for connectors on ${ocppConnectionName}; DefaultPrice will use zero prices.`,
      );
    }
    const priceParts = [
      tariff?.pricePerKwh ? `${tariff.pricePerKwh} ${tariff.currency}/kWh` : undefined,
      tariff?.pricePerMin ? `${tariff.pricePerMin} ${tariff.currency}/minute` : undefined,
      tariff?.pricePerSession ? `${tariff.pricePerSession} ${tariff.currency}` : undefined,
    ].filter((part) => part !== undefined);

    const newPrice = {
      priceText: priceParts.length > 0 ? priceParts.join(' + ') : 'No tariff configured',
      chargingPrice: {
        kWhPrice: tariff?.pricePerKwh ?? 0,
        hourPrice: (tariff?.pricePerMin ?? 0) * 60,
        flatFee: tariff?.pricePerSession ?? 0,
      },
    };

    // Skip if the value on station is what we were about to send
    const value = JSON.stringify(newPrice);
    if (reportedDefaultPrice != null && sameJson(reportedDefaultPrice, value)) {
      return;
    }

    await this.sendDefaultPrice(tenantId, ocppConnectionName, newPrice);
  }

  async sendDefaultPrice(
    tenantId: number,
    ocppConnectionName: string,
    data: DefaultPriceData,
  ): Promise<void> {
    const value = JSON.stringify(data);

    const payload: OCPP1_6.ChangeConfigurationRequest = {
      key: DEFAULT_PRICE_KEY,
      value,
    };
    const confirmation = await this._ocppSender.sendCall({
      ocppConnectionName,
      tenantId,
      protocol: OCPPVersion.OCPP1_6,
      action: OCPP_CallAction.ChangeConfiguration,
      eventGroup: EventGroup.CaliforniaPricing,
      payload,
    });
    if (!confirmation.success) {
      this._logger.error(
        `Failed to set DefaultPrice on ${ocppConnectionName}: ${confirmation.payload}`,
      );
    }
  }

  async sendFinalCost(
    tenantId: number,
    ocppConnectionName: string,
    data: FinalCostData,
  ): Promise<void> {
    await this._send(tenantId, ocppConnectionName, CostMsgId.FinalCost, data);
  }

  async requestCustomDisplayCostAndPrice(
    tenantId: number,
    ocppConnectionName: string,
  ): Promise<void> {
    const confirmation = await this._ocppSender.sendCall({
      ocppConnectionName,
      tenantId,
      protocol: OCPPVersion.OCPP1_6,
      action: OCPP_CallAction.GetConfiguration,
      eventGroup: EventGroup.CaliforniaPricing,
      payload: {
        key: [CUSTOM_DISPLAY_COST_AND_PRICE_KEY],
      } satisfies OCPP1_6.GetConfigurationRequest,
    });
    if (!confirmation.success) {
      this._logger.error(
        `Failed to send getConfiguration to ${ocppConnectionName}: ${confirmation.payload}`,
      );
    }
  }

  private async _send(
    tenantId: number,
    ocppConnectionName: string,
    messageId: CostMsgId,
    data: unknown,
  ): Promise<void> {
    const payload: OCPP1_6.DataTransferRequest = {
      vendorId: COSTMSG_VENDOR_ID,
      messageId,
      data: JSON.stringify(data),
    };
    const confirmation = await this._ocppSender.sendCall({
      ocppConnectionName,
      tenantId,
      protocol: OCPPVersion.OCPP1_6,
      action: OCPP_CallAction.DataTransfer,
      eventGroup: EventGroup.CaliforniaPricing,
      payload,
    });
    if (!confirmation.success) {
      this._logger.error(
        `Failed to send costmsg ${messageId} to ${ocppConnectionName}: ${confirmation.payload}`,
      );
    }
  }
}
