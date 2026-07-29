// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  AbstractHandler,
  type AbstractHandlerDependencies,
  AsResponseHandler,
  ChargingLimitSourceEnum,
  ChargingProfileStatusEnum,
  ChargingStationSequenceTypeEnum,
  EventGroup,
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
import { IdGenerator } from '@util/index.js';

@AsResponseHandler(OCPP_2_VER_LIST, OCPP_CallAction.SetChargingProfile)
export class SetChargingProfileResponseOcpp2Handler extends AbstractHandler {
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
    message: IMessage<OCPP2_response_types.SetChargingProfileResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.info(
      this.createHandlerReceivedMessageLog('SetChargingProfileResponse'),
      message,
      props,
    );

    const tenantId = message.context.tenantId;
    const response: OCPP2_response_types.SetChargingProfileResponse = message.payload;
    if (response.status === ChargingProfileStatusEnum.Rejected) {
      this._logger.error(`Failed to set charging profile: ${JSON.stringify(response)}`);
    } else {
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
            chargingLimitSource: ChargingLimitSourceEnum.CSO,
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
            chargingLimitSource: [ChargingLimitSourceEnum.CSO],
          } as OCPP2_common_types.ChargingProfileCriterionType,
        } as OCPP2_request_types.GetChargingProfilesRequest,
      });
    }
  }
}
