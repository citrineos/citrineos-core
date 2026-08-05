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

@AsResponseHandler([OCPPVersion.OCPP1_6], OCPP_CallAction.TriggerMessage)
export class TriggerMessageResponseOcpp16Handler extends AbstractHandler {
  constructor({ logger }: AbstractHandlerDependencies) {
    super(logger);
  }

  async handle(
    message: IMessage<OCPP1_6.TriggerMessageResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug(
      this.createHandlerReceivedMessageLog('TriggerMessageResponse'),
      message,
      props,
    );

    if (message.payload.status !== OCPP1_6.TriggerMessageResponseStatus.Accepted) {
      this._logger.error('TriggerMessage failed with status:', message);
    }
  }
}
