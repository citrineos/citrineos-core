// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { OCPP1_6_Mapper } from '@citrineos/dal';
import {
  AbstractHandler,
  type AbstractHandlerDependencies,
  AsResponseHandler,
  type IMessage,
} from '@citrineos/base';
import {
  ChargingLimitSourceEnum,
  type HandlerProperties,
  OCPP1_6,
  OCPP_CallAction,
  OCPPVersion,
} from '@citrineos/types';
import type { IChargingProfileRepository } from '@citrineos/dal';

@AsResponseHandler([OCPPVersion.OCPP1_6], OCPP_CallAction.RemoteStartTransaction)
export class RemoteStartTransactionResponseOcpp16Handler extends AbstractHandler {
  protected _chargingProfileRepository: IChargingProfileRepository;

  constructor({
    logger,
    chargingProfileRepository,
  }: AbstractHandlerDependencies & {
    chargingProfileRepository: IChargingProfileRepository;
  }) {
    super(logger);
    this._chargingProfileRepository = chargingProfileRepository;
  }

  async handle(
    message: IMessage<
      OCPP1_6.RemoteStartTransactionResponse,
      OCPP1_6.RemoteStartTransactionRequest
    >,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.info(
      this.createHandlerReceivedMessageLog('RemoteStartTransactionResponse'),
      message,
      props,
    );

    const tenantId = message.context.tenantId;
    const ocppConnectionName: string = message.context.ocppConnectionName;

    if (message.payload.status === OCPP1_6.RemoteStartTransactionResponseStatus.Accepted) {
      const originalRequest = message.request;

      if (originalRequest) {
        if (originalRequest.chargingProfile) {
          const mapped = OCPP1_6_Mapper.ChargingProfileMapper.fromRemoteStartChargingProfile(
            originalRequest.chargingProfile,
          );

          await this._chargingProfileRepository.createOrUpdateChargingProfile(
            tenantId,
            mapped,
            ocppConnectionName,
            originalRequest.connectorId ?? null,
            ChargingLimitSourceEnum.CSO,
            true,
          );
        }
      } else {
        this._logger.error(
          `OCPP 1.6 RemoteStartTransaction accepted but original request not found by CorrelationId ${message.context.correlationId}.`,
        );
      }
    } else {
      this._logger.error(
        `OCPP 1.6 RemoteStartTransaction rejected: ${JSON.stringify(message.payload)}`,
      );
    }
  }
}
