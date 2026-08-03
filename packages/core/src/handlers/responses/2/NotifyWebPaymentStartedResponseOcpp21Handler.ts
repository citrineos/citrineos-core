// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  AbstractHandler,
  type AbstractHandlerDependencies,
  AsResponseHandler,
  type IMessage,
} from '@citrineos/base';
import { type HandlerProperties, OCPP2_1, OCPP_CallAction, OCPPVersion } from '@citrineos/types';

@AsResponseHandler([OCPPVersion.OCPP2_1], OCPP_CallAction.NotifyWebPaymentStarted)
export class NotifyWebPaymentStartedResponseOcpp21Handler extends AbstractHandler {
  constructor({ logger }: AbstractHandlerDependencies) {
    super(logger);
  }

  /**
   * C25: Handle NotifyWebPaymentStartedResponse from CS.
   *
   * CSMS sends NotifyWebPaymentStartedRequest to CS to lock the EVSE during the
   * web payment process (C25.FR.21). This handler processes the CS acknowledgment.
   */
  async handle(
    message: IMessage<OCPP2_1.NotifyWebPaymentStartedResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.info(
      this.createHandlerReceivedMessageLog('NotifyWebPaymentStartedResponse'),
      message,
      props,
    );

    this._logger.info(
      `NotifyWebPaymentStarted acknowledged by station ${message.context.ocppConnectionName} ` +
        `(correlationId=${message.context.correlationId})`,
    );
  }
}
