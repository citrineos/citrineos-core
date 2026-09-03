// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { AbstractHandler, AbstractModule, type OcppModuleDependencies } from '@citrineos/base';
import { EventGroup } from '@citrineos/types';
import { type IDeviceModelRepository, type IVariableMonitoringRepository } from '@citrineos/dal';
import type { DeviceModelService } from '@/services/device-model/device-model-service.js';

export interface MonitoringModuleDependencies extends OcppModuleDependencies {
  deviceModelRepository: IDeviceModelRepository;
  variableMonitoringRepository: IVariableMonitoringRepository;
  deviceModelService: DeviceModelService;
  monitoringHandlers?: AbstractHandler[];
}

/**
 * Component that handles monitoring related messages.
 */
export class MonitoringModule extends AbstractModule {
  protected _deviceModelRepository: IDeviceModelRepository;
  protected _variableMonitoringRepository: IVariableMonitoringRepository;
  protected _deviceModelService: DeviceModelService;

  constructor({
    config,
    cache,
    sender,
    handler,
    logger,
    ocppValidator,
    ocppSender,
    deviceModelRepository,
    variableMonitoringRepository,
    deviceModelService,
    monitoringHandlers,
  }: MonitoringModuleDependencies) {
    super(
      config,
      cache,
      handler,
      sender,
      EventGroup.Monitoring,
      ocppSender,
      logger,
      ocppValidator,
      monitoringHandlers,
    );

    this._deviceModelRepository = deviceModelRepository;
    this._variableMonitoringRepository = variableMonitoringRepository;

    this._deviceModelService = deviceModelService;
  }

  get deviceModelRepository(): IDeviceModelRepository {
    return this._deviceModelRepository;
  }
  get variableMonitoringRepository(): IVariableMonitoringRepository {
    return this._variableMonitoringRepository;
  }
  get deviceModelService(): DeviceModelService {
    return this._deviceModelService;
  }
}

export default MonitoringModule;
