// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  AbstractHandler,
  type AbstractHandlerDependencies,
  AsResponseHandler,
  type IMessage,
} from '@citrineos/base';
import { type HandlerProperties, OCPP1_6, OCPP_CallAction, OCPPVersion } from '@citrineos/types';
import type { IChargingProfileRepository } from '@citrineos/dal';
import { OCPP1_6_Mapper } from '@citrineos/dal';

@AsResponseHandler([OCPPVersion.OCPP1_6], OCPP_CallAction.ClearChargingProfile)
export class ClearChargingProfileResponseOcpp16Handler extends AbstractHandler {
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
    message: IMessage<OCPP1_6.ClearChargingProfileResponse, OCPP1_6.ClearChargingProfileRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.info(
      this.createHandlerReceivedMessageLog('ClearChargingProfileResponse'),
      message,
      props,
    );

    const tenantId = message.context.tenantId;
    if (message.payload.status === OCPP1_6.ClearChargingProfileResponseStatus.Accepted) {
      const ocppConnectionName: string = message.context.ocppConnectionName;
      const originalRequest = message.request;
      if (!originalRequest) {
        this._logger.error(
          `OCPP 1.6 ClearChargingProfile accepted but original request not found by CorrelationId ${message.context.correlationId}.`,
        );
        return;
      }
      // Set existed profiles to isActive false
      await this._chargingProfileRepository.updateAllByQuery(
        tenantId,
        {
          isActive: false,
        },
        {
          where: {
            tenantId: tenantId,
            ocppConnectionName: ocppConnectionName,
            isActive: true,
            ...this._clearedProfileCriteria(originalRequest),
          },
          returning: false,
        },
      );
    } else {
      this._logger.error(
        `OCPP 1.6 ClearChargingProfile failed: ${JSON.stringify(message.payload)}`,
      );
    }
  }

  private _clearedProfileCriteria(
    request: OCPP1_6.ClearChargingProfileRequest,
  ): Record<string, unknown> {
    if (request.id != null) {
      return { id: request.id };
    }
    const criteria: Record<string, unknown> = {};
    if (request.connectorId != null) {
      criteria.evseId = request.connectorId;
    }
    if (request.chargingProfilePurpose != null) {
      criteria.chargingProfilePurpose =
        OCPP1_6_Mapper.ChargingProfileMapper.fromChargingProfilePurpose(
          request.chargingProfilePurpose,
        );
    }
    if (request.stackLevel != null) {
      criteria.stackLevel = request.stackLevel;
    }
    return criteria;
  }
}
