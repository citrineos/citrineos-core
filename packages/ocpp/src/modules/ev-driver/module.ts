// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { type AbstractHandler, type OcppModuleDependencies, AbstractModule } from '@citrineos/base';
import { EventGroup } from '@citrineos/types';
import type {
  IChargingProfileRepository,
  ILocalListVersionRepository,
  IReservationRepository,
  ISendLocalListRepository,
} from '@citrineos/dal';

import type { LocalAuthListService } from './local-auth-list-service.js';

export interface EVDriverModuleDependencies extends OcppModuleDependencies {
  sendLocalListRepository: ISendLocalListRepository;
  localListVersionRepository: ILocalListVersionRepository;
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

  protected _sendLocalListRepository: ISendLocalListRepository;
  protected _localListVersionRepository: ILocalListVersionRepository;
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
    sendLocalListRepository,
    localListVersionRepository,
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

    this._sendLocalListRepository = sendLocalListRepository;
    this._localListVersionRepository = localListVersionRepository;
    this._chargingProfileRepository = chargingProfileRepository;
    this._reservationRepository = reservationRepository;
    this._localAuthListService = localAuthListService;
  }

  get sendLocalListRepository(): ISendLocalListRepository {
    return this._sendLocalListRepository;
  }

  get localListVersionRepository(): ILocalListVersionRepository {
    return this._localListVersionRepository;
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
