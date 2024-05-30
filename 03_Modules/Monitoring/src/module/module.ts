// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {
  AbstractModule,
  AsHandler,
  CallAction,
  ClearMonitoringStatusEnumType,
  ClearVariableMonitoringResponse,
  EventDataType,
  EventGroup,
  GenericDeviceModelStatusEnumType,
  GenericStatusEnumType,
  GetMonitoringReportRequest,
  GetMonitoringReportResponse,
  GetVariablesResponse,
  HandlerProperties,
  ICache,
  IMessage,
  IMessageHandler,
  IMessageSender,
  NotifyEventRequest,
  NotifyEventResponse,
  SetMonitoringBaseResponse,
  SetMonitoringLevelResponse,
  SetVariableMonitoringResponse,
  SetVariablesResponse,
  StatusInfoType,
  SystemConfig,
} from '@citrineos/base';
import {
  IDeviceModelRepository,
  IVariableMonitoringRepository,
  sequelize,
} from '@citrineos/data';
import { RabbitMqReceiver, RabbitMqSender, Timer } from '@citrineos/util';
import deasyncPromise from 'deasync-promise';
import { ILogObj, Logger } from 'tslog';
import { DeviceModelService } from './services';

/**
 * Component that handles monitoring related messages.
 */
export class MonitoringModule extends AbstractModule {
  public _deviceModelService: DeviceModelService;

  protected _requests: CallAction[] = [CallAction.NotifyEvent];
  protected _responses: CallAction[] = [
    CallAction.ClearVariableMonitoring,
    CallAction.GetVariables,
    CallAction.SetMonitoringBase,
    CallAction.SetMonitoringLevel,
    CallAction.GetMonitoringReport,
    CallAction.SetVariableMonitoring,
    CallAction.SetVariables,
  ];

  protected _deviceModelRepository: IDeviceModelRepository;
  protected _variableMonitoringRepository: IVariableMonitoringRepository;

  /**
   * This is the constructor function that initializes the {@link MonitoringModule}.
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
   * @param {IDeviceModelRepository} [deviceModelRepository] - An optional parameter of type {@link IDeviceModelRepository} which represents a repository for accessing and manipulating variable data.
   * If no `deviceModelRepository` is provided, a default {@link sequelize.DeviceModelRepository} instance is created and used.
   *
   * @param {IVariableMonitoringRepository} [variableMonitoringRepository] - An optional parameter of type {@link IVariableMonitoringRepository}
   * which represents a repository for accessing and manipulating variable monitoring data.
   * If no `variableMonitoringRepository` is provided, a default {@link sequelize:variableMonitoringRepository} }
   * instance is created and used.
   */
  constructor(
    config: SystemConfig,
    cache: ICache,
    sender?: IMessageSender,
    handler?: IMessageHandler,
    logger?: Logger<ILogObj>,
    deviceModelRepository?: IDeviceModelRepository,
    variableMonitoringRepository?: IVariableMonitoringRepository,
  ) {
    super(
      config,
      cache,
      handler || new RabbitMqReceiver(config, logger),
      sender || new RabbitMqSender(config, logger),
      EventGroup.Monitoring,
      logger,
    );

    const timer = new Timer();
    this._logger.info('Initializing...');

    if (!deasyncPromise(this._initHandler(this._requests, this._responses))) {
      throw new Error(
        'Could not initialize module due to failure in handler initialization.',
      );
    }

    this._deviceModelRepository =
      deviceModelRepository ||
      new sequelize.SequelizeDeviceModelRepository(config, this._logger);
    this._variableMonitoringRepository =
      variableMonitoringRepository ||
      new sequelize.SequelizeVariableMonitoringRepository(config, this._logger);

    this._deviceModelService = new DeviceModelService(
      this._deviceModelRepository,
    );

    this._logger.info(`Initialized in ${timer.end()}ms...`);
  }

  get deviceModelRepository(): IDeviceModelRepository {
    return this._deviceModelRepository;
  }
  get variableMonitoringRepository(): IVariableMonitoringRepository {
    return this._variableMonitoringRepository;
  }

  /**
   * Handle requests
   */

  @AsHandler(CallAction.NotifyEvent)
  protected async _handleNotifyEvent(
    message: IMessage<NotifyEventRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('NotifyEvent received:', message, props);

    const events = message.payload.eventData as EventDataType[];
    for (const event of events) {
      const stationId = message.context.stationId;
      const [component, variable] =
        await this._deviceModelRepository.findComponentAndVariable(
          event.component,
          event.variable,
        );
      await this._variableMonitoringRepository.createEventDatumByComponentIdAndVariableIdAndStationId(
        event,
        component?.id,
        variable?.id,
        stationId,
      );
    }

    // Create response
    const response: NotifyEventResponse = {};

    this.sendCallResultWithMessage(message, response).then(
      (messageConfirmation) => {
        this._logger.debug('NotifyEvent response sent:', messageConfirmation);
      },
    );
  }

  /**
   * Handle responses
   */

  @AsHandler(CallAction.SetVariableMonitoring)
  protected async _handleSetVariableMonitoring(
    message: IMessage<SetVariableMonitoringResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug(
      'SetVariableMonitoring response received:',
      message,
      props,
    );

    for (const setMonitoringResultType of message.payload.setMonitoringResult) {
      await this._variableMonitoringRepository.updateResultByStationId(
        setMonitoringResultType,
        message.context.stationId,
      );
    }
  }

  @AsHandler(CallAction.ClearVariableMonitoring)
  protected async _handleClearVariableMonitoring(
    message: IMessage<ClearVariableMonitoringResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug(
      'ClearVariableMonitoring response received:',
      message,
      props,
    );

    for (const clearMonitoringResultType of message.payload
      .clearMonitoringResult) {
      const resultStatus: ClearMonitoringStatusEnumType =
        clearMonitoringResultType.status;
      const monitorId: number = clearMonitoringResultType.id;

      // Reject the variable monitoring if Charging Station accepts to clear or cannot find it.
      if (
        resultStatus === ClearMonitoringStatusEnumType.Accepted ||
        resultStatus === ClearMonitoringStatusEnumType.NotFound
      ) {
        await this._variableMonitoringRepository.rejectVariableMonitoringByIdAndStationId(
          CallAction.ClearVariableMonitoring,
          monitorId,
          message.context.stationId,
        );
      } else {
        const statusInfo: StatusInfoType | undefined =
          clearMonitoringResultType.statusInfo;
        this._logger.error(
          'Failed to clear variable monitoring.',
          monitorId,
          resultStatus,
          statusInfo?.reasonCode,
          statusInfo?.additionalInfo,
        );
      }
    }
  }

  @AsHandler(CallAction.GetMonitoringReport)
  protected _handleGetMonitoringReport(
    message: IMessage<GetMonitoringReportResponse>,
    props?: HandlerProperties,
  ): void {
    this._logger.debug(
      'GetMonitoringReport response received:',
      message,
      props,
    );

    const status: GenericDeviceModelStatusEnumType = message.payload.status;
    const statusInfo: StatusInfoType | undefined = message.payload.statusInfo;

    if (
      status === GenericDeviceModelStatusEnumType.Rejected ||
      status === GenericDeviceModelStatusEnumType.NotSupported
    ) {
      this._logger.error(
        'Failed to get monitoring report.',
        status,
        statusInfo?.reasonCode,
        statusInfo?.additionalInfo,
      );
    }
  }

  @AsHandler(CallAction.SetMonitoringLevel)
  protected _handleSetMonitoringLevel(
    message: IMessage<SetMonitoringLevelResponse>,
    props?: HandlerProperties,
  ): void {
    this._logger.debug('SetMonitoringLevel response received:', message, props);

    const status: GenericStatusEnumType = message.payload.status;
    const statusInfo: StatusInfoType | undefined = message.payload.statusInfo;
    if (status === GenericStatusEnumType.Rejected) {
      this._logger.error(
        'Failed to set monitoring level.',
        status,
        statusInfo?.reasonCode,
        statusInfo?.additionalInfo,
      );
    }
  }

  @AsHandler(CallAction.SetMonitoringBase)
  protected async _handleSetMonitoringBase(
    message: IMessage<SetMonitoringBaseResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('SetMonitoringBase response received:', message, props);

    const status: GenericDeviceModelStatusEnumType = message.payload.status;
    const statusInfo: StatusInfoType | undefined = message.payload.statusInfo;

    if (
      status === GenericDeviceModelStatusEnumType.Rejected ||
      status === GenericDeviceModelStatusEnumType.NotSupported
    ) {
      this._logger.error(
        'Failed to set monitoring base.',
        status,
        statusInfo?.reasonCode,
        statusInfo?.additionalInfo,
      );
    } else {
      // After setting monitoring base, variable monitorings on charger side are influenced
      // To get all the latest monitoring data, we intend to mask all variable monitorings on the charger as rejected.
      // Then request a GetMonitoringReport for all monitorings
      const stationId: string = message.context.stationId;
      await this._variableMonitoringRepository.rejectAllVariableMonitoringsByStationId(
        CallAction.SetVariableMonitoring,
        stationId,
      );
      this._logger.debug(
        'Rejected all variable monitorings on the charger',
        stationId,
      );

      // TODO: requestId is generated randomly. Think about changing it if it doesn't work on real chargers.
      await this.sendCall(
        stationId,
        message.context.tenantId,
        CallAction.GetMonitoringReport,
        {
          requestId: Math.floor(Math.random() * 1000),
        } as GetMonitoringReportRequest,
      );
    }
  }

  @AsHandler(CallAction.GetVariables)
  protected async _handleGetVariables(
    message: IMessage<GetVariablesResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('GetVariables response received:', message, props);
    this._deviceModelRepository.createOrUpdateByGetVariablesResultAndStationId(
      message.payload.getVariableResult,
      message.context.stationId,
    );
  }

  @AsHandler(CallAction.SetVariables)
  protected async _handleSetVariables(
    message: IMessage<SetVariablesResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('SetVariables response received:', message, props);

    message.payload.setVariableResult.forEach(async (setVariableResultType) => {
      this._deviceModelRepository.updateResultByStationId(
        setVariableResultType,
        message.context.stationId,
      );
    });
  }
}
