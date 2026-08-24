// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { AbstractHandler, AbstractModule, type OcppModuleDependencies } from '@citrineos/base';
import { EventGroup } from '@citrineos/types';

import type { DeviceModelService } from '@util/deviceModel/DeviceModelService.js';

export interface ReportingModuleDependencies extends OcppModuleDependencies {
  deviceModelService: DeviceModelService;
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
    deviceModelService,
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

    this._deviceModelService = deviceModelService;
  }

  get deviceModelService() {
    return this._deviceModelService;
  }
}

export default ReportingModule;
