// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  AbstractHandler,
  type AbstractHandlerDependencies,
  AsResponseHandler,
  type IMessage,
  type IOcppSender,
  OCPP2_common_types,
  OCPP2_request_types,
  OCPP2_response_types,
} from '@citrineos/base';
import {
  ChargingLimitSourceEnum,
  ChargingProfilePurposeEnum,
  ChargingStationSequenceTypeEnum,
  EventGroup,
  type HandlerProperties,
  OCPP_2_VER_LIST,
  OCPP_CallAction,
  RequestStartStopStatusEnum,
  type SystemConfig,
} from '@citrineos/types';
import type { IChargingProfileRepository } from '@dal/interfaces/repositories.js';
import { IdGenerator } from '@util/index.js';

@AsResponseHandler(OCPP_2_VER_LIST, OCPP_CallAction.RequestStartTransaction)
export class RequestStartTransactionResponseOcpp2Handler extends AbstractHandler {
  protected _config: SystemConfig;
  protected _ocppSender: IOcppSender;
  protected _chargingProfileRepository: IChargingProfileRepository;
  protected _idGenerator: IdGenerator;

  constructor({
    logger,
    config,
    ocppSender,
    chargingProfileRepository,
    idGenerator,
  }: AbstractHandlerDependencies & {
    config: SystemConfig;
    ocppSender: IOcppSender;
    chargingProfileRepository: IChargingProfileRepository;
    idGenerator: IdGenerator;
  }) {
    super(logger);
    this._config = config;
    this._ocppSender = ocppSender;
    this._chargingProfileRepository = chargingProfileRepository;
    this._idGenerator = idGenerator;
  }

  async handle(
    message: IMessage<OCPP2_response_types.RequestStartTransactionResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.info(
      this.createHandlerReceivedMessageLog('RequestStartTransactionResponse'),
      message,
      props,
    );

    if (message.payload.status === RequestStartStopStatusEnum.Accepted) {
      // Start transaction with charging profile succeeds,
      // we need to update db entity with the latest data from charger
      const ocppConnectionName: string = message.context.ocppConnectionName;
      // 1. Clear all existing profiles: find existing active profiles and set them to isActive false
      await this._chargingProfileRepository.updateAllByQuery(
        message.context.tenantId,
        {
          isActive: false,
        },
        {
          where: {
            ocppConnectionName: ocppConnectionName,
            isActive: true,
            chargingLimitSource: ChargingLimitSourceEnum.CSO,
            chargingProfilePurpose: ChargingProfilePurposeEnum.TxProfile,
          },
          returning: false,
        },
      );
      // 2. Request charging profiles to get the latest data (if configured)
      if (this._config.evdriver.enableGetChargingProfilesOnStartTransaction !== false) {
        await this._ocppSender.sendCall({
          ocppConnectionName,
          tenantId: message.context.tenantId,
          protocol: message.protocol,
          action: OCPP_CallAction.GetChargingProfiles,
          eventGroup: EventGroup.EVDriver,
          payload: {
            requestId: await this._idGenerator.generateRequestId(
              message.context.tenantId,
              message.context.ocppConnectionName,
              ChargingStationSequenceTypeEnum.getChargingProfiles,
            ),
            chargingProfile: {
              chargingProfilePurpose: ChargingProfilePurposeEnum.TxProfile,
              chargingLimitSource: [ChargingLimitSourceEnum.CSO],
            } as OCPP2_common_types.ChargingProfileCriterionType,
          } as OCPP2_request_types.GetChargingProfilesRequest,
        });
      } else {
        this._logger.info(
          `Skipping GetChargingProfiles after RequestStartTransaction for station ${ocppConnectionName} (disabled by enableGetChargingProfilesOnStartTransaction configuration)`,
        );
      }
    } else {
      this._logger.error(`RequestStartTransaction failed: ${JSON.stringify(message.payload)}`);
    }
  }
}
