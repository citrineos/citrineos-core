// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  AbstractHandler,
  type AbstractHandlerDependencies,
  AsRequestHandler,
  type HandlerProperties,
  type IMessage,
  type IOcppSender,
  OCPP2_request_types,
  OCPP2_response_types,
  OCPP_2_VER_LIST,
  OCPP_CallAction,
  SecurityEventNotificationTypeEnumSchema,
} from '@citrineos/base';
import type { ISecurityEventRepository } from '@/dal/index.js';

@AsRequestHandler(OCPP_2_VER_LIST, OCPP_CallAction.SecurityEventNotification)
export class SecurityEventNotificationRequestOcpp2Handler extends AbstractHandler {
  protected _ocppSender: IOcppSender;
  protected _securityEventRepository: ISecurityEventRepository;

  constructor({
    logger,
    ocppSender,
    securityEventRepository,
  }: AbstractHandlerDependencies & {
    ocppSender: IOcppSender;
    securityEventRepository: ISecurityEventRepository;
  }) {
    super(logger);

    this._ocppSender = ocppSender;
    this._securityEventRepository = securityEventRepository;
  }

  async handle(
    message: IMessage<OCPP2_request_types.SecurityEventNotificationRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug(
      this.createHandlerReceivedMessageLog('SecurityEventNotificationRequest'),
      message,
      props,
    );

    // Warn if there is a mismatch against the standard security event list
    if (!SecurityEventNotificationTypeEnumSchema.safeParse(message.payload.type).success) {
      this._logger.warn(
        'SecurityEventNotification reported an unknown security event type',
        message.payload.type,
      );
    }

    await this._securityEventRepository.createByStationId(
      message.context.tenantId,
      message.payload,
      message.context.ocppConnectionName,
    );
    await this._ocppSender.sendCallResultWithMessage(
      message,
      {} as OCPP2_response_types.SecurityEventNotificationResponse,
    );
  }
}
