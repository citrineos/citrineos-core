// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  AbstractHandler,
  type AbstractHandlerDependencies,
  AsRequestHandler,
  type IMessage,
} from '@citrineos/base';
import { type HandlerProperties, OCPP1_6, OCPP_CallAction, OCPPVersion } from '@citrineos/types';
import type { CaliforniaPricingService } from '../california-pricing-service.js';

/**
 * on bootup, request CustomDisplayCostAndPrice configuration
 */
@AsRequestHandler([OCPPVersion.OCPP1_6], OCPP_CallAction.BootNotification)
export class CustomDisplayCostAndPriceOcpp16Handler extends AbstractHandler {
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
    message: IMessage<OCPP1_6.BootNotificationRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug(
      this.createHandlerReceivedMessageLog('BootNotificationRequest'),
      message,
      props,
    );

    const tenantId = message.context.tenantId;
    const ocppConnectionName = message.context.ocppConnectionName;

    await this._californiaPricingService.requestCustomDisplayCostAndPrice(
      tenantId,
      ocppConnectionName,
    );
  }
}
