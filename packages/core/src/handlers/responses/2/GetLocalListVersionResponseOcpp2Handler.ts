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
import type { ILocalAuthListRepository } from '@dal/interfaces/repositories.js';

@AsResponseHandler(OCPP_2_VER_LIST, OCPP_CallAction.GetLocalListVersion)
export class GetLocalListVersionResponseOcpp2Handler extends AbstractHandler {
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
    message: IMessage<OCPP2_response_types.GetLocalListVersionResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.info(
      this.createHandlerReceivedMessageLog('GetLocalListVersionResponse'),
      message,
      props,
    );

    await this._localAuthListRepository.validateOrReplaceLocalListVersionForStation(
      message.context.tenantId,
      message.payload.versionNumber,
      message.context.ocppConnectionName,
    );
  }
}
