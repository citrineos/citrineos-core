// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { AbstractHandler, type AbstractHandlerDependencies, AsResponseHandler, type IMessage } from '@citrineos/base';
import { type HandlerProperties, OCPP1_6, OCPP_CallAction, OCPPVersion } from '@citrineos/types';

@AsResponseHandler([OCPPVersion.OCPP1_6], OCPP_CallAction.ClearCache)
export class ClearCacheResponseOcpp16Handler extends AbstractHandler {
  constructor({ logger }: AbstractHandlerDependencies) {
    super(logger);
  }

  async handle(
    message: IMessage<OCPP1_6.ClearCacheResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.info(this.createHandlerReceivedMessageLog('ClearCacheResponse'), message, props);
  }
}
