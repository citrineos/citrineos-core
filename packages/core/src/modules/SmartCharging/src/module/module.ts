// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { type AbstractHandler, type OcppModuleDependencies, AbstractModule } from '@citrineos/base';
import { EventGroup } from '@citrineos/types';
import type {
  IChargingProfileRepository,
  IDeviceModelRepository,
  ITransactionEventRepository,
} from '@dal/interfaces/repositories.js';

export interface SmartChargingModuleDependencies extends OcppModuleDependencies {
  transactionEventRepository: ITransactionEventRepository;
  deviceModelRepository: IDeviceModelRepository;
  chargingProfileRepository: IChargingProfileRepository;
  smartChargingHandlers?: AbstractHandler[];
}

/**
 * Component that handles provisioning related messages.
 */
export class SmartChargingModule extends AbstractModule {
  /**
   * Fields
   */

  protected _transactionEventRepository: ITransactionEventRepository;
  protected _deviceModelRepository: IDeviceModelRepository;
  protected _chargingProfileRepository: IChargingProfileRepository;

  constructor({
    config,
    cache,
    sender,
    handler,
    logger,
    ocppValidator,
    ocppSender,
    transactionEventRepository,
    deviceModelRepository,
    chargingProfileRepository,
    smartChargingHandlers,
  }: SmartChargingModuleDependencies) {
    super(
      config,
      cache,
      handler,
      sender,
      EventGroup.SmartCharging,
      ocppSender,
      logger,
      ocppValidator,
      smartChargingHandlers,
    );

    this._transactionEventRepository = transactionEventRepository;
    this._deviceModelRepository = deviceModelRepository;
    this._chargingProfileRepository = chargingProfileRepository;
  }

  get transactionEventRepository(): ITransactionEventRepository {
    return this._transactionEventRepository;
  }

  get deviceModelRepository(): IDeviceModelRepository {
    return this._deviceModelRepository;
  }

  get chargingProfileRepository(): IChargingProfileRepository {
    return this._chargingProfileRepository;
  }

  //TODO: 2.1 GetCompositeSchedule
  // We need to add a specific handler for 2.1 or we need to change how we do our mapping / create a mapper for 2.1
}

export default SmartChargingModule;
