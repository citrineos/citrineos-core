// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  AbstractHandler,
  type AbstractHandlerDependencies,
  AsResponseHandler,
  type IMessage,
} from '@citrineos/base';
import { type HandlerProperties, OCPP1_6, OCPP_CallAction, OCPPVersion } from '@citrineos/types';
import type { CaliforniaPricingService } from '../california-pricing-service.js';
import { CUSTOM_DISPLAY_COST_AND_PRICE_KEY, DEFAULT_PRICE_KEY } from '../costmsg.js';

/**
 * Observes 1.6 GetConfiguration responses
 * when the charger reports CustomDisplayCostAndPrice=true
 * sets the station-wide DefaultPrice
 */
@AsResponseHandler([OCPPVersion.OCPP1_6], OCPP_CallAction.GetConfiguration)
export class DefaultPriceCaliforniaPricingOcpp16Handler extends AbstractHandler {
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
    message: IMessage<OCPP1_6.GetConfigurationResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug(
      this.createHandlerReceivedMessageLog('GetConfigurationResponse'),
      message,
      props,
    );

    const tenantId = message.context.tenantId;
    const ocppConnectionName = message.context.ocppConnectionName;

    const enabled = message.payload.configurationKey?.some(
      (config) => config.key === CUSTOM_DISPLAY_COST_AND_PRICE_KEY && config.value === 'true',
    );
    if (!enabled) {
      return;
    }
    const reportedDefaultPrice =
      message.payload.configurationKey?.find((config) => config.key === DEFAULT_PRICE_KEY)?.value ??
      null;

    await this._californiaPricingService.applyStationDefaultPrice(
      tenantId,
      ocppConnectionName,
      reportedDefaultPrice,
    );
  }
}
