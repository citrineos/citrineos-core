// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  AbstractHandler,
  type AbstractHandlerDependencies,
  AsRequestHandler,
  type IMessage,
  type IOcppSender,
} from '@citrineos/base';
import {
  type HandlerProperties,
  OCPP1_6,
  OCPP_CallAction,
  OCPPVersion,
  SecurityEventNotificationTypeEnumSchema,
} from '@citrineos/types';
import type { ISecurityEventRepository } from '@citrineos/dal';

@AsRequestHandler([OCPPVersion.OCPP1_6], OCPP_CallAction.SecurityEventNotification)
export class SecurityEventNotificationRequestOcpp16Handler extends AbstractHandler {
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
    message: IMessage<OCPP1_6.SecurityEventNotificationRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug(
      this.createHandlerReceivedMessageLog('SecurityEventNotificationRequest'),
      message,
      props,
    );

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

    const response: OCPP1_6.SecurityEventNotificationResponse = {};
    const messageConfirmation = await this._ocppSender.sendCallResultWithMessage(message, response);
    this._logger.debug(
      this.createHandlerSentMessageLog('SecurityEventNotificationResponse'),
      messageConfirmation,
    );
  }
}
