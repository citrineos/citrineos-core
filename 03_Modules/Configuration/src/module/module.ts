// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {
  AbstractModule,
  AsHandler,
  BOOT_STATUS,
  BootNotificationRequest,
  BootNotificationResponse,
  CallAction,
  ChangeAvailabilityResponse,
  ChargingStationSequenceType,
  ClearDisplayMessageResponse,
  ClearMessageStatusEnumType,
  DataTransferRequest,
  DataTransferResponse,
  DataTransferStatusEnumType,
  DisplayMessageStatusEnumType,
  ErrorCode,
  EventGroup,
  FirmwareStatusNotificationRequest,
  FirmwareStatusNotificationResponse,
  GetDisplayMessagesRequest,
  GetDisplayMessagesResponse,
  HandlerProperties,
  HeartbeatRequest,
  HeartbeatResponse,
  ICache,
  IMessage,
  IMessageConfirmation,
  IMessageHandler,
  IMessageSender,
  MessageInfoType,
  NotifyDisplayMessagesRequest,
  NotifyDisplayMessagesResponse,
  PublishFirmwareResponse,
  RegistrationStatusEnumType,
  ResetEnumType,
  ResetRequest,
  ResetResponse,
  SetDisplayMessageResponse,
  SetNetworkProfileResponse,
  SetNetworkProfileStatusEnumType,
  SetVariableDataType,
  SetVariablesRequest,
  SetVariablesResponse,
  SetVariableStatusEnumType,
  SystemConfig,
  TriggerMessageResponse,
  UnpublishFirmwareResponse,
  UpdateFirmwareResponse,
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
    CallAction.BootNotification,
    CallAction.DataTransfer,
    CallAction.FirmwareStatusNotification,
    CallAction.Heartbeat,
    CallAction.NotifyDisplayMessages,
    CallAction.PublishFirmwareStatusNotification,
  ];

  _responses: CallAction[] = [
    CallAction.ChangeAvailability,
    CallAction.ClearDisplayMessage,
    CallAction.GetDisplayMessages,
    CallAction.PublishFirmware,
    CallAction.Reset,
    CallAction.SetDisplayMessage,
    CallAction.SetNetworkProfile,
    CallAction.TriggerMessage,
    CallAction.UnpublishFirmware,
    CallAction.UpdateFirmware,
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

  @AsHandler(CallAction.BootNotification)
  protected async _handleBootNotification(
    message: IMessage<BootNotificationRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('BootNotification received:', message, props);

    const stationId = message.context.stationId;
    const tenantId = message.context.tenantId;
    const timestamp = message.context.timestamp;
    const chargingStation = message.payload.chargingStation;

    const bootNotificationResponse: BootNotificationResponse =
      await this._bootService.createBootNotificationResponse(stationId);

    // Check cached boot status for charger. Only Pending and Rejected statuses are cached.
    const cachedBootStatus: RegistrationStatusEnumType | null =
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
      bootNotificationResponse.status !== RegistrationStatusEnumType.Accepted &&
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
      bootNotificationResponse.status !== RegistrationStatusEnumType.Pending ||
      (cachedBootStatus &&
        cachedBootStatus === RegistrationStatusEnumType.Pending)
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
      await this._cache.remove(CallAction.NotifyReport, stationId);

      const getBaseReportRequest =
        await this._bootService.createGetBaseReportRequest(
          stationId,
          this._config.maxCachingSeconds,
        );

      const getBaseReportConfirmation = await this.sendCall(
        stationId,
        tenantId,
        CallAction.GetBaseReport,
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

      let setVariableData: SetVariableDataType[] =
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
          CallAction.SetVariables,
          {
            setVariableData: setVariableData.slice(
              0,
              itemsPerMessageSetVariables,
            ),
          } as SetVariablesRequest,
          undefined,
          correlationId,
        );

        setVariableData = setVariableData.slice(itemsPerMessageSetVariables);

        const setVariablesResponseJsonString = await cacheCallbackPromise;

        if (setVariablesResponseJsonString) {
          if (rejectedSetVariable && rebootSetVariable) {
            continue;
          }

          const setVariablesResponse: SetVariablesResponse = JSON.parse(
            setVariablesResponseJsonString,
          );
          setVariablesResponse.setVariableResult.forEach((result) => {
            if (result.attributeStatus === SetVariableStatusEnumType.Rejected) {
              rejectedSetVariable = true;
            } else if (
              result.attributeStatus ===
              SetVariableStatusEnumType.RebootRequired
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
        bootConfigDbEntity.status = RegistrationStatusEnumType.Rejected;
        await bootConfigDbEntity.save();
        // No more to do.
        return;
      }
    }

    if (this._config.modules.configuration.autoAccept) {
      // Update boot config with status accepted
      // TODO: Determine how/if StatusInfo should be generated
      bootConfigDbEntity.status = RegistrationStatusEnumType.Accepted;
      await bootConfigDbEntity.save();
    }

    if (rebootSetVariable) {
      // Charger SHALL not be in a transaction as it has not yet successfully booted, therefore it is appropriate to send an Immediate Reset
      await this.sendCall(stationId, tenantId, CallAction.Reset, {
        type: ResetEnumType.Immediate,
      } as ResetRequest);
    } else {
      // We could trigger the new boot immediately rather than wait for the retry, as nothing more now needs to be done.
      // However, B02.FR.02 - Spec allows for TriggerMessageRequest - OCTT fails over trigger
      // Commenting out until OCTT behavior changes.
      // this.sendCall(stationId, tenantId, CallAction.TriggerMessage,
      //   { requestedMessage: MessageTriggerEnumType.BootNotification } as TriggerMessageRequest);
    }
  }

  @AsHandler(CallAction.Heartbeat)
  protected async _handleHeartbeat(
    message: IMessage<HeartbeatRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('Heartbeat received:', message, props);

    // Create response
    const response: HeartbeatResponse = {
      currentTime: new Date().toISOString(),
    };

    const messageConfirmation = await this.sendCallResultWithMessage(
      message,
      response,
    );
    this._logger.debug('Heartbeat response sent: ', messageConfirmation);
  }

  @AsHandler(CallAction.NotifyDisplayMessages)
  protected async _handleNotifyDisplayMessages(
    message: IMessage<NotifyDisplayMessagesRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('NotifyDisplayMessages received: ', message, props);

    const messageInfoTypes = message.payload.messageInfo as MessageInfoType[];
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
    const response: NotifyDisplayMessagesResponse = {};

    const messageConfirmation = await this.sendCallResultWithMessage(
      message,
      response,
    );
    this._logger.debug(
      'NotifyDisplayMessages response sent: ',
      messageConfirmation,
    );
  }

  @AsHandler(CallAction.FirmwareStatusNotification)
  protected async _handleFirmwareStatusNotification(
    message: IMessage<FirmwareStatusNotificationRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('FirmwareStatusNotification received:', message, props);

    // TODO: FirmwareStatusNotification is usually triggered. Ideally, it should be sent to the callbackUrl from the message api that sent the trigger message

    // Create response
    const response: FirmwareStatusNotificationResponse = {};

    const messageConfirmation = await this.sendCallResultWithMessage(
      message,
      response,
    );
    this._logger.debug(
      'FirmwareStatusNotification response sent: ',
      messageConfirmation,
    );
  }

  @AsHandler(CallAction.DataTransfer)
  protected async _handleDataTransfer(
    message: IMessage<DataTransferRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('DataTransfer received:', message, props);

    // Create response
    const response: DataTransferResponse = {
      status: DataTransferStatusEnumType.Rejected,
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

  @AsHandler(CallAction.ChangeAvailability)
  protected _handleChangeAvailability(
    message: IMessage<ChangeAvailabilityResponse>,
    props?: HandlerProperties,
  ): void {
    this._logger.debug('ChangeAvailability response received:', message, props);
  }

  @AsHandler(CallAction.SetNetworkProfile)
  protected async _handleSetNetworkProfile(
    message: IMessage<SetNetworkProfileResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('SetNetworkProfile response received:', message, props);

    if (message.payload.status == SetNetworkProfileStatusEnumType.Accepted) {
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

  @AsHandler(CallAction.GetDisplayMessages)
  protected _handleGetDisplayMessages(
    message: IMessage<GetDisplayMessagesResponse>,
    props?: HandlerProperties,
  ): void {
    this._logger.debug('GetDisplayMessages response received:', message, props);
  }

  @AsHandler(CallAction.SetDisplayMessage)
  protected async _handleSetDisplayMessage(
    message: IMessage<SetDisplayMessageResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('SetDisplayMessage response received:', message, props);

    const status = message.payload.status as DisplayMessageStatusEnumType;
    // when charger station accepts the set message info request
    // we trigger a get all display messages request to update stored message info in db
    if (status === DisplayMessageStatusEnumType.Accepted) {
      await this._messageInfoRepository.deactivateAllByStationId(
        message.context.stationId,
      );
      await this.sendCall(
        message.context.stationId,
        message.context.tenantId,
        CallAction.GetDisplayMessages,
        {
          requestId: await this._idGenerator.generateRequestId(
            message.context.stationId,
            ChargingStationSequenceType.getDisplayMessages,
          ),
        } as GetDisplayMessagesRequest,
      );
    }
  }

  @AsHandler(CallAction.PublishFirmware)
  protected _handlePublishFirmware(
    message: IMessage<PublishFirmwareResponse>,
    props?: HandlerProperties,
  ): void {
    this._logger.debug('PublishFirmware response received:', message, props);
  }

  @AsHandler(CallAction.UnpublishFirmware)
  protected _handleUnpublishFirmware(
    message: IMessage<UnpublishFirmwareResponse>,
    props?: HandlerProperties,
  ): void {
    this._logger.debug('UnpublishFirmware response received:', message, props);
  }

  @AsHandler(CallAction.UpdateFirmware)
  protected _handleUpdateFirmware(
    message: IMessage<UpdateFirmwareResponse>,
    props?: HandlerProperties,
  ): void {
    this._logger.debug('UpdateFirmware response received:', message, props);
  }

  @AsHandler(CallAction.Reset)
  protected _handleReset(
    message: IMessage<ResetResponse>,
    props?: HandlerProperties,
  ): void {
    this._logger.debug('Reset response received:', message, props);
  }

  @AsHandler(CallAction.TriggerMessage)
  protected _handleTriggerMessage(
    message: IMessage<TriggerMessageResponse>,
    props?: HandlerProperties,
  ): void {
    this._logger.debug('TriggerMessage response received:', message, props);
  }

  @AsHandler(CallAction.ClearDisplayMessage)
  protected async _handleClearDisplayMessage(
    message: IMessage<ClearDisplayMessageResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug(
      'ClearDisplayMessage response received:',
      message,
      props,
    );

    const status = message.payload.status as ClearMessageStatusEnumType;
    // when charger station accepts the clear message info request
    // we trigger a get all display messages request to update stored message info in db
    if (status === ClearMessageStatusEnumType.Accepted) {
      await this._messageInfoRepository.deactivateAllByStationId(
        message.context.stationId,
      );
      await this.sendCall(
        message.context.stationId,
        message.context.tenantId,
        CallAction.GetDisplayMessages,
        {
          requestId: await this._idGenerator.generateRequestId(
            message.context.stationId,
            ChargingStationSequenceType.getDisplayMessages,
          ),
        } as GetDisplayMessagesRequest,
      );
    }
  }
}
