// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {
  AbstractModule,
  AsHandler,
  CallAction,
  ChargingLimitSourceEnumType,
  ChargingProfileCriterionType,
  ChargingProfileKindEnumType,
  ChargingProfilePurposeEnumType,
  ChargingProfileStatusEnumType,
  ChargingProfileType,
  ChargingRateUnitEnumType,
  ChargingSchedulePeriodType,
  ChargingScheduleType,
  ClearChargingProfileResponse,
  ClearChargingProfileStatusEnumType,
  ClearedChargingLimitResponse, EnergyTransferModeEnumType,
  EventGroup,
  GenericStatusEnumType,
  GetChargingProfilesRequest,
  GetChargingProfilesResponse,
  GetCompositeScheduleResponse,
  HandlerProperties,
  ICache,
  IMessage,
  IMessageHandler,
  IMessageSender,
  NotifyChargingLimitRequest,
  NotifyChargingLimitResponse,
  NotifyEVChargingNeedsRequest,
  NotifyEVChargingNeedsResponse,
  NotifyEVChargingNeedsStatusEnumType,
  NotifyEVChargingScheduleRequest,
  NotifyEVChargingScheduleResponse, RecurrencyKindEnumType,
  ReportChargingProfilesRequest,
  ReportChargingProfilesResponse,
  SetChargingProfileRequest,
  SetChargingProfileResponse,
  SystemConfig,
} from '@citrineos/base';
import {
  generateRequestId,
  RabbitMqReceiver,
  RabbitMqSender,
  Timer,
} from '@citrineos/util';
import deasyncPromise from 'deasync-promise';
import { ILogObj, Logger } from 'tslog';
import {
  IChargingProfileRepository,
  IDeviceModelRepository,
  ITransactionEventRepository,
  sequelize,
} from '@citrineos/data';

/**
 * Component that handles provisioning related messages.
 */
export class SmartChargingModule extends AbstractModule {
  /**
   * Fields
   */

  protected _requests: CallAction[] = [
    CallAction.NotifyChargingLimit,
    CallAction.NotifyEVChargingNeeds,
    CallAction.NotifyEVChargingSchedule,
    CallAction.ReportChargingProfiles,
  ];

  protected _responses: CallAction[] = [
    CallAction.ClearChargingProfile,
    CallAction.ClearedChargingLimit,
    CallAction.GetChargingProfiles,
    CallAction.GetCompositeSchedule,
    CallAction.SetChargingProfile,
  ];

  protected _transactionEventRepository: ITransactionEventRepository;
  protected _deviceModelRepository: IDeviceModelRepository;
  protected _chargingProfileRepository: IChargingProfileRepository;

  /**
   * Constructor
   */

  /**
   * This is the constructor function that initializes the {@link SmartChargingModule}.
   *
   * @param {SystemConfig} config - The `config` contains configuration settings for the module.
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
   */
  constructor(
    config: SystemConfig,
    cache: ICache,
    sender?: IMessageSender,
    handler?: IMessageHandler,
    logger?: Logger<ILogObj>,
    transactionEventRepository?: ITransactionEventRepository,
    deviceModelRepository?: IDeviceModelRepository,
    chargingProfileRepository?: IChargingProfileRepository,
  ) {
    super(
      config,
      cache,
      handler || new RabbitMqReceiver(config, logger),
      sender || new RabbitMqSender(config, logger),
      EventGroup.SmartCharging,
      logger,
    );

    const timer = new Timer();
    this._logger.info('Initializing...');

    if (!deasyncPromise(this._initHandler(this._requests, this._responses))) {
      throw new Error(
        'Could not initialize module due to failure in handler initialization.',
      );
    }

    this._transactionEventRepository =
      transactionEventRepository ||
      new sequelize.SequelizeTransactionEventRepository(config, this._logger);
    this._deviceModelRepository =
      deviceModelRepository ||
      new sequelize.SequelizeDeviceModelRepository(config, this._logger);
    this._chargingProfileRepository =
      chargingProfileRepository ||
      new sequelize.SequelizeChargingProfileRepository(config, this._logger);

    this._logger.info(`Initialized in ${timer.end()}ms...`);
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

  @AsHandler(CallAction.NotifyEVChargingNeeds)
  protected async _handleNotifyEVChargingNeeds(
    message: IMessage<NotifyEVChargingNeedsRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('NotifyEVChargingNeeds received:', message, props);
    const request = message.payload;
    const stationId = message.context.stationId;
    const activeTransaction =
      await this._transactionEventRepository.getActiveTransactionByStationIdAndEvseId(
        stationId,
        request.evseId,
      );
    this._logger.info(
      `Found active transaction on station ${stationId} evse ${request.evseId}: ${JSON.stringify(activeTransaction)}`,
    );

    // OCPP 2.0.1 Part 2 K17.FR.06 and expect an active transaction
    const hasAcOrDcChargingParameters = !request.chargingNeeds.dcChargingParameters &&
        !request.chargingNeeds.acChargingParameters;
    if (!hasAcOrDcChargingParameters || !activeTransaction) {
      this.sendCallResultWithMessage(message, {
        status: NotifyEVChargingNeedsStatusEnumType.Rejected,
      } as NotifyEVChargingNeedsResponse);
      return;
    }

    const chargingNeeds =
      await this._chargingProfileRepository.createChargingNeeds(
        request,
        stationId,
      );

    this._logger.info(
      `Charging needs created: ${JSON.stringify(chargingNeeds)}`,
    );

    this.sendCallResultWithMessage(message, {
      status: NotifyEVChargingNeedsStatusEnumType.Accepted,
    } as NotifyEVChargingNeedsResponse);

    const setChargingProfileRequest = this.generateChargingProfileRequest(request, activeTransaction.transactionId)

    await this.chargingProfileRepository.createOrUpdateChargingProfile(
        setChargingProfileRequest.chargingProfile,
        stationId,
        request.evseId,
    );

    // TODO: (K17.FR.08) The CSMS SHOULD send a SetChargingProfileRequest to the Charging Station within 60 seconds.
    this.sendCall(
      stationId,
      message.context.tenantId,
      CallAction.SetChargingProfile,
      setChargingProfileRequest,
    );
  }

  @AsHandler(CallAction.NotifyEVChargingSchedule)
  protected _handleNotifyEVChargingSchedule(
    message: IMessage<NotifyEVChargingScheduleRequest>,
    props?: HandlerProperties,
  ): void {
    this._logger.debug('NotifyEVChargingSchedule received:', message, props);

    // TODO: (K17.FR.11) check EV charging profile is within limits of CSMS ChargingSchedule
    //  1. Reject if it is not within limits and CSMS starts new renegotiation as per use case K16 (K16.FR.08)
    //  i.e., send an set charging profile request (K17.FR.13)
    //  2. Accept if it is within limits
    //  we need to figure out where we can find the limits of ChargingSchedule

    // Create response
    const response: NotifyEVChargingScheduleResponse = {
      status: GenericStatusEnumType.Accepted,
    };

    this.sendCallResultWithMessage(message, response).then(
      (messageConfirmation) =>
        this._logger.debug(
          'NotifyEVChargingSchedule response sent: ',
          messageConfirmation,
        ),
    );
  }

  @AsHandler(CallAction.NotifyChargingLimit)
  protected _handleNotifyChargingLimit(
    message: IMessage<NotifyChargingLimitRequest>,
    props?: HandlerProperties,
  ): void {
    this._logger.debug('NotifyChargingLimit received:', message, props);

    // Create response
    const response: NotifyChargingLimitResponse = {};

    this.sendCallResultWithMessage(message, response).then(
      (messageConfirmation) =>
        this._logger.debug(
          'NotifyChargingLimit response sent: ',
          messageConfirmation,
        ),
    );
  }

  @AsHandler(CallAction.ReportChargingProfiles)
  protected async _handleReportChargingProfiles(
    message: IMessage<ReportChargingProfilesRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('ReportChargingProfiles received:', message, props);

    const chargingProfiles = message.payload
      .chargingProfile as ChargingProfileType[];
    for (const chargingProfile of chargingProfiles) {
      await this._chargingProfileRepository.createOrUpdateChargingProfile(
        chargingProfile,
        message.context.stationId,
        message.payload.evseId,
        message.payload.chargingLimitSource,
        true,
      );
    }

    // Create response
    const response: ReportChargingProfilesResponse = {};

    this.sendCallResultWithMessage(message, response).then(
      (messageConfirmation) =>
        this._logger.debug(
          'ReportChargingProfiles response sent: ',
          messageConfirmation,
        ),
    );
  }

  /**
   * Handle responses
   */

  @AsHandler(CallAction.ClearChargingProfile)
  protected async _handleClearChargingProfile(
    message: IMessage<ClearChargingProfileResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug(
      'ClearChargingProfile response received:',
      message,
      props,
    );

    if (
      message.payload.status === ClearChargingProfileStatusEnumType.Accepted
    ) {
      const stationId: string = message.context.stationId;
      // Set existed profiles to isActive false
      await this._chargingProfileRepository.updateAllByQuery(
        {
          isActive: false,
        },
        {
          where: {
            stationId: stationId,
            isActive: true,
          },
          returning: false,
        },
      );
      // Request charging profiles to get the latest data
      this.sendCall(
        stationId,
        message.context.tenantId,
        CallAction.GetChargingProfiles,
        {
          requestId: generateRequestId(),
          chargingProfile: {
            chargingLimitSource: [
              ChargingLimitSourceEnumType.CSO,
              ChargingLimitSourceEnumType.EMS,
              ChargingLimitSourceEnumType.SO,
              ChargingLimitSourceEnumType.Other,
            ],
          } as ChargingProfileCriterionType,
        } as GetChargingProfilesRequest,
      );
    } else {
      this._logger.error(
        `Failed to clear charging profile: ${JSON.stringify(message.payload)}`,
      );
    }
  }

  @AsHandler(CallAction.GetChargingProfiles)
  protected _handleGetChargingProfiles(
    message: IMessage<GetChargingProfilesResponse>,
    props?: HandlerProperties,
  ): void {
    this._logger.debug(
      'GetChargingProfiles response received:',
      message,
      props,
    );
  }

  @AsHandler(CallAction.SetChargingProfile)
  protected async _handleSetChargingProfile(
    message: IMessage<SetChargingProfileResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('SetChargingProfile response received:', message, props);
    const response: SetChargingProfileResponse = message.payload;
    if (response.status === ChargingProfileStatusEnumType.Rejected) {
      this._logger.error(
        `Failed to set charging profile: ${JSON.stringify(response)}`,
      );
    } else {
      const stationId: string = message.context.stationId;
      // Set existed profiles to isActive false
      await this._chargingProfileRepository.updateAllByQuery(
        {
          isActive: false,
        },
        {
          where: {
            stationId: stationId,
            isActive: true,
            chargingLimitSource: ChargingLimitSourceEnumType.CSO,
          },
          returning: false,
        },
      );
      // Request charging profiles to get the latest data
      this.sendCall(
        stationId,
        message.context.tenantId,
        CallAction.GetChargingProfiles,
        {
          requestId: generateRequestId(),
          chargingProfile: {
            chargingLimitSource: [ChargingLimitSourceEnumType.CSO],
          } as ChargingProfileCriterionType,
        } as GetChargingProfilesRequest,
      );
    }
  }

  @AsHandler(CallAction.ClearedChargingLimit)
  protected _handleClearedChargingLimit(
    message: IMessage<ClearedChargingLimitResponse>,
    props?: HandlerProperties,
  ): void {
    this._logger.debug(
      'ClearedChargingLimit response received:',
      message,
      props,
    );
  }

  @AsHandler(CallAction.GetCompositeSchedule)
  protected async _handleGetCompositeSchedule(
    message: IMessage<GetCompositeScheduleResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug(
      'GetCompositeSchedule response received:',
      message,
      props,
    );
    const response = message.payload;
    if (response.status === GenericStatusEnumType.Accepted) {
      if (response.schedule) {
        const compositeSchedule =
          await this._chargingProfileRepository.createCompositeSchedule(
            response.schedule,
            message.context.stationId,
          );
        this._logger.info(
          `Composite schedule created: ${JSON.stringify(compositeSchedule)}`,
        );
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
   * Generates a `SetChargingProfileRequest` from the given `NotifyEVChargingNeedsRequest`.
   *
   * This method creates a charging profile based on the EV's charging needs and the specified energy transfer mode. The profile includes the necessary parameters to set up a charging schedule for the EV.
   *
   * @param request - The `NotifyEVChargingNeedsRequest` containing details about the EV's charging requirements.
   * @param transactionId - The ID of the transaction associated with the charging profile.
   * @returns A `SetChargingProfileRequest` with a generated charging profile for the specified EVSE.
   *
   * @throws Error if the energy transfer mode is unsupported.
   */
  private generateChargingProfileRequest(
      request: NotifyEVChargingNeedsRequest,
      transactionId: string
  ): SetChargingProfileRequest {
    const { chargingNeeds, evseId } = request;

    const acParams = chargingNeeds.acChargingParameters;
    const dcParams = chargingNeeds.dcChargingParameters;

    const transferMode = chargingNeeds.requestedEnergyTransfer;

    // Default values
    const profileId = 1; // Unique ID for the profile, should be generated
    const stackLevel = 1; // Define appropriate stack level
    const profilePurpose: ChargingProfilePurposeEnumType = ChargingProfilePurposeEnumType.TxProfile;
    const profileKind: ChargingProfileKindEnumType = ChargingProfileKindEnumType.Absolute;

    let limit = 0;
    let numberPhases = 1;
    let minChargingRate = 0; // Default to no minimum charging rate

    // Determine charging parameters based on energy transfer mode
    switch (transferMode) {
      case EnergyTransferModeEnumType.AC_single_phase:
      case EnergyTransferModeEnumType.AC_two_phase:
      case EnergyTransferModeEnumType.AC_three_phase:
        if (acParams) {
          const { energyAmount, evMinCurrent, evMaxCurrent, evMaxVoltage } = acParams;
          numberPhases = (transferMode === EnergyTransferModeEnumType.AC_single_phase) ? 1 :
              (transferMode === EnergyTransferModeEnumType.AC_two_phase) ? 2 :
                  3; // For AC_three_phase
          limit = evMaxVoltage * evMaxCurrent * numberPhases; // Maximum power in watts
          minChargingRate = evMinCurrent; // Example: Minimum charging rate can be set based on EV minimum current
        }
        break;
      case EnergyTransferModeEnumType.DC:
        if (dcParams) {
          const { evMaxPower, evMaxCurrent, evMaxVoltage } = dcParams;
          limit = evMaxPower || (evMaxVoltage * evMaxCurrent); // Maximum power or derived power
          numberPhases = 1; // DC typically uses single-phase
        }
        break;
      default:
        throw new Error("Unsupported energy transfer mode");
    }

    const departureTime = new Date(chargingNeeds.departureTime || Date.now() + 3600 * 1000); // Default to 1 hour from now if no departure time is set
    const currentTime = new Date();
    const duration = Math.max((departureTime.getTime() - currentTime.getTime()) / 1000, 3600); // Ensure at least 1 hour duration

    const chargingSchedulePeriod: [ChargingSchedulePeriodType, ...ChargingSchedulePeriodType[]] = [
      {
        startPeriod: 0,
        limit,
        numberPhases
      }
    ];

    const chargingSchedule: ChargingScheduleType = {
      id: profileId,
      duration,
      chargingRateUnit: ChargingRateUnitEnumType.W,
      chargingSchedulePeriod,
      minChargingRate,
      // Optionally add startSchedule if needed
    };

    const chargingProfile: ChargingProfileType = {
      id: profileId,
      stackLevel,
      chargingProfilePurpose: profilePurpose,
      chargingProfileKind: profileKind,
      validFrom: currentTime.toISOString(), // Now
      validTo: departureTime.toISOString(), // Until departure
      chargingSchedule: [chargingSchedule], // Add more schedules if needed
      transactionId: transactionId
    };

    return {
      evseId,
      chargingProfile
    };
  }
}
