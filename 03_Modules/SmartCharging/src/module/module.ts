// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {
  AbstractModule,
  AsHandler,
  BootstrapConfig,
  CallAction,
  ChargingStationSequenceType,
  EventGroup,
  HandlerProperties,
  ICache,
  IMessage,
  IMessageHandler,
  IMessageSender,
  OCPP2_0_1,
  OCPP2_0_1_CallAction,
  OCPPVersion,
  SystemConfig,
} from '@citrineos/base';
import { IdGenerator, RabbitMqReceiver, RabbitMqSender } from '@citrineos/util';
import { ILogObj, Logger } from 'tslog';
import {
  IChargingProfileRepository,
  IDeviceModelRepository,
  ITransactionEventRepository,
  sequelize,
  SequelizeChargingStationSequenceRepository,
  Transaction,
} from '@citrineos/data';
import { InternalSmartCharging, ISmartCharging } from './smartCharging';

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

  protected _smartChargingService: ISmartCharging;

  private _idGenerator: IdGenerator;

  /**
   * Constructor
   */

  /**
   * This is the constructor function that initializes the {@link SmartChargingModule}.
   *
   * @param {BootstrapConfig & SystemConfig} config - The `config` contains configuration settings for the module.
   *
   * @param {ICache} [cache] - The cache instance which is shared among the modules & Central System to pass information such as blacklisted actions or boot status.
   *
   * @param {IMessageSender} [sender] - The `sender` parameter is an optional parameter that represents an instance of the {@link IMessageSender} interface.
   * It is used to send messages from the central system to external systems or devices. If no `sender` is provided, a default {@link RabbitMqSender} instance is created and used.
   *
   * @param {IMessageHandler} [handler] - The `handler` parameter is an optional parameter that represents an instance of the {@link IMessageHandler} interface.
   * It is used to handle incoming messages and dispatch them to the appropriate methods or functions. If no `handler` is provided, a default {@link RabbitMqReceiver} instance is created and used.
   *
   * @param {Logger<ILogObj>} [logger] - The `logger` parameter is an optional parameter that represents an instance of {@link Logger<ILogObj>}.
   * It is used to propagate system wide logger settings and will serve as the parent logger for any sub-component logging. If no `logger` is provided, a default {@link Logger<ILogObj>} instance is created and used.
   *
   * @param {ITransactionEventRepository} [transactionEventRepository] - An optional parameter of type {@link ITransactionEventRepository}
   * which represents a repository for accessing and manipulating transaction data.
   * If no `transactionEventRepository` is provided, a default {@link sequelize:transactionEventRepository} instance is created and used.
   *
   * @param {IDeviceModelRepository} [deviceModelRepository] - An optional parameter of type {@link IDeviceModelRepository}
   * which represents a repository for accessing and manipulating variable data.
   * If no `deviceModelRepository` is provided, a default {@link sequelize:deviceModelRepository} instance is created and used.
   *
   * @param {IChargingProfileRepository} [chargingProfileRepository] - An optional parameter of type {@link IChargingProfileRepository}
   * which represents a repository for accessing and manipulating charging profile data.
   * If no `chargingProfileRepository` is provided, a default {@link sequelize:chargingProfileRepository} instance is created and used.
   *
   * @param {ISmartCharging} [smartChargingService] - An optional parameter of type {@link ISmartCharging} which
   * provides smart charging functionalities, e.g., calculation and validation.
   *
   * @param {IdGenerator} [idGenerator] - An optional parameter of type {@link IdGenerator} which
   * represents a generator for ids.
   */
  constructor(
    config: BootstrapConfig & SystemConfig,
    cache: ICache,
    sender?: IMessageSender,
    handler?: IMessageHandler,
    logger?: Logger<ILogObj>,
    transactionEventRepository?: ITransactionEventRepository,
    deviceModelRepository?: IDeviceModelRepository,
    chargingProfileRepository?: IChargingProfileRepository,
    smartChargingService?: ISmartCharging,
    idGenerator?: IdGenerator,
  ) {
    super(
      config,
      cache,
      handler || new RabbitMqReceiver(config, logger),
      sender || new RabbitMqSender(config, logger),
      EventGroup.SmartCharging,
      logger,
    );

    this._requests = config.modules.smartcharging?.requests ?? [];
    this._responses = config.modules.smartcharging?.responses ?? [];

    this._transactionEventRepository =
      transactionEventRepository ||
      new sequelize.SequelizeTransactionEventRepository(config, this._logger);
    this._deviceModelRepository =
      deviceModelRepository || new sequelize.SequelizeDeviceModelRepository(config, this._logger);
    this._chargingProfileRepository =
      chargingProfileRepository ||
      new sequelize.SequelizeChargingProfileRepository(config, this._logger);

    this._smartChargingService =
      smartChargingService || new InternalSmartCharging(this._chargingProfileRepository);

    this._idGenerator =
      idGenerator ||
      new IdGenerator(new SequelizeChargingStationSequenceRepository(config, this._logger));
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

  /**
   * Handle requests
   */

  @AsHandler(OCPPVersion.OCPP2_0_1, OCPP2_0_1_CallAction.NotifyEVChargingNeeds)
  protected async _handleNotifyEVChargingNeeds(
    message: IMessage<OCPP2_0_1.NotifyEVChargingNeedsRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('NotifyEVChargingNeeds received:', message, props);
    const request = message.payload;
    const tenantId = message.context.tenantId;
    const stationId = message.context.stationId;
    const givenNeeds: OCPP2_0_1.ChargingNeedsType = request.chargingNeeds;

    const activeTransaction =
      await this._transactionEventRepository.getActiveTransactionByStationIdAndEvseId(
        tenantId,
        stationId,
        request.evseId,
      );
    this._logger.info(
      `Found active transaction on station ${stationId} evse ${request.evseId}: ${JSON.stringify(activeTransaction)}`,
    );

    // OCPP 2.0.1 Part 2 K17.FR.06
    const hasAcOrDcChargingParameters =
      givenNeeds.dcChargingParameters !== null || givenNeeds.acChargingParameters !== null;
    this._logger.info(`Has AC or DC charging parameters: ${hasAcOrDcChargingParameters}`);

    const matchedChargingType =
      ((givenNeeds.dcChargingParameters ?? false) &&
        givenNeeds.requestedEnergyTransfer === OCPP2_0_1.EnergyTransferModeEnumType.DC) ||
      ((givenNeeds.acChargingParameters ?? false) &&
        givenNeeds.requestedEnergyTransfer !== OCPP2_0_1.EnergyTransferModeEnumType.DC);
    this._logger.info(
      `Matched chargingParameters and requestedEnergyTransfer type: ${matchedChargingType}`,
    );

    if (!activeTransaction || !hasAcOrDcChargingParameters || !matchedChargingType) {
      await this.sendCallResultWithMessage(message, {
        status: OCPP2_0_1.NotifyEVChargingNeedsStatusEnumType.Rejected,
      } as OCPP2_0_1.NotifyEVChargingNeedsResponse);
      return;
    }

    let chargingProfile: OCPP2_0_1.ChargingProfileType;
    try {
      chargingProfile = await this._smartChargingService.calculateChargingProfile(
        request,
        activeTransaction,
        tenantId,
        stationId,
      );
    } catch (error) {
      this._logger.error(`Failed to calculate charging profile: ${error}`);
      await this.sendCallResultWithMessage(message, {
        status: OCPP2_0_1.NotifyEVChargingNeedsStatusEnumType.Rejected,
      } as OCPP2_0_1.NotifyEVChargingNeedsResponse);
      return;
    }

    const chargingNeeds = await this._chargingProfileRepository.createChargingNeeds(
      tenantId,
      request,
      stationId,
    );
    this._logger.info(`Charging needs created: ${JSON.stringify(chargingNeeds)}`);

    await this.sendCallResultWithMessage(message, {
      status: OCPP2_0_1.NotifyEVChargingNeedsStatusEnumType.Accepted,
    } as OCPP2_0_1.NotifyEVChargingNeedsResponse);

    const storedChargingProfile =
      await this.chargingProfileRepository.createOrUpdateChargingProfile(
        tenantId,
        chargingProfile,
        stationId,
        request.evseId,
      );
    this._logger.info(`Charging profile created: ${JSON.stringify(storedChargingProfile)}`);

    await this.sendCall(
      stationId,
      message.context.tenantId,
      OCPPVersion.OCPP2_0_1,
      OCPP2_0_1_CallAction.SetChargingProfile,
      { evseId: request.evseId, chargingProfile } as OCPP2_0_1.SetChargingProfileRequest,
    );
  }

  @AsHandler(OCPPVersion.OCPP2_0_1, OCPP2_0_1_CallAction.NotifyEVChargingSchedule)
  protected async _handleNotifyEVChargingSchedule(
    message: IMessage<OCPP2_0_1.NotifyEVChargingScheduleRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('NotifyEVChargingSchedule received:', message, props);
    const request = message.payload as OCPP2_0_1.NotifyEVChargingScheduleRequest;
    const tenantId = message.context.tenantId;
    const stationId = message.context.stationId;

    // There are different definitions for Accepted and Rejected in NotifyEVChargingScheduleResponse
    // in OCPP 2.0.1 V3 Part 2, see (1) 1.37.2 status field description and (2) K17.FR.11 and K17.FR.12
    // We use (1) in our code, i.e., always return Accepted in response
    await this.sendCallResultWithMessage(message, {
      status: OCPP2_0_1.GenericStatusEnumType.Accepted,
    } as OCPP2_0_1.NotifyEVChargingScheduleResponse);

    const activeTransaction =
      await this._transactionEventRepository.getActiveTransactionByStationIdAndEvseId(
        tenantId,
        stationId,
        request.evseId,
      );
    if (!activeTransaction) {
      this._logger.error(`No active transaction on station ${stationId} evse ${request.evseId}`);
      return;
    } else {
      this._logger.info(
        `Found active transaction on station ${stationId} evse ${request.evseId}: ${JSON.stringify(activeTransaction)}`,
      );
    }

    try {
      await this._smartChargingService.checkLimitsOfChargingSchedule(
        request,
        tenantId,
        stationId,
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
        stationId,
      );
      await this.sendCall(
        stationId,
        message.context.tenantId,
        OCPPVersion.OCPP2_0_1,
        OCPP2_0_1_CallAction.SetChargingProfile,
        setChargingProfileRequest,
      );
    }
  }

  @AsHandler(OCPPVersion.OCPP2_0_1, OCPP2_0_1_CallAction.NotifyChargingLimit)
  protected async _handleNotifyChargingLimit(
    message: IMessage<OCPP2_0_1.NotifyChargingLimitRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('NotifyChargingLimit received:', message, props);

    // Create response
    const response: OCPP2_0_1.NotifyChargingLimitResponse = {};

    const messageConfirmation = await this.sendCallResultWithMessage(message, response);
    this._logger.debug('NotifyChargingLimit response sent: ', messageConfirmation);
  }

  @AsHandler(OCPPVersion.OCPP2_0_1, OCPP2_0_1_CallAction.ReportChargingProfiles)
  protected async _handleReportChargingProfiles(
    message: IMessage<OCPP2_0_1.ReportChargingProfilesRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('ReportChargingProfiles received:', message, props);

    const chargingProfiles = message.payload.chargingProfile as OCPP2_0_1.ChargingProfileType[];
    const tenantId = message.context.tenantId;
    for (const chargingProfile of chargingProfiles) {
      await this._chargingProfileRepository.createOrUpdateChargingProfile(
        tenantId,
        chargingProfile,
        message.context.stationId,
        message.payload.evseId,
        message.payload.chargingLimitSource,
        true,
      );
    }

    // Create response
    const response: OCPP2_0_1.ReportChargingProfilesResponse = {};

    const messageConfirmation = await this.sendCallResultWithMessage(message, response);
    this._logger.debug('ReportChargingProfiles response sent: ', messageConfirmation);
  }

  /**
   * Handle responses
   */

  @AsHandler(OCPPVersion.OCPP2_0_1, OCPP2_0_1_CallAction.ClearChargingProfile)
  protected async _handleClearChargingProfile(
    message: IMessage<OCPP2_0_1.ClearChargingProfileResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('ClearChargingProfile response received:', message, props);

    const tenantId = message.context.tenantId;
    if (message.payload.status === OCPP2_0_1.ClearChargingProfileStatusEnumType.Accepted) {
      const stationId: string = message.context.stationId;
      // Set existed profiles to isActive false
      await this._chargingProfileRepository.updateAllByQuery(
        tenantId,
        {
          isActive: false,
        },
        {
          where: {
            tenantId: tenantId,
            stationId: stationId,
            isActive: true,
          },
          returning: false,
        },
      );
      // Request charging profiles to get the latest data
      await this.sendCall(
        stationId,
        message.context.tenantId,
        OCPPVersion.OCPP2_0_1,
        OCPP2_0_1_CallAction.GetChargingProfiles,
        {
          requestId: await this._idGenerator.generateRequestId(
            message.context.tenantId,
            message.context.stationId,
            ChargingStationSequenceType.getChargingProfiles,
          ),
          chargingProfile: {
            chargingLimitSource: [
              OCPP2_0_1.ChargingLimitSourceEnumType.CSO,
              OCPP2_0_1.ChargingLimitSourceEnumType.EMS,
              OCPP2_0_1.ChargingLimitSourceEnumType.SO,
              OCPP2_0_1.ChargingLimitSourceEnumType.Other,
            ],
          } as OCPP2_0_1.ChargingProfileCriterionType,
        } as OCPP2_0_1.GetChargingProfilesRequest,
      );
    } else {
      this._logger.error(`Failed to clear charging profile: ${JSON.stringify(message.payload)}`);
    }
  }

  @AsHandler(OCPPVersion.OCPP2_0_1, OCPP2_0_1_CallAction.GetChargingProfiles)
  protected _handleGetChargingProfiles(
    message: IMessage<OCPP2_0_1.GetChargingProfilesResponse>,
    props?: HandlerProperties,
  ): void {
    this._logger.debug('GetChargingProfiles response received:', message, props);
  }

  @AsHandler(OCPPVersion.OCPP2_0_1, OCPP2_0_1_CallAction.SetChargingProfile)
  protected async _handleSetChargingProfile(
    message: IMessage<OCPP2_0_1.SetChargingProfileResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('SetChargingProfile response received:', message, props);
    const tenantId = message.context.tenantId;
    const response: OCPP2_0_1.SetChargingProfileResponse = message.payload;
    if (response.status === OCPP2_0_1.ChargingProfileStatusEnumType.Rejected) {
      this._logger.error(`Failed to set charging profile: ${JSON.stringify(response)}`);
    } else {
      const stationId: string = message.context.stationId;
      // Set existed profiles to isActive false
      await this._chargingProfileRepository.updateAllByQuery(
        tenantId,
        {
          isActive: false,
        },
        {
          where: {
            tenantId: tenantId,
            stationId: stationId,
            isActive: true,
            chargingLimitSource: OCPP2_0_1.ChargingLimitSourceEnumType.CSO,
          },
          returning: false,
        },
      );
      // Request charging profiles to get the latest data
      await this.sendCall(
        stationId,
        message.context.tenantId,
        OCPPVersion.OCPP2_0_1,
        OCPP2_0_1_CallAction.GetChargingProfiles,
        {
          requestId: await this._idGenerator.generateRequestId(
            message.context.tenantId,
            message.context.stationId,
            ChargingStationSequenceType.getChargingProfiles,
          ),
          chargingProfile: {
            chargingLimitSource: [OCPP2_0_1.ChargingLimitSourceEnumType.CSO],
          } as OCPP2_0_1.ChargingProfileCriterionType,
        } as OCPP2_0_1.GetChargingProfilesRequest,
      );
    }
  }

  @AsHandler(OCPPVersion.OCPP2_0_1, OCPP2_0_1_CallAction.ClearedChargingLimit)
  protected _handleClearedChargingLimit(
    message: IMessage<OCPP2_0_1.ClearedChargingLimitResponse>,
    props?: HandlerProperties,
  ): void {
    this._logger.debug('ClearedChargingLimit response received:', message, props);
  }

  @AsHandler(OCPPVersion.OCPP2_0_1, OCPP2_0_1_CallAction.GetCompositeSchedule)
  protected async _handleGetCompositeSchedule(
    message: IMessage<OCPP2_0_1.GetCompositeScheduleResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('GetCompositeSchedule response received:', message, props);
    const tenantId = message.context.tenantId;
    const response = message.payload;
    if (response.status === OCPP2_0_1.GenericStatusEnumType.Accepted) {
      if (response.schedule) {
        const compositeSchedule = await this._chargingProfileRepository.createCompositeSchedule(
          tenantId,
          response.schedule,
          message.context.stationId,
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

  /**
   * Generates a `SetChargingProfileRequest` from the given `NotifyEVChargingScheduleRequest`.
   *
   * This method creates a charging profile based on the EV's charging schedule.
   *
   * @param request - The `NotifyEVChargingScheduleRequest` containing EV's charging schedule.
   * @param transaction - The transaction associated with the charging profile.
   * @param stationId - Station ID
   *
   * @returns A `SetChargingProfileRequest` with a generated charging profile.
   */
  private async _generateSetChargingProfileRequest(
    request: OCPP2_0_1.NotifyEVChargingScheduleRequest,
    transaction: Transaction,
    tenantId: number,
    stationId: string,
  ): Promise<OCPP2_0_1.SetChargingProfileRequest> {
    const { chargingSchedule, evseId } = request;

    const purpose = OCPP2_0_1.ChargingProfilePurposeEnumType.TxProfile;
    chargingSchedule.id = await this._chargingProfileRepository.getNextChargingScheduleId(
      tenantId,
      stationId,
    );

    const chargingProfile: OCPP2_0_1.ChargingProfileType = {
      id: await this._chargingProfileRepository.getNextChargingProfileId(tenantId, stationId),
      stackLevel: await this._chargingProfileRepository.getNextStackLevel(
        tenantId,
        stationId,
        transaction.id,
        purpose,
      ),
      chargingProfilePurpose: purpose,
      chargingProfileKind: OCPP2_0_1.ChargingProfileKindEnumType.Absolute,
      chargingSchedule: [chargingSchedule],
      transactionId: transaction.transactionId,
    };

    return {
      evseId,
      chargingProfile,
    } as OCPP2_0_1.SetChargingProfileRequest;
  }
}
