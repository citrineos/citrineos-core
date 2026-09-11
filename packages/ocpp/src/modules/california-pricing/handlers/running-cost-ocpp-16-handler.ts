// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  AbstractHandler,
  type AbstractHandlerDependencies,
  AsRequestHandler,
  type IMessage,
  MeterValueUtils,
} from '@citrineos/base';
import {
  type HandlerProperties,
  MeasurandEnum,
  OCPP1_6,
  OCPP_CallAction,
  OCPPVersion,
} from '@citrineos/types';
import { OCPP1_6_Mapper } from '@citrineos/dal';
import type { CaliforniaPricingService } from '../california-pricing-service.js';

/**
 * Observes 1.6 MeterValues and, when the customization is enabled, sends a RunningCost update
 * carrying the unit price so the charger can display a running cost between meter intervals.
 * Does not send the MeterValuesResponse — that remains owned by the primary handler.
 */
@AsRequestHandler([OCPPVersion.OCPP1_6], OCPP_CallAction.MeterValues)
export class RunningCostCaliforniaPricingOcpp16Handler extends AbstractHandler {
  protected _californiaPricingService: CaliforniaPricingService;

  constructor({
    logger,
    californiaPricingService,
  }: AbstractHandlerDependencies & {
    californiaPricingService: CaliforniaPricingService;
  }) {
    super(logger);
    this._californiaPricingService = californiaPricingService;
  }

  async handle(
    message: IMessage<OCPP1_6.MeterValuesRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug(this.createHandlerReceivedMessageLog('MeterValuesRequest'), message, props);

    const tenantId = message.context.tenantId;
    const ocppConnectionName = message.context.ocppConnectionName;
    const { connectorId, transactionId, meterValue } = message.payload;

    if (transactionId == null || connectorId === 0) {
      return;
    }
    if (!(await this._californiaPricingService.isEnabled(tenantId, ocppConnectionName))) {
      return;
    }

    const reading = RunningCostCaliforniaPricingOcpp16Handler.latestRegisterReading(meterValue);
    if (reading == null) {
      return;
    }

    const price = await this._californiaPricingService.resolvePrice(
      tenantId,
      ocppConnectionName,
      transactionId,
    );
    const cost = await this._californiaPricingService.calculateCost(
      tenantId,
      ocppConnectionName,
      transactionId,
      reading,
    );

    await this._californiaPricingService.sendRunningCost(tenantId, ocppConnectionName, {
      transactionId,
      timestamp: reading.timestamp,
      meterValue: Math.round(reading.meterKwh * 1000),
      cost: cost ?? 0,
      state: 'Charging',
      chargingPrice: price ?? {},
    });
  }

  /**
   * Latest Energy.Active.Import.Register reading in kWh with its timestamp, using MeterValueUtils
   * for unit/phase normalization. Undefined when the batch carries no such reading, in which case
   * there is nothing to base a running cost on.
   */
  private static latestRegisterReading(
    meterValues: OCPP1_6.MeterValuesRequest['meterValue'],
  ): { meterKwh: number; timestamp: string } | undefined {
    const dtos = meterValues.map((mv) => OCPP1_6_Mapper.MeterValueMapper.fromMeterValueType(mv));
    let latest: { meterKwh: number; timestamp: string } | undefined;
    let latestTs = Number.NEGATIVE_INFINITY;
    for (const mv of dtos) {
      const sample = mv.sampledValue.find(
        (sv) =>
          (!sv.measurand || sv.measurand === MeasurandEnum['Energy.Active.Import.Register']) &&
          !sv.phase,
      );
      const ts = Date.parse(mv.timestamp);
      if (sample && ts >= latestTs) {
        latestTs = ts;
        latest = { meterKwh: MeterValueUtils.normalizeToKwh(sample), timestamp: mv.timestamp };
      }
    }
    return latest;
  }
}
