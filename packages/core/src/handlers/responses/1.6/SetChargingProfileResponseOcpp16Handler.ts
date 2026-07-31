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
  ChargingLimitSourceEnum,
  type HandlerProperties,
  MessageOrigin,
  OCPP1_6,
  OCPP_CallAction,
  OCPPVersion,
} from '@citrineos/types';
import type {
  IChargingProfileRepository,
  IOCPPMessageRepository,
} from '@dal/interfaces/repositories.js';
import * as OCPP1_6_Mapper from '@dal/layers/sequelize/mapper/1.6/index.js';

@AsResponseHandler([OCPPVersion.OCPP1_6], OCPP_CallAction.SetChargingProfile)
export class SetChargingProfileResponseOcpp16Handler extends AbstractHandler {
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
    message: IMessage<OCPP1_6.SetChargingProfileResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.info(
      this.createHandlerReceivedMessageLog('SetChargingProfileResponse'),
      message,
      props,
    );

    const tenantId = message.context.tenantId;
    const ocppConnectionName: string = message.context.ocppConnectionName;

    if (message.payload.status === OCPP1_6.SetChargingProfileResponseStatus.Accepted) {
      const originalMessage = await this._ocppMessageRepository.readOnlyOneByQuery(tenantId, {
        where: {
          tenantId: tenantId,
          ocppConnectionName: ocppConnectionName,
          correlationId: message.context.correlationId,
          origin: MessageOrigin.ChargingStationManagementSystem,
        },
      });

      if (originalMessage) {
        const originalRequest = originalMessage.message[3] as OCPP1_6.SetChargingProfileRequest;
        const mapped = OCPP1_6_Mapper.ChargingProfileMapper.fromSetChargingProfileRequest(
          originalRequest.csChargingProfiles,
        );

        await this._chargingProfileRepository.createOrUpdateChargingProfile(
          tenantId,
          mapped,
          ocppConnectionName,
          originalRequest.connectorId,
          ChargingLimitSourceEnum.CSO,
          true,
        );
      } else {
        this._logger.error(
          `OCPP 1.6 SetChargingProfile accepted but original request not found by CorrelationId ${message.context.correlationId}.`,
        );
      }
    } else {
      this._logger.error(
        `OCPP 1.6 SetChargingProfile rejected: ${JSON.stringify(message.payload)}`,
      );
    }
  }
}
