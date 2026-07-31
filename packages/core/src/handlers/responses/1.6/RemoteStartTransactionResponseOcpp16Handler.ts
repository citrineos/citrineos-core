// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  AbstractHandler,
  type AbstractHandlerDependencies,
  AsResponseHandler,
  ChargingLimitSourceEnum,
  type HandlerProperties,
  type IMessage,
  MessageOrigin,
  OCPP1_6,
  OCPP_CallAction,
  OCPPVersion,
} from '@citrineos/base';
import { OCPP1_6_Mapper } from '@/dal/index.js';
import type {
  IChargingProfileRepository,
  IOCPPMessageRepository,
} from '@dal/interfaces/repositories.js';

@AsResponseHandler([OCPPVersion.OCPP1_6], OCPP_CallAction.RemoteStartTransaction)
export class RemoteStartTransactionResponseOcpp16Handler extends AbstractHandler {
  protected _ocppMessageRepository: IOCPPMessageRepository;
  protected _chargingProfileRepository: IChargingProfileRepository;

  constructor({
    logger,
    ocppMessageRepository,
    chargingProfileRepository,
  }: AbstractHandlerDependencies & {
    ocppMessageRepository: IOCPPMessageRepository;
    chargingProfileRepository: IChargingProfileRepository;
  }) {
    super(logger);
    this._ocppMessageRepository = ocppMessageRepository;
    this._chargingProfileRepository = chargingProfileRepository;
  }

  async handle(
    message: IMessage<OCPP1_6.RemoteStartTransactionResponse>,
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
      const originalMessage = await this._ocppMessageRepository.readOnlyOneByQuery(tenantId, {
        where: {
          tenantId: tenantId,
          ocppConnectionName: ocppConnectionName,
          correlationId: message.context.correlationId,
          origin: MessageOrigin.ChargingStationManagementSystem,
        },
      });

      if (originalMessage) {
        const originalRequest = originalMessage.message[3] as OCPP1_6.RemoteStartTransactionRequest;

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
