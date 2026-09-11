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
 * Observes 1.6 Authorize requests and, when the California pricing customization is enabled for
 * the station, sends a SetUserPrice DataTransfer for the identified driver. Does not send the
 * AuthorizeResponse — that remains owned by the primary Authorize handler.
 *
 * Not registered in CALIFORNIA_PRICING_HANDLERS: cost calculation does not take the Authorization
 * TariffId into account, so there is no driver-specific price to send yet.
 */
@AsRequestHandler([OCPPVersion.OCPP1_6], OCPP_CallAction.Authorize)
export class SetUserPriceCaliforniaPricingOcpp16Handler extends AbstractHandler {
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
    message: IMessage<OCPP1_6.AuthorizeRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug(this.createHandlerReceivedMessageLog('AuthorizeRequest'), message, props);

    const tenantId = message.context.tenantId;
    const ocppConnectionName = message.context.ocppConnectionName;

    if (!(await this._californiaPricingService.isEnabled(tenantId, ocppConnectionName))) {
      return;
    }
  }
}
