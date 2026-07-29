// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  AbstractHandler,
  type AbstractHandlerDependencies,
  AsRequestHandler,
  ErrorCode,
  type HandlerProperties,
  type IMessage,
  type IOcppSender,
  Namespace,
  OCPP2_common_types,
  OCPP2_request_types,
  OCPP2_response_types,
  OCPP_2_VER_LIST,
  OCPP_CallAction,
  OcppError,
} from '@citrineos/base';
import type {
  IDeviceModelRepository,
  IMessageInfoRepository,
  IOCPPMessageRepository,
} from '@dal/interfaces/repositories.js';
import { Component } from '@dal/layers/sequelize/index.js';
import { validateMessageContentType } from '@util/index.js';

@AsRequestHandler(OCPP_2_VER_LIST, OCPP_CallAction.NotifyDisplayMessages)
export class NotifyDisplayMessagesRequestOcpp2Handler extends AbstractHandler {
  protected _ocppSender: IOcppSender;
  protected _ocppMessageRepository: IOCPPMessageRepository;
  protected _deviceModelRepository: IDeviceModelRepository;
  protected _messageInfoRepository: IMessageInfoRepository;

  constructor({
    logger,
    ocppSender,
    ocppMessageRepository,
    deviceModelRepository,
    messageInfoRepository,
  }: AbstractHandlerDependencies & {
    ocppSender: IOcppSender;
    ocppMessageRepository: IOCPPMessageRepository;
    deviceModelRepository: IDeviceModelRepository;
    messageInfoRepository: IMessageInfoRepository;
  }) {
    super(logger);
    this._ocppSender = ocppSender;
    this._ocppMessageRepository = ocppMessageRepository;
    this._deviceModelRepository = deviceModelRepository;
    this._messageInfoRepository = messageInfoRepository;
  }

  async handle(
    message: IMessage<OCPP2_request_types.NotifyDisplayMessagesRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    // Validate requestId was provided in a previous GetDisplayMessagesRequest
    const requestId = message.payload.requestId;
    const previousRequest = await this._ocppMessageRepository.readAllByQuery(
      message.context.tenantId,
      {
        where: {
          tenantId: message.context.tenantId,
          ocppConnectionName: message.context.ocppConnectionName,
          action: OCPP_CallAction.GetDisplayMessages,
          message: {
            requestId: requestId,
          },
        },
        limit: 1,
      },
      Namespace.OCPPMessage,
    );

    if (!previousRequest || previousRequest.length === 0) {
      await this._ocppSender.sendCallErrorWithMessage(
        message,
        new OcppError(
          message.context.correlationId,
          ErrorCode.PropertyConstraintViolation,
          'RequestId was not provided in a GetDisplayMessagesRequest.',
        ),
      );
      return;
    }

    const messageInfoTypes = message.payload.messageInfo as OCPP2_common_types.MessageInfoType[];
    // Validate message content for each messageInfo item
    if (messageInfoTypes && messageInfoTypes.length > 0) {
      const validationErrors: string[] = [];
      for (const messageInfoType of messageInfoTypes) {
        const validationResult = validateMessageContentType(messageInfoType.message);
        if (!validationResult.isValid) {
          validationErrors.push(
            `Message ID ${messageInfoType.id}: ${validationResult.errorMessage}`,
          );
        }
      }
      if (validationErrors.length > 0) {
        const errorMessage = `Message content validation failed: ${validationErrors.join('; ')}`;
        const error = new OcppError(
          message.context.correlationId,
          ErrorCode.PropertyConstraintViolation,
          errorMessage,
        );
        await this._ocppSender.sendCallErrorWithMessage(message, error);
        return;
      }
    }

    this._logger.debug(
      this.createHandlerReceivedMessageLog('NotifyDisplayMessagesRequest'),
      message,
      props,
    );

    const tenantId = message.context.tenantId;

    for (const messageInfoType of messageInfoTypes) {
      let componentId: number | undefined;
      if (messageInfoType.display) {
        const component: Component = await this._deviceModelRepository.findOrCreateEvseAndComponent(
          tenantId,
          messageInfoType.display,
          message.context.ocppConnectionName,
        );
        componentId = component.id;
      }
      await this._messageInfoRepository.createOrUpdateByMessageInfoTypeAndStationId(
        tenantId,
        messageInfoType,
        message.context.ocppConnectionName,
        componentId,
      );
    }

    const response: OCPP2_response_types.NotifyDisplayMessagesResponse = {};

    const messageConfirmation = await this._ocppSender.sendCallResultWithMessage(message, response);
    this._logger.debug(
      this.createHandlerSentMessageLog('NotifyDisplayMessagesResponse'),
      messageConfirmation,
    );
  }
}
