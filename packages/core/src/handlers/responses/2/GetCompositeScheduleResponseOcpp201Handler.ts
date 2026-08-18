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
  GenericStatusEnum,
  type HandlerProperties,
  OCPP_CallAction,
  OCPPVersion,
  OCPP2_response_types,
} from '@citrineos/types';
import type { IChargingProfileRepository } from '@dal/interfaces/repositories.js';
import * as OCPP2_0_1_Mapper from '@dal/layers/sequelize/mapper/2.0.1/index.js';

// TODO: 2.1 GetCompositeSchedule needs its own handler (or a 2.1 mapper) — see
// SmartChargingModule's TODO comment following the original _handleGetCompositeSchedule.
@AsResponseHandler([OCPPVersion.OCPP2_0_1], OCPP_CallAction.GetCompositeSchedule)
export class GetCompositeScheduleResponseOcpp201Handler extends AbstractHandler {
  protected _chargingProfileRepository: IChargingProfileRepository;

  constructor({
    logger,
    chargingProfileRepository,
  }: AbstractHandlerDependencies & { chargingProfileRepository: IChargingProfileRepository }) {
    super(logger);
    this._chargingProfileRepository = chargingProfileRepository;
  }

  async handle(
    message: IMessage<OCPP2_response_types.GetCompositeScheduleResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.info(
      this.createHandlerReceivedMessageLog('GetCompositeScheduleResponse'),
      message,
      props,
    );

    const tenantId = message.context.tenantId;
    const response = message.payload;
    if (response.status === GenericStatusEnum.Accepted) {
      if (response.schedule) {
        const compositeSchedule = await this._chargingProfileRepository.createCompositeSchedule(
          tenantId,
          OCPP2_0_1_Mapper.ChargingProfileMapper.fromCompositeScheduleType(response.schedule),
          message.context.ocppConnectionName,
        );
        this._logger.info(`Composite schedule created: ${JSON.stringify(compositeSchedule)}`);
      } else {
        this._logger.error(
          `Missing schedule in response: ${response.status} ${JSON.stringify(response.statusInfo)}`,
        );
      }
    } else {
      this._logger.error(
        `Failed to get composite schedule: ${response.status} ${JSON.stringify(response.statusInfo)}`,
      );
    }
  }
}
