// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type {
  CallAction,
  GenericDeviceModelStatusEnumType,
  HandlerProperties,
  IMessage,
  OcppModuleDependencies,
  OCPP2_common_types,
  OCPP2_request_types,
  OCPP2_response_types,
} from '@citrineos/base';
import {
  AbstractModule,
  AsHandler,
  ErrorCode,
  EventGroup,
  GenericDeviceModelStatusEnum,
  MutabilityEnum,
  Namespace,
  OCPP1_6,
  OCPP_2_VER_LIST,
  OCPP_CallAction,
  OcppError,
  OCPPVersion,
  SetVariableStatusEnum,
} from '@citrineos/base';

import type {
  IDeviceModelRepository,
  IOCPPMessageRepository,
  ISecurityEventRepository,
  IVariableMonitoringRepository,
} from '@dal/interfaces/repositories.js';
import { Component, Variable } from '@dal/layers/sequelize/model/DeviceModel/index.js';

import type { DeviceModelService } from './services.js';

export interface ReportingModuleDependencies extends OcppModuleDependencies {
  deviceModelRepository: IDeviceModelRepository;
  securityEventRepository: ISecurityEventRepository;
  variableMonitoringRepository: IVariableMonitoringRepository;
  ocppMessageRepository: IOCPPMessageRepository;
  reportingDeviceModelService: DeviceModelService;
}

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

  _requests: CallAction[] = [];

  _responses: CallAction[] = [];
  protected _securityEventRepository: ISecurityEventRepository;
  protected _variableMonitoringRepository: IVariableMonitoringRepository;
  protected _ocppMessageRepository: IOCPPMessageRepository;

  constructor({
    config,
    cache,
    sender,
    handler,
    logger,
    ocppValidator,
    deviceModelRepository,
    securityEventRepository,
    variableMonitoringRepository,
    ocppMessageRepository,
    reportingDeviceModelService,
  }: ReportingModuleDependencies) {
    super(config, cache, handler, sender, EventGroup.Reporting, logger, ocppValidator);

    this._requests = config.modules.reporting.requests;
    this._responses = config.modules.reporting.responses;

    this._deviceModelRepository = deviceModelRepository;
    this._securityEventRepository = securityEventRepository;
    this._variableMonitoringRepository = variableMonitoringRepository;
    this._ocppMessageRepository = ocppMessageRepository;
    this._deviceModelService = reportingDeviceModelService;
  }

  /**
   * Constructor
   */

  protected _deviceModelRepository: IDeviceModelRepository;

  get deviceModelRepository(): IDeviceModelRepository {
    return this._deviceModelRepository;
  }

  /**
   * Handle Requests
   */

  @AsHandler(OCPP_2_VER_LIST, OCPP_CallAction.LogStatusNotification)
  protected async _handleLogStatusNotification(
    message: IMessage<OCPP2_request_types.LogStatusNotificationRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('LogStatusNotification received:', message, props);

    // TODO: LogStatusNotification is usually triggered. Ideally, it should be sent to the callbackUrl from the message api that sent the trigger message

    // Validate requestId requirement
    // requestId is mandatory unless message was triggered by TriggerMessageRequest AND no log upload ongoing
    if (!message.payload.requestId) {
      await this.sendCallErrorWithMessage(
        message,
        new OcppError(
          message.context.correlationId,
          ErrorCode.OccurrenceConstraintViolation,
          'RequestId is required.',
        ),
      );
      return;
    }
    // Create response
    const response: OCPP2_response_types.LogStatusNotificationResponse = {};

    const messageConfirmation = await this.sendCallResultWithMessage(message, response);
    this._logger.debug('LogStatusNotification response sent: ', messageConfirmation);
  }

  @AsHandler(OCPP_2_VER_LIST, OCPP_CallAction.NotifyCustomerInformation)
  protected async _handleNotifyCustomerInformation(
    message: IMessage<OCPP2_request_types.NotifyCustomerInformationRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('NotifyCustomerInformation request received:', message, props);

    // Validate requestId was provided in a previous CustomerInformationRequest
    const requestId = message.payload.requestId;
    const previousRequest = await this._ocppMessageRepository.readAllByQuery(
      message.context.tenantId,
      {
        where: {
          tenantId: message.context.tenantId,
          ocppConnectionName: message.context.ocppConnectionName,
          action: OCPP_CallAction.CustomerInformation,
          message: {
            requestId: requestId,
          },
        },
        limit: 1,
      },
      Namespace.OCPPMessage,
    );

    if (!previousRequest || previousRequest.length === 0) {
      await this.sendCallErrorWithMessage(
        message,
        new OcppError(
          message.context.correlationId,
          ErrorCode.PropertyConstraintViolation,
          'RequestId was not provided in a CustomerInformationRequest.',
        ),
      );
      return;
    }

    // Create response
    const response: OCPP2_response_types.NotifyCustomerInformationResponse = {};

    const messageConfirmation = await this.sendCallResultWithMessage(message, response);
    this._logger.debug('NotifyCustomerInformation response sent: ', messageConfirmation);
  }

  @AsHandler(OCPP_2_VER_LIST, OCPP_CallAction.NotifyMonitoringReport)
  protected async _handleNotifyMonitoringReport(
    message: IMessage<OCPP2_request_types.NotifyMonitoringReportRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug(
      '${message.protocol} NotifyMonitoringReport request received:',
      message,
      props,
    );

    for (const monitorType of message.payload.monitor ? message.payload.monitor : []) {
      const ocppConnectionName: string = message.context.ocppConnectionName;
      const [component, variable] =
        await this._deviceModelRepository.findOrCreateEvseAndComponentAndVariable(
          message.context.tenantId,
          monitorType.component,
          monitorType.variable,
        );
      await this._variableMonitoringRepository.createOrUpdateByMonitoringDataTypeAndStationId(
        message.context.tenantId,
        monitorType,
        component ? component.id : null,
        variable ? variable.id : null,
        ocppConnectionName,
      );
    }

    // Create response
    const response: OCPP2_response_types.NotifyMonitoringReportResponse = {};

    const messageConfirmation = await this.sendCallResultWithMessage(message, response);
    this._logger.debug('NotifyMonitoringReport response sent: ', messageConfirmation);
  }

  @AsHandler(OCPP_2_VER_LIST, OCPP_CallAction.NotifyReport)
  protected async _handleNotifyReport(
    message: IMessage<OCPP2_request_types.NotifyReportRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.info('NotifyReport received:', message, props);
    const timestamp = message.payload.generatedAt;

    try {
      for (const reportDataType of message.payload.reportData ? message.payload.reportData : []) {
        // To keep consistency with VariableAttributeType defined in OCPP 2.0.1:
        // mutability: Default is ReadWrite when omitted.
        // if it is not present, we set it to ReadWrite
        for (let variableAttr of reportDataType.variableAttribute) {
          if (!variableAttr.mutability) {
            variableAttr = {
              ...variableAttr,
              mutability: MutabilityEnum.ReadWrite,
            } as OCPP2_common_types.VariableAttributeType;
          }
        }
        const variableAttributes =
          await this._deviceModelRepository.createOrUpdateDeviceModelByStationId(
            message.context.tenantId,
            reportDataType,
            message.context.ocppConnectionName,
            timestamp,
          );
        for (const variableAttribute of variableAttributes) {
          // Reload is necessary because in createOrUpdateDeviceModelByStationId does not do eager loading
          await variableAttribute.reload({
            include: [Component, Variable],
          });
          await this._deviceModelRepository.updateResultByStationId(
            message.context.tenantId,
            {
              attributeType: variableAttribute.type,
              attributeStatus: SetVariableStatusEnum.Accepted,
              attributeStatusInfo: { reasonCode: message.action },
              component: variableAttribute.component,
              variable: variableAttribute.variable,
            } as OCPP2_common_types.SetVariableResultType,
            message.context.ocppConnectionName,
            timestamp,
          );
        }
      }
    } catch (error) {
      if ((error as any).name === 'SequelizeForeignKeyConstraintError') {
        await this.sendCallErrorWithMessage(
          message,
          new OcppError(
            message.context.correlationId,
            ErrorCode.PropertyConstraintViolation,
            'Referenced entity does not exist.',
          ),
        );
        return;
      }
      throw error;
    }

    if (!message.payload.tbc) {
      // Default if omitted is false
      const success = await this._cache.set(
        message.payload.requestId.toString(),
        ReportingModule.GET_BASE_REPORT_COMPLETE_CACHE_VALUE,
        message.context.ocppConnectionName,
      );
      this._logger.info('Completed', success, message.payload.requestId);
    } else {
      // tbc (to be continued) is true
      // Continue to set get base report ongoing. Will extend the timeout.
      const success = await this._cache.set(
        message.payload.requestId.toString(),
        ReportingModule.GET_BASE_REPORT_ONGOING_CACHE_VALUE,
        message.context.ocppConnectionName,
        this.config.maxCachingSeconds,
      );
      this._logger.info('Ongoing', success, message.payload.requestId);
    }

    // Create response
    const response: OCPP2_response_types.NotifyReportResponse = {};

    await this.sendCallResultWithMessage(message, response);
    this._logger.debug('NotifyReport response sent:', message, props);
  }

  @AsHandler(OCPP_2_VER_LIST, OCPP_CallAction.SecurityEventNotification)
  protected async _handleSecurityEventNotification(
    message: IMessage<OCPP2_request_types.SecurityEventNotificationRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('SecurityEventNotification request received:', message, props);
    await this._securityEventRepository.createByStationId(
      message.context.tenantId,
      message.payload,
      message.context.ocppConnectionName,
    );
    await this.sendCallResultWithMessage(
      message,
      {} as OCPP2_response_types.SecurityEventNotificationResponse,
    );
  }

  /**
   * Handle responses
   */

  @AsHandler(OCPP_2_VER_LIST, OCPP_CallAction.GetBaseReport)
  protected _handleGetBaseReport(
    message: IMessage<OCPP2_response_types.GetBaseReportResponse>,
    props?: HandlerProperties,
  ): void {
    this._logger.debug('GetBaseReport response received:', message, props);
  }

  @AsHandler(OCPP_2_VER_LIST, OCPP_CallAction.GetReport)
  protected _handleGetReport(
    message: IMessage<OCPP2_response_types.GetReportResponse>,
    props?: HandlerProperties,
  ): void {
    this._logger.debug('GetReport response received:', message, props);

    const status: GenericDeviceModelStatusEnumType = message.payload.status;
    const statusInfo: OCPP2_common_types.StatusInfoType | undefined | null =
      message.payload.statusInfo;
    if (
      status === GenericDeviceModelStatusEnum.Rejected ||
      status === GenericDeviceModelStatusEnum.NotSupported
    ) {
      this._logger.error(
        'Failed to get report.',
        status,
        statusInfo?.reasonCode,
        statusInfo?.additionalInfo,
      );
    }
  }

  @AsHandler(OCPP_2_VER_LIST, OCPP_CallAction.GetMonitoringReport)
  protected async _handleGetMonitoringReport(
    message: IMessage<OCPP2_response_types.GetMonitoringReportResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('GetMonitoringReport response received:', message, props);

    const status: GenericDeviceModelStatusEnumType = message.payload.status;
    const statusInfo: OCPP2_common_types.StatusInfoType | undefined | null =
      message.payload.statusInfo;
    if (
      status === GenericDeviceModelStatusEnum.Rejected ||
      status === GenericDeviceModelStatusEnum.NotSupported
    ) {
      this._logger.error(
        'Failed to get monitoring report.',
        status,
        statusInfo?.reasonCode,
        statusInfo?.additionalInfo,
      );
    }
  }

  @AsHandler(OCPP_2_VER_LIST, OCPP_CallAction.GetLog)
  protected _handleGetLog(
    message: IMessage<OCPP2_response_types.GetLogResponse>,
    props?: HandlerProperties,
  ): void {
    this._logger.debug('GetLog response received:', message, props);
  }

  @AsHandler(OCPP_2_VER_LIST, OCPP_CallAction.CustomerInformation)
  protected _handleCustomerInformation(
    message: IMessage<OCPP2_response_types.CustomerInformationResponse>,
    props?: HandlerProperties,
  ): void {
    this._logger.debug('CustomerInformation response received:', message, props);
  }

  /**
   * OCPP 1.6 Handlers
   */

  @AsHandler([OCPPVersion.OCPP1_6], OCPP_CallAction.DiagnosticsStatusNotification)
  protected async _handleDiagnosticsStatusNotification(
    message: IMessage<OCPP1_6.DiagnosticsStatusNotificationRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('DiagnosticsStatusNotification received:', message, props);

    // Create response
    const response: OCPP1_6.DiagnosticsStatusNotificationResponse = {};

    const messageConfirmation = await this.sendCallResultWithMessage(message, response);
    this._logger.debug('DiagnosticsStatusNotification response sent: ', messageConfirmation);
  }

  @AsHandler([OCPPVersion.OCPP1_6], OCPP_CallAction.GetDiagnostics)
  protected _handleGetDiagnostics(
    message: IMessage<OCPP1_6.GetDiagnosticsResponse>,
    props?: HandlerProperties,
  ): void {
    this._logger.debug('GetDiagnostics response received:', message, props);
  }
}

export default ReportingModule;
