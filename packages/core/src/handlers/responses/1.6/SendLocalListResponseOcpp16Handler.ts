// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { AbstractHandler, type AbstractHandlerDependencies, AsResponseHandler, type IMessage, type IOcppSender } from '@citrineos/base';
import { EventGroup, type HandlerProperties, OCPP1_6, OCPP_CallAction, OCPPVersion } from '@citrineos/types';
import type { ILocalAuthListRepository } from '@dal/interfaces/repositories.js';

@AsResponseHandler([OCPPVersion.OCPP1_6], OCPP_CallAction.SendLocalList)
export class SendLocalListResponseOcpp16Handler extends AbstractHandler {
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
    message: IMessage<OCPP1_6.SendLocalListResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.info(
      this.createHandlerReceivedMessageLog('SendLocalListResponse'),
      message,
      props,
    );

    const stationId = message.context.ocppConnectionName;

    const sendLocalListRequest =
      await this._localAuthListRepository.getSendLocalListRequestByStationIdAndCorrelationId(
        message.context.tenantId,
        stationId,
        message.context.correlationId,
      );

    if (!sendLocalListRequest) {
      this._logger.error(
        `Unable to process OCPP 1.6 SendLocalListResponse. SendLocalListRequest not found for StationId ${stationId} by CorrelationId ${message.context.correlationId}.`,
      );
      return;
    }

    switch (message.payload.status) {
      case OCPP1_6.SendLocalListResponseStatus.Accepted:
        await this._localAuthListRepository.createOrUpdateLocalListVersionFromStationIdAndSendLocalList(
          message.context.tenantId,
          stationId,
          sendLocalListRequest,
        );
        break;
      case OCPP1_6.SendLocalListResponseStatus.Failed:
        this._logger.error(
          `OCPP 1.6 SendLocalListRequest failed for StationId ${stationId}: ${message.context.correlationId}, ${JSON.stringify(sendLocalListRequest)}.`,
        );
        break;
      case OCPP1_6.SendLocalListResponseStatus.VersionMismatch: {
        this._logger.error(
          `OCPP 1.6 SendLocalListRequest version mismatch for StationId ${stationId}; firing GetLocalListVersion to resync.`,
        );
        const messageConfirmation = await this._ocppSender.sendCall({
          ocppConnectionName: stationId,
          tenantId: message.context.tenantId,
          protocol: OCPPVersion.OCPP1_6,
          action: OCPP_CallAction.GetLocalListVersion,
          eventGroup: EventGroup.EVDriver,
          payload: {} as OCPP1_6.GetLocalListVersionRequest,
        });
        if (!messageConfirmation.success) {
          this._logger.error(
            `Unable to send OCPP 1.6 GetLocalListVersion for StationId ${stationId} after version mismatch.`,
            messageConfirmation,
          );
        }
        break;
      }
      case OCPP1_6.SendLocalListResponseStatus.NotSupported:
        this._logger.error(
          `OCPP 1.6 SendLocalListRequest reported NotSupported for StationId ${stationId}.`,
        );
        break;
      default:
        this._logger.error(
          `Unknown OCPP 1.6 SendLocalListResponseStatus: ${message.payload.status}.`,
        );
        break;
    }
  }
}
