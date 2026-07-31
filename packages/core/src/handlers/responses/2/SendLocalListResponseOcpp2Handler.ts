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
  EventGroup,
  type HandlerProperties,
  OCPP_2_VER_LIST,
  OCPP_CallAction,
  OCPPVersion,
  SendLocalListStatusEnum,
} from '@citrineos/types';
import type { ILocalAuthListRepository } from '@dal/interfaces/repositories.js';

@AsResponseHandler(OCPP_2_VER_LIST, OCPP_CallAction.SendLocalList)
export class SendLocalListResponseOcpp2Handler extends AbstractHandler {
  protected _ocppSender: IOcppSender;
  protected _localAuthListRepository: ILocalAuthListRepository;

  constructor({
    logger,
    ocppSender,
    localAuthListRepository,
  }: AbstractHandlerDependencies & {
    ocppSender: IOcppSender;
    localAuthListRepository: ILocalAuthListRepository;
  }) {
    super(logger);
    this._ocppSender = ocppSender;
    this._localAuthListRepository = localAuthListRepository;
  }

  async handle(
    message: IMessage<OCPP2_response_types.SendLocalListResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.info(
      this.createHandlerReceivedMessageLog('SendLocalListResponse'),
      message,
      props,
    );

    const ocppConnectionName = message.context.ocppConnectionName;

    const sendLocalListRequest =
      await this._localAuthListRepository.getSendLocalListRequestByStationIdAndCorrelationId(
        message.context.tenantId,
        ocppConnectionName,
        message.context.correlationId,
      );

    if (!sendLocalListRequest) {
      this._logger.error(
        `Unable to process SendLocalListResponse. SendLocalListRequest not found for StationId ${ocppConnectionName} by CorrelationId ${message.context.correlationId}.`,
      );
      return;
    }

    const sendLocalListResponse = message.payload;

    switch (sendLocalListResponse.status) {
      case SendLocalListStatusEnum.Accepted:
        await this._localAuthListRepository.createOrUpdateLocalListVersionFromStationIdAndSendLocalList(
          message.context.tenantId,
          ocppConnectionName,
          sendLocalListRequest,
        );
        break;
      case SendLocalListStatusEnum.Failed:
        // TODO: Surface alert for upstream handling
        this._logger.error(
          `SendLocalListRequest failed for StationId ${ocppConnectionName}: ${message.context.correlationId}, ${JSON.stringify(sendLocalListRequest)}.`,
        );
        break;
      case SendLocalListStatusEnum.VersionMismatch: {
        this._logger.error(
          `SendLocalListRequest version mismatch for StationId ${ocppConnectionName}: ${message.context.correlationId}, ${JSON.stringify(sendLocalListRequest)}.`,
        );
        this._logger.error(
          `Sending GetLocalListVersionRequest for StationId ${ocppConnectionName} due to SendLocalListRequest version mismatch.`,
        );
        const messageConfirmation = await this._ocppSender.sendCall({
          ocppConnectionName,
          tenantId: message.context.tenantId,
          protocol: OCPPVersion.OCPP2_1,
          action: OCPP_CallAction.GetLocalListVersion,
          eventGroup: EventGroup.EVDriver,
          payload: {} as OCPP2_request_types.GetLocalListVersionRequest,
        });
        if (!messageConfirmation.success) {
          this._logger.error(
            `Unable to send GetLocalListVersionRequest for StationId ${ocppConnectionName} due to SendLocalListRequest version mismatch.`,
            messageConfirmation,
          );
        }
        break;
      }
      default:
        this._logger.error(`Unknown SendLocalListStatusEnumType: ${message.payload.status}.`);
        break;
    }
  }
}
