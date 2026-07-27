// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { type AbstractHandler, type OcppModuleDependencies, AbstractModule } from '@citrineos/base';
import { EventGroup } from '@citrineos/types';
import type {
  IChargingProfileRepository,
  IDeviceModelRepository,
  ILocalAuthListRepository,
  IReservationRepository,
  ITransactionEventRepository,
} from '@dal/interfaces/repositories.js';

import type { LocalAuthListService } from './LocalAuthListService.js';

export interface EVDriverModuleDependencies extends OcppModuleDependencies {
  localAuthListRepository: ILocalAuthListRepository;
  deviceModelRepository: IDeviceModelRepository;
  transactionEventRepository: ITransactionEventRepository;
  chargingProfileRepository: IChargingProfileRepository;
  reservationRepository: IReservationRepository;
  localAuthListService: LocalAuthListService;
  evDriverHandlers?: AbstractHandler[];
}

/**
 * Component that handles provisioning related messages.
 */
export class EVDriverModule extends AbstractModule {
  /**
   * Fields
   */

  protected _localAuthListRepository: ILocalAuthListRepository;
  protected _deviceModelRepository: IDeviceModelRepository;
  protected _transactionEventRepository: ITransactionEventRepository;
  protected _chargingProfileRepository: IChargingProfileRepository;
  protected _reservationRepository: IReservationRepository;
  protected _localAuthListService: LocalAuthListService;

  constructor({
    config,
    cache,
    sender,
    handler,
    logger,
    ocppValidator,
    ocppSender,
    localAuthListRepository,
    deviceModelRepository,
    transactionEventRepository,
    chargingProfileRepository,
    reservationRepository,
    localAuthListService,
    evDriverHandlers,
  }: EVDriverModuleDependencies) {
    super(
      config,
      cache,
      handler,
      sender,
      EventGroup.EVDriver,
      ocppSender,
      logger,
      ocppValidator,
      evDriverHandlers,
    );

    this._localAuthListRepository = localAuthListRepository;
    this._deviceModelRepository = deviceModelRepository;
    this._transactionEventRepository = transactionEventRepository;
    this._chargingProfileRepository = chargingProfileRepository;
    this._reservationRepository = reservationRepository;
    this._localAuthListService = localAuthListService;
  }

  get localAuthListRepository(): ILocalAuthListRepository {
    return this._localAuthListRepository;
  }

  get deviceModelRepository(): IDeviceModelRepository {
    return this._deviceModelRepository;
  }

  get transactionEventRepository(): ITransactionEventRepository {
    return this._transactionEventRepository;
  }

  get chargingProfileRepository(): IChargingProfileRepository {
    return this._chargingProfileRepository;
  }

  get reservationRepository(): IReservationRepository {
    return this._reservationRepository;
  }

  get localAuthListService(): LocalAuthListService {
    return this._localAuthListService;
  }
}

export default EVDriverModule;
