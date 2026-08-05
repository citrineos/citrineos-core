// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { type AbstractHandler, type OcppModuleDependencies, AbstractModule } from '@citrineos/base';
import { EventGroup } from '@citrineos/types';

import type {
  IBootRepository,
  IChangeConfigurationRepository,
  IDeviceModelRepository,
  ILocationRepository,
  IMessageInfoRepository,
  IOCPPMessageRepository,
  ITenantRepository,
} from '@dal/interfaces/repositories.js';
import { IdGenerator } from '@util/index.js';

import type { BootNotificationService } from './BootNotificationService.js';
import type { DeviceModelService } from './DeviceModelService.js';
import type { NetworkProfileService } from './NetworkProfileService.js';

export interface ConfigurationModuleDependencies extends OcppModuleDependencies {
  bootRepository: IBootRepository;
  deviceModelRepository: IDeviceModelRepository;
  messageInfoRepository: IMessageInfoRepository;
  locationRepository: ILocationRepository;
  changeConfigurationRepository: IChangeConfigurationRepository;
  ocppMessageRepository: IOCPPMessageRepository;
  idGenerator: IdGenerator;
  tenantRepository: ITenantRepository;
  configurationDeviceModelService: DeviceModelService;
  networkProfileService: NetworkProfileService;
  bootNotificationService: BootNotificationService;
  configurationHandlers?: AbstractHandler[];
}

/**
 * Component that handles Configuration related messages.
 */
export class ConfigurationModule extends AbstractModule {
  public _deviceModelService: DeviceModelService;
  public networkProfileService: NetworkProfileService;
  protected _bootService: BootNotificationService;
  private _idGenerator: IdGenerator;

  constructor({
    config,
    cache,
    sender,
    handler,
    logger,
    ocppValidator,
    ocppSender,
    bootRepository,
    deviceModelRepository,
    messageInfoRepository,
    locationRepository,
    changeConfigurationRepository,
    ocppMessageRepository,
    idGenerator,
    tenantRepository,
    configurationDeviceModelService,
    networkProfileService,
    bootNotificationService,
    configurationHandlers,
  }: ConfigurationModuleDependencies) {
    super(
      config,
      cache,
      handler,
      sender,
      EventGroup.Configuration,
      ocppSender,
      logger,
      ocppValidator,
      configurationHandlers,
    );

    this._bootRepository = bootRepository;
    this._deviceModelRepository = deviceModelRepository;
    this._messageInfoRepository = messageInfoRepository;
    this._locationRepository = locationRepository;
    this._changeConfigurationRepository = changeConfigurationRepository;
    this._ocppMessageRepository = ocppMessageRepository;
    this._tenantRepository = tenantRepository;

    this._deviceModelService = configurationDeviceModelService;
    this.networkProfileService = networkProfileService;
    this._bootService = bootNotificationService;

    this._idGenerator = idGenerator;
  }

  protected _tenantRepository: ITenantRepository;

  get tenantRepository(): ITenantRepository {
    return this._tenantRepository;
  }

  protected _bootRepository: IBootRepository;

  get bootRepository(): IBootRepository {
    return this._bootRepository;
  }

  protected _deviceModelRepository: IDeviceModelRepository;

  get deviceModelRepository(): IDeviceModelRepository {
    return this._deviceModelRepository;
  }

  protected _messageInfoRepository: IMessageInfoRepository;

  get messageInfoRepository(): IMessageInfoRepository {
    return this._messageInfoRepository;
  }

  protected _locationRepository: ILocationRepository;

  get locationRepository(): ILocationRepository {
    return this._locationRepository;
  }

  protected _changeConfigurationRepository: IChangeConfigurationRepository;

  get changeConfigurationRepository(): IChangeConfigurationRepository {
    return this._changeConfigurationRepository;
  }

  protected _ocppMessageRepository: IOCPPMessageRepository;

  get ocppMessageRepository(): IOCPPMessageRepository {
    return this._ocppMessageRepository;
  }

  get idGenerator(): IdGenerator {
    return this._idGenerator;
  }
}

export default ConfigurationModule;
