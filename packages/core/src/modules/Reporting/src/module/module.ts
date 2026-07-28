// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  AbstractHandler,
  AbstractModule,
  AsHandler,
  type CallAction,
  EventGroup,
  GenericDeviceModelStatusEnum,
  type GenericDeviceModelStatusEnumType,
  type HandlerProperties,
  type IMessage,
  OCPP1_6,
  type OCPP2_common_types,
  type OCPP2_request_types,
  type OCPP2_response_types,
  OCPP_2_VER_LIST,
  OCPP_CallAction,
  type OcppModuleDependencies,
  OCPPVersion,
  SecurityEventNotificationTypeEnumSchema,
} from '@citrineos/base';

import type {
  IDeviceModelRepository,
  IOCPPMessageRepository,
  ISecurityEventRepository,
  IVariableMonitoringRepository,
} from '@dal/interfaces/repositories.js';

import type { DeviceModelService } from './services.js';

export interface ReportingModuleDependencies extends OcppModuleDependencies {
  deviceModelRepository: IDeviceModelRepository;
  securityEventRepository: ISecurityEventRepository;
  variableMonitoringRepository: IVariableMonitoringRepository;
  ocppMessageRepository: IOCPPMessageRepository;
  reportingDeviceModelService: DeviceModelService;
  reportingHandlers: AbstractHandler[];
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
    ocppSender,
    deviceModelRepository,
    securityEventRepository,
    variableMonitoringRepository,
    ocppMessageRepository,
    reportingDeviceModelService,
    reportingHandlers,
  }: ReportingModuleDependencies) {
    super(
      config,
      cache,
      handler,
      sender,
      EventGroup.Reporting,
      ocppSender,
      logger,
      ocppValidator,
      reportingHandlers,
    );

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

  @AsHandler(OCPP_2_VER_LIST, OCPP_CallAction.SecurityEventNotification)
  protected async _handleSecurityEventNotification(
    message: IMessage<OCPP2_request_types.SecurityEventNotificationRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('SecurityEventNotification request received:', message, props);

    // Warn if there is a mismatch against the standard security event list
    if (!SecurityEventNotificationTypeEnumSchema.safeParse(message.payload.type).success) {
      this._logger.warn(
        'SecurityEventNotification reported an unknown security event type',
        message.payload.type,
      );
    }

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
