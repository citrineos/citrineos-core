// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {
  AbstractModule,
  AsHandler,
  CallAction,
  CustomerInformationResponse,
  EventGroup,
  GenericDeviceModelStatusEnumType,
  GetBaseReportResponse,
  GetLogResponse,
  GetMonitoringReportResponse,
  GetReportResponse,
  HandlerProperties,
  ICache,
  IMessage,
  IMessageHandler,
  IMessageSender,
  LogStatusNotificationRequest,
  LogStatusNotificationResponse,
  MutabilityEnumType,
  NotifyCustomerInformationRequest,
  NotifyCustomerInformationResponse,
  NotifyMonitoringReportRequest,
  NotifyMonitoringReportResponse,
  NotifyReportRequest,
  NotifyReportResponse,
  SecurityEventNotificationRequest,
  SecurityEventNotificationResponse,
  SetVariableStatusEnumType,
  StatusInfoType,
  SystemConfig,
} from '@citrineos/base';
import {
  Component,
  IDeviceModelRepository,
  ISecurityEventRepository,
  IVariableMonitoringRepository,
  sequelize,
  Variable,
} from '@citrineos/data';
import { RabbitMqReceiver, RabbitMqSender, Timer } from '@citrineos/util';
import deasyncPromise from 'deasync-promise';
import { ILogObj, Logger } from 'tslog';
import { DeviceModelService } from './services';

/**
 * Component that handles provisioning related messages.
 */
export class ReportingModule extends AbstractModule {
  /**
   * Get Base Report variables. While NotifyReport requests correlated with a GetBaseReport's requestId
   * are still being sent, cache value is 'ongoing'. Once a NotifyReport with tbc === false (or undefined)
   * is received, cache value is 'complete'.
   */
  static readonly GET_BASE_REPORT_REQUEST_ID_MAX = 10000000; // 10,000,000
  static readonly GET_BASE_REPORT_ONGOING_CACHE_VALUE = 'ongoing';
  static readonly GET_BASE_REPORT_COMPLETE_CACHE_VALUE = 'complete';

  public _deviceModelService: DeviceModelService;

  /**
   * Fields
   */

  protected _requests: CallAction[] = [
    CallAction.LogStatusNotification,
    CallAction.NotifyCustomerInformation,
    CallAction.NotifyReport,
    CallAction.SecurityEventNotification,
    CallAction.NotifyMonitoringReport,
  ];

  protected _responses: CallAction[] = [
    CallAction.CustomerInformation,
    CallAction.GetLog,
    CallAction.GetReport,
    CallAction.GetBaseReport,
    CallAction.GetMonitoringReport,
  ];

  protected _deviceModelRepository: IDeviceModelRepository;
  protected _securityEventRepository: ISecurityEventRepository;
  protected _variableMonitoringRepository: IVariableMonitoringRepository;

  /**
   * Constructor
   */

  /**
   * This is the constructor function that initializes the {@link ReportingModule}.
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
   * If no `deviceModelRepository` is provided, a default {@link sequelize:deviceModelRepository} instance is created and used.
   *
   * @param {ISecurityEventRepository} [securityEventRepository] - An optional parameter of type {@link ISecurityEventRepository} which represents a repository for accessing security event notification data.
   *
   * @param {IVariableMonitoringRepository} [variableMonitoringRepository] - An optional parameter of type {@link IVariableMonitoringRepository} which represents a repository for accessing and manipulating monitoring data.
   */
  constructor(
    config: SystemConfig,
    cache: ICache,
    sender?: IMessageSender,
    handler?: IMessageHandler,
    logger?: Logger<ILogObj>,
    deviceModelRepository?: IDeviceModelRepository,
    securityEventRepository?: ISecurityEventRepository,
    variableMonitoringRepository?: IVariableMonitoringRepository,
  ) {
    super(
      config,
      cache,
      handler || new RabbitMqReceiver(config, logger),
      sender || new RabbitMqSender(config, logger),
      EventGroup.Reporting,
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
    this._securityEventRepository =
      securityEventRepository ||
      new sequelize.SequelizeSecurityEventRepository(config, this._logger);
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

  /**
   * Handle Requests
   */

  @AsHandler(CallAction.LogStatusNotification)
  protected _handleLogStatusNotification(
    message: IMessage<LogStatusNotificationRequest>,
    props?: HandlerProperties,
  ): void {
    this._logger.debug('LogStatusNotification received:', message, props);

    // TODO: LogStatusNotification is usually triggered. Ideally, it should be sent to the callbackUrl from the message api that sent the trigger message

    // Create response
    const response: LogStatusNotificationResponse = {};

    this.sendCallResultWithMessage(message, response).then(
      (messageConfirmation) => {
        this._logger.debug(
          'LogStatusNotification response sent: ',
          messageConfirmation,
        );
      },
    );
  }

  @AsHandler(CallAction.NotifyCustomerInformation)
  protected _handleNotifyCustomerInformation(
    message: IMessage<NotifyCustomerInformationRequest>,
    props?: HandlerProperties,
  ): void {
    this._logger.debug(
      'NotifyCustomerInformation request received:',
      message,
      props,
    );

    // Create response
    const response: NotifyCustomerInformationResponse = {};

    this.sendCallResultWithMessage(message, response).then(
      (messageConfirmation) => {
        this._logger.debug(
          'NotifyCustomerInformation response sent: ',
          messageConfirmation,
        );
      },
    );
  }

  @AsHandler(CallAction.NotifyMonitoringReport)
  protected async _handleNotifyMonitoringReport(
    message: IMessage<NotifyMonitoringReportRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug(
      'NotifyMonitoringReport request received:',
      message,
      props,
    );

    for (const monitorType of message.payload.monitor
      ? message.payload.monitor
      : []) {
      const stationId: string = message.context.stationId;
      const [component, variable] =
        await this._deviceModelRepository.findComponentAndVariable(
          monitorType.component,
          monitorType.variable,
        );
      await this._variableMonitoringRepository.createOrUpdateByMonitoringDataTypeAndStationId(
        monitorType,
        component ? component.id : null,
        variable ? variable.id : null,
        stationId,
      );
    }

    // Create response
    const response: NotifyMonitoringReportResponse = {};

    this.sendCallResultWithMessage(message, response).then(
      (messageConfirmation) => {
        this._logger.debug(
          'NotifyMonitoringReport response sent: ',
          messageConfirmation,
        );
      },
    );
  }

  @AsHandler(CallAction.NotifyReport)
  protected async _handleNotifyReport(
    message: IMessage<NotifyReportRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.info('NotifyReport received:', message, props);

    for (const reportDataType of message.payload.reportData
      ? message.payload.reportData
      : []) {
      // To keep consistency with VariableAttributeType defined in OCPP 2.0.1:
      // mutability: Default is ReadWrite when omitted.
      // if it is not present, we set it to ReadWrite
      for (const variableAttr of reportDataType.variableAttribute) {
        if (!variableAttr.mutability) {
          variableAttr.mutability = MutabilityEnumType.ReadWrite;
        }
      }
      const variableAttributes =
        await this._deviceModelRepository.createOrUpdateDeviceModelByStationId(
          reportDataType,
          message.context.stationId,
        );
      for (const variableAttribute of variableAttributes) {
        // Reload is necessary because in createOrUpdateDeviceModelByStationId does not do eager loading
        await variableAttribute.reload({
          include: [Component, Variable],
        });
        this._deviceModelRepository.updateResultByStationId(
          {
            attributeType: variableAttribute.type,
            attributeStatus: SetVariableStatusEnumType.Accepted,
            attributeStatusInfo: { reasonCode: message.action },
            component: variableAttribute.component,
            variable: variableAttribute.variable,
          },
          message.context.stationId,
        );
      }
    }

    if (!message.payload.tbc) {
      // Default if omitted is false
      const success = await this._cache.set(
        message.payload.requestId.toString(),
        ReportingModule.GET_BASE_REPORT_COMPLETE_CACHE_VALUE,
        message.context.stationId,
      );
      this._logger.info('Completed', success, message.payload.requestId);
    } else {
      // tbc (to be continued) is true
      // Continue to set get base report ongoing. Will extend the timeout.
      const success = await this._cache.set(
        message.payload.requestId.toString(),
        ReportingModule.GET_BASE_REPORT_ONGOING_CACHE_VALUE,
        message.context.stationId,
        this.config.maxCachingSeconds,
      );
      this._logger.info('Ongoing', success, message.payload.requestId);
    }

    // Create response
    const response: NotifyReportResponse = {};

    this.sendCallResultWithMessage(message, response).then(() => {
      this._logger.debug('NotifyReport response sent:', message, props);
    });
  }

  @AsHandler(CallAction.SecurityEventNotification)
  protected _handleSecurityEventNotification(
    message: IMessage<SecurityEventNotificationRequest>,
    props?: HandlerProperties,
  ): void {
    this._logger.debug(
      'SecurityEventNotification request received:',
      message,
      props,
    );
    this._securityEventRepository.createByStationId(
      message.payload,
      message.context.stationId,
    );
    this.sendCallResultWithMessage(
      message,
      {} as SecurityEventNotificationResponse,
    );
  }

  /**
   * Handle responses
   */

  @AsHandler(CallAction.GetBaseReport)
  protected _handleGetBaseReport(
    message: IMessage<GetBaseReportResponse>,
    props?: HandlerProperties,
  ): void {
    this._logger.debug('GetBaseReport response received:', message, props);
  }

  @AsHandler(CallAction.GetReport)
  protected _handleGetReport(
    message: IMessage<GetReportResponse>,
    props?: HandlerProperties,
  ): void {
    this._logger.debug('GetReport response received:', message, props);

    const status: GenericDeviceModelStatusEnumType = message.payload.status;
    const statusInfo: StatusInfoType | undefined = message.payload.statusInfo;
    if (
      status === GenericDeviceModelStatusEnumType.Rejected ||
      status === GenericDeviceModelStatusEnumType.NotSupported
    ) {
      this._logger.error(
        'Failed to get report.',
        status,
        statusInfo?.reasonCode,
        statusInfo?.additionalInfo,
      );
    }
  }

  @AsHandler(CallAction.GetMonitoringReport)
  protected async _handleGetMonitoringReport(
    message: IMessage<GetMonitoringReportResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
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

  @AsHandler(CallAction.GetLog)
  protected _handleGetLog(
    message: IMessage<GetLogResponse>,
    props?: HandlerProperties,
  ): void {
    this._logger.debug('GetLog response received:', message, props);
  }

  @AsHandler(CallAction.CustomerInformation)
  protected _handleCustomerInformation(
    message: IMessage<CustomerInformationResponse>,
    props?: HandlerProperties,
  ): void {
    this._logger.debug(
      'CustomerInformation response received:',
      message,
      props,
    );
  }
}
