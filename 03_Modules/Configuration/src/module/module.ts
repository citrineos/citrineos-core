// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {
  AbstractModule,
  AsHandler,
  BOOT_STATUS,
  CallAction,
  ChargingStationSequenceType,
  ErrorCode,
  EventGroup,
  HandlerProperties,
  ICache,
  IMessage,
  IMessageConfirmation,
  IMessageHandler,
  IMessageSender,
  OCPP1_6,
  OCPP1_6_CallAction,
  OCPP2_0_1,
  OCPP2_0_1_CallAction,
  OCPPVersion,
  SystemConfig,
} from '@citrineos/base';
import {
  Boot,
  ChargingStation,
  ChargingStationNetworkProfile,
  Component,
  IBootRepository,
  IDeviceModelRepository,
  IMessageInfoRepository,
  sequelize,
  SequelizeChargingStationSequenceRepository,
  ServerNetworkProfile,
  SetNetworkProfile,
} from '@citrineos/data';
import { IdGenerator, RabbitMqReceiver, RabbitMqSender } from '@citrineos/util';
import { v4 as uuidv4 } from 'uuid';
import { ILogObj, Logger } from 'tslog';
import { DeviceModelService } from './DeviceModelService';
import { BootNotificationService } from './BootNotificationService';

/**
 * Component that handles Configuration related messages.
 */
export class ConfigurationModule extends AbstractModule {
  public _deviceModelService: DeviceModelService;

  _requests: CallAction[] = [
    OCPP2_0_1_CallAction.BootNotification,
    OCPP2_0_1_CallAction.DataTransfer,
    OCPP2_0_1_CallAction.FirmwareStatusNotification,
    OCPP2_0_1_CallAction.Heartbeat,
    OCPP2_0_1_CallAction.NotifyDisplayMessages,
    OCPP2_0_1_CallAction.PublishFirmwareStatusNotification,
    OCPP1_6_CallAction.Heartbeat,
  ];

  _responses: CallAction[] = [
    OCPP2_0_1_CallAction.ChangeAvailability,
    OCPP2_0_1_CallAction.ClearDisplayMessage,
    OCPP2_0_1_CallAction.GetDisplayMessages,
    OCPP2_0_1_CallAction.PublishFirmware,
    OCPP2_0_1_CallAction.Reset,
    OCPP2_0_1_CallAction.SetDisplayMessage,
    OCPP2_0_1_CallAction.SetNetworkProfile,
    OCPP2_0_1_CallAction.TriggerMessage,
    OCPP2_0_1_CallAction.UnpublishFirmware,
    OCPP2_0_1_CallAction.UpdateFirmware,
  ];

  protected _bootRepository: IBootRepository;
  protected _deviceModelRepository: IDeviceModelRepository;
  protected _messageInfoRepository: IMessageInfoRepository;
  protected _bootService: BootNotificationService;
  private _idGenerator: IdGenerator;

  /**
   * Constructor
   */

  /**
   * This is the constructor function that initializes the {@link ConfigurationModule}.
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
   * It is used to propagate system-wide logger settings and will serve as the parent logger for any subcomponent logging. If no `logger` is provided, a default {@link Logger<ILogObj>} instance is created and used.
   *
   * @param {IBootRepository} [bootRepository] - An optional parameter of type {@link IBootRepository} which represents a repository for accessing and manipulating authorization data.
   * If no `bootRepository` is provided, a default {@link SequelizeBootRepository} instance is created and used.
   *
   * @param {IDeviceModelRepository} [deviceModelRepository] - An optional parameter of type {@link IDeviceModelRepository} which represents a repository for accessing and manipulating variable data.
   * If no `deviceModelRepository` is provided, a default {@link sequelize:deviceModelRepository} instance is created and used.
   *
   * @param {IMessageInfoRepository} [messageInfoRepository] - An optional parameter of type {@link messageInfoRepository} which
   * represents a repository for accessing and manipulating variable data.
   *
   * @param {IdGenerator} [idGenerator] - An optional parameter of type {@link IdGenerator} which
   * represents a generator for ids.
   *
   *If no `deviceModelRepository` is provided, a default {@link sequelize:messageInfoRepository} instance is created and used.
   */
  constructor(
    config: SystemConfig,
    cache: ICache,
    sender?: IMessageSender,
    handler?: IMessageHandler,
    logger?: Logger<ILogObj>,
    bootRepository?: IBootRepository,
    deviceModelRepository?: IDeviceModelRepository,
    messageInfoRepository?: IMessageInfoRepository,
    idGenerator?: IdGenerator,
  ) {
    super(
      config,
      cache,
      handler || new RabbitMqReceiver(config, logger),
      sender || new RabbitMqSender(config, logger),
      EventGroup.Configuration,
      logger,
    );

    this._bootRepository =
      bootRepository ||
      new sequelize.SequelizeBootRepository(config, this._logger);
    this._deviceModelRepository =
      deviceModelRepository ||
      new sequelize.SequelizeDeviceModelRepository(config, this._logger);
    this._messageInfoRepository =
      messageInfoRepository ||
      new sequelize.SequelizeMessageInfoRepository(config, this._logger);

    this._deviceModelService = new DeviceModelService(
      this._deviceModelRepository,
    );

    this._bootService = new BootNotificationService(
      this._bootRepository,
      this._cache,
      this._config.modules.configuration,
      this._logger,
    );

    this._idGenerator =
      idGenerator ||
      new IdGenerator(
        new SequelizeChargingStationSequenceRepository(config, this._logger),
      );
  }

  get bootRepository(): IBootRepository {
    return this._bootRepository;
  }

  get deviceModelRepository(): IDeviceModelRepository {
    return this._deviceModelRepository;
  }

  get messageInfoRepository(): IMessageInfoRepository {
    return this._messageInfoRepository;
  }

  /**
   * Handle requests
   */

  @AsHandler(OCPPVersion.OCPP2_0_1, OCPP2_0_1_CallAction.BootNotification)
  protected async _handleBootNotification(
    message: IMessage<OCPP2_0_1.BootNotificationRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('BootNotification received:', message, props);

    const stationId = message.context.stationId;
    const tenantId = message.context.tenantId;
    const timestamp = message.context.timestamp;
    const chargingStation = message.payload.chargingStation;

    const bootNotificationResponse: OCPP2_0_1.BootNotificationResponse =
      await this._bootService.createBootNotificationResponse(stationId);

    // Check cached boot status for charger. Only Pending and Rejected statuses are cached.
    const cachedBootStatus: OCPP2_0_1.RegistrationStatusEnumType | null =
      await this._cache.get(BOOT_STATUS, stationId);

    // Blacklist or whitelist charger actions in cache
    await this._bootService.cacheChargerActionsPermissions(
      stationId,
      cachedBootStatus,
      bootNotificationResponse.status,
    );

    const bootNotificationResponseMessageConfirmation: IMessageConfirmation =
      await this.sendCallResultWithMessage(message, bootNotificationResponse);

    // Update device model from boot
    await this._deviceModelService.updateDeviceModel(
      chargingStation,
      stationId,
      timestamp,
    );

    if (!bootNotificationResponseMessageConfirmation.success) {
      throw new Error(
        'BootNotification failed: ' +
          bootNotificationResponseMessageConfirmation,
      );
    }

    if (
      bootNotificationResponse.status !==
        OCPP2_0_1.RegistrationStatusEnumType.Accepted &&
      (!cachedBootStatus ||
        bootNotificationResponse.status !== cachedBootStatus)
    ) {
      // Cache boot status for charger if (not accepted) and ((not already cached) or (different status from cached status)).
      await this._cache.set(
        BOOT_STATUS,
        bootNotificationResponse.status,
        stationId,
      );
    }

    // Update charger-specific boot config with details of most recently sent BootNotificationResponse
    const bootConfigDbEntity: Boot = await this._bootService.updateBootConfig(
      bootNotificationResponse,
      stationId,
    );

    // If boot notification is not pending, do not start configuration.
    // If cached boot status is not null and pending, configuration is already in progress - do not start configuration again.
    if (
      bootNotificationResponse.status !==
        OCPP2_0_1.RegistrationStatusEnumType.Pending ||
      (cachedBootStatus &&
        cachedBootStatus === OCPP2_0_1.RegistrationStatusEnumType.Pending)
    ) {
      return;
    }

    // GetBaseReport
    // TODO Consider refactoring GetBaseReport and SetVariables sections as methods to be used by their respective message api endpoints as well
    if (
      bootConfigDbEntity.getBaseReportOnPending ??
      this._config.modules.configuration.getBaseReportOnPending
    ) {
      // Remove Notify Report from blacklist
      await this._cache.remove(OCPP2_0_1_CallAction.NotifyReport, stationId);

      const getBaseReportRequest =
        await this._bootService.createGetBaseReportRequest(
          stationId,
          this._config.maxCachingSeconds,
        );

      const getBaseReportConfirmation = await this.sendCall(
        stationId,
        tenantId,
        OCPPVersion.OCPP2_0_1,
        OCPP2_0_1_CallAction.GetBaseReport,
        getBaseReportRequest,
      );

      await this._bootService.confirmGetBaseReportSuccess(
        stationId,
        getBaseReportRequest.requestId.toString(),
        getBaseReportConfirmation,
        this._config.maxCachingSeconds,
      );

      // Make sure GetBaseReport doesn't re-trigger on next boot attempt
      bootConfigDbEntity.getBaseReportOnPending = false;
      await bootConfigDbEntity.save();
    }

    // SetVariables
    let rejectedSetVariable = false;
    let rebootSetVariable = false;
    if (
      bootConfigDbEntity.pendingBootSetVariables &&
      bootConfigDbEntity.pendingBootSetVariables.length > 0
    ) {
      bootConfigDbEntity.variablesRejectedOnLastBoot = [];

      let setVariableData: OCPP2_0_1.SetVariableDataType[] =
        await this._deviceModelRepository.readAllSetVariableByStationId(
          stationId,
        );

      // If ItemsPerMessageSetVariables not set, send all variables at once
      const itemsPerMessageSetVariables =
        (await this._deviceModelService.getItemsPerMessageSetVariablesByStationId(
          stationId,
        )) ?? setVariableData.length;

      while (setVariableData.length > 0) {
        const correlationId = uuidv4();

        const cacheCallbackPromise: Promise<string | null> =
          this._cache.onChange(
            correlationId,
            this._config.maxCachingSeconds,
            stationId,
          ); // x2 fudge factor for any network lag

        await this.sendCall(
          stationId,
          tenantId,
          OCPPVersion.OCPP2_0_1,
          OCPP2_0_1_CallAction.SetVariables,
          {
            setVariableData: setVariableData.slice(
              0,
              itemsPerMessageSetVariables,
            ),
          } as OCPP2_0_1.SetVariablesRequest,
          undefined,
          correlationId,
        );

        setVariableData = setVariableData.slice(itemsPerMessageSetVariables);

        const setVariablesResponseJsonString = await cacheCallbackPromise;

        if (setVariablesResponseJsonString) {
          if (rejectedSetVariable && rebootSetVariable) {
            continue;
          }

          const setVariablesResponse: OCPP2_0_1.SetVariablesResponse =
            JSON.parse(setVariablesResponseJsonString);
          setVariablesResponse.setVariableResult.forEach((result) => {
            if (
              result.attributeStatus ===
              OCPP2_0_1.SetVariableStatusEnumType.Rejected
            ) {
              rejectedSetVariable = true;
            } else if (
              result.attributeStatus ===
              OCPP2_0_1.SetVariableStatusEnumType.RebootRequired
            ) {
              rebootSetVariable = true;
            }
          });
        } else {
          throw new Error('SetVariables response not found');
        }
      }

      const doNotBootWithRejectedVariables = !(
        bootConfigDbEntity.bootWithRejectedVariables ??
        this._config.modules.configuration.bootWithRejectedVariables
      );

      if (rejectedSetVariable && doNotBootWithRejectedVariables) {
        bootConfigDbEntity.status =
          OCPP2_0_1.RegistrationStatusEnumType.Rejected;
        await bootConfigDbEntity.save();
        // No more to do.
        return;
      }
    }

    if (this._config.modules.configuration.autoAccept) {
      // Update boot config with status accepted
      // TODO: Determine how/if StatusInfo should be generated
      bootConfigDbEntity.status = OCPP2_0_1.RegistrationStatusEnumType.Accepted;
      await bootConfigDbEntity.save();
    }

    if (rebootSetVariable) {
      // Charger SHALL not be in a transaction as it has not yet successfully booted, therefore it is appropriate to send an Immediate Reset
      await this.sendCall(
        stationId,
        tenantId,
        OCPPVersion.OCPP2_0_1,
        OCPP2_0_1_CallAction.Reset,
        {
          type: OCPP2_0_1.ResetEnumType.Immediate,
        } as OCPP2_0_1.ResetRequest,
      );
    } else {
      // We could trigger the new boot immediately rather than wait for the retry, as nothing more now needs to be done.
      // However, B02.FR.02 - Spec allows for TriggerMessageRequest - OCTT fails over trigger
      // Commenting out until OCTT behavior changes.
      // this.sendCall(stationId, tenantId, OCPPVersion.OCPP2_0_1, OCPP2_0_1_CallAction.TriggerMessage,
      //   { requestedMessage: MessageTriggerEnumType.BootNotification } as TriggerMessageRequest);
    }
  }

  @AsHandler(OCPPVersion.OCPP2_0_1, OCPP2_0_1_CallAction.Heartbeat)
  protected async _handleHeartbeat(
    message: IMessage<OCPP2_0_1.HeartbeatRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('Heartbeat received:', message, props);

    // Create response
    const response: OCPP2_0_1.HeartbeatResponse = {
      currentTime: new Date().toISOString(),
    };

    const messageConfirmation = await this.sendCallResultWithMessage(
      message,
      response,
    );
    this._logger.debug('Heartbeat response sent: ', messageConfirmation);
  }

  @AsHandler(OCPPVersion.OCPP2_0_1, OCPP2_0_1_CallAction.NotifyDisplayMessages)
  protected async _handleNotifyDisplayMessages(
    message: IMessage<OCPP2_0_1.NotifyDisplayMessagesRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('NotifyDisplayMessages received: ', message, props);

    const messageInfoTypes = message.payload
      .messageInfo as OCPP2_0_1.MessageInfoType[];
    for (const messageInfoType of messageInfoTypes) {
      let componentId: number | undefined;
      if (messageInfoType.display) {
        const component: Component =
          await this._deviceModelRepository.findOrCreateEvseAndComponent(
            messageInfoType.display,
            message.context.tenantId,
          );
        componentId = component.id;
      }
      await this._messageInfoRepository.createOrUpdateByMessageInfoTypeAndStationId(
        messageInfoType,
        message.context.stationId,
        componentId,
      );
    }

    // Create response
    const response: OCPP2_0_1.NotifyDisplayMessagesResponse = {};

    const messageConfirmation = await this.sendCallResultWithMessage(
      message,
      response,
    );
    this._logger.debug(
      'NotifyDisplayMessages response sent: ',
      messageConfirmation,
    );
  }

  @AsHandler(
    OCPPVersion.OCPP2_0_1,
    OCPP2_0_1_CallAction.FirmwareStatusNotification,
  )
  protected async _handleFirmwareStatusNotification(
    message: IMessage<OCPP2_0_1.FirmwareStatusNotificationRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('FirmwareStatusNotification received:', message, props);

    // TODO: FirmwareStatusNotification is usually triggered. Ideally, it should be sent to the callbackUrl from the message api that sent the trigger message

    // Create response
    const response: OCPP2_0_1.FirmwareStatusNotificationResponse = {};

    const messageConfirmation = await this.sendCallResultWithMessage(
      message,
      response,
    );
    this._logger.debug(
      'FirmwareStatusNotification response sent: ',
      messageConfirmation,
    );
  }

  @AsHandler(OCPPVersion.OCPP2_0_1, OCPP2_0_1_CallAction.DataTransfer)
  protected async _handleDataTransfer(
    message: IMessage<OCPP2_0_1.DataTransferRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('DataTransfer received:', message, props);

    // Create response
    const response: OCPP2_0_1.DataTransferResponse = {
      status: OCPP2_0_1.DataTransferStatusEnumType.Rejected,
      statusInfo: { reasonCode: ErrorCode.NotImplemented },
    };

    const messageConfirmation = await this.sendCallResultWithMessage(
      message,
      response,
    );
    this._logger.debug('DataTransfer response sent: ', messageConfirmation);
  }

  /**
   * Handle responses
   */

  @AsHandler(OCPPVersion.OCPP2_0_1, OCPP2_0_1_CallAction.ChangeAvailability)
  protected _handleChangeAvailability(
    message: IMessage<OCPP2_0_1.ChangeAvailabilityResponse>,
    props?: HandlerProperties,
  ): void {
    this._logger.debug('ChangeAvailability response received:', message, props);
  }

  @AsHandler(OCPPVersion.OCPP2_0_1, OCPP2_0_1_CallAction.SetNetworkProfile)
  protected async _handleSetNetworkProfile(
    message: IMessage<OCPP2_0_1.SetNetworkProfileResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('SetNetworkProfile response received:', message, props);

    if (
      message.payload.status ==
      OCPP2_0_1.SetNetworkProfileStatusEnumType.Accepted
    ) {
      const setNetworkProfile = await SetNetworkProfile.findOne({
        where: { correlationId: message.context.correlationId },
      });
      if (setNetworkProfile) {
        const serverNetworkProfile = await ServerNetworkProfile.findByPk(
          setNetworkProfile.websocketServerConfigId!,
        );
        if (serverNetworkProfile) {
          const chargingStation = await ChargingStation.findByPk(
            message.context.stationId,
          );
          if (chargingStation) {
            const [chargingStationNetworkProfile] =
              await ChargingStationNetworkProfile.findOrBuild({
                where: {
                  stationId: chargingStation.id,
                  configurationSlot: setNetworkProfile.configurationSlot!,
                },
              });
            chargingStationNetworkProfile.websocketServerConfigId =
              setNetworkProfile.websocketServerConfigId!;
            chargingStationNetworkProfile.setNetworkProfileId =
              setNetworkProfile.id;
            await chargingStationNetworkProfile.save();
          }
        }
      }
    }
  }

  @AsHandler(OCPPVersion.OCPP2_0_1, OCPP2_0_1_CallAction.GetDisplayMessages)
  protected _handleGetDisplayMessages(
    message: IMessage<OCPP2_0_1.GetDisplayMessagesResponse>,
    props?: HandlerProperties,
  ): void {
    this._logger.debug('GetDisplayMessages response received:', message, props);
  }

  @AsHandler(OCPPVersion.OCPP2_0_1, OCPP2_0_1_CallAction.SetDisplayMessage)
  protected async _handleSetDisplayMessage(
    message: IMessage<OCPP2_0_1.SetDisplayMessageResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('SetDisplayMessage response received:', message, props);

    const status = message.payload
      .status as OCPP2_0_1.DisplayMessageStatusEnumType;
    // when charger station accepts the set message info request
    // we trigger a get all display messages request to update stored message info in db
    if (status === OCPP2_0_1.DisplayMessageStatusEnumType.Accepted) {
      await this._messageInfoRepository.deactivateAllByStationId(
        message.context.stationId,
      );
      await this.sendCall(
        message.context.stationId,
        message.context.tenantId,
        OCPPVersion.OCPP2_0_1,
        OCPP2_0_1_CallAction.GetDisplayMessages,
        {
          requestId: await this._idGenerator.generateRequestId(
            message.context.stationId,
            ChargingStationSequenceType.getDisplayMessages,
          ),
        } as OCPP2_0_1.GetDisplayMessagesRequest,
      );
    }
  }

  @AsHandler(OCPPVersion.OCPP2_0_1, OCPP2_0_1_CallAction.PublishFirmware)
  protected _handlePublishFirmware(
    message: IMessage<OCPP2_0_1.PublishFirmwareResponse>,
    props?: HandlerProperties,
  ): void {
    this._logger.debug('PublishFirmware response received:', message, props);
  }

  @AsHandler(OCPPVersion.OCPP2_0_1, OCPP2_0_1_CallAction.UnpublishFirmware)
  protected _handleUnpublishFirmware(
    message: IMessage<OCPP2_0_1.UnpublishFirmwareResponse>,
    props?: HandlerProperties,
  ): void {
    this._logger.debug('UnpublishFirmware response received:', message, props);
  }

  @AsHandler(OCPPVersion.OCPP2_0_1, OCPP2_0_1_CallAction.UpdateFirmware)
  protected _handleUpdateFirmware(
    message: IMessage<OCPP2_0_1.UpdateFirmwareResponse>,
    props?: HandlerProperties,
  ): void {
    this._logger.debug('UpdateFirmware response received:', message, props);
  }

  @AsHandler(OCPPVersion.OCPP2_0_1, OCPP2_0_1_CallAction.Reset)
  protected _handleReset(
    message: IMessage<OCPP2_0_1.ResetResponse>,
    props?: HandlerProperties,
  ): void {
    this._logger.debug('Reset response received:', message, props);
  }

  @AsHandler(OCPPVersion.OCPP2_0_1, OCPP2_0_1_CallAction.TriggerMessage)
  protected _handleTriggerMessage(
    message: IMessage<OCPP2_0_1.TriggerMessageResponse>,
    props?: HandlerProperties,
  ): void {
    this._logger.debug('TriggerMessage response received:', message, props);
  }

  @AsHandler(OCPPVersion.OCPP2_0_1, OCPP2_0_1_CallAction.ClearDisplayMessage)
  protected async _handleClearDisplayMessage(
    message: IMessage<OCPP2_0_1.ClearDisplayMessageResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug(
      'ClearDisplayMessage response received:',
      message,
      props,
    );

    const status = message.payload
      .status as OCPP2_0_1.ClearMessageStatusEnumType;
    // when charger station accepts the clear message info request
    // we trigger a get all display messages request to update stored message info in db
    if (status === OCPP2_0_1.ClearMessageStatusEnumType.Accepted) {
      await this._messageInfoRepository.deactivateAllByStationId(
        message.context.stationId,
      );
      await this.sendCall(
        message.context.stationId,
        message.context.tenantId,
        OCPPVersion.OCPP2_0_1,
        OCPP2_0_1_CallAction.GetDisplayMessages,
        {
          requestId: await this._idGenerator.generateRequestId(
            message.context.stationId,
            ChargingStationSequenceType.getDisplayMessages,
          ),
        } as OCPP2_0_1.GetDisplayMessagesRequest,
      );
    }
  }

  //OCPP 1.6 Handlers

  @AsHandler(OCPPVersion.OCPP1_6, OCPP1_6_CallAction.Heartbeat)
  protected async _handle16Heartbeat(
    message: IMessage<OCPP1_6.HeartbeatRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('Heartbeat received:', message, props);

    // Create response
    const response: OCPP1_6.HeartbeatResponse = {
      currentTime: new Date().toISOString(),
    };

    const messageConfirmation = await this.sendCallResultWithMessage(
      message,
      response,
    );
    this._logger.debug('Heartbeat response sent: ', messageConfirmation);
  }
}
