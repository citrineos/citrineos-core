// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  AbstractHandler,
  type AbstractHandlerDependencies,
  AsRequestHandler,
  type HandlerProperties,
  type IMessage,
  type IOcppSender,
  OCPP2_common_types,
  OCPP2_request_types,
  OCPP2_response_types,
  OCPP_2_VER_LIST,
  OCPP_CallAction,
} from '@citrineos/base';
import type { IChargingProfileRepository } from '@dal/interfaces/repositories.js';
import * as OCPP2_0_1_Mapper from '@dal/layers/sequelize/mapper/2.0.1/index.js';

@AsRequestHandler(OCPP_2_VER_LIST, OCPP_CallAction.ReportChargingProfiles)
export class ReportChargingProfilesRequestOcpp2Handler extends AbstractHandler {
  protected _ocppSender: IOcppSender;
  protected _chargingProfileRepository: IChargingProfileRepository;

  constructor({
    logger,
    ocppSender,
    chargingProfileRepository,
  }: AbstractHandlerDependencies & {
    ocppSender: IOcppSender;
    chargingProfileRepository: IChargingProfileRepository;
  }) {
    super(logger);
    this._ocppSender = ocppSender;
    this._chargingProfileRepository = chargingProfileRepository;
  }

  async handle(
    message: IMessage<OCPP2_request_types.ReportChargingProfilesRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.info(
      this.createHandlerReceivedMessageLog('ReportChargingProfilesRequest'),
      message,
      props,
    );

    const chargingProfiles = message.payload
      .chargingProfile as OCPP2_common_types.ChargingProfileType[];
    const tenantId = message.context.tenantId;
    for (const chargingProfile of chargingProfiles) {
      await this._chargingProfileRepository.createOrUpdateChargingProfile(
        tenantId,
        OCPP2_0_1_Mapper.ChargingProfileMapper.fromChargingProfileType(chargingProfile),
        message.context.ocppConnectionName,
        message.payload.evseId,
        message.payload.chargingLimitSource,
        true,
      );
    }

    // Create response
    const response: OCPP2_response_types.ReportChargingProfilesResponse = {};

    const messageConfirmation = await this._ocppSender.sendCallResultWithMessage(message, response);
    this._logger.debug(
      this.createHandlerSentMessageLog('ReportChargingProfilesResponse'),
      messageConfirmation,
    );
  }
}
