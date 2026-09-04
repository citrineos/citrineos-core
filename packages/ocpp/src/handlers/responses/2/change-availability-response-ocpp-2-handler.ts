// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  AbstractHandler,
  type AbstractHandlerDependencies,
  AsResponseHandler,
  type IMessage,
} from '@citrineos/base';
import {
  type HandlerProperties,
  OCPP_2_VER_LIST,
  OCPP_CallAction,
  OCPP2_response_types,
} from '@citrineos/types';

@AsResponseHandler(OCPP_2_VER_LIST, OCPP_CallAction.ChangeAvailability)
export class ChangeAvailabilityResponseOcpp2Handler extends AbstractHandler {
  constructor({ logger }: AbstractHandlerDependencies) {
    super(logger);
  }

  async handle(
    message: IMessage<OCPP2_response_types.ChangeAvailabilityResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug(
      this.createHandlerReceivedMessageLog('ChangeAvailabilityResponse'),
      message,
      props,
    );
  }
}
