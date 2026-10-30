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
  OCPP1_6,
  OCPP_CallAction,
  OCPPVersion,
} from '@citrineos/types';
import type { IChargingProfileRepository } from '@citrineos/dal';
import { OCPP1_6_Mapper } from '@citrineos/dal';

@AsResponseHandler([OCPPVersion.OCPP1_6], OCPP_CallAction.SetChargingProfile)
export class SetChargingProfileResponseOcpp16Handler extends AbstractHandler {
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
    message: IMessage<OCPP1_6.SetChargingProfileResponse, OCPP1_6.SetChargingProfileRequest>,
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
      const originalRequest = message.request;

      if (originalRequest) {
        const mapped = OCPP1_6_Mapper.ChargingProfileMapper.fromSetChargingProfileRequest(
          originalRequest.csChargingProfiles,
        );

        await this._chargingProfileRepository.deactivateChargingProfiles(
          tenantId,
          ocppConnectionName,
          {
            evseId: originalRequest.connectorId,
            stackLevel: mapped.stackLevel,
            chargingProfilePurpose: mapped.chargingProfilePurpose,
            excludeChargingProfileId: mapped.id,
          },
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
