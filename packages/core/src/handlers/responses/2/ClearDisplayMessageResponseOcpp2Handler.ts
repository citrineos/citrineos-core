// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  AbstractHandler,
  type AbstractHandlerDependencies,
  AsResponseHandler,
  type IMessage,
  type IOcppSender,
  OCPP2_request_types,
  OCPP2_response_types,
} from '@citrineos/base';
import {
  ChargingStationSequenceTypeEnum,
  ClearMessageStatusEnum,
  type ClearMessageStatusEnumType,
  EventGroup,
  type HandlerProperties,
  OCPP_2_VER_LIST,
  OCPP_CallAction,
} from '@citrineos/types';
import type { IMessageInfoRepository } from '@dal/interfaces/repositories.js';
import { IdGenerator } from '@util/index.js';

@AsResponseHandler(OCPP_2_VER_LIST, OCPP_CallAction.ClearDisplayMessage)
export class ClearDisplayMessageResponseOcpp2Handler extends AbstractHandler {
  protected _ocppSender: IOcppSender;
  protected _messageInfoRepository: IMessageInfoRepository;
  private _idGenerator: IdGenerator;

  constructor({
    logger,
    ocppSender,
    messageInfoRepository,
    idGenerator,
  }: AbstractHandlerDependencies & {
    ocppSender: IOcppSender;
    messageInfoRepository: IMessageInfoRepository;
    idGenerator: IdGenerator;
  }) {
    super(logger);
    this._ocppSender = ocppSender;
    this._messageInfoRepository = messageInfoRepository;
    this._idGenerator = idGenerator;
  }

  async handle(
    message: IMessage<OCPP2_response_types.ClearDisplayMessageResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug(
      this.createHandlerReceivedMessageLog('ClearDisplayMessageResponse'),
      message,
      props,
    );

    const status = message.payload.status as ClearMessageStatusEnumType;
    // when charger station accepts the clear message info request
    // we trigger a get all display messages request to update stored message info in db
    if (status !== ClearMessageStatusEnum.Accepted) {
      return;
    }

    await this._messageInfoRepository.deactivateAllByStationId(
      message.context.tenantId,
      message.context.ocppConnectionName,
    );
    await this._ocppSender.sendCall({
      ocppConnectionName: message.context.ocppConnectionName,
      tenantId: message.context.tenantId,
      protocol: message.protocol,
      action: OCPP_CallAction.GetDisplayMessages,
      eventGroup: EventGroup.Configuration,
      payload: {
        requestId: await this._idGenerator.generateRequestId(
          message.context.tenantId,
          message.context.ocppConnectionName,
          ChargingStationSequenceTypeEnum.getDisplayMessages,
        ),
      } as OCPP2_request_types.GetDisplayMessagesRequest,
    });
  }
}
