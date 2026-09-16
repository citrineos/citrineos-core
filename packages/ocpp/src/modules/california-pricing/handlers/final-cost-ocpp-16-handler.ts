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
 * Observes 1.6 StopTransaction and, when the customization is enabled, sends a FinalCost with the
 * total for the session.
 */
@AsRequestHandler([OCPPVersion.OCPP1_6], OCPP_CallAction.StopTransaction)
export class FinalCostCaliforniaPricingOcpp16Handler extends AbstractHandler {
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
    message: IMessage<OCPP1_6.StopTransactionRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug(
      this.createHandlerReceivedMessageLog('StopTransactionRequest'),
      message,
      props,
    );

    const tenantId = message.context.tenantId;
    const ocppConnectionName = message.context.ocppConnectionName;
    const { transactionId, meterStop, timestamp } = message.payload;

    if (!(await this._californiaPricingService.isEnabled(tenantId, ocppConnectionName))) {
      return;
    }
    const cost = await this._californiaPricingService.calculateCost(
      tenantId,
      ocppConnectionName,
      transactionId,
      { meterKwh: meterStop / 1000, timestamp },
    );
    const finalCost = cost ?? 0;

    await this._californiaPricingService.sendFinalCost(tenantId, ocppConnectionName, {
      transactionId,
      cost: finalCost,
      priceText: `Final cost is ${finalCost}`,
    });
  }
}
