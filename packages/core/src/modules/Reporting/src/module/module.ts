// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  AbstractHandler,
  AbstractModule,
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
  static readonly GET_BASE_REPORT_REQUEST_ID_MAX = 10000000; // 10,000,000

  /**
   * Fields
   */

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

    this._deviceModelService = reportingDeviceModelService;
  }

  get deviceModelService() {
    return this._deviceModelService;
  }
}

export default ReportingModule;
