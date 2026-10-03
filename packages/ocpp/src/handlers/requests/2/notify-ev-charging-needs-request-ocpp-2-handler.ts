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
import type { ISmartCharging } from '@modules/smart-charging/smart-charging.js';

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

    // A 2.1 EV describes a bidirectional need in `v2xChargingParameters` or
    // `derChargingParameters`, and neither is an AC or DC parameter set. An
    // ISO 15118-20 car asking for AC_BPT therefore carried none of the two
    // fields checked below, was answered Rejected, and ended its transaction
    // with `ReqEnergyTransferRejected` (Q01.FR.06) -- the charger doing
    // exactly what it is told. Bidirectional charging could not start at all.
    // `ChargingNeedsType` is the union of the 2.0.1 and 2.1 shapes, so the
    // 2.1-only fields are reached through a narrowing check rather than a
    // cast: a payload that has neither is simply not a 2.1 need.
    const has21ChargingParameters =
      ('v2xChargingParameters' in givenNeeds && givenNeeds.v2xChargingParameters != null) ||
      ('derChargingParameters' in givenNeeds && givenNeeds.derChargingParameters != null);

    // OCPP 2.0.1 Part 2 K17.FR.06
    //
    // `!= null` rather than `!== null`: an absent field is `undefined`, and
    // `undefined !== null` answered true for a payload that carried no
    // parameters at all -- so this check passed on exactly the messages it
    // exists to catch, and the match below was left to do its work alone.
    const hasAcOrDcChargingParameters =
      givenNeeds.dcChargingParameters != null || givenNeeds.acChargingParameters != null;
    this._logger.info(
      `Has AC, DC or 2.1 charging parameters: ${hasAcOrDcChargingParameters || has21ChargingParameters}`,
    );

    const matchedChargingType =
      has21ChargingParameters ||
      ((givenNeeds.dcChargingParameters ?? false) &&
        givenNeeds.requestedEnergyTransfer === EnergyTransferModeEnum.DC) ||
      ((givenNeeds.acChargingParameters ?? false) &&
        givenNeeds.requestedEnergyTransfer !== EnergyTransferModeEnum.DC);
    this._logger.info(
      `Matched chargingParameters and requestedEnergyTransfer type: ${matchedChargingType}`,
    );

    if (
      !activeTransaction ||
      !(hasAcOrDcChargingParameters || has21ChargingParameters) ||
      !matchedChargingType
    ) {
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
