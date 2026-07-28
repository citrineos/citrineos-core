// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  AbstractHandler,
  AbstractModule,
  AsHandler,
  type CallAction,
  EventGroup,
  type HandlerProperties,
  type IMessage,
  OCPP1_6,
  OCPP_CallAction,
  type OcppModuleDependencies,
  OCPPVersion,
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
