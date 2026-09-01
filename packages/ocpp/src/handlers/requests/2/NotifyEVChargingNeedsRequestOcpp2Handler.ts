// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  AbstractHandler,
  type AbstractHandlerDependencies,
  AsRequestHandler,
  type IMessage,
  type IOcppSender,
} from '@citrineos/base';
import {
  EnergyTransferModeEnum,
  EventGroup,
  type HandlerProperties,
  NotifyEVChargingNeedsStatusEnum,
  OCPP_2_VER_LIST,
  OCPP_CallAction,
  OCPP2_common_types,
  OCPP2_request_types,
  OCPP2_response_types,
} from '@citrineos/types';
import type { IChargingProfileRepository, ITransactionEventRepository } from '@citrineos/dal';
import { OCPP2_0_1_Mapper } from '@citrineos/dal';
import type { ISmartCharging } from '@modules/SmartCharging/SmartCharging.js';

@AsRequestHandler(OCPP_2_VER_LIST, OCPP_CallAction.NotifyEVChargingNeeds)
export class NotifyEVChargingNeedsRequestOcpp2Handler extends AbstractHandler {
  protected _ocppSender: IOcppSender;
  protected _transactionEventRepository: ITransactionEventRepository;
  protected _chargingProfileRepository: IChargingProfileRepository;
  protected _smartChargingService: ISmartCharging;

  constructor({
    logger,
    ocppSender,
    transactionEventRepository,
    chargingProfileRepository,
    smartChargingService,
  }: AbstractHandlerDependencies & {
    ocppSender: IOcppSender;
    transactionEventRepository: ITransactionEventRepository;
    chargingProfileRepository: IChargingProfileRepository;
    smartChargingService: ISmartCharging;
  }) {
    super(logger);
    this._ocppSender = ocppSender;
    this._transactionEventRepository = transactionEventRepository;
    this._chargingProfileRepository = chargingProfileRepository;
    this._smartChargingService = smartChargingService;
  }

  async handle(
    message: IMessage<OCPP2_request_types.NotifyEVChargingNeedsRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.info(
      this.createHandlerReceivedMessageLog('NotifyEVChargingNeedsRequest'),
      message,
      props,
    );

    const request = message.payload;
    const tenantId = message.context.tenantId;
    const ocppConnectionName = message.context.ocppConnectionName;
    const givenNeeds: OCPP2_common_types.ChargingNeedsType = request.chargingNeeds;

    const activeTransaction =
      await this._transactionEventRepository.getActiveTransactionByStationIdAndEvseId(
        tenantId,
        ocppConnectionName,
        request.evseId,
      );
    this._logger.info(
      `Found active transaction on station ${ocppConnectionName} evse ${request.evseId}: ${JSON.stringify(activeTransaction)}`,
    );

    // OCPP 2.0.1 Part 2 K17.FR.06
    const hasAcOrDcChargingParameters =
      givenNeeds.dcChargingParameters !== null || givenNeeds.acChargingParameters !== null;
    this._logger.info(`Has AC or DC charging parameters: ${hasAcOrDcChargingParameters}`);

    const matchedChargingType =
      ((givenNeeds.dcChargingParameters ?? false) &&
        givenNeeds.requestedEnergyTransfer === EnergyTransferModeEnum.DC) ||
      ((givenNeeds.acChargingParameters ?? false) &&
        givenNeeds.requestedEnergyTransfer !== EnergyTransferModeEnum.DC);
    this._logger.info(
      `Matched chargingParameters and requestedEnergyTransfer type: ${matchedChargingType}`,
    );

    if (!activeTransaction || !hasAcOrDcChargingParameters || !matchedChargingType) {
      await this._ocppSender.sendCallResultWithMessage(message, {
        status: NotifyEVChargingNeedsStatusEnum.Rejected,
      } as OCPP2_response_types.NotifyEVChargingNeedsResponse);
      return;
    }

    let chargingProfile: OCPP2_common_types.ChargingProfileType;
    try {
      chargingProfile = await this._smartChargingService.calculateChargingProfile(
        request,
        activeTransaction,
        tenantId,
        ocppConnectionName,
      );
    } catch (error) {
      this._logger.error(`Failed to calculate charging profile: ${error}`);
      await this._ocppSender.sendCallResultWithMessage(message, {
        status: NotifyEVChargingNeedsStatusEnum.Rejected,
      } as OCPP2_response_types.NotifyEVChargingNeedsResponse);
      return;
    }

    const chargingNeeds = await this._chargingProfileRepository.createChargingNeeds(
      tenantId,
      request,
      ocppConnectionName,
    );
    this._logger.info(`Charging needs created: ${JSON.stringify(chargingNeeds)}`);

    await this._ocppSender.sendCallResultWithMessage(message, {
      status: NotifyEVChargingNeedsStatusEnum.Accepted,
    } as OCPP2_response_types.NotifyEVChargingNeedsResponse);

    const storedChargingProfile =
      await this._chargingProfileRepository.createOrUpdateChargingProfile(
        tenantId,
        OCPP2_0_1_Mapper.ChargingProfileMapper.fromChargingProfileType(chargingProfile),
        ocppConnectionName,
        request.evseId,
      );
    this._logger.info(`Charging profile created: ${JSON.stringify(storedChargingProfile)}`);

    await this._ocppSender.sendCall({
      ocppConnectionName,
      tenantId: message.context.tenantId,
      protocol: message.protocol,
      action: OCPP_CallAction.SetChargingProfile,
      eventGroup: EventGroup.SmartCharging,
      payload: {
        evseId: request.evseId,
        chargingProfile,
      } as OCPP2_request_types.SetChargingProfileRequest,
    });
  }
}
