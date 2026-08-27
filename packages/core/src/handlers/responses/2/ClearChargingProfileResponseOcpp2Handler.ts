// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  AbstractHandler,
  type AbstractHandlerDependencies,
  AsResponseHandler,
  type IMessage,
  type IOcppSender,
} from '@citrineos/base';
import {
  ChargingLimitSourceEnum,
  ChargingStationSequenceTypeEnum,
  ClearChargingProfileStatusEnum,
  EventGroup,
  type HandlerProperties,
  OCPP_2_VER_LIST,
  OCPP_CallAction,
  OCPP2_common_types,
  OCPP2_request_types,
  OCPP2_response_types,
} from '@citrineos/types';
import type { IChargingProfileRepository } from '@dal/interfaces/repositories.js';
import { IdGenerator } from '@util/index.js';

@AsResponseHandler(OCPP_2_VER_LIST, OCPP_CallAction.ClearChargingProfile)
export class ClearChargingProfileResponseOcpp2Handler extends AbstractHandler {
  protected _ocppSender: IOcppSender;
  protected _chargingProfileRepository: IChargingProfileRepository;
  protected _idGenerator: IdGenerator;

  constructor({
    logger,
    ocppSender,
    chargingProfileRepository,
    idGenerator,
  }: AbstractHandlerDependencies & {
    ocppSender: IOcppSender;
    chargingProfileRepository: IChargingProfileRepository;
    idGenerator: IdGenerator;
  }) {
    super(logger);
    this._ocppSender = ocppSender;
    this._chargingProfileRepository = chargingProfileRepository;
    this._idGenerator = idGenerator;
  }

  async handle(
    message: IMessage<OCPP2_response_types.ClearChargingProfileResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.info(
      this.createHandlerReceivedMessageLog('ClearChargingProfileResponse'),
      message,
      props,
    );

    const tenantId = message.context.tenantId;
    if (message.payload.status === ClearChargingProfileStatusEnum.Accepted) {
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
      // Request charging profiles to get the latest data
      await this._ocppSender.sendCall({
        ocppConnectionName,
        tenantId: message.context.tenantId,
        protocol: message.protocol,
        action: OCPP_CallAction.GetChargingProfiles,
        eventGroup: EventGroup.SmartCharging,
        payload: {
          requestId: await this._idGenerator.generateRequestId(
            message.context.tenantId,
            message.context.ocppConnectionName,
            ChargingStationSequenceTypeEnum.getChargingProfiles,
          ),
          chargingProfile: {
            chargingLimitSource: [
              ChargingLimitSourceEnum.CSO,
              ChargingLimitSourceEnum.EMS,
              ChargingLimitSourceEnum.SO,
              ChargingLimitSourceEnum.Other,
            ],
          } as OCPP2_common_types.ChargingProfileCriterionType,
        } as OCPP2_request_types.GetChargingProfilesRequest,
      });
    } else {
      this._logger.error(`Failed to clear charging profile: ${JSON.stringify(message.payload)}`);
    }
  }
}
