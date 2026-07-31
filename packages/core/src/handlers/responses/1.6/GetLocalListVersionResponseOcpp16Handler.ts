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
import type { ILocalAuthListRepository } from '@dal/interfaces/repositories.js';

@AsResponseHandler([OCPPVersion.OCPP1_6], OCPP_CallAction.GetLocalListVersion)
export class GetLocalListVersionResponseOcpp16Handler extends AbstractHandler {
  protected _localAuthListRepository: ILocalAuthListRepository;

  constructor({
    logger,
    localAuthListRepository,
  }: AbstractHandlerDependencies & {
    localAuthListRepository: ILocalAuthListRepository;
  }) {
    super(logger);
    this._localAuthListRepository = localAuthListRepository;
  }

  async handle(
    message: IMessage<OCPP1_6.GetLocalListVersionResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.info(
      this.createHandlerReceivedMessageLog('GetLocalListVersionResponse'),
      message,
      props,
    );

    await this._localAuthListRepository.validateOrReplaceLocalListVersionForStation(
      message.context.tenantId,
      message.payload.listVersion,
      message.context.ocppConnectionName,
    );
  }
}
