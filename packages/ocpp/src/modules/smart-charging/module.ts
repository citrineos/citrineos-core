// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { type AbstractHandler, type OcppModuleDependencies, AbstractModule } from '@citrineos/base';
import { EventGroup } from '@citrineos/types';
import type { IChargingProfileRepository } from '@citrineos/dal';

export interface SmartChargingModuleDependencies extends OcppModuleDependencies {
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

  protected _chargingProfileRepository: IChargingProfileRepository;

  constructor({
    config,
    cache,
    sender,
    handler,
    logger,
    ocppValidator,
    ocppSender,
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

    this._chargingProfileRepository = chargingProfileRepository;
  }

  get chargingProfileRepository(): IChargingProfileRepository {
    return this._chargingProfileRepository;
  }
}

export default SmartChargingModule;
