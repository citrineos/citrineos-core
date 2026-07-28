// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  AbstractHandler,
  AbstractModule,
  type CallAction,
  EventGroup,
  type OcppModuleDependencies,
} from '@citrineos/base';

import type { DeviceModelService } from './services.js';

export interface ReportingModuleDependencies extends OcppModuleDependencies {
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

  /**
   * Fields
   */

  _requests: CallAction[] = [];

  _responses: CallAction[] = [];

  protected _deviceModelService: DeviceModelService;

  constructor({
    config,
    cache,
    sender,
    handler,
    logger,
    ocppValidator,
    ocppSender,
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

    this._deviceModelService = reportingDeviceModelService;
  }

  get deviceModelService() {
    return this._deviceModelService;
  }
}

export default ReportingModule;
