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
import {
  IDeviceModelRepository,
  IVariableMonitoringRepository,
  SequelizeChargingStationSequenceRepository,
  SequelizeDeviceModelRepository,
  SequelizeVariableMonitoringRepository,
} from '@citrineos/data';
import { IdGenerator, RabbitMqReceiver, RabbitMqSender } from '@citrineos/util';
import { ILogObj, Logger } from 'tslog';
import { DeviceModelService } from './services';
import { MonitoringService } from './MonitoringService';

/**
 * Component that handles monitoring related messages.
 */
export class MonitoringModule extends AbstractModule {
  public _deviceModelService: DeviceModelService;
  protected _monitoringService: MonitoringService;

  _requests: CallAction[] = [];

  _responses: CallAction[] = [];

  protected _deviceModelRepository: IDeviceModelRepository;
  protected _variableMonitoringRepository: IVariableMonitoringRepository;
  private _idGenerator: IdGenerator;

  /**
   * This is the constructor function that initializes the {@link MonitoringModule}.
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
   * It is used to propagate system-wide logger settings and will serve as the parent logger for any subcomponent logging. If no `logger` is provided, a default {@link Logger<ILogObj>} instance is created and used.
   *
   * @param {IDeviceModelRepository} [deviceModelRepository] - An optional parameter of type {@link IDeviceModelRepository} which represents a repository for accessing and manipulating variable data.
   * If no `deviceModelRepository` is provided, a default {@link SequelizeDeviceModelRepository} instance is created and used.
   *
   * @param {IVariableMonitoringRepository} [variableMonitoringRepository] - An optional parameter of type {@link IVariableMonitoringRepository}
   * which represents a repository for accessing and manipulating variable monitoring data.
   * If no `variableMonitoringRepository` is provided, a default {@link SequelizeVariableMonitoringRepository}
   * instance is created and used.
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
    deviceModelRepository?: IDeviceModelRepository,
    variableMonitoringRepository?: IVariableMonitoringRepository,
    idGenerator?: IdGenerator,
  ) {
    super(
      config,
      cache,
      handler || new RabbitMqReceiver(config, logger),
      sender || new RabbitMqSender(config, logger),
      EventGroup.Monitoring,
      logger,
    );

    this._requests = config.modules.monitoring.requests;
    this._responses = config.modules.monitoring.responses;

    this._deviceModelRepository =
      deviceModelRepository || new SequelizeDeviceModelRepository(config, this._logger);
    this._variableMonitoringRepository =
      variableMonitoringRepository ||
      new SequelizeVariableMonitoringRepository(config, this._logger);

    this._deviceModelService = new DeviceModelService(this._deviceModelRepository);
    this._monitoringService = new MonitoringService(
      this._variableMonitoringRepository,
      this._logger,
    );

    this._idGenerator =
      idGenerator ||
      new IdGenerator(new SequelizeChargingStationSequenceRepository(config, this._logger));
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

  @AsHandler(OCPPVersion.OCPP2_0_1, OCPP2_0_1_CallAction.NotifyEvent)
  protected async _handleNotifyEvent(
    message: IMessage<OCPP2_0_1.NotifyEventRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('NotifyEvent received:', message, props);
    const stationId = message.context.stationId;

    const events = message.payload.eventData as OCPP2_0_1.EventDataType[];
    for (const event of events) {
      const [component, variable] =
        await this._deviceModelRepository.findOrCreateEvseAndComponentAndVariable(
          message.context.tenantId,
          event.component,
          event.variable,
        );
      await this._variableMonitoringRepository.createEventDatumByComponentIdAndVariableIdAndStationId(
        message.context.tenantId,
        event,
        component?.id,
        variable?.id,
        stationId,
      );
      const reportDataType: OCPP2_0_1.ReportDataType = {
        component,
        variable,
        variableAttribute: [
          {
            value: event.actualValue,
          },
        ],
      };
      await this._deviceModelRepository.createOrUpdateDeviceModelByStationId(
        message.context.tenantId,
        reportDataType,
        stationId,
        message.payload.generatedAt,
      );
    }

    // Create response
    const response: OCPP2_0_1.NotifyEventResponse = {};

    const messageConfirmation = await this.sendCallResultWithMessage(message, response);
    this._logger.debug('NotifyEvent response sent:', messageConfirmation);
  }

  /**
   * Handle responses
   */

  @AsHandler(OCPPVersion.OCPP2_0_1, OCPP2_0_1_CallAction.SetVariableMonitoring)
  protected async _handleSetVariableMonitoring(
    message: IMessage<OCPP2_0_1.SetVariableMonitoringResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('SetVariableMonitoring response received:', message, props);

    for (const setMonitoringResultType of message.payload.setMonitoringResult) {
      await this._variableMonitoringRepository.updateResultByStationId(
        message.context.tenantId,
        setMonitoringResultType,
        message.context.stationId,
      );
    }
  }

  @AsHandler(OCPPVersion.OCPP2_0_1, OCPP2_0_1_CallAction.ClearVariableMonitoring)
  protected async _handleClearVariableMonitoring(
    message: IMessage<OCPP2_0_1.ClearVariableMonitoringResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('ClearVariableMonitoring response received:', message, props);

    await this._monitoringService.processClearMonitoringResult(
      message.context.tenantId,
      message.context.stationId,
      message.payload.clearMonitoringResult,
    );
  }

  @AsHandler(OCPPVersion.OCPP2_0_1, OCPP2_0_1_CallAction.GetMonitoringReport)
  protected _handleGetMonitoringReport(
    message: IMessage<OCPP2_0_1.GetMonitoringReportResponse>,
    props?: HandlerProperties,
  ): void {
    this._logger.debug('GetMonitoringReport response received:', message, props);

    const status: OCPP2_0_1.GenericDeviceModelStatusEnumType = message.payload.status;
    const statusInfo: OCPP2_0_1.StatusInfoType | undefined | null = message.payload.statusInfo;

    if (
      status === OCPP2_0_1.GenericDeviceModelStatusEnumType.Rejected ||
      status === OCPP2_0_1.GenericDeviceModelStatusEnumType.NotSupported
    ) {
      this._logger.error(
        'Failed to get monitoring report.',
        status,
        statusInfo?.reasonCode,
        statusInfo?.additionalInfo,
      );
    }
  }

  @AsHandler(OCPPVersion.OCPP2_0_1, OCPP2_0_1_CallAction.SetMonitoringLevel)
  protected _handleSetMonitoringLevel(
    message: IMessage<OCPP2_0_1.SetMonitoringLevelResponse>,
    props?: HandlerProperties,
  ): void {
    this._logger.debug('SetMonitoringLevel response received:', message, props);

    const status: OCPP2_0_1.GenericStatusEnumType = message.payload.status;
    const statusInfo: OCPP2_0_1.StatusInfoType | undefined | null = message.payload.statusInfo;
    if (status === OCPP2_0_1.GenericStatusEnumType.Rejected) {
      this._logger.error(
        'Failed to set monitoring level.',
        status,
        statusInfo?.reasonCode,
        statusInfo?.additionalInfo,
      );
    }
  }

  @AsHandler(OCPPVersion.OCPP2_0_1, OCPP2_0_1_CallAction.SetMonitoringBase)
  protected async _handleSetMonitoringBase(
    message: IMessage<OCPP2_0_1.SetMonitoringBaseResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('SetMonitoringBase response received:', message, props);

    const status: OCPP2_0_1.GenericDeviceModelStatusEnumType = message.payload.status;
    const statusInfo: OCPP2_0_1.StatusInfoType | undefined | null = message.payload.statusInfo;

    if (
      status === OCPP2_0_1.GenericDeviceModelStatusEnumType.Rejected ||
      status === OCPP2_0_1.GenericDeviceModelStatusEnumType.NotSupported
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
        message.context.tenantId,
        OCPP2_0_1_CallAction.SetVariableMonitoring,
        stationId,
      );
      this._logger.debug('Rejected all variable monitorings on the charger', stationId);

      await this.sendCall(
        stationId,
        message.context.tenantId,
        OCPPVersion.OCPP2_0_1,
        OCPP2_0_1_CallAction.GetMonitoringReport,
        {
          requestId: await this._idGenerator.generateRequestId(
            message.context.tenantId,
            message.context.stationId,
            ChargingStationSequenceType.getMonitoringReport,
          ),
        } as OCPP2_0_1.GetMonitoringReportRequest,
      );
    }
  }

  @AsHandler(OCPPVersion.OCPP2_0_1, OCPP2_0_1_CallAction.GetVariables)
  protected async _handleGetVariables(
    message: IMessage<OCPP2_0_1.GetVariablesResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('GetVariables response received:', message, props);
    await this._deviceModelRepository.createOrUpdateByGetVariablesResultAndStationId(
      message.context.tenantId,
      message.payload.getVariableResult,
      message.context.stationId,
      message.context.timestamp,
    );
  }

  @AsHandler(OCPPVersion.OCPP2_0_1, OCPP2_0_1_CallAction.SetVariables)
  protected async _handleSetVariables(
    message: IMessage<OCPP2_0_1.SetVariablesResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('SetVariables response received:', message, props);

    for (const setVariableResultType of message.payload.setVariableResult) {
      await this._deviceModelRepository.updateResultByStationId(
        message.context.tenantId,
        setVariableResultType,
        message.context.stationId,
        message.context.timestamp,
      );
    }
  }
}
