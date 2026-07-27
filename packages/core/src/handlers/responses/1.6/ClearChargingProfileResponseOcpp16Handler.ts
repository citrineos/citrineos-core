// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { AbstractHandler, type AbstractHandlerDependencies, AsResponseHandler, type IMessage } from '@citrineos/base';
import { type HandlerProperties, OCPP1_6, OCPP_CallAction, OCPPVersion } from '@citrineos/types';
import type { IChargingProfileRepository } from '@dal/interfaces/repositories.js';

@AsResponseHandler([OCPPVersion.OCPP1_6], OCPP_CallAction.ClearChargingProfile)
export class ClearChargingProfileResponseOcpp16Handler extends AbstractHandler {
  protected _chargingProfileRepository: IChargingProfileRepository;

  constructor({
    logger,
    chargingProfileRepository,
  }: AbstractHandlerDependencies & { chargingProfileRepository: IChargingProfileRepository }) {
    super(logger);
    this._chargingProfileRepository = chargingProfileRepository;
  }

  async handle(
    message: IMessage<OCPP1_6.ClearChargingProfileResponse>,
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
}
