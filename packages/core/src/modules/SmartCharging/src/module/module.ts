// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type {
  CallAction,
  ChargingRateUnitEnumType,
  HandlerProperties,
  IMessage,
  OcppModuleDependencies,
  OCPP2_request_types,
  OCPP2_response_types,
  OCPP2_common_types,
} from '@citrineos/base';
import {
  AbstractModule,
  AsHandler,
  ChargingLimitSourceEnum,
  ChargingProfileKindEnum,
  ChargingProfilePurposeEnum,
  ChargingProfileStatusEnum,
  ChargingStationSequenceTypeEnum,
  ClearChargingProfileStatusEnum,
  EnergyTransferModeEnum,
  EventGroup,
  GenericStatusEnum,
  NotifyEVChargingNeedsStatusEnum,
  OCPP1_6,
  OCPP_2_VER_LIST,
  OCPP_CallAction,
  OCPPVersion,
  MessageOrigin,
} from '@citrineos/base';
import type {
  IChargingProfileRepository,
  IDeviceModelRepository,
  IOCPPMessageRepository,
  ITransactionEventRepository,
} from '@dal/interfaces/repositories.js';
import * as OCPP1_6_Mapper from '@dal/layers/sequelize/mapper/1.6/index.js';
import * as OCPP2_0_1_Mapper from '@dal/layers/sequelize/mapper/2.0.1/index.js';

import { Transaction } from '@dal/layers/sequelize/model/TransactionEvent/index.js';
import { IdGenerator } from '@util/util/idGenerator.js';

import type { ISmartCharging } from './smartCharging/SmartCharging.js';
import type { CompositeScheduleInput } from '@/dal/layers/sequelize/mapper/2.0.1/ChargingProfileMapper.js';

export interface SmartChargingModuleDependencies extends OcppModuleDependencies {
  transactionEventRepository: ITransactionEventRepository;
  deviceModelRepository: IDeviceModelRepository;
  chargingProfileRepository: IChargingProfileRepository;
  smartChargingService: ISmartCharging;
  idGenerator: IdGenerator;
  ocppMessageRepository: IOCPPMessageRepository;
}

/**
 * Component that handles provisioning related messages.
 */
export class SmartChargingModule extends AbstractModule {
  /**
   * Fields
   */

  _requests: CallAction[] = [];

  _responses: CallAction[] = [];

  protected _transactionEventRepository: ITransactionEventRepository;
  protected _deviceModelRepository: IDeviceModelRepository;
  protected _chargingProfileRepository: IChargingProfileRepository;
  protected _ocppMessageRepository: IOCPPMessageRepository;

  protected _smartChargingService: ISmartCharging;

  private _idGenerator: IdGenerator;

  constructor({
    config,
    cache,
    sender,
    handler,
    logger,
    ocppValidator,
    transactionEventRepository,
    deviceModelRepository,
    chargingProfileRepository,
    smartChargingService,
    idGenerator,
    ocppMessageRepository,
  }: SmartChargingModuleDependencies) {
    super(config, cache, handler, sender, EventGroup.SmartCharging, logger, ocppValidator);

    this._requests = config.modules.smartcharging?.requests ?? [];
    this._responses = config.modules.smartcharging?.responses ?? [];

    this._transactionEventRepository = transactionEventRepository;
    this._deviceModelRepository = deviceModelRepository;
    this._chargingProfileRepository = chargingProfileRepository;
    this._ocppMessageRepository = ocppMessageRepository;
    this._smartChargingService = smartChargingService;
    this._idGenerator = idGenerator;
  }

  get transactionEventRepository(): ITransactionEventRepository {
    return this._transactionEventRepository;
  }

  get deviceModelRepository(): IDeviceModelRepository {
    return this._deviceModelRepository;
  }

  get chargingProfileRepository(): IChargingProfileRepository {
    return this._chargingProfileRepository;
  }

  get ocppMessageRepository(): IOCPPMessageRepository {
    return this._ocppMessageRepository;
  }

  /**
   * Handle requests
   */

  @AsHandler(OCPP_2_VER_LIST, OCPP_CallAction.NotifyEVChargingNeeds)
  protected async _handleNotifyEVChargingNeeds(
    message: IMessage<OCPP2_request_types.NotifyEVChargingNeedsRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('NotifyEVChargingNeeds received:', message, props);
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
      await this.sendCallResultWithMessage(message, {
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
      await this.sendCallResultWithMessage(message, {
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

    await this.sendCallResultWithMessage(message, {
      status: NotifyEVChargingNeedsStatusEnum.Accepted,
    } as OCPP2_response_types.NotifyEVChargingNeedsResponse);

    const storedChargingProfile =
      await this.chargingProfileRepository.createOrUpdateChargingProfile(
        tenantId,
        OCPP2_0_1_Mapper.ChargingProfileMapper.fromChargingProfileType(chargingProfile),
        ocppConnectionName,
        request.evseId,
      );
    this._logger.info(`Charging profile created: ${JSON.stringify(storedChargingProfile)}`);

    await this.sendCall(
      ocppConnectionName,
      message.context.tenantId,
      OCPPVersion.OCPP2_1,
      OCPP_CallAction.SetChargingProfile,
      { evseId: request.evseId, chargingProfile } as OCPP2_request_types.SetChargingProfileRequest,
    );
  }

  @AsHandler(OCPP_2_VER_LIST, OCPP_CallAction.NotifyEVChargingSchedule)
  protected async _handleNotifyEVChargingSchedule(
    message: IMessage<OCPP2_request_types.NotifyEVChargingScheduleRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('NotifyEVChargingSchedule received:', message, props);
    const request = message.payload as OCPP2_request_types.NotifyEVChargingScheduleRequest;
    const tenantId = message.context.tenantId;
    const ocppConnectionName = message.context.ocppConnectionName;

    // There are different definitions for Accepted and Rejected in NotifyEVChargingScheduleResponse
    // in OCPP 2.0.1 V3 Part 2, see (1) 1.37.2 status field description and (2) K17.FR.11 and K17.FR.12
    // We use (1) in our code, i.e., always return Accepted in response
    await this.sendCallResultWithMessage(message, {
      status: GenericStatusEnum.Accepted,
    } as OCPP2_response_types.NotifyEVChargingScheduleResponse);

    const activeTransaction =
      await this._transactionEventRepository.getActiveTransactionByStationIdAndEvseId(
        tenantId,
        ocppConnectionName,
        request.evseId,
      );
    if (!activeTransaction) {
      this._logger.error(
        `No active transaction on station ${ocppConnectionName} evse ${request.evseId}`,
      );
      return;
    } else {
      this._logger.info(
        `Found active transaction on station ${ocppConnectionName} evse ${request.evseId}: ${JSON.stringify(activeTransaction)}`,
      );
    }

    try {
      await this._smartChargingService.checkLimitsOfChargingSchedule(
        request,
        tenantId,
        ocppConnectionName,
        activeTransaction,
      );
    } catch (error) {
      this._logger.error(
        `EV charging schedule is NOT within limits of existing ChargingSchedule: ${error}`,
      );
      // Currently, we simply trust the given EV charging schedule and create a new charging profile based on it
      const setChargingProfileRequest = await this._generateSetChargingProfileRequest(
        request,
        activeTransaction,
        tenantId,
        ocppConnectionName,
      );
      await this.sendCall(
        ocppConnectionName,
        message.context.tenantId,
        message.protocol,
        OCPP_CallAction.SetChargingProfile,
        setChargingProfileRequest,
      );
    }
  }

  @AsHandler(OCPP_2_VER_LIST, OCPP_CallAction.NotifyChargingLimit)
  protected async _handleNotifyChargingLimit(
    message: IMessage<OCPP2_request_types.NotifyChargingLimitRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('NotifyChargingLimit received:', message, props);

    // Create response
    const response: OCPP2_response_types.NotifyChargingLimitResponse = {};

    const messageConfirmation = await this.sendCallResultWithMessage(message, response);
    this._logger.debug('NotifyChargingLimit response sent: ', messageConfirmation);
  }

  @AsHandler(OCPP_2_VER_LIST, OCPP_CallAction.ReportChargingProfiles)
  protected async _handleReportChargingProfiles(
    message: IMessage<OCPP2_request_types.ReportChargingProfilesRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('ReportChargingProfiles received:', message, props);

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

    const messageConfirmation = await this.sendCallResultWithMessage(message, response);
    this._logger.debug('ReportChargingProfiles response sent: ', messageConfirmation);
  }

  /**
   * Handle responses
   */

  @AsHandler(OCPP_2_VER_LIST, OCPP_CallAction.ClearChargingProfile)
  protected async _handleClearChargingProfile(
    message: IMessage<OCPP2_response_types.ClearChargingProfileResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('ClearChargingProfile response received:', message, props);

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
      await this.sendCall(
        ocppConnectionName,
        message.context.tenantId,
        OCPPVersion.OCPP2_1,
        OCPP_CallAction.GetChargingProfiles,
        {
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
      );
    } else {
      this._logger.error(`Failed to clear charging profile: ${JSON.stringify(message.payload)}`);
    }
  }

  @AsHandler(OCPP_2_VER_LIST, OCPP_CallAction.GetChargingProfiles)
  protected _handleGetChargingProfiles(
    message: IMessage<OCPP2_response_types.GetChargingProfilesResponse>,
    props?: HandlerProperties,
  ): void {
    this._logger.debug('GetChargingProfiles response received:', message, props);
  }

  @AsHandler(OCPP_2_VER_LIST, OCPP_CallAction.SetChargingProfile)
  protected async _handleSetChargingProfile(
    message: IMessage<OCPP2_response_types.SetChargingProfileResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('SetChargingProfile response received:', message, props);
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
      await this.sendCall(
        ocppConnectionName,
        message.context.tenantId,
        message.protocol,
        OCPP_CallAction.GetChargingProfiles,
        {
          requestId: await this._idGenerator.generateRequestId(
            message.context.tenantId,
            message.context.ocppConnectionName,
            ChargingStationSequenceTypeEnum.getChargingProfiles,
          ),
          chargingProfile: {
            chargingLimitSource: [ChargingLimitSourceEnum.CSO],
          } as OCPP2_common_types.ChargingProfileCriterionType,
        } as OCPP2_request_types.GetChargingProfilesRequest,
      );
    }
  }

  @AsHandler(OCPP_2_VER_LIST, OCPP_CallAction.ClearedChargingLimit)
  protected async _handleClearedChargingLimit(
    message: IMessage<OCPP2_request_types.ClearedChargingLimitRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('ClearedChargingLimit request received:', message, props);

    const response: OCPP2_response_types.ClearedChargingLimitResponse = {};
    await this.sendCallResultWithMessage(message, response);
  }

  @AsHandler([OCPPVersion.OCPP2_0_1], OCPP_CallAction.GetCompositeSchedule)
  protected async _handleGetCompositeSchedule(
    message: IMessage<OCPP2_response_types.GetCompositeScheduleResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('GetCompositeSchedule response received:', message, props);
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

  //TODO: 2.1 GetCompositeSchedule
  // We need to add a specific handler for 2.1 or we need to change how we do our mapping / create a mapper for 2.1

  /**
   * Generates a `SetChargingProfileRequest` from the given `NotifyEVChargingScheduleRequest`.
   *
   * This method creates a charging profile based on the EV's charging schedule.
   *
   * @param request - The `NotifyEVChargingScheduleRequest` containing EV's charging schedule.
   * @param transaction - The transaction associated with the charging profile.
   * @param ocppConnectionName - The connection name of the charging station
   *
   * @returns A `SetChargingProfileRequest` with a generated charging profile.
   */
  private async _generateSetChargingProfileRequest(
    request: OCPP2_request_types.NotifyEVChargingScheduleRequest,
    transaction: Transaction,
    tenantId: number,
    ocppConnectionName: string,
  ): Promise<OCPP2_request_types.SetChargingProfileRequest> {
    const { chargingSchedule, evseId } = request;

    const purpose = ChargingProfilePurposeEnum.TxProfile;
    chargingSchedule.id = await this._chargingProfileRepository.getNextChargingScheduleId(
      tenantId,
      ocppConnectionName,
    );

    const chargingProfile = {
      id: await this._chargingProfileRepository.getNextChargingProfileId(
        tenantId,
        ocppConnectionName,
      ),
      stackLevel: await this._chargingProfileRepository.getNextStackLevel(
        tenantId,
        ocppConnectionName,
        transaction.id,
        purpose,
      ),
      chargingProfilePurpose: purpose,
      chargingProfileKind: ChargingProfileKindEnum.Absolute,
      chargingSchedule: [chargingSchedule],
      transactionId: transaction.transactionId,
    } as OCPP2_common_types.ChargingProfileType;

    return {
      evseId,
      chargingProfile,
    } as OCPP2_request_types.SetChargingProfileRequest;
  }

  /**
   * OCPP 1.6 response handlers
   */

  @AsHandler([OCPPVersion.OCPP1_6], OCPP_CallAction.SetChargingProfile)
  protected async _handleOcpp16SetChargingProfile(
    message: IMessage<OCPP1_6.SetChargingProfileResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('OCPP 1.6 SetChargingProfileResponse received:', message, props);

    const tenantId = message.context.tenantId;
    const ocppConnectionName: string = message.context.ocppConnectionName;

    if (message.payload.status === OCPP1_6.SetChargingProfileResponseStatus.Accepted) {
      const originalMessage = await this._ocppMessageRepository.readOnlyOneByQuery(tenantId, {
        where: {
          tenantId: tenantId,
          ocppConnectionName: ocppConnectionName,
          correlationId: message.context.correlationId,
          origin: MessageOrigin.ChargingStationManagementSystem,
        },
      });

      if (originalMessage) {
        const originalRequest = originalMessage.message[3] as OCPP1_6.SetChargingProfileRequest;
        const mapped = OCPP1_6_Mapper.ChargingProfileMapper.fromSetChargingProfileRequest(
          originalRequest.csChargingProfiles,
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

  @AsHandler([OCPPVersion.OCPP1_6], OCPP_CallAction.ClearChargingProfile)
  protected async _handleOcpp16ClearChargingProfile(
    message: IMessage<OCPP1_6.ClearChargingProfileResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('OCPP 1.6 ClearChargingProfileResponse received:', message, props);

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

  @AsHandler([OCPPVersion.OCPP1_6], OCPP_CallAction.GetCompositeSchedule)
  protected async _handleOcpp16GetCompositeSchedule(
    message: IMessage<OCPP1_6.GetCompositeScheduleResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('OCPP 1.6 GetCompositeScheduleResponse received:', message, props);

    const tenantId = message.context.tenantId;
    const ocppConnectionName: string = message.context.ocppConnectionName;
    const response = message.payload;
    if (
      response.status === OCPP1_6.GetCompositeScheduleResponseStatus.Accepted &&
      response.chargingSchedule
    ) {
      const compositeSchedule = {
        evseId: response.connectorId ?? 0,
        duration: response.chargingSchedule.duration ?? 0,
        scheduleStart: response.chargingSchedule.startSchedule ?? new Date().toISOString(),
        chargingRateUnit: response.chargingSchedule
          .chargingRateUnit as unknown as ChargingRateUnitEnumType,
        chargingSchedulePeriod: response.chargingSchedule.chargingSchedulePeriod.map((p) => ({
          startPeriod: p.startPeriod,
          limit: p.limit,
          numberPhases: p.numberPhases ?? undefined,
        })) as [
          OCPP2_common_types.ChargingSchedulePeriodType,
          ...OCPP2_common_types.ChargingSchedulePeriodType[],
        ],
      } as OCPP2_common_types.CompositeScheduleType;
      const saved = await this._chargingProfileRepository.createCompositeSchedule(
        tenantId,
        compositeSchedule as CompositeScheduleInput,
        ocppConnectionName,
      );
      this._logger.info(`OCPP 1.6 Composite schedule created: ${JSON.stringify(saved)}`);
    } else {
      this._logger.error(`OCPP 1.6 GetCompositeSchedule failed: ${JSON.stringify(response)}`);
    }
  }
}

export default SmartChargingModule;
