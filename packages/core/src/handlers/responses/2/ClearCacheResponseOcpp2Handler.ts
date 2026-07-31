// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  AbstractHandler,
  type AbstractHandlerDependencies,
  AsResponseHandler,
  type HandlerProperties,
  type IMessage,
  OCPP2_response_types,
  OCPP_2_VER_LIST,
  OCPP_CallAction,
} from '@citrineos/base';

@AsResponseHandler(OCPP_2_VER_LIST, OCPP_CallAction.ClearCache)
export class ClearCacheResponseOcpp2Handler extends AbstractHandler {
  constructor({ logger }: AbstractHandlerDependencies) {
    super(logger);
  }

  async handle(
    message: IMessage<OCPP2_response_types.ClearCacheResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.info(this.createHandlerReceivedMessageLog('ClearCacheResponse'), message, props);
  }
}
